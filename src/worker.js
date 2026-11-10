const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const DICTIONARY_SCHEMA_VERSION = 1;
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS }); }

export default {
  async fetch(request, env) {
    const {pathname} = new URL(request.url);
    if (!pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (pathname.startsWith('/api/rooms/')) return routeRoom(request, env);
    if (pathname === '/api/import/document' && request.method === 'POST') {
      return json({error:'document_import_not_implemented'},501);
    }
    if (pathname.startsWith('/api/dictionary/') && !env.DB) return json({error:'d1_binding_missing'},503);
    if (pathname.startsWith('/api/dictionary/') && request.method !== 'GET') return json({error:'authenticated_dictionary_write_not_implemented'},501);
    if (pathname === '/api/dictionary/stats') {
      const [characters, words, categories, pending] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) c FROM characters WHERE enabled = 1').first(),
        env.DB.prepare('SELECT COUNT(*) c FROM words WHERE enabled = 1').first(),
        env.DB.prepare('SELECT COUNT(*) c FROM categories').first(),
        env.DB.prepare("SELECT COUNT(*) c FROM import_candidates WHERE review_status = 'pending'").first()
      ]);
      return json({schemaVersion:DICTIONARY_SCHEMA_VERSION,zhuyin:37,characters:characters.c,words:words.c,categories:categories.c,pending:pending.c});
    }
    if (pathname === '/api/dictionary/characters' || pathname === '/api/dictionary/words') {
      const table = pathname.endsWith('/characters') ? 'characters' : 'words';
      const rows = await env.DB.prepare(`SELECT * FROM ${table} ORDER BY updated_at DESC LIMIT 200`).all();
      return json({items:rows.results});
    }
    return json({error:'not_found'},404);
  }
};

// Private rooms are disabled unless the separate DO bindings and a parent secret are configured.
const ROOM_TTL = 60 * 60 * 1000,
  INVITE_TTL = 15 * 60 * 1000,
  SEAT_TTL = 60 * 1000,
  OFFER_TTL = 30 * 1000;
const ROOM_ID_RE = /^[A-Za-z0-9_-]{22}$/,
  TOKEN_RE = /^[A-Za-z0-9_-]{43}$/,
  SESSION_RE = /^[A-Za-z0-9_-]{22}$/;
const RIDE_TYPES = ['carousel', 'coaster', 'ferris', 'bumper', 'pirate', 'train'];
const HAIR = ['short', 'bob', 'tuft'],
  COLORS = ['#ee8f83', '#7cbad0', '#a591c4', '#e8b95e'],
  ACCESSORIES = ['none', 'bow', 'star'];
const DIRECTIONS = ['up', 'down', 'left', 'right'],
  ACTIONS = ['idle', 'walk', 'wave', 'joy'];
const ROOM_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store, private',
  'x-content-type-options': 'nosniff',
};
const roomJson = (value, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: ROOM_HEADERS });
const roomError = (code, status = 400) => roomJson({ error: code }, status);
const randomToken = (n = 32) => {
  const a = crypto.getRandomValues(new Uint8Array(n));
  return btoa(String.fromCharCode(...a))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};
const hash = async (text) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
const same = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let n = 0;
  for (let i = 0; i < a.length; i++) n |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return n === 0;
};
const exactKeys = (value, required, optional = []) =>
  value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  required.every((k) => Object.hasOwn(value, k)) &&
  Object.keys(value).every((k) => required.includes(k) || optional.includes(k));
