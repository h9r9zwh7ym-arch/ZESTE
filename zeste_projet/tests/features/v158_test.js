// 1.58 : « Ta version » (− et + de 44×44 tactiles aux extrémités, piste pleine largeur de 44 px tactiles — 28 px visibles depuis 1.59 —, hauteur de ligne fixe, bornes),
// pictos de l'étagère ≥ 3:1 dans les deux thèmes, plus de pastille de dose (bordure d'accent gardée, aussi en sombre),
// carte découverte sans consigne (icône de rotation avec nom accessible, action inchangée), à 375 et 390 px.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
const LUM=`window.__lum=c=>{ const m=c.match(/[\\d.]+/g).map(Number), f=v=>{ v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4); }; return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2]); }; window.__ratio=(a,b)=>{ const x=__lum(a), y=__lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };`;
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  for(const sc of ["light","dark"]) for(const w of [375,390]){ const k=sc+" "+w;
    const p=await b.newPage({viewport:{width:w,height:w===375?667:844},colorScheme:sc,hasTouch:true,isMobile:true}); p.on('pageerror',e=>errs.push(e.message));
    await p.addInitScript(()=>{ if(/[?&]r=1/.test(location.search)) return; localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1},stock:{gin:3,rhum_blanc:2,citron_vert:1,citron:1,menthe:1,blanc_oeuf:1,sirop_sucre:1},adj:{daiquiri:{s:-2,a:0,f:1}}})); });
    await p.addInitScript(LUM); await p.goto(APP); await p.waitForTimeout(2500); const q=(f,a)=>p.evaluate(f,a);
    // « Ta version »
    await q(()=>recSheet('daiquiri')); await p.waitForTimeout(800);
    const A=await q(()=>[...document.querySelectorAll('.sheet .card.adj .adj-row')].map(r=>{ const R0=e=>e.getBoundingClientRect(), R=e=>{ const b=R0(e), a=getComputedStyle(e,'::after'), n=v=>Math.min(0,parseFloat(v)||0); return a.content!=='none'&&a.position==='absolute'?{width:b.width-n(a.left)-n(a.right),height:b.height-n(a.top)-n(a.bottom),top:b.top,bottom:b.bottom}:b; }, st=[...r.querySelectorAll('.adj-step')], tr=r.querySelector('.adj-track'), d=r.querySelector('.adj-dots'), l=r.querySelector('.adj-l');
      return {h:Math.round(R(r).height), steps:st.map(s=>Math.round(R(s).width)+"x"+Math.round(R(s).height)), dis:st.map(s=>s.disabled), v:st.map(s=>s.dataset.v), lab:st.map(s=>s.getAttribute('aria-label')), trackH:Math.round(R(tr.querySelector('button')).height), full:Math.round(R(d).width)>=Math.round(R(r).width)-1, below:R(d).top>=R(l).bottom-1}; }));
    if(A.length!==3) fail.push(k+' : '+A.length+' réglages');
    for(const r of A){ if(r.steps.join()!=="44x44,44x44"||r.trackH<44||!r.full||!r.below||!r.lab.every(Boolean)) fail.push(k+' piste : '+JSON.stringify(r)); }
    if(new Set(A.map(r=>r.h)).size!==1) fail.push(k+' hauteurs de ligne différentes : '+A.map(r=>r.h));
    if(!(A[0]&&A[0].dis[0]===true&&A[0].dis[1]===false&&A[0].v[1]==="-1")) fail.push(k+' bornes Sucre : '+JSON.stringify(A[0]));
    await p.tap('.sheet .card.adj .adj-row:nth-child(1) .adj-step:last-child'); await p.waitForTimeout(500);
    if(await q(()=>S.adj.daiquiri.s!==-1)) fail.push(k+' le + ne règle pas Sucre');
    await p.tap('.sheet .card.adj .adj-row:nth-child(3) .adj-step:first-child'); await p.waitForTimeout(500);
    if(await q(()=>S.adj.daiquiri.f!==0)) fail.push(k+' le − ne règle pas Force');
    // Labo
    await q(()=>{ closeAll(); S.mix=Object.assign(S.mix,{m:"shake",g:"coupe",gUser:1,ice:"none",gar:[],items:[{id:"rhum_blanc",q:60},{id:"citron_vert",q:30}]}); LT="compose"; switchTab("labo"); dirty.labo=1; renderView("labo"); }); await p.waitForTimeout(800);
    const L=await q(()=>({pics:[...document.querySelectorAll('#v-labo .shelf .sh-pic')].map(s=>s.closest('.shelf').dataset.id+":"+__ratio(getComputedStyle(s).color,getComputedStyle(s.closest('.shelf')).backgroundColor).toFixed(2)), shq:document.querySelectorAll('#v-labo .sh-q').length, ring:getComputedStyle(document.querySelector('#v-labo .shelf.in')).boxShadow}));
    if(!L.pics.length||L.pics.some(x=>+x.split(":")[1]<3)) fail.push(k+' pictos : '+L.pics.join(" "));
    if(L.shq) fail.push(k+' pastille de dose encore là');
    if(!/inset/.test(L.ring)) fail.push(k+' tuile choisie sans bordure d’accent : '+L.ring);
    // carte découverte
    await q(()=>{ switchTab("today"); }); await p.waitForTimeout(800);
    const D=await q(()=>{ const d=document.querySelector('#v-today .disc'); if(!d) return null; const t=d.querySelector('.disc-turn'); return {hint:!!d.querySelector('.disc-hint'), txt:/Touche pour/.test(d.textContent), label:t&&t.getAttribute('aria-label'), w:t&&Math.round(t.getBoundingClientRect().width), act:d.dataset.a}; });
    if(D&&(D.hint||D.txt||!D.label||D.w!==16||D.act!=="flip")) fail.push(k+' carte découverte : '+JSON.stringify(D));
    if(D){ await q(()=>document.querySelector('#v-today .disc').scrollIntoView({block:"center"})); await p.waitForTimeout(300); await p.tap('#v-today .disc'); await p.waitForTimeout(700);
      if(!await q(()=>document.querySelector('#v-today .disc').classList.contains('flip')||/flip/.test(document.querySelector('#v-today .disc').className))) fail.push(k+' la carte ne se retourne plus'); }
    await p.close(); }
  if(errs.length) fail.push('erreurs JS : '+[...new Set(errs)].join(' | '));
  console.log(fail.length?'ÉCHEC 1.58 : '+fail.join(' ; '):'1.58 : « Ta version » en piste pleine largeur avec − et + de 44×44 (bornes, réglage), pictos de l’étagère ≥ 3:1 en clair et en sombre, plus de pastille de dose (bordure d’accent gardée), carte découverte sans consigne avec icône nommée ; 375 et 390 px.');
  await b.close(); process.exit(fail.length?1:0); })();
