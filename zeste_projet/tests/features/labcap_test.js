// 1.56 (labo) : contenance d'un verre réglable (feuille ouverte par « x / y cl », stepper 1 cl, bornes 5–100, Rétablir) ;
// jauge, tuile et ajout cohérents ; sauvegarde et restauration ; plus de volume minimal (1 cl puis 0,5 cl versés),
// refus seulement verre plein, avec un seul message.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ if(/[?&]r=1/.test(location.search)) return; localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1},stock:{gin:3,tonic:1,vodka:2,campari:2}})); });
  await p.goto(APP); await p.waitForTimeout(2500); const q=(f,a)=>p.evaluate(f,a);
  await q(()=>{ S.mix=Object.assign(S.mix,{m:"build",g:"highball",gUser:1,ice:"none",gar:[],items:[{id:"gin",q:50},{id:"tonic",q:100}]}); LT="compose"; switchTab("labo"); dirty.labo=1; renderView("labo"); }); await p.waitForTimeout(800);
  // la légende ouvre la feuille ; pas encore de Rétablir
  await q(()=>document.querySelector('#v-labo button.lab-legend').scrollIntoView({block:"center"})); await p.waitForTimeout(200);
  const lg=await q(()=>{ const e=document.querySelector('#v-labo button.lab-legend'), r=e.getBoundingClientRect(); return {h:r.height, chev:!!e.querySelector('.chev'), ice:!!document.querySelector('#v-labo .lab-legice')}; });
  if(lg.h<44||!lg.chev||lg.ice) fail.push('légende : '+JSON.stringify(lg));
  await p.tap('#v-labo button.lab-legend'); await p.waitForTimeout(500);
  if(!await q(()=>/Contenance/.test(document.querySelector('.sheet:last-of-type').textContent)&&!document.querySelector('.sheet:last-of-type [data-a="capreset"]'))) fail.push('feuille Contenance absente ou Rétablir déjà visible');
  // 35 → 28 cl
  for(let i=0;i<7;i++){ await p.tap('.sheet:last-of-type [data-a="capset"][data-d="-1"]'); await p.waitForTimeout(150); }
  const c=await q(()=>({cap:S.settings.glassCap&&S.settings.glassCap.highball, avail:labAvail("highball","none"), sheet:document.querySelector('.sheet:last-of-type .cap-row .stepper span').textContent, reset:!!document.querySelector('.sheet:last-of-type [data-a="capreset"]')}));
  if(c.cap!==28||c.avail!==280||!/^28\s+cl$/.test(c.sheet)||!c.reset) fail.push('réglage : '+JSON.stringify(c));
  await q(()=>closeAll()); await p.waitForTimeout(400);
  const v=await q(()=>({legend:document.querySelector('#v-labo button.lab-legend').textContent, tile:document.querySelector('#v-labo [data-a="mixglass"][data-v="highball"] span:last-of-type').textContent}));
  if(!/\/\s+28\s+cl/.test(v.legend)||!/28\s+cl/.test(v.tile)) fail.push('jauge ou tuile : '+JSON.stringify(v));
  // bornes
  const bounds=await q(()=>{ S.settings.glassCap={highball:6}; ACT.capset({d:"-1"}); ACT.capset({d:"-1"}); const lo=S.settings.glassCap.highball; S.settings.glassCap={highball:99}; ACT.capset({d:"1"}); ACT.capset({d:"1"}); return [lo,S.settings.glassCap.highball]; });
  if(bounds[0]!==5||bounds[1]!==100) fail.push('bornes : '+bounds);
  // sauvegarde : healState rejette les valeurs invalides ; sanitizeBackup garde les valides
  const h=await q(()=>{ S.settings.glassCap={highball:28,coupe:500,nope:20,rocks:"x"}; healState(); const a=JSON.stringify(S.settings.glassCap); const bk=sanitizeBackup({stock:{gin:1},settings:{glassCap:{highball:28,martini:3}}}); return [a,JSON.stringify(bk.settings.glassCap)]; });
  if(h[0]!=='{"highball":28}'||h[1]!=='{"highball":28}') fail.push('validation : '+h.join(" "));
  // redémarrage depuis la sauvegarde par le chemin du lancement (DEF + fixState) : en file://, une navigation relit parfois un stockage vide (piège 17)
  await q(()=>{ save(); S=Object.assign(DEF(),JSON.parse(localStorage.getItem(KEY))); fixState(); }); await p.waitForTimeout(300);
  if(await q(()=>!(S.settings.glassCap&&S.settings.glassCap.highball===28&&labAvail("highball","none")===280))) fail.push('contenance perdue au rechargement');
  // Rétablir
  await q(()=>{ LT="compose"; switchTab("labo"); S.mix.g="highball"; S.mix.gUser=1; changed(); capSheet(); }); await p.waitForTimeout(500);
  await p.tap('.sheet:last-of-type [data-a="capreset"]'); await p.waitForTimeout(400);
  if(await q(()=>!!(S.settings.glassCap&&S.settings.glassCap.highball)||labAvail("highball","none")!==350||!!document.querySelector('.sheet:last-of-type [data-a="capreset"]'))) fail.push('Rétablir');
  await q(()=>closeAll()); await p.waitForTimeout(300);
  // plus de volume minimal : 1 cl puis 0,5 cl restants
  const fill=async left=>q(left=>{ S.mix.items=[{id:"gin",q:50},{id:"tonic",q:10}]; const t=S.mix.items[1]; while(labFitsWith(S.mix.items.map(i=>Object.assign({},i,{q:i.q+(i===t?0.1:0)})))) t.q=Math.round((t.q+0.1)*10)/10; t.q=Math.round((t.q-left)*10)/10; changed(); },left);
  const pour=async id=>{ await q(id=>{ document.querySelector(`#v-labo .shelf[data-id="${id}"]`).scrollIntoView({block:"center",inline:"center"}); },id); await p.waitForTimeout(200); await p.tap(`#v-labo .shelf[data-id="${id}"]`); await p.waitForTimeout(450); };
  await fill(10); await pour("vodka");
  let r=await q(()=>({v:(S.mix.items.find(i=>i.id==="vodka")||{}).q, fits:labFits(S.mix.items)}));
  if(!(r.v>=9&&r.v<=11)||!r.fits) fail.push('1 cl restant : '+JSON.stringify(r));
  await fill(5); await q(()=>{ S.mix.items=S.mix.items.filter(i=>i.id!=="vodka"); changed(); }); await p.waitForTimeout(300); await pour("vodka");
  r=await q(()=>({v:(S.mix.items.find(i=>i.id==="vodka")||{}).q, fits:labFits(S.mix.items)}));
  if(!(r.v>=4&&r.v<=6)||!r.fits) fail.push('0,5 cl restant : '+JSON.stringify(r));
  // verre plein : refus, un seul message
  await fill(0); await q(()=>{ S.mix.items=S.mix.items.filter(i=>i.id!=="vodka"); changed(); document.getElementById('toast').classList.remove('show'); }); await p.waitForTimeout(300);
  const before=await q(()=>JSON.stringify(S.mix.items)); await pour("campari");
  r=await q(()=>({same:JSON.stringify(S.mix.items), toasts:document.querySelectorAll('#toast.show').length, msg:document.getElementById('toast').textContent}));
  if(r.same!==before||r.toasts!==1||!/Plus de place/.test(r.msg)) fail.push('verre plein : '+JSON.stringify({changed:r.same!==before,toasts:r.toasts,msg:r.msg}));
  if(errs.length) fail.push('erreurs JS : '+[...new Set(errs)].join(' | '));
  console.log(fail.length?'ÉCHEC contenance : '+fail.join(' ; '):'Contenance : réglable (5–100 cl, Rétablir), jauge, tuile et ajout cohérents, gardée au rechargement et validée ; ajout de 1 cl puis 0,5 cl ; verre plein refusé avec un seul message.');
  await b.close(); process.exit(fail.length?1:0); })();
