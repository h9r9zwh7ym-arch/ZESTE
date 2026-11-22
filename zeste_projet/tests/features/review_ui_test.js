// 1.87 (review) : réglage « Retour haptique » qui fonctionne, « tac » sur toutes les validations, aucune consigne à l'écran,
// zones tactiles de 44 px (liens, chips, en-têtes repliables, prix), « Sans alcool » une seule fois dans les filtres,
// recherche sans résultat avec une action, pas de « % pour toi » sur un cocktail déjà noté, « Annuler » après « Réinitialiser ».
const {chromium}=require('playwright'); const path=require('path'), http=require('http'), fs=require('fs');
const SRV=http.createServer((q,r)=>{ r.writeHead(200,{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}); r.end(fs.readFileSync(path.join(__dirname,'../../dist/zeste.html'))); });
const RX=/(^|[^\p{L}])(touche|touchez|appuie|appuyez|fais glisser|glisse|tape|tapote|maintiens|clique|choisis|ajoute|sélectionne|donne un nom|essaie|active ou coupe)(?=[^\p{L}]|$)/iu;
(async()=>{ await new Promise(z=>SRV.listen(0,'127.0.0.1',z)); const APP='http://127.0.0.1:'+SRV.address().port+'/zeste.html';
  const b=await chromium.launch(); const fail=[], errs=[]; const ok=(c,m)=>{ if(!c) fail.push(m); };
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ if(!sessionStorage.getItem("seeded")){ sessionStorage.setItem("seeded","1"); localStorage.setItem("zeste.v1",JSON.stringify({v:2,app:"zeste",t:1,quizSkip:1,quizIntro:1,
    settings:{fx:{splash:false,confetti:false}},stock:{gin:4,campari:3,vermouth_rouge:2,tonic:1,bourbon:3,rye:2,cognac:1,triple_sec:2},ratings:{negroni:4,mojito:2,daiquiri:5},hist:[{id:"negroni",t:Date.now()-2*864e5}]})); } });
  await p.goto(APP); await p.waitForTimeout(1800);
  const visTexts=()=>p.evaluate(()=>{ const out=[]; const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let x; while((x=tw.nextNode())){ const s=x.textContent.trim(), el=x.parentElement; if(!s||!el) continue; const r=el.getBoundingClientRect(); if(r.width<1||r.bottom<0||r.top>innerHeight) continue; const cs=getComputedStyle(el); if(cs.visibility==="hidden"||cs.display==="none"||+cs.opacity===0) continue; out.push(s); } return out; });
  // 1. haptique : réglage présent, coupé → aucun switch caché et l'action part quand même ; rétabli → switchs de retour
  const h=await p.evaluate(async()=>{ const W=()=>new Promise(z=>setTimeout(z,350)); const r={};
    settingsSheet(); ACT.setgroup({g:"snd"}); await W(); r.row=!!document.querySelector('.sheet [data-a="sethaptic"]');
    closeAll(); await W(); levelSheet("gin"); await W(); r.onLabels=document.querySelectorAll('.sheet label.hap').length; closeAll(); await W();
    ACT.sethaptic(); await W(); r.off=S.settings.haptic===false; levelSheet("gin"); await W(); r.offLabels=document.querySelectorAll('.sheet label.hap').length;
    const btn=document.querySelector('.sheet button[data-a="lvlset"][data-l="2"], .sheet button[data-a="lvlset"]'); if(btn){ btn.click(); await W(); } r.lvl=S.stock.gin; closeAll(); await W();
    ACT.sethaptic(); await W(); r.back=S.settings.haptic===undefined; levelSheet("gin"); await W(); r.backLabels=document.querySelectorAll('.sheet label.hap').length; closeAll(); await W();
    r.set=["startprep","remind","bmfinish","savemix"].every(a=>HAPTIC.has(a)); return r; });
  ok(h.row,"réglage « Retour haptique » absent"); ok(h.onLabels>0&&h.backLabels>0,"haptique active : pas de switch caché "+JSON.stringify(h));
  ok(h.off&&h.offLabels===0,"haptique coupée : des switchs restent "+JSON.stringify(h)); ok(h.lvl!==4,"haptique coupée : le niveau ne change plus "+JSON.stringify(h));
  ok(h.back,"haptique rétablie : réglage non effacé"); ok(h.set,"validations sans tac (préparation, note de l'accueil, Terminer, création)");
  // 2. aucune consigne : écrans et feuilles qui en avaient
  const steps=[["Labo un ingrédient","closeAll(); S.mix={m:'shake',items:[{id:'gin',q:50}],gar:[]}; switchTab('labo'); renderView('labo')"],["Ajout rapide","closeAll(); ACT.quickadd?ACT.quickadd({}):addSheet()"],
    ["Fiche absente","closeAll(); ingSheet('violette')"],["Sections de l'accueil","closeAll(); ACT.homeedit({})"],["Nom de création","closeAll(); S.mix={m:'shake',items:[{id:'gin',q:45},{id:'citron',q:25},{id:'sirop_sucre',q:20}],gar:[]}; nameSheet()"],
    ["Animations","closeAll(); fxSheet()"],["Trophée or","closeAll(); TRO_Q.push('lab100'); TRO_Q.push('d50'); showTrophy()"],["Carte","document.querySelector('.tro-pop')&&document.querySelector('.tro-pop').remove(); TRO_SHOW=false; TRO_Q=[]; closeAll(); switchTab('cocktails'); ACT.cmode2({m:'map'}); ACT.mapfs&&ACT.mapfs({})"],
    ["Recherche vide","document.getElementById('mapfs')&&document.getElementById('mapfs').remove(); MFS=null; CF.mode='list'; CF.q='zzzz'; CF.x=['swiss']; renderView('cocktails')"]];
  for(const [n,e] of steps){ await p.evaluate(e); await p.waitForTimeout(700); const hits=(await visTexts()).filter(s=>RX.test(s)); ok(!hits.length,n+" : consigne « "+hits.join(" | ")+" »"); }
  // 3. recherche sans résultat : deux actions qui marchent
  const e=await p.evaluate(async()=>{ const W=()=>new Promise(z=>setTimeout(z,300)); const r={btn:document.querySelectorAll('#cx-res .empty [data-a="emptyreset"]').length};
    document.querySelector('#cx-res [data-a="emptyreset"][data-q]').click(); await W(); r.q=CF.q; r.input=(document.getElementById("cq")||{}).value;
    document.querySelector('#cx-res [data-a="emptyreset"][data-f]')?.click(); await W(); r.x=CF.x.length; r.rows=document.querySelectorAll('#cx-res .row').length; return r; });
  ok(e.btn===2&&e.q===""&&e.input===""&&e.rows>0,"recherche vide : actions "+JSON.stringify(e));
  // 4. filtres : « Sans alcool » une fois ; zones de 44 px (chips, lien Réinitialiser)
  const f=await p.evaluate(async()=>{ filterSheet(); await new Promise(z=>setTimeout(z,500)); const sh=document.querySelector('.sheet:last-of-type')||document.querySelector('.sheet');
    const labels=[...document.querySelectorAll('.sheet [data-a="tf"]')].map(x=>x.textContent.trim()); const span=e=>{ const r=e.getBoundingClientRect(), cx=r.left+r.width/2; let n=0; for(let y=Math.floor(r.top-30);y<=r.bottom+30;y++){ const a=document.elementFromPoint(cx,y+0.5); if(a&&(a===e||e.contains(a))) n++; } return n; };
    const chips=[...document.querySelectorAll('.sheet [data-a="tf"]')].filter(c=>{ const r=c.getBoundingClientRect(); return r.top>60&&r.bottom<innerHeight-120; });
    return {na:labels.filter(l=>l==="Sans alcool").length, chipMin:Math.min(...chips.map(span)), reset:span(document.querySelector('.sheet [data-a="resetf"]')), left:Math.round(chips[0].getBoundingClientRect().left)}; });
  ok(f.na===1,"« Sans alcool » "+f.na+" fois dans les filtres"); ok(f.chipMin>=44,"chips de filtre : zone de "+f.chipMin+" px"); ok(f.reset>=44,"« Réinitialiser » : zone de "+f.reset+" px"); ok(f.left===20,"marge des chips : "+f.left+" px");
  // 5. fiche d'un cocktail noté : pas de « % pour toi » ; « Réinitialiser » Ta version annulable
  const r=await p.evaluate(async()=>{ closeAll(); await new Promise(z=>setTimeout(z,400)); recSheet("negroni"); await new Promise(z=>setTimeout(z,900)); const facts=(document.querySelector('.sheet .facts')||{}).textContent||"";
    closeAll(); await new Promise(z=>setTimeout(z,400)); S.adj={negroni:{s:1}}; ACT.adjreset({id:"negroni"}); const gone=!S.adj.negroni; document.querySelector("#toast .tbtn")?.click(); return {facts,gone,back:!!(S.adj.negroni&&S.adj.negroni.s===1)}; });
  ok(!/pour toi/.test(r.facts),"cocktail noté : « % pour toi » encore affiché ("+r.facts+")"); ok(r.gone&&r.back,"Réinitialiser Ta version non annulable "+JSON.stringify(r));
  if(errs.length) fail.push("erreurs : "+[...new Set(errs)].join(" | "));
  console.log(fail.length? "Review UI : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "Review UI : réglage « Retour haptique » (coupé : plus de switch caché, l'action marche ; rétabli), tac sur préparation, note de l'accueil, Terminer et création ; aucune consigne sur 9 écrans ; recherche vide avec deux actions ; « Sans alcool » une fois ; chips et Réinitialiser ≥ 44 px, marge de 20 px ; pas de % sur un cocktail noté ; Réinitialiser annulable.");
  await b.close(); SRV.close(); process.exit(fail.length?1:0); })();
