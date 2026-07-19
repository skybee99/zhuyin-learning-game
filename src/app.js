const STORAGE_KEY = 'zhuyinBeeProgressV1';

const symbols = [
  { symbol: 'ㄅ', sound: 'ㄅ', word: '爸', emoji: '👨', audio: 'assets/audio/bo.mp3' },
  { symbol: 'ㄆ', sound: 'ㄆ', word: '泡', emoji: '🫧', audio: 'assets/audio/po.mp3' },
  { symbol: 'ㄇ', sound: 'ㄇ', word: '馬', emoji: '🐴', audio: 'assets/audio/mo.mp3' },
  { symbol: 'ㄈ', sound: 'ㄈ', word: '飛', emoji: '🪽', audio: 'assets/audio/fo.mp3' },
  { symbol: 'ㄉ', sound: 'ㄉ', word: '燈', emoji: '💡', audio: 'assets/audio/de.mp3' },
  { symbol: 'ㄊ', sound: 'ㄊ', word: '兔', emoji: '🐰', audio: 'assets/audio/te.mp3' },
  { symbol: 'ㄋ', sound: 'ㄋ', word: '鳥', emoji: '🐦', audio: 'assets/audio/ne.mp3' },
  { symbol: 'ㄌ', sound: 'ㄌ', word: '鹿', emoji: '🦌', audio: 'assets/audio/le.mp3' },
  { symbol: 'ㄧ', sound: 'ㄧ', word: '衣', emoji: '👕', audio: 'assets/audio/yi.mp3' },
  { symbol: 'ㄨ', sound: 'ㄨ', word: '屋', emoji: '🏠', audio: 'assets/audio/wu.mp3' },
  { symbol: 'ㄩ', sound: 'ㄩ', word: '魚', emoji: '🐟', audio: 'assets/audio/yu.mp3' },
  { symbol: 'ㄚ', sound: 'ㄚ', word: '花', emoji: '🌸', audio: 'assets/audio/a.mp3' }
];

const wordItems = symbols.map(({ word, emoji, sound }) => ({ word, emoji, sound }));
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
  const recordingPlayed = await playRecording(item.audio);
  if (!recordingPlayed) speak(item.sound || item.symbol || item.word);
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
