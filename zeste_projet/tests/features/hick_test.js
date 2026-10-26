// 1.37 (loi de Hick, harmonisation) : budgets de choix par écran avec un utilisateur réaliste, listes repliées qui se
// déplient, jauge du bar en un seul bouton de 44 px, réglages en groupes avec Retour, trophées en résumé, verres jamais
// vides (identifiants SVG uniques), carrousels aimantés sur la marge, plus aucun texte sous 12 px.
const {chromium}=require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ const n=Date.now(), ids=["negroni","aperol_spritz","daiquiri","gin_tonic","margarita","mojito","old_fashioned","whiskey_sour","espresso_martini","americano"], hist=[];
    for(let i=0;i<34;i++) hist.push({id:ids[i%ids.length],t:n-i*1.7*864e5-5*3600e3});
    localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{unit:"cl",weightKg:72,sex:"h",fx:{splash:false}},
      stock:{gin:3,campari:2,vermouth_rouge:2,rhum_blanc:2,tequila:2,triple_sec:1,citron_vert:2,citron:2,sirop_sucre:1,angostura:1,whisky_bourbon:2,prosecco:1,aperol:2,eau_gazeuse:2,tonic:2,vodka:2},
      ratings:{negroni:5,aperol_spritz:4,daiquiri:5,gin_tonic:4,margarita:3,mojito:4,old_fashioned:5,whiskey_sour:4},hist})); });
  await p.goto('file://'+path.join(__dirname,'../../dist/zeste.html')); await p.waitForTimeout(3000);
  const choices=sel=>p.evaluate(sel=>{ const R=document.querySelector(sel); if(!R) return -1; const vis=e=>{ const r=e.getBoundingClientRect(); return r.width>0&&r.height>0&&!e.closest('[hidden]')&&!(e.closest('details:not([open])')&&!e.closest('summary')); }; // (1.50) le contenu d'un <details> fermé n'est pas à l'écran
    const els=[...R.querySelectorAll('button, [data-a], input, select, [role=button]')].filter(vis); return els.filter(e=>!els.some(q=>q!==e&&q.contains(e))).length; },sel);
  const top='.sheet:last-of-type .sheet-body';
  const budget=async(n,sel,max)=>{ const c=await choices(sel); if(c<0||c>max) fail.push(`${n} : ${c} choix (budget ${max})`); return c; };
  const res={};
  for(const t of ["today","bar","labo","profil"]){ await p.evaluate(t=>switchTab(t),t); await p.waitForTimeout(900); res[t]=await budget(t,'#v-'+t,{today:36,bar:45,labo:58,profil:32}[t]); }
  // (1.43) accueil 32 → 36 : depuis que l'eau gazeuse est un basique (1.42), le carrousel « Sans alcool » (4 cartes + « Tout voir »)
  // apparaît pour ce profil l'après-midi ; à la même heure, la 1.41 comptait 30 choix et la 1.43 en compte 35.
  // Profil : trophées en résumé (6 au plus) puis la collection complète en feuille ; listes de 3 qui se déplient
  const prof=await p.evaluate(()=>({tro:document.querySelectorAll('#v-profil .trophies .trophy').length, best:document.querySelectorAll('#v-profil .group .row.tap[data-a="rec"]').length, more:document.querySelectorAll('#v-profil [data-a="more"]').length, guide:!!document.querySelector('#v-profil .gd-more[hidden]')}));
  if(prof.tro>6) fail.push('profil : '+prof.tro+' trophées affichés au lieu d’un résumé');
  // (1.39 : mieux notés et historique sont dans « Ton carnet », en feuilles)
  await p.click('#v-profil [data-a="alltro"]'); await p.waitForTimeout(700);
  const all=await p.evaluate(()=>document.querySelectorAll('.sheet .trophies .trophy').length); if(all<20) fail.push('« Tous les trophées » : '+all+' trophées');
  await p.evaluate(()=>closeAll()); await p.waitForTimeout(500);
  // Bar : la jauge est un seul bouton d'au moins 44 × 44, le niveau se choisit en grand et s'applique
  await p.evaluate(()=>switchTab("bar")); await p.waitForTimeout(700);
  const g=await p.evaluate(()=>{ const e=document.querySelector('#v-bar .lvl.one'), r=e.getBoundingClientRect(); return {w:r.width,h:r.height,old:document.querySelectorAll('#v-bar .lvl button').length,id:e.dataset.id}; });
  if(g.w<44||g.h<44) fail.push(`bar : jauge de ${g.w}×${g.h} px`); if(g.old) fail.push('bar : petits boutons de niveau encore présents');
  await p.click('#v-bar .lvl.one'); await p.waitForTimeout(600); await p.click('.sheet [data-a="lvlset"][data-l="1"]'); await p.waitForTimeout(600);
  const lv=await p.evaluate(id=>[S.stock[id],(document.querySelector(`#sr-${id} .lvl.one .lvl-txt`)||{}).textContent===LVLN[1]?1:0,SHEETS.length],g.id);
  if(lv[0]!==1||lv[1]!==1||lv[2]!==0) fail.push('bar : choix du niveau non appliqué '+JSON.stringify(lv));
  // Fiche ingrédient : 5 recettes puis « Voir les N autres »
  await p.evaluate(()=>ingSheet("gin")); await p.waitForTimeout(700);
  // (1.71) on compte le groupe « Utilisé dans » seulement : « À une bouteille près » (3 lignes au plus) est une autre section
  const ing=await p.evaluate(()=>{ const h=[...document.querySelectorAll('.sheet .gh')].find(x=>/^Utilisé dans/.test(x.textContent)), g=h&&h.nextElementSibling; return {rows:g?g.querySelectorAll('.row.tap[data-a="rec"]').length:99,more:!!(g&&g.querySelector('[data-a="more"]'))}; });
  if(ing.rows>5||!ing.more) fail.push('fiche ingrédient : '+ing.rows+' recettes affichées');
  await p.click('.sheet [data-a="more"]'); await p.waitForTimeout(400);
  if(await p.evaluate(()=>{ const h=[...document.querySelectorAll('.sheet .gh')].find(x=>/^Utilisé dans/.test(x.textContent)); return h?h.nextElementSibling.querySelectorAll('.row.tap[data-a="rec"]').length:0; })<20) fail.push('fiche ingrédient : la liste ne se déplie pas');
  await p.evaluate(()=>closeAll()); await p.waitForTimeout(500);
  // Réglages : « Toi » sur place, les groupes en feuilles avec Retour, et un réglage fonctionne depuis un groupe
  await p.evaluate(()=>settingsSheet()); await p.waitForTimeout(700); res.reglages=await budget('réglages',top,14);
  if(!await p.evaluate(()=>!!document.querySelector('.sheet [data-a="setsex"]')&&!!document.getElementById('bac-w-set'))) fail.push('réglages : prénom, poids et sexe doivent rester sur place');
  await p.click('.sheet [data-a="setgroup"][data-g="look"]'); await p.waitForTimeout(700);
  await p.click('.sheet:last-of-type [data-a="settheme"][data-v="dark"]'); await p.waitForTimeout(400);
  const th=await p.evaluate(()=>[S.settings.theme,SHEETS.length,(document.querySelector('.sheet:last-of-type .back-link')||{}).textContent]);
  if(th[0]!=="dark"||th[1]!==2||!/Paramètres/.test(th[2]||"")) fail.push('réglages : groupe Apparence '+JSON.stringify(th));
  await p.click('.sheet:last-of-type .back-link'); await p.waitForTimeout(600);
  const back=await p.evaluate(()=>[SHEETS.length,(document.querySelector('.sheet [data-g="look"] .val')||{}).textContent]);
  if(back[0]!==1||back[1]!=="Sombre") fail.push('réglages : Retour ou valeur du groupe '+JSON.stringify(back));
  await p.evaluate(()=>{ ACT.settheme({v:"auto"}); closeAll(); }); await p.waitForTimeout(500);
  // Verres : aucun identifiant SVG en double, aucune référence vers un écran masqué
  for(const t of ["cocktails","profil","today"]){ await p.evaluate(t=>switchTab(t),t); await p.waitForTimeout(600); }
  await p.evaluate(()=>dishSheet(DISHES[0].id)); await p.waitForTimeout(700);
  const ids=await p.evaluate(()=>{ const c={}; document.querySelectorAll('[id]').forEach(e=>c[e.id]=(c[e.id]||0)+1); let broken=0;
    document.querySelectorAll('[clip-path^="url(#"],[fill^="url(#"]').forEach(e=>{ if(!e.getClientRects().length) return; const m=(e.getAttribute('clip-path')||e.getAttribute('fill')).match(/#([^)]+)/), t=m&&document.getElementById(m[1]); if(t&&t.closest('.view')&&getComputedStyle(t.closest('.view')).display==="none") broken++; });
    return {dup:Object.values(c).filter(v=>v>1).length,broken}; });
  if(ids.dup||ids.broken) fail.push('verres : '+ids.dup+' identifiants en double, '+ids.broken+' références vers un écran masqué');
  await p.evaluate(()=>closeAll()); await p.waitForTimeout(400);
  // Carrousel aimanté sur la marge (20 px depuis 1.57), et plus de texte sous 12 px dans les vues ni les onglets (1.58)
  const sc=await p.evaluate(()=>{ const s=document.querySelector('#v-today .scroller'); return s?getComputedStyle(s).scrollPaddingLeft:"20px"; });
  if(sc!=="20px") fail.push('carrousel : scroll-padding '+sc);
  const tiny=await p.evaluate(()=>{ let n=[]; for(const t of ["today","bar","labo","profil"]){ switchTab(t); document.querySelectorAll('#v-'+t+' *').forEach(e=>{ if(!e.getClientRects().length) return; if(![...e.childNodes].some(x=>x.nodeType===3&&x.data.trim())) return; const f=parseFloat(getComputedStyle(e).fontSize); if(f<12&&!e.closest('svg:not(.radar)')) n.push(t+":"+e.className+":"+f); }); } switchTab("today"); document.querySelectorAll(".tabbar span").forEach(e=>{ const f=parseFloat(getComputedStyle(e).fontSize); if(f<12) n.push("onglets:"+e.textContent+":"+f); }); return n.slice(0,4); });
  if(tiny.length) fail.push('texte sous 12 px : '+tiny.join(", "));
  if(errs.length) fail.push('erreurs JS : '+errs.join(' | '));
  console.log(fail.length?'ÉCHEC loi de Hick : '+fail.join(' ; '):`Loi de Hick : accueil ${res.today}, bar ${res.bar}, labo ${res.labo}, profil ${res.profil}, réglages ${res.reglages} choix ; listes repliées qui se déplient, jauge de 44 px, réglages en groupes avec Retour, verres jamais vides, carrousels sur la marge.`);
  await b.close(); process.exit(fail.length?1:0); })();
