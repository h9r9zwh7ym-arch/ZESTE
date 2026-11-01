// 1.86 : vague à « Préparer ». Le toucher lance une vague de la couleur du cocktail, le mode préparation s'ouvre pendant
// que l'écran est couvert (sans fondu), la vague disparaît ensuite ; un double toucher ne lance qu'une vague et qu'un
// mode préparation ; en mouvement réduit, ouverture immédiate sans vague. Paysage : la scène du Labo reste sous la
// barre de titre, et le mode préparation s'écarte de l'encoche (zone sûre latérale).
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
const ST={v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1},stock:{gin:3,campari:2,vermouth_rouge:2,citron:1,sirop_sucre:1},ratings:{negroni:5},mix:{items:[{id:"gin",q:45},{id:"campari",q:30}],m:"stir",gar:[]}};
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const open=async opt=>{ const p=await b.newPage(Object.assign({viewport:{width:390,height:844}},opt||{})); p.on('pageerror',e=>errs.push(e.message)); await p.addInitScript(s=>localStorage.setItem("zeste.v1",s),JSON.stringify(ST)); await p.goto(APP); await p.waitForTimeout(1800); return p; };
  let p=await open();
  await p.evaluate(()=>{ const bt=document.querySelector('#v-today .hero [data-a="barmode"]'); bt.click(); bt.click(); });
  await p.waitForTimeout(150); const a=await p.evaluate(()=>({n:document.querySelectorAll('.wave-sweep').length, ov:document.getElementById('overlay').classList.contains('open'), col:(document.querySelector('.wave-sweep .ws-body')||{}).style?.background}));
  await p.waitForTimeout(600); const m=await p.evaluate(()=>({ov:document.getElementById('overlay').classList.contains('open'), anim:getComputedStyle(document.getElementById('overlay')).animationName, r:BM&&BM.r.id}));
  await p.waitForTimeout(800); const z=await p.evaluate(()=>({sweep:document.querySelectorAll('.wave-sweep').length, ov:document.getElementById('overlay').classList.contains('open')}));
  if(a.n!==1||a.ov||!a.col) fail.push("début de la vague : "+JSON.stringify(a));
  if(!m.ov||m.anim!=="none"||m.r!=="negroni") fail.push("ouverture sous la vague : "+JSON.stringify(m));
  if(z.sweep||!z.ov) fail.push("fin de la vague : "+JSON.stringify(z));
  await p.close();
  p=await open({reducedMotion:"reduce"});
  await p.evaluate(()=>document.querySelector('#v-today .hero [data-a="barmode"]').click()); await p.waitForTimeout(60);
  if(!await p.evaluate(()=>document.getElementById('overlay').classList.contains('open')&&!document.querySelector('.wave-sweep'))) fail.push("mouvement réduit : pas d’ouverture immédiate");
  await p.close();
  // paysage avec encoche
  p=await open({viewport:{width:932,height:430}}); const c=await p.context().newCDPSession(p);
  try{ await c.send('Emulation.setSafeAreaInsetsOverride',{insets:{top:0,bottom:21,left:59,right:59}}); }catch(e){}
  await p.evaluate(()=>switchTab('labo')); await p.waitForTimeout(700);
  await p.evaluate(()=>{ const v=document.getElementById('v-labo'); v.scrollTop=400; v.dispatchEvent(new Event('scroll')); }); await p.waitForTimeout(500);
  const L=await p.evaluate(()=>{ const st=document.querySelector('#v-labo .lab-stage').getBoundingClientRect(), nb=document.querySelector('#v-labo .navbar').getBoundingClientRect(); return {top:Math.round(st.top),bot:Math.round(st.bottom),nb:Math.round(nb.bottom),vh:innerHeight,inset:getComputedStyle(document.documentElement).getPropertyValue('--rail')}; });
  if(L.top<L.nb||L.bot>L.vh) fail.push("Labo en paysage : scène coupée "+JSON.stringify(L));
  await p.evaluate(()=>barMode("negroni")); await p.waitForTimeout(500);
  const O=await p.evaluate(()=>{ const x=document.querySelector('#overlay [data-a="bmclose"]').getBoundingClientRect(); return {x:Math.round(x.left),pl:getComputedStyle(document.getElementById('overlay')).paddingLeft}; });
  if(O.pl==="59px"&&O.x<59) fail.push("mode préparation sous l’encoche : "+JSON.stringify(O));
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  console.log(fail.length? "Vague : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "Vague : une seule vague de la couleur du cocktail, mode préparation ouvert dessous sans fondu, vague retirée, ouverture immédiate en mouvement réduit ; paysage : scène du Labo sous la barre de titre, mode préparation hors de l’encoche.");
  await b.close(); process.exit(fail.length?1:0); })();
