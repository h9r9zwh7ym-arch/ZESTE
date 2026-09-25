const fs=require('fs');const h=fs.readFileSync('dist/zeste.html','utf8');let js=h.split('<script>')[1].split('</script>')[0];
global.document={querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},appendChild(){}}),getElementById:()=>null,body:{appendChild(){},prepend(){},classList:{add(){},remove(){},toggle(){}}},documentElement:{dataset:{}}};
global.localStorage={getItem:()=>null,setItem(){}};global.window={addEventListener(){}};global.matchMedia=()=>({matches:false,addEventListener(){}});global.setInterval=()=>0;global.setTimeout=()=>0;global.requestAnimationFrame=()=>0;global.requestAnimationFrame=f=>0;
js=js.replace(/\ninit\(\);[\s\S]*$/,"\n");
eval(js+`
REC_RAW.forEach(r=>{ if(r[9]&&r[9].n){ r[9].tip=r[9].n; delete r[9].n; } }); buildRecipes([]);
const ids=new Set(); let bad=[];
REC_RAW.forEach(r=>{ if(ids.has(r[0])) bad.push('dup '+r[0]); ids.add(r[0]); r[7].forEach(i=>{ if(!ING[i[0]]) bad.push(r[0]+' ing '+i[0]); }); if(!GLASS_SHAPES[r[4]]) bad.push(r[0]+' glass '+r[4]); if(!FAMILIES[r[2]]) bad.push(r[0]+' fam'); if(!METH[r[3]]) bad.push(r[0]+' meth '+r[3]); (r[9].v||[]).forEach(v=>{ if(!ids.has(v)&&!REC_RAW.find(x=>x[0]==v)) bad.push(r[0]+' var '+v); }); });
Object.values(SEASON).forEach(s=>s.r.forEach(id=>{ if(!RMAP[id]) bad.push('season '+id); }));
PREP_TPL.forEach(t=>{ if(t[2]&&!ING[t[2]]) bad.push('prep '+t[2]); });
Object.keys(PAIR).forEach(k=>PAIR[k].forEach(id=>{ if(!ING[id]) bad.push('pair '+id); }));
console.log('recettes',RECS.length,'ingrédients',Object.keys(ING).length,'suisses',RECS.filter(r=>r.s).length, 'créations', RECS.filter(r=>r.cr).length);
console.log(bad.join('\\n')||'aucune erreur');
// render all views
S.stock={gin:4,campari:3,vermouth_rouge:2,bourbon:3,tonic:1};
['vToday','vCocktails','vBar','vLabo','vProfil'].forEach(f=>{ try{ eval(f)(); }catch(e){ console.log(f,e.message); } });
RECS.forEach(r=>{ try{ buildSteps(r); glassSVG(r,{pour:1}); }catch(e){ console.log(r.id,e.message);} });
`);
