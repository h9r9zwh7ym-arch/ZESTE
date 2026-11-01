// Allège dist/zeste.html sans changer le code : retire les commentaires et l'indentation du JavaScript, les
// commentaires et les blancs du CSS. Les sources gardent leurs commentaires.
// Le JavaScript est lu par l'analyseur de TypeScript : chaînes, gabarits (`…`) et expressions régulières sont repérés
// exactement, et rien n'y est jamais touché. Sans TypeScript installé, le fichier reste tel quel (rien n'échoue).
// Usage : node tools/minify.js dist/zeste.html
const fs=require('fs'), path=require('path');
const file=process.argv[2]; let html=fs.readFileSync(file,'utf8');
let ts=null; try{ ts=require('typescript'); }catch(e){ try{ ts=require(path.join(require('child_process').execSync('npm root -g').toString().trim(),'typescript')); }catch(e2){} }
const before=html.length;
// ---------- JavaScript ----------
if(ts){
  const a=html.indexOf('<script>')+8, b=html.indexOf('</script>',a), js=html.slice(a,b);
  const sf=ts.createSourceFile('app.js',js,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  // zones protégées : tous les littéraux (chaînes, gabarits entiers, expressions régulières)
  const prot=[]; (function walk(n){ const k=n.kind;
    if(k===ts.SyntaxKind.StringLiteral||k===ts.SyntaxKind.NoSubstitutionTemplateLiteral||k===ts.SyntaxKind.TemplateExpression||k===ts.SyntaxKind.RegularExpressionLiteral) prot.push([n.getStart(sf),n.end]);
    else ts.forEachChild(n,walk); })(sf);
  if(sf.parseDiagnostics&&sf.parseDiagnostics.length){ console.log("minify : JavaScript non analysable, laissé tel quel"); }
  else {
    prot.sort((x,y)=>x[0]-y[0]);
    // les commentaires sont exactement les plages que l'analyseur rattache aux jetons ; on les cherche hors littéraux
    const cut=[]; let i=0, p=0; const n=js.length;
    const inProt=k=>{ while(p<prot.length&&prot[p][1]<=k) p++; return p<prot.length&&prot[p][0]<=k; };
    while(i<n){ if(inProt(i)){ i=prot[p][1]; continue; }
      const c=js[i], d=js[i+1];
      if(c==='/'&&d==='/'){ let e=js.indexOf('\n',i); if(e<0) e=n; cut.push([i,e]); i=e; continue; }
      if(c==='/'&&d==='*'){ let e=js.indexOf('*/',i+2); e=e<0?n:e+2; cut.push([i,e]); i=e; continue; }
      i++; }
    let out="", last=0; cut.forEach(([s,e])=>{ out+=js.slice(last,s); last=e; }); out+=js.slice(last);
    // vérification : le résultat doit s'analyser sans erreur et garder le même nombre de déclarations au premier niveau
    const sf2=ts.createSourceFile('app.js',out,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
    if((sf2.parseDiagnostics||[]).length||sf2.statements.length!==sf.statements.length){ console.log("minify : vérification échouée, JavaScript laissé tel quel"); }
    else {
      // indentation et lignes vides : seulement hors littéraux (un gabarit multiligne garde ses blancs)
      const prot2=[]; (function walk(n){ const k=n.kind; if(k===ts.SyntaxKind.NoSubstitutionTemplateLiteral||k===ts.SyntaxKind.TemplateExpression||k===ts.SyntaxKind.StringLiteral) prot2.push([n.getStart(sf2),n.end]); else ts.forEachChild(n,walk); })(sf2);
      prot2.sort((x,y)=>x[0]-y[0]); let q=0; const inP=k=>{ while(q<prot2.length&&prot2[q][1]<=k) q++; return q<prot2.length&&prot2[q][0]<k; };
      let o2="", pos=0; for(const line of out.split('\n')){ const start=pos; pos+=line.length+1;
        if(inP(start)){ o2+=line+'\n'; continue; } const t=line.replace(/^[ \t]+/,'').replace(/[ \t]+$/,''); if(t) o2+=t+'\n'; }
      html=html.slice(0,a)+o2+html.slice(b);
    }
  }
}
// ---------- CSS ----------
{ const a=html.indexOf('<style>')+7, b=html.indexOf('</style>',a); let css=html.slice(a,b);
  css=css.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\n\s*\n+/g,'\n').replace(/^[ \t]+/gm,'');
  html=html.slice(0,a)+css+html.slice(b); }
fs.writeFileSync(file,html);
console.log(`minify : ${before} → ${html.length} octets (−${Math.round((before-html.length)/1024)} Ko)`);
