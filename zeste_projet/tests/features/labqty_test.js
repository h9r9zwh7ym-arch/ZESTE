// 1.63 : Labo — le « + » des quantités ne fait plus de son (la tuile oui) ; toucher le nombre permet de taper la quantité :
// cl pour les liquides (« 4,5 » → 45 ml), nombre entier sinon ; au-delà de la place, plafonné sans débordement ; 0 retire ;
// Échap annule ; champ ≥ 16 px, unique et jamais recréé pendant la frappe.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[]; const ok=(c,m)=>{ if(!c) fail.push(m); };
  const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1},stock:{gin:1,tonic:1}})); });
  await p.goto(APP); await p.waitForTimeout(2000);
  const setMix=items=>p.evaluate(items=>{ S.mix={m:"build",g:"highball",gUser:1,ice:"cubes",gar:[],t:"auto",items}; LT="compose"; switchTab("labo"); changed(); window.__pours=0; const P=SND.pour; SND.pour=(...a)=>{ window.__pours++; return P.apply(SND,a); }; },items);
  const q=id=>p.evaluate(id=>(S.mix.items.find(i=>i.id===id)||{q:null}).q,id);
  // son : « + » muet, tuile sonore
  await setMix([{id:"gin",q:40},{id:"angostura",q:2}]); await p.waitForTimeout(400);
  await p.locator('.mix-row button[data-a="mixq"][data-k="0"][data-d="1"]').click(); await p.waitForTimeout(200);
  const s1=await p.evaluate(()=>window.__pours), g1=await q("gin");
  await p.evaluate(()=>ACT.mixpour({id:"tonic"})); const s2=await p.evaluate(()=>window.__pours);
  ok(g1>40,"« + » sans effet : "+g1); ok(s1===0,"« + » joue un son ("+s1+")"); ok(s2>=1,"la tuile ne joue plus de son");
  // saisie en cl
  await setMix([{id:"gin",q:40},{id:"angostura",q:2}]); await p.waitForTimeout(400);
  const btn=p.locator('.mq-n[data-k="0"]'); ok(await btn.count()===1,"nombre touchable absent"); ok(/4\s?cl/.test(await btn.textContent()),"nombre affiché : "+await btn.textContent());
  await btn.click(); await p.waitForTimeout(150);
  const f=await p.evaluate(()=>{ const i=document.querySelector(".mq-in"); return i&&{fs:parseFloat(getComputedStyle(i).fontSize),v:i.value,focus:document.activeElement===i,mode:i.getAttribute("inputmode")}; });
  ok(f&&f.fs>=16&&f.focus&&f.v==="4"&&f.mode==="decimal","champ : "+JSON.stringify(f));
  await p.evaluate(()=>{ window.__inp=document.querySelector(".mq-in"); });
  await p.keyboard.press("Control+A"); await p.keyboard.type("4,5"); 
  ok(await p.evaluate(()=>document.querySelectorAll(".mq-in").length===1&&document.querySelector(".mq-in")===window.__inp),"champ recréé pendant la frappe");
  await p.keyboard.press("Enter"); await p.waitForTimeout(300); ok(await q("gin")===45,"4,5 → 45 ml : "+await q("gin"));
  // saisie en traits
  await p.locator('.mq-n[data-k="1"]').click(); await p.waitForTimeout(100); await p.keyboard.press("Control+A"); await p.keyboard.type("3"); await p.keyboard.press("Enter"); await p.waitForTimeout(300);
  ok(await q("angostura")===3,"traits : "+await q("angostura"));
  // Échap annule
  await p.locator('.mq-n[data-k="0"]').click(); await p.waitForTimeout(100); await p.keyboard.press("Control+A"); await p.keyboard.type("9"); await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  ok(await q("gin")===45,"Échap n'annule pas : "+await q("gin"));
  // au-delà de la place : plafonné, jamais de débordement
  await p.locator('.mq-n[data-k="0"]').click(); await p.waitForTimeout(100); await p.keyboard.press("Control+A"); await p.keyboard.type("99"); await p.keyboard.press("Enter"); await p.waitForTimeout(300);
  const cap=await p.evaluate(()=>{ const {g,ice}=labGlass(); return {vol:labVol(mixItems(),S.mix.m,ice),av:labAvail(g,ice),q:S.mix.items[0].q}; });
  ok(cap.q>45&&cap.vol<=cap.av+1e-6,"plafonné à la place : "+JSON.stringify(cap));
  // tonic au clavier avec moins de 10 cl de place
  await setMix([{id:"gin",q:100},{id:"tonic",q:80}]); await p.waitForTimeout(400);
  await p.locator('.mq-n[data-k="1"]').click(); await p.waitForTimeout(100); await p.keyboard.press("Control+A"); await p.keyboard.type("20"); await p.keyboard.press("Enter"); await p.waitForTimeout(300);
  const t=await p.evaluate(()=>{ const {g,ice}=labGlass(); return {vol:labVol(mixItems(),S.mix.m,ice),av:labAvail(g,ice),q:S.mix.items[1].q}; });
  ok(t.q>80&&t.vol<=t.av+1e-6,"tonic au clavier sous 10 cl : "+JSON.stringify(t));
  // 0 retire
  await p.locator('.mq-n[data-k="1"]').click(); await p.waitForTimeout(100); await p.keyboard.press("Control+A"); await p.keyboard.type("0"); await p.keyboard.press("Enter"); await p.waitForTimeout(300);
  ok(await q("tonic")===null,"0 ne retire pas l'ingrédient");
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  console.log(fail.length? "Quantités du Labo : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "Quantités du Labo : « + » muet (la tuile garde son son), nombre touchable, saisie en cl (4,5 → 45 ml) et en traits, Échap annule, plafonné à la place (tonic compris sous 10 cl), 0 retire, champ 16 px jamais recréé.");
  await b.close(); process.exit(fail.length?1:0); })();
