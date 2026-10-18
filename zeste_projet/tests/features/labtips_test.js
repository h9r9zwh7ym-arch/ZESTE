// 1.67 : dans le Labo, chaque conseil chiffré (« + » pour ajouter, « − » pour réduire) fait monter la note affichée ;
// la fiche « Équilibre » ne propose que ces corrections vérifiées.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
const MIXES=[
  ["trop sucré",{m:"shake",items:[{id:"gin",q:45},{id:"citron",q:10},{id:"sirop_sucre",q:40}]}],
  ["trop acide",{m:"shake",items:[{id:"rhum_blanc",q:45},{id:"citron_vert",q:45},{id:"sirop_sucre",q:5}]}],
  ["trop fort",{m:"stir",items:[{id:"bourbon",q:90},{id:"vermouth_rouge",q:10}]}],
  ["sec trop sucré",{m:"stir",items:[{id:"vodka",q:50},{id:"kahlua",q:30}]}],
  ["vodka citron",{m:"shake",items:[{id:"vodka",q:100},{id:"citron",q:10}]}]];
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[]; const seen={add:0,less:0}; const log=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1},stock:{gin:1,rhum_blanc:1,bourbon:1,vodka:1,kahlua:1,vermouth_rouge:1}})); });
  await p.goto(APP); await p.waitForTimeout(2500);
  const score=()=>p.evaluate(()=>{ const e=document.querySelector('#v-labo .lab-live b'); return e? +e.textContent : null; });
  for(const [n,x] of MIXES){
    await p.evaluate(x=>{ S.mix={m:x.m,g:null,gUser:0,ice:null,gar:[],t:"auto",items:x.items.map(i=>({id:i.id,q:i.q}))}; LT="compose"; switchTab("labo"); changed(); },x); await p.waitForTimeout(500);
    const tips=await p.evaluate(()=>[...document.querySelectorAll('#v-labo .tip-r [data-a="mixfix"]')].map(e=>({id:e.dataset.id,q:+e.dataset.q,t:(e.closest('.tip-r').querySelector('.tip-t')||{}).textContent||""})));
    const s0=await score(); if(s0==null){ fail.push(n+" : pas de note affichée"); continue; }
    for(const t of tips){
      await p.evaluate(x=>{ S.mix.items=x.items.map(i=>({id:i.id,q:i.q})); changed(); },x); await p.waitForTimeout(300);
      await p.click(`#v-labo .tip-r [data-a="mixfix"][data-id="${t.id}"][data-q="${t.q}"]`); await p.waitForTimeout(400);
      const s1=await score(); log.push(n+" : "+t.t+" "+s0+"→"+s1); if(!(s1>s0)) fail.push(n+" : « "+t.t+" » "+s0+" → "+s1);
      if(t.q<0){ seen.less++; if(!/^Réduire /.test(t.t)) fail.push(n+" : libellé de réduction « "+t.t+" »"); } else seen.add++; }
    // fiche « Équilibre » : chaque bouton proposé fait monter la note
    await p.evaluate(x=>{ S.mix.items=x.items.map(i=>({id:i.id,q:i.q})); changed(); },x); await p.waitForTimeout(300);
    const ga=await p.evaluate(()=>{ const s=labScore(analyze()).score, out=[]; for(const k of ["bal","abv"]){ const a=goalAdvice(k); a.acts.forEach(([l,f])=>{ const bk=JSON.stringify(S.mix.items); f(); out.push([k,l,s,labScore(analyze()).score]); S.mix.items=JSON.parse(bk); changed(); }); } return out; });
    ga.forEach(([k,l,a,c])=>{ if(!(c>a)) fail.push(n+" : fiche "+k+" « "+l+" » "+a+" → "+c); });
  }
  if(!seen.add) fail.push("aucun conseil d’ajout rencontré"); if(!seen.less) fail.push("aucun conseil de réduction rencontré");
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  if(process.env.V) console.error(log.join("\n"));
  console.log(fail.length? "Conseils du Labo : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : `Conseils du Labo : ${seen.add} ajouts et ${seen.less} réductions cliqués, la note monte à chaque fois ; fiche Équilibre/Force cohérente.`);
  await b.close(); process.exit(fail.length?1:0); })();
