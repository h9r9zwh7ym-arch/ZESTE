// 1.77 : « Sans alcool », « Le saviez-vous » et « De saison » réunis en un bloc « À découvrir » à onglets.
// Un seul contenu à la fois ; l'onglet choisi est gardé ; une section désactivée perd son onglet ; s'il n'en reste
// qu'une, elle reprend son titre sans onglets ; « Tout voir » de « Sans alcool » marche ; aucune erreur.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ const O=Date,T=new O(2026,10,1,19).getTime(); globalThis.Date=class extends O{ constructor(...a){ if(!a.length) return new O(T); return new O(...a);} static now(){return T;} };
    if(!localStorage.getItem("zeste.v1")) localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1},stock:{gin:3,citron:2,sirop_sucre:1,eau_gazeuse:2,menthe:1,citron_vert:2}})); });
  await p.goto(APP); await p.waitForTimeout(2200); await p.evaluate(()=>switchTab('today')); await p.waitForTimeout(700);
  const st=()=>p.evaluate(()=>{ const m=document.querySelectorAll('#v-today .home-mix'); const e=m[0]; return {n:m.length, k:e&&e.dataset.k, title:e&&e.querySelector('h2.sh').childNodes[0].textContent, tabs:e?[...e.querySelectorAll('[data-a="hometab"]')].map(x=>x.dataset.k+(x.classList.contains("on")?"*":"")):[], old:[...document.querySelectorAll('#v-today h2.sh')].map(h=>h.childNodes[0].textContent.trim()).filter(t=>/^(Sans alcool|Le saviez-vous|De saison)/.test(t)).length, season:!!document.querySelector('#v-today .home-mix .card.season'), disc:!!document.querySelector('#v-today .home-mix [data-a="flip"]')}; });
  let s=await st();
  if(s.n!==1||s.title!=="À découvrir"||s.tabs.join()!=="na*,disc,season"||s.old) fail.push("bloc initial : "+JSON.stringify(s));
  await p.click('#v-today [data-a="hometab"][data-k="season"]'); await p.waitForTimeout(500); s=await st();
  if(s.k!=="season"||!s.season||s.tabs.join()!=="na,disc,season*") fail.push("onglet De saison : "+JSON.stringify(s));
  await p.click('#v-today [data-a="hometab"][data-k="disc"]'); await p.waitForTimeout(500); s=await st();
  if(s.k!=="disc"||!s.disc) fail.push("onglet Le saviez-vous : "+JSON.stringify(s));
  // gardé : écrit dans la sauvegarde, et repris au rendu suivant (pas de rechargement : en file://, le stockage n'est pas fiable au rechargement)
  const saved=await p.evaluate(()=>{ try{ return JSON.parse(localStorage.getItem(KEY)).settings.homeTab; }catch(e){ return "?"; } });
  await p.evaluate(()=>{ switchTab('bar'); switchTab('today'); dirty.today=1; renderView('today'); }); await p.waitForTimeout(500); s=await st();
  if(saved!=="disc"||s.k!=="disc") fail.push("onglet non gardé : sauvegarde "+saved+", affiché "+s.k);
  // désactiver « Le saviez-vous » puis « Sans alcool »
  await p.evaluate(()=>{ S.settings.home.forEach(x=>{ if(x[0]==="disc") x[1]=0; }); changed(); }); await p.waitForTimeout(500); s=await st();
  if(s.tabs.join()!=="na*,season") fail.push("disc désactivé : "+JSON.stringify(s));
  await p.evaluate(()=>{ S.settings.home.forEach(x=>{ if(x[0]==="na") x[1]=0; }); changed(); }); await p.waitForTimeout(500); s=await st();
  if(s.title!=="De saison"||s.tabs.length||!s.season) fail.push("une seule section : "+JSON.stringify(s));
  // « Tout voir » de Sans alcool
  await p.evaluate(()=>{ S.settings.home.forEach(x=>{ if(x[0]==="na"||x[0]==="disc") x[1]=1; }); S.settings.homeTab="na"; changed(); }); await p.waitForTimeout(500);
  await p.click('#v-today .home-mix [data-a="nafilter"]'); await p.waitForTimeout(700);
  if(!await p.evaluate(()=>TAB==="cocktails"&&(CF.type||[]).includes("sans"))) fail.push("« Tout voir » Sans alcool ne filtre pas");
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  console.log(fail.length? "À découvrir : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "À découvrir : un bloc à 3 onglets à la place de 3 sections, onglet gardé dans la sauvegarde, sections désactivées retirées (titre seul s’il en reste une), « Tout voir » Sans alcool.");
  await b.close(); process.exit(fail.length?1:0); })();
