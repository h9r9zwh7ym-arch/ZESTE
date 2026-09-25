const fs=require('fs');const h=fs.readFileSync('dist/zeste.html','utf8');let js=h.split('<script>')[1].split('</script>')[0];
global.document={querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},appendChild(){}}),getElementById:()=>null,body:{appendChild(){},prepend(){},classList:{add(){},remove(){},toggle(){}}},documentElement:{dataset:{}}};global.localStorage={getItem:()=>null,setItem(){}};global.window={addEventListener(){}};global.matchMedia=()=>({matches:false,addEventListener(){}});global.setInterval=()=>0;global.setTimeout=()=>0;global.requestAnimationFrame=()=>0;
js=js.replace(/\ninit\(\);[\s\S]*$/,'\n'); eval(js+`REC_RAW.forEach(r=>{ if(r[9]&&r[9].n){ r[9].tip=r[9].n; delete r[9].n; } }); buildRecipes([]);
const users={ amer_fort:p=>3.2*p[2]+1.6*p[3]-2.4*p[0]-2*p[8], fruite_doux:p=>2.6*p[4]+1.5*p[0]-2.2*p[2]-1.6*p[3], herbace_acide:p=>2.8*p[5]+2.2*p[1]-1.2*p[7]-1.2*p[8], boise_epice:p=>2.6*p[7]+2*p[6]+0.8*p[3]-1.6*p[1] };
const sp=(a,b)=>{ const rk=x=>{ const s=x.map((v,i)=>[v,i]).sort((p,q)=>p[0]-q[0]); const r=[]; s.forEach(([v,i],k)=>r[i]=k); return r; }; const A=rk(a),B=rk(b); const n=a.length, ma=(n-1)/2; let num=0,da=0,db=0; for(let i=0;i<n;i++){ num+=(A[i]-ma)*(B[i]-ma); da+=(A[i]-ma)**2; db+=(B[i]-ma)**2; } return num/Math.sqrt(da*db); };
const pool=RECS.filter(r=>!r.na);
for(const adapt of [false,true]){ const agg={};
 for(const [un,f] of Object.entries(users)){ const pv=pool.map(r=>f(profileR(r))), mean=pv.reduce((a,b)=>a+b,0)/pv.length;
  const truth=r=>Math.max(1,Math.min(5,Math.round(3+ (f(profileR(r))-mean)*1.4 + (hrand(r.id+un)-.5)*0.9)));
  for(let seed=1;seed<=6;seed++){ let rng=(seed+6*((+process.env.SEED||1)-1))*977; const rnd=()=>{ rng=(rng*16807)%2147483647; return rng/2147483647; };
   for(const n of [5,10,20]){ S.ratings={}; S.mw=null; S.mwN=0; S.quiz=null; MODEL=null; const sh=pool.slice().sort(()=>rnd()-.5); const train=sh.slice(0,n), test=sh.slice(n,n+100);
    train.forEach(r=>{ const t=truth(r); if(adapt) learnFrom(r.id,t); S.ratings[r.id]=t; MODEL=null; });
    const pr=test.map(r=>predict(r)), tr=test.map(truth); const top=test.map((r,i)=>[pr[i],tr[i]]).sort((a,b)=>b[0]-a[0]).slice(0,10);
    (agg[n]=agg[n]||{c:0,h:0,k:0}); agg[n].c+=sp(pr,tr); agg[n].h+=top.filter(x=>x[1]>=4).length; agg[n].k++; } } }
 console.log(adapt?'AVEC apprentissage des poids':'SANS apprentissage des poids'); for(const n in agg) console.log('  '+n+' notes : corrélation '+(agg[n].c/agg[n].k).toFixed(2)+', top 10 aimés '+(agg[n].h/agg[n].k).toFixed(1)+'/10');
}`);
