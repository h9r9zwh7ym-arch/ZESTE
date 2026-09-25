const fs=require('fs');const h=fs.readFileSync('dist/zeste.html','utf8');let js=h.split('<script>')[1].split('</script>')[0];
global.document={querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},appendChild(){}}),getElementById:()=>null,body:{appendChild(){},prepend(){},classList:{add(){},remove(){},toggle(){}}},documentElement:{dataset:{}}};global.localStorage={getItem:()=>null,setItem(){}};global.window={addEventListener(){}};global.setInterval=()=>0;global.setTimeout=()=>0;global.requestAnimationFrame=()=>0;global.matchMedia=()=>({matches:false,addEventListener(){}});
js=js.replace(/\ninit\(\);[\s\S]*$/,'\n'); eval(js+`REC_RAW.forEach(r=>{ if(r[9]&&r[9].n){ r[9].tip=r[9].n; delete r[9].n; } }); buildRecipes([]); fixState(); if(process.env.QW){ const w=+process.env.QW; QITEM.love=[1.5,w]; QITEM.no=[-1.5,w]; QITEM.bof=[0,w*0.7]; } if(process.env.QV){ const v=+process.env.QV; QITEM.love[0]=v; QITEM.no[0]=-v; }
let seed=+(process.env.SEED||1); const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
const pool=RECS.filter(r=>!r.na&&!r.mine);
const sp=(a,b)=>{ const rk=x=>{ const s=x.map((v,i)=>[v,i]).sort((p,q)=>p[0]-q[0]); const r=[]; s.forEach(([v,i],k)=>r[i]=k); return r; }; const A=rk(a),B=rk(b); const n=a.length, m=(n-1)/2; let u=0,da=0,db=0; for(let i=0;i<n;i++){ u+=(A[i]-m)*(B[i]-m); da+=(A[i]-m)**2; db+=(B[i]-m)**2; } return u/Math.sqrt(da*db); };
const ARCH=[[0,0,2.8,1.4,0,0.6,0,0.4,-1.2],[1.8,0,-1.8,-1.2,2.2,0,0,0,0.8],[-.4,2.2,-.4,0,.6,2.4,0,-1,-1.2],[-.6,-1.2,.6,1.4,0,0,1.8,2.4,0],[1.6,0,0,0,.4,0,0,.8,2.4],[-1.6,1,1,1,0,1.2,0,0,-1.4]];
const res={old:{c:0,h:0,k:0},neu:{c:0,h:0,k:0},none:{c:0,h:0,k:0}};
for(let u=0;u<60;u++){ const w=ARCH[u%ARCH.length].map(x=>x+(rnd()-.5)*1.2);
  const f=r=>{ const p=profileR(r); let s=0; for(let i=0;i<9;i++) s+=w[i]*(p[i]||0); return s; };
  const mean=pool.reduce((a,r)=>a+f(r),0)/pool.length, sd=Math.sqrt(pool.reduce((a,r)=>a+(f(r)-mean)**2,0)/pool.length);
  const truth=r=>Math.max(1,Math.min(5,3+(f(r)-mean)/sd*1.1+(hrand(r.id+u)-.5)*.6));
  // réponses simulées d'après les vrais goûts
  const grp={}; pool.forEach(r=>{ const g=baseGroup(r); (grp[g]=grp[g]||[]).push(truth(r)); }); const gm=Object.entries(grp).map(([g,v])=>[g,v.reduce((a,b)=>a+b)/v.length]).sort((a,b)=>b[1]-a[1]);
  const old={amer:w[2]>1.2?"love":w[2]>-0.3?"ok":"no",acide:w[1]>1?"vif":w[1]<-0.5?"doux":"rond",force:w[3]>0.8?"fort":w[3]<-0.5?"leger":"moyen",bulles:"egal",
    aromes:[[4,"fruit"],[5,"herbe"],[6,"epice"],[7,"bois"],[8,"creme"]].filter(([i])=>w[i]>1).map(x=>x[1]),alcools:gm.slice(0,2).map(x=>x[0]).filter(g=>["gin","rhum","whisky","agave","vodka","eaux","amer"].includes(g))};
  const items={}; ["negroni","mojito","old_fashioned","pina_colada","aperol_spritz","espresso_martini","moscow_mule","whisky_sour"].forEach(id=>{ if(rnd()<0.75){ const t=truth(RMAP[id]); items[id]=t>=3.8?"love":t<=2.4?"no":"bof"; } });
  const neu=Object.assign({},old,{sucre:w[0]>0.8?"doux":w[0]<-0.8?"sec":"juste",texture:w[8]>0.8?"oui":w[8]<-0.8?"non":"egal",items});
  const test=pool; const tr=test.map(truth);
  for(const [k,q] of [["none",null],["old",old],["neu",neu]]){ S.ratings={}; S.hist=[]; S.fav=[]; S.quiz=q; MODEL=null; const pr=test.map(r=>predict(r)); const top=test.map((r,i)=>[pr[i],tr[i]]).sort((a,b)=>b[0]-a[0]).slice(0,10);
    res[k].c+=sp(pr,tr); res[k].h+=top.filter(x=>x[1]>=3.8).length; res[k].k++; }
}
for(const [k,n] of [["none","Sans quiz"],["old","Ancien quiz (6 questions)"],["neu","Nouveau quiz (9 questions)"]]) console.log(n.padEnd(28)+" corrélation "+(res[k].c/res[k].k).toFixed(2)+" | top 10 vraiment aimés "+(res[k].h/res[k].k).toFixed(1)+"/10");`);
