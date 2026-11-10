(() => {
  'use strict';

  const KEY = 'zhuyin-island-local-v1';
  const CURRENT = 'zhuyin-island-current-child';
  const OLD_CURRENT = 'zhuyin-current-child';
  const OLD_PREFIX = 'zhuyin-profile-';
  const OLD_DICTIONARY = 'zhuyin-local-dictionary';
  const OLD_V1 = 'zhuyinBeeProgressV1';
  const IDS = ['child-1', 'child-2', 'child-3'];
  // Match the original storage slots without shipping their human-readable names.
  const LEGACY_SLOT_HASHES = [
    'd84fe7e07bedb227cffff10009151d96fc944f6a1bd37cff60e8e4626a1eb1c3',
    '31611159e7e6ff7843ea4627745e89225fc866621cfcfdbd40871af4413747cc',
    'b03e01d7667d33ce74a76bfc9f2a6180c144d1eb005ba4f40fbe4c36387867db'
  ];
  const COLLECTIONS = ['characters', 'words', 'candidates', 'changeLogs'];
  const COUNTS = ['stars', 'answers', 'correct', 'wrong'];
  const LISTS = ['learnedZhuyin', 'heardZhuyin', 'learnedCharacters', 'wrongItems', 'recentQuestionIds'];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const object = (value) => value && typeof value === 'object' && !Array.isArray(value);

  function parse(raw, fallback) {
    return raw === null ? fallback : JSON.parse(raw);
  }

  async function sha256(text) {
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))),
      (b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function canonicalId(id) {
    if (typeof id !== 'string' || !id || id.length > 100) return null;
    if (IDS.includes(id)) return id;
    const index = LEGACY_SLOT_HASHES.indexOf(await sha256(id));
    return IDS[index] ?? null;
  }

  function emptyDictionary(value = {}) {
    if (!object(value)) throw new Error('字庫資料格式不符');
    const result = { ...value };
    for (const key of COLLECTIONS) {
      if (result[key] !== undefined && !Array.isArray(result[key])) throw new Error('字庫資料格式不符');
      result[key] ??= [];
    }
    return result;
  }

  async function open(storage = globalThis.localStorage, locks = globalThis.navigator?.locks) {
    const profiles = {};
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key?.startsWith(OLD_PREFIX)) continue;
      const id = await canonicalId(key.slice(OLD_PREFIX.length));
      if (!id) continue;
      const p = parse(storage.getItem(key), null);
      if (!object(p)) throw new Error('舊學習紀錄無法讀取，原始資料已保留');
      profiles[id] = p;
    }
    const v1 = parse(storage.getItem(OLD_V1), null);
    if (object(v1) && !profiles[IDS[0]]) {
      profiles[IDS[0]] = { ...v1 };
    }
    const baseline = { schema: 1, revision: 0, profiles, dictionary: emptyDictionary(parse(storage.getItem(OLD_DICTIONARY), {})) };
    const remembered = await canonicalId(storage.getItem(CURRENT) || storage.getItem(OLD_CURRENT));
    const read = () => {
      const doc = parse(storage.getItem(KEY), clone(baseline));
      if (doc.schema !== 1 || !object(doc.profiles) || !object(doc.dictionary) || !Number.isSafeInteger(doc.revision)) {
        throw new Error('島嶼本機資料無法讀取，請由家長檢查備份');
      }
      return doc;
    };
    read();
    const lock = (callback) => {
      if (!locks?.request) return Promise.reject(new Error('這個瀏覽器無法安全儲存設定，請更新瀏覽器'));
      return locks.request(KEY, callback);
    };
    const write = (doc) => {
      const encoded = JSON.stringify(doc);
      storage.setItem(KEY, encoded);
      if (storage.getItem(KEY) !== encoded) throw new Error('本機資料寫入驗證失敗');
      return doc;
    };
    return {
      read, remembered,
      remember(id) {
        if (!IDS.includes(id)) throw new Error('未知角色');
        storage.setItem(CURRENT, id);
      },
      update(callback) {
        return lock(() => {
          const doc = read();
          callback(doc);
          doc.revision += 1;
          return write(doc);
        });
      },
      applyImport(plan, prePayload) {
        return lock(async () => {
          const before = read();
          if (JSON.stringify(before) !== plan.base) throw new Error('本機資料已變更，請重新預覽');
          const encoded = JSON.stringify({ ...prePayload, exactLocalState: before });
          const digest = await sha256(encoded);
          const preKey = 'zhuyin-island-pre-' + crypto.randomUUID();
          storage.setItem(preKey, encoded);
          const readback = storage.getItem(preKey);
          if (readback !== encoded || await sha256(readback) !== digest) throw new Error('PRE 備份驗證失敗');
          const next = { ...plan.next, revision: before.revision + 1 };
          write(next);
          return { preKey, digest, encoded };
        });
      }
    };
  }

  async function planImport(data, mode, before) {
    if (!object(data) || !['zhuyin-zoo','zhuyin-island'].includes(data.app)
      || !/^V(?:1\.[0-9]+\.[0-9]+|2\.[01]\.0)$/.test(data.version || '')
      || !['merge','replace'].includes(mode)) throw new Error('無法辨識備份版本或格式');
    const next = clone(before);
    const summary = { profiles: [], dictionary: [], ledgerIncluded: data.ledger != null, curriculumIncluded: data.curriculum != null };
    if (data.progress != null) {
      if (!Array.isArray(data.progress) || data.progress.length > IDS.length) throw new Error('角色筆數無效');
      const seen = new Set();
      for (const row of data.progress) {
        if (!object(row)) throw new Error('角色資料無效');
        const { childId, name: _legacyName, ...p } = row;
        const id = await canonicalId(childId);
        if (!id || seen.has(id)) throw new Error('有未知或重複的角色');
        seen.add(id);
        if (COUNTS.some((key) => p[key] !== undefined && (!Number.isSafeInteger(p[key]) || p[key] < 0))
          || LISTS.some((key) => p[key] !== undefined && (!Array.isArray(p[key]) || p[key].some((item) => typeof item !== 'string')))
          || (p.settings !== undefined && !object(p.settings))) throw new Error('學習紀錄或設定格式無效');
        const existing = before.profiles[id] || {};
        let restored = { ...existing, ...p, settings: { ...existing.settings, ...p.settings } };
        if (mode === 'merge') {
          const hasExisting = Object.keys(existing).length > 0;
          restored = { ...p, ...existing, settings: { ...p.settings, ...existing.settings } };
          // Take counters as one snapshot; mixing independent maxima can invent totals.
          const counters = (existing.answers || 0) >= (p.answers || 0) && hasExisting ? existing : p;
          for (const key of COUNTS) restored[key] = counters[key] ?? 0;
          for (const key of LISTS) restored[key] = [...new Set([...(existing[key] || []), ...(p[key] || [])])];
        }
        next.profiles[id] = restored;
        summary.profiles.push({ id, beforeStars: existing.stars || 0, afterStars: restored.stars || 0,
          beforeAnswers: existing.answers || 0, afterAnswers: restored.answers || 0 });
      }
    }
    if (data.dictionary?.local !== undefined) {
      const incoming = emptyDictionary(data.dictionary.local);
      next.dictionary = { ...before.dictionary };
      for (const key of COLLECTIONS) {
        if (!Object.hasOwn(data.dictionary.local, key)) continue;
        if (incoming[key].some((row) => !object(row))) throw new Error('字庫項目格式無效');
        if (['characters','words'].includes(key)) {
          const ids = new Set();
          for (const row of incoming[key]) {
            if (typeof row.id !== 'string' || !row.id || ids.has(row.id)
              || typeof row[key === 'characters' ? 'han' : 'word'] !== 'string') throw new Error('字庫有缺漏或重複的識別碼');
            ids.add(row.id);
          }
        }
        const current = before.dictionary[key] || [];
        let output = incoming[key];
        let conflicts = 0;
        if (mode === 'merge') {
          const index = new Map();
          const identity = (row) => key === 'changeLogs' || !row.id ? JSON.stringify(row) : row.id;
          for (const row of current) index.set(identity(row), row);
          output = [...current];
          for (const row of incoming[key]) {
            const old = index.get(identity(row));
            if (!old) { index.set(identity(row), row); output.push(row); }
            else if (JSON.stringify(old) !== JSON.stringify(row)) conflicts++;
          }
        }
        next.dictionary[key] = output;
        summary.dictionary.push({ key, before: current.length, after: output.length, conflicts });
      }
    }
    if (!summary.profiles.length && !summary.dictionary.length) throw new Error('此檔案沒有可還原的學習紀錄或本機字庫');
    return { mode, base: JSON.stringify(before), next, summary };
  }

  globalThis.IslandStorage = Object.freeze({ KEY, open, planImport, sha256 });
})();
