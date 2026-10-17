// 1.62 (C) : écran « Et voilà ton cocktail » et score en direct du Labo.
// Sous-scores en chiffres (même mise en page), barres blanches / orange < 70 / rouge < 40, chevron et conseil seulement sous 85,
// ni icône près de l'anneau, ni « Tous les objectifs… », ni « Touche un objectif… » ; « Plutôt … » et « À améliorer : … » gardés.
// Contraste ≥ 4,5:1 de tous les textes blancs sur le fond coloré (mesuré sur les pixels, couleur pâle et couleur vive, clair et sombre).
// Labo : « 78 · Réussi » à la place de « Tout est bon », « Ajoute un second ingrédient » avec un seul rôle, pastilles seulement < 70 ;
// « Pour aller plus loin » sans l'ingrédient de la suggestion du haut ni badge « Toujours là ».
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
const lum=(r,g,b)=>{ const f=c=>{ c/=255; return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4); }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[]; const ok=(c,m)=>{ if(!c) fail.push(m); };
  const MIXES={pale:[{id:"vodka",q:50},{id:"citron_vert",q:15},{id:"sirop_sucre",q:5}],rouge:[{id:"gin",q:30},{id:"campari",q:30},{id:"vermouth_rouge",q:30}],faible:[{id:"gin",q:40},{id:"sirop_sucre",q:60}]};
  for(const sc of ["light","dark"]) for(const [mk,mix] of Object.entries(MIXES)){
    const p=await b.newPage({viewport:{width:390,height:844},colorScheme:sc,deviceScaleFactor:1}); p.on('pageerror',e=>errs.push(e.message));
    await p.addInitScript(()=>{ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},reduce:true},stock:{gin:1,vodka:1,campari:1,vermouth_rouge:1}})); });
    await p.goto(APP); await p.waitForTimeout(1800);
    await p.evaluate(m=>{ S.mix={m:"shake",g:null,gUser:0,ice:null,gar:[],t:"auto",items:m}; LT="compose"; switchTab("labo"); openServe(); },mix);
    await p.waitForTimeout(5500);
    const info=await p.evaluate(()=>{ const el=document.getElementById("serve"), SC=labScore(analyze());
      const rows=[...el.querySelectorAll(".sv-goal")].map((g,i)=>({k:SC.goals[i][0],v:SC.goals[i][2],num:(g.querySelector(".sv-gi")||{}).textContent,chev:!!g.querySelector(".sv-chev"),act:g.getAttribute("data-a"),bar:getComputedStyle(g.querySelector("u")).backgroundColor,check:!!g.querySelector(".sv-gi svg")}));
      return {rows,icon:!!el.querySelector(".sv-e"),txt:el.textContent,grade:(el.querySelector(".sv-grade b")||{}).textContent,score:SC.score}; });
    ok(!info.icon,mk+" "+sc+" : icône près de l'anneau"); ok(!/Tous les objectifs|Touche un objectif/.test(info.txt),mk+" "+sc+" : phrase retirée encore là");
    ok(info.rows.every(r=>r.num===String(Math.round(r.v*100))&&!r.check),mk+" "+sc+" : chiffres à la place des coches "+JSON.stringify(info.rows.map(r=>r.num)));
    ok(info.rows.every(r=>(r.v<0.85)===(r.chev&&r.act==="svgoal")),mk+" "+sc+" : chevron et conseil seulement sous 85");
    ok(info.rows.filter(r=>r.k!=="gar"&&r.v>0).every(r=>r.v<0.4? /255, 69, 58/.test(r.bar) : r.v<0.7? /255, 159, 10/.test(r.bar) : /255, 255, 255/.test(r.bar)),mk+" "+sc+" : couleurs des barres "+JSON.stringify(info.rows.map(r=>[r.v.toFixed(2),r.bar])));
    const [w]=await p.evaluate(s=>labGrade(s),info.score); ok(info.grade===w,mk+" : mot « "+info.grade+" » ≠ « "+w+" »");
    // contraste : texte blanc mesuré sur le fond réel (texte masqué), pixel le plus clair de chaque zone de texte
    const boxes=await p.evaluate(()=>{ const out=[]; document.querySelectorAll("#serve .sv-in *").forEach(e=>{ const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()); if(!own) return; const c=getComputedStyle(e); const m=c.color.match(/[\d.]+/g).map(Number); if(m[0]<200||m[1]<200||m[2]<200) return; const r=e.getBoundingClientRect(); if(!r.width||r.bottom<0||r.top>innerHeight) return; let o=1; for(let x=e;x;x=x.parentElement) o*=+getComputedStyle(x).opacity; out.push({t:e.textContent.trim().slice(0,24),x:r.left,y:r.top,w:r.width,h:r.height,o,a:m[3]==null?1:m[3]}); }); return out; });
    await p.addStyleTag({content:"#serve .sv-in *{color:transparent!important;text-shadow:none!important} #serve .sv-in svg{visibility:hidden}"}); await p.waitForTimeout(150);
    const b64=(await p.screenshot({type:"png"})).toString("base64");
    const worst=await p.evaluate(async([b64,boxes])=>{ const img=new Image(); img.src="data:image/png;base64,"+b64; await img.decode();
      const cv=document.createElement("canvas"); cv.width=img.width; cv.height=img.height; const cx=cv.getContext("2d"); cx.drawImage(img,0,0);
      const lum=(r,g,b)=>{ const f=c=>{ c/=255; return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4); }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
      return boxes.map(bx=>{ const x0=Math.max(0,bx.x|0), y0=Math.max(0,bx.y|0), w=Math.max(1,Math.min(cv.width-x0,Math.ceil(bx.w))), h=Math.max(1,Math.min(cv.height-y0,Math.ceil(bx.h))), d=cx.getImageData(x0,y0,w,h).data; let k=Infinity;
        for(let i=0;i<d.length;i+=8){ const a=bx.o*bx.a, L=lum(d[i],d[i+1],d[i+2]), Lt=lum(255*a+d[i]*(1-a),255*a+d[i+1]*(1-a),255*a+d[i+2]*(1-a)); k=Math.min(k,(Math.max(Lt,L)+0.05)/(Math.min(Lt,L)+0.05)); }
        return [bx.t,k]; }); },[b64,boxes]);
    worst.forEach(([t,k])=>ok(k>=4.5,mk+" "+sc+" : contraste "+k.toFixed(2)+" pour « "+t+" »"));
    if(!worst.length) fail.push(mk+" "+sc+" : aucun texte mesuré");
    await p.close(); }
  // Labo : score en direct, un seul rôle, pastilles, « Pour aller plus loin »
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false}},stock:{gin:1,vodka:1}})); });
  await p.goto(APP); await p.waitForTimeout(1800);
  const L=await p.evaluate(async()=>{ const W=()=>new Promise(z=>setTimeout(z,300)); const st=()=>{ const s=document.querySelector(".lab-stage"); return {live:(document.querySelector(".lab-live")||{}).textContent||"", allok:!!document.querySelector(".lab-allok"), chips:[...document.querySelectorAll(".lab-goals .goal")].map(x=>x.textContent.replace("!","").trim())}; };
    LT="compose"; S.mix={m:"shake",g:null,gUser:0,ice:null,gar:[],t:"auto",items:[]}; switchTab("labo"); await W(); const empty=st();
    S.mix.items=[{id:"tonic",q:200}]; changed(); await W(); const one=st();
    S.mix.items=[{id:"vodka",q:50},{id:"citron_vert",q:15},{id:"sirop_sucre",q:5}]; changed(); await W(); const good=st(), SCg=labScore(analyze());
    S.mix.items=[{id:"vodka",q:101},{id:"citron",q:10}]; S.mix.g="highball"; S.mix.gUser=1; S.mix.ice="cubes"; changed(); await W(); const bad=st(), SCb=labScore(analyze());
    const low=SCb.goals.filter(g=>g[0]!=="gar"&&g[2]<0.7).map(g=>g[1]);
    const d=document.querySelector(".lab-more"); const tip=[...document.querySelectorAll(".tip-one [data-id]")].map(x=>x.dataset.id); const pairs=d?[...d.querySelectorAll('.pair [data-a="mixadd1"]')].map(x=>x.dataset.id):[];
    return {empty,one,good,gw:labGrade(SCg.score)[0],gs:SCg.score,bad,bs:SCb.score,bw:labGrade(SCb.score)[0],low,tip,pairs,tl:d?/Toujours là/.test(d.innerHTML):false,proche:/Proche d’un classique/.test(document.querySelector("#v-labo").textContent.replace(/Ça ressemble à[\s\S]*/,"")),
      words:[39,40,69,70,84,85].map(s=>labGrade(s)[0])}; });
  ok(!L.empty.live&&!L.empty.allok,"sans ingrédient : rien"); ok(L.one.live==="Ajoute un second ingrédient","un seul rôle : « "+L.one.live+" »");
  ok(L.good.live===L.gs+" · "+L.gw&&!L.good.allok,"score en direct : « "+L.good.live+" »"); ok(L.bad.live===L.bs+" · "+L.bw,"score en direct (mauvais) : « "+L.bad.live+" »");
  ok(JSON.stringify(L.bad.chips)===JSON.stringify(L.low),"pastilles = sous-scores < 70 : "+JSON.stringify(L.bad.chips)+" / "+JSON.stringify(L.low)); ok(!L.good.chips.length||L.good.chips.every(c=>L.low),"pastilles bon mélange : "+L.good.chips);
  ok(!L.pairs.some(x=>L.tip.includes(x)),"« Pour aller plus loin » répète la suggestion du haut"); ok(!L.tl,"badge « Toujours là »"); ok(!L.proche,"« Proche d’un classique » hors « Ça ressemble à »");
  ok(JSON.stringify(L.words)==='["Déséquilibré","Buvable","Buvable","Réussi","Réussi","Excellent"]',"mots : "+L.words);
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  console.log(fail.length? "Écran de service et score en direct : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "Écran de service et score en direct : chiffres, barres colorées, chevrons sous 85, contraste ≥ 4,5:1 mesuré (pâle, rouge, faible ; clair et sombre), « N · mot » en direct, pastilles < 70, « Pour aller plus loin » sans doublon.");
  await b.close(); process.exit(fail.length?1:0); })();
