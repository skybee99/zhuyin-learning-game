const STORAGE_KEY = 'zhuyinBeeProgressV1';

const AUDIO_MANIFEST_URL = 'assets/audio/audio-manifest.json';
let audioManifest = null;

const symbols = [
  { symbol: 'ㄅ', sound: 'ㄅ', word: '爸', emoji: '👨', audioKey: 'ㄅ' },
  { symbol: 'ㄆ', sound: 'ㄆ', word: '泡', emoji: '🫧', audioKey: 'ㄆ' },
  { symbol: 'ㄇ', sound: 'ㄇ', word: '馬', emoji: '🐴', audioKey: 'ㄇ' },
  { symbol: 'ㄈ', sound: 'ㄈ', word: '飛', emoji: '🪽', audioKey: 'ㄈ' },
  { symbol: 'ㄉ', sound: 'ㄉ', word: '燈', emoji: '💡', audioKey: 'ㄉ' },
  { symbol: 'ㄊ', sound: 'ㄊ', word: '兔', emoji: '🐰', audioKey: 'ㄊ' },
  { symbol: 'ㄋ', sound: 'ㄋ', word: '鳥', emoji: '🐦', audioKey: 'ㄋ' },
  { symbol: 'ㄌ', sound: 'ㄌ', word: '鹿', emoji: '🦌', audioKey: 'ㄌ' },
  { symbol: 'ㄍ', sound: 'ㄍ', word: '狗', emoji: '🐶', audioKey: 'ㄍ' },
  { symbol: 'ㄎ', sound: 'ㄎ', word: '口', emoji: '👄', audioKey: 'ㄎ' },
  { symbol: 'ㄏ', sound: 'ㄏ', word: '河', emoji: '🏞️', audioKey: 'ㄏ' },
  { symbol: 'ㄐ', sound: 'ㄐ', word: '雞', emoji: '🐔', audioKey: 'ㄐ' },
  { symbol: 'ㄑ', sound: 'ㄑ', word: '旗', emoji: '🚩', audioKey: 'ㄑ' },
  { symbol: 'ㄒ', sound: 'ㄒ', word: '西', emoji: '🌅', audioKey: 'ㄒ' },
  { symbol: 'ㄓ', sound: 'ㄓ', word: '竹', emoji: '🎋', audioKey: 'ㄓ' },
  { symbol: 'ㄔ', sound: 'ㄔ', word: '車', emoji: '🚗', audioKey: 'ㄔ' },
  { symbol: 'ㄕ', sound: 'ㄕ', word: '書', emoji: '📖', audioKey: 'ㄕ' },
  { symbol: 'ㄖ', sound: 'ㄖ', word: '日', emoji: '☀️', audioKey: 'ㄖ' },
  { symbol: 'ㄗ', sound: 'ㄗ', word: '字', emoji: '🔤', audioKey: 'ㄗ' },
  { symbol: 'ㄘ', sound: 'ㄘ', word: '草', emoji: '🌱', audioKey: 'ㄘ' },
  { symbol: 'ㄙ', sound: 'ㄙ', word: '傘', emoji: '☂️', audioKey: 'ㄙ' },
  { symbol: 'ㄧ', sound: 'ㄧ', word: '衣', emoji: '👕', audioKey: 'ㄧ' },
  { symbol: 'ㄨ', sound: 'ㄨ', word: '屋', emoji: '🏠', audioKey: 'ㄨ' },
  { symbol: 'ㄩ', sound: 'ㄩ', word: '魚', emoji: '🐟', audioKey: 'ㄩ' },
  { symbol: 'ㄚ', sound: 'ㄚ', word: '鴨', emoji: '🦆', audioKey: 'ㄚ' },
  { symbol: 'ㄛ', sound: 'ㄛ', word: '喔', emoji: '⭕', audioKey: 'ㄛ' },
  { symbol: 'ㄜ', sound: 'ㄜ', word: '鵝', emoji: '🪿', audioKey: 'ㄜ' },
  { symbol: 'ㄝ', sound: 'ㄝ', word: '欸', emoji: '🙋', audioKey: 'ㄝ' },
  { symbol: 'ㄞ', sound: 'ㄞ', word: '愛', emoji: '❤️', audioKey: 'ㄞ' },
  { symbol: 'ㄟ', sound: 'ㄟ', word: '杯', emoji: '🥤', audioKey: 'ㄟ' },
  { symbol: 'ㄠ', sound: 'ㄠ', word: '凹', emoji: '🕳️', audioKey: 'ㄠ' },
  { symbol: 'ㄡ', sound: 'ㄡ', word: '藕', emoji: '🪷', audioKey: 'ㄡ' },
  { symbol: 'ㄢ', sound: 'ㄢ', word: '安', emoji: '🛏️', audioKey: 'ㄢ' },
  { symbol: 'ㄣ', sound: 'ㄣ', word: '恩', emoji: '🙏', audioKey: 'ㄣ' },
  { symbol: 'ㄤ', sound: 'ㄤ', word: '羊', emoji: '🐑', audioKey: 'ㄤ' },
  { symbol: 'ㄥ', sound: 'ㄥ', word: '風', emoji: '🌬️', audioKey: 'ㄥ' },
  { symbol: 'ㄦ', sound: 'ㄦ', word: '兒', emoji: '🧒', audioKey: 'ㄦ' },
];

