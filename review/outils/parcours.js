// Phase 4 : parcours complets et cas limites, sur un fichier construit. usage : node parcours.js zeste.html
// Chaque étape passe par l'interface (toucher Playwright sur les éléments visibles) quand c'est possible.
const {chromium}=require('playwright'); const fs=require('fs'), http=require('http'), path=require('path');
const FILE=process.argv[2]; const html=fs.readFileSync(FILE);
const srv=http.createServer((q,r)=>{ r.writeHead(200,{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}); r.end(html); });
const now=Date.now(), D=864e5;
(async()=>{ await new Promise(z=>srv.listen(0,'127.0.0.1',z)); const APP='http://127.0.0.1:'+srv.address().port+'/';
  const b=await chromium.launch(); const out=[]; const R=(n,ok,info)=>out.push((ok?"✓ ":"✗ ")+n+(info?" — "+info:""));
  const open=async(state,vp={width:390,height:844},opt={})=>{ const ctx=await b.newContext(Object.assign({viewport:vp,isMobile:true,hasTouch:true,acceptDownloads:true},opt)); const p=await ctx.newPage(); p.errs=[]; p.on('pageerror',e=>p.errs.push(e.message));
    await p.addInitScript(s=>{ window.claude=undefined; if(s!==null&&!sessionStorage.getItem("seeded")){ sessionStorage.setItem("seeded","1"); if(s==="__corrompu__") localStorage.setItem("zeste.v1","{abîmé"); else localStorage.setItem("zeste.v1",JSON.stringify(s)); } },state);
    await p.goto(APP); await p.waitForTimeout(state===null?3400:2200); return {ctx,p}; };
  const tapSel=async(p,sel)=>{ const el=await p.$(sel); if(!el) return false; await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(150); await el.tap(); await p.waitForTimeout(500); return true; };

  // 1. première ouverture
  { const {ctx,p}=await open(null); const r=await p.evaluate(()=>({ov:document.getElementById("overlay").classList.contains("open"),txt:document.getElementById("overlay").textContent.slice(0,80)}));
    R("Première ouverture : accueil puis quiz proposé",r.ov&&/Bienvenue|Zeste/.test(r.txt),r.txt.slice(0,40));
    await tapSel(p,'#overlay [data-a="qzskip"], #overlay .link'); const after=await p.evaluate(()=>({open:document.getElementById("overlay").classList.contains("open"),hero:!!document.querySelector('#v-today .hero')}));
    R("Première ouverture : « Passer » mène à l'accueil",!after.open&&after.hero); R("Première ouverture : aucune erreur JS",!p.errs.length,p.errs.join("|")); await ctx.close(); }

  // 2. bar vide → mettre à jour le stock (ajout rapide), puis niveau d'une bouteille
  { const {ctx,p}=await open({v:1,t:1,quizSkip:1,settings:{fx:{splash:false}},stock:{}}); await p.evaluate(()=>switchTab("bar")); await p.waitForTimeout(400);
    const empty=await p.evaluate(()=>/Ton bar est vide/.test(document.getElementById("v-bar").textContent)); R("Bar vide : état propre",empty);
    await p.evaluate(()=>{ ACT.quickadd?ACT.quickadd({}):addSheet(); }); await p.waitForTimeout(600);
    for(const id of ["gin","campari","vermouth_rouge","tonic"]){ const ok=await tapSel(p,`.sheet [data-a="addtoggle"][data-id="${id}"]`); if(!ok) await p.evaluate(id=>ACT.addtoggle({id}),id); }
    await p.evaluate(()=>closeAll()); await p.waitForTimeout(500);
    const st=await p.evaluate(()=>({n:Object.keys(S.stock).length,neg:status(RMAP.negroni).ok})); R("Stock : 4 bouteilles ajoutées, Negroni faisable",st.n>=4&&st.neg,JSON.stringify(st));
    await p.evaluate(()=>levelSheet("gin")); await p.waitForTimeout(500); await tapSel(p,'.sheet [data-a="lvlset"][data-l="1"]'); await p.waitForTimeout(300);
    const lv=await p.evaluate(()=>S.stock.gin); R("Stock : niveau du gin passé à ¼ en 2 touches",lv===1,"niveau "+lv);
    await p.evaluate(()=>{ closeAll(); levelSheet("gin"); }); await p.waitForTimeout(500); await tapSel(p,'.sheet [data-a="lvlset"][data-l="0"]');
    const rb=await p.evaluate(()=>({v:S.stock.gin,ok:status(RMAP.negroni).ok,list:/À racheter/.test(document.getElementById("v-bar").textContent)})); R("Stock : « Vide » = à racheter, Negroni n'est plus faisable",rb.v===0&&!rb.ok,JSON.stringify(rb));
    R("Bar presque vide : aucune erreur JS",!p.errs.length,p.errs.join("|")); await ctx.close(); }

  // 3. bar très rempli, 1 an de données : chercher un faisable, noter, suggestions, préparation, trophée, export/import
  const rich=JSON.parse(fs.readFileSync(path.join(__dirname,"etat_riche.json"))); rich.settings.fx={splash:false,confetti:false};
  { const {ctx,p}=await open(rich);
    await p.evaluate(()=>{ S.settings.moment="soir"; applyAmbient(); HERO_LAST=null; renderView("today"); }); await p.waitForTimeout(500);   // le matin, l’accueil ne propose rien (voulu) : on se place le soir
    const today=await p.evaluate(()=>({hero:(document.querySelector('#v-today .hero .hn')||{}).textContent,ok:(()=>{ const r=RECS.find(x=>x.n===(document.querySelector('#v-today .hero .hn')||{}).textContent); return r&&status(r).ok; })()}));
    R("Suggestion du soir faisable à l'ouverture (0 touche)",today.ok,today.hero);
    await p.evaluate(()=>switchTab("cocktails")); await p.waitForTimeout(400); await p.focus('#cq'); await p.keyboard.type("gin",{delay:40}); await p.waitForTimeout(400);
    await tapSel(p,'#cx-res .toolbar [data-a="cmain"][data-v="ok"]'); const s=await p.evaluate(()=>({q:CF.q,main:CF.main,n:document.querySelectorAll('#cx-res .row').length,allok:[...document.querySelectorAll('#cx-res .row[data-id]')].every(r=>status(RMAP[r.dataset.id]).ok)}));
    R("Recherche « gin » + Faisables : que des recettes faisables",s.n>0&&s.allok&&s.q==="gin",JSON.stringify(s));
    await p.evaluate(()=>{ CF.q=""; CF.main=""; }); await p.evaluate(()=>{ const i=document.getElementById("cq"); i.value="xyzzy"; i.dispatchEvent(new Event("input",{bubbles:true})); }); await p.waitForTimeout(400);
    const nores=await p.evaluate(()=>({t:(document.querySelector('#cx-res .empty')||{}).textContent||"",act:!!document.querySelector('#cx-res [data-a="emptyreset"]')}));
    R("Recherche sans résultat : état propre avec une action",/Aucun cocktail/.test(nores.t)&&nores.act,nores.t);
    await p.evaluate(()=>{ if(ACT.emptyreset) ACT.emptyreset({q:"1"}); else { CF.q=""; renderView("cocktails"); } }); await p.waitForTimeout(300);
    await p.evaluate(()=>recSheet("sidecar")); await p.waitForTimeout(900); await tapSel(p,'.sheet .rate-box [data-n="4"]');
    const rt=await p.evaluate(()=>S.ratings.sidecar); R("Noter un cocktail (fiche, 4 étoiles)",rt===4,"note "+rt);
    await p.evaluate(()=>closeAll()); await p.waitForTimeout(400);
    const sug=await p.evaluate(()=>{ const t=tonight(); return {n:t.length,ok:t.every(r=>status(r).ok),distinct:new Set(t.map(r=>r.fam)).size,buy:bottleRecs().length}; });
    R("Suggestions : faisables et variées, achats proposés",sug.n>=3&&sug.ok&&sug.distinct>=2&&sug.buy>0,JSON.stringify(sug));
    await p.evaluate(()=>{ switchTab("labo"); LT="prep"; renderView("labo"); newPrepSheet(); }); await p.waitForTimeout(600); const n0=await p.evaluate(()=>S.preps.length);
    await tapSel(p,'.sheet [data-a="startprep"][data-tpl="gingembre"]'); const pr=await p.evaluate(()=>({n:S.preps.length,has:has("sirop_gingembre")}));
    R("Labo : lancer une préparation (sirop de gingembre) → en stock",pr.n===n0+1&&pr.has,JSON.stringify(pr));
    const tro=await p.evaluate(()=>{ const before=(S.tro||[]).length; S.labServes=0; S.mix={m:"shake",items:[{id:"rhum_blanc",q:60},{id:"citron_vert",q:22.5},{id:"sirop_sucre",q:15}],gar:[],t:"auto"}; checkTrophies(); S.labServes=1; checkTrophies(); return {before,after:S.tro.length,lab1:S.tro.includes("lab1")}; });
    R("Débloquer un trophée (Premier mélange)",tro.lab1&&tro.after>tro.before,JSON.stringify(tro));
    const ex=await p.evaluate(async()=>{ let saved=null; window.claude={use:async n=>n==="downloads"?{save:async o=>{ saved=o; }}:null}; await exportData(); window.claude=undefined; return saved&&{name:saved.filename,len:saved.data.length,app:JSON.parse(saved.data).app,v:JSON.parse(saved.data).v}; });
    R("Exporter : fichier daté, marqué Zeste, format numéroté",ex&&/zeste-sauvegarde-\d{4}-\d\d-\d\d\.json/.test(ex.name)&&ex.app==="zeste"&&ex.v>=2,JSON.stringify(ex));
    const im=await p.evaluate(async()=>{ const exp=JSON.parse(JSON.stringify(S)); S.ratings={}; S.stock={}; save(); const mg=typeof migrateState==="function"?migrateState:(x=>x); const clean=sanitizeBackup(mg(JSON.parse(JSON.stringify(exp)))); S=clean; fixState(); buildRecipes(S.custom||[]); return {rt:Object.keys(S.ratings).length,st:Object.keys(S.stock).length,h:S.hist.length,expRt:Object.keys(exp.ratings).length,expH:exp.hist.length}; });
    R("Importer : tout revient (notes, stock, historique)",im.rt===im.expRt&&im.st>0&&im.h===im.expH,JSON.stringify(im));
    R("Bar très rempli + 1 an : aucune erreur JS",!p.errs.length,p.errs.join("|")); await ctx.close(); }

  // 4. clavier ouvert (fenêtre réduite à la hauteur visible au-dessus du clavier de l'iPhone)
  { const {ctx,p}=await open(rich,{width:390,height:844}); await p.evaluate(()=>switchTab("cocktails")); await p.waitForTimeout(300); await p.focus('#cq'); await p.setViewportSize({width:390,height:500}); await p.waitForTimeout(500);
    const k=await p.evaluate(()=>{ const r=document.getElementById("cq").getBoundingClientRect(), tb=document.querySelector(".tabbar").getBoundingClientRect(); return {inTop:r.top>=0&&r.bottom<=innerHeight, overTab:r.bottom>tb.top&&r.top<tb.bottom}; });
    R("Clavier ouvert (recherche) : champ visible, non couvert par les onglets",k.inTop&&!k.overTab,JSON.stringify(k));
    await p.setViewportSize({width:390,height:844}); await p.evaluate(()=>{ S.mix={m:"shake",items:[{id:"gin",q:45},{id:"citron",q:25}],gar:[]}; switchTab("labo"); LT="compose"; renderView("labo"); }); await p.waitForTimeout(500);
    const q=await p.$('#v-labo [data-a="mixqedit"]'); if(q){ await q.scrollIntoViewIfNeeded(); await q.tap(); await p.waitForTimeout(400); }
    await p.setViewportSize({width:390,height:500}); await p.waitForTimeout(500);
    const l=await p.evaluate(()=>{ const i=document.activeElement; if(!i||i.tagName!=="INPUT") return {input:false}; i.scrollIntoView({block:"center"}); const r=i.getBoundingClientRect(), bars=[...document.querySelectorAll('.lab-servebar,.tabbar')].map(e=>e.getBoundingClientRect()); return {input:true,visible:r.top>=0&&r.bottom<=innerHeight,covered:bars.some(b=>r.bottom>b.top&&r.top<b.bottom&&b.height>0)}; });
    R("Clavier ouvert (quantité au Labo) : champ visible, non couvert",l.input&&l.visible&&!l.covered,JSON.stringify(l)); await ctx.close(); }

  // 5. données corrompues, absentes, de mauvais type
  { const {ctx,p}=await open("__corrompu__"); const r=await p.evaluate(()=>({kept:Object.keys(localStorage).some(k=>k.startsWith("zeste.v1.illisible.")),tabs:["today","cocktails","bar","labo","profil"].every(t=>{ switchTab(t); return document.getElementById("v-"+t).innerHTML.length>200; })}));
    R("Données illisibles : mises de côté, l'app démarre",r.kept&&r.tabs&&!p.errs.length,JSON.stringify(r)+p.errs.join("|")); await ctx.close(); }
  { const {ctx,p}=await open({v:1,t:1,quizSkip:1,stock:"x",ratings:[1,2],hist:{a:1},settings:null,custom:[{id:"<b>",ing:"z"}],fav:7,mix:5}); const r=await p.evaluate(()=>["today","cocktails","bar","labo","profil"].every(t=>{ switchTab(t); return document.getElementById("v-"+t).innerHTML.length>200; }));
    R("Données de mauvais type : réparées, l'app démarre",r&&!p.errs.length,p.errs.join("|")); await ctx.close(); }

  console.log(out.join("\n")); console.log(out.filter(x=>x.startsWith("✗")).length+" échec(s) sur "+out.length); await b.close(); srv.close(); })();
