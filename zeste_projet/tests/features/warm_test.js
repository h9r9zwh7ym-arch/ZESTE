// 1.80 : « Ambiance bar le soir ». Coupée par défaut ; activée, de 19 h à 6 h l'app passe en palette chaude (variante du
// thème sombre : data-theme="dark" + data-warm), même si le thème choisi est « Clair » ; à 15 h, le thème choisi revient ;
// contraste des textes ≥ 4,5:1 (principal, secondaire, couleur d'accent) ; le réglage est dans Apparence.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
const run=async(b,h,st)=>{ const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(([h,st])=>{ const O=Date,T=new O(2026,10,1,h).getTime(); globalThis.Date=class extends O{ constructor(...a){ if(!a.length) return new O(T); return new O(...a);} static now(){return T;} };
    localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:Object.assign({fx:{splash:false},hintSwipe:1},st),stock:{gin:1}})); },[h,st]);
  await p.goto(APP); await p.waitForTimeout(1800); return {p,errs}; };
const lum=c=>{ const m=c.match(/[\d.]+/g).map(Number); const f=v=>{ v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); }; return 0.2126*f(m[0])+0.7152*f(m[1])+0.0722*f(m[2]); };
const ratio=(a,b)=>{ const x=lum(a),y=lum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); };
(async()=>{ const b=await chromium.launch(); const fail=[]; let errs=[];
  let {p,errs:e}=await run(b,21,{theme:"light"}); errs=errs.concat(e);
  if(await p.evaluate(()=>!!document.documentElement.dataset.warm)) fail.push("activée sans le réglage");
  await p.evaluate(()=>{ ACT.setgroup({g:"look"}); }); await p.waitForTimeout(600);
  const row=await p.evaluate(()=>!!document.querySelector('.sheet [data-a="setwarm"]')); if(!row) fail.push("réglage absent d’Apparence");
  else { await p.click('.sheet [data-a="setwarm"]'); await p.waitForTimeout(400); }
  const W=await p.evaluate(()=>{ const el=document.documentElement, cs=getComputedStyle(el), bg=getComputedStyle(document.body).backgroundColor, v=k=>cs.getPropertyValue(k).trim();
    const probe=c=>{ const d=document.createElement("div"); d.style.color=c; document.body.appendChild(d); const r=getComputedStyle(d).color; d.remove(); return r; };
    const bgc=probe(v("--bg")), bg2=probe(v("--bg2"));
    return {theme:el.dataset.theme, warm:el.dataset.warm, saved:S.settings.warm, bg:bgc, bg2, label:probe(v("--label")), label2:probe(v("--label2")), tint:probe(v("--tint"))}; });
  if(W.theme!=="dark"||W.warm!=="1"||W.saved!==true) fail.push("21 h, thème clair, réglage activé : "+JSON.stringify(W));
  // contraste (label2 est translucide : on le mélange sur le fond)
  const mixA=(fg,bg)=>{ const f=fg.match(/[\d.]+/g).map(Number), g=bg.match(/[\d.]+/g).map(Number), a=f[3]!=null?f[3]:1; return `rgb(${[0,1,2].map(i=>Math.round(f[i]*a+g[i]*(1-a))).join(",")})`; };
  for(const [n,c] of [["texte",W.label],["texte secondaire",W.label2],["accent",W.tint]]) for(const [bn,bgc] of [["fond",W.bg],["carte",W.bg2]]){ const r=ratio(mixA(c,bgc),bgc); if(r<4.5) fail.push(`contraste ${n} sur ${bn} : ${r.toFixed(2)}:1`); }
  errs=errs.concat(e); await p.close();
  ({p,errs:e}=await run(b,15,{theme:"light",warm:true})); const day=await p.evaluate(()=>({t:document.documentElement.dataset.theme||"", w:document.documentElement.dataset.warm||""})); errs=errs.concat(e); await p.close();
  if(day.t!=="light"||day.w) fail.push("à 15 h, le thème clair ne revient pas : "+JSON.stringify(day));
  ({p,errs:e}=await run(b,5,{theme:"auto",warm:true})); const night=await p.evaluate(()=>document.documentElement.dataset.warm); errs=errs.concat(e); await p.close();
  if(night!=="1") fail.push("à 5 h : pas d’ambiance chaude");
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  console.log(fail.length? "Ambiance du soir : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "Ambiance du soir : coupée par défaut, réglage dans Apparence, active de 19 h à 6 h même en thème clair, thème choisi rendu le jour, contraste ≥ 4,5:1 (texte, secondaire, accent ; fond et cartes).");
  await b.close(); process.exit(fail.length?1:0); })();
