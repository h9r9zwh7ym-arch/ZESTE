// 1.61 (B) : score du Labo. Quatre sous-scores continus, mot court selon le score, 100 seulement à partir de 98 brut,
// plafond quand un critère est rédhibitoire (débordement, « sec et fort » sans alcool), décor hors note,
// sous-scores dans « Voir l'analyse détaillée », seuils des défis et du trophée « Chef de bar » recalés, trophées obtenus conservés.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false}},stock:{gin:3,rhum_blanc:1},labBest:91,tro:["labpro","lab1"],troT:{labpro:1,lab1:1},chal:{mini_1:80}})); });
  await p.goto(APP); await p.waitForTimeout(2500);
  const r=await p.evaluate(()=>{ const sc=(items,o)=>{ S.mix=Object.assign({m:"shake",g:null,gUser:0,ice:null,gar:[],t:"auto"},o||{},{items}); STC={}; MEMO={}; return labScore(analyze()); };
    const dq=[{id:"rhum_blanc",q:60},{id:"citron_vert",q:20},{id:"sirop_sucre",q:15}];
    const base=sc(dq), sweet3=sc([{id:"rhum_blanc",q:60},{id:"citron_vert",q:20},{id:"sirop_sucre",q:45}]), dry=sc([{id:"rhum_blanc",q:60},{id:"citron_vert",q:20}]);
    const over=sc([{id:"gin",q:60},{id:"tonic",q:200}],{m:"build",g:"martini",gUser:1,ice:"none"}), noalc=sc([{id:"orange",q:60},{id:"sirop_sucre",q:10}],{m:"stir",t:"sec"});
    const garA=sc(dq,{gar:[]}).score, garB=sc(dq,{gar:["cv"]}).score;
    const raws=[]; for(let k=0;k<400;k++){ const s=sc([{id:"rhum_blanc",q:40+k%30},{id:"citron_vert",q:10+(k*7)%25},{id:"sirop_sucre",q:5+(k*3)%30}]); raws.push([s.raw,s.score]); }
    return {base:[base.score,base.goals.map(g=>g[0])], sweet3:sweet3.score, dry:dry.score, over:[over.score,over.red], noalc:[noalc.score,noalc.red], garA, garB, raws,
      grade:[30,40,69,70,89,90,100].map(s=>labGrade(s)[0]), chal:weekChallenges().map(c=>[c.key.split("_")[0],c.min]), pro:TROPHIES.find(t=>t[0]==="labpro").slice(2,4),
      tro:(checkTrophies(),S.tro.includes("labpro")), best:S.labBest, chalOld:S.chal.mini_1 }; });
  const ok=(c,m)=>{ if(!c) fail.push(m); };
  ok(JSON.stringify(r.base[1])==='["bal","abv","fill","ice","gar"]',"quatre sous-scores + décor : "+r.base[1]);
  ok(r.base[0]>=90,"Daiquiri classique ≥ 90 : "+r.base[0]); ok(r.sweet3<r.base[0]&&r.dry<r.base[0],"plus de sucre ou pas de sucre fait baisser : "+[r.base[0],r.sweet3,r.dry]);
  ok(r.dry<90,"Daiquiri sans sucre < 90 : "+r.dry);
  ok(r.over[1]&&r.over[0]<=35,"débordement : plafond 35 : "+r.over); ok(r.noalc[1]&&r.noalc[0]<=35,"sec et fort sans alcool : plafond 35 : "+r.noalc);
  ok(r.garA===r.garB,"le décor ne change pas la note : "+r.garA+"/"+r.garB);
  ok(r.raws.every(([raw,s])=>raw>=98?s===100:s===Math.floor(raw)&&s<=97),"100 seulement à partir de 98 brut");
  ok(JSON.stringify(r.grade)==='["Déséquilibré","Buvable","Buvable","Réussi","Réussi","Proche d’un classique","Proche d’un classique"]',"mots : "+r.grade);
  const MIN={ing:93,mini:94,long:93,light:93,swiss:94,red:94,zero:95,deco:95,bitter:95,strong:95,bubbles:95,mystery:96,five:96,perfect:97};
  ok(r.chal.every(([k,m])=>MIN[k]===m),"seuils des défis : "+JSON.stringify(r.chal)); ok(r.pro[1]===96&&/96\/100/.test(r.pro[0]),"Chef de bar à 96 : "+r.pro);
  ok(r.tro&&r.best===91&&r.chalOld===80,"trophée obtenu conservé, anciens scores non recalculés");
  // affichage : sous-scores et mini-barres dans l'analyse détaillée, sans texte ajouté
  await p.evaluate(()=>{ S.mix={m:"shake",g:null,gUser:0,ice:null,gar:[],t:"auto",items:[{id:"rhum_blanc",q:60},{id:"citron_vert",q:20},{id:"sirop_sucre",q:15}]}; LT="compose"; switchTab("labo"); });
  await p.waitForTimeout(500);
  const d=await p.evaluate(()=>{ const m=document.querySelector('.lab-more'); const rows=[...(m?m.querySelectorAll('.lab-sub-s'):[])];
    return {n:rows.length, names:rows.map(x=>x.querySelector('span').textContent), bars:rows.filter(x=>x.querySelector('.ls-bar i')).length, zones:m?m.querySelectorAll('.metric .zone').length:0}; });
  ok(d.n===4&&d.bars===4&&d.names.join()==="Équilibre,Force,Remplissage,Glace","4 sous-scores avec mini-barre : "+JSON.stringify(d));
  ok(d.zones===3,"barres alcool, sucre et acidité conservées : "+d.zones);
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  console.log(fail.length? "Score du Labo : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "Score du Labo : sous-scores, mots, 100 à 98 brut, plafonds, décor hors note, seuils et affichage OK");
  await b.close(); process.exit(fail.length?1:0); })();
