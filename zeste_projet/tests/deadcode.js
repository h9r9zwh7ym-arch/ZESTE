// usage (depuis la racine du projet) : NODE_PATH=$(npm root -g) node tests/deadcode.js [--write]
// Supprime les déclarations de fonctions de premier niveau écrasées plus loin dans l'ordre du build (code mort par hissage).
const ts=require('typescript'),fs=require('fs');
const order=fs.readFileSync('build.sh','utf8').split('cd src; cat ')[1].split(';')[0].trim().split(/\s+/);
const decls=[]; // {file,name,start,end}
for(const f of order){ const src=fs.readFileSync('src/'+f,'utf8'); const sf=ts.createSourceFile(f,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  sf.statements.forEach(st=>{ if(ts.isFunctionDeclaration(st)&&st.name) decls.push({file:f,name:st.name.text,start:st.getFullStart(),end:st.getEnd()}); }); }
const last={}; decls.forEach(d=>last[d.name]=d);
const dead=decls.filter(d=>last[d.name]!==d);
const byFile={}; dead.forEach(d=>(byFile[d.file]=byFile[d.file]||[]).push(d));
let saved=0;
for(const f in byFile){ let src=fs.readFileSync('src/'+f,'utf8'); byFile[f].sort((a,b)=>b.start-a.start).forEach(d=>{ saved+=d.end-d.start; src=src.slice(0,d.start)+"\n// ("+d.name+" : remplacée plus loin, voir "+last[d.name].file+")"+src.slice(d.end); });
  if(process.argv[2]==='--write') fs.writeFileSync('src/'+f,src); }
console.log(dead.map(d=>d.file+':'+d.name).join(', ')); console.log('octets retirés :',saved);
