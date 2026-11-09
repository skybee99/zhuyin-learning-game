/* Original, local SVG exploration layer. IslandWorld supplies collision and routing. */
(function (global) {
  "use strict";
  const KEY = "zhuyin-island-explore-v1-",
    COLORS = ["#ee8f83", "#7cbad0", "#a591c4", "#e8b95e"],
    HAIR = ["short", "bob", "tuft"],
    HATS = ["none", "bow", "star"];
  const NAMES = {
    short: "短髮",
    bob: "圓圓髮",
    tuft: "翹翹髮",
    none: "沒有裝飾",
    bow: "蝴蝶結",
    star: "星星",
  };
  const NPC_COPY = {
    rabbit: "我是小兔，一起來看看注音卡吧！",
    owl: "我是貓頭鷹，我們一起認識注音。",
    fox: "我是小狐狸，來和我拼一拼！",
    panda: "我是小熊貓，我們一起看圖認字。",
    dog: "嗨！沿著小路走，去看看島上的朋友吧。",
  };
  let session = null;
  const query = (s, root) => root.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const validId = (id) => typeof id === "string" && /^child-[1-3]$/.test(id);
  function defaults() {
    return {
      version: 1,
      position: { x: 620, y: 420 },
      facing: "down",
      appearance: { hair: "short", color: COLORS[0], accessory: "none" },
    };
  }
  function read(id) {
    let raw, data;
    try {
      raw = localStorage.getItem(KEY + id);
      if (raw === null)
        return { data: defaults(), original: defaults(), readOnly: false };
      data = JSON.parse(raw);
    } catch (_) {
      return { data: defaults(), readOnly: true };
    }
    const p = data?.position,
      a = data?.appearance;
    if (
      !data ||
      Array.isArray(data) ||
      data.version !== 1 ||
      !p ||
      !Number.isFinite(p.x) ||
      !Number.isFinite(p.y) ||
      !["up", "down", "left", "right"].includes(data.facing) ||
      !a ||
      !HAIR.includes(a.hair) ||
      !COLORS.includes(a.color) ||
      !HATS.includes(a.accessory)
    ) {
      return { data: defaults(), readOnly: true };
    }
    return {
      data: {
        version: 1,
        position: { x: p.x, y: p.y },
        facing: data.facing,
        appearance: { hair: a.hair, color: a.color, accessory: a.accessory },
      },
      original: data,
      readOnly: false,
    };
  }
  function snapshot(id) {
    if (!validId(id)) return null;
    const stored = read(id);
    if (stored.readOnly || (session?.id === id && session.readOnly))
      return { status: "unavailable", readOnly: true };
    const d = stored.data;
    if (session?.id === id) {
      if (session.dirtyPosition) {
        d.position = session.data.position;
        d.facing = session.data.facing;
      }
      if (session.dirtyAppearance) d.appearance = session.data.appearance;
    }
    return JSON.parse(JSON.stringify(d));
  }
  function save(s) {
    if (!s || !validId(s.id) || (!s.dirtyPosition && !s.dirtyAppearance))
      return;
    const latest = read(s.id);
    if (s.readOnly || latest.readOnly) {
      s.readOnly = true;
      announce(s, "原有探索資料無法讀取，已保留原始資料；本次使用暫時狀態。");
      return;
    }
    try {
      const merged = { ...latest.original };
      if (s.dirtyPosition) {
        merged.position = { ...latest.original.position, ...s.data.position };
        merged.facing = s.data.facing;
      }
      if (s.dirtyAppearance)
        merged.appearance = {
          ...latest.original.appearance,
          ...s.data.appearance,
        };
      localStorage.setItem(KEY + s.id, JSON.stringify(merged));
      s.unsaved = false;
      s.dirty = false;
      s.dirtyPosition = false;
      s.dirtyAppearance = false;
    } catch (_) {
      s.unsaved = true;
      const a = query(".explore-notice", s.root);
      if (a)
        a.textContent = "裝置儲存空間無法使用，這次的位置與外觀可能無法保存。";
    }
  }
  function avatarSvg(a, pose = "idle") {
    const hair =
      a.hair === "bob"
        ? '<path d="M18 30 Q16 5 40 5 Q64 5 62 30 L62 49 Q55 52 52 44 H28 Q25 52 18 49Z" fill="#524047"/>'
        : a.hair === "tuft"
          ? '<path d="M18 31 Q17 8 36 9 Q40 1 45 5 L46 10 Q64 10 62 31 Q54 21 40 20 Q27 22 18 31Z" fill="#524047"/>'
          : '<path d="M18 31 Q16 7 40 7 Q64 7 62 31 Q53 23 40 22 Q27 23 18 31Z" fill="#524047"/>';
    const hat =
      a.accessory === "bow"
        ? '<path d="M48 12 Q58 1 60 13 Q58 22 48 16 Q42 21 41 13 Q42 7 48 12Z" fill="#f58fa2"/>'
        : a.accessory === "star"
          ? '<path d="M51 5 l3 6 6 1 -5 5 1 7 -5 -3 -6 3 1 -7 -5 -5 7 -1Z" fill="#ffdb61"/>'
          : "";
    return `<svg class="avatar-svg pose-${pose === "wave" ? "wave" : pose === "ride" ? "ride" : "idle"}" viewBox="0 0 80 108" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="我的人偶"><g class="avatar-shadow"><ellipse cx="40" cy="103" rx="23" ry="4" fill="#426e5240"/></g><g class="avatar-leg leg-left"><rect x="28" y="82" width="10" height="18" rx="5" fill="#574e61"/><ellipse cx="32" cy="100" rx="8" ry="4" fill="#564652"/></g><g class="avatar-leg leg-right"><rect x="42" y="82" width="10" height="18" rx="5" fill="#574e61"/><ellipse cx="48" cy="100" rx="8" ry="4" fill="#564652"/></g><g class="avatar-arm arm-left"><path d="M25 57 Q14 58 14 72 Q15 78 21 76 L30 66Z" fill="#f5cba9"/></g><g class="avatar-arm arm-right"><path d="M55 57 Q66 58 66 72 Q65 78 59 76 L50 66Z" fill="#f5cba9"/></g><path d="M28 52 Q40 47 52 52 L57 82 Q40 91 23 82Z" fill="${a.color}" stroke="#ffffff88" stroke-width="2"/><circle cx="40" cy="29" r="23" fill="#f7d2b2"/>${hair}<path d="M20 31 Q22 18 30 17 Q40 26 59 26 L60 31 Q60 50 40 51 Q20 50 20 31Z" fill="#f7d2b2"/><g class="avatar-face"><circle cx="32" cy="34" r="2.2" fill="#4c3f43"/><circle cx="48" cy="34" r="2.2" fill="#4c3f43"/><path d="M35 42 Q40 46 45 42" fill="none" stroke="#a25e5b" stroke-width="2" stroke-linecap="round"/><circle cx="26" cy="40" r="3" fill="#ec9a9a" opacity=".5"/><circle cx="54" cy="40" r="3" fill="#ec9a9a" opacity=".5"/></g>${hat}</svg>`;
  }
  function rideAvatar(id, pose) {
    return avatarSvg(
      snapshot(id)?.appearance || defaults().appearance,
      pose || "ride",
    );
  }
  function npcSvg(id) {
    const color =
      {
        rabbit: "#f4eadf",
        owl: "#bf967b",
        fox: "#e4a26d",
        panda: "#f8f5eb",
        dog: "#d7ad81",
      }[id] || "#f4eadf";
    let ears =
      id === "rabbit"
        ? '<ellipse cx="26" cy="15" rx="7" ry="17"/><ellipse cx="54" cy="15" rx="7" ry="17"/>'
        : id === "fox"
          ? '<path d="M12 31 L16 7 L33 22 M68 31 L64 7 L47 22"/>'
          : '<circle cx="19" cy="23" r="11"/><circle cx="61" cy="23" r="11"/>';
    return `<svg viewBox="0 0 80 86" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="${color}" stroke="#a67d69" stroke-width="2">${ears}<ellipse cx="40" cy="62" rx="23" ry="19"/><circle cx="40" cy="38" r="27"/></g>${id === "panda" ? '<ellipse cx="28" cy="38" rx="9" ry="11" fill="#554d52"/><ellipse cx="52" cy="38" rx="9" ry="11" fill="#554d52"/>' : ""}<circle cx="30" cy="38" r="2.5" fill="#443f40"/><circle cx="50" cy="38" r="2.5" fill="#443f40"/><ellipse cx="40" cy="47" rx="4" ry="3" fill="#8a6260"/><path d="M35 52 Q40 56 45 52" fill="none" stroke="#8a6260" stroke-width="2" stroke-linecap="round"/></svg>`;
  }
  function reduced(s) {
    return (
      !!s.opts.getSettings?.()?.reducedMotion ||
      !!global.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    );
  }
  function html(s) {
    return `<div class="explore-top"><div><span class="explore-kicker">A LITTLE ISLAND ADVENTURE</span><h3>一起走走吧！</h3><p>用方向鍵、搖桿或點地圖移動，靠近朋友和地點後互動。</p></div><div class="explore-tools"><button type="button" data-explore-reset>⌂ 回到廣場</button><button type="button" data-explore-wardrobe aria-expanded="false">✿ 人偶裝扮</button><button type="button" data-explore-stick-toggle aria-pressed="true">◉ 隱藏搖桿</button></div></div><div class="explore-wardrobe" hidden><label>髮型 <select data-appearance="hair">${HAIR.map((x) => `<option value="${x}">${NAMES[x]}</option>`).join("")}</select></label><label>衣服顏色 <select data-appearance="color">${COLORS.map((x, i) => `<option value="${x}">${["珊瑚粉", "天空藍", "薰衣草紫", "陽光黃"][i]}</option>`).join("")}</select></label><label>裝飾 <select data-appearance="accessory">${HATS.map((x) => `<option value="${x}">${NAMES[x]}</option>`).join("")}</select></label></div><div class="explore-viewport" tabindex="0" aria-label="自由探索地圖，方向鍵或 WASD 移動，Enter 與附近朋友或地點互動"><div class="explore-world"><div class="explore-ground"></div><div class="explore-path path-horizontal"></div><div class="explore-path path-vertical"></div><div class="explore-plaza"><div>✿</div><span>中央廣場</span></div><div class="explore-objects"></div><div class="explore-npcs"></div><div class="explore-player" data-facing="down" data-moving="false">${avatarSvg(s.data.appearance)}</div><div class="explore-marker" hidden>✦</div></div><div class="explore-stick" aria-label="移動搖桿"><div class="explore-stick-knob"></div></div><div class="explore-near" hidden><span class="explore-near-label"></span><button type="button" class="explore-interact">互動</button></div><div class="explore-dialog" data-explore-dialog hidden role="dialog" aria-label="動物朋友的話"><strong></strong><p></p><div><button type="button" data-dialog-speak>🔊 聽一聽</button><button type="button" data-dialog-enter>一起去學習</button><button type="button" data-dialog-close>再逛逛</button></div></div></div><p class="explore-notice" aria-live="polite">走近地點，就可以互動。角色位置與裝扮保存在這台裝置。</p>`;
  }
  function makeObjects(s) {
    const container = query(".explore-objects", s.root);
    const icons = {
      village:
        '<span class="object-roof"></span><span class="object-window"></span><span class="object-door"></span>',
      carousel:
        '<span class="object-canopy"></span><span class="object-ride">🐎</span>',
      coaster:
        '<span class="object-rail">⌁</span><span class="object-ride">🚃</span>',
      garden: '<span class="object-flowers">🌷　🌼　🌷</span>',
      pond: '<span class="object-pond">〰</span>',
      "tree-a": '<span class="object-tree">●</span>',
      "tree-b": '<span class="object-tree">●</span>',
      "tree-c": '<span class="object-tree">●</span>',
    };
    for (const o of s.world.obstacles) {
      const el = document.createElement("div");
      el.className = "explore-object object-" + o.id;
      el.style.cssText = `left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px;z-index:${Math.round(o.y + o.h)};`;
      el.innerHTML = icons[o.id] || "";
      const entry = s.world.entrances.find(
        (e) => e.id === o.id || e.objectId === o.id,
      );
      if (entry) {
        el.setAttribute("data-object", entry.id);
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.setAttribute("aria-label", "前往" + entry.label);
        el.innerHTML += `<span class="object-label">${entry.label}</span>`;
      } else el.setAttribute("aria-hidden", "true");
      container.append(el);
    }
    for (const e of s.world.entrances) {
      const el = document.createElement("div");
      el.className = "explore-entrance";
      el.dataset.entrance = e.id;
      el.style.cssText = `left:${e.x}px;top:${e.y}px;`;
      el.textContent = "↟";
      container.append(el);
    }
  }
  function renderNpcs(s) {
    const wrap = query(".explore-npcs", s.root);
    s.npcs = (s.world.npcWaypoints || []).map((n) => {
      const pts = n.waypoints || n.points || [];
      return {
        ...n,
        points: pts,
        pos: { ...(pts[0] || s.world.spawn) },
        next: 1,
        walking: false,
        el: null,
      };
    });
    for (const n of s.npcs) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "explore-npc";
      el.dataset.npc = n.id;
      el.setAttribute("aria-label", "和" + n.label + "說話");
      el.innerHTML = `${npcSvg(n.id)}<span>${n.label}</span>`;
      wrap.append(el);
      n.el = el;
      placeNpc(n);
    }
  }
  function placeNpc(n) {
    n.el.dataset.moving = String(!!n.walking);
    n.el.dataset.x = n.pos.x.toFixed(1);
    n.el.dataset.y = n.pos.y.toFixed(1);
    n.el.style.transform = `translate(${n.pos.x - 32}px,${n.pos.y - 72}px)`;
    n.el.style.zIndex = Math.round(n.pos.y);
  }
  function camera(s) {
    const v = s.viewport;
    const scale = clamp(v.clientWidth / 700, 0.7, 1);
    const vw = v.clientWidth / scale,
      vh = v.clientHeight / scale;
    s.scale = scale;
    s.camX = clamp(s.data.position.x - vw / 2, 0, Math.max(0, 1200 - vw));
    s.camY = clamp(s.data.position.y - vh / 2, 0, Math.max(0, 800 - vh));
    s.plane.style.transform = `translate(${-s.camX * scale}px,${-s.camY * scale}px) scale(${scale})`;
  }
  function draw(s) {
    const p = s.data.position,
      el = s.player;
    el.style.transform = `translate(${p.x - 40}px,${p.y - 100}px)`;
    el.style.zIndex = Math.round(p.y);
    el.dataset.x = p.x.toFixed(1);
    el.dataset.y = p.y.toFixed(1);
    el.dataset.facing = s.data.facing;
    el.dataset.moving = String(s.moving);
    camera(s);
    near(s);
  }
  function near(s) {
    if (s.dialog) return;
    const p = s.data.position;
    let nearest = null,
      dist = Infinity;
    for (const e of s.world.entrances) {
      const d = Math.hypot(p.x - e.x, p.y - e.y);
      if (d < 70 && d < dist) {
        nearest = { kind: "entrance", item: e };
        dist = d;
      }
    }
    for (const n of s.npcs) {
      const d = Math.hypot(p.x - n.pos.x, p.y - n.pos.y);
      if (d < 75 && d < dist) {
        nearest = { kind: "npc", item: n };
        dist = d;
      }
    }
    s.nearest = nearest;
    const box = query(".explore-near", s.root);
    box.hidden = !nearest;
    if (nearest) {
      query(".explore-near-label", box).textContent =
        nearest.kind === "npc"
          ? "和" + nearest.item.label + "說話"
          : nearest.item.label +
            (nearest.item.id === "carousel" || nearest.item.id === "coaster"
              ? " · 🎟️ 1 張"
              : "");
      query(".explore-interact", box).textContent =
        nearest.kind === "npc" ? "打招呼" : "前往";
    }
  }
  function announce(s, text) {
    query(".explore-notice", s.root).textContent = s.readOnly
      ? text + " 原有探索資料無法讀取，已保留原始資料；本次使用暫時狀態。"
      : text;
  }
  function interact(s) {
    const n = s.nearest;
    if (!n) return;
    if (n.kind === "npc") {
      openDialog(s, n.item);
      return;
    }
    save(s);
    const e = n.item;
    if (e.id === "carousel" || e.id === "coaster") {
      s.opts.ride?.(e.id);
      return;
    }
    s.opts.navigate?.(e.view);
  }
  function openDialog(s, n) {
    n.walking = false;
    placeNpc(n);
    s.path = [];
    s.direction = { x: 0, y: 0 };
    s.moving = false;
    s.dialog = n;
    const box = query(".explore-dialog", s.root);
    query("strong", box).textContent = n.label;
    query("p", box).textContent = NPC_COPY[n.id] || "一起在島上走走吧！";
    const enter = query("[data-dialog-enter]", box);
    enter.hidden = !n.view;
    box.hidden = false;
    s.player.classList.add("is-wave", "is-interact");
    setTimeout(
      () => s.player?.classList.remove("is-wave", "is-interact"),
      1000,
    );
    draw(s);
    query("[data-dialog-close]", box).focus();
  }
  function closeDialog(s) {
    s.opts.stopSpeech?.();
    s.dialog = null;
    query(".explore-dialog", s.root).hidden = true;
    s.viewport.focus({ preventScroll: true });
    draw(s);
  }
  function setDestination(s, point, npc) {
    const target = s.world.safePosition(point);
    const path = s.world.findPath(s.data.position, target);
    if (
      !path.length &&
      Math.hypot(s.data.position.x - target.x, s.data.position.y - target.y) >
        35
    ) {
      announce(s, "這裡走不過去，試試另一個地方。");
      return;
    }
    if (!path.length) {
      query(".explore-marker", s.root).hidden = true;
      if (npc) openDialog(s, npc);
      else announce(s, "已經到達這裡了。");
      return;
    }
    s.path = path;
    s.targetNpc = npc || null;
    s.direction = { x: 0, y: 0 };
    const marker = query(".explore-marker", s.root);
    marker.style.left = target.x + "px";
    marker.style.top = target.y + "px";
    marker.hidden = false;
    announce(s, "正在走向目的地。");
    requestTick(s);
  }
  function scheduleNpcs(s) {
    clearTimeout(s.npcTimer);
    if (reduced(s) || document.hidden || session !== s) return;
    s.npcTimer = setTimeout(() => {
      if (session !== s || document.hidden) return;
      for (const n of s.npcs) {
        if (
          n.points.length > 1 &&
          n !== s.dialog &&
          n !== s.targetNpc &&
          Math.hypot(n.pos.x - s.data.position.x, n.pos.y - s.data.position.y) >
            135
        ) {
          n.target = n.points[n.next % n.points.length];
          n.next++;
          n.walking = true;
        }
      }
      requestTick(s);
      scheduleNpcs(s);
    }, 5000);
  }
  function requestTick(s) {
    if (!s.raf && !document.hidden)
      s.raf = requestAnimationFrame((t) => tick(s, t));
  }
  function tick(s, now) {
    s.raf = 0;
    if (session !== s || document.hidden) return;
    const dt = Math.min((now - (s.last || now)) / 1000, 0.05);
    s.last = now;
    let dx = s.direction.x,
      dy = s.direction.y;
    if (s.path.length && !dx && !dy) {
      const p = s.data.position,
        t = s.path[0],
        dist = Math.hypot(t.x - p.x, t.y - p.y);
      if (dist < 5) {
        s.path.shift();
        if (!s.path.length) {
          query(".explore-marker", s.root).hidden = true;
          save(s);
          s.player.classList.add("is-joy");
          setTimeout(() => s.player?.classList.remove("is-joy"), 900);
          if (
            s.targetNpc &&
            Math.hypot(s.targetNpc.pos.x - p.x, s.targetNpc.pos.y - p.y) < 80
          ) {
            const n = s.targetNpc;
            s.targetNpc = null;
            openDialog(s, n);
          } else announce(s, "到達了！靠近地點後可以互動。");
        }
      } else {
        dx = (t.x - p.x) / dist;
        dy = (t.y - p.y) / dist;
      }
    }
    let npcActive = false;
    for (const n of s.npcs) {
      if (!n.walking) continue;
      const distance = Math.hypot(
        n.pos.x - s.data.position.x,
        n.pos.y - s.data.position.y,
      );
      if (distance < 85 || n === s.dialog || n === s.targetNpc) {
        n.walking = false;
        placeNpc(n);
        continue;
      }
      const deltaX = n.target.x - n.pos.x,
        deltaY = n.target.y - n.pos.y,
        d = Math.hypot(deltaX, deltaY),
        step = 35 * dt;
      if (d <= step || d < 1) {
        n.pos = { ...n.target };
        n.walking = false;
      } else {
        n.pos.x += (deltaX / d) * step;
        n.pos.y += (deltaY / d) * step;
        npcActive = true;
      }
      placeNpc(n);
    }
    const length = Math.hypot(dx, dy);
    s.moving = length > 0;
    if (length) {
      dx /= length;
      dy /= length;
      s.data.facing =
        Math.abs(dx) > Math.abs(dy)
          ? dx < 0
            ? "left"
            : "right"
          : dy < 0
            ? "up"
            : "down";
      const previous = s.data.position;
      s.data.position = s.world.move(
        s.data.position,
        dx * 145 * dt,
        dy * 145 * dt,
      );
      if (
        previous.x !== s.data.position.x ||
        previous.y !== s.data.position.y
      ) {
        s.dirty = true;
        s.dirtyPosition = true;
      }
    }
    draw(s);
    if (length || s.path.length || npcActive) {
      requestTick(s);
    } else {
      s.last = 0;
      if (s.dirty) save(s);
    }
  }
  function stop(s) {
    if (s.pointerId != null) {
      const id = s.pointerId;
      s.pointerId = null;
      if (s.stick.hasPointerCapture(id)) s.stick.releasePointerCapture(id);
      s.knob.style.transform = "";
    }
    s.direction = { x: 0, y: 0 };
    s.path = [];
    s.targetNpc = null;
    s.moving = false;
    s.last = 0;
    query(".explore-marker", s.root).hidden = true;
    draw(s);
    save(s);
  }
  function pointerMove(s, e) {
    const rect = s.stick.getBoundingClientRect(),
      x = e.clientX - (rect.left + rect.width / 2),
      y = e.clientY - (rect.top + rect.height / 2),
      d = Math.hypot(x, y),
      limit = rect.width * 0.3,
      k = d > limit ? limit / d : 1;
    s.direction = { x: clamp(x / limit, -1, 1), y: clamp(y / limit, -1, 1) };
    if (d < 5) s.direction = { x: 0, y: 0 };
    s.knob.style.transform = `translate(${x * k}px,${y * k}px)`;
    s.path = [];
    s.targetNpc = null;
    requestTick(s);
  }
  function mount(root, opts) {
    leave();
    if (!root || !validId(opts?.childId) || !global.IslandWorld) return false;
    const world = global.IslandWorld;
    const loaded = read(opts.childId);
    const data = loaded.data;
    data.position = world.safePosition(data.position);
    const s = {
      root,
      opts,
      id: opts.childId,
      world,
      data,
      readOnly: loaded.readOnly,
      dirtyPosition: false,
      dirtyAppearance: false,
      path: [],
      direction: { x: 0, y: 0 },
      moving: false,
      dialog: null,
      raf: 0,
      last: 0,
      scale: 1,
      camX: 0,
      camY: 0,
      abort: new AbortController(),
      npcTimer: 0,
    };
    session = s;
    root.innerHTML = html(s);
    s.viewport = query(".explore-viewport", root);
    s.plane = query(".explore-world", root);
    s.player = query(".explore-player", root);
    s.stick = query(".explore-stick", root);
    s.knob = query(".explore-stick-knob", root);
    root.dataset.exploreChild = s.id;
    for (const x of root.querySelectorAll("[data-appearance]"))
      x.value = data.appearance[x.dataset.appearance];
    makeObjects(s);
    renderNpcs(s);
    draw(s);
    if (s.readOnly) announce(s, "目前以暫時狀態探索。");
    const signal = s.abort.signal;
    root.addEventListener(
      "click",
      (e) => {
        const t = e.target;
        if (t.closest("[data-explore-reset]")) {
          stop(s);
          s.data.position = { ...world.spawn };
          s.dirtyPosition = true;
          draw(s);
          save(s);
          announce(s, "回到中央廣場了。");
          return;
        }
        const wardrobe = t.closest("[data-explore-wardrobe]");
        if (wardrobe) {
          const box = query(".explore-wardrobe", root);
          box.hidden = !box.hidden;
          wardrobe.setAttribute("aria-expanded", String(!box.hidden));
          return;
        }
        const toggle = t.closest("[data-explore-stick-toggle]");
        if (toggle) {
          s.stick.hidden = !s.stick.hidden;
          toggle.setAttribute("aria-pressed", String(!s.stick.hidden));
          toggle.textContent = s.stick.hidden ? "◉ 顯示搖桿" : "◉ 隱藏搖桿";
          stop(s);
          return;
        }
        if (t.closest("[data-dialog-close]")) {
          closeDialog(s);
          return;
        }
        if (t.closest("[data-dialog-speak]")) {
          s.opts.speak?.(query(".explore-dialog p", root).textContent);
          return;
        }
        if (t.closest("[data-dialog-enter]")) {
          const view = s.dialog?.view;
          closeDialog(s);
          save(s);
          if (view) s.opts.navigate?.(view);
          return;
        }
        if (t.closest(".explore-interact")) {
          interact(s);
          return;
        }
        const n = t.closest("[data-npc]");
        if (n) {
          const target = s.npcs.find((x) => x.id === n.dataset.npc);
          if (target) {
            target.walking = false;
            placeNpc(target);
            if (
              Math.hypot(
                target.pos.x - s.data.position.x,
                target.pos.y - s.data.position.y,
              ) < 75
            )
              openDialog(s, target);
            else setDestination(s, target.pos, target);
          }
          return;
        }
        const object = t.closest("[data-object]");
        if (object) {
          const target = world.entrances.find(
            (x) => x.id === object.dataset.object,
          );
          if (target) setDestination(s, target);
          return;
        }
        if (t.closest(".explore-world") && !s.dialog) {
          const rect = s.viewport.getBoundingClientRect();
          setDestination(s, {
            x: s.camX + (e.clientX - rect.left) / s.scale,
            y: s.camY + (e.clientY - rect.top) / s.scale,
          });
        }
      },
      { signal },
    );
    root.addEventListener(
      "change",
      (e) => {
        const key = e.target.dataset.appearance;
        if (!key) return;
        const val = e.target.value;
        if (
          (key === "hair" && HAIR.includes(val)) ||
          (key === "color" && COLORS.includes(val)) ||
          (key === "accessory" && HATS.includes(val))
        ) {
          s.data.appearance[key] = val;
          s.dirtyAppearance = true;
          s.player.innerHTML = avatarSvg(s.data.appearance);
          save(s);
          announce(s, "新裝扮已選好。");
        }
      },
      { signal },
    );
    s.stick.addEventListener(
      "pointerdown",
      (e) => {
        if (s.pointerId != null) return;
        e.preventDefault();
        s.pointerId = e.pointerId;
        s.stick.setPointerCapture(e.pointerId);
        pointerMove(s, e);
      },
      { signal },
    );
    s.stick.addEventListener(
      "pointermove",
      (e) => {
        if (
          s.pointerId === e.pointerId &&
          s.stick.hasPointerCapture(e.pointerId)
        )
          pointerMove(s, e);
      },
      { signal },
    );
    const release = (e) => {
      if (s.pointerId !== e.pointerId) return;
      s.pointerId = null;
      if (s.stick.hasPointerCapture(e.pointerId))
        s.stick.releasePointerCapture(e.pointerId);
      s.knob.style.transform = "";
      stop(s);
    };
    s.stick.addEventListener("pointerup", release, { signal });
    s.stick.addEventListener("pointercancel", release, { signal });
    s.stick.addEventListener("lostpointercapture", release, { signal });
    s.viewport.addEventListener(
      "keydown",
      (e) => {
        const k = e.key.toLowerCase();
        if (k === "escape" && s.dialog) {
          e.preventDefault();
          closeDialog(s);
          return;
        }
        if (
          e.target.closest("input,select,textarea,button") &&
          e.target !== s.viewport
        )
          return;
        const object = e.target.closest("[data-object]");
        if (object && (k === "enter" || k === " ")) {
          e.preventDefault();
          const target = world.entrances.find(
            (x) => x.id === object.dataset.object,
          );
          if (target) setDestination(s, target);
          return;
        }
        const dir = {
          arrowup: [0, -1],
          w: [0, -1],
          arrowdown: [0, 1],
          s: [0, 1],
          arrowleft: [-1, 0],
          a: [-1, 0],
          arrowright: [1, 0],
          d: [1, 0],
        }[k];
        if (dir && !s.dialog) {
          e.preventDefault();
          s.path = [];
          s.direction = { x: dir[0], y: dir[1] };
          requestTick(s);
        } else if ((k === "enter" || k === " ") && !s.dialog) {
          e.preventDefault();
          interact(s);
        } else if (k === "escape" && s.dialog) {
          e.preventDefault();
          closeDialog(s);
        }
      },
      { signal },
    );
    s.viewport.addEventListener(
      "keyup",
      (e) => {
        if (
          [
            "arrowup",
            "arrowdown",
            "arrowleft",
            "arrowright",
            "w",
            "a",
            "s",
            "d",
          ].includes(e.key.toLowerCase())
        )
          stop(s);
      },
      { signal },
    );
    s.viewport.addEventListener(
      "blur",
      () => {
        if (s.direction.x || s.direction.y) stop(s);
      },
      { signal },
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) {
          s.opts.stopSpeech?.();
          cancelAnimationFrame(s.raf);
          s.raf = 0;
          clearTimeout(s.npcTimer);
          for (const n of s.npcs) {
            n.walking = false;
            placeNpc(n);
          }
          stop(s);
        } else scheduleNpcs(s);
      },
      { signal },
    );
    global.addEventListener("resize", () => draw(s), { signal });
    global.addEventListener(
      "blur",
      () => {
        if (s.direction.x || s.direction.y) stop(s);
      },
      { signal },
    );
    if (global.ResizeObserver) {
      s.observer = new ResizeObserver(() => draw(s));
      s.observer.observe(s.viewport);
    }
    scheduleNpcs(s);
    return true;
  }
  function leave() {
    const s = session;
    if (!s) return;
    s.opts.stopSpeech?.();
    session = null;
    cancelAnimationFrame(s.raf);
    clearTimeout(s.npcTimer);
    s.observer?.disconnect();
    s.abort.abort();
    save(s);
  }
  global.IslandExplore = Object.freeze({ mount, leave, rideAvatar, snapshot });
})(globalThis);