async function jsonBody(req) {
  if (!(req.headers.get('content-type') || '').toLowerCase().startsWith('application/json'))
    throw new Error('content_type');
  if (Number(req.headers.get('content-length') || 0) > 2048 || !req.body)
    throw new Error('body_size');
  const reader = req.body.getReader();
  let total = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 2048) {
      await reader.cancel();
      throw new Error('body_size');
    }
    chunks.push(value);
  }
  const all = new Uint8Array(total);
  let n = 0;
  for (const c of chunks) {
    all.set(c, n);
    n += c.length;
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(all));
  } catch {
    throw new Error('invalid_json');
  }
}
async function checkGate(request, env, action) {
  // Only a keyed digest of the edge-supplied address is retained briefly; never log it.
  const ip = request.headers.get('cf-connecting-ip') || 'local-or-unknown';
  const key = await hash(env.ROOM_PARENT_KEY + '|' + ip);
  const stub = env.ROOM_LIMITS.get(env.ROOM_LIMITS.idFromName('room-gate'));
  const result = await stub.fetch('https://internal/rate', {
    method: 'POST',
    body: JSON.stringify({ key, action }),
  });
  return result.ok;
}
async function routeRoom(request, env) {
  const url = new URL(request.url);
  if (
    !env.ROOMS ||
    !env.ROOM_LIMITS ||
    typeof env.ROOM_PARENT_KEY !== 'string' ||
    env.ROOM_PARENT_KEY.length < 16
  )
    return roomError('rooms_unavailable', 503);
  if (request.headers.get('origin') !== url.origin || !['https:', 'http:'].includes(url.protocol))
    return roomError('origin_denied', 403);
  if (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    return roomError('https_required', 403);
  if (url.search) return roomError('invalid_path', 400);
  const socket = url.pathname.match(/^\/api\/rooms\/([A-Za-z0-9_-]{22})\/connect$/);
  if (socket) {
    if (request.method !== 'GET' || request.headers.get('upgrade')?.toLowerCase() !== 'websocket')
      return roomError('upgrade_required', 426);
    if (!(await checkGate(request, env, 'socket'))) return roomError('rate_limited', 429);
    return env.ROOMS.get(env.ROOMS.idFromName(socket[1])).fetch(
      new Request('https://internal/connect', request),
    );
  }
  const action = url.pathname.slice('/api/rooms/'.length);
  if (request.method !== 'POST' || !['create', 'join', 'status', 'leave'].includes(action))
    return roomError('not_found', 404);
  if (!(await checkGate(request, env, action))) return roomError('rate_limited', 429);
  let body;
  try {
    body = await jsonBody(request);
  } catch {
    return roomError('invalid_body');
  }
  if (action === 'create' || action === 'join') {
    if (
      !exactKeys(
        body,
        action === 'create' ? ['parentKey'] : ['parentKey', 'roomId', 'inviteToken'],
      ) ||
      typeof body.parentKey !== 'string' ||
      body.parentKey.length > 512
    )
      return roomError('invalid_body');
    if (!same(await hash(body.parentKey), await hash(env.ROOM_PARENT_KEY)))
      return roomError('unauthorized', 401);
    if (action === 'join' && (!ROOM_ID_RE.test(body.roomId) || !TOKEN_RE.test(body.inviteToken)))
      return roomError('invalid_body');
    const roomId = action === 'create' ? randomToken(16) : body.roomId;
    const stub = env.ROOMS.get(env.ROOMS.idFromName(roomId));
    return stub.fetch('https://internal/' + action, {
      method: 'POST',
      body: JSON.stringify({
        roomId,
        ...(action === 'join' ? { inviteToken: body.inviteToken } : {}),
      }),
    });
  }
  if (
    !exactKeys(body, ['roomId', 'sessionId', 'sessionToken']) ||
    !ROOM_ID_RE.test(body.roomId) ||
    !SESSION_RE.test(body.sessionId) ||
    !TOKEN_RE.test(body.sessionToken)
  )
    return roomError('invalid_body');
  return env.ROOMS.get(env.ROOMS.idFromName(body.roomId)).fetch('https://internal/' + action, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Short-lived per-address admission throttle; hashes, never raw addresses or credentials.
export class RoomRateLimiter {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async fetch(request) {
    return this.ctx.blockConcurrencyWhile(async () => {
      let data;
      try {
        data = await request.json();
      } catch {
        return roomError('invalid_body');
      }
      if (
        !/^[a-f0-9]{64}$/.test(data.key) ||
        !['socket', 'create', 'join', 'status', 'leave'].includes(data.action)
      )
        return roomError('invalid_body');
      const now = Date.now(),
        key = 'r:' + data.key,
        prior = await this.ctx.storage.get(key);
      const row = !prior || now - prior.start >= 60000 ? { start: now, count: 0 } : prior;
      row.count++;
      if (row.count > 60) return roomError('rate_limited', 429);
      await this.ctx.storage.put(key, row);
      if (!(await this.ctx.storage.getAlarm())) await this.ctx.storage.setAlarm(now + 65000);
      return roomJson({ ok: true });
    });
  }
  async alarm() {
    const all = await this.ctx.storage.list({ prefix: 'r:' });
    const now = Date.now();
    for (const [k, v] of all) if (now - v.start >= 60000) await this.ctx.storage.delete(k);
    if ((await this.ctx.storage.list({ prefix: 'r:', limit: 1 })).size)
      await this.ctx.storage.setAlarm(now + 65000);
  }
}

// SQLite-backed DO: room metadata is stored; each hibernating socket carries only a random seat ID and counters.
export class RoomObject {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async load() {
    return this.ctx.storage.get('room');
  }
  async save(room) {
    await this.ctx.storage.put('room', room);
  }
  async schedule(room) {
    let next = room.expiresAt;
    for (const p of Object.values(room.players))
      if (!p.connected) next = Math.min(next, p.expiresAt);
    if (room.ride)
      next = Math.min(
        next,
        room.ride.status === 'offered' ? room.ride.deadline : room.ride.startsAt + 45000,
      );
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment();
      if (a?.pending) next = Math.min(next, a.opened + 5000);
    }
    const old = await this.ctx.storage.getAlarm();
    if (!old || next < old) await this.ctx.storage.setAlarm(next);
  }
  sockets(id) {
    return this.ctx.getWebSockets().filter((ws) => {
      const a = ws.deserializeAttachment();
      return a && !a.pending && (!id || a.sessionId === id);
    });
  }
  send(ws, data) {
    try {
      ws.send(JSON.stringify(data));
    } catch {}
  }
  broadcast(room, event) {
    for (const ws of this.sockets()) this.send(ws, event || this.snapshot(room));
  }
  snapshot(room, type = 'snapshot', self) {
    const players = Object.values(room.players).map((p) => ({
      sessionId: p.sessionId,
      x: p.x,
      z: p.z,
      direction: p.direction,
      action: p.action,
      appearance: p.appearance,
      connected: p.connected,
    }));
    const ride = room.ride
      ? {
          rideId: room.ride.rideId,
          ride: room.ride.ride,
          hostId: room.ride.hostId,
          deadline: room.ride.deadline,
          participants: room.ride.participants,
          status: room.ride.status,
          startsAt: room.ride.startsAt || null,
        }
      : null;
    return {
      type,
      serverTime: Date.now(),
      players,
      locked: room.locked,
      ride,
      ...(self ? { selfId: self.sessionId, role: self.role } : {}),
    };
  }
  async expire(room) {
    const now = Date.now();
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment();
      if (a?.pending && now - a.opened >= 5000)
        try {
          ws.close(4003, 'auth timeout');
        } catch {}
    }
    if (room.expiresAt <= now) {
      await this.closeRoom(room, 'expired');
      return false;
    }
    let changed = false,
      lostSeat = false;
    for (const p of Object.values(room.players))
      if (
        p.connected &&
        !this.sockets(p.sessionId).some(
          (ws) =>
            ws.readyState === 1 && ws.deserializeAttachment()?.connectionId === p.connectionId,
        )
      ) {
        p.connected = false;
        p.expiresAt = now + SEAT_TTL;
        changed = true;
        lostSeat = true;
      }
    if (lostSeat && room.ride?.status === 'offered') {
      const rideId = room.ride.rideId;
      room.ride = null;
      this.broadcast(room, { type: 'ride_cancelled', rideId, reason: 'member disconnected' });
    }
    for (const p of Object.values(room.players))
      if (!p.connected && p.expiresAt <= now) {
        if (p.role === 'host') {
          await this.closeRoom(room, 'host expired');
          return false;
        }
        delete room.players[p.sessionId];
        changed = true;
      }
    if (
      room.ride &&
      (room.ride.status === 'offered'
        ? room.ride.deadline <= now
        : room.ride.startsAt + 45000 <= now)
    ) {
      const rideId = room.ride.rideId;
      room.ride = null;
      this.broadcast(room, { type: 'ride_cancelled', rideId, reason: 'timeout' });
      changed = true;
    }
    if (changed) {
      await this.save(room);
      this.broadcast(room);
    }
    return true;
  }
  async closeRoom(room, reason) {
    for (const ws of this.ctx.getWebSockets()) {
      this.send(ws, { type: 'room_closed', reason });
      try {
        ws.close(4000, 'room closed');
      } catch {}
    }
    await this.ctx.storage.deleteAll();
  }
  async alarm() {
    await this.ctx.blockConcurrencyWhile(async () => {
      const room = await this.load();
      if (room && (await this.expire(room))) await this.schedule(room);
    });
  }
  async fetch(request) {
    return this.ctx.blockConcurrencyWhile(async () => {
      const path = new URL(request.url).pathname;
      if (path === '/create') {
        if (await this.load()) return roomError('room_exists', 409);
        const body = await request.json(),
          now = Date.now(),
          sessionId = randomToken(16),
          sessionToken = randomToken(),
          inviteToken = randomToken();
        const player = {
          sessionId,
          tokenHash: await hash(sessionToken),
          role: 'host',
          seat: 0,
          connected: false,
          expiresAt: now + SEAT_TTL,
          x: 0.5,
          z: 0.5,
          direction: 'down',
          action: 'idle',
          appearance: { hair: 'short', color: COLORS[0], accessory: 'none' },
          lastMove: now,
        };
        const room = {
          roomId: body.roomId,
          inviteHash: await hash(inviteToken),
          inviteExpiresAt: now + INVITE_TTL,
          expiresAt: now + ROOM_TTL,
          locked: false,
          players: { [sessionId]: player },
          ride: null,
        };
        await this.save(room);
        await this.schedule(room);
        return roomJson({
          roomId: body.roomId,
          inviteToken,
          sessionId,
          sessionToken,
          role: 'host',
          expiresAt: room.expiresAt,
          inviteExpiresAt: room.inviteExpiresAt,
        });
      }
      const room = await this.load();
      if (!room || !(await this.expire(room))) return roomError('room_unavailable', 404);
      if (path === '/join') {
        const body = await request.json();
        const now = Date.now();
        if (
          room.locked ||
          now >= room.inviteExpiresAt ||
          !same(room.inviteHash, await hash(body.inviteToken))
        )
          return roomError('room_unavailable', 403);
        if (Object.keys(room.players).length >= 3) return roomError('room_full', 409);
        const sessionId = randomToken(16),
          sessionToken = randomToken();
        const seat = [1, 2].find((n) => !Object.values(room.players).some((p) => p.seat === n));
        room.players[sessionId] = {
          sessionId,
          tokenHash: await hash(sessionToken),
          role: 'guest',
          seat,
          connected: false,
          expiresAt: now + SEAT_TTL,
          x: 0.5,
          z: 0.5,
          direction: 'down',
          action: 'idle',
          appearance: { hair: 'short', color: COLORS[0], accessory: 'none' },
          lastMove: now,
        };
        await this.save(room);
        await this.schedule(room);
        return roomJson({
          roomId: room.roomId,
          sessionId,
          sessionToken,
          role: 'guest',
          expiresAt: room.expiresAt,
        });
      }
      if (path === '/connect') {
        if (this.ctx.getWebSockets().length >= 8) return roomError('connections_full', 429);
        const pair = new WebSocketPair(),
          client = pair[0],
          server = pair[1];
        this.ctx.acceptWebSocket(server);
        server.serializeAttachment({ pending: true, opened: Date.now() });
        await this.schedule(room);
        return new Response(null, {
          status: 101,
          webSocket: client,
          headers: { 'cache-control': 'no-store' },
        });
      }
      if (path === '/status' || path === '/leave') {
        const body = await request.json(),
          p = room.players[body.sessionId];
        if (!p || !same(p.tokenHash, await hash(body.sessionToken)))
          return roomError('unauthorized', 401);
        if (path === '/status') return roomJson(this.snapshot(room, 'welcome', p));
        if (p.role === 'host') {
          await this.closeRoom(room, 'host left');
          return roomJson({ ok: true });
        }
        delete room.players[p.sessionId];
        for (const ws of this.sockets(p.sessionId))
          try {
            ws.close(4000, 'left');
          } catch {}
        if (room.ride?.status === 'offered') {
          const rideId = room.ride.rideId;
          room.ride = null;
          this.broadcast(room, { type: 'ride_cancelled', rideId, reason: 'member left' });
        }
        await this.save(room);
        this.broadcast(room);
        return roomJson({ ok: true });
      }
      return roomError('not_found', 404);
    });
  }
  async webSocketMessage(ws, message) {
    return this.ctx.blockConcurrencyWhile(async () => {
      let a = ws.deserializeAttachment();
      if (!a) return;
      if (typeof message !== 'string' || new TextEncoder().encode(message).byteLength > 2048) {
        try {
          ws.close(4003, 'invalid message');
        } catch {}
        return;
      }
      let m;
      try {
        m = JSON.parse(message);
      } catch {
        try {
          ws.close(4003, 'invalid message');
        } catch {}
        return;
      }
      const room = await this.load();
      if (!room || !(await this.expire(room))) {
        try {
          ws.close(4000, 'room closed');
        } catch {}
        return;
      }
      const now = Date.now();
      if (a.pending) {
        if (
          now - a.opened >= 5000 ||
          !exactKeys(m, ['type', 'sessionId', 'sessionToken']) ||
          m.type !== 'auth' ||
          !SESSION_RE.test(m.sessionId) ||
          !TOKEN_RE.test(m.sessionToken)
        ) {
          try {
            ws.close(4003, 'auth failed');
          } catch {}
          return;
        }
        const p = room.players[m.sessionId];
        if (!p || !same(p.tokenHash, await hash(m.sessionToken))) {
          try {
            ws.close(4003, 'auth failed');
          } catch {}
          return;
        }
        for (const old of this.sockets(p.sessionId))
          if (old !== ws)
            try {
              old.close(4001, 'replaced');
            } catch {}
        a = {
          pending: false,
          sessionId: p.sessionId,
          connectionId: randomToken(16),
          window: now,
          count: 0,
          moveWindow: now,
          moveCount: 0,
        };
        ws.serializeAttachment(a);
        p.connected = true;
        p.connectionId = a.connectionId;
        p.expiresAt = room.expiresAt;
        p.lastMove = now;
        await this.save(room);
        this.send(ws, this.snapshot(room, 'welcome', p));
        this.broadcast(room);
        await this.schedule(room);
        return;
      }
      const p = room.players[a.sessionId];
      if (!p) {
        try {
          ws.close(4004, 'seat revoked');
        } catch {}
        return;
      }
      if (p.connectionId !== a.connectionId) {
        try {
          ws.close(4001, 'replaced');
        } catch {}
        return;
      }
      if (now - a.window >= 1000) {
        a.window = now;
        a.count = 0;
      }
      a.count++;
      if (a.count > 30) {
        try {
          ws.close(4008, 'rate limited');
        } catch {}
        return;
      }
      if (now - a.moveWindow >= 1000) {
        a.moveWindow = now;
        a.moveCount = 0;
      }
      if (m.type === 'move' || m.type === 'bumper_move') {
        a.moveCount++;
        if (a.moveCount > 15) {
          ws.serializeAttachment(a);
          return;
        }
      }
      ws.serializeAttachment(a);
      const invalid = () => this.send(ws, { type: 'error', code: 'invalid_message' });
      if (m.type === 'ping' && exactKeys(m, ['type'])) {
        this.send(ws, { type: 'pong', serverTime: now });
        return;
      }
      if (m.type === 'sync' && exactKeys(m, ['type'])) {
        this.send(ws, this.snapshot(room));
        return;
      }
      if (m.type === 'leave' && exactKeys(m, ['type'])) {
        if (p.role === 'host') {
          await this.closeRoom(room, 'host left');
          return;
        }
        delete room.players[p.sessionId];
        try {
          ws.close(4000, 'left');
        } catch {}
        if (room.ride?.status === 'offered') {
          const rideId = room.ride.rideId;
          room.ride = null;
          this.broadcast(room, { type: 'ride_cancelled', rideId, reason: 'member left' });
        }
        await this.save(room);
        this.broadcast(room);
        return;
      }
      if (
        m.type === 'appearance' &&
        exactKeys(m, ['type', 'appearance']) &&
        exactKeys(m.appearance, ['hair', 'color', 'accessory']) &&
        HAIR.includes(m.appearance.hair) &&
        COLORS.includes(m.appearance.color) &&
        ACCESSORIES.includes(m.appearance.accessory)
      ) {
        p.appearance = m.appearance;
        await this.save(room);
        this.broadcast(room);
        return;
      }
      if (m.type === 'plaza' && exactKeys(m, ['type'])) {
        if (
          (p.lastReset || 0) + 5000 > now ||
          (room.ride?.status === 'started' &&
            room.ride.participants.some((x) => x.sessionId === p.sessionId && !x.done))
        )
          return invalid();
        p.x = 0.5;
        p.z = 0.5;
        p.lastMove = now;
        p.lastReset = now;
        p.action = 'idle';
        await this.save(room);
        this.broadcast(room);
        return;
      }
      if (
        m.type === 'move' &&
        exactKeys(m, ['type', 'x', 'z', 'direction', 'action']) &&
        Number.isFinite(m.x) &&
        Number.isFinite(m.z) &&
        DIRECTIONS.includes(m.direction) &&
        ACTIONS.includes(m.action)
      ) {
        if (
          Math.abs(m.x) > 13.65 ||
          Math.abs(m.z) > 8.65 ||
          (room.ride?.status === 'started' &&
            room.ride.participants.some((x) => x.sessionId === p.sessionId && !x.done))
        )
          return invalid();
        const dt = Math.max(0, Math.min(1500, now - p.lastMove)) / 1000;
        const distance = Math.hypot(m.x - p.x, m.z - p.z),
          credit = Math.min(0.8, (p.motionCredit ?? 0.6) + 8 * dt);
        if (distance > credit) return invalid();
        // World 3D is derived from the same pure collision geometry used by the client.
        await import('../public/src/island-world-3d.js');
        const world = globalThis.IslandWorld3D,
          x0 = p.x * 40 + 600,
          y0 = p.z * 40 + 400,
          x1 = m.x * 40 + 600,
          y1 = m.z * 40 + 400;
        if (!world || !world.isWalkable(x1, y1)) return invalid();
        const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4));
        for (let i = 1; i <= steps; i++)
          if (!world.isWalkable(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps))
            return invalid();
        p.x = m.x;
        p.z = m.z;
        p.direction = m.direction;
        p.action = m.action;
        p.lastMove = now;
        p.motionCredit = credit - distance;
        await this.save(room);
        this.broadcast(room);
        return;
      }
      if (
        m.type === 'lock' &&
        exactKeys(m, ['type', 'locked']) &&
        typeof m.locked === 'boolean' &&
        p.role === 'host'
      ) {
        room.locked = m.locked;
        await this.save(room);
        this.broadcast(room);
        return;
      }
      if (
        m.type === 'kick' &&
        exactKeys(m, ['type', 'targetId']) &&
        p.role === 'host' &&
        SESSION_RE.test(m.targetId) &&
        m.targetId !== p.sessionId &&
        room.players[m.targetId]
      ) {
        delete room.players[m.targetId];
        for (const other of this.sockets(m.targetId))
          try {
            other.close(4004, 'kicked');
          } catch {}
        if (room.ride?.status === 'offered') {
          const rideId = room.ride.rideId;
          room.ride = null;
          this.broadcast(room, { type: 'ride_cancelled', rideId, reason: 'member removed' });
        }
        await this.save(room);
        this.broadcast(room);
        return;
      }
      if (m.type === 'close' && exactKeys(m, ['type']) && p.role === 'host') {
        await this.closeRoom(room, 'host closed');
        return;
      }
      if (
        m.type === 'ride_offer' &&
        exactKeys(m, ['type', 'ride']) &&
        p.role === 'host' &&
        RIDE_TYPES.includes(m.ride) &&
        !room.ride
      ) {
        room.ride = {
          rideId: randomToken(16),
          ride: m.ride,
          hostId: p.sessionId,
          deadline: now + OFFER_TTL,
          status: 'offered',
          participants: [{ sessionId: p.sessionId, ready: false }],
        };
        await this.save(room);
        await this.schedule(room);
        this.broadcast(room);
        return;
      }
      if (
        m.type === 'ride_ready' &&
        exactKeys(m, ['type', 'rideId', 'ready']) &&
        typeof m.ready === 'boolean' &&
        room.ride?.status === 'offered' &&
        m.rideId === room.ride.rideId
      ) {
        const list = room.ride.participants,
          existing = list.find((v) => v.sessionId === p.sessionId);
        if (p.role === 'host') {
          existing.ready = m.ready;
        } else if (m.ready && !existing) {
          list.push({ sessionId: p.sessionId, ready: true });
        } else if (existing && !m.ready) {
          room.ride.participants = list.filter((v) => v.sessionId !== p.sessionId);
        }
        room.ride.participants.sort(
          (a, b) => (room.players[a.sessionId]?.seat ?? 0) - (room.players[b.sessionId]?.seat ?? 0),
        );
        await this.save(room);
        this.broadcast(room);
        return;
      }
      if (
        m.type === 'ride_cancel' &&
        exactKeys(m, ['type', 'rideId']) &&
        p.role === 'host' &&
        room.ride?.status === 'offered' &&
        m.rideId === room.ride.rideId
      ) {
        const rideId = room.ride.rideId;
        room.ride = null;
        await this.save(room);
        this.broadcast(room, { type: 'ride_cancelled', rideId, reason: 'host cancelled' });
        this.broadcast(room);
        return;
      }
      if (
        m.type === 'ride_start' &&
        exactKeys(m, ['type', 'rideId']) &&
        p.role === 'host' &&
        room.ride?.status === 'offered' &&
        m.rideId === room.ride.rideId
      ) {
        const r = room.ride;
        if (
          r.deadline <= now ||
          r.participants.length < 2 ||
          r.participants.some((v) => !v.ready || !room.players[v.sessionId]?.connected)
        )
          return invalid();
        r.status = 'started';
        r.startsAt = now + 1000;
        r.participants.forEach((v, i) => {
          v.done = false;
          v.outcome = null;
          if (r.ride === 'bumper')
            room.players[v.sessionId].bumper = {
              x: [-0.4, 0, 0.4][i],
              z: 0,
              at: now,
              credit: 0.15,
            };
        });
        await this.save(room);
        await this.schedule(room);
        this.broadcast(room, {
          type: 'ride_started',
          rideId: r.rideId,
          ride: r.ride,
          participants: r.participants.map((v) => v.sessionId),
          startsAt: r.startsAt,
          serverTime: now,
        });
        this.broadcast(room);
        return;
      }
      if (
        m.type === 'ride_done' &&
        exactKeys(m, ['type', 'rideId'], ['exitId']) &&
        room.ride?.status === 'started' &&
        m.rideId === room.ride.rideId
      ) {
        const member = room.ride.participants.find((v) => v.sessionId === p.sessionId);
        if (!member) return invalid();
        if (member.done) {
          if (member.outcome === 'done' && m.exitId === undefined) {
            this.send(ws, this.snapshot(room));
            return;
          }
          return invalid();
        }
        const exits = {
          plaza: { x: 0.5, z: 0.5 },
          village: { x: -9.5, z: -2.5 },
          garden: { x: 10.5, z: 1.5 },
        };
        if (
          m.exitId !== undefined &&
          (room.ride.ride !== 'train' || !Object.hasOwn(exits, m.exitId) || member.done)
        )
          return invalid();
        if (m.exitId !== undefined) {
          p.x = exits[m.exitId].x;
          p.z = exits[m.exitId].z;
          p.action = 'idle';
          p.lastMove = now;
        }
        member.done = true;
        member.outcome = 'done';
        if (room.ride.participants.every((v) => v.done)) {
          const rideId = room.ride.rideId,
            participants = room.ride.participants.map(({ sessionId, outcome }) => ({
              sessionId,
              outcome,
            }));
          room.ride = null;
          await this.save(room);
          this.broadcast(room, { type: 'ride_ended', rideId, participants });
          this.broadcast(room);
          return;
        }
        await this.save(room);
        this.broadcast(room);
        return;
      }
      if (
        m.type === 'ride_abort' &&
        exactKeys(m, ['type', 'rideId']) &&
        room.ride &&
        m.rideId === room.ride.rideId
      ) {
        const r = room.ride,
          member = r.participants.find((v) => v.sessionId === p.sessionId);
        if (!member) return invalid();
        if (r.status === 'offered') {
          if (p.role === 'host') {
            room.ride = null;
            await this.save(room);
            this.broadcast(room, {
              type: 'ride_cancelled',
              rideId: m.rideId,
              reason: 'host cancelled',
            });
            this.broadcast(room);
            return;
          }
          r.participants = r.participants.filter((v) => v.sessionId !== p.sessionId);
          await this.save(room);
          this.broadcast(room, {
            type: 'ride_member_aborted',
            rideId: m.rideId,
            sessionId: p.sessionId,
          });
          this.broadcast(room);
          return;
        }
        if (r.status !== 'started' || member.done) return invalid();
        member.done = true;
        member.outcome = 'aborted';
        if (r.participants.every((v) => v.done)) {
          const participants = r.participants.map(({ sessionId, outcome }) => ({
            sessionId,
            outcome,
          }));
          room.ride = null;
          await this.save(room);
          this.broadcast(room, {
            type: 'ride_member_aborted',
            rideId: m.rideId,
            sessionId: p.sessionId,
          });
          this.broadcast(room, { type: 'ride_ended', rideId: m.rideId, participants });
          this.broadcast(room);
          return;
        }
        await this.save(room);
        this.broadcast(room, {
          type: 'ride_member_aborted',
          rideId: m.rideId,
          sessionId: p.sessionId,
        });
        this.broadcast(room);
        return;
      }
      if (
        m.type === 'bumper_move' &&
        exactKeys(m, ['type', 'rideId', 'x', 'z']) &&
        room.ride?.status === 'started' &&
        room.ride.ride === 'bumper' &&
        m.rideId === room.ride.rideId &&
        room.ride.participants.some((v) => v.sessionId === p.sessionId && !v.done) &&
        Number.isFinite(m.x) &&
        Number.isFinite(m.z) &&
        Math.abs(m.x) <= 1 &&
        Math.abs(m.z) <= 1
      ) {
        const b = p.bumper || { x: 0, z: 0, at: now, credit: 0.15 };
        const distance = Math.hypot(m.x - b.x, m.z - b.z),
          credit = Math.min(
            0.25,
            (b.credit ?? 0.15) + (Math.min(1500, Math.max(0, now - b.at)) / 1000) * 1.5,
          );
        if (distance > credit) return invalid();
        p.bumper = { x: m.x, z: m.z, at: now, credit: credit - distance };
        await this.save(room);
        this.broadcast(room, {
          type: 'bumper_state',
          rideId: m.rideId,
          sessionId: p.sessionId,
          x: m.x,
          z: m.z,
        });
        return;
      }
      invalid();
    });
  }
  async webSocketClose(ws) {
    return this.ctx.blockConcurrencyWhile(async () => {
      const a = ws.deserializeAttachment(),
        room = await this.load();
      if (!a || a.pending || !room) return;
      const p = room.players[a.sessionId];
      if (!p || p.connectionId !== a.connectionId) return;
      const other = this.sockets(a.sessionId).some((s) => s !== ws && s.readyState === 1);
      if (other) return;
      p.connected = false;
      p.expiresAt = Date.now() + SEAT_TTL;
      if (room.ride?.status === 'offered') {
        const rideId = room.ride.rideId;
        room.ride = null;
        this.broadcast(room, { type: 'ride_cancelled', rideId, reason: 'member disconnected' });
      }
      await this.save(room);
      this.broadcast(room);
      await this.schedule(room);
    });
  }
  async webSocketError(ws) {
    try {
      ws.close(1011, 'connection error');
    } catch {}
    await this.webSocketClose(ws);
  }
}
