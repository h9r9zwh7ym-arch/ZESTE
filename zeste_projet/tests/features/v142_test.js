// 1.42 (bar épuré, glace réaliste, pictos du labo, Paramètres et À propos, nuit soignée) : le bar s'ouvre sur « faisables »
// seulement, sans étagère, avec basiques et achats malins dans une section repliée ; l'eau gazeuse est un basique ; le gros
// glaçon est un vrai bloc (sphère dans un verre à pied), la pilée un amas d'éclats tenu dans le verre ; les ingrédients
// frais ont un pictogramme ; Paramètres sans textes inutiles, À propos complet ; la nuit : une lune, peu d'étoiles, en haut.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},barView:"shelf"},stock:{gin:3,campari:2,vermouth_rouge:1,rhum_blanc:1,tequila:1,triple_sec:0,whisky_bourbon:2,eau_gazeuse:0},ratings:{negroni:5,daiquiri:4}})));
  await p.goto(APP); await p.waitForTimeout(2800); const q=(f,a)=>p.evaluate(f,a);
  // ---------- bar ----------
  await q(()=>switchTab("bar")); await p.waitForTimeout(900);
  const bar=await q(()=>{ const v=document.querySelector('#v-bar'), d=v.querySelector('details.bar-more'), txt=v.textContent;
    return {view:S.settings.barView, shelf:!!v.querySelector('[data-a="barview"],.b2-row,.b2-b'), opened:/bouteilles? ouvertes?/i.test(txt), heads:v.querySelectorAll('.bar-head .bh').length,
      faisables:!!v.querySelector('.bar-head [data-a="gofaisables"]'), more:!!d, closed:d&&!d.open, inMore:d?[...d.querySelectorAll('[data-a]')].map(x=>x.dataset.a):[],
      addBtn:!!v.querySelector('.content .btn-row [data-a="addsheet"]'), lastBtn:(()=>{ const all=[...v.querySelectorAll('.content button')]; return all.length?all[all.length-1].dataset.a:""; })(), gazBasic:BASICS.includes("eau_gazeuse")&&has("eau_gazeuse"), gazListed:!!document.getElementById('sr-eau_gazeuse'), gazBuy:bottleRecs().some(x=>x.id==="eau_gazeuse")}; });
  if(bar.view!=="list"||bar.shelf) fail.push('bar : l’étagère existe encore '+JSON.stringify(bar));
  if(bar.opened||bar.heads!==1||!bar.faisables) fail.push('bar : en-tête '+JSON.stringify(bar));
  if(!bar.more||!bar.closed||!bar.inMore.includes("basics")||!bar.inMore.includes("buysheet")||bar.addBtn) fail.push('bar : section repliée '+JSON.stringify(bar));
  if(!bar.gazBasic||bar.gazListed||bar.gazBuy) fail.push('eau gazeuse : '+JSON.stringify(bar));
  await p.click('#v-bar details.bar-more>summary'); await p.waitForTimeout(400);
  await p.click('#v-bar .bar-more [data-a="basics"]'); await p.waitForTimeout(500);
  if(!await q(()=>SHEETS.length&&/eau gazeuse/i.test(document.querySelector('.sheet:last-of-type').textContent))) fail.push('basiques : feuille absente ou sans eau gazeuse');
  await q(()=>closeAll()); await p.waitForTimeout(400);
  if(!await q(()=>document.querySelector('#v-bar details.bar-more').open)) fail.push('la section repliée se referme après un aller-retour');
  await p.click('#v-bar .bar-more [data-a="buysheet"]'); await p.waitForTimeout(500);
  if(!await q(()=>document.querySelectorAll('.sheet .row.tap[data-a="ing"]').length)) fail.push('Achats malins : feuille vide'); await q(()=>closeAll()); await p.waitForTimeout(300);
  // ---------- glace ----------
  const ice=await q(()=>{ const host=document.createElement('div'); host.style.cssText="position:fixed;left:0;top:0;width:200px;height:260px"; document.body.appendChild(host); const out={big:{},crush:{}};
    for(const g of ["rocks","highball","coupe","martini"]){ host.innerHTML=glassSVG(Object.assign({},RMAP.negroni,{id:"_t42b"+g,g,ice:"big"}),{}); const e=host.querySelector('.ice .cube.big');
      if(!e){ out.big[g]=null; continue; } const bb=e.getBBox(), sh=GLASS_SHAPES[g]; out.big[g]={sphere:!!e.querySelector('circle'), ratio:+(bb.width/(2*glassHalfW(sh,g,bb.y+bb.height/2))).toFixed(2), bottom:+(sh.bot-(bb.y+bb.height)).toFixed(1)}; }
    for(const g of ["rocks","highball","coupe"]){ host.innerHTML=glassSVG(Object.assign({},RMAP.negroni,{id:"_t42c"+g,g,ice:"pilee"}),{}); const sh=GLASS_SHAPES[g], cx=(sh.rim[0]+sh.rim[1])/2;
      const sh2=[...host.querySelectorAll('.ice .crush .shard')]; out.crush[g]={n:sh2.length, out:sh2.filter(e=>{ const bb=e.getBBox(), x=bb.x+bb.width/2, y=bb.y+bb.height/2; return y<sh.rim[2]-1||y>sh.bot+2||Math.abs(x-cx)>glassHalfW(sh,g,y)+1.5; }).length}; }
    host.remove(); return out; });
  for(const g of ["rocks","highball"]){ const r=ice.big[g]; if(!r||r.sphere||r.ratio<0.5||r.bottom>3) fail.push('gros glaçon ('+g+') : '+JSON.stringify(r)); }
  // (dans le V du martini, une sphère qui touche les parois fait 40 % de la largeur à sa hauteur)
  for(const g of ["coupe","martini"]){ const r=ice.big[g]; if(!r||!r.sphere||r.ratio<(g==="martini"?0.38:0.5)) fail.push('gros glaçon ('+g+') : '+JSON.stringify(r)); }
  for(const [g,r] of Object.entries(ice.crush)) if(r.n<30||r.out) fail.push('glace pilée ('+g+') : '+JSON.stringify(r));
  // ---------- pictos du labo ----------
  await q(()=>switchTab("labo")); await p.waitForTimeout(800);
  const pic=await q(()=>Object.fromEntries(["citron","citron_vert","menthe","blanc_oeuf","sirop_sucre"].map(id=>{ const s=document.querySelector(`#v-labo .shelf[data-id="${id}"]`); return [id,s?(s.querySelector('.sh-pic svg')?"picto":s.querySelector('.sh-b svg')?"bouteille":s.querySelector('.sh-ic')?"pastille":"?"):"absent"]; })));
  for(const id of ["citron","citron_vert","menthe","blanc_oeuf"]) if(pic[id]!=="picto") fail.push('labo : '+id+' sans pictogramme ('+pic[id]+')');
  if(pic.sirop_sucre!=="bouteille") fail.push('labo : le sirop de sucre n’a pas sa bouteille ('+pic.sirop_sucre+')');
  // ---------- Paramètres et À propos ----------
  await q(()=>settingsSheet()); await p.waitForTimeout(600);
  const set=await q(()=>{ const s=document.querySelector('.sheet:last-of-type .sheet-body')||document.querySelector('.sheet:last-of-type'); return {choices:s.querySelectorAll('.row.tap, input, .seg button').length, hero:!!s.querySelector('.set-hero'), version:/Version/.test(s.textContent), about:!!s.querySelector('[data-a="about"]'), gf:[...s.querySelectorAll('.gf')].map(e=>e.textContent)}; });
  if(set.choices>12||set.hero||set.version||!set.about||set.gf.length>1) fail.push('Paramètres : '+JSON.stringify(set));
  for(const g of ["look","snd","reco"]){ await q(g=>ACT.setgroup({g}),g); await p.waitForTimeout(450);
    const gf=await q(()=>[...document.querySelector('.sheet:last-of-type').querySelectorAll('.gf, p.body')].map(e=>e.textContent.slice(0,40)));
    if(gf.length) fail.push('Paramètres › '+g+' : textes '+JSON.stringify(gf));
    if(g==="reco"&&await q(()=>/Ce qui guide/.test(document.querySelector('.sheet:last-of-type').textContent))) fail.push('Suggestions : l’explication est restée');
    await q(()=>closeSheet()); await p.waitForTimeout(400); }
  await p.click('.sheet [data-a="about"]'); await p.waitForTimeout(600);
  const ab=await q(()=>{ const s=document.querySelector('.sheet:last-of-type'); return {gh:[...s.querySelectorAll('.gh')].map(e=>e.textContent), ver:s.querySelector('.about-hero')?.textContent.includes(APP_VERSION), back:!!s.querySelector('.back-link'), copy:s.textContent.includes(COPYRIGHT), recs:new RegExp(RECS.filter(r=>!r.mine).length+"\\s+recettes").test(s.textContent)}; });
  if(ab.gh.join("|")!=="Comment Zeste te conseille|Ton alcoolémie|Tes données|Les recettes"||!ab.ver||!ab.back||!ab.copy||!ab.recs) fail.push('À propos : '+JSON.stringify(ab));
  await q(()=>closeAll()); await p.waitForTimeout(300);
  await q(()=>fxSheet()); await p.waitForTimeout(500);
  if(await q(()=>/Active ou coupe/.test(document.querySelector('.sheet:last-of-type').textContent))) fail.push('Réglages détaillés : introduction restée');
  await q(()=>closeAll()); await p.waitForTimeout(300);
  // ---------- nuit ----------
  await q(()=>{ switchTab("today"); S.settings.moment="nuit"; applyAmbient(); }); await p.waitForTimeout(1700);
  const night=await q(()=>{ const a=document.getElementById('ambient'), st=[...a.querySelectorAll('.amb-stars i')], m=a.querySelector('.amb-moon'), sun=a.querySelector('.amb-sun'), title=document.querySelector('#v-today .lt').getBoundingClientRect();
    return {stars:st.length, low:st.filter(i=>i.getBoundingClientRect().top>title.bottom).length, shoot:!!a.querySelector('.shoot')&&getComputedStyle(a.querySelector('.shoot')).display!=="none", moon:!!(m&&m.querySelector('svg')&&+getComputedStyle(m).opacity>0.5), sun:+getComputedStyle(sun).opacity}; });
  if(night.stars>20||night.low||night.shoot||!night.moon||night.sun>0.05) fail.push('nuit : '+JSON.stringify(night));
  await q(()=>{ S.settings.moment="aprem"; applyAmbient(); }); await p.waitForTimeout(1700);
  if(await q(()=>+getComputedStyle(document.querySelector('#ambient .amb-moon')).opacity>0.05)) fail.push('la lune reste affichée l’après-midi');
  if(errs.length) fail.push('erreurs JS : '+[...new Set(errs)].join(' | '));
  console.log(fail.length?'ÉCHEC 1.42 : '+fail.join(' ; '):`1.42 : bar ouvert sur « faisables » sans étagère, basiques (eau gazeuse comprise) et achats malins repliés en bas ; gros glaçon en bloc (${ice.big.rocks.ratio} de la largeur du tumbler) et en sphère dans les verres à pied, pilée en ${ice.crush.rocks.n} éclats tenus dans le verre ; pictos pour citron, citron vert, menthe, blanc d’œuf ; Paramètres à ${set.choices} choix sans textes inutiles, À propos complet ; nuit : ${night.stars} étoiles en haut, une lune, plus d’étoile filante.`);
  await b.close(); process.exit(fail.length?1:0); })();
