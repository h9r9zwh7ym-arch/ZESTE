// 1.78 : gestes et « Annuler ». Glisser sur le niveau d'une bouteille le change (sans ouvrir la feuille, sans « Finie ») ;
// un simple toucher ouvre toujours la feuille des niveaux. Appui long sur un cocktail : aperçu, sans ouvrir la fiche ;
// « Voir la recette » ouvre la fiche. « Annuler » remet : une note retirée, un ingrédient du Labo, une création, une
// préparation, une boisson de l'alcoolémie.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844},hasTouch:false}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1},stock:{gin:4,campari:3,vermouth_rouge:2},ratings:{negroni:4},
    mix:{items:[{id:"gin",q:30},{id:"campari",q:30}],m:"stir",t:"sec",gar:[]},custom:[{id:"c_7000",n:"Essai",fam:"sour",m:"shake",g:"coupe",ing:[{id:"gin",q:50},{id:"citron",q:25},{id:"sirop_sucre",q:15}]}],
    preps:[],drinks:[{id:"d1",t:Date.now()-36e5,ml:330,abv:5}]})); });
  await p.goto(APP); await p.waitForTimeout(2200);
  // 1) niveau au glissé : gin Pleine → ½ (−2 crans de 30 px)
  await p.evaluate(()=>switchTab('bar')); await p.waitForTimeout(800);
  const g=await p.evaluate(()=>{ const r=document.querySelector('#v-bar .lvl.one[data-id="gin"]').getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; });
  await p.mouse.move(g.x,g.y); await p.mouse.down(); for(let i=1;i<=10;i++){ await p.mouse.move(g.x-i*6.5,g.y+1); await p.waitForTimeout(16); } await p.mouse.up(); await p.waitForTimeout(500);
  let R=await p.evaluate(()=>({v:S.stock.gin, sheets:SHEETS.length, finie:!!document.querySelector('#sr-gin.sw')}));
  if(R.v!==2||R.sheets||R.finie) fail.push("glissé sur le niveau : "+JSON.stringify(R));
  await p.click('#v-bar .lvl.one[data-id="campari"]'); await p.waitForTimeout(600);
  if(!await p.evaluate(()=>SHEETS.length===1&&!!document.querySelector('.sheet [data-a="lvlset"]'))) fail.push("un toucher sur le niveau n’ouvre plus la feuille");
  await p.evaluate(()=>closeAll()); await p.waitForTimeout(400);
  // 2) appui long sur une ligne de cocktail (faisables)
  await p.evaluate(()=>{ CF.main="";CF.x=[];CF.q=""; switchTab('cocktails'); }); await p.waitForTimeout(800);
  const t=await p.evaluate(()=>{ const e=document.querySelector('#v-cocktails [data-a="rec"][data-id="negroni"]')||document.querySelector('#v-cocktails [data-a="rec"]'); e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2,id:e.dataset.id}; });
  await p.mouse.move(t.x,t.y); await p.mouse.down(); await p.waitForTimeout(650); await p.mouse.up(); await p.waitForTimeout(500);
  R=await p.evaluate(id=>({n:SHEETS.length, peek:!!document.querySelector('.sheet .peek'), name:(document.querySelector('.sheet .peek h1')||{}).textContent, want:RMAP[id].n, rec:SHEETS.some(s=>s.recId)}),t.id);
  if(R.n!==1||!R.peek||R.name!==R.want||R.rec) fail.push("appui long : "+JSON.stringify(R));
  else { await p.click('.sheet [data-a="peekopen"]'); await p.waitForTimeout(800); if(!await p.evaluate(id=>SHEETS.length===1&&SHEETS[0].recId===id,t.id)) fail.push("« Voir la recette » n’ouvre pas la fiche"); }
  await p.evaluate(()=>closeAll()); await p.waitForTimeout(400);
  // un toucher court ouvre toujours la fiche
  const t2=await p.evaluate(id=>{ const e=document.querySelector('#v-cocktails [data-a="rec"][data-id="'+id+'"]'); e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; },t.id); await p.waitForTimeout(300); await p.mouse.click(t2.x,t2.y); await p.waitForTimeout(700); if(!await p.evaluate(()=>SHEETS.some(s=>s.recId))) fail.push("toucher court : pas de fiche"); await p.evaluate(()=>closeAll()); await p.waitForTimeout(400);
  // 3) « Annuler »
  const undo=async(n,act,check)=>{ await p.evaluate(act); await p.waitForTimeout(250); const ok=await p.evaluate(()=>{ const b=document.querySelector('#toast .tbtn'); if(!b||!document.querySelector('#toast.show')) return false; b.click(); return true; }); await p.waitForTimeout(300);
    if(!ok) fail.push(n+" : pas d’« Annuler »"); else if(!await p.evaluate(check)) fail.push(n+" : « Annuler » ne remet pas en état"); };
  await undo("note retirée",()=>ACT.rate({id:"negroni",n:"4"},document.body),()=>S.ratings.negroni===4);
  await undo("ingrédient du Labo",()=>ACT.mixrm({k:"0"}),()=>S.mix.items.length===2&&S.mix.items[0].id==="gin");
  await undo("création",()=>ACT.delcustom({id:"c_7000"}),()=>!!RMAP.c_7000&&S.custom.some(c=>c.id==="c_7000"));
  await p.evaluate(()=>{ S.preps=[{id:"p1",tpl:PREP_TPL[0][0],d:new Date().toISOString()}]; changed(); });
  await undo("préparation",()=>ACT.delprep({pid:"p1"}),()=>S.preps.length===1);
  await undo("boisson",()=>ACT.bacrm({id:"d1"}),()=>(S.drinks||[]).some(d=>d.id==="d1"));
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  console.log(fail.length? "Gestes : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "Gestes : niveau au glissé (sans feuille ni « Finie »), toucher qui ouvre toujours la feuille, aperçu à l’appui long puis fiche, « Annuler » pour la note, l’ingrédient du Labo, la création, la préparation et la boisson.");
  await b.close(); process.exit(fail.length?1:0); })();
