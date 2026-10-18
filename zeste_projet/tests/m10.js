// Conseils du Labo et continuité de la note (1.67). Mesure et cibles (bloquantes) :
//  · un conseil chiffré (« Ajouter … » / « Réduire … ») appliqué comme dans l'app ne fait jamais baisser la note :
//    0 % sur les recettes, leurs versions dégradées (sucre ×1,5 / ×0,5, acidité ×0,5, spiritueux ×2) et 600 mélanges aléatoires ;
//  · au moins 60 % des mélanges notés sous 85 reçoivent un conseil chiffré (1.66 : 51 à 74 % ; 7,5 à 19 % des conseils faisaient baisser la note) ;
//  · retouche de ±5 ml d'un ingrédient d'une vraie recette, verre non débordant avant et après (le Labo s'arrête au bord) :
//    sauts de 20 points ou plus ≤ 0,5 % (1.66 : 0,6 %) ;
//  · (1.69) conseil de méthode : règles d’accord avec ≥ 90 % des recettes ; appliqué, il ne fait jamais baisser la note et disparaît. Les verres déjà remplis à plus de 100 % sont comptés à part, pour information.
// usage : SEED=1 node tests/m10.js (EXP=fichier : variante)
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
const fromRec=r=>({items:r.ing.filter(i=>i.r!=="opt"&&i.r!=="rinse"&&ING[i.id]).map(i=>({id:i.id,q:labQ(i)})),
  m:({shake:"shake",mshake:"shake",stir:"stir"})[r.m]||"build",g:r.g,ice:r.ice,t:TFAM[r.fam]||"auto"});
const setMix=x=>{ S.mix={m:x.m,g:LG.has(x.g)?x.g:"rocks",gUser:1,ice:x.ice||"none",gar:[],t:x.t||"auto",items:x.items.map(i=>({id:i.id,q:i.q}))}; STC={}; MEMO={}; };
const now=()=>{ const A=analyze(); if(!A) return null; const SC=labScore(A); return SC.none? null : {s:SC.score,A,fill:SC.fill}; };
const pool=RECS.filter(r=>!r.mine&&r.m!=="hot");
const sweet=i=>ING[i.id].cat==="sirop"||["sucre","sucre_poudre","miel"].includes(i.id)||(ING[i.id].cat==="liqueur"&&ING[i.id].sug>=20), sour=i=>ING[i.id].ac>3, spirit=i=>ING[i.id].cat==="spirit";
const R={}, add=(k,v)=>{ (R[k]=R[k]||[]).push(v); }; let worst=null;
const check=(tag,x)=>{ setMix(x); const a=now(); if(!a) return; const tips=a.A.diag.filter(d=>d.warn&&d.fix);
  if(a.s<85) add(tag+"|couverture",tips.length?1:0);
  tips.forEach(d=>{ setMix(x); ACT.mixfix({id:d.fix.id,q:String(d.fix.q)}); const b=now(); if(!b) return; const g=b.s-a.s; add(tag+"|gain",g); add(tag+"|pire",g<0?1:0);
    if(g<0&&(!worst||g<worst[0])) worst=[g,tag,d.t,x.items.map(i=>i.id+":"+i.q).join(" ")]; }); };
global.changed=()=>{}; changed=()=>{}; toast=()=>{};
pool.forEach(r=>{ const b=fromRec(r), mul=(f,k)=>b.items.some(f)? Object.assign({},b,{items:b.items.map(i=>f(i)?{id:i.id,q:Math.round(i.q*k*10)/10}:i)}) : null;
  check("recettes",b); [[mul(sweet,1.5),"dégradées"],[mul(sweet,0.5),"dégradées"],[mul(sour,0.5),"dégradées"],[mul(spirit,2),"dégradées"]].forEach(([x,k])=>{ if(x) check(k,x); }); });
const SP=Object.keys(ING).filter(k=>ING[k].cat==="spirit"&&unitOf(k)==="ml"&&!ING[k].al), OT=Object.keys(ING).filter(k=>["liqueur","amaro","vin","sirop","jus","soft"].includes(ING[k].cat)&&unitOf(k)==="ml"&&!ING[k].al&&!ING[k].basic||["citron","citron_vert","sirop_sucre","tonic","soda"].includes(k));
const pick=a=>a[Math.floor(rnd()*a.length)];
for(let n=0;n<600;n++){ const items=[{id:pick(SP),q:10*(2+Math.floor(rnd()*7))}]; const k=1+Math.floor(rnd()*3); for(let j=0;j<k;j++){ const id=pick(OT); if(items.some(i=>i.id===id)) continue; items.push({id,q:10*(ING[id].fizz?(5+Math.floor(rnd()*11)):(1+Math.floor(rnd()*6)))}); }
  const fizz=items.some(i=>ING[i.id].fizz), acid=items.some(i=>ING[i.id].ac>3), m=fizz?"build":acid?"shake":"stir";
  S.mix={m,g:null,gUser:0,ice:null,gar:[],t:"auto",items}; STC={}; MEMO={}; const G=labGlass(); check("aléatoires",{items,m,g:G.g,ice:G.ice,t:"auto"}); }
