// 1.38 (chaque chose à sa place) : un rôle par onglet, une information à un seul endroit, fiche recette dans l'ordre d'usage.
const {chromium}=require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ const n=Date.now(), ids=["negroni","daiquiri","gin_tonic","margarita","old_fashioned"], hist=[];
    for(let i=0;i<20;i++) hist.push({id:ids[i%ids.length],t:n-i*0.5*864e5-3600e3});
    localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false}},stock:{gin:3,campari:2,vermouth_rouge:1,rhum_blanc:2,tequila:1,triple_sec:1,whisky_bourbon:2},
      ratings:{negroni:5,daiquiri:4,old_fashioned:5},hist,preps:[{id:"p1",tpl:"sirop_sucre",d:new Date(n-2*864e5).toISOString(),name:"Sirop de sucre"}]})); });
  await p.goto('file://'+path.join(__dirname,'../../dist/zeste.html')); await p.waitForTimeout(3000);
  const q=(f,a)=>p.evaluate(f,a);
  // Aujourd'hui : ce qu'on boit maintenant, pas de récap ni d'achat (Profil et Bar)
  const t=await q(()=>({rw:document.querySelectorAll('#v-today [data-a="rwmonth"],#v-today [data-a="rewind"]').length, buy:document.querySelectorAll('#v-today .duo [data-a="ing"]').length, surprise:!!document.querySelector('#v-today [data-a="roulette"]')}));
  if(t.rw||t.buy||!t.surprise) fail.push('accueil : '+JSON.stringify(t));
  // Cocktails : « Sans alcool » est un filtre, pas une puce à part ; une famille n'apparaît pas deux fois dans les filtres
  await q(()=>switchTab("cocktails")); await p.waitForTimeout(600);
  if(await q(()=>!!document.querySelector('#v-cocktails [data-a="cmain"][data-v="na"]'))) fail.push('cocktails : puce « 0 % » encore là');
  await q(()=>ACT.nafilter()); await p.waitForTimeout(600);
  const na=await q(()=>({type:CF.type.slice(),banner:!!document.querySelector('#v-cocktails .na-banner'),all:filtered().every(r=>typeOf(r)==="sans")}));
  if(na.type.join()!=="sans"||!na.banner||!na.all) fail.push('sans alcool : '+JSON.stringify(na));
  await q(()=>filterSheet()); await p.waitForTimeout(500);
  const dup=await q(()=>[...document.querySelectorAll('.sheet [data-g="fam"]')].map(b=>b.dataset.k).filter(k=>["bulles","chaud","shot","na"].includes(k)));
  if(dup.length) fail.push('filtres : familles en double '+dup.join(","));
  await q(()=>{ ACT.resetf(); closeAll(); }); await p.waitForTimeout(400);
  // Bar : Liste et Étagère ; « Presque vides » en ligne qui ouvre la liste
  await q(()=>switchTab("bar")); await p.waitForTimeout(600);
  const bar=await q(()=>({seg:document.querySelectorAll('#v-bar [data-a="barview"]').length, low:!!document.querySelector('#v-bar [data-a="lowsheet"]'), tip:/Astuce/.test(document.querySelector('#v-bar').textContent)}));
  if(bar.seg!==1||!bar.low||bar.tip) fail.push('bar : '+JSON.stringify(bar));
  await p.click('#v-bar [data-a="lowsheet"]'); await p.waitForTimeout(500);
  if(!await q(()=>document.querySelectorAll('.sheet .low-row').length)) fail.push('bar : « Presque vides » vide'); await q(()=>closeAll()); await p.waitForTimeout(400);
  // Labo : Composer | Fait maison (préparations en cours et recettes réunies), défis sous l'atelier
  await q(()=>switchTab("labo")); await p.waitForTimeout(600);
  const lab=await q(()=>{ const v=document.querySelector('#v-labo'), h=v.innerHTML; return {seg:[...v.querySelectorAll('[data-a="lt"]')].map(b=>b.textContent), chalAfter:h.indexOf("Défis de la semaine")>h.indexOf("lab-stage")}; });
  if(lab.seg.join("|")!=="Composer|Fait maison"||!lab.chalAfter) fail.push('labo : '+JSON.stringify(lab));
  await p.click('#v-labo [data-a="lt"][data-t="home"]'); await p.waitForTimeout(500);
  const home=await q(()=>({prep:document.querySelectorAll('#v-labo [data-a="prep"]').length, tech:document.querySelectorAll('#v-labo [data-a="tech"]').length}));
  if(!home.prep||home.tech<10) fail.push('fait maison : '+JSON.stringify(home));
  // Profil : moi (récaps ici), sans l'explication des suggestions (dans Paramètres › Suggestions)
  await q(()=>switchTab("profil")); await p.waitForTimeout(700);
  const pr=await q(()=>({guide:/Ce qui guide/.test(document.querySelector('#v-profil').textContent), recap:!!document.querySelector('#v-profil [data-a="rwmonth"],#v-profil [data-a="rewind"]')}));
  if(pr.guide||!pr.recap) fail.push('profil : '+JSON.stringify(pr));
  await q(()=>{ settingsSheet(); }); await p.waitForTimeout(500);
  if(await q(()=>!!document.querySelector('.sheet [data-a="basics"]'))) fail.push('réglages : « Contenu additionnel » en double avec le Bar');
  await q(()=>ACT.setgroup({g:"reco"})); await p.waitForTimeout(500);
  if(!await q(()=>/Ce qui guide tes suggestions/.test(document.querySelector('.sheet:last-of-type').textContent))) fail.push('Suggestions : explication absente');
  await q(()=>closeAll()); await p.waitForTimeout(400);
  // Fiche recette : ingrédients, préparation, puis ton avis ; la garniture n'est pas répétée
  await q(()=>recSheet("negroni")); await p.waitForTimeout(700);
  const rs=await q(()=>{ const hs=[...document.querySelectorAll('.sheet h2.sh')].map(h=>h.childNodes[0].textContent.trim()); const txt=document.querySelector('.sheet').textContent; return {hs, gar:(txt.match(/demi-rondelle d’orange/g)||[]).length}; });
  const ix=k=>rs.hs.indexOf(k);
  if(!(ix("Ingrédients")<ix("Préparation")&&ix("Préparation")<ix("Ton avis"))||ix("Ma note perso")>=0||rs.gar!==1) fail.push('fiche recette : '+JSON.stringify(rs));
  if(errs.length) fail.push('erreurs JS : '+errs.join(' | '));
  console.log(fail.length?'ÉCHEC organisation : '+fail.join(' ; '):'Organisation : un rôle par onglet, sans alcool en filtre, Bar Liste/Étagère + Presque vides, Labo Composer/Fait maison, récaps au Profil, explication des suggestions dans les réglages, fiche recette dans l’ordre d’usage.');
  await b.close(); process.exit(fail.length?1:0); })();
