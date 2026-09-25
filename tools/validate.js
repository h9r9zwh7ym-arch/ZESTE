// Validation des données de recettes : node tools/validate.js
const d=require('./load.js')();
const ING={};d.ING_RAW.forEach(i=>{if(ING[i[0]])err('ingrédient en double : '+i[0]);ING[i[0]]=i;});
const M=["shake","stir","build","mbuild","mshake","hot","louche"],G=["coupe","martini","rocks","highball","flute","vin","mug","tasse","shot"],
 ICE=["none","cubes","big","pilee"],U=["ml","d","f","u","bs","br","gt"],R=["top","float","rinse","opt"],FAM=["sour","stirred","highball","herbes","bulles","tiki","dessert","chaud","sansalcool"];
let n=0;function err(s){n++;console.log('✗ '+s);}
const ids=new Set();
d.REC_RAW.forEach(r=>{const [id,nm,fam,m,g,ice,col,ing,gar,x]=r;
  if(ids.has(id))err(id+' : id en double');ids.add(id);
  if(!M.includes(m))err(id+' : méthode '+m);if(!G.includes(g))err(id+' : verre '+g);if(!ICE.includes(ice))err(id+' : glace '+ice);
  if(!/^#[0-9A-Fa-f]{6}$/.test(col))err(id+' : couleur '+col);
  const seen=new Set();
  ing.forEach(([i,q,u,ro])=>{if(!ING[i])err(id+' : ingrédient inconnu '+i);if(!(q>0))err(id+' : quantité '+q+' pour '+i);
    if(u&&!U.includes(u))err(id+' : unité '+u);if(ro&&!R.includes(ro))err(id+' : rôle '+ro);
    const k=i+'|'+(ro||'');if(seen.has(k))err(id+' : '+i+' en double');seen.add(k);});
  if(x&&x.st&&!Array.isArray(x.st))err(id+' : st doit être une liste');
});
d.REC_RAW.forEach(r=>((r[9]||{}).v||[]).forEach(v=>{if(!ids.has(v))err(r[0]+' : variante inconnue '+v);}));
console.log(d.ING_RAW.length+' ingrédients, '+d.REC_RAW.length+' recettes : '+(n?n+' erreur(s)':'aucune erreur'));
process.exit(n?1:0);
