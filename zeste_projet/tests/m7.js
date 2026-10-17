// Banc complet du moteur (1.59) : même simulateur que m6 (goûts = profil + ingrédients + alcool + générosité + bruit), plus
// les signaux implicites (verres refaits, favoris, « Ta version »), l'erreur de note, la calibration du « N % pour toi »,
// la liste du soir (réussite, diversité, répétition) et les achats malins (rang du vrai gain).
// usage : SEED=1 node tests/m7.js   (EXP=fichier pour une variante ; NU=nombre d'utilisateurs)
// Règle : on règle sur la graine 1, on valide sur la graine 2 (et m5 pour le démarrage à froid).
const fs=require('fs');const h=fs.readFileSync(process.env.HTML||'dist/zeste.html','utf8');let js=h.split('<script>')[1].split('</script>')[0];
global.document={querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},appendChild(){}}),getElementById:()=>null,body:{appendChild(){},prepend(){},classList:{add(){},remove(){},toggle(){}}},documentElement:{dataset:{}}};
global.localStorage={getItem:()=>null,setItem(){}};global.window={addEventListener(){}};global.matchMedia=()=>({matches:false,addEventListener(){}});global.setInterval=()=>0;global.setTimeout=()=>0;global.requestAnimationFrame=()=>0;
js=js.replace(/\nfixState\(\); applyTheme\(\);[\s\S]*$/,"\n");
eval(js+`
buildRecipes([]); fixState();
if(process.env.EXP && fs.existsSync(process.env.EXP)) eval(fs.readFileSync(process.env.EXP,'utf8'));
let seed=+(process.env.SEED||1)*104729; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
const gauss=()=>{ let u=0; for(let i=0;i<6;i++) u+=rnd(); return (u-3)/0.7071; };
const pool=RECS.filter(r=>!r.na&&!r.mine), NU=+(process.env.NU||60);
const cnt={}; pool.forEach(r=>r.ing.forEach(i=>{ if(!ING[i.id].basic) cnt[i.id]=(cnt[i.id]||0)+1; })); const common=Object.keys(cnt).filter(k=>cnt[k]>=5);
const GROUPS=["gin","rhum","whisky","agave","vodka","brandy","amer"];
const ARCH=[[0,0,2.8,1.4,0,0.6,0,0.4,-1.2],[1.8,0,-1.8,-1.2,2.2,0,0,0,0.8],[-.4,2.2,-.4,0,.6,2.4,0,-1,-1.2],[-.6,-1.2,.6,1.4,0,0,1.8,2.4,0],[1.6,0,0,0,.4,0,0,.8,2.4],[-1.6,1,1,1,0,1.2,0,0,-1.4]];
const popw=r=>(POPIDX[r.id]!=null?3:0)+(r.c?1:0.3);
const ingSet=r=>new Set(r.ing.filter(i=>!ING[i.id].basic).map(i=>i.id));
const dist=(a,b)=>{ const A=ingSet(a),B=ingSet(b); let n=0; A.forEach(x=>{ if(B.has(x)) n++; }); const j=n/((A.size+B.size-n)||1); return 1-(0.5*j+0.25*(a.fam===b.fam?1:0)+0.25*(baseGroup(a)===baseGroup(b)?1:0)); };
const pLike=r=>(typeof likeProb==="function"? likeProb(r) : matchPct(r)/100);
const reset=()=>{ S.ratings={}; S.rt={}; S.hist=[]; S.fav=[]; S.mw=null; S.mwN=0; S.quiz=null; S.adj={}; S.opens={}; S.skips={}; S.heroLog=[]; MODEL=null; SREV++; STC={}; MEMO={}; };
const R={}; const add=(k,v)=>{ R[k]=R[k]||{s:0,k:0}; R[k].s+=v; R[k].k++; };
const CAL=[]; const allIng=Object.keys(ING);
for(let u=0;u<NU;u++){
  const w=ARCH[u%ARCH.length].map(x=>x*(0.4+rnd()*0.8)+gauss()*0.5);
  const ia={}; for(let j=0;j<4;j++) ia[common[Math.floor(rnd()*common.length)]]=gauss()*1.1;
  const ga={}; for(let j=0;j<2;j++) ga[GROUPS[Math.floor(rnd()*GROUPS.length)]]=gauss()*0.6;
  const bias=(rnd()-.5)*1.2;
  const raw=r=>{ const p=profileR(r); let s=0; for(let i=0;i<9;i++) s+=w[i]*(p[i]||0); const sh=shares(r); for(const k in ia) if(sh[k]) s+=ia[k]*Math.min(1,sh[k]*2.5); s+=ga[baseGroup(r)]||0; return s; };
  const rv=pool.map(raw), mean=rv.reduce((a,b)=>a+b)/rv.length, sd=Math.sqrt(rv.reduce((a,b)=>a+(b-mean)**2,0)/rv.length);
  const truth={}; pool.forEach((r,i)=>truth[r.id]=3+(rv[i]-mean)/sd*1.1);
  const note=id=>Math.max(1,Math.min(5,Math.round(truth[id]+bias+gauss()*0.3)));
  const order=pool.map(r=>[r,Math.pow(rnd(),1/popw(r))]).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
  const thr=pool.map(r=>truth[r.id]).sort((a,b)=>b-a)[Math.floor(pool.length*0.15)];
  for(const n of [3,8,15,30]) for(const sig of [0,1]){
    reset(); const t0=Date.now();
    order.slice(0,n).forEach((r,k)=>{ const t=note(r.id); if(process.env.ADAPT!=="0") learnFrom(r.id,t); S.ratings[r.id]=t; S.rt[r.id]=t0-(n-k)*864e5*3; MODEL=null; SREV++; });
    let used=new Set(order.slice(0,n).map(r=>r.id));
    if(sig){ // signaux implicites : cocktails refaits (non notés), favoris, « Ta version »
      order.slice(n,n+12).forEach((r,k)=>{ const tt=truth[r.id]; if(tt+bias>3.4){ const c=1+Math.min(3,Math.floor((tt+bias-3.4)*2)); for(let j=0;j<c;j++) S.hist.push({id:r.id,t:t0-(k*3+j)*864e5}); used.add(r.id); } });
      order.slice(0,n).filter(r=>truth[r.id]>=thr).slice(0,2).forEach(r=>S.fav.push(r.id));
      order.slice(0,n).filter(r=>S.ratings[r.id]>=3).slice(0,3).forEach(r=>{ const a={s:w[0]<-0.8?-1:w[0]>0.8?1:0,a:w[1]<-0.8?-1:w[1]>0.8?1:0,f:w[3]<-0.8?-1:w[3]>0.8?1:0}; if(a.s||a.a||a.f) S.adj[r.id]=a; });
      MODEL=null; SREV++; }
    const test=pool.filter(r=>!used.has(r.id)), pr=test.map(r=>predict(r)), tr=test.map(r=>truth[r.id]);
    const rank=test.map((r,i)=>[pr[i],tr[i]]).sort((a,b)=>b[0]-a[0]), top=rank.slice(0,10);
    const dcg=top.reduce((a,x,i)=>a+(x[1]>=thr?1:0)/Math.log2(i+2),0), ideal=Math.min(10,tr.filter(t=>t>=thr).length); let idcg=0; for(let i=0;i<ideal;i++) idcg+=1/Math.log2(i+2);
    const key=(sig?"sig ":"")+n;
    add(key+" ndcg",idcg?dcg/idcg:0); add(key+" hit",top.filter(x=>x[1]>=thr).length);
    add(key+" mae",test.reduce((a,r,i)=>a+Math.abs(pr[i]-note(r.id)),0)/test.length);
    if(!sig){ test.forEach((r,i)=>{ if(i%3) return; const p=pLike(r), y=note(r.id)>=4?1:0; CAL.push([p,y,n]); }); }
    if(sig&&n===15){ // liste du soir : tout est faisable, les 3 derniers préparés ne doivent pas revenir en tête
      const st=S.stock; S.stock={}; allIng.forEach(id=>S.stock[id]=1); STC={}; MEMO={};
      const L=tonight().filter(r=>!r.na).slice(0,10); add("soir hit",L.filter(r=>truth[r.id]>=thr).length);
      let dsum=0,dn=0; for(let i=0;i<L.length;i++) for(let j=i+1;j<L.length;j++){ dsum+=dist(L[i],L[j]); dn++; } add("soir diversité",dn?dsum/dn:0);
      const last3=[...new Set(S.hist.slice().sort((a,b)=>b.t-a.t).map(x=>x.id))].slice(0,3); add("soir répétition",L.slice(0,5).filter(r=>last3.includes(r.id)).length);
      // achats malins : un bar partiel, rang du vrai gain (nombre de cocktails vraiment aimés débloqués)
      S.stock={}; common.slice().sort(()=>rnd()-.5).slice(0,14).forEach(id=>S.stock[id]=1); STC={}; MEMO={};
      const B=bottleRecs().slice(0,20); if(B.length>=5){ const g=b=>b.rs.filter(r=>truth[r.id]!=null&&truth[r.id]>=thr&&!used.has(r.id)).length; const best=Math.max(...B.map(g)); add("achats top3 vrai gain",B.slice(0,3).reduce((a,b)=>a+g(b),0)/3); add("achats top1 = meilleur",g(B[0])===best?1:0); }
      S.stock=st; STC={}; MEMO={}; }
  }
}
// calibration de « N % pour toi » : Brier et écart moyen par tranche de 10 %
if(process.env.CALF) fs.writeFileSync(process.env.CALF,JSON.stringify(CAL));
const brier=CAL.reduce((a,[p,y])=>a+(p-y)**2,0)/CAL.length; const bins={}; CAL.forEach(([p,y])=>{ const b=Math.min(9,Math.floor(p*10)); (bins[b]=bins[b]||[0,0,0]); bins[b][0]+=p; bins[b][1]+=y; bins[b][2]++; });
const ece=Object.values(bins).reduce((a,[p,y,c])=>a+Math.abs(p/c-y/c)*c,0)/CAL.length;
let out='graine '+(process.env.SEED||1)+(process.env.EXP?' — '+process.env.EXP:'')+'\\n';
for(const k of Object.keys(R).sort()) out+='  '+k.padEnd(24)+(R[k].s/R[k].k).toFixed(3)+'\\n';
out+='  calibration Brier       '+brier.toFixed(4)+' | ECE '+ece.toFixed(4)+' | max affiché '+Math.round(Math.max(...CAL.map(x=>x[0]))*100)+' %\\n';
console.log(out);
`);
