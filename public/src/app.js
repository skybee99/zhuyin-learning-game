'use strict';

const expectedSymbols = 'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄧㄨㄩㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ'.split('');
const groupDefs = [
  { id: 'g1', name: '聲母一', symbols: 'ㄅㄆㄇㄈㄉㄊㄋㄌ'.split('') },
  { id: 'g2', name: '聲母二', symbols: ['ㄍ','ㄎ','ㄏ','ㄐ','ㄑ','ㄒ','ㄓ','ㄔ','ㄕ','ㄖ','ㄗ','ㄘ','ㄙ'] },
  { id: 'g3', name: '結合韻', symbols: 'ㄧㄨㄩ'.split('') },
  { id: 'g4', name: '韻母一', symbols: ['ㄚ','ㄛ','ㄜ','ㄝ','ㄞ','ㄟ','ㄠ','ㄡ'] },
  { id: 'g5', name: '韻母二', symbols: ['ㄢ','ㄣ','ㄤ','ㄥ','ㄦ'] }
];
const samples = { 'ㄅ':['爸','ㄅㄚˋ','👨'],'ㄆ':['泡','ㄆㄠˋ','🫧'],'ㄇ':['馬','ㄇㄚˇ','🐴'],'ㄈ':['飛','ㄈㄟ','🪽'],'ㄉ':['燈','ㄉㄥ','💡'],'ㄊ':['兔','ㄊㄨˋ','🐰'],'ㄋ':['鳥','ㄋㄧㄠˇ','🐦'],'ㄌ':['鹿','ㄌㄨˋ','🦌'],'ㄍ':['狗','ㄍㄡˇ','🐶'],'ㄎ':['口','ㄎㄡˇ','👄'],'ㄏ':['河','ㄏㄜˊ','🏞️'],'ㄐ':['雞','ㄐㄧ','🐔'],'ㄑ':['旗','ㄑㄧˊ','🚩'],'ㄒ':['西','ㄒㄧ','🌅'],'ㄓ':['竹','ㄓㄨˊ','🎋'],'ㄔ':['車','ㄔㄜ','🚗'],'ㄕ':['書','ㄕㄨ','📖'],'ㄖ':['日','ㄖˋ','☀️'],'ㄗ':['字','ㄗˋ','🔤'],'ㄘ':['草','ㄘㄠˇ','🌱'],'ㄙ':['傘','ㄙㄢˇ','☂️'],'ㄧ':['衣','ㄧ','👕'],'ㄨ':['屋','ㄨ','🏠'],'ㄩ':['魚','ㄩˊ','🐟'],'ㄚ':['鴨','ㄧㄚ','🦆'],'ㄛ':['喔','ㄛ','⭕'],'ㄜ':['鵝','ㄜˊ','🪿'],'ㄝ':['欸','ㄝ','🙋'],'ㄞ':['愛','ㄞˋ','❤️'],'ㄟ':['杯','ㄅㄟ','🥤'],'ㄠ':['凹','ㄠ','🕳️'],'ㄡ':['藕','ㄡˇ','🪷'],'ㄢ':['山','ㄕㄢ','⛰️'],'ㄣ':['門','ㄇㄣˊ','🚪'],'ㄤ':['羊','ㄧㄤˊ','🐑'],'ㄥ':['風','ㄈㄥ','🌬️'],'ㄦ':['兒','ㄦˊ','🧒'] };
const symbols = expectedSymbols.map((symbol) => { const group = groupDefs.find((g) => g.symbols.includes(symbol)).name; const [sampleWord, sampleZhuyin, emoji] = samples[symbol]; return { symbol, systemSpeechText: symbol, group, exampleWord: sampleWord, exampleZhuyin: splitZhuyin(sampleZhuyin), sampleWord, sampleZhuyin, word: sampleWord, emoji, audio: `assets/audio/${symbol}.mp3`, audioKey: symbol, recording: 'planned', recordingStatus: 'planned' }; });
const textBank = {
  title:{speechText:'注音動物島',characters:[{han:'注',zhuyin:'ㄓㄨˋ'},{han:'音',zhuyin:'ㄧㄣ'},{han:'動',zhuyin:'ㄉㄨㄥˋ'},{han:'物',zhuyin:'ㄨˋ'},{han:'島',zhuyin:'ㄉㄠˇ'}]},
  cards:{speechText:'注音卡',characters:[{han:'注',zhuyin:'ㄓㄨˋ'},{han:'音',zhuyin:'ㄧㄣ'},{han:'卡',zhuyin:'ㄎㄚˇ'}]},
  listen:{speechText:'聽一聽',characters:[{han:'聽',zhuyin:'ㄊㄧㄥ'},{han:'一',zhuyin:'ㄧ'},{han:'聽',zhuyin:'ㄊㄧㄥ'}]},
  spell:{speechText:'拼一拼',characters:[{han:'拼',zhuyin:'ㄆㄧㄣ'},{han:'一',zhuyin:'ㄧ'},{han:'拼',zhuyin:'ㄆㄧㄣ'}]},
  picture:{speechText:'看圖認字',characters:[{han:'看',zhuyin:'ㄎㄢˋ'},{han:'圖',zhuyin:'ㄊㄨˊ'},{han:'認',zhuyin:'ㄖㄣˋ'},{han:'字',zhuyin:'ㄗˋ'}]}
};
const SPELLING_BANK = [
  { id:'plane-fei', image:'✈️', word:'飛機', targetCharacter:'飛', targetIndex:0, correctZhuyin:['ㄈ','ㄟ'], normalizedAnswer:'ㄈㄟ', difficulty:'beginner', category:'交通工具', speechText:'飛機' },
  { id:'mouth-zui', image:'👄', word:'嘴巴', targetCharacter:'嘴', targetIndex:0, correctZhuyin:['ㄗ','ㄨ','ㄟ','ˇ'], normalizedAnswer:'ㄗㄨㄟˇ', difficulty:'advanced', category:'身體', speechText:'嘴巴' },
  { id:'drink-he', image:'🥤', word:'喝水', targetCharacter:'喝', targetIndex:0, correctZhuyin:['ㄏ','ㄜ'], normalizedAnswer:'ㄏㄜ', difficulty:'beginner', category:'動作', speechText:'喝水' },
  { id:'pants-ku', image:'👖', word:'褲子', targetCharacter:'褲', targetIndex:0, correctZhuyin:['ㄎ','ㄨ','ˋ'], normalizedAnswer:'ㄎㄨˋ', difficulty:'advanced', category:'衣物', speechText:'褲子' }
];


