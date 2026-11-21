const fs=require('fs');const h=fs.readFileSync(process.argv[2],'utf8');let js=h.split('<script>')[1].split('</script>')[0];
const pre=fs.readFileSync('tests/audit2.js','utf8').split('\n').slice(2,4).join('\n'); eval(pre);
js=js.replace(/\nfixState\(\); applyTheme\(\);[\s\S]*$/,"\n");
eval(js+`
buildRecipes([]);
const iba=JSON.parse(fs.readFileSync('data/iba.json','utf8')); const ver=JSON.parse(fs.readFileSync('data/verif.json','utf8'));
const ibaIds=new Set(Object.keys(JSON.parse(fs.readFileSync('data/ibapairs.json','utf8'))).length?Object.values(JSON.parse(fs.readFileSync('data/ibapairs.json','utf8'))):[]);
global.OUT={RECS:RECS.map(r=>({id:r.id,n:r.n,c:r.c,s:r.s,cr:r.cr,na:r.na,h:r.h,nt:r.n2||r.nt||r.tip,m:r.m,g:r.g,ice:r.ice,gar:r.gar,ing:r.ing.map(i=>[i.id,i.q,i.u,i.r])})),ING, ibaKeys:Object.keys(iba).slice(0,3), verKeys:Object.keys(ver).slice(0,3), ibapairsSample:JSON.stringify(JSON.parse(fs.readFileSync('data/ibapairs.json','utf8'))).slice(0,300)};
`);
fs.writeFileSync(process.argv[3],JSON.stringify(OUT));
