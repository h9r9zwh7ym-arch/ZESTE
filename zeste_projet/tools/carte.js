// Carte du code (1.84) : écrit CARTE.md à partir des sources, dans l'ordre de chargement (src/ORDRE).
// Pour chaque écran et chaque fonction enveloppée plusieurs fois : la chaîne des modules qui la déclarent, l'enveloppent
// ou la remplacent ; pour chaque module : ce qu'il touche. Régénérée par tests/all.sh : elle suit toujours le code.
// usage (depuis zeste_projet/) : NODE_PATH=$(npm root -g) node tools/carte.js
const fs=require('fs'), path=require('path');
let ts; try{ ts=require('typescript'); }catch(e){ console.log("carte : TypeScript absent, carte non régénérée"); process.exit(0); }
const order=require('./ordre.js')();
const ev={}, mods=[];
for(const f of order){ const src=fs.readFileSync(path.join('src',f),'utf8'); const sf=ts.createSourceFile(f,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const first=(src.match(/^\/\/ =+ (.+?) =+/m)||src.match(/^\/\/ (.+)/m)||[])[1]||"";
  const m={f,title:first.trim(),decl:new Set(),wrap:new Set(),repl:new Set(),act:new Set(),lines:src.split("\n").length}; mods.push(m);
  const caps={};
  const visit=(n,depth)=>{
    if(ts.isVariableDeclaration(n)&&n.initializer&&ts.isIdentifier(n.initializer)&&ts.isIdentifier(n.name)) caps[n.name.text]=n.initializer.text;
    if(ts.isFunctionDeclaration(n)&&n.name&&depth===0){ m.decl.add(n.name.text); (ev[n.name.text]=ev[n.name.text]||[]).push([f,"déclare"]); }
    if(ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.EqualsToken&&ts.isIdentifier(n.left)&&(ts.isFunctionExpression(n.right)||ts.isArrowFunction(n.right))){
      const F=n.left.text, body=n.right.getText(), al=Object.keys(caps).filter(a=>caps[a]===F);
      const w=al.some(a=>new RegExp("\\b"+a.replace(/\$/g,"\\$")+"\\b").test(body));
      (w?m.wrap:m.repl).add(F); (ev[F]=ev[F]||[]).push([f,w?"enveloppe":"remplace"]); }
    ts.forEachChild(n,c=>visit(c,depth+((ts.isFunctionDeclaration(n)||ts.isFunctionExpression(n)||ts.isArrowFunction(n))?1:0))); };
  sf.statements.forEach(s=>visit(s,0));
  for(const x of src.matchAll(/Object\.assign\(ACT,\s*\{\s*([a-z0-9_]+)\s*:/g)) m.act.add(x[1]);
  for(const x of src.matchAll(/\bW\(\s*"([a-z0-9_]+)"/g)) m.act.add(x[1]);
  for(const x of src.matchAll(/ACT\.([a-z0-9_]+)\s*=/g)) m.act.add(x[1]);
}
const SCREENS=[["Aujourd’hui","vToday"],["Cocktails","vCocktails"],["Bar","vBar"],["Labo","vLabo"],["Labo — Composer","vCompose"],["Profil","vProfil"],["Fiche recette","recSheet"],["Fiche bouteille","ingSheet"],["Réglages","settingsSheet"]];
let o="# Carte du code de Zeste\n\n_Générée par `tools/carte.js` à partir des sources (ne pas modifier à la main)._\n\n";
o+=`${order.length} fichiers, chargés dans l’ordre de \`src/ORDRE\`. Chaque version ajoute un module qui enveloppe des fonctions existantes (\`const _f=f; f=function(){ … _f() … }\`) : pour comprendre un écran, suivre sa chaîne ci-dessous, de haut en bas.\n\n`;
o+="## Écrans\n\n";
for(const [n,F] of SCREENS){ const L=ev[F]||[]; o+=`### ${n} (\`${F}\`) — ${L.length} étape${L.length>1?"s":""}\n\n`+L.map(([f,k],i)=>`${i+1}. \`${f}\` ${k} — ${(mods.find(x=>x.f===f)||{}).title||""}`).join("\n")+"\n\n"; }
o+="## Fonctions enveloppées le plus souvent\n\n| Fonction | Étapes | Modules |\n|---|---|---|\n";
Object.entries(ev).filter(([F,L])=>L.length>=4&&!SCREENS.some(s=>s[1]===F)).sort((a,b)=>b[1].length-a[1].length).slice(0,40).forEach(([F,L])=>{ o+=`| \`${F}\` | ${L.length} | ${L.map(([f,k])=>f.replace(/^.*\//,"")+(k==="remplace"?" (remplace)":"")).join(" → ")} |\n`; });
o+="\n## Modules\n\n| Fichier | Lignes | Rôle | Touche |\n|---|---|---|---|\n";
mods.forEach(m=>{ const t=[...m.wrap].map(x=>"~"+x).concat([...m.repl].map(x=>"!"+x)).slice(0,10).join(", ")+(m.act.size?` ; actions : ${[...m.act].slice(0,8).join(", ")}`:""); o+=`| \`${m.f}\` | ${m.lines} | ${m.title.replace(/\|/g,"/").slice(0,90)} | ${t.replace(/\|/g,"/")} |\n`; });
o+="\n_~ enveloppe (garde la version précédente), ! remplace entièrement._\n";
fs.writeFileSync('CARTE.md',o);
console.log(`carte : CARTE.md régénérée (${order.length} fichiers, ${Object.keys(ev).length} fonctions suivies)`);