function normalizeZhuyin(value){ return String(Array.isArray(value) ? value.join('') : value).normalize('NFC').replace(/\s+/g, '').replace(/[\u200B-\u200D\uFEFF]/g, ''); }
function parseZhuyinSyllable(value){ const raw=Array.isArray(value)?value.join(''):String(value||''); const chars=Array.from(raw).filter(Boolean); const light=chars.includes('˙'); const mark=light?'˙':(chars.find((c)=>'ˊˇˋ'.includes(c))||''); const symbols=chars.filter((c)=>!'ˊˇˋ˙'.includes(c)); const tone=light?'light':mark==='ˊ'?2:mark==='ˇ'?3:mark==='ˋ'?4:1; return { symbols, tone, toneMark: mark }; }
function splitZhuyin(value){ return parseZhuyinSyllable(value).symbols.concat(parseZhuyinSyllable(value).toneMark ? [parseZhuyinSyllable(value).toneMark] : []); }
function optionId(symbols){ return `zhuyin-${normalizeZhuyin(symbols).replace(/[ˊˇˋ˙]/g,(m)=>({ 'ˊ':'2','ˇ':'3','ˋ':'4','˙':'5' }[m]))}`; }
function makeOption(symbols){ return { id: optionId(symbols), symbols: splitZhuyin(symbols), normalized: normalizeZhuyin(symbols) }; }
function verticalSyllable(parts){ const z=parseZhuyinSyllable(parts); return `<span class="zhuyin-answer-syllable zhuyin-group tone-${z.tone}"><span class="zhuyin-symbols">${z.symbols.map((p)=>`<span>${p}</span>`).join('')}</span><span class="zhuyin-tone">${z.toneMark}</span></span>`; }
function beginnerSymbol(symbol){ return `<span class="zhuyin-answer-single">${symbol}</span>`; }
function phoneticWord(chars){ return `<span class="phonetic-word">${chars.map((c,i)=>`<span class="phonetic-char" data-char-index="${i}"><span class="hanzi">${c.han}</span>${verticalSyllable(c.zhuyin).replace('zhuyin-answer-syllable zhuyin-group','bopomofo-vertical zhuyin-group')}</span>`).join('')}</span>`; }
function ruby(entry){ return `<span class="readable" tabindex="0" data-speech="${entry.speechText}">${phoneticWord(entry.characters)}</span><ruby hidden>聽<rt>ㄊㄧㄥ</rt></ruby>`; }
function renderCards(){ const group=groupDefs[state.currentGroupIndex]; $('#groupName').textContent=group.name; $('#groupPager').textContent=`${state.currentGroupIndex+1} / ${groupDefs.length}`; $('#symbolCards').innerHTML=state.data.zhuyin.filter((s)=>s.group===group.name).map((item)=>`<article class="symbol-card"><span class="symbol zhuyin-symbol">${item.symbol}</span><span class="emoji">${item.emoji}</span><span class="sample">${phoneticWord([{han:item.exampleWord, zhuyin:item.exampleZhuyin}])}</span><button class="inline-action" type="button" data-play-zhuyin="${item.symbol}">🔊 聽注音</button><button class="inline-action" type="button" data-play-word="${item.exampleWord}">🔊 聽例字</button><button class="inline-action" type="button" data-repeat="${item.systemSpeechText}">👄 跟著念</button></article>`).join(''); }
function renderLearn(){ $('#learnCards').innerHTML=state.data.zhuyin.map((item)=>`<article class="symbol-card"><span class="symbol zhuyin-symbol">${item.symbol}</span><button class="inline-action" data-play-zhuyin="${item.symbol}">🔊 聽注音</button><button class="inline-action" data-play-word="${item.exampleWord}">🔊 聽例字</button><small>${item.exampleWord} ${verticalSyllable(item.exampleZhuyin)}</small></article>`).join(''); }

const APP_VERSION = globalThis.ZHUYIN_RELEASE;
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PROFILES = ['🐱','🐶','🐰'].map((avatar, index) => ({ id:`child-${index + 1}`, name:`島友 ${index + 1}`, avatar }));
const emptyDictionary = () => ({characters:[],words:[],candidates:[],changeLogs:[]});
const defaultSettings = { soundOn:true, buttonSpeechOn:true, promptSpeechOn:true, feedbackSpeechOn:true, rideSoundOn:true, volume:0.9, rate:0.85,
  zhuyinDisplay:'all', textSize:'standard', zhuyinSize:'standard', themeMode:'auto', reducedMotion:false, restMinutes:10 };
const defaultProfile = { schemaVersion:3, stars:0, answers:0, correct:0, wrong:0, recentGroupIndex:0, difficulty:'beginner',
  learnedZhuyin:[], heardZhuyin:[], learnedCharacters:[], wrongItems:[], recentQuestionIds:[] };
const state = {store:null,ledger:null,child:'',profile:null,ticket:null,view:'',epoch:0,currentGroupIndex:0,quiz:null,busy:false,
  data:{zhuyin:symbols,characters:[],words:[],categories:[],media:[],questions:[]},
  dictionary:emptyDictionary(),parentUnlocked:false,importPlan:null,previewEpoch:0,startedAt:0};

