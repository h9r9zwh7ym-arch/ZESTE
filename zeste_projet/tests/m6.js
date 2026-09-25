// Simulateur réaliste du moteur de recommandation.
// Goûts simulés = profil aromatique + goûts propres à certains ingrédients + alcool préféré
// + générosité propre à chaque utilisateur + bruit. Les notes portent surtout sur des cocktails connus.
// usage : SEED=1 node tests/m6.js   (EXP=nom pour activer une variante expérimentale du modèle)
const fs=require('fs');const h=fs.readFileSync(process.env.HTML||'dist/zeste.html','utf8');let js=h.split('<script>')[1].split('</script>')[0];
global.document={querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},appendChild(){}}),getElementById:()=>null,body:{appendChild(){},prepend(){},classList:{add(){},remove(){},toggle(){}}},documentElement:{dataset:{}}};
global.localStorage={getItem:()=>null,setItem(){}};global.window={addEventListener(){}};global.matchMedia=()=>({matches:false,addEventListener(){}});global.setInterval=()=>0;global.setTimeout=()=>0;global.requestAnimationFrame=()=>0;
js=js.replace(/\nfixState\(\); applyTheme\(\);[\s\S]*$/,"\n");
eval(js+`
buildRecipes([]); fixState();
if(process.env.EXP && fs.existsSync(process.env.EXP)) eval(fs.readFileSync(process.env.EXP,'utf8'));
let seed=+(process.env.SEED||1)*7919; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
const gauss=()=>{ let u=0; for(let i=0;i<6;i++) u+=rnd(); return (u-3)/0.7071; };
const pool=RECS.filter(r=>!r.na&&!r.mine), NU=+(process.env.NU||80);
const cnt={}; pool.forEach(r=>r.ing.forEach(i=>{ if(!ING[i.id].basic) cnt[i.id]=(cnt[i.id]||0)+1; })); const common=Object.keys(cnt).filter(k=>cnt[k]>=5);
const GROUPS=["gin","rhum","whisky","agave","vodka","brandy","amer"];
const ARCH=[[0,0,2.8,1.4,0,0.6,0,0.4,-1.2],[1.8,0,-1.8,-1.2,2.2,0,0,0,0.8],[-.4,2.2,-.4,0,.6,2.4,0,-1,-1.2],[-.6,-1.2,.6,1.4,0,0,1.8,2.4,0],[1.6,0,0,0,.4,0,0,.8,2.4],[-1.6,1,1,1,0,1.2,0,0,-1.4]];
const sp=(a,b)=>{ const rk=x=>{ const s=x.map((v,i)=>[v,i]).sort((p,q)=>p[0]-q[0]); const r=[]; s.forEach(([v,i],k)=>r[i]=k); return r; }; const A=rk(a),B=rk(b); const n=a.length, m=(n-1)/2; let u=0,da=0,db=0; for(let i=0;i<n;i++){ u+=(A[i]-m)*(B[i]-m); da+=(A[i]-m)**2; db+=(B[i]-m)**2; } return u/Math.sqrt(da*db); };
const popw=r=>(POPIDX[r.id]!=null?3:0)+(r.c?1:0.3);
const R={}; const add=(n,k,v)=>{ R[n]=R[n]||{c:0,h:0,g:0,k:0}; R[n][k]+=v; };
for(let u=0;u<NU;u++){
  const w=ARCH[u%ARCH.length].map(x=>x*(0.4+rnd()*0.8)+gauss()*0.5);
  const ia={}; for(let j=0;j<4;j++) ia[common[Math.floor(rnd()*common.length)]]=gauss()*1.1;
  const ga={}; for(let j=0;j<2;j++) ga[GROUPS[Math.floor(rnd()*GROUPS.length)]]=gauss()*0.6;
  const bias=(rnd()-.5)*1.2, noiseK=0.35+rnd()*0.4;
  const raw=r=>{ const p=profileR(r); let s=0; for(let i=0;i<9;i++) s+=w[i]*(p[i]||0); const sh=shares(r); for(const k in ia) if(sh[k]) s+=ia[k]*Math.min(1,sh[k]*2.5); s+=ga[baseGroup(r)]||0; return s+gauss()*noiseK; };
  const rv=pool.map(raw), mean=rv.reduce((a,b)=>a+b)/rv.length, sd=Math.sqrt(rv.reduce((a,b)=>a+(b-mean)**2,0)/rv.length);
  const truth={}; pool.forEach((r,i)=>truth[r.id]=3+(rv[i]-mean)/sd*1.1);
  const note=id=>Math.max(1,Math.min(5,Math.round(truth[id]+bias+gauss()*0.3)));
  // ordre de découverte : les cocktails connus d'abord
  const order=pool.map(r=>[r,Math.pow(rnd(),1/popw(r))]).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
  const thr=pool.map(r=>truth[r.id]).sort((a,b)=>b-a)[Math.floor(pool.length*0.15)];
  for(const n of [3,8,15,30]){
    S.ratings={}; S.rt={}; S.hist=[]; S.fav=[]; S.mw=null; S.mwN=0; S.quiz=null; S.adj={}; S.opens={}; MODEL=null;
    order.slice(0,n).forEach(r=>{ const t=note(r.id); if(process.env.ADAPT!=="0") learnFrom(r.id,t); S.ratings[r.id]=t; MODEL=null; });
    const test=order.slice(n), pr=test.map(r=>predict(r)), tr=test.map(r=>truth[r.id]);
    const rank=test.map((r,i)=>[pr[i],tr[i]]).sort((a,b)=>b[0]-a[0]);
    const top=rank.slice(0,10); const dcg=top.reduce((a,x,i)=>a+(x[1]>=thr?1:0)/Math.log2(i+2),0);
    const ideal=Math.min(10,tr.filter(t=>t>=thr).length); let idcg=0; for(let i=0;i<ideal;i++) idcg+=1/Math.log2(i+2);
    add(n,'c',sp(pr,tr)); add(n,'h',top.filter(x=>x[1]>=thr).length); add(n,'g',idcg?dcg/idcg:0); add(n,'k',1);
  }
}
let line=''; for(const n in R){ const x=R[n]; line+='  '+String(n).padStart(2)+' notes : corrélation '+(x.c/x.k).toFixed(3)+' | top 10 : '+(x.h/x.k).toFixed(2)+' vrais coups de cœur | NDCG '+(x.g/x.k).toFixed(3)+'\\n'; }
console.log('graine '+(process.env.SEED||1)+(process.env.EXP?' — '+process.env.EXP:'')+'\\n'+line);
`);
