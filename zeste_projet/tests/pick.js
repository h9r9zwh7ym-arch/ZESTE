const fs=require('fs');const h=fs.readFileSync('dist/zeste.html','utf8');let js=h.split('<script>')[1].split('</script>')[0];
global.document={querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},appendChild(){}}),getElementById:()=>null,body:{appendChild(){},prepend(){},classList:{add(){},remove(){},toggle(){}}},documentElement:{dataset:{}}};global.localStorage={getItem:()=>null,setItem(){}};global.window={addEventListener(){}};global.setInterval=()=>0;global.setTimeout=()=>0;global.requestAnimationFrame=()=>0;global.matchMedia=()=>({matches:false,addEventListener(){}});
js=js.replace(/\ninit\(\);[\s\S]*$/,'\n'); eval(js+`REC_RAW.forEach(r=>{ if(r[9]&&r[9].n){ r[9].tip=r[9].n; delete r[9].n; } }); buildRecipes([]);
const av=avgProfile(); const cand=POPULAR.slice(0,45).map(id=>RMAP[id]).filter(r=>r&&!r.na);
const info=r=>{ const p=profileR(r); let d=0; for(let i=0;i<9;i++) d+=Math.pow((p[i]||0)-(av[i]||0),2); return Math.sqrt(d); };
const sc=cand.map(r=>[r,1-POPIDX[r.id]/POPULAR.length, info(r)]).map(([r,pop,inf])=>[r,Math.pow(pop,2)*inf]);
sc.sort((a,b)=>b[1]-a[1]); const out=[];
for(const [r,s] of sc){ if(out.length>=8) break; if(out.some(o=>cos(fvec(o),fvec(r))>0.8)) continue; out.push(r); }
console.log(out.map(r=>r.id+" ("+r.n+") dims="+profileR(r).slice(0,9).map(v=>v.toFixed(2)).join(",")).join("\\n"));
// couverture des axes : pour chaque dimension, l'écart-type des items choisis
const D=["sucré","acide","amer","fort","fruité","herbacé","épicé","boisé","crémeux"]; console.log(D.map((n,i)=>{ const v=out.map(r=>profileR(r)[i]||0), m=v.reduce((a,b)=>a+b)/v.length; return n+" "+Math.sqrt(v.reduce((a,b)=>a+(b-m)*(b-m),0)/v.length).toFixed(2); }).join(" | "));`);
