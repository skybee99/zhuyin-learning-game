/* Local, per-device transaction ledger. No network, names, or third-party services. */
(function (root) {
  'use strict';
  const DB_NAME = 'zhuyin-animal-island-ledger';
  const STORE = 'children';
  const VERSION = 1;
  const RESERVATION_MS = 30000;
  const PAINT_ACK_POLICY = 'paint-ack-v1';
  const REPEAT_WINDOW = 10;
  const REPEAT_LIMIT = 2;
  const copy = value => JSON.parse(JSON.stringify(value));
  const requireId = (value, label) => {
    if (typeof value !== 'string' || !value.trim() || value.length > 300 || value === 'prototype' || Object.prototype.hasOwnProperty.call(Object.prototype, value)) throw new Error('Invalid ' + label);
    return value;
  };
  function uid() {
    if (root.crypto && root.crypto.randomUUID) return root.crypto.randomUUID();
    if (!root.crypto || !root.crypto.getRandomValues) throw new Error('Secure random ID unavailable');
    const bytes = new Uint8Array(16); root.crypto.getRandomValues(bytes);
    return Array.from(bytes, x => x.toString(16).padStart(2, '0')).join('');
  }
  const emptyStats = () => ({ started: 0, firstAnswered: 0, firstCorrect: 0, completed: 0, retries: 0, wrong: 0, byQuestion: {} });
  function newState(childId) {
    return { schemaVersion: 1, childId, balance: 0, stars: 0, activeRounds: {}, rounds: {}, stats: { ...emptyStats(), byMode: {} }, transactions: [], rides: {}, completedQuestionKeys: [] };
  }
  function statFor(state, round) {
    const total = state.stats;
    const mode = total.byMode[round.mode] || (total.byMode[round.mode] = emptyStats());
    const question = mode.byQuestion[round.questionKey] || (mode.byQuestion[round.questionKey] = { started: 0, firstAnswered: 0, firstCorrect: 0, completed: 0, retries: 0, wrong: 0 });
    return [total, mode, question];
  }
  function assertState(s, childId) {
    if (!s || s.schemaVersion !== 1 || s.childId !== childId || !Number.isSafeInteger(s.balance) || s.balance < 0 || !Number.isSafeInteger(s.stars) || s.stars < 0 || !s.activeRounds || !s.rounds || !s.stats || !Array.isArray(s.transactions) || !s.rides || !Array.isArray(s.completedQuestionKeys)) throw new Error('Invalid ledger data');
  }
  function log(s, entry) { s.transactions.push({ id: uid(), at: Date.now(), ...entry }); }
  function recover(s, now) {
    let changed = false;
    Object.values(s.rides).forEach(ride => {
      if (ride.status === 'reserved' && ride.expiresAt <= now) {
        changed = true;
        ride.status = 'refunded'; ride.refundReason = 'expired'; ride.refundedAt = now; s.balance++;
        log(s, { type: 'ride_refund', operationId: ride.operationId, amount: 1, reason: 'expired' });
      }
    });
    return changed;
  }
  function buildRound(input) {
    requireId(input.mode, 'mode'); requireId(input.questionKey, 'questionKey'); requireId(input.correctId, 'correctId');
    if (!input.question || typeof input.question !== 'object' || Array.isArray(input.question)) throw new Error('Invalid question');
    return { id: uid(), mode: input.mode, questionKey: input.questionKey, question: copy(input.question), correctId: input.correctId, status: 'active', attemptCount: 0, firstCorrect: null, attempts: [], createdAt: Date.now() };
  }
  function addRound(s, r) {
    s.rounds[r.id] = r; s.activeRounds[r.mode] = r.id;
    statFor(s, r).forEach(stat => stat.started++);
  }
  function activeRound(s, mode) { const id = s.activeRounds[mode]; return id ? s.rounds[id] : null; }
  function open(options) {
    options = options || {};
    if (!root.indexedDB) return Promise.reject(new Error('IndexedDB unavailable'));
    return new Promise((resolve, reject) => {
      let request;
      try { request = root.indexedDB.open(options.dbName || DB_NAME, VERSION); } catch (e) { reject(e); return; }
      request.onupgradeneeded = () => { const db = request.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'childId' }); };
      request.onerror = () => reject(request.error || new Error('Cannot open ledger'));
      request.onblocked = () => reject(new Error('Ledger database upgrade blocked'));
      request.onsuccess = () => resolve(createLedger(request.result, options.dbName || DB_NAME));
    });
  }
  function createLedger(db, name) {
    const listeners = new Set();
    let channel = null;
    if (typeof root.BroadcastChannel === 'function') {
      try { channel = new root.BroadcastChannel(name + ':changed'); channel.onmessage = event => { if (event.data && typeof event.data.childId === 'string') listeners.forEach(fn => fn(event.data.childId)); }; } catch (_) { channel = null; }
    }
    function publish(childId) {
      listeners.forEach(fn => { try { fn(childId); } catch (_) {} });
      if (channel) { try { channel.postMessage({ childId }); } catch (_) {} }
    }
    function change(childId, callback, quiet) {
      requireId(childId, 'childId');
      return new Promise((resolve, reject) => {
        let tx, output, failure, recovered = false;
        try { tx = db.transaction(STORE, 'readwrite'); } catch (e) { reject(e); return; }
        const store = tx.objectStore(STORE), request = store.get(childId);
        request.onsuccess = () => {
          try {
            const s = request.result || newState(childId); assertState(s, childId); recovered = recover(s, Date.now());
            const data = callback(s); assertState(s, childId);
            output = { ...data, state: copy(s) }; store.put(s);
          } catch (e) { failure = e; try { tx.abort(); } catch (_) {} }
        };
        request.onerror = () => { failure = request.error; };
        tx.oncomplete = () => { if (!quiet || recovered) publish(childId); resolve(output); };
        tx.onabort = tx.onerror = () => reject(failure || tx.error || new Error('Ledger transaction failed'));
      });
    }
    function roundInput(s, input) {
      const round = activeRound(s, requireId(input.mode, 'mode'));
      if (!round || round.id !== input.roundId) throw new Error('Stale question round');
      return round;
    }
    return {
      close() { if (channel) channel.close(); db.close(); listeners.clear(); },
      subscribe(fn) { if (typeof fn !== 'function') throw new Error('Invalid listener'); listeners.add(fn); return () => listeners.delete(fn); },
      async get(childId) { return (await change(childId, () => ({}), true)).state; },
      async getOrCreateRound(childId, input) {
        return change(childId, s => {
          const existing = activeRound(s, requireId(input.mode, 'mode'));
          if (existing) return { round: copy(existing) };
          const round = buildRound(input); addRound(s, round); return { round: copy(round) };
        });
      },
      async advanceRound(childId, input) {
        return change(childId, s => {
          const existing = activeRound(s, requireId(input.mode, 'mode'));
          requireId(input.roundId, 'roundId');
          if (!existing) throw new Error('Question round missing');
          if (existing.id !== input.roundId) return { round: copy(existing), alreadyAdvanced: true };
          if (existing.status === 'active') throw new Error('Question round not finished');
          const round = buildRound(input); addRound(s, round); return { round: copy(round), alreadyAdvanced: false };
        });
      },
      async abandonRound(childId, mode, roundId) {
        return change(childId, s => {
          const r = roundInput(s, { mode, roundId });
          if (r.status === 'active') { r.status = 'abandoned'; r.finishedAt = Date.now(); }
          return { round: copy(r) };
        });
      },
      async answer(childId, input) {
        return change(childId, s => {
          requireId(input.mode, 'mode'); requireId(input.roundId, 'roundId'); requireId(input.attemptId, 'attemptId'); requireId(input.optionId, 'optionId');
          const old = s.rounds[input.roundId];
          if (!old || old.mode !== input.mode) throw new Error('Stale question round');
          if (Object.values(s.rounds).some(round => round.id !== old.id && round.attempts.some(a => a.id === input.attemptId))) throw new Error('Attempt ID conflict');
          const previous = old.attempts.find(a => a.id === input.attemptId);
          if (previous) {
            if (previous.optionId !== input.optionId || previous.expectedAttemptCount !== input.expectedAttemptCount) throw new Error('Attempt ID conflict');
            return { round: copy(old), correct: previous.correct, awarded: previous.awarded, duplicate: true };
          }
          const r = roundInput(s, input);
          if (r.status !== 'active' || !Number.isSafeInteger(input.expectedAttemptCount) || r.attemptCount !== input.expectedAttemptCount) throw new Error('Stale answer attempt');
          const correct = input.optionId === r.correctId, first = r.attemptCount === 0;
          const stats = statFor(s, r);
          if (!first) stats.forEach(x => x.retries++);
          if (first) { stats.forEach(x => x.firstAnswered++); r.firstCorrect = correct; if (correct) stats.forEach(x => x.firstCorrect++); }
          if (!correct) stats.forEach(x => x.wrong++);
          r.attemptCount++;
          let awarded = false;
          if (correct) {
            r.status = 'completed'; r.finishedAt = Date.now(); s.stars++; stats.forEach(x => x.completed++);
            const repeatCount = s.completedQuestionKeys.slice(-REPEAT_WINDOW).filter(x => x.questionKey === r.questionKey && x.awarded).length;
            awarded = repeatCount < REPEAT_LIMIT;
            s.completedQuestionKeys.push({ questionKey: r.questionKey, awarded });
            if (awarded) s.balance++;
            log(s, { type: awarded ? 'quiz_credit' : 'quiz_repeat_limit', roundId: r.id, mode: r.mode, questionKey: r.questionKey, amount: awarded ? 1 : 0, repeatWindow: REPEAT_WINDOW, repeatLimit: REPEAT_LIMIT });
          }
          r.attempts.push({ id: input.attemptId, expectedAttemptCount: input.expectedAttemptCount, optionId: input.optionId, correct, awarded, at: Date.now() });
          return { round: copy(r), correct, awarded, duplicate: false };
        });
      },
      async reserveRide(childId, input) {
        return change(childId, s => {
          const operationId = requireId(input.operationId, 'operationId'), rideName = requireId(input.ride, 'ride');
          if (input.startPolicy !== undefined && input.startPolicy !== PAINT_ACK_POLICY) throw new Error('Invalid ride start policy');
          const prior = s.rides[operationId];
          if (prior) {
            if (prior.ride !== rideName || (input.startPolicy !== undefined && prior.startPolicy !== input.startPolicy)) throw new Error('Operation ID conflict');
            return { reservation: copy(prior) };
          }
          if (s.balance < 1) throw new Error('Insufficient tickets');
          const now = Date.now(), reservation = { operationId, ride: rideName, status: 'reserved', reservedAt: now, expiresAt: now + RESERVATION_MS };
          if (input.startPolicy === PAINT_ACK_POLICY) { reservation.startPolicy = PAINT_ACK_POLICY; reservation.phase = 'reserved'; }
          s.balance--; s.rides[operationId] = reservation; log(s, { type: 'ride_debit', operationId, ride: rideName, amount: -1 });
          return { reservation: copy(reservation) };
        });
      },
      // A UI acknowledgment, not independent proof that physical pixels were seen.
      // This phase remains refundable until startRide commits.
      async markRidePainted(childId, operationId) {
        return change(childId, s => {
          const r = s.rides[requireId(operationId, 'operationId')];
          if (!r) throw new Error('Ride reservation missing');
          if (r.startPolicy !== PAINT_ACK_POLICY) throw new Error('Ride paint policy missing');
          if (r.status === 'reserved' && r.phase === 'reserved') {
            r.phase = 'painted'; r.paintedAt = Date.now();
            log(s, { type: 'ride_paint_ack', operationId, ride: r.ride, amount: 0 });
          }
          return { reservation: copy(r) };
        });
      },
      async startRide(childId, operationId) {
        return change(childId, s => {
          const r = s.rides[requireId(operationId, 'operationId')]; if (!r) throw new Error('Ride reservation missing');
          if (r.status === 'reserved' && r.startPolicy === PAINT_ACK_POLICY && r.phase !== 'painted') throw new Error('Ride paint acknowledgment required');
          if (r.status === 'reserved') { r.status = 'started'; r.startedAt = Date.now(); log(s, { type: 'ride_started', operationId, ride: r.ride, amount: 0 }); }
          return { reservation: copy(r) };
        });
      },
      async cancelRide(childId, operationId) {
        return change(childId, s => {
          const r = s.rides[requireId(operationId, 'operationId')]; if (!r) throw new Error('Ride reservation missing');
          if (r.status === 'reserved') { r.status = 'refunded'; r.refundReason = 'cancelled'; r.refundedAt = Date.now(); s.balance++; log(s, { type: 'ride_refund', operationId, ride: r.ride, amount: 1, reason: 'cancelled' }); }
          return { reservation: copy(r) };
        });
      },
      async completeRide(childId, operationId) {
        return change(childId, s => {
          const r = s.rides[requireId(operationId, 'operationId')]; if (!r) throw new Error('Ride reservation missing');
          if (r.status === 'started') { r.status = 'completed'; r.completedAt = Date.now(); log(s, { type: 'ride_completed', operationId, ride: r.ride, amount: 0 }); }
          return { reservation: copy(r) };
        });
      },
      async exportSnapshot() {
        return new Promise((resolve, reject) => {
          let tx; try { tx = db.transaction(STORE, 'readonly'); } catch (e) { reject(e); return; }
          const request = tx.objectStore(STORE).getAll(); let result;
          request.onsuccess = () => { result = request.result; };
          tx.oncomplete = () => { try { result.forEach(s => assertState(s, s.childId)); resolve({ schemaVersion: 1, exportedAt: new Date().toISOString(), children: copy(result) }); } catch (e) { reject(e); } };
          tx.onabort = tx.onerror = () => reject(tx.error || new Error('Ledger export failed'));
        });
      }
    };
  }
  root.TicketLedger = Object.freeze({ open, RESERVATION_MS, REPEAT_WINDOW, REPEAT_LIMIT, PAINT_ACK_POLICY });
  if (typeof module !== 'undefined' && module.exports) module.exports = root.TicketLedger;
})(globalThis);
