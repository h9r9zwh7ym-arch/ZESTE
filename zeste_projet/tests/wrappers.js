// Enveloppes perdues (1.70) : une fonction ou une action (ACT.x) enveloppée par une version, puis réécrite entièrement par une
// version plus récente sans appeler la précédente, perd en silence l'ajout de l'enveloppe (bug « créations à tester » 1.59 → 1.70).
// Le test échoue sur tout nouveau cas ; les remplacements voulus sont listés ci-dessous avec leur raison.
// usage (depuis zeste_projet/) : NODE_PATH=$(npm root -g) node tests/wrappers.js
const VOULU={
  "labScore@v165.js":"barème v2 continu (1.61) remplace l'ancien barème",
  "labScore@v166.js":"barème v3 (1.62) remplace le v2 ; le décor est hors note dans v3",
  "labSummary@v166.js":"résumé v3 : exclut déjà le décor",
  "tonightRaw@v161.js":"moteur 1.59 ; le filtre « créations à tester » est rétabli par v174",
  "reasons@v161.js":"explications 1.59 ; « Pour finir … ouvert » rétabli par v174",
  "ACT.mixq@v168.js":"« + » des quantités muet à la demande (1.63)",
  "ACT.mixadd1@v164.js":"labPour joue le son de versement","ACT.mixfix@v164.js":"labPour joue le son de versement",
  "ACT.mixpour@v164.js":"labPour joue le son de versement","ACT.mixfit@v164.js":"son rétabli par v174",
  "ACT.mixice@v141.js":"joue lui-même le son de la glace","ACT.setfx@ui_final.js":"joue lui-même le son (1.70)",
  "ACT.advdo@v117.js":"son rétabli par v174","ACT.mapfs@v117.js":"openMapFS joue le souffle","ACT.mapclose@v117.js":"son rétabli par v174"
};
const ts=require('typescript'),fs=require('fs');
const order=fs.readFileSync('build.sh','utf8').split('cd src; cat ')[1].split(';')[0].trim().split(/\s+/);
const ev={}; // name -> [{file,kind,line}]
for(const f of order){ const src=fs.readFileSync('src/'+f,'utf8'); const sf=ts.createSourceFile(f,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const caps={}; // alias -> F (captures dans ce fichier)
  const visit=(n,depth)=>{
    if(ts.isVariableDeclaration(n)&&n.initializer&&ts.isIdentifier(n.initializer)&&ts.isIdentifier(n.name)) caps[n.name.text]=n.initializer.text;
    if(ts.isFunctionDeclaration(n)&&n.name&&depth===0) (ev[n.name.text]=ev[n.name.text]||[]).push({f,kind:"decl",line:sf.getLineAndCharacterOfPosition(n.getStart()).line+1});
    if(ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.EqualsToken&&ts.isIdentifier(n.left)&&(ts.isFunctionExpression(n.right)||ts.isArrowFunction(n.right))){
      const F=n.left.text; const body=n.right.getText(); const al=Object.keys(caps).filter(a=>caps[a]===F);
      const wraps=al.some(a=>new RegExp("\\b"+a.replace(/\$/g,"\\$")+"\\b").test(body)) || /\b(apply|call)\b/.test(body)&&al.length>0;
      (ev[F]=ev[F]||[]).push({f,kind:wraps?"wrap":"replace",line:sf.getLineAndCharacterOfPosition(n.getStart()).line+1}); }
    ts.forEachChild(n,c=>visit(c,depth+((ts.isFunctionDeclaration(n)||ts.isFunctionExpression(n)||ts.isArrowFunction(n))?1:0))); };
  sf.statements.forEach(s=>visit(s,0)); }
const found=[];
for(const F in ev){ const L=ev[F]; for(let i=0;i<L.length;i++){ if(L[i].kind!=="replace") continue; const lost=L.slice(0,i).filter(x=>x.kind==="wrap"); if(lost.length) found.push([F+"@"+L[i].f, lost.map(x=>x.f+":"+x.line).join(", ")]); } }
// actions ACT : enveloppes dynamiques W("k") / [..].forEach(W) / const _x=ACT.k ; remplacements ACT.k=… ou Object.assign(ACT,{k:…})
const actEv={};
order.forEach((f,idx)=>{ const s=fs.readFileSync('src/'+f,'utf8'); const add=(k,kind)=>(actEv[k]=actEv[k]||[]).push({idx,f,kind});
  for(const m of s.matchAll(/\bW\(\s*"([a-z0-9_]+)"/g)) add(m[1],"wrap");
  for(const m of s.matchAll(/\[((?:"[a-z0-9_]+",?)+)\]\.forEach\(W\)/g)) for(const k of m[1].match(/[a-z0-9_]+/g)) add(k,"wrap");
  const caps={}; for(const m of s.matchAll(/const\s+(_?\w+)\s*=\s*ACT\.([a-z0-9_]+)\s*;/g)) caps[m[1]]=m[2];
  for(const m of s.matchAll(/ACT\.([a-z0-9_]+)\s*=\s*(?:\(|function|async|[a-z]\s*=>)/g)){ const k=m[1], seg=s.slice(m.index+m[0].length,m.index+m[0].length+600);
    add(k,Object.entries(caps).some(([a,v])=>v===k&&new RegExp("\\b"+a+"\\b").test(seg))?"wrap":"replace"); }
  for(const m of s.matchAll(/Object\.assign\(ACT,\s*\{/g)){ let i=m.index+m[0].length, d=1, j=i; while(j<s.length&&d>0){ const c=s[j]; if(c==="{"||c==="("||c==="[") d++; else if(c==="}"||c===")"||c==="]") d--; if(d===1){ const mm=/^[\s,]*([a-z0-9_]+)\s*:/.exec(s.slice(j,j+40)); if(mm&&(s[j]===","||j===i)) add(mm[1],"replace"); } j++; } }
});
for(const k in actEv){ const L=actEv[k].sort((a,b)=>a.idx-b.idx); for(let i=0;i<L.length;i++){ if(L[i].kind!=="replace") continue; const lost=L.slice(0,i).filter(x=>x.kind==="wrap"&&x.idx<L[i].idx); if(lost.length) found.push(["ACT."+k+"@"+L[i].f, lost.map(x=>x.f).join(", ")]); } }
const neu=found.filter(([k])=>!VOULU[k]), stale=Object.keys(VOULU).filter(k=>!found.some(([f])=>f===k));
if(neu.length) console.log("ÉCHEC enveloppes perdues :\n  "+neu.map(([k,l])=>k+" (perd "+l+")").join("\n  "));
if(stale.length) console.log("  (exceptions devenues inutiles : "+stale.join(", ")+")");
if(!neu.length) console.log("Enveloppes : aucune perdue ("+found.length+" remplacements voulus et documentés).");
process.exitCode=neu.length?1:0;
