// Score du Labo v3 (1.62, B). Q = 100·(0,6·Équilibre + 0,4·Force) ; Remplissage et Glace ne font que réduire (facteur 0,6–1) ;
// pas de note sans deux rôles différents ; plafond sous 40 (équilibre < 0,30, débordement > 135 %, éthanol > 1,5 × P95 IBA) ;
// 70 au plus si Équilibre < 0,60 ; 100 seulement à partir de 98 brut ; décor hors note ; jauge et verdict tirés des sous-scores.
// Les 3 cas observés sur iPhone (highball) : vodka 10,1 cl + citron 1 cl → < 40 ; tonic seul → pas de note ; citron 12 cl + gin 1 cl → < 40.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false}},stock:{gin:3,rhum_blanc:1,vodka:1,tonic:1},labBest:91,tro:["labpro","lab1"],troT:{labpro:1,lab1:1},chal:{mini_1:80}})); });
  await p.goto(APP); await p.waitForTimeout(2500);
  const r=await p.evaluate(()=>{ const sc=(items,o)=>{ S.mix=Object.assign({m:"shake",g:null,gUser:0,ice:null,gar:[],t:"auto"},o||{},{items}); if(S.mix.g) S.mix.gUser=1; STC={}; MEMO={}; return labScore(analyze()); };
    const dq=[{id:"rhum_blanc",q:60},{id:"citron_vert",q:20},{id:"sirop_sucre",q:15}];
    const c1=sc([{id:"vodka",q:101},{id:"citron",q:10}],{g:"highball",ice:"cubes",gar:["cv"]}), c2=sc([{id:"tonic",q:350}],{m:"build",g:"highball",ice:"none"}), c3=sc([{id:"citron",q:120},{id:"gin",q:10}],{g:"highball",ice:"none"});
    const one=[["jus",[{id:"orange",q:200}]],["liqueur",[{id:"triple_sec",q:60}]],["spiritueux",[{id:"gin",q:60}]]].map(([n,it])=>[n,sc(it).none]);
    const base=sc(dq), noIce=sc(dq,{g:"highball",ice:"none"}), stem=sc(dq,{g:"coupe",ice:"cubes"});
    const over=sc([{id:"gin",q:60},{id:"tonic",q:250}],{m:"build",g:"martini",ice:"none"}), eth=sc([{id:"cognac",q:130},{id:"vermouth_rouge",q:30}],{m:"stir",g:"rocks",ice:"big"});
    const garA=sc(dq,{gar:[]}).score, garB=sc(dq,{gar:["cv"]}).score;
    const many=[]; for(let k=0;k<300;k++){ const s=sc([{id:"rhum_blanc",q:20+k%60},{id:"citron_vert",q:5+(k*7)%40},{id:"sirop_sucre",q:3+(k*3)%40}],{g:["coupe","rocks","highball"][k%3],ice:["none","cubes","pilee"][(k>>2)%3]});
      const G=Object.fromEntries(s.goals.map(x=>[x[0],x[2]])), Q=100*(0.6*G.bal+0.4*G.abv), T=(0.8+0.2*G.fill)*(0.75+0.25*G.ice); many.push([s.raw,s.score,G.bal,Q,T,s.red]); }
    // jauge et verdict
    S.mix={m:"shake",g:"highball",gUser:1,ice:"none",gar:[],t:"auto",items:dq}; LT="compose"; switchTab("labo");
    const gauge=(document.querySelector(".lab-gbar i")||{}).className, fillV=labScore(analyze()).goals.find(g=>g[0]==="fill")[2];
    const A=analyze(), SC=labScore(A), sum=labSummary(A,SC), weak=SC.goals.filter(g=>g[0]!=="gar"&&g[2]<0.7).map(g=>g[1].toLowerCase());
    return {c1:[c1.score,c1.none], c2:c2.none, c3:c3.score, one, base:base.score, noIce:noIce.score, stem:stem.score, over:[over.score,over.why], eth:[eth.score,eth.why], garA, garB, many, gauge, fillV, sum, weak}; });
  const ok=(c,m)=>{ if(!c) fail.push(m); };
  ok(!r.c1[1]&&r.c1[0]<40,"vodka 10,1 cl + citron 1 cl < 40 : "+r.c1); ok(r.c2===true,"tonic seul : pas de note"); ok(r.c3<40,"citron 12 cl + gin 1 cl < 40 : "+r.c3);
  ok(r.one.every(x=>x[1]),"un seul rôle : pas de note "+JSON.stringify(r.one));
  ok(r.base>=85,"Daiquiri ≥ 85 : "+r.base); ok(r.noIce<r.base&&r.stem<r.base,"glace : ne fait que réduire "+[r.base,r.noIce,r.stem]);
  ok(r.over[0]<40&&r.over[1].includes("débordement"),"débordement : sous 40 "+JSON.stringify(r.over)); ok(r.eth[0]<40&&r.eth[1].includes("éthanol"),"éthanol > 1,5 × P95 : sous 40 "+JSON.stringify(r.eth));
  ok(r.garA===r.garB,"le décor ne change pas la note");
  ok(r.many.every(([raw,s,bal,Q,T,red])=>T>=0.6-1e-9&&T<=1+1e-9&&(red||Math.abs(raw-Math.min(Q*T,bal<0.6?70:1e9))<1e-6)),"total = Q × T, T entre 0,6 et 1");
  ok(r.many.every(([raw,s,bal])=>bal>=0.3||s<40),"Équilibre < 0,30 : sous 40"); ok(r.many.every(([raw,s,bal])=>bal>=0.6||s<=70),"Équilibre < 0,60 : 70 au plus");
  ok(r.many.every(([raw,s])=>raw>=98?s===100:s===Math.floor(raw)&&s<=97),"100 seulement à partir de 98 brut");
  ok((r.fillV>=0.7&&r.gauge==="")||(r.fillV<0.7&&r.fillV>=0.4&&r.gauge==="mid")||(r.fillV<0.4&&r.gauge==="bad"),"jauge = Remplissage : "+r.gauge+" / "+r.fillV);
  ok(r.weak.length? r.sum.includes("À améliorer : ") : !/améliorer|atteints/.test(r.sum),"verdict tiré des sous-scores : "+r.sum);
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  console.log(fail.length? "Score du Labo v3 : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "Score du Labo v3 : 3 cas iPhone (25, sans note, 4), pas de note avec un seul rôle, Q × T, plafonds, 100 à 98 brut, décor hors note, jauge et verdict cohérents");
  await b.close(); process.exit(fail.length?1:0); })();
