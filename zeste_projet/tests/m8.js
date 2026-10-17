// Duels de goût (1.60) : N duels choisis par le modèle contre N duels au hasard et N notes au hasard, après k notes de départ.
// Mesure : NDCG@10 sur les cocktails jamais vus. Règle : régler sur la graine 1, valider sur la graine 2 ; les duels ne restent que s'ils battent le hasard.
// (en-tête repris de m7) : même simulateur que m6 (goûts = profil + ingrédients + alcool + générosité + bruit), plus
// les signaux implicites (verres refaits, favoris, « Ta version »), l'erreur de note, la calibration du « N % pour toi »,
// la liste du soir (réussite, diversité, répétition) et les achats malins (rang du vrai gain).
// usage : SEED=1 node tests/m8.js   (EXP=fichier pour une variante ; NU=nombre d'utilisateurs)
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
  for(const k0 of [3,8]) for(const N of [5,10]) for(const mode of ["aucun","duels","duels hasard","notes hasard"]){
    reset(); S.duels=[]; order.slice(0,k0).forEach(r=>{ const t=note(r.id); learnFrom(r.id,t); S.ratings[r.id]=t; MODEL=null; SREV++; });
    const used=new Set(order.slice(0,k0).map(r=>r.id)); const rs=rnd;
    for(let i=0;i<N&&mode!=="aucun";i++){
      if(mode==="notes hasard"){ const c=pool.filter(r=>!used.has(r.id)); const r=c[Math.floor(rs()*c.length)]; S.ratings[r.id]=note(r.id); used.add(r.id); }
      else { const pr=mode==="duels"?duelPair():duelPairRandom(rs); if(!pr) break; const [a,b]=pr; const wa=truth[a.id]+gauss()*0.3, wb=truth[b.id]+gauss()*0.3; S.duels.push({a:a.id,b:b.id,w:wa>=wb?a.id:b.id,t:Date.now()}); used.add(a.id); used.add(b.id); }
      MODEL=null; SREV++; STC={}; MEMO={}; }
    const test=pool.filter(r=>!used.has(r.id)), pr=test.map(r=>predict(r)), tr=test.map(r=>truth[r.id]);
    const top=test.map((r,i)=>[pr[i],tr[i]]).sort((a,b)=>b[0]-a[0]).slice(0,10);
    const dcg=top.reduce((a,x,i)=>a+(x[1]>=thr?1:0)/Math.log2(i+2),0), ideal=Math.min(10,tr.filter(t=>t>=thr).length); let idcg=0; for(let i=0;i<ideal;i++) idcg+=1/Math.log2(i+2);
    add(k0+" notes + "+N+" "+mode, idcg?dcg/idcg:0); }
}
let out='graine '+(process.env.SEED||1)+(process.env.RECO2?' — '+process.env.RECO2:'')+'\\n'; for(const k of Object.keys(R)) out+='  '+k.padEnd(30)+(R[k].s/R[k].k).toFixed(3)+'\\n'; console.log(out);
`);
