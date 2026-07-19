const fs = require('fs');
const app = fs.readFileSync('public/src/app.js','utf8');
for (const s of ['function parseZhuyinSyllable','zhuyin-symbols','zhuyin-tone']) if (!app.includes(s)) throw new Error(`missing tone renderer: ${s}`);
const css = fs.readFileSync('public/src/styles.css','utf8');
for (const s of ['.zhuyin-group','.zhuyin-symbols','.zhuyin-tone','.zhuyin-group.tone-2','.zhuyin-group.tone-3','.zhuyin-group.tone-4','.zhuyin-group.tone-light']) if (!css.includes(s)) throw new Error(`missing tone CSS: ${s}`);
const cases = ['ㄇㄚ','ㄇㄚˊ','ㄇㄚˇ','ㄇㄚˋ','ㄇㄚ˙','ㄎㄢˋ','ㄕㄨㄟˇ','ㄊㄨˊ','ㄗˋ'];
for (const value of cases) if (!/[ㄅ-ㄦ]/.test(value)) throw new Error(`bad case ${value}`);
console.log(`Zhuyin tone validation passed. cases=${cases.length}`);
