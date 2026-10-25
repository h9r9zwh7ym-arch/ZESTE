// Formules et cohérence des calculs (1.70). Valeurs de référence :
//  · dilution (Dave Arnold, Liquid Intelligence ; signe du shaker corrigé, voir core.js) : secoué 50 à 60 % pour un degré initial de 22 à 32 % ;
//    remué A = 0,35 → 0,43 ; construit : glaçons 22 %, pilée 40 %, sans glace 0 ;
//  · gin tonic 5 cl + tonic 15 cl construit sur glaçons : 21,1 cl à 9,95 % ;
//  · alcoolémie (Widmark) : 20 g d'alcool, homme de 75 kg (r = 0,68) → 0,39 ‰, puis −0,15 ‰ par heure ;
//  · doses : 22,5 ml → « 2,25 cl » ; 2 traits ; prix : 35 CHF les 70 cl → 2,50 CHF pour 5 cl ;
//  · cohérence : sur toutes les recettes et 2 000 mélanges aléatoires du Labo, valeurs finies et dans leurs plages, textes sans « NaN / undefined ».
// usage (depuis zeste_projet/) : NODE_PATH=$(npm root -g) node tests/formulas.js
// usage : SEED=1 node tests/m10.js (EXP=fichier : variante)
const fs=require('fs');const h=fs.readFileSync(process.env.HTML||'dist/zeste.html','utf8');let js=h.split('<script>')[1].split('</script>')[0];
global.document={querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},appendChild(){}}),getElementById:()=>null,body:{appendChild(){},prepend(){},classList:{add(){},remove(){},toggle(){}}},documentElement:{dataset:{}}};
global.localStorage={getItem:()=>null,setItem(){}};global.window={addEventListener(){}};global.matchMedia=()=>({matches:false,addEventListener(){}});global.setInterval=()=>0;global.setTimeout=()=>0;global.requestAnimationFrame=()=>0;
js=js.replace(/\nfixState\(\); applyTheme\(\);[\s\S]*$/,"\n");
eval(js+`
REC_RAW.forEach(r=>{ if(r[9]&&r[9].n){ r[9].tip=r[9].n; delete r[9].n; } }); // comme l'app au démarrage (ui.js)
buildRecipes([]); fixState();
{
if(process.env.EXP && fs.existsSync(process.env.EXP)) eval(fs.readFileSync(process.env.EXP,'utf8'));
let seed=+(process.env.SEED||1)*7919; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
const fails=[]; const near=(x,y,e)=>Math.abs(x-y)<=e; const T=(c,m)=>{ if(!c) fails.push(m); };
// dilution
for(const A of [0.22,0.27,0.32]){ const d=dilution("shake",A); T(d>=0.5-1e-9&&d<=0.6+1e-9,"dilution secouée "+A+" = "+d.toFixed(3)+" hors 50-60 %"); }
T(near(dilution("stir",0.35),0.433,0.005),"dilution remuée 0,35 = "+dilution("stir",0.35));
T(dilution("build",0.3,"cubes")===0.22&&dilution("build",0.3,"pilee")===0.4&&dilution("build",0.3,"none")===0,"dilution construite");
T(dilution("shake",0)>0&&dilution("shake",0.6)>=0,"dilution aux bornes");
// gin tonic
{ const m=calc([{id:"gin",q:50,u:"ml",r:""},{id:"tonic",q:150,u:"ml",r:"top"}],"build","cubes"); T(near(m.vol,211,0.5)&&near(m.abv,9.95,0.05),"gin tonic : "+m.vol.toFixed(1)+" ml à "+m.abv.toFixed(2)+" %"); }
// conservation de l'alcool : la dilution ne change pas l'éthanol
{ const it=[{id:"rhum_blanc",q:60,u:"ml",r:""},{id:"citron_vert",q:25,u:"ml",r:""},{id:"sirop_sucre",q:15,u:"ml",r:""}];
  for(const mth of ["shake","stir","build"]){ const m=calc(it,mth,"cubes"); T(near(m.vol*m.abv/100,60*ING.rhum_blanc.abv/100,1e-6),"éthanol conservé ("+mth+")"); } }
// Widmark
{ S.settings.weightKg=75; S.settings.sex="h"; const now=Date.now(); S.hist=[]; S.drinks=[{t:now,ml:20/0.789/0.4,abv:40}];
  const b=bacState(); T(b.active&&near(b.perMille,20/(75*0.68),0.005),"Widmark 20 g / 75 kg = "+(b.perMille||0).toFixed(3)+" ‰");
  S.drinks=[{t:now-36e5,ml:20/0.789/0.4,abv:40}]; const b2=bacState(); T(near(b2.perMille,20/(75*0.68)-0.15,0.005),"Widmark après 1 h = "+(b2.perMille||0).toFixed(3)); S.drinks=[]; }
// doses et prix
S.settings.unit="cl"; T(fmtQ({id:"citron",q:22.5,u:"ml"})==="2,25 cl","fmtQ 22,5 ml = "+fmtQ({id:"citron",q:22.5,u:"ml"}));
T(fmtQ({id:"angostura",q:2,u:"d"})==="2 traits","fmtQ traits");
S.price={gin:{p:35,v:700}}; T(near(costOf([{id:"gin",q:50,u:"ml",r:""}]).tot,2.5,1e-9),"coût 5 cl de gin");
// cohérence générale
const bad=[]; const B=(c,m)=>{ if(!c) bad.push(m); }; const fin=x=>typeof x==="number"&&isFinite(x);
const txtBad=s=>/NaN|undefined|null|\\[object|Infinity/.test(s);
S.stock={}; Object.keys(ING).forEach(id=>S.stock[id]=tracked(id)?2:1); STC={}; MEMO={};
S.price={}; Object.keys(ING).forEach((id,k)=>{ if(!ING[id].basic) S.price[id]={p:10+k%30,v:700}; });
RECS.forEach(r=>{ const m=metricsR(r), p=profileR(r);
  B(fin(m.vol)&&m.vol>0, r.id+" vol "+m.vol); B(fin(m.abv)&&m.abv>=0&&m.abv<=60, r.id+" abv "+m.abv); B(fin(m.sug)&&m.sug>=0&&m.sug<40, r.id+" sug "+m.sug); B(fin(m.acid)&&m.acid>=0&&m.acid<5, r.id+" acid "+m.acid);
  B(p.every(v=>fin(v)&&v>=0&&v<=1), r.id+" profil "+p.map(v=>v.toFixed(2)));
  if(r.na) B(m.abv<0.5, r.id+" na mais "+m.abv.toFixed(2)+" %");
  const pr=predict(r), lp=likeProb(r), mp=matchPct(r); B(fin(pr)&&pr>=0.5&&pr<=5.5, r.id+" predict "+pr); B(fin(lp)&&lp>=0&&lp<=1, r.id+" likeProb "+lp); B(fin(mp)&&mp>=0&&mp<=100, r.id+" match "+mp);
  for(const mult of [1,2,3]){ const c=costOf(r.ing,mult); B(fin(c.tot)&&c.tot>=0, r.id+" coût "+c.tot); r.ing.forEach(i=>{ const f=fmtQ(i,mult); B(!txtBad(f), r.id+" fmtQ "+f); }); }
  const steps=buildSteps(r); steps.forEach(s=>B(!txtBad(JSON.stringify(s)), r.id+" étape "+JSON.stringify(s).slice(0,80)));
  const ai=adjItems(r,{s:2,a:-2,f:2}); B(ai.every(i=>fin(i.q)&&i.q>0), r.id+" adj"); const ma=calc(ai,r.m,r.ice); B(fin(ma.abv), r.id+" adj abv");
  B(!txtBad(reasons(r)||""), r.id+" raison "+reasons(r));
});
// mélanges du labo : 2000 mélanges aléatoires, toutes méthodes, verres et glaces
let sd=7; const rn=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; }; const ids=Object.keys(ING).filter(id=>!ING[id].al);
const GL=LGLASS.map(x=>x[0]), ICE=["none","cubes","big","pilee"], MS=["shake","stir","build"];
for(let n=0;n<2000;n++){ const k=1+Math.floor(rn()*5), items=[]; for(let j=0;j<k;j++){ const id=ids[Math.floor(rn()*ids.length)]; if(items.some(i=>i.id===id)) continue; const u=unitOf(id); items.push({id,q:u==="ml"?Math.round(rn()*120)+1:1+Math.floor(rn()*4)}); }
  S.mix={m:MS[n%3],g:rn()<0.7?GL[Math.floor(rn()*GL.length)]:null,gUser:rn()<0.7?1:0,ice:rn()<0.7?ICE[Math.floor(rn()*4)]:null,gar:[],t:"auto",items}; STC={}; MEMO={};
  try{ const A=analyze(); if(!A) continue; const SC=labScore(A); const ma=labMethodAdvice(); const fx=labBestFixes(A); const tip=labMethodTip();
    if(!SC.none){ B(fin(SC.score)&&SC.score>=0&&SC.score<=100, "labo score "+SC.score+" "+JSON.stringify(items)); B(SC.goals.every(g=>fin(g[2])&&g[2]>=0&&g[2]<=1.0001), "labo sous-score "+JSON.stringify(SC.goals.map(g=>g[2]))+" "+JSON.stringify(items)); }
    B(fin(A.met.vol)&&fin(A.met.abv), "labo met "+JSON.stringify(items));
    A.diag.forEach(d=>B(!txtBad(d.t+d.why), "labo diag "+d.t)); fx.forEach(c=>B(fin(c.g), "fix"));
    const h=vCompose(); B(!txtBad(h.replace(/data-[a-z-]+="[^"]*"/g,"").replace(/<[^>]+>/g," ")), "vCompose texte suspect : "+(h.replace(/<[^>]+>/g," ").match(/.{0,40}(NaN|undefined|null|\\[object|Infinity).{0,40}/)||[""])[0]+" "+JSON.stringify(items));
  }catch(e){ bad.push("EXCEPTION labo "+e.message+" "+JSON.stringify(items)); }
}

bad.forEach(x=>fails.push(x));
console.log(fails.length? "ÉCHEC formules : "+fails.length+"\\n  "+[...new Set(fails)].slice(0,30).join("\\n  ") : "Formules : dilution d’Arnold (secoué 50-60 %), gin tonic 21,1 cl à 9,95 %, éthanol conservé, Widmark, doses, prix ; "+RECS.length+" recettes et 2 000 mélanges sans valeur aberrante.");
process.exitCode=fails.length?1:0;
}`);
