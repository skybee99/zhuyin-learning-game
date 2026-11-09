const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const DICTIONARY_SCHEMA_VERSION = 1;
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS }); }

export default {
  async fetch(request, env) {
    const {pathname} = new URL(request.url);
    if (!pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
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
