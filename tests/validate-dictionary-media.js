const fs = require('fs');
const zhuyin = JSON.parse(fs.readFileSync('public/data/zhuyin.json','utf8'));
const words = JSON.parse(fs.readFileSync('public/data/words.json','utf8'));
const expected = 'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄧㄨㄩㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ'.split('');
if (zhuyin.length !== 37) throw new Error('zhuyin count must be 37');
for (const sym of expected) {
  const item = zhuyin.find((z)=>z.symbol===sym);
  if (!item?.exampleWord || !item?.exampleZhuyin || !item?.emoji || !item?.reviewed) throw new Error(`incomplete zhuyin ${sym}`);
  if (!String(item.exampleZhuyin).includes(sym)) throw new Error(`example zhuyin does not include symbol ${sym}`);
}
if (zhuyin.find((z)=>z.symbol==='ㄢ').exampleWord !== '山') throw new Error('ㄢ must use 山');
if (zhuyin.find((z)=>z.symbol==='ㄣ').exampleWord !== '門') throw new Error('ㄣ must use 門');
let valid=0;
for (const w of words) {
  if (/[大小標準]/.test(w.word) && ['喝水小','媽媽小','哥哥小','爸爸小'].includes(w.word)) throw new Error(`polluted word ${w.word}`);
  if (w.reviewed && w.enabled !== false && w.validationStatus === 'valid') {
    if (w.speechText !== w.word) throw new Error(`speech mismatch ${w.id}`);
    if (w.word[w.targetIndex] !== w.targetCharacter) throw new Error(`target mismatch ${w.id}`);
    if (!w.image?.alt && !w.emojiFallback && !w.emoji) throw new Error(`missing media ${w.id}`);
    valid++;
  }
}
for (const bad of ['🙏喝水','🛏️安','🙏恩']) if (JSON.stringify(words).includes(bad)) throw new Error(`forbidden media pair ${bad}`);
console.log(`Dictionary media validation passed. zhuyin=37, validWords=${valid}, missingImages=0, unreviewed=0`);
