// 1.75 : liquide vivant, mini-verre du Labo, morphing du verre.
// Onde : la surface s'anime (versement, inclinaison dans la fiche), s'amortit, puis la boucle s'arrête et le dessin d'origine
// revient. Morphing : au changement de verre, la silhouette passe par des formes intermédiaires et finit exactement sur la
// nouvelle. Mini-verre : visible quand le grand verre sort de l'écran, caché sinon et hors du Labo ; un toucher y ramène.
// Mouvement réduit et « Liquide vivant » coupé : rien ne bouge. Coût : ≤ 4 ms par image avec le processeur ralenti 4×.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
const ST=JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1},stock:{gin:1,campari:1,vermouth_rouge:1},mix:{items:[{id:"gin",q:30},{id:"campari",q:30}],m:"stir",t:"sec",g:"rocks",gUser:1,gar:[]}});
const open=async(b,opt={})=>{ const p=await b.newPage(Object.assign({viewport:{width:390,height:844}},opt)); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p._errs=errs;
  await p.addInitScript(s=>localStorage.setItem("zeste.v1",s),opt.state||ST); await p.goto(APP); await p.waitForTimeout(2000); await p.evaluate(()=>switchTab('labo')); await p.waitForTimeout(800); return p; };
(async()=>{ const b=await chromium.launch(); const fail=[]; let errs=[];
  let p=await open(b); const cdp=await p.context().newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  // 1) onde de versement
  const W=await p.evaluate(async()=>{ const s=document.querySelector('#v-labo .lab-glass svg'), main=s.querySelector('.liq rect[height="110"]'), y0=main.getAttribute('y');
    PHYS.frames=0; PHYS.ms=0; wavePour(s,0.5); const on={phys:s.classList.contains('phys'), surf:!!s.querySelector('.surf'), shifted:main.getAttribute('y')!==y0};
    const ds=new Set(); for(let i=0;i<8;i++){ await new Promise(r=>setTimeout(r,60)); ds.add(s.querySelector('.surf-l')&&s.querySelector('.surf-l').getAttribute('d')); }
    let t=0; while(PHYS.raf&&t<8000){ await new Promise(r=>setTimeout(r,100)); t+=100; }
    return {on, moving:ds.size, stopMs:t, raf:PHYS.raf, back:!s.querySelector('.surf')&&!s.classList.contains('phys')&&main.getAttribute('y')===y0, ms:PHYS.ms/Math.max(1,PHYS.frames), frames:PHYS.frames}; });
  if(!W.on.phys||!W.on.surf||!W.on.shifted) fail.push("onde : surface non installée "+JSON.stringify(W.on));
  if(W.moving<4) fail.push("onde : la surface ne bouge pas ("+W.moving+" formes)");
  if(W.raf||W.stopMs>=8000) fail.push("onde : la boucle ne s’arrête pas");
  if(!W.back) fail.push("onde : le dessin d’origine ne revient pas au repos");
  // 2) morphing tumbler → coupe
  const M=await p.evaluate(async()=>{ PHYS.frames=0; PHYS.ms=0; document.querySelector('#v-labo [data-a="mixglass"][data-v="coupe"]').click();
    const shapes=new Set(); let t=0; while(t<3000){ const s=document.querySelector('#v-labo .lab-glass svg'); const d=s.querySelector('clipPath path').getAttribute('d'); shapes.add(d); if(!PHYS.raf&&t>100) break; await new Promise(r=>setTimeout(r,30)); t+=30; }
    const s=document.querySelector('#v-labo .lab-glass svg'); return {inter:[...shapes].filter(d=>d!==GLASS_SHAPES.coupe.o&&d!==GLASS_SHAPES.rocks.o).length, final:[...s.querySelectorAll('path')].filter(x=>x.getAttribute('d')===GLASS_SHAPES.coupe.o).length, raf:PHYS.raf, ice:[...s.querySelectorAll('.ice,.garn')].every(e=>e.style.opacity!=="0"), ms:PHYS.ms/Math.max(1,PHYS.frames)}; });
  if(M.inter<3) fail.push("morphing : pas de formes intermédiaires ("+M.inter+")");
  if(M.final!==3||M.raf) fail.push("morphing : forme finale "+M.final+"/3, boucle "+M.raf);
  if(!M.ice) fail.push("morphing : glace ou décor restés cachés");
  const ms=Math.max(W.ms,M.ms); if(ms>4) fail.push(`coût : ${ms.toFixed(2)} ms par image (processeur ralenti 4×)`);
  // 3) mini-verre
  const scrollLab=y=>p.evaluate(y=>{ const L=document.querySelector('#v-labo'); (L.scrollHeight>L.clientHeight+5?L:document.scrollingElement).scrollTop=y; },y);
  await scrollLab(0); await p.waitForTimeout(400); const m0=await p.evaluate(()=>{ const m=document.querySelector('.mini-glass'); return !!m&&m.classList.contains('show'); });
  await scrollLab(900); await p.waitForTimeout(600); const m1=await p.evaluate(()=>{ const m=document.querySelector('.mini-glass'); return m&&{show:m.classList.contains('show'),svg:!!m.querySelector('svg path'),r:m.getBoundingClientRect().right<=390}; });
  if(m0) fail.push("mini-verre visible alors que le grand verre l’est");
  if(!m1||!m1.show||!m1.svg||!m1.r) fail.push("mini-verre absent quand le grand verre sort de l’écran "+JSON.stringify(m1));
  else { await p.click('.mini-glass'); await p.waitForTimeout(1200); const back=await p.evaluate(()=>{ const r=document.querySelector('#v-labo .lab-glass').getBoundingClientRect(); return r.top>=0&&r.bottom<=innerHeight&&!document.querySelector('.mini-glass').classList.contains('show'); }); if(!back) fail.push("toucher le mini-verre ne ramène pas au grand verre"); }
  await scrollLab(900); await p.waitForTimeout(400); await p.evaluate(()=>switchTab('bar')); await p.waitForTimeout(400);
  if(await p.evaluate(()=>document.querySelector('.mini-glass').classList.contains('show'))) fail.push("mini-verre visible hors du Labo");
  // 4) inclinaison du verre de la fiche
  await p.evaluate(()=>recSheet('negroni')); await p.waitForTimeout(900);
  const g=await p.evaluate(()=>{ const r=[...document.querySelectorAll('.sheet .dg')].pop().getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; });
  await p.mouse.move(g.x,g.y); await p.mouse.down(); for(let i=1;i<=8;i++){ await p.mouse.move(g.x+i*14,g.y+2); await p.waitForTimeout(16); } await p.mouse.up(); await p.waitForTimeout(120);
  if(!await p.evaluate(()=>{ const s=[...document.querySelectorAll('.sheet .dg svg.live')].pop(); return !!s&&s.classList.contains('phys'); })) fail.push("inclinaison dans la fiche : pas d’onde");
  errs=errs.concat(p._errs); await p.close();
  // 5) mouvement réduit, puis « Liquide vivant » coupé : rien ne bouge
  for(const [n,opt] of [["mouvement réduit",{reducedMotion:"reduce"}],["Liquide vivant coupé",{state:ST.replace('"fx":{"splash":false}','"fx":{"splash":false,"live":false}')}]]){
    p=await open(b,opt);
    const R=await p.evaluate(async()=>{ const s=document.querySelector('#v-labo .lab-glass svg'); const a=wavePour(s,0.5); document.querySelector('#v-labo [data-a="mixglass"][data-v="coupe"]').click(); await new Promise(r=>setTimeout(r,80));
      return {raf:PHYS.raf, items:PHYS.items.size, surf:!!document.querySelector('.surf'), final:[...document.querySelectorAll('#v-labo .lab-glass svg path')].filter(x=>x.getAttribute('d')===GLASS_SHAPES.coupe.o).length}; });
    if(R.raf||R.items||R.surf||R.final!==3) fail.push(n+" : quelque chose bouge "+JSON.stringify(R));
    errs=errs.concat(p._errs); await p.close(); }
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  console.log(fail.length? "Mouvement : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : `Mouvement : onde qui bouge, s’amortit (${(W.stopMs/1000).toFixed(1)} s) et rend la main ; morphing par ${M.inter} formes intermédiaires jusqu’à la bonne ; mini-verre au bon moment et retour au verre ; inclinaison dans la fiche ; rien en mouvement réduit ni sans « Liquide vivant » ; ${ms.toFixed(2)} ms par image (processeur ralenti 4×).`);
  await b.close(); process.exit(fail.length?1:0); })();