function report(message = '') {
  $('#appStatus').hidden = !message;
  $('#appStatus').textContent = message;
}
function local() { return state.store?.read() ?? { profiles:{}, dictionary:emptyDictionary() }; }
function profile(id) {
  const p = local().profiles[id] ?? {};
  return { ...defaultProfile, ...p, settings:{ ...defaultSettings, ...p.settings } };
}
function number(value) { return Number.isSafeInteger(value) && value >= 0 ? value : 0; }
function info(id = state.child, ticket = state.ticket) {
  const base = PROFILES.find((p) => p.id === id);
  if (!base) return null;
  const p = profile(id);
  const display = p.settings.displayName;
  return { ...base, name:typeof display === 'string' && display.trim() ? display.trim().slice(0,32) : base.name, stars:number(p.stars) + number(ticket?.stars) };
}
function stopAllSpeech() {
  try { globalThis.speechSynthesis?.cancel(); } catch { /* unsupported */ }
  if (state.currentAudio) {
    state.currentAudio.pause();
    state.currentAudio = null;
  }
}
function speakSystemText(text) {
  const settings = state.profile?.settings;
  if (!settings?.soundOn || !globalThis.speechSynthesis || !text) return;
  stopAllSpeech();
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    const taiwanVoice = speechSynthesis.getVoices().find((voice) => voice.lang.replace('_','-').toLowerCase() === 'zh-tw');
    if (taiwanVoice) utterance.voice = taiwanVoice;
    utterance.rate = Math.min(1.1, Math.max(0.6, Number(settings.rate) || 0.85));
    utterance.volume = Math.min(1, Math.max(0, Number(settings.volume) || 0));
    speechSynthesis.speak(utterance);
  } catch { /* practice remains available without speech */ }
}
function playZhuyinSound(symbol, example = false) {
  const item = state.data.zhuyin.find((z) => z.symbol === symbol) || symbols.find((z) => z.symbol === symbol);
  if (!item || !state.profile) return;
  speakSystemText(example ? item.exampleWord : (item.systemSpeechText || symbol));
  if (!state.profile.heardZhuyin?.includes(symbol)) updateProfile((p) => {
    p.heardZhuyin = [...new Set([...(p.heardZhuyin || []),symbol])];
  });
}
async function updateProfile(change) {
  const id = state.child;
  if (!id || !state.store) return;
  try {
    await state.store.update((doc) => {
      const p = doc.profiles[id] ?? {};
      change(p);
      doc.profiles[id] = { ...p, lastPlayedAt:new Date().toISOString() };
    });
    if (id === state.child) {
      state.profile = profile(id);
      renderProgress();
    }
  } catch { report('這次設定未能儲存，原本的紀錄仍保留。'); }
}
function renderProfiles() {
  $('#profileCards').innerHTML = PROFILES.map(({id}) => {
    const child = info(id,null);
    return `<button class="profile-card" type="button" data-child="${id}" aria-label="選擇 ${esc(child.name)}"><span class="avatar">${child.avatar}</span><strong>${esc(child.name)}</strong></button>`;
  }).join('');
}
function renderProgress() {
  if (!state.profile) return;
  const child = info(), p = state.profile, stats = state.ticket?.stats;
  $('#childBadge').textContent = `${child.avatar} ${child.name}`;
  $('#starsCount').textContent = child.stars;
  $('#answersCount').textContent = number(p.answers) + number(stats?.completed) + number(stats?.wrong);
  document.body.dataset.zhuyinDisplay = p.settings.zhuyinDisplay;
  document.body.dataset.textSize = p.settings.textSize;
  document.body.dataset.zhuyinSize = p.settings.zhuyinSize;
  document.body.dataset.reduceMotion = String(Boolean(p.settings.reducedMotion));
  AnimalIsland.refresh();
}
async function selectChild(id) {
  if (AnimalIsland.isStarting?.() || !PROFILES.some((p) => p.id === id)) return;
  exitChild();
  state.child = id;
  state.profile = profile(id);
  const group = state.profile.recentGroupIndex;
  state.currentGroupIndex = Number.isInteger(group) && group >= 0 && group < groupDefs.length ? group : 0;
  try { state.store?.remember(id); } catch { report('無法記住目前角色。'); }
  state.startedAt = Date.now();
  $('#profileView').classList.add('hidden');
  $('#profileView').classList.remove('active');
  $('#home').classList.remove('hidden');
  $('#mainContent').classList.remove('hidden');
  renderCards();
  renderLearn();
  renderProgress();
  showView('islandView');
  await refreshLedger(id);
}
function exitChild() {
  state.epoch++;
  state.parentUnlocked = false;
  state.quiz = null;
  state.busy = false;
  state.ticket = null;
  state.child = '';
  state.profile = null;
  stopAllSpeech();
  AnimalIsland.leave();
}
function chooseChild() {
  if (AnimalIsland.isStarting?.()) return;
  exitChild();
  renderProfiles();
  $('#profileView').classList.add('active');
  $('#profileView').classList.remove('hidden');
  $('#home').classList.add('hidden');
  $('#mainContent').classList.add('hidden');
  $('#profileCards button')?.focus();
}
const ISLAND_VIEWS = new Set(['islandView','ridesView','collectionView']);
const VIEWS = new Set([...ISLAND_VIEWS,'curriculumView','cardsView','learnView','listenView','spellView','wordView','parentView']);
function showView(id) {
  if (AnimalIsland.isStarting?.() || !state.child || !VIEWS.has(id)) return;
  if (id === 'parentView' && !state.parentUnlocked) {
    if (!$('#parentGate').open) { $('#parentGate').showModal(); $('#cancelParent').focus(); }
    return;
  }
  state.epoch++;
  state.busy = false;
  state.quiz = null;
  state.importPlan = null;
  state.previewEpoch++;
  stopAllSpeech();
  AnimalIsland.leave();
  if (id !== 'parentView') state.parentUnlocked = false;
  state.view = id;
  report();
  document.querySelectorAll('main .panel').forEach((p) => p.classList.toggle('active', p.id === id));
  window.scrollTo(0,0);
  if (ISLAND_VIEWS.has(id)) AnimalIsland.enter(id);
  if (id === 'curriculumView') Curriculum.mount($('#curriculumView'),null);
  if (id === 'parentView') renderParent();
  if (modeForView()) loadQuiz();
  if (state.profile.settings.buttonSpeechOn && ['cardsView','learnView'].includes(id))
    speakSystemText(id === 'cardsView' ? '注音卡' : '認識注音');
}
async function refreshLedger(id = state.child) {
  if (!id || !state.ledger) return;
  try {
    const snapshot = await state.ledger.get(id);
    if (state.child !== id) return;
    state.ticket = snapshot;
    renderProgress();
    if (state.view === 'parentView') renderParentStats();
    const mode = modeForView();
    const round = snapshot.rounds?.[snapshot.activeRounds?.[mode]];
    if (mode && !state.busy && round && state.quiz?.mode === mode
        && (state.quiz.id !== round.id || state.quiz.attemptCount !== round.attemptCount)) drawQuiz(round);
  } catch { if (state.child === id) report('目前無法讀取遊樂券。學習資料已保留。'); }
}
function validWordQuestion(w) {
  if (!w || w.approved !== true || w.verified !== true || w.reviewed !== true || w.enabled === false
      || w.validationStatus !== 'valid' || w.word !== w.speechText || /(?:小|大|標準)$/.test(w.word)) return false;
  const letters = Array.from(w.word);
  const media = state.data.media.find((m) => m.targetType === 'word' && m.targetId === w.id && m.verified === true);
  return Boolean(media && media.imageRef === w.imageRef && w.emojiFallback && w.targetCharacter === letters[w.targetIndex]
    && Array.isArray(w.wordCharacters) && w.wordCharacters.length === letters.length
    && w.wordCharacters.every((c,i) => c.han === letters[i] && /^(?:[ㄅ-ㄩ]{1,3}[ˊˇˋ˙]?|˙[ㄅ-ㄩ]{1,3})$/.test(normalizeZhuyin(c.zhuyin))));
}
function buildVerifiedQuestionPool(mode) {
  const map = new Map(state.data.words.filter(validWordQuestion).map((w) => [w.id,w]));
  return state.data.questions.filter((q) => q.mode === mode && q.verified === true).map((q) => map.get(q.correctAnswerId)).filter(Boolean);
}
async function loadData() {
  const keys = ['zhuyin','characters','words','categories','media','questions'];
  const urls = ['data/zhuyin.json','data/characters.json','data/words.json','data/categories.json','data/media-map.json','data/questions.json'];
  await Promise.all(urls.map(async (url,i) => {
    try {
      const r = await fetch(url + '?v=' + APP_VERSION.version);
      const value = r.ok ? await r.json() : null;
      if (Array.isArray(value) && value.length) state.data[keys[i]] = value;
    } catch { /* embedded symbols still available */ }
  }));
}
function modeForView() {
  if (state.view === 'listenView') return 'listen';
  if (state.view === 'wordView') return 'word';
  if (state.view === 'spellView') return state.profile?.difficulty === 'advanced' ? 'spell:advanced' : 'spell:beginner';
  return null;
}
function itemKey(item) { return item.id ?? item.symbol; }
function poolFor(mode) {
  if (mode === 'listen') return state.data.zhuyin;
  if (mode === 'word') return buildVerifiedQuestionPool('看圖認字');
  return SPELLING_BANK.filter((q) => mode === 'spell:advanced' || q.difficulty === 'beginner');
}
function shuffle(values) {
  const array = [...values];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [array[i],array[j]] = [array[j],array[i]];
  }
  return array;
}
function draft(mode, prior) {
  const pool = poolFor(mode);
  const rest = pool.filter((item) => itemKey(item) !== prior?.question?.item);
  const q = shuffle(rest.length ? rest : pool)[0];
  if (!q || (mode === 'word' && pool.length < 4)) throw new Error('沒有可用的已審核題目');
  let options, correctId;
  if (mode.startsWith('spell:')) {
    const full = mode === 'spell:advanced';
    const correct = makeOption(full ? q.correctZhuyin : q.correctZhuyin[0]);
    const wrong = full
      ? ({'plane-fei':['ㄏㄟ','ㄈㄟˇ','ㄈㄣ'],'mouth-zui':['ㄓㄨㄟˇ','ㄗㄟˇ','ㄗㄨㄟˋ'],'drink-he':['ㄎㄜ','ㄏㄜˊ','ㄏㄟ'],'pants-ku':['ㄎㄨ','ㄍㄨˋ','ㄎㄨˇ']}[q.id]).map(makeOption)
      : shuffle(expectedSymbols.filter((s) => s !== q.correctZhuyin[0])).slice(0,3).map(makeOption);
    options = shuffle([correct,...wrong]).map((option) => ({id:option.id, symbols:option.symbols}));
    correctId = correct.id;
  } else {
    options = shuffle([q,...shuffle(pool.filter((item) => itemKey(item) !== itemKey(q))).slice(0,3)]).map((item) => ({id:itemKey(item)}));
    correctId = itemKey(q);
  }
  return { mode, questionKey:`${mode}:${itemKey(q)}`, correctId, question:{item:itemKey(q),options,release:APP_VERSION.version} };
}
const QUIZ_UI = {listen:['listenChoices','listenFeedback','nextListen','answer'],word:['wordChoices','wordFeedback','nextWord','word'],spell:['spellChoices','spellFeedback','nextSpell','option-id']};
const family = (mode) => mode.split(':')[0];
function quizUI(mode) {
  const [choices,feedback,next,attr] = QUIZ_UI[family(mode)];
  return { choices:$('#'+choices),feedback:$('#'+feedback),next:$('#'+next),attr };
}
function drawQuiz(round) {
  const mode = modeForView();
  if (!round || round.mode !== mode) return;
  const { choices,feedback,next,attr } = quizUI(mode);
  const bank = poolFor(mode);
  const item = bank.find((q) => itemKey(q) === round.question?.item);
  state.quiz = round;
  if (!item || !Array.isArray(round.question.options) || round.question.release !== APP_VERSION.version) {
    choices.textContent = '';
    feedback.textContent = '這一題已不在目前的題庫中。';
    next.hidden = false;
    return;
  }
  if (mode === 'word') {
    $('#picturePrompt').textContent = item.emojiFallback;
    $('#wordHint').textContent = '看圖片，選出正確的詞語';
  } else if (family(mode) === 'spell') {
    const instruction = mode === 'spell:beginner' ? '第一個注音' : '完整注音';
    $('#difficulty').value = state.profile.difficulty;
    $('#spellPrompt').innerHTML = `<div class="spell-layout"><div class="picture">${esc(item.image)}</div><div class="spell-word">${esc(item.word)}</div><div class="target-line">目標字：<strong>${esc(item.targetCharacter)}</strong></div><button class="primary-action" id="listenQuestion" type="button">🔊 聽題目</button><p class="instruction">請選「${esc(item.targetCharacter)}」的${instruction}</p></div>`;
  }
  choices.innerHTML = round.question.options.map((o) => {
    const choice = bank.find((q) => itemKey(q) === o.id);
    const label = mode === 'listen' ? beginnerSymbol(esc(choice?.symbol))
      : mode === 'word' ? (choice?.wordCharacters ? phoneticWord(choice.wordCharacters) : esc(choice?.word))
      : mode === 'spell:beginner' ? beginnerSymbol(esc(o.symbols?.[0])) : verticalSyllable(o.symbols);
    return `<button class="choice${mode === 'word' ? ' word-choice' : ''}" type="button" data-${attr}="${esc(o.id)}" ${round.status !== 'active' ? 'disabled' : ''}>${label}</button>`;
  }).join('');
  next.hidden = round.status === 'active';
  feedback.textContent = round.status === 'completed' ? '⭐ 答對了！' : round.attemptCount ? '🌱 再試一次也很棒。' : '👇 選答案';
}
async function loadQuiz(advance = false) {
  const mode = modeForView();
  if (!mode || state.busy) return;
  const epoch = state.epoch, id = state.child, old = state.quiz;
  const {choices,feedback,next} = quizUI(mode);
  state.busy = true;
  choices.textContent = '';
  next.hidden = true;
  feedback.textContent = '正在準備題目…';
  try {
    const candidate = draft(mode,old);
    if (!state.ledger) throw new Error('目前無法開啟本機題目紀錄。注音卡仍可使用。');
    if (advance && old?.status === 'active' && (old.question?.release !== APP_VERSION.version || !poolFor(mode).some((q) => itemKey(q) === old.question?.item)))
      await state.ledger.abandonRound(id,mode,old.id);
    const result = advance && old ? await state.ledger.advanceRound(id,{...candidate,roundId:old.id}) : await state.ledger.getOrCreateRound(id,candidate);
    if (state.epoch !== epoch) return;
    state.ticket = result.state;
    drawQuiz(result.round);
    renderProgress();
  } catch (e) {
    if (state.epoch === epoch) {
      feedback.textContent = e.message || '目前無法讀取題目，請重新開啟。';
      next.hidden = !old;
    }
  } finally { if (state.epoch === epoch) state.busy = false; }
}
async function answer(optionId) {
  const round = state.quiz, id = state.child, epoch = state.epoch;
  if (!round || round.status !== 'active' || state.busy || !state.ledger) return;
  const {feedback} = quizUI(round.mode);
  state.busy = true;
  try {
    const result = await state.ledger.answer(id,{mode:round.mode,roundId:round.id,attemptId:crypto.randomUUID(),
      expectedAttemptCount:round.attemptCount,optionId});
    if (state.epoch !== epoch) return;
    state.ticket = result.state;
    drawQuiz(result.round);
    renderProgress();
    if (result.correct && !result.duplicate) {
      feedback.textContent = result.awarded ? '⭐ 答對了，獲得 1 張遊樂券！' : '⭐ 答對了！這是複習題。';
      if (state.profile.settings.feedbackSpeechOn) speakSystemText('答對了！');
    } else if (!result.duplicate && state.profile.settings.feedbackSpeechOn) speakSystemText('再試一次也很棒。');
    const minutes = Number(state.profile.settings.restMinutes);
    if (minutes > 0 && Date.now() - state.startedAt > minutes * 60000) {
      report('練習一段時間了，可以休息、喝口水，再回來玩。');
      state.startedAt = Date.now();
    }
  } catch {
    if (state.epoch === epoch) {
      state.busy = false;
      await refreshLedger(id);
      if (state.epoch === epoch) feedback.textContent = '本機題目已更新或尚未儲存，請確認畫面後再作答。';
    }
  } finally { if (state.epoch === epoch) state.busy = false; }
}


