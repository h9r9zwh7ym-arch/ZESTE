// ================= ZESTE 1.69 : Labo — conseil de méthode (construit, verre à mélange, shaker) =================
// Règles de bar (Difford's Guide, Liquor.com « shake vs stir ») :
//  · pétillant → construit (un soda secoué perd ses bulles) ; mais agrume / jus / œuf / crème avec moins de 60 % de pétillant →
//    shaker puis on complète avec le pétillant (Collins, Fizz, French 75), le construit restant admis (Mojito) ;
//  · œuf, crème, lait, liqueur crémeuse, café → shaker (émulsion) ;
//  · agrume → shaker (le construit reste admis : Caipirinha pilée dans le verre) ; jus non acide → shaker ou construit
//    (long drink simple : construit conseillé, ex. Screwdriver) ;
//  · seulement des ingrédients clairs → verre à mélange (construit admis sur glace : Godmother, Rusty Nail) ; apéritif au vin → construit (Kir) ;
//  · toujours admis : construit pour un shot, verre à mélange avec de la tomate (Bloody Mary « roulé »).
// Le conseil n'apparaît que si la méthode choisie n'est pas admise, et seulement si la bonne méthode ne fait pas baisser la note.
const CREAMY=new Set(["blanc_oeuf","jaune_oeuf","oeuf","creme","creme_coco","lait","baileys","eierlikor"]);
function labMethodAdvice(items,ice){
  items=items||mixItems(); if(ice==null) ice=labGlass().ice; if(!items.length) return null;
  const V=items.reduce((a,i)=>a+mlOf(i),0)||1, I=i=>ING[i.id]||{};
  const fizz=items.filter(i=>I(i).fizz).reduce((a,i)=>a+mlOf(i),0);
  const creamy=items.some(i=>CREAMY.has(i.id)), cafe=items.some(i=>i.id==="espresso"||i.id==="cafe");
  const acid=items.some(i=>I(i).cat==="jus"&&I(i).ac>3);
  const juice=items.filter(i=>I(i).cat==="jus"&&I(i).ac<=3&&i.id!=="tomate"), juiceV=juice.reduce((a,i)=>a+mlOf(i),0);
  const main=items.filter(i=>!I(i).basic&&mlOf(i)>=5).length;
  const iced=ice&&ice!=="none", tomato=items.some(i=>i.id==="tomate"), shot=!iced&&V<=70;
  const wine=items.filter(i=>I(i).cat==="vin"&&!I(i).fizz).reduce((a,i)=>a+mlOf(i),0);
  const R=(best,ok,why)=>{ const o=new Set(ok); if(shot) o.add("build"); if(tomato) o.add("stir"); return {best,ok:o,why}; };
  if(fizz>0){
    if(acid||creamy||juice.length) return R(fizz/V<0.6?"shake":"build",["shake","build"],fizz/V<0.6?(creamy?"oeuf":acid?"acid":"jus"):"fizz");
    return R("build",["build"],"fizz"); }
  if(creamy) return R("shake",["shake","build"],"oeuf");     // crème posée dessus, couches (White Russian, B52) : construit admis
  if(cafe) return R("shake",["shake"],"cafe");
  if(acid) return R("shake",["shake","build"],"acid");
  if(juice.length){ const long=juiceV/V>=2/3&&main<=3&&iced; return R(long?"build":"shake",["shake","build"],long?"long":"jus"); }
  if(wine/V>=0.5) return R("build",["build","stir"],"vin");  // Kir, Cardinal : apéritif au vin construit dans le verre
  const ok=["stir"]; if(iced) ok.push("build"); return R("stir",ok,"clair");
}
const METH_TXT={vin:"Apéritif au vin : construis-le",fizz:"Des bulles : construis-le",long:"Long drink : construis-le",clair:"Alcools seuls : remue-le",
  acid:"Des agrumes : au shaker",jus:"Du jus : au shaker",cafe:"Du café : au shaker"};
function methodText(adv,items){ if(adv.why==="oeuf"){ const ids=items.map(i=>i.id); return (ids.some(id=>["blanc_oeuf","jaune_oeuf","oeuf","eierlikor"].includes(id))?"De l’œuf":"De la crème")+" : au shaker"; }
  return METH_TXT[adv.why]; }
// conseil affichable : méthode actuelle non admise, et la bonne méthode ne fait pas baisser la note
let LAB_METH={k:"",v:null};
function labMethodTip(){ const M=mixState(), items=mixItems(); if(!items.length) return null;
  const key=JSON.stringify([M.items,M.m,M.g,M.gUser,M.ice,M.t]); if(LAB_METH.k===key) return LAB_METH.v;
  let out=null; const adv=labMethodAdvice(items);
  if(adv&&!adv.ok.has(M.m)){ const cur=labEvalItems(M.items.map(i=>({id:i.id,q:i.q})));
    const bk=M.m; M.m=adv.best; let nx; try{ nx=labEvalItems(M.items.map(i=>({id:i.id,q:i.q}))); } finally{ M.m=bk; }
    if(!cur||!nx||nx.s>=cur.s) out={m:adv.best,txt:methodText(adv,items),from:cur&&cur.s,to:nx&&nx.s}; }
  LAB_METH={k:key,v:out}; return out; }
if(typeof vCompose==="function"){ const _vc=vCompose; vCompose=function(){ let h=_vc(); const t=labMethodTip(); if(!t) return h;
  const row=`<div class="tip-r tip-one tip-meth">${lu("lightbulb","tip-bulb")}<span class="tip-t">${esc(t.txt)}</span><button class="btn small sec tip-b" data-a="mm" data-m="${t.m}" aria-label="${esc(t.txt)}">Appliquer</button></div>`;
  if(/<div class="group lab-tips">/.test(h)) return h.replace(/<div class="group lab-tips">/,m=>m+row);
  const at=h.indexOf('<div class="btn-row"><button class="btn lab-serve"'); if(at<0) return h;
  const sp=h.lastIndexOf('<div class="sp16"></div>',at); const pos=sp>=0&&sp>at-40? sp : at;
  return h.slice(0,pos)+`<div class="group lab-tips">${row}</div>`+h.slice(pos); }; }