const wordItems = symbols.map(({ word, emoji, sound, symbol }) => ({ word, emoji, sound, symbol }));
let progress = loadProgress();
let currentListen = symbols[0];
let currentWord = wordItems[0];

const $ = (selector) => document.querySelector(selector);

function loadProgress() {
  try {
    return { stars: 0, answers: 0, lastPlayedAt: '', ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return { stars: 0, answers: 0, lastPlayedAt: '' };
  }
}

function saveProgress() {
  progress.lastPlayedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  renderProgress();
}

function renderProgress() {
  $('#starsCount').textContent = String(progress.stars);
  $('#answersCount').textContent = String(progress.answers);
  $('#lastPlayed').textContent = progress.lastPlayedAt
    ? `最後練習時間：${new Date(progress.lastPlayedAt).toLocaleString('zh-TW')}`
    : '尚未開始練習。';
}

async function playSound(item) {
  const audioItem = await getAudioItem(item);
  const recordingPlayed = audioItem?.status === 'recorded' && await playRecording(`${audioManifest.basePath}${audioItem.file}`);
  showAudioNotice(recordingPlayed, item);
  if (!recordingPlayed) speak(item.word || item.symbol);
}

async function getAudioManifest() {
  if (audioManifest) return audioManifest;
  const response = await fetch(AUDIO_MANIFEST_URL);
  audioManifest = await response.json();
  return audioManifest;
}

async function getAudioItem(item) {
  try {
    const manifest = await getAudioManifest();
    return manifest.items[item.audioKey || item.symbol];
  } catch {
    return null;
  }
}

function showAudioNotice(recordingPlayed, item) {
  const message = recordingPlayed
    ? `正在播放 ${item.symbol} 的真人錄音。`
    : `${item.symbol} 目前沒有真人錄音，改用瀏覽器語音合成唸例字「${item.word}」作為備援，不代表標準單一注音發音。`;
  const notice = $('#audioNotice');
  if (notice) notice.textContent = message;
}

function playRecording(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(false);
    const audio = new Audio(src);
    audio.addEventListener('ended', () => resolve(true), { once: true });
    audio.addEventListener('error', () => resolve(false), { once: true });
    audio.play().catch(() => resolve(false));
  });
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-TW';
  utterance.rate = 0.72;
  utterance.pitch = 1.15;
  window.speechSynthesis.speak(utterance);
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function makeChoices(correct, pool, key, count = 4) {
  const others = shuffle(pool.filter((item) => item[key] !== correct[key])).slice(0, count - 1);
  return shuffle([correct, ...others]);
}

function reward(feedbackElement, message) {
  progress.stars += 1;
  progress.answers += 1;
  saveProgress();
  feedbackElement.textContent = `答對了！${message} ⭐`;
}

function miss(feedbackElement, answer) {
  progress.answers += 1;
  saveProgress();
  feedbackElement.textContent = `再試一次，正確答案是 ${answer}。`;
}

function renderCards() {
  $('#symbolCards').innerHTML = symbols.map((item) => `
    <button class="symbol-card" type="button" data-symbol="${item.symbol}" aria-label="播放 ${item.symbol} 的發音">
      <span class="symbol">${item.symbol}</span>
      <span class="sample">${item.emoji} ${item.word}</span>
      <span class="audio-state">真人錄音待補，將使用備援</span>
    </button>
  `).join('');
  $('#symbolCards').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-symbol]');
    if (!button) return;
    const item = symbols.find((entry) => entry.symbol === button.dataset.symbol);
    playSound(item);
  });
}

function renderListenQuiz() {
  currentListen = symbols[Math.floor(Math.random() * symbols.length)];
  $('#listenChoices').innerHTML = makeChoices(currentListen, symbols, 'symbol').map((item) => `
    <button class="choice" type="button" data-answer="${item.symbol}">${item.symbol}</button>
  `).join('');
}

function renderWordQuiz() {
  currentWord = wordItems[Math.floor(Math.random() * wordItems.length)];
  $('#picturePrompt').textContent = currentWord.emoji;
  $('#wordHint').textContent = `聽起來像：${currentWord.sound}`;
  $('#wordChoices').innerHTML = makeChoices(currentWord, wordItems, 'word').map((item) => `
    <button class="choice" type="button" data-word="${item.word}">${item.word}</button>
  `).join('');
}

function bindNavigation() {
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.panel').forEach((panel) => panel.classList.remove('active'));
      document.getElementById(button.dataset.view).classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function bindQuizzes() {
  $('#playPrompt').addEventListener('click', () => playSound(currentListen));
  $('#listenChoices').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-answer]');
    if (!button) return;
    if (button.dataset.answer === currentListen.symbol) {
      reward($('#listenFeedback'), `這是 ${currentListen.symbol}`);
      renderListenQuiz();
    } else {
      miss($('#listenFeedback'), currentListen.symbol);
    }
  });
  $('#wordChoices').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-word]');
    if (!button) return;
    if (button.dataset.word === currentWord.word) {
      reward($('#wordFeedback'), `這是「${currentWord.word}」`);
      renderWordQuiz();
    } else {
      miss($('#wordFeedback'), currentWord.word);
    }
  });
  $('#resetProgress').addEventListener('click', () => {
    progress = { stars: 0, answers: 0, lastPlayedAt: '' };
    localStorage.removeItem(STORAGE_KEY);
    renderProgress();
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }
}

renderProgress();
renderCards();
renderListenQuiz();
renderWordQuiz();
bindNavigation();
bindQuizzes();
registerServiceWorker();