function percent(a,b) { return b ? `${Math.round(100*a/b)}%` : '尚無資料'; }
async function renderParentStats() {
  const mount = $('#parentStats');
  if (!mount || state.view !== 'parentView') return;
  const ledger = state.ledger;
  const snapshots = await Promise.all(PROFILES.map(({id}) => ledger?.get(id).catch(() => null) ?? null));
  if (mount !== $('#parentStats') || state.view !== 'parentView') return;
  mount.innerHTML = PROFILES.map(({id},i) => {
    const p = profile(id), snapshot = snapshots[i], stats = snapshot?.stats, who = info(id,snapshot);
    const weak = Object.values(stats?.byMode || {}).flatMap((mode) => Object.entries(mode.byQuestion || {}))
      .filter(([,v]) => v.wrong > 0).sort((a,b) => b[1].wrong-a[1].wrong).slice(0,5)
      .map(([key,value]) => `${key.split(':').at(-1)}（${value.wrong} 次）`).join('、');
    const rides = Object.values(snapshot?.rides || {});
    const kinds = {quiz_credit:'答對發券',quiz_repeat_limit:'複習，不發券',ride_debit:'搭乘扣券',ride_refund:'未開始退款'};
    return `<section class="parent-child"><h3>${who.avatar} ${esc(who.name)}</h3><p>⭐ ${who.stars}｜舊版作答 ${number(p.answers)}｜遊樂券 ${snapshot?.balance ?? '無法讀取'}</p>
      <p>島嶼題數 ${number(stats?.started)}｜首次答對率 ${percent(stats?.firstCorrect,stats?.firstAnswered)}｜重試 ${number(stats?.retries)} 次｜最終完成率 ${percent(stats?.completed,stats?.started)}｜重試後完成率 ${percent((stats?.completed || 0)-(stats?.firstCorrect || 0),(stats?.firstAnswered || 0)-(stats?.firstCorrect || 0))}</p>
      <p>待練習：${esc(weak || '尚無')}｜搭乘 ${rides.filter((x) => ['started','completed'].includes(x.status)).length} 次｜結束 ${rides.filter((x) => x.status === 'completed').length} 次</p>
      <details><summary>遊樂券明細（最近 20 筆）</summary><ul>${(snapshot?.transactions || []).slice(-20).reverse().map((entry) => `<li>${esc(new Date(entry.at).toLocaleString('zh-TW'))}｜${esc(kinds[entry.type] || entry.type)}｜${entry.amount > 0 ? '+' : ''}${esc(entry.amount)}</li>`).join('') || '<li>尚無紀錄</li>'}</ul></details></section>`;
  }).join('');
}
function renderParent() {
  const s = state.profile.settings;
  const check = (id, label) => `<label class="setting-check"><input type="checkbox" data-setting="${id}" ${s[id] ? 'checked' : ''}>${label}</label>`;
  const select = (id,label,options) => `<label>${label} <select data-setting="${id}">${Object.entries(options).map(([value,text])=>`<option value="${value}" ${(id === 'difficulty' ? state.profile.difficulty : s[id]) === value ? 'selected' : ''}>${text}</option>`).join('')}</select></label>`;
  $('#parentBox').innerHTML = `<p>紀錄和暱稱只存在目前的瀏覽器。家長入口用來減少誤觸。</p>
  <section class="parent-section"><h3>目前島友的設定</h3>
    <label>暱稱 <input id="displayName" data-setting="displayName" maxlength="32" value="${esc(s.displayName)}" autocomplete="off" placeholder="留空使用匿名代號"></label>
    <label>語速 <input id="rate" data-setting="rate" type="range" min="0.6" max="1.1" step="0.05" value="${esc(s.rate)}"></label>
    <label>音量 <input id="volume" data-setting="volume" type="range" min="0" max="1" step="0.1" value="${esc(s.volume)}"></label>
    ${check('soundOn','啟用語音與音效')}${check('buttonSpeechOn','學習入口語音')}${check('promptSpeechOn','啟用題目語音')}${check('feedbackSpeechOn','作答回饋語音')}${check('rideSoundOn','設施音效')}${check('reducedMotion','減少動畫')}
    ${select('textSize','文字大小',{standard:'標準',large:'放大',xlarge:'超大'})}${select('zhuyinSize','注音大小',{standard:'標準',large:'放大',xlarge:'超大'})}${select('themeMode','島嶼入口',{auto:'島嶼地圖',simple:'簡潔清單'})}${select('difficulty','拼一拼難度',{beginner:'初級',advanced:'進階'})}
    <label>休息提示（分鐘，0 關閉）<input type="number" min="0" max="60" data-setting="restMinutes" value="${esc(s.restMinutes)}"></label>
  </section><section class="parent-section"><h3>學習與設施</h3><div id="parentStats">正在讀取本機紀錄…</div></section>
  <section class="parent-section"><h3>本機字庫</h3><p>內建：注音 ${state.data.zhuyin.length}、國字 ${state.data.characters.length}、詞語 ${state.data.words.length}。家長新增留在本機，不會直接出題。</p>
  <label>搜尋國字、注音、詞語或分類 <input id="dictionarySearch"></label><div id="dictionaryResults"></div>
  <details><summary>新增國字或詞語</summary><form id="dictionaryForm" class="stack">
    <label>類型 <select name="type"><option value="characters">國字</option><option value="words">詞語</option></select></label>
    <label>國字／詞語 <input name="text" required maxlength="32"></label>
    <label>注音（國字必填） <input name="zhuyin" maxlength="32"></label>
    <label>範例詞語 <input name="sample" maxlength="32"></label>
    <label>分類 <select name="category">${state.data.categories.map((category) => `<option>${esc(category)}</option>`).join('')}</select></label>
    <label>難度 <select name="difficulty"><option value="beginner">初級</option><option value="advanced">進階</option></select></label>
    <label>Emoji <input name="emoji" maxlength="16"></label>
    <label>來源／備註 <input name="source" maxlength="200"></label>
    <button type="submit">儲存到本機字庫</button>
  </form></details><details><summary>查看資料檢查與文件匯入狀態</summary><p>已驗證看圖題 ${buildVerifiedQuestionPool('看圖認字').length} 筆。未驗證的詞語和圖片不出題。DOCX/PDF 解析與掃描 OCR 尚未提供；可使用教材區的待審 JSON。</p></details></section>
  <section class="parent-section" id="parentCurriculum"></section>
  <section class="parent-section">${renderParentBackupPanel()}</section>`;
  renderParentStats();
  renderDictionary();
  Curriculum.mount(null,$('#parentCurriculum'));
}
function renderDictionary() {
  const mount = $('#dictionaryResults');
  if (!mount) return;
  const search = $('#dictionarySearch').value.trim().toLowerCase();
  const records = [...state.data.characters,...state.data.words,...(state.dictionary.characters || []),...(state.dictionary.words || [])];
  const matches = records.filter((row) => [row.han,row.word,normalizeZhuyin(row.zhuyin ?? row.zhuyinText ?? ''),row.category].some((x) => String(x ?? '').toLowerCase().includes(search)));
  mount.innerHTML = matches.slice(0,60).map((row)=>`<article class="dictionary-row"><strong>${esc(row.han || row.word)}</strong><span>${esc(normalizeZhuyin(row.zhuyin ?? row.zhuyinText ?? ''))}</span><span>${esc(row.han ? row.word : row.category)}</span><span>${esc(row.source || '內建字庫')}</span><span>${row.enabled === false ? '停用' : row.reviewed ? '已審核' : '本機待審'}</span></article>`).join('') || '<p>沒有符合的資料。</p>';
}
async function addDictionary(form) {
  if (!state.parentUnlocked || !state.store) return;
  const input = new FormData(form), type = input.get('type'), text = input.get('text').trim(), zhuyin = normalizeZhuyin(input.get('zhuyin'));
  if (!['characters','words'].includes(type) || !text || (type === 'characters' && (!/^\p{Script=Han}$/u.test(text) || !/^(?:[ㄅ-ㄩ]{1,3}[ˊˇˋ˙]?|˙[ㄅ-ㄩ]{1,3})$/.test(zhuyin)))) return report('請填寫國字與有效注音，或選擇新增詞語。');
  const at = new Date().toISOString(), id = `local-${crypto.randomUUID()}`;
  const item = { id, ...(type === 'characters' ? {han:text,word:input.get('sample').trim(),zhuyin:splitZhuyin(zhuyin)} : {word:text}),
    speechText:text, category:input.get('category'), difficulty:input.get('difficulty'), emoji:input.get('emoji').trim(),
    source:input.get('source').trim() || '家長手動新增', reviewed:false, verified:false, enabled:true, status:'PENDING_REVIEW', createdAt:at };
  try {
    await state.store.update((doc) => {
      const key = type === 'characters' ? 'han' : 'word';
      if ([...state.data[type],...(doc.dictionary[type] || [])].some((row) => row[key] === text)) throw new Error('已存在同樣的字詞，資料未變更。');
      (doc.dictionary[type] ??= []).push(item);
      (doc.dictionary.changeLogs ??= []).push({id,at,type:'create-local-item'});
    });
    state.dictionary = local().dictionary;
    form.reset();
    renderDictionary();
    report('已存入本機字庫，尚未加入出題。');
  } catch(e) { report(e.message || '儲存失敗，原資料已保留。'); }
}
async function collectBackup(kind='full') {
  const doc = local();
  const progress = PROFILES.map(({id}) => ({...profile(id),childId:id}));
  const payload = {backupType:kind,app:'zhuyin-island',version:APP_VERSION.version,exportedAt:new Date().toISOString()};
  const dictionary = {...state.data,local:doc.dictionary};
  const includeLedger = ['full','progress','usage'].includes(kind);
  if (includeLedger && (!state.ledger || !state.store)) throw new Error('目前無法讀取完整本機資料，未產生備份。');
  const ledger = includeLedger ? await state.ledger.exportSnapshot() : undefined;
  if (kind === 'full') return {...payload,dictionary,media:state.data.media,questions:state.data.questions,progress,ledger,
    curriculum: JSON.parse(localStorage.getItem('zhuyin-animal-island-curriculum-v1') || 'null'),
    decorations:Object.fromEntries(PROFILES.map(({id}) => [id,localStorage.getItem('zhuyin-island-decor-'+id)])),
    settings:{currentChildId:state.child}};
  if (kind === 'dictionary') return {...payload,dictionary};
  if (kind === 'media') return {...payload,media:state.data.media};
  if (kind === 'progress') return {...payload,progress,ledger};
  return {...payload,usageHistory:progress.map((p) => ({childId:p.childId,recentQuestionIds:p.recentQuestionIds})),ledger};
}
function download(name,body) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([body],{type:'application/json'}));
  link.download = `${name}-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href),2000);
}
function renderParentBackupPanel() {
  return `<h3>備份中心</h3><p>匯入可合併或還原角色的舊版進度、設定及本機字庫。遊樂券交易、教材待審和布置可匯出備查，這個匯入功能會保留它們的現況。</p>
  <div class="tool-grid">${Object.entries({full:'全部資料',dictionary:'字庫',media:'圖片關聯',progress:'角色成績',usage:'使用紀錄'}).map(([id,label]) => `<button type="button" data-export-backup="${id}">匯出${label}</button>`).join('')}</div>
  <label>選擇備份檔 <input id="backupImportFile" type="file" accept="application/json,.json"></label>
  <label>還原方式 <select id="backupImportMode"><option value="merge">合併</option><option value="replace">覆蓋檔內選定項目</option></select></label>
  <button type="button" id="previewBackupImport">預覽匯入摘要</button><div id="backupImportPreview" role="status">尚未選擇備份檔。</div>
  <button type="button" id="applyBackupImport" hidden>備份目前資料後執行</button>
  <details><summary>清除 App 快取</summary><p>只移除本遊戲的離線快取；請在連上網路時使用。</p><button type="button" id="clearAppCache">清除離線快取</button></details>`;
}
async function previewBackupImport() {
  const file = $('#backupImportFile')?.files?.[0], target = $('#backupImportPreview'), button = $('#applyBackupImport');
  state.importPlan = null;
  const token = ++state.previewEpoch;
  const mode = $('#backupImportMode').value;
  button.hidden = true;
  if (!file || file.size > 8*1024*1024) { target.textContent = '請選擇小於 8 MB 的 JSON 備份。'; return; }
  try {
    const data = JSON.parse(await file.text());
    const plan = await IslandStorage.planImport(data,mode,local());
    if (token !== state.previewEpoch || target !== $('#backupImportPreview') || file !== $('#backupImportFile').files[0] || mode !== $('#backupImportMode').value) return;
    state.importPlan = plan;
    const {profiles,dictionary} = plan.summary;
    target.innerHTML = `<p>${esc(file.name)}｜備份 ${esc(data.version)}｜${esc(data.exportedAt)}｜${mode === 'merge' ? '合併' : '覆蓋'}</p>
    <ul>${profiles.map((x)=>`<li>${esc(info(x.id,null).name)}：舊版星星 ${x.beforeStars} → ${x.afterStars}；作答 ${x.beforeAnswers} → ${x.afterAnswers}</li>`).join('')}
    ${dictionary.map((x)=>`<li>${esc({characters:'國字',words:'詞語',candidates:'候選',changeLogs:'紀錄'}[x.key])}：${x.before} → ${x.after} 筆${x.conflicts ? `，${x.conflicts} 筆衝突保留現況` : ''}</li>`).join('')}</ul><p>核心題庫、現有遊樂券、教材和布置保留。</p>`;
    button.hidden = false;
  } catch(e) { if (token !== state.previewEpoch) return; target.textContent = `無法預覽：${e.message}`; }
}
async function applyBackupImport() {
  const plan = state.importPlan, button = $('#applyBackupImport');
  if (!plan || !state.parentUnlocked || !state.store || button.disabled) return;
  if (!confirm(`請確認${plan.mode === 'merge' ? '合併' : '覆蓋'}預覽項目。會先保存並驗證本機 PRE 備份。`)) return;
  button.disabled = true;
  try {
    const pre = await collectBackup();
    if (!state.parentUnlocked || state.importPlan !== plan) return;
    const receipt = await state.store.applyImport(plan,pre);
    download('zhuyin-island-pre',receipt.encoded);
    state.profile = profile(state.child);
    state.dictionary = local().dictionary;
    renderParent();
    renderProgress();
    report(`已完成還原，PRE SHA-256：${receipt.digest}`);
  } catch(e) { report(`還原未完成：${e.message}`); }
  finally { button.disabled = false; }
}
async function clearAppCache() {
  if (!confirm('清除這個遊戲的離線快取？學習紀錄、設定和遊樂券保留。')) return;
  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k)=>['zhuyin-bee-','zhuyin-zoo-','zhuyin-island-'].some((p) => k.startsWith(p))).map((k)=>caches.delete(k)));
    const r = await navigator.serviceWorker?.getRegistration();
    const script = r?.active?.scriptURL || r?.waiting?.scriptURL;
    if (script && new URL(script).pathname === '/service-worker.js' && r.scope === location.origin+'/') await r.unregister();
    report('已清除 App 快取；請在連網時重新開啟。');
  } catch { report('目前無法清除 App 快取。'); }
}
function bind() {
  document.body.addEventListener('click',(e) => {
    const target = e.target.closest('button,.readable');
    if (!target) return;
    if (target.dataset.child) return selectChild(target.dataset.child);
    if (!state.child) return;
    if (target.id === 'switchChild') return chooseChild();
    if (target.id === 'islandHome') return showView('islandView');
    if (target.id === 'unlockParent') {
      $('#parentGate').close();
      state.parentUnlocked = true;
      return showView('parentView');
    }
    if (target.id === 'cancelParent') return $('#parentGate').close();
    if (target.id === 'prevGroup' || target.id === 'nextGroup') {
      state.currentGroupIndex = (state.currentGroupIndex + (target.id === 'prevGroup' ? groupDefs.length-1 : 1)) % groupDefs.length;
      renderCards();
      const index = state.currentGroupIndex;
      return updateProfile((p) => { p.recentGroupIndex = index; });
    }
    if (target.dataset.playZhuyin) return playZhuyinSound(target.dataset.playZhuyin);
    if (target.dataset.playWord) return speakSystemText(target.dataset.playWord);
    if (target.dataset.repeat) return speakSystemText(target.dataset.repeat);
    if (target.classList.contains('readable')) return speakSystemText(target.dataset.speech);
    if (['playPrompt','playExamplePrompt'].includes(target.id) && state.quiz && state.profile.settings.promptSpeechOn) return playZhuyinSound(state.quiz.question.item,target.id === 'playExamplePrompt');
    if (target.id === 'listenQuestion' && state.quiz && state.profile.settings.promptSpeechOn) {
      const item = SPELLING_BANK.find((q)=>q.id===state.quiz.question.item);
      return speakSystemText(item?.word);
    }
    if (['nextListen','nextWord','nextSpell'].includes(target.id)) return loadQuiz(true);
    const mode = modeForView();
    if (mode) {
      const ui = quizUI(mode);
      if (ui.choices.contains(target) && target.hasAttribute('data-'+ui.attr)) return answer(target.getAttribute('data-'+ui.attr));
    }
    if (!state.parentUnlocked || state.view !== 'parentView') return;
    if (target.dataset.exportBackup) {
      const kind = target.dataset.exportBackup;
      return collectBackup(kind).then((data)=>download(`zhuyin-island-${kind}`,JSON.stringify(data,null,2))).catch(()=>report('無法完成備份。'));
    }
    if (target.id === 'previewBackupImport') return previewBackupImport();
    if (target.id === 'applyBackupImport') return applyBackupImport();
    if (target.id === 'clearAppCache') return clearAppCache();
  });
  $('#parentBox').addEventListener('input',(e) => { if (e.target.id === 'dictionarySearch') renderDictionary(); });
  $('#parentBox').addEventListener('submit',(e) => { if (e.target.id === 'dictionaryForm') { e.preventDefault(); addDictionary(e.target); } });
  document.body.addEventListener('change',async (e) => {
    const t = e.target, id = state.child;
    if (!id) return;
    if (t.id === 'backupImportFile' || t.id === 'backupImportMode') {
      state.importPlan = null;
      state.previewEpoch++;
      $('#applyBackupImport').hidden = true;
      $('#backupImportPreview').textContent = '請重新預覽。';
    }
    if (t.id === 'difficulty' || (t.dataset.setting && state.parentUnlocked)) {
      const key = t.dataset.setting || 'difficulty';
      const value = t.type === 'checkbox' ? t.checked : ['volume','rate','restMinutes'].includes(key) ? Number(t.value) : t.value;
      await updateProfile((p) => {
        if (key === 'difficulty') p.difficulty = value === 'advanced' ? 'advanced' : 'beginner';
        else p.settings = {...p.settings,[key]:value};
      });
      if (state.child !== id) return;
      if (key === 'difficulty' && state.view === 'spellView') showView('spellView');
      if (key === 'displayName' && state.view === 'parentView') { renderProfiles(); renderParentStats(); }
      if (key === 'soundOn' && !value) stopAllSpeech();
    }
  });
  window.addEventListener('storage',(e) => {
    if (e.key === IslandStorage.KEY && state.child) {
      state.profile = profile(state.child);
      state.dictionary = local().dictionary;
      renderProgress();
    }
  });
  document.addEventListener('visibilitychange',() => {
    if (document.hidden) stopAllSpeech();
    else refreshLedger();
  });
  window.addEventListener('pagehide',stopAllSpeech);
}
function registerServiceWorker() {
  if (!navigator.serviceWorker) return;
  let reloadForUpdate = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadForUpdate) { reloadForUpdate = false; location.reload(); }
    else if ($('#updatePrompt')) $('#updatePrompt').textContent = '新版已就緒。請重新整理套用。';
  });
  const prompt = (r) => {
    if ($('#updatePrompt')) return;
    const bar = document.createElement('div');
    bar.id = 'updatePrompt';
    bar.className = 'update-prompt';
    bar.innerHTML = '<span>注音動物島有新版可以更新。</span><button type="button" id="updateNow">立即更新</button>';
    document.body.append(bar);
    $('#updateNow').onclick = () => { reloadForUpdate = true; r.waiting?.postMessage({type:'SKIP_WAITING'}); };
  };
  navigator.serviceWorker.register('/service-worker.js',{updateViaCache:'none'}).then((r) => {
    if (r.waiting && navigator.serviceWorker.controller) prompt(r);
    r.addEventListener('updatefound',()=>r.installing?.addEventListener('statechange',(e) => {
      if (e.target.state === 'installed' && navigator.serviceWorker.controller && r.waiting) prompt(r);
    }));
  }).catch(()=>report('這次未能安裝離線資源，連網時可繼續練習。'));
}
async function init() {
  const [store,ledger] = await Promise.allSettled([IslandStorage.open(),TicketLedger.open(),loadData()]);
  state.store = store.status === 'fulfilled' ? store.value : null;
  state.ledger = ledger.status === 'fulfilled' ? ledger.value : null;
  state.dictionary = local().dictionary;
  $('#appTitle').innerHTML = ruby(textBank.title);
  $('#versionLine').textContent = `${APP_VERSION.version}｜${APP_VERSION.modifiedAt}`;
  AnimalIsland.init({navigate:showView,getProfile:info,getChildId:()=>state.child,getSettings:()=>state.profile?.settings,
    getBalance:()=>state.ticket?.balance ?? null,ledger:state.ledger,onBalanceChange:()=>refreshLedger()});
  state.ledger?.subscribe((id) => { if (id === state.child) refreshLedger(id); });
  renderProfiles();
  bind();
  if (state.store?.remembered) await selectChild(state.store.remembered);
  if (!state.store || !state.ledger) report('部分本機儲存無法開啟，請由家長檢查瀏覽器設定。');
  registerServiceWorker();
}
init().catch(()=>report('無法開啟注音動物島。請重新載入或由家長檢查裝置。'));
