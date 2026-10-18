// Audit des recettes (1.68) : défauts réparables bloquants (liens de variantes, ingrédients inconnus ou en double, unités, quantités nulles,
// drapeau sans alcool, amers en ml) ; listés pour information : débordement du verre et note du Labo < 70 pour la recette telle quelle.
// usage : node tests/recaudit.js (V=1 : détail des listes informatives)
const fs=require('fs');const h=fs.readFileSync(process.env.HTML||'dist/zeste.html','utf8');let js=h.split('<script>')[1].split('</script>')[0];
global.document={querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},appendChild(){}}),getElementById:()=>null,body:{appendChild(){},prepend(){},classList:{add(){},remove(){},toggle(){}}},documentElement:{dataset:{}}};
global.localStorage={getItem:()=>null,setItem(){}};global.window={addEventListener(){}};global.matchMedia=()=>({matches:false,addEventListener(){}});global.setInterval=()=>0;global.setTimeout=()=>0;global.requestAnimationFrame=()=>0;
js=js.replace(/\nfixState\(\); applyTheme\(\);[\s\S]*$/,"\n");
eval(js+`
REC_RAW.forEach(r=>{ if(r[9]&&r[9].n){ r[9].tip=r[9].n; delete r[9].n; } }); // comme l'app au démarrage (ui.js)
buildRecipes([]); fixState();
{
if(process.env.EXP && fs.existsSync(process.env.EXP)) eval(fs.readFileSync(process.env.EXP,'utf8'));
let seed=+(process.env.SEED||1)*7919; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
const key=s=>String(s).normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");
const LG=new Set(LGLASS.map(x=>x[0]));
const TFAM={sour:"court",stirred:"sec",highball:"long",bulles:"spritz",shot:"shot"};
const all=RECS.filter(r=>!r.mine), out={};
// exceptions vérifiées : le Trinidad Sour (Giuseppe González, 2008) se fait bien avec 45 ml d'Angostura
const EXEMPT={"trinidad_sour":["unité : ml au lieu de d","amer en grande quantité"]};
const add=(k,r,txt)=>{ if(r&&EXEMPT[r.id]&&EXEMPT[r.id].includes(k)) return; (out[k]=out[k]||[]).push((r?r.id+(r.c?"":r.cr?" [cr]":" [nc]"):"")+(txt?" : "+txt:"")); };
// 1) liens de variantes vers des recettes absentes (données brutes)
REC_RAW.forEach(x=>{ const o=x[9]||{}; (o.v||[]).forEach(v=>{ if(!REC_RAW.some(y=>y[0]===v)) add("lien v cassé",RMAP[x[0]],v); }); });
// 2) ingrédients inconnus, doublons, unités
REC_RAW.forEach(x=>{ const r=RMAP[x[0]], seen={}; x[7].forEach(([id,q,u,ro])=>{ if(!ING[id]){ add("ingrédient inconnu",r,id); return; }
  if(seen[id]&&ro!=="rinse") add("ingrédient en double",r,id); seen[id]=1;
  const want=unitOf(id), got=u||"ml"; if(want!=="ml"&&got==="ml") add("unité : ml au lieu de "+want,r,id+" "+q);
  if(want==="ml"&&got!=="ml"&&!["bs","gt","d","u","br","f"].includes(got)) add("unité inconnue",r,id+" "+got);
  if(!(q>0)) add("quantité nulle",r,id);
  if(got==="ml"&&ING[id].cat==="bitters"&&q>10) add("amer en grande quantité",r,id+" "+q+" ml"); }); });
// 3) drapeau sans alcool
all.forEach(r=>{ const alc=r.ing.some(i=>(ING[i.id].abv||0)>=0.5&&i.r!=="opt"); if(r.na&&alc) add("na mais alcool",r,r.ing.filter(i=>ING[i.id].abv>=0.5).map(i=>i.id).join(",")); if(!r.na&&!alc&&r.m!=="hot") add("sans alcool sans drapeau na",r); });
// 4) volume et note du Labo, recette faite telle quelle
const fromRec=r=>({items:r.ing.filter(i=>i.r!=="opt"&&i.r!=="rinse"&&ING[i.id]).map(i=>({id:i.id,q:labQ(i)})),m:({shake:"shake",mshake:"shake",stir:"stir"})[r.m]||"build",g:r.g,ice:r.ice,t:TFAM[r.fam]||"auto"});
all.filter(r=>r.m!=="hot").forEach(r=>{ const x=fromRec(r); S.mix={m:x.m,g:LG.has(x.g)?x.g:"rocks",gUser:1,ice:x.ice||"none",gar:[],t:x.t,items:x.items}; STC={}; MEMO={};
  if(!LG.has(r.g)) add("verre hors Labo",r,r.g);
  const A=analyze(); if(!A) return; const SC=labScore(A); if(SC.none){ add("pas de note au Labo",r); return; }
  if(SC.fill>1.0001) add("déborde du verre",r,Math.round(SC.fill*100)+" % de "+r.g+" ("+Math.round(A.met.vol)+" ml)");
  if(SC.score<70) add("note du Labo < 70",r,SC.score+" ("+SC.goals.filter(g=>g[0]!=="gar"&&g[2]<0.7).map(g=>g[1]+" "+g[2].toFixed(2)).join(", ")+")"); });
const BLOQ=["lien v cassé","ingrédient inconnu","ingrédient en double","unité : ml au lieu de d","unité : ml au lieu de f","unité : ml au lieu de u","unité : ml au lieu de bs","unité inconnue","quantité nulle","na mais alcool","amer en grande quantité"];
let bad=0; for(const k of Object.keys(out).sort()){ const b=BLOQ.includes(k); if(b) bad+=out[k].length; console.log((b?"✗ ":"· ")+k+" ("+out[k].length+")"+(process.env.V||b?"\\n    "+out[k].join("\\n    "):"")); }
console.log(bad? "ÉCHEC : "+bad+" défaut(s) réparable(s)" : "Recettes : aucun défaut réparable ("+all.length+" recettes) ; listés pour information : "+Object.keys(out).filter(k=>!BLOQ.includes(k)).map(k=>k+" "+out[k].length).join(", "));
if(bad) process.exitCode=1;
}`);
