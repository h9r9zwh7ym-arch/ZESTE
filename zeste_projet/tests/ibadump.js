// Affiche côte à côte la recette IBA et la recette Zeste correspondante.
// usage : node tests/ibadump.js [filtre]
const d=require('./load.js')(),iba=require('../data/iba.json').cocktails,man=require('../data/ibapairs.json');
const norm=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const ING={};d.ING_RAW.forEach(i=>ING[i[0]]=i[1]);
const byN={};d.REC_RAW.forEach(r=>{byN[norm(r[1])]=byN[norm(r[1])]||r[0];byN[norm(r[0])]=byN[norm(r[0])]||r[0]});
const RM={};d.REC_RAW.forEach(r=>RM[r[0]]=r);
const f=(process.argv[2]||'').toLowerCase();
const U={d:'trait',f:'feuille',u:'unité',bs:'c. de bar'};
for(const c of iba){
  const id=man[c.title]||byN[norm(c.title)];
  if(f&&!c.title.toLowerCase().includes(f)&&id!==f)continue;
  console.log('=== '+c.title+'  →  '+(id||'ABSENT'));
  console.log('IBA  : '+c.ingredients.join(' | '));
  console.log('       '+c.method);
  console.log('       garn: '+c.garnish);
  const r=RM[id];
  if(r){
    console.log('ZESTE: '+r[3]+' / '+r[4]+' / glace '+r[5]+' : '+r[7].map(([i,q,u,ro])=>`${q}${u&&u!='ml'?' '+(U[u]||u):' ml'} ${ING[i]||'?'+i}${ro?' ('+ro+')':''}`).join(' | '));
    console.log('       garn: '+r[8]);
    const o=r[9]||{};if(o.n)console.log('       n: '+o.n);if(o.h)console.log('       h: '+o.h);
  }
  console.log();
}
