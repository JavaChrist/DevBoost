// Validation rapide : on teste que des solutions de référence passent les
// tests JSON pour chaque NOUVEAU challenge ajouté. Permet d'éviter qu'un
// utilisateur reste bloqué sur un test impossible.
import { executeCode } from '../src/lib/runner/runner.core.js';
import css from '../src/data/cards/css.json' with { type: 'json' };
import js from '../src/data/cards/javascript.json' with { type: 'json' };
import react from '../src/data/cards/react.json' with { type: 'json' };
import algo from '../src/data/cards/algo.json' with { type: 'json' };

const SOLUTIONS = {
  // CSS
  specificity: `function specificity(s){const i=(s.match(/#[\\w-]+/g)||[]).length;const c=(s.match(/\\.[\\w-]+|\\[[^\\]]+\\]|:[\\w-]+/g)||[]).length;const e=s.split(/\\s+|[>+~]/).filter(t=>t&&!/^[#.\\[:]/.test(t)).length;return [i,c,e];}`,
  pxToRem: `function pxToRem(px,base=16){return (px/base)+'rem';}`,
  parseColor: `function parseColor(h){h=h.slice(1);if(h.length===3)h=h.split('').map(c=>c+c).join('');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}`,
  contrastRatio: `function contrastRatio(a,b){const L=([r,g,b])=>(0.299*r+0.587*g+0.114*b)/255;const l1=L(a),l2=L(b);const r=(Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);return Math.round(r*100)/100;}`,
  // JS
  reverse: `function reverse(s){return [...s].reverse().join('');}`,
  flatten: `function flatten(arr){return [].concat(...arr);}`,
  groupBy: `function groupBy(arr,key){return arr.reduce((a,it)=>{const k=it[key];(a[k]=a[k]||[]).push(it);return a;},{});}`,
  chunk: `function chunk(arr,size){const r=[];for(let i=0;i<arr.length;i+=size)r.push(arr.slice(i,i+size));return r;}`,
  // React
  updateAt: `function updateAt(arr,i,v){return arr.map((x,j)=>j===i?v:x);}`,
  classNames: `function classNames(...a){return a.filter(Boolean).join(' ');}`,
  removeById: `function removeById(arr,id){return arr.filter(x=>x.id!==id);}`,
  mergeProps: `function mergeProps(d,o){const out={...d};for(const k in o)if(o[k]!==null)out[k]=o[k];return out;}`,
  // Algo
  findMax: `function findMax(arr){let m=arr[0];for(const x of arr)if(x>m)m=x;return m;}`,
  isPalindrome: `function isPalindrome(s){const x=s.toLowerCase().replace(/\\s/g,'');return x===[...x].reverse().join('');}`,
  binarySearch: `function binarySearch(arr,t){let lo=0,hi=arr.length-1;while(lo<=hi){const m=Math.floor((lo+hi)/2);if(arr[m]===t)return m;if(arr[m]<t)lo=m+1;else hi=m-1;}return -1;}`,
  fibMemo: `function fibMemo(n,memo={}){if(n<2)return n;if(memo[n]!==undefined)return memo[n];memo[n]=fibMemo(n-1,memo)+fibMemo(n-2,memo);return memo[n];}`,
};

function fnNameFromPrompt(card) {
  const m = card.starterCode.match(/function\s+([A-Za-z_$][\w$]*)/);
  return m ? m[1] : null;
}

let total = 0;
let failed = 0;

for (const cards of [css, js, react, algo]) {
  for (const c of cards.filter((c) => c.type === 'challenge')) {
    const name = fnNameFromPrompt(c);
    const sol = SOLUTIONS[name];
    if (!sol) {
      console.log(`SKIP ${name} (pas de solution de référence)`);
      continue;
    }
    total++;
    const report = executeCode(sol, c.tests);
    if (report.failed > 0) {
      failed++;
      console.log(`FAIL ${name} : ${report.failed}/${report.total}`);
      for (const r of report.results.filter((r) => !r.ok)) {
        console.log(`  - ${r.label}: attendu ${JSON.stringify(r.expected)}, reçu ${JSON.stringify(r.actual ?? r.error)}`);
      }
    } else {
      console.log(`OK   ${name} (${report.passed}/${report.total})`);
    }
  }
}

console.log(`\n${total - failed}/${total} challenges validés`);
process.exit(failed === 0 ? 0 : 1);