// (1.69) conseil de méthode : accord des règles avec les recettes de l'app ; mauvaise méthode → conseil qui ne fait pas baisser la note
const MM={shake:"shake",mshake:"shake",stir:"stir",build:"build",mbuild:"build"}; let agr=0, agrN=0; const disagree=[]; const MT={shown:0,blocked:0,worse:0,stays:0,n:0}; let mex=null;
pool.forEach(r=>{ if(!MM[r.m]) return; const b=fromRec(r); const items=b.items.map(i=>({id:i.id,q:i.q,u:unitOf(i.id),r:ING[i.id].fizz&&MM[r.m]!=="build"?"top":""}));
  const adv=labMethodAdvice(items,b.ice||"none"); if(!adv) return; agrN++; if(adv.ok.has(MM[r.m])) agr++; else disagree.push(r.id);
  ["shake","stir","build"].filter(m=>!adv.ok.has(m)).forEach(m=>{ setMix(Object.assign({},b,{m})); const a=now(); if(!a) return; MT.n++;
    const t=labMethodTip(); if(!t){ MT.blocked++; return; } MT.shown++;
    ACT.mm({m:t.m}); const c=now(); if(c&&c.s<a.s){ MT.worse++; if(!mex) mex=[r.id,m,"→",t.m,a.s,c.s]; } if(labMethodTip()) MT.stays++; }); });
// continuité : ±5 ml sur chaque ingrédient en ml d'une vraie recette
const J=[], JA=[]; let jex=null;
pool.forEach(r=>{ const b=fromRec(r); setMix(b); const a=now(); if(!a) return;
  b.items.forEach((it,k)=>{ if(unitOf(it.id)!=="ml") return; [-5,5].forEach(d=>{ const q2=it.q+d; if(q2<=0) return; setMix(Object.assign({},b,{items:b.items.map((x,j)=>j===k?{id:x.id,q:q2}:x)})); const c=now(); if(!c) return;
    const j=Math.abs(c.s-a.s); JA.push(j); if(a.fill>1+1e-6||c.fill>1+1e-6) return; J.push(j); if(!jex||j>jex[0]) jex=[j,r.n,it.id,d,a.s,c.s]; }); }); });
const pc=v=>Math.round(1000*v.reduce((a,b)=>a+b,0)/Math.max(1,v.length))/10, mean=v=>Math.round(10*v.reduce((a,b)=>a+b,0)/Math.max(1,v.length))/10;
console.log('graine '+(process.env.SEED||1)+(process.env.EXP?' — '+process.env.EXP:''));
const fails=[];
for(const t of ["recettes","dégradées","aléatoires"]){ const pire=R[t+"|pire"]||[], cov=R[t+"|couverture"]||[], gain=R[t+"|gain"]||[];
  console.log('  '+t.padEnd(11)+'conseils chiffrés '+pire.length+' : font baisser la note '+pc(pire)+' %, gain moyen '+mean(gain)+' ; notes < 85 avec conseil chiffré '+pc(cov)+' % ('+cov.length+')');
  if(pc(pire)>0) fails.push(t+" : un conseil fait baisser la note"); if(cov.length>=10&&pc(cov)<60) fails.push(t+" : couverture "+pc(cov)+" % < 60 %"); }
const big=pc(J.map(j=>j>=20?1:0)); J.sort((a,b)=>a-b);
console.log('  ±5 ml sur une vraie recette, dans le verre : '+J.length+' retouches, médiane '+J[J.length>>1]+', P99 '+J[Math.floor(.99*(J.length-1))]+', sauts ≥ 20 : '+big+' % (pire : '+JSON.stringify(jex)+')');
console.log('    toutes retouches, verres déjà trop pleins compris (impossible en versant) : '+JA.length+', sauts ≥ 20 : '+pc(JA.map(j=>j>=20?1:0))+' %');
if(big>0.5) fails.push("sauts ≥ 20 points : "+big+" % > 0,5 %");
if(worst) console.log('  pire conseil : '+JSON.stringify(worst));
const agrP=Math.round(1000*agr/Math.max(1,agrN))/10;
console.log('  méthode : règles d’accord avec '+agr+'/'+agrN+' recettes ('+agrP+' %) ; mauvaise méthode : '+MT.n+' cas, conseil affiché '+MT.shown+', retenu par le garde-fou '+MT.blocked+', note en baisse '+MT.worse+', conseil persistant '+MT.stays+(disagree.length?' ; écarts : '+disagree.join(', '):''));
if(agrP<90) fails.push("méthode : accord "+agrP+" % < 90 %"); if(MT.worse) fails.push("méthode : un conseil fait baisser la note "+JSON.stringify(mex)); if(MT.stays) fails.push("méthode : le conseil reste après application");
console.log(fails.length? '  ÉCHEC : '+fails.join(" ; ") : '  Cibles tenues : aucun conseil chiffré ni de méthode ne fait baisser la note ; couverture ≥ 60 % ; sauts ≥ 20 points ≤ 0,5 % ; méthode ≥ 90 % d’accord.');
if(fails.length&&process.env.STRICT!=="0") process.exitCode=1;
}`);
