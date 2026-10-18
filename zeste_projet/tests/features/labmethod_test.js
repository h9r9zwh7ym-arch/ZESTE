// 1.69 : le Labo conseille la méthode selon les règles du bar (construit pour les bulles, shaker pour les agrumes et la crème,
// verre à mélange pour les alcools seuls). « Appliquer » change la méthode, la note ne baisse pas et le conseil disparaît ;
// un mélange déjà fait avec une bonne méthode n'a pas de conseil de méthode.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
const CASES=[
  ["gin tonic au shaker",{m:"shake",items:[{id:"gin",q:50},{id:"tonic",q:150}]},"build",/bulles/i],
  ["gin sour au verre à mélange",{m:"stir",items:[{id:"gin",q:50},{id:"citron",q:25},{id:"sirop_sucre",q:15}]},"shake",/agrumes/i],
  ["Negroni au shaker",{m:"shake",items:[{id:"gin",q:30},{id:"campari",q:30},{id:"vermouth_rouge",q:30}]},"stir",/alcools/i],
  ["gin tonic construit",{m:"build",items:[{id:"gin",q:50},{id:"tonic",q:150}]},null,null],
  ["Daiquiri au shaker",{m:"shake",items:[{id:"rhum_blanc",q:60},{id:"citron_vert",q:25},{id:"sirop_sucre",q:15}]},null,null]];
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[]; const log=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1},stock:{gin:1}})); });
  await p.goto(APP); await p.waitForTimeout(2500);
  const state=()=>p.evaluate(()=>{ const e=document.querySelector('#v-labo .tip-meth'); const s=document.querySelector('#v-labo .lab-live b');
    return {tip:e?e.querySelector('.tip-t').textContent:null, m:e?e.querySelector('[data-a="mm"]').dataset.m:null, score:s?+s.textContent:null, cur:S.mix.m}; });
  for(const [n,x,want,re] of CASES){
    await p.evaluate(x=>{ S.mix={m:x.m,g:null,gUser:0,ice:null,gar:[],t:"auto",items:x.items.map(i=>({id:i.id,q:i.q}))}; LT="compose"; switchTab("labo"); changed(); },x); await p.waitForTimeout(500);
    const a=await state();
    if(!want){ if(a.tip) fail.push(n+" : conseil inattendu « "+a.tip+" »"); else log.push(n+" : pas de conseil"); continue; }
    if(!a.tip||a.m!==want||!re.test(a.tip)){ fail.push(n+" : attendu "+want+", obtenu "+JSON.stringify(a)); continue; }
    await p.click('#v-labo .tip-meth [data-a="mm"]'); await p.waitForTimeout(500);
    const c=await state(); log.push(n+" : « "+a.tip+" » "+a.score+" → "+c.score);
    if(c.cur!==want) fail.push(n+" : la méthode n’a pas changé ("+c.cur+")");
    if(c.score<a.score) fail.push(n+" : la note baisse "+a.score+" → "+c.score);
    if(c.tip) fail.push(n+" : le conseil reste après application"); }
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  if(process.env.V) console.error(log.join("\n"));
  console.log(fail.length? "Conseil de méthode : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "Conseil de méthode : construit pour les bulles, shaker pour les agrumes, verre à mélange pour les alcools seuls ; Appliquer change la méthode sans baisser la note ; rien quand la méthode est bonne.");
  await b.close(); process.exit(fail.length?1:0); })();
