(function (root) {
  'use strict';
  const STORAGE_KEY = 'zhuyin-animal-island-curriculum-v1';
  const BOOKS = [
    { id: 'nanyi-primer', name: '南一《國語首冊》', stage: '注音入門', grade: '首冊', semester: '' },
    { id: 'nanyi-g1-s1', name: '南一《國語 1 上》', stage: '基礎生字', grade: '1', semester: '上' },
    { id: 'nanyi-g3-s1', name: '南一《國語 3 上》', stage: '進階字詞、造句與閱讀', grade: '3', semester: '上' }
  ];
  const empty = () => ({ version: 1, lessons: [] });
  function read() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return empty();
    const data = JSON.parse(raw);
    if (!data || data.version !== 1 || !Array.isArray(data.lessons)) throw new Error('課程資料格式無法辨識，原資料已保留。');
    return data;
  }
  function save(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text = value => typeof value === 'string' ? value.trim().slice(0, 2000) : '';
  function stage(input) {
    if (!input || !BOOKS.some(b => b.id === input.bookId)) throw new Error('請選擇教材。');
    const lesson = text(input.lesson);
    if (!lesson) throw new Error('請填寫課次或自訂標籤。');
    const book = BOOKS.find(b => b.id === input.bookId);
    return { id: 'lesson-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10),
      source: text(input.source), grade: book.grade, semester: book.semester, book: book.name, bookId: book.id,
      edition: text(input.edition), lesson, characters: text(input.characters), zhuyin: text(input.zhuyin), tone: text(input.tone),
      words: text(input.words), sentence: text(input.sentence), dictionaryRefs: text(input.dictionaryRefs),
      imageRef: text(input.imageRef), audioRef: text(input.audioRef), reviewed: false, verified: false,
      status: 'PENDING_REVIEW', auditTrail: [{ action: 'STAGED', at: new Date().toISOString() }] };
  }
  function addMany(inputs) {
    if (!Array.isArray(inputs) || !inputs.length || inputs.length > 500) throw new Error('匯入格式須為 1 至 500 筆課程陣列。');
    const staged = inputs.map(stage); // validate everything before writing
    const data = read(); data.lessons.push(...staged); save(data); return staged.length;
  }
  function setupWriting(view) {
    const canvas = view.querySelector('#writingCanvas');
    const clear = view.querySelector('#writingClear');
    if (!canvas || !clear) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) { clear.disabled = true; return; }
    let pointer = null;
    function point(event) {
      const rect = canvas.getBoundingClientRect();
      return { x: (event.clientX - rect.left) * canvas.width / rect.width,
        y: (event.clientY - rect.top) * canvas.height / rect.height };
    }
    canvas.addEventListener('pointerdown', event => {
      if (pointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
      pointer = event.pointerId;
      if (canvas.setPointerCapture) canvas.setPointerCapture(pointer);
      const p = point(event);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 0.01, p.y);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 9; ctx.strokeStyle = '#35495b'; ctx.stroke();
      event.preventDefault();
    });
    canvas.addEventListener('pointermove', event => {
      if (event.pointerId !== pointer) return;
      const p = point(event); ctx.lineTo(p.x, p.y); ctx.stroke(); event.preventDefault();
    });
    const end = event => { if (event.pointerId === pointer) pointer = null; };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('lostpointercapture', end);
    clear.addEventListener('click', () => { ctx.clearRect(0, 0, canvas.width, canvas.height); });
  }
  function render(view, parent) {
    let data;
    try { data = read(); } catch (e) { if(view) view.textContent=e.message; if(parent) parent.textContent=e.message; return; }
    if (view) {
      view.innerHTML = '<h2>📚 課程路線</h2><p>依序探索注音、基礎生字，再練習字詞與閱讀。現有通用練習仍可使用。</p><ol class="curriculum-route">' + BOOKS.map(b => {
      const count = data.lessons.filter(x => x.bookId === b.id).length;
      return '<li><strong>' + esc(b.name) + '</strong>：' + esc(b.stage) + '<br>教材內容等待來源（WAITING_FOR_SOURCE）｜本機待審 ' + count + ' 筆</li>';
    }).join('') + '</ol><p>封面不能代表完整課次或生字表；取得來源並審核後才能建立正式教材內容。</p>' +
      '<section class="curriculum-writing" aria-labelledby="writingTitle"><h3 id="writingTitle">✍️ 自由描寫</h3><p id="writingHint">用手指或筆在方格裡自由寫注音或國字。這是通用練習，不評分、不發券。</p><canvas id="writingCanvas" width="600" height="360" aria-label="自由描寫區" aria-describedby="writingHint"></canvas><button type="button" id="writingClear">清除重寫</button></section>';
      setupWriting(view);
    }
    if (parent) {
      parent.innerHTML = '<h3>教材資料待審區</h3><p>資料只存在此裝置。新增或匯入只建立待審紀錄，不會啟用成遊戲題目；母字庫請填既有項目的 ID，避免重複建立字詞。來源證據請勿包含私人資料。</p>' +
      '<form id="curriculumForm"><label>教材 <select name="bookId">' + BOOKS.map(b=>'<option value="'+esc(b.id)+'">'+esc(b.name)+'</option>').join('') + '</select></label>' +
      [['lesson','課次或自訂標籤'],['edition','版本'],['source','來源證據'],['characters','生字'],['zhuyin','注音'],['tone','聲調'],['words','詞語'],['sentence','例句'],['dictionaryRefs','既有母字庫 ID'],['imageRef','圖片參照'],['audioRef','語音參照']].map(([n,l]) => '<label>'+l+' <input name="'+n+'"'+(n==='lesson'?' required':'')+'></label>').join('') +
      '<button type="submit">新增待審紀錄</button></form><label>匯入待審 JSON 陣列 <input type="file" id="curriculumImport" accept="application/json,.json"></label><button type="button" id="curriculumImportButton">加入待審區</button><p id="curriculumMessage" role="status"></p><h4>本機待審紀錄（'+data.lessons.length+'）</h4><ul>' + data.lessons.map(x=>'<li>'+esc(x.book)+'｜'+esc(x.lesson)+'｜'+esc(x.characters || x.words || '尚無字詞')+'｜待審核</li>').join('') + '</ul>';
      const message=parent.querySelector('#curriculumMessage');
      parent.querySelector('#curriculumForm').onsubmit = e => { e.preventDefault(); try { addMany([Object.fromEntries(new FormData(e.currentTarget))]); render(view,parent); parent.querySelector('#curriculumMessage').textContent='已加入待審區。'; } catch(err) { message.textContent=err.message; } };
      parent.querySelector('#curriculumImportButton').onclick = async () => { try { const file=parent.querySelector('#curriculumImport').files[0]; if(!file) throw new Error('請選擇 JSON 檔案。'); if(file.size > 1000000) throw new Error('檔案超過 1 MB。'); const count=addMany(JSON.parse(await file.text())); render(view,parent); parent.querySelector('#curriculumMessage').textContent='已加入 '+count+' 筆待審紀錄。'; } catch(err) { message.textContent='匯入失敗：'+err.message; } };
    }
  }
  root.Curriculum = Object.freeze({ STORAGE_KEY, BOOKS, mount: render, stage, addMany });
})(globalThis);
