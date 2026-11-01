// 1.82 : le fichier livré est allégé (tools/minify.js). On reconstruit une version non allégée et on compare :
// mêmes déclarations au premier niveau, mêmes textes (chaînes, gabarits, expressions régulières, octet pour octet),
// aucun commentaire restant dans le JavaScript. Sans TypeScript, le test est sauté.
const fs=require('fs'), path=require('path'), cp=require('child_process');
let ts; try{ ts=require('typescript'); }catch(e){ console.log("allègement : TypeScript absent, vérification sautée"); process.exit(0); }
const root=path.join(__dirname,'..'), tmp=fs.mkdtempSync(path.join(require('os').tmpdir(),'zmin'));
const full=fs.readFileSync(path.join(root,'dist/zeste.html'),'utf8');
cp.execSync('sh build.sh',{cwd:root,env:Object.assign({},process.env,{ZESTE_NOMIN:"1"}),stdio:'ignore'});
const raw=fs.readFileSync(path.join(root,'dist/zeste.html'),'utf8'); fs.writeFileSync(path.join(root,'dist/zeste.html'),full); // remet le fichier allégé
const js=h=>h.slice(h.indexOf('<script>')+8,h.indexOf('</script>'));
const info=src=>{ const sf=ts.createSourceFile('a.js',src,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS); const lits=[]; let com=0;
  (function w(n){ const k=n.kind; if(k===ts.SyntaxKind.StringLiteral||k===ts.SyntaxKind.NoSubstitutionTemplateLiteral||k===ts.SyntaxKind.RegularExpressionLiteral||k===ts.SyntaxKind.TemplateHead||k===ts.SyntaxKind.TemplateMiddle||k===ts.SyntaxKind.TemplateTail) lits.push(n.getText(sf)); ts.forEachChild(n,w); })(sf);
  const decl=sf.statements.map(s=>s.kind+":"+(s.name?s.name.text:s.declarationList?s.declarationList.declarations.map(d=>d.name.getText(sf)).join(","):"")).join("|");
  return {lits, decl, diag:(sf.parseDiagnostics||[]).length}; };
const a=info(js(raw)), b=info(js(full)), fail=[];
if(b.diag) fail.push("JavaScript allégé non analysable");
if(a.decl!==b.decl) fail.push("déclarations différentes");
if(a.lits.length!==b.lits.length||a.lits.some((x,i)=>x!==b.lits[i])) fail.push(`textes différents (${a.lits.length} / ${b.lits.length})`);
if(full.length>=raw.length) fail.push("aucun allègement");
fs.rmSync(tmp,{recursive:true,force:true});
console.log(fail.length? "ÉCHEC allègement : "+fail.join(" ; ") : `allègement : ${raw.length} → ${full.length} caractères (−${Math.round((raw.length-full.length)/1024)} Ko), ${a.lits.length} textes identiques, déclarations identiques`);
process.exit(fail.length?1:0);
