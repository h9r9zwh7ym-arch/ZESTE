// 1.41 (glace du labo, bar lisible) : la glace se choisit juste sous le verre et y tombe ; en verre automatique,
// des glaçons ne restent jamais dans une coupe et un versement n'est plus refusé tant qu'un verre du style peut tout
// contenir ; aucun message « ça déborde » ne reste affiché quand ce n'est plus vrai ; le bar : une ligne par bouteille,
// plus de bascule Liste/Étagère dans la page (bouton en haut à droite).
const {chromium}=require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false}},stock:{gin:3,campari:2,vermouth_rouge:2,rhum_blanc:2,citron_vert:2,sirop_sucre:1,tonic:0}})));
  await p.goto('file://'+path.join(__dirname,'../../dist/zeste.html')); await p.waitForTimeout(2500); const q=(f,a)=>p.evaluate(f,a);
  await p.tap('.tabbar button[data-t="labo"]'); await p.waitForTimeout(700);
  // la glace est juste sous le verre : les deux sont visibles ensemble
  const pos=await q(()=>{ const g=document.querySelector('#v-labo .lab-glass').getBoundingClientRect(), i=document.querySelector('#v-labo .lab-icerow'); if(!i) return null; const r=i.getBoundingClientRect(); return {gap:r.top-g.bottom, inService:!!i.closest('.lab-sub'), oneLine:[...i.querySelectorAll('button')].every(b=>b.getBoundingClientRect().height<40)}; });
  if(!pos||pos.gap>220||!pos.oneLine) fail.push('glace loin du verre ou libellés sur deux lignes '+JSON.stringify(pos));
  if(await q(()=>!!document.querySelector('#v-labo .lab-sub + .seg.lab-ice'))) fail.push('le choix de glace est encore dans « Le service »');
  await p.tap('#v-labo .lab-icerow button[data-v="cubes"]'); await p.waitForTimeout(150);
  const drop=await q(()=>{ const s=document.querySelector('#v-labo .lab-glass svg'); return {cls:s.classList.contains('icedrop'), cubes:s.querySelectorAll('.ice .cube').length, g:labGlass().g}; });
  if(!drop.cls||!drop.cubes) fail.push('les glaçons ne tombent pas dans le verre '+JSON.stringify(drop));
  if(["coupe","martini","flute"].includes(drop.g)) fail.push('glaçons dans un verre à pied ('+drop.g+') en verre automatique');
  await p.waitForTimeout(900);
  for(const id of ["gin","citron_vert","sirop_sucre"]){ await q(id=>document.querySelector(`#v-labo [data-a="mixpour"][data-id="${id}"]`).scrollIntoView({block:'center',inline:'center'}),id); await p.tap(`#v-labo [data-a="mixpour"][data-id="${id}"]`); await p.waitForTimeout(450); }
  const mix=await q(()=>({n:S.mix.items.length, toast:document.getElementById('toast').classList.contains('show')?document.getElementById('toast').textContent:""}));
  if(mix.n!==3||/Plus de place/.test(mix.toast)) fail.push('versement refusé avec des glaçons en verre automatique '+JSON.stringify(mix));
  // « ça déborde » ne reste pas affiché après un retour à « Sans glace » qui suffit
  await q(()=>{ S.mix.g="coupe"; S.mix.gUser=1; ACT.mixice({v:"pilee"}); }); await p.waitForTimeout(200);
  await q(()=>ACT.mixice({v:"none"})); await p.waitForTimeout(200);
  const stale=await q(()=>({fits:labFits(S.mix.items), shown:document.getElementById('toast').classList.contains('show')&&/déborde/.test(document.getElementById('toast').textContent)}));
  if(stale.fits&&stale.shown) fail.push('message « ça déborde » resté affiché');
  // bar : une ligne par bouteille, bascule en haut à droite
  await p.tap('.tabbar button[data-t="bar"]'); await p.waitForTimeout(900);
  const bar=await q(()=>{ const v=document.querySelector('#v-bar'), rows=[...v.querySelectorAll('.bar-row')]; return {seg:v.querySelectorAll('.content .seg[data-k="barview"]').length, toggle:!!v.querySelector('.nb-right [data-a="barview"]'), rows:rows.length, maxH:Math.max(...rows.map(r=>r.getBoundingClientRect().height)), lvl:rows.filter(r=>r.querySelector('.lvl-txt')).length}; });
  if(bar.seg||!bar.toggle||!bar.rows||bar.maxH>64||bar.lvl!==bar.rows) fail.push('bar : '+JSON.stringify(bar));
  await p.tap('#v-bar .nb-right [data-a="barview"]'); await p.waitForTimeout(700);
  if(await q(()=>S.settings.barView!=="shelf"||!document.querySelector('#v-bar .b2-row'))) fail.push('le bouton étagère ne montre pas l’étagère');
  await q(()=>ACT.barview({v:"list"})); await p.waitForTimeout(300);
  if(errs.length) fail.push('erreurs JS : '+errs.join(' | '));
  console.log(fail.length?'ÉCHEC glace et bar : '+fail.join(' ; '):'Glace et bar : la glace se choisit sous le verre et y tombe, le verre automatique s’adapte, plus de versement refusé ni de message périmé ; bar en une ligne par bouteille, étagère à un toucher.');
  await b.close(); process.exit(fail.length?1:0); })();
