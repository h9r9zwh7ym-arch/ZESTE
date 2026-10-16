// 1.43 (bar) : glisser une bouteille vers la gauche ouvre « Finie », un grand glissé la termine d'un coup (Vide → À racheter,
// avec Annuler) ; un glissé n'ouvre jamais la fiche, un geste vertical ne déclenche rien ; au-delà de 15 bouteilles, les
// catégories se replient d'un toucher et le restent après un rechargement ; en dessous, pas de repli.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
const BIG={gin:3,campari:2,vermouth_rouge:1,vermouth_dry:2,rhum_blanc:1,rhum_ambre:3,tequila:1,mezcal:2,whisky_bourbon:2,scotch:3,cognac:2,vodka:4,triple_sec:3,aperol:1,chartreuse:2,maraschino:1,amaretto:3,kahlua:2,angostura:2,tonic:1,ginger_beer:1,cola:1};
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const open=async(stock,extra={})=>{ const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true}); p.on('pageerror',e=>errs.push(e.message));
    await p.addInitScript(([s,x])=>{ if(!localStorage.getItem("zeste.v1")){ /* (1.53) garde sur localStorage : sessionStorage se perd parfois au rechargement en file:// */ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:Object.assign({fx:{splash:false},hintSwipe:1},x),stock:s})); } },[stock,extra]);
    await p.goto(APP); await p.waitForTimeout(2500); await p.evaluate(()=>switchTab("bar")); await p.waitForTimeout(900);
    const c=await p.context().newCDPSession(p); const touch=(type,x,y)=>c.send('Input.dispatchTouchEvent',{type,touchPoints:type==="touchEnd"?[]:[{x,y}]});
    const drag=async(id,dx,dy=1,end=true)=>{ const r=await p.evaluate(id=>{ const e=document.getElementById('sr-'+id); e.scrollIntoView({block:"center"}); const b=e.getBoundingClientRect(); return {x:b.right-40,y:b.top+b.height/2}; },id); await p.waitForTimeout(250);
      await touch('touchStart',r.x,r.y); const n=12; for(let i=1;i<=n;i++){ await touch('touchMove',r.x+dx*i/n,r.y+dy*i/n); await p.waitForTimeout(16); } if(end) await touch('touchEnd'); await p.waitForTimeout(450); };
    return {p,q:(f,a)=>p.evaluate(f,a),drag,touch}; };
  // ---------- glisser ----------
  { const {p,q,drag}=await open({gin:3,campari:2,vermouth_rouge:1,tonic:1});
    if(await q(()=>document.querySelectorAll('#v-bar .cat-h.fold').length)) fail.push('repli proposé pour un petit bar');
    await drag("gin",-100);
    let s=await q(()=>({open:SW_OPEN&&SW_OPEN.id, sheets:SHEETS.length, vis:getComputedStyle(document.querySelector('#sr-gin .row-act')).visibility, w:document.querySelector('#sr-gin .row-act').getBoundingClientRect().width, gin:S.stock.gin}));
    if(s.open!=="sr-gin"||s.sheets||s.vis!=="visible"||s.w<80||s.gin!==3) fail.push('demi-glissé : '+JSON.stringify(s));
    // toucher ailleurs referme sans ouvrir de fiche
    await p.tap('#sr-campari .grow'); await p.waitForTimeout(450);
    s=await q(()=>({open:!!SW_OPEN, sheets:SHEETS.length, sx:document.getElementById('sr-gin').style.getPropertyValue('--sx')}));
    if(s.open||s.sheets||s.sx!=="0px") fail.push('toucher ailleurs : '+JSON.stringify(s));
    // geste vertical : rien
    await drag("campari",-4,-120);
    if(await q(()=>!!SW_OPEN||S.stock.campari!==2)) fail.push('un geste vertical ouvre l’action');
    // ouvrir puis toucher « Finie »
    await drag("gin",-100); await p.tap('#sr-gin .row-act'); await p.waitForTimeout(900);
    s=await q(()=>({gin:S.stock.gin, toast:document.getElementById('toast').textContent, rebuy:!!document.querySelector('#v-bar [data-a="rebuy"],#v-bar .btn-mini')&&/À racheter[\s\S]*Gin/.test(document.querySelector('#v-bar').textContent)}));
    if(s.gin!==0||!/racheter/.test(s.toast)||!/À racheter/.test(await q(()=>document.querySelector('#v-bar').textContent))) fail.push('« Finie » : '+JSON.stringify(s));
    // Annuler
    await q(()=>document.querySelector('#toast button')&&document.querySelector('#toast button').click()); await p.waitForTimeout(600);
    if(await q(()=>S.stock.gin!==3)) fail.push('Annuler ne rend pas la bouteille');
    // grand glissé : terminée d'un coup
    await drag("campari",-300); await p.waitForTimeout(500);
    if(await q(()=>S.stock.campari!==0)) fail.push('grand glissé sans effet');
    // un soft (interrupteur) aussi
    await drag("tonic",-300); await p.waitForTimeout(500);
    if(await q(()=>S.stock.tonic!==0)) fail.push('soft : grand glissé sans effet');
    // une bouteille vide n'a pas d'action
    if(await q(()=>!!document.querySelector('#v-bar .row-act[data-id="campari"]'))) fail.push('action « Finie » sur une bouteille vide');
    await p.close(); }
  // ---------- indice du geste (une fois) ----------
  { const {p,q}=await open({gin:3},{hintSwipe:0});
    await p.waitForTimeout(400); const k=await q(()=>({peek:!!document.querySelector('#v-bar .bar-row.peek'), flag:S.settings.hintSwipe}));
    if(!k.peek||k.flag!==1) fail.push('indice du geste : '+JSON.stringify(k));
    await p.close(); }
  // ---------- catégories repliables ----------
  { const {p,q}=await open(BIG);
    const f=await q(()=>[...document.querySelectorAll('#v-bar .cat-h.fold')].map(b=>b.dataset.k));
    if(f.length<3||f.includes("À racheter")) fail.push('catégories repliables : '+JSON.stringify(f));
    await p.tap('#v-bar .cat-h.fold[data-k="Spiritueux"]'); await p.waitForTimeout(500);
    let s=await q(()=>{ const h=document.querySelector('#v-bar .cat-h.fold[data-k="Spiritueux"]'), g=h.nextElementSibling; return {exp:h.getAttribute('aria-expanded'), hidden:getComputedStyle(g).display==="none", gin:!!document.getElementById('sr-gin').getClientRects().length, saved:S.settings.barFold.Spiritueux}; });
    if(s.exp!=="false"||!s.hidden||s.gin||s.saved!==1) fail.push('replier : '+JSON.stringify(s));
    // (1.52) attendre que le repli soit écrit avant de recharger (course du navigateur de test, piège 17 du HANDOFF)
    await p.waitForFunction(()=>/"barFold":\{[^}]*Spiritueux/.test(localStorage.getItem('zeste.v1')||''),null,{timeout:5000}).catch(()=>{}); await p.waitForTimeout(400);
    await p.reload(); await p.waitForTimeout(2500); await q(()=>switchTab("bar")); await p.waitForTimeout(800);
    if(!await q(()=>{ const h=document.querySelector('#v-bar .cat-h.fold[data-k="Spiritueux"]'); return h&&h.classList.contains('shut')&&getComputedStyle(h.nextElementSibling).display==="none"; })) fail.push('le repli ne survit pas au rechargement');
    await p.tap('#v-bar .cat-h.fold[data-k="Spiritueux"]'); await p.waitForTimeout(500);
    if(await q(()=>!document.getElementById('sr-gin').getClientRects().length||!!S.settings.barFold.Spiritueux)) fail.push('déplier ne marche pas');
    await p.close(); }
  if(errs.length) fail.push('erreurs JS : '+[...new Set(errs)].join(' | '));
  console.log(fail.length?'ÉCHEC 1.43 : '+fail.join(' ; '):'1.43 : glisser ouvre « Finie », un grand glissé termine la bouteille (Annuler la rend), jamais de fiche ouverte par un glissé ni d’action par un geste vertical, indice montré une fois ; catégories repliables au-delà de 15 bouteilles, gardées au rechargement.');
  await b.close(); process.exit(fail.length?1:0); })();
