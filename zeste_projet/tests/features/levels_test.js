// 1.40 (hiérarchie « app pro ») : une seule carte verte (profil de goût), jamais derrière le verre du labo ; bouteilles et
// trophées en cartes blanches ; compteurs du bar posés sur le fond ; annexe du bar en liens ; contraste de la carte verte ;
// un style par rôle typographique ; chiffres qui arrivent à leur vraie valeur, sans animation en mode réduit.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
const STATE=()=>{ const n=Date.now(), ids=["negroni","daiquiri","gin_tonic","margarita","old_fashioned"], hist=[];
  for(let i=0;i<24;i++) hist.push({id:ids[i%ids.length],t:n-i*0.4*864e5-3600e3});
  localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false}},stock:{gin:3,campari:2,vermouth_rouge:1,rhum_blanc:2,tequila:1,triple_sec:1,whisky_bourbon:2,tonic:0},ratings:{negroni:5,daiquiri:4,old_fashioned:5},hist})); };
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  for(const scheme of ["light","dark"]){
    const p=await b.newPage({viewport:{width:390,height:844},colorScheme:scheme}); p.on('pageerror',e=>errs.push(e.message));
    await p.addInitScript(STATE); await p.goto(APP); await p.waitForTimeout(3000); const q=(f,a)=>p.evaluate(f,a);
    const focal={};
    for(const t of ["today","cocktails","bar","labo","profil"]){ await q(t=>switchTab(t),t); await p.waitForTimeout(1200); focal[t]=await q(t=>document.querySelectorAll('#v-'+t+' .focal-card').length,t); }
    if(focal.profil!==1||Object.entries(focal).some(([t,n])=>t!=="profil"&&n)) fail.push(scheme+' : cartes vertes '+JSON.stringify(focal));
    if(await q(()=>!!document.querySelector('#v-labo .lab-stage.focal-card, .focal-card .lab-glass'))) fail.push('verre du labo sur fond vert');
    // contraste dans la carte verte
    const low=await q(()=>{ const lum=c=>{ const m=c.match(/[\d.]+/g).map(Number); const f=x=>{ x/=255; return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4); }; return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2]); };
      const card=document.querySelector('#v-profil .focal-card'), bg=getComputedStyle(card).backgroundColor, L=lum(bg), out=[];
      card.querySelectorAll('*').forEach(e=>{ if(![...e.childNodes].some(n=>n.nodeType===3&&n.data.trim())) return; if(e.closest('svg')) return; const c=getComputedStyle(e).color, l=lum(c), r=(Math.max(l,L)+.05)/(Math.min(l,L)+.05); if(r<4.5) out.push(e.textContent.trim().slice(0,20)+" "+r.toFixed(2)); });
      return out; });
    if(low.length) fail.push(scheme+' : contraste insuffisant dans la carte verte '+low.join(", "));
    // bar : compteurs hors carte, bouteilles en cartes blanches avec ombre, annexe repliée
    await q(()=>switchTab("bar")); await p.waitForTimeout(1200);
    const bar=await q(()=>{ const v=document.querySelector('#v-bar'), head=v.querySelector('.bar-head'), g=v.querySelector('.cat-h + .group'); return {head:!!head, inCard:!!(head&&head.closest('.card,.group,.stat')), statCards:v.querySelectorAll('.stat-grid').length, groupShadow:g?getComputedStyle(g).boxShadow!=="none":false, groupBg:g?getComputedStyle(g).backgroundColor:"", links:[...v.querySelectorAll('.bar-more [data-a], .buy-card[data-a]')].map(x=>x.dataset.a), m:(document.getElementById('st-m')||{}).textContent, mk:makeable()}; });
    if(!bar.head||bar.inCard||bar.statCards) fail.push(scheme+' : compteurs du bar '+JSON.stringify(bar));
    if(!bar.groupShadow||/rgba\(0, 0, 0, 0\)|transparent/.test(bar.groupBg)) fail.push(scheme+' : bouteilles sans carte blanche');
    if(!bar.links.includes("buysheet")||!bar.links.includes("basics")) fail.push(scheme+' : liens du bar '+bar.links.join(","));
    if(+bar.m!==bar.mk) fail.push(scheme+` : compteur faux (${bar.m}/${bar.mk})`);
    await q(()=>{ document.querySelector('#v-bar details.bar-more').open=true; }); await p.waitForTimeout(200);
    await p.click('#v-bar .buy-card[data-a="buysheet"]'); // (1.71) « Achats malins » : carte « Le meilleur achat » hors du repli await p.waitForTimeout(500);
    if(!await q(()=>document.querySelectorAll('.sheet .row.tap[data-a="ing"]').length)) fail.push('Achats malins : feuille vide'); await q(()=>closeAll()); await p.waitForTimeout(300);
    // trophées en carte blanche
    await q(()=>switchTab("profil")); await p.waitForTimeout(1200);
    if(!await q(()=>{ const c=document.querySelector('#v-profil .tro-card'); return c&&c.querySelectorAll('.trophy').length>0&&getComputedStyle(c).boxShadow!=="none"; })) fail.push(scheme+' : trophées hors carte blanche');
    await p.close(); }
  // typographie : un style par rôle
  { const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message)); await p.addInitScript(STATE); await p.goto(APP); await p.waitForTimeout(3000);
    const roles={"en-tête de liste":".list-h b","titre de section":"h2.sh","ligne":".row .t:not(.serif)","sous-titre de ligne":".row .s:not(.lvl-txt)","valeur à droite":".row .val, .row .lvl-txt","nom de cocktail (ligne)":".row .t.serif","titre de page":".lt"};
    const seen={};
    for(const t of ["cocktails","bar","labo","profil"]){ await p.evaluate(t=>switchTab(t),t); await p.waitForTimeout(800);
      const r=await p.evaluate(R=>{ const o={}; for(const [k,s] of Object.entries(R)) o[k]=[...document.querySelectorAll('.view.active '+s)].filter(e=>e.getClientRects().length).map(e=>{ const c=getComputedStyle(e); return c.fontFamily.split(",")[0].replace(/"/g,"")+" "+Math.round(parseFloat(c.fontSize))+"/"+c.fontWeight; }); return o; },roles);
      for(const [k,L] of Object.entries(r)) L.forEach(s=>{ (seen[k]=seen[k]||new Set()).add(s); }); }
    for(const [k,S] of Object.entries(seen)) if(S.size>1) fail.push('typographie « '+k+' » : '+[...S].join(" ; "));
    const serifMisuse=await p.evaluate(()=>{ const ok=e=>e.closest('.disc-q,.card.buy .bt,.lt,.row .t.serif,.tile .tn,.hero .hn,.dhero,.disc-f p,.disc-n,.hist,.fc-t,.focal-card .fc-t,.focal-card .fc-k,.lab-start,.dish-hero,.ts-hero,.city-hero,.set-hero,.about-foot,.rw-t,.rw-name,.b2-head,.mfc-h,.mfc-r'); const L=[]; ["today","cocktails","bar","labo","profil"].forEach(t=>{ switchTab(t); document.querySelectorAll('#v-'+t+' *').forEach(e=>{ if(!e.getClientRects().length||![...e.childNodes].some(n=>n.nodeType===3&&n.data.trim())) return; if(/ZesteSerif/.test(getComputedStyle(e).fontFamily)&&!ok(e)&&!e.closest('svg')) L.push(t+":"+(e.className||e.tagName)+"«"+e.textContent.trim().slice(0,18)+"»"); }); }); return L.slice(0,6); });
    if(serifMisuse.length) fail.push('Fraunces hors titres, noms de cocktail et citations : '+serifMisuse.join(", "));
    await p.close(); }
  // chiffres : vraie valeur, sans animation en mode réduit
  { const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}); p.on('pageerror',e=>errs.push(e.message)); await p.addInitScript(STATE); await p.goto(APP); await p.waitForTimeout(2500);
    await p.evaluate(()=>switchTab("bar")); await p.waitForTimeout(60);
    const r=await p.evaluate(()=>[document.getElementById('st-m').textContent,String(makeable())]); if(r[0]!==r[1]) fail.push('mode réduit : le compteur défile ('+r.join(" vs ")+')');
    await p.close(); }
  if(errs.length) fail.push('erreurs JS : '+[...new Set(errs)].join(' | '));
  console.log(fail.length?'ÉCHEC niveaux 1.40 : '+fail.join(' ; '):'Niveaux 1.40 : une seule carte verte (profil de goût, contrastée en clair et en sombre), bouteilles et trophées en cartes blanches, compteurs du bar sur le fond, annexe repliée, un style par rôle typographique, chiffres justes et immobiles en mode réduit.');
  await b.close(); process.exit(fail.length?1:0); })();
