// 1.79 : quatre verres de plus (Nick & Nora, julep, hurricane, tiki). Formes déclarées et dessinées sans erreur ;
// recettes traditionnelles servies dedans (y compris après la reconstruction des recettes au démarrage) ; julep et
// tiki opaques (corps devant le liquide, décor visible) ; noms et contenances au Labo ; choisir chaque verre au Labo
// n'affiche jamais « Cet écran n'a pas pu s'afficher ».
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1},stock:{gin:1},mix:{items:[{id:"gin",q:45},{id:"citron",q:20},{id:"sirop_sucre",q:15}],m:"shake",gar:[]}})); });
  await p.goto(APP); await p.waitForTimeout(2000);
  const R=await p.evaluate(()=>{ const o=[], G=["nick","julep","hurricane","tiki"];
    G.forEach(g=>{ const sh=GLASS_SHAPES[g]; if(!sh||!sh.o||!sh.rim) o.push(g+" : forme absente"); if(!GNAME[g]||!GLASSES[g]||!LCAP[g]||!LGLASS.some(x=>x[0]===g)) o.push(g+" : nom ou contenance absent"); });
    Object.entries(GLASS_FIX).forEach(([g,ids])=>ids.forEach(id=>{ if(!RMAP[id]) o.push(id+" inconnu"); else if(RMAP[id].g!==g) o.push(id+" servi en "+RMAP[id].g); }));
    buildRecipes(S.custom); if(RMAP.zombie.g!=="tiki") o.push("verre perdu après buildRecipes");
    ["mint_julep","zombie"].forEach(id=>{ const s=glassSVG(RMAP[id]); const a=s.indexOf('class="opaque"'), liq=s.indexOf('class="liq"'); if(a<0||a<liq) o.push(id+" : corps opaque absent ou derrière le liquide"); if(s.indexOf('class="garn"',a)<0) o.push(id+" : décor derrière le corps"); });
    ["martinez","hurricane"].forEach(id=>{ if(glassSVG(RMAP[id]).includes('class="opaque"')) o.push(id+" : opaque à tort"); });
    return o; });
  fail.push(...R);
  await p.evaluate(()=>switchTab('labo')); await p.waitForTimeout(700);
  for(const g of ["nick","julep","hurricane","tiki"]){ await p.evaluate(g=>ACT.mixglass({v:g}),g); await p.waitForTimeout(350);
    const t=await p.evaluate(()=>({fail:/pas pu s’afficher/.test(document.querySelector('#v-labo').textContent), g:labGlass().g})); if(t.fail||t.g!==g) fail.push("Labo, verre "+g+" : "+JSON.stringify(t)); }
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  console.log(fail.length? "Verres : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "Verres : Nick & Nora, julep, hurricane et tiki dessinés, 13 recettes servies dedans (gardées après reconstruction), julep et tiki opaques avec décor devant, choix et contenances au Labo sans erreur.");
  await b.close(); process.exit(fail.length?1:0); })();
