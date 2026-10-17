// 1.60 (B10) : recherche en langage courant dans Cocktails — 44 requêtes avec résultats attendus (puces d'interprétation,
// contraintes respectées sur toute la liste, sens du classement), fautes de frappe tolérées, nom exact prioritaire,
// et le champ n'est jamais recréé pendant la saisie (piège 13).
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
const Q=[
 ["frais et pas trop fort avec du gin",{chips:["Frais","Léger","Avec gin"],all:{with:"gin"},abv:"<"}],
 ["amer sans alcool",{chips:["Amer","Sans alcool"],all:"na",axis:2}],
 ["léger apéro faisable",{chips:["Léger","Apéro","Faisable"],all:"ok",abv:"<"}],
 ["amère sans alcol",{chips:["Amer","Sans alcool"],all:"na"}],
 ["avec du rum fruité",{chips:["Avec rhum","Fruité"],all:{with:"rhum"},axis:4}],
 ["negroni",{classic:true,first:"Negroni"}],
 ["gin",{classic:true}],
 ["mojito",{classic:true,first:"Mojito"}],
 ["pas trop sucré digestif",{chips:["Peu sucré","Digestif"],axisNeg:0}],
 ["tequilla épicée",{chips:["Avec tequila","Épicé"],all:{with:"agave"}}],
 ["sans vodka fort",{chips:["Sans vodka","Fort"],all:{without:"vodka"},abv:">"}],
 ["fort",{chips:["Fort"],abv:">"}],
 ["léger",{chips:["Léger"],abv:"<"}],
 ["leger",{chips:["Léger"],abv:"<"}],
 ["légé",{chips:["Léger"],abv:"<"}],
 ["puissant et boisé",{chips:["Fort","Boisé"],abv:">",axis:7}],
 ["fumé",{chips:["Boisé"],axis:7}],
 ["épicé",{chips:["Épicé"],axis:6}],
 ["epicé",{chips:["Épicé"],axis:6}],
 ["herbacé",{chips:["Herbacé"],axis:5}],
 ["herbes fraiches",{chips:["Herbacé","Frais"],axis:5}],
 ["fruité",{chips:["Fruité"],axis:4}],
 ["fruitee",{chips:["Fruité"],axis:4}],
 ["acidulé",{chips:["Acide"],axis:1}],
 ["acide sans alcool",{chips:["Acide","Sans alcool"],all:"na",axis:1}],
 ["doux et fruité",{chips:["Sucré","Fruité"],axis:4}],
 ["gourmand",{chips:["Sucré"],axis:0}],
 ["sec et fort",{chips:["Sucré","Fort"].slice(1),abv:">"}],
 ["rafraichissant",{chips:["Frais"],axis:1}],
 ["rafraîchissant faisable",{chips:["Frais","Faisable"],all:"ok"}],
 ["mocktail fruité",{chips:["Sans alcool","Fruité"],all:"na"}],
 ["0% amer",{chips:["Sans alcool","Amer"],all:"na"}],
 ["zéro alcool frais",{chips:["Sans alcool","Frais"],all:"na"}],
 ["faisable",{chips:["Faisable"],all:"ok"}],
 ["faisables avec du gin",{chips:["Faisable","Avec gin"],all:"ok"}],
 ["avec mon bar",{chips:["Faisable"],all:"ok"}],
 ["apéro",{chips:["Apéro"],abv:"<"}],
 ["aperitif amer",{chips:["Apéro","Amer"],axis:2}],
 ["digestif",{chips:["Digestif"],abv:">"}],
 ["brunch",{chips:["Brunch"],abv:"<"}],
 ["amer avec du campari",{chips:["Amer","Avec Campari"],all:{ing:"campari"}}],
 ["sans gin frais",{chips:["Sans gin","Frais"],all:{without:"gin"}}],
 ["whiskey fort",{chips:["Avec whisky","Fort"],all:{with:"whisky"},abv:">"}],
 ["cognac doux",{chips:["Avec cognac","Sucré"],all:{with:"brandy"}}],
];
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ if(!localStorage.getItem("zeste.v1")) localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false}},stock:{gin:3,campari:2,vermouth_rouge:1,tonic:1,prosecco:1,aperol:1,rhum_blanc:1,citron_vert:1}})); });
  await p.goto(APP); await p.waitForTimeout(2500);
  for(const [q,E] of Q){
    const r=await p.evaluate(([q,E])=>{ switchTab('cocktails'); CF.mode="list"; CF.main=""; CF.fam=[]; CF.base=[]; CF.x=[]; CF.q=q; const P=nlParse(q), L=filtered(), av=avgProfile(), bad=[];
      const allAbv=RECS.reduce((a,r)=>a+metricsR(r).abv,0)/RECS.length, top=L.slice(0,5), tAbv=top.reduce((a,r)=>a+metricsR(r).abv,0)/(top.length||1);
      if(E.classic&&P) bad.push("analyse alors qu'il fallait la recherche classique : "+P.T.map(t=>t.n));
      if(E.chips){ if(!P) bad.push("pas d'analyse"); else { const got=P.T.map(t=>t.n); E.chips.forEach(c=>{ if(!got.includes(c)) bad.push("puce « "+c+" » absente : "+got.join(", ")); }); } }
      if(E.first&&(!L[0]||L[0].n!==E.first)) bad.push("premier : "+(L[0]&&L[0].n));
      if(!L.length) bad.push("aucun résultat");
      const has=(r,g)=>baseGroup(r)===g||r.ing.some(i=>norm(ING[i.id].n).split(" ")[0]===g);
      if(E.all==="na"&&L.some(r=>!(r.na||metricsR(r).abv<0.5))) bad.push("un résultat avec alcool");
      if(E.all==="ok"&&L.some(r=>!status(r).ok)) bad.push("un résultat non faisable");
      if(E.all&&E.all.with&&L.some(r=>!has(r,E.all.with))) bad.push("un résultat sans "+E.all.with);
      if(E.all&&E.all.without&&L.some(r=>has(r,E.all.without))) bad.push("un résultat avec "+E.all.without);
      if(E.all&&E.all.ing&&L.some(r=>!r.ing.some(i=>i.id===E.all.ing))) bad.push("un résultat sans "+E.all.ing);
      if(E.abv==="<"&&!(tAbv<allAbv)) bad.push("top 5 pas plus léger ("+tAbv.toFixed(1)+" contre "+allAbv.toFixed(1)+")");
      if(E.abv===">"&&!(tAbv>allAbv)) bad.push("top 5 pas plus fort ("+tAbv.toFixed(1)+" contre "+allAbv.toFixed(1)+")");
      const ax=i=>top.reduce((a,r)=>a+((profileR(r)[i]||0)-av[i]),0)/(top.length||1);
      if(E.axis!=null&&!(ax(E.axis)>0)) bad.push("top 5 pas au-dessus de la moyenne sur "+DIMS[E.axis]);
      if(E.axisNeg!=null&&!(ax(E.axisNeg)<0)) bad.push("top 5 pas sous la moyenne sur "+DIMS[E.axisNeg]);
      return bad; },[q,E]);
    if(r.length) fail.push("« "+q+" » : "+r.join(" ; ")); }
  // dans l'app : puces retirables au-dessus des résultats, le champ n'est jamais recréé
  await p.evaluate(()=>{ CF.q=""; switchTab('cocktails'); CF.mode="list"; dirty.cocktails=1; renderView('cocktails'); }); await p.waitForTimeout(500);
  const before=await p.evaluate(()=>{ window.__cq=document.getElementById('cq'); return !!window.__cq; });
  await p.focus('#cq'); await p.keyboard.type('amer sans alcool',{delay:30}); await p.waitForTimeout(500);
  const v=await p.evaluate(()=>({same:document.getElementById('cq')===window.__cq, val:document.getElementById('cq').value, chips:[...document.querySelectorAll('#cx-res .nl-f button')].map(b=>b.textContent)}));
  if(!before||!v.same||v.val!=='amer sans alcool'||v.chips.length!==2) fail.push('saisie : '+JSON.stringify(v));
  await p.evaluate(()=>document.querySelector('#cx-res .nl-f button:last-child').click()); await p.waitForTimeout(400);
  const w=await p.evaluate(()=>({same:document.getElementById('cq')===window.__cq, val:document.getElementById('cq').value, chips:[...document.querySelectorAll('#cx-res .nl-f button')].map(b=>b.textContent)}));
  if(!w.same||w.val!=='amer'||w.chips.length!==1) fail.push('retrait d’une puce : '+JSON.stringify(w));
  if(errs.length) fail.push('erreurs JS : '+[...new Set(errs)].join(' | '));
  console.log(fail.length?'ÉCHEC recherche en langage courant ('+fail.length+') : '+fail.join(' ¦ '):`Recherche en langage courant : ${Q.length} requêtes conformes (puces, contraintes, classement, fautes de frappe, nom exact prioritaire), puces retirables, champ jamais recréé.`);
  await b.close(); process.exit(fail.length?1:0); })();
