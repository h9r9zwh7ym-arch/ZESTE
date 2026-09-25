// Audit de cohérence des recettes (volume, glace, doublons, garnitures) : node tests/audit2.js
const fs=require('fs');const h=fs.readFileSync('dist/zeste.html','utf8');let js=h.split('<script>')[1].split('</script>')[0];
global.document={querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},appendChild(){}}),getElementById:()=>null,body:{appendChild(){},prepend(){},classList:{add(){},remove(){},toggle(){}}},documentElement:{dataset:{}}};
global.localStorage={getItem:()=>null,setItem(){}};global.window={addEventListener(){}};global.matchMedia=()=>({matches:false,addEventListener(){}});global.setInterval=()=>0;global.setTimeout=()=>0;global.requestAnimationFrame=()=>0;
js=js.replace(/\nfixState\(\); applyTheme\(\);[\s\S]*$/,"\n");
eval(js+`
buildRecipes([]); const P=[];
const key=r=>r.ing.filter(i=>i.r!=="opt").map(i=>i.id+":"+i.q).sort().join("|")+"|"+r.m;
const seen={}; RECS.forEach(r=>{ const k=key(r); if(seen[k]) P.push("recettes identiques : "+seen[k]+" et "+r.id); else seen[k]=r.id; });
RECS.forEach(r=>{ const c=calc(r.ing,r.m,r.ice), cap=labAvail(r.g,r.ice);
  if(c.vol>cap*1.4) P.push(r.id+" : "+Math.round(c.vol)+" ml pour un verre "+r.g+" ("+r.ice+") d’environ "+Math.round(cap)+" ml");
  if(c.vol<cap*0.25&&!["shot","tasse","vin"].includes(r.g)&&r.id!=="sazerac"&&r.id!=="ti_punch") P.push(r.id+" : seulement "+Math.round(c.vol)+" ml dans un verre "+r.g+" ("+Math.round(cap)+" ml)");
  if(["coupe","martini","flute"].includes(r.g)&&r.ice!=="none"&&!r.st) P.push(r.id+" : glace "+r.ice+" dans un verre "+r.g);
  if(r.ice==="none"&&r.m==="build"&&["rocks","highball"].includes(r.g)&&!r.ing.some(i=>ING[i.id].fizz||i.r==="top")&&r.m!=="hot") P.push(r.id+" : construit sans glace dans un verre "+r.g);
  const t=(r.gar||"").toLowerCase().split(/ ou |, et une| si tu/)[0]; if(r.gar&&r.gar!=="Aucune"&&t.length<4) P.push(r.id+" : garniture peu lisible pour le dessin « "+r.gar+" »");
  (r.v||[]).forEach(v=>{ if(v===r.id) P.push(r.id+" : variante de lui-même"); });
});
console.log(P.length? P.join("\\n") : "rien à signaler"); console.log(P.length+" point(s)");
`);
