// 1.83 : paysage et grands écrans. En portrait, rien ne change (barre d'onglets en bas). En paysage iPhone (844 × 390) et
// sur iPad (1180 × 820) : rail d'onglets à gauche avec la pastille sur l'onglet actif, vues décalées du rail, accueil en
// deux colonnes (verre à gauche du nom), Labo en deux colonnes (scène à gauche, ingrédients à droite), aucune page plus
// large que l'écran ; en tournant l'appareil, la mise en page et la pastille suivent sans recharger.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1},stock:{gin:3,campari:2,vermouth_rouge:2},ratings:{negroni:5},mix:{items:[{id:"gin",q:45},{id:"campari",q:30}],m:"stir",gar:[]}})); });
  await p.goto(APP); await p.waitForTimeout(2000);
  const look=async t=>{ await p.evaluate(t=>switchTab(t),t); await p.waitForTimeout(700); return p.evaluate(()=>{ const tb=document.querySelector('.tabbar'), cs=getComputedStyle(tb), on=tb.querySelector('button.on').getBoundingClientRect(), ind=tb.querySelector('.tab-ind').getBoundingClientRect(), v=document.querySelector('.view.on')||[...document.querySelectorAll('.view')].find(x=>getComputedStyle(x).display!=="none");
      const hero=document.querySelector('#v-today .hero'), hg=hero&&hero.querySelector('.hg').getBoundingClientRect(), hn=hero&&hero.querySelector('.hn').getBoundingClientRect();
      const st=document.querySelector('#v-labo .lab-stage'), seg=document.querySelector('#v-labo .lab-stage ~ .seg, #v-labo .content > .seg:not(:first-of-type)');
      return {dir:cs.flexDirection, rail:Math.round(tb.getBoundingClientRect().width), vleft:Math.round(v.getBoundingClientRect().left), indIn:ind.top>=on.top-2&&ind.bottom<=on.bottom+2&&ind.left>=on.left-2&&ind.right<=on.right+2, wide:document.documentElement.scrollWidth>innerWidth+1||[...document.querySelectorAll('.view')].some(x=>x.scrollWidth>x.clientWidth+4),
        heroSide:hg&&hn?hn.left>hg.right-4:null, stageLeft:st&&getComputedStyle(st).display!=="none"?Math.round(st.getBoundingClientRect().right):null}; }); };
  // portrait
  let r=await look("today"); if(r.dir!=="row"||r.vleft!==0||r.heroSide) fail.push("portrait changé : "+JSON.stringify(r));
  // paysage iPhone
  await p.setViewportSize({width:844,height:390}); await p.waitForTimeout(500);
  r=await look("today"); if(r.dir!=="column"||r.vleft<r.rail-1||!r.indIn||!r.heroSide||r.wide) fail.push("paysage, accueil : "+JSON.stringify(r));
  r=await look("labo"); const lab=await p.evaluate(()=>{ const st=document.querySelector('#v-labo .lab-stage').getBoundingClientRect(), ing=document.querySelector('#v-labo .lab-stage ~ h2, #v-labo .content > h2')?.getBoundingClientRect(); return {st:Math.round(st.right), ing:ing&&Math.round(ing.left)}; });
  if(!r.indIn||!(lab.ing>=lab.st)||r.wide) fail.push("paysage, Labo : "+JSON.stringify({r,lab}));
  for(const t of ["cocktails","bar","profil"]){ r=await look(t); if(r.wide||!r.indIn) fail.push("paysage, "+t+" : "+JSON.stringify(r)); }
  // iPad
  await p.setViewportSize({width:1180,height:820}); await p.waitForTimeout(500);
  r=await look("today"); if(r.dir!=="column"||!r.heroSide||r.wide||!r.indIn) fail.push("iPad, accueil : "+JSON.stringify(r));
  // retour en portrait
  await p.setViewportSize({width:390,height:844}); await p.waitForTimeout(500);
  r=await look("bar"); if(r.dir!=="row"||r.vleft!==0||!r.indIn) fail.push("retour en portrait : "+JSON.stringify(r));
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  console.log(fail.length? "Paysage : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "Paysage : portrait inchangé ; en paysage iPhone et sur iPad, rail d’onglets avec pastille, accueil et Labo en deux colonnes, aucune page trop large ; la rotation suit sans recharger.");
  await b.close(); process.exit(fail.length?1:0); })();
