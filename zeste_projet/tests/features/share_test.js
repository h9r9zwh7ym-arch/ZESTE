// 1.72 : carte recette à partager. L'image PNG fait 1080 × 1350 et n'est pas vide ; le dessin contient le nom, les doses
// dans l'unité choisie (cl ou ml), la note, « MA CRÉATION » pour une création ; le lien est dans la fiche ; sans partage
// ni enregistrement possibles, l'image s'affiche pour un appui long ; aucune erreur.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1,unit:"cl"},stock:{gin:1},ratings:{negroni:4},
    custom:[{id:"c_9000",n:"Mon essai",fam:"sour",m:"shake",g:"coupe",ing:[{id:"gin",q:50},{id:"citron",q:25},{id:"sirop_sucre",q:15}]}]})); });
  await p.goto(APP); await p.waitForTimeout(2200);
  const chk=async(id,want)=>{ const r=await p.evaluate(async id=>{ const svg=recCardSVG(id), bl=await recCardBlob(id); if(!bl) return {err:"pas d’image"};
      const bm=await createImageBitmap(bl); const cv=document.createElement("canvas"); cv.width=bm.width; cv.height=bm.height; const c=cv.getContext("2d"); c.drawImage(bm,0,0);
      const d=c.getImageData(0,0,bm.width,bm.height).data; let lit=0; for(let i=0;i<d.length;i+=4*97) if(d[i]+d[i+1]+d[i+2]>600) lit++;
      return {w:bm.width,h:bm.height,size:bl.size,lit,svg,q:RMAP[id].ing.slice(0,3).map(it=>fmtQ(it)),n:RMAP[id].n}; },id);
    if(r.err){ fail.push(id+" : "+r.err); return r; }
    if(r.w!==1080||r.h!==1350) fail.push(`${id} : ${r.w}×${r.h}`); if(r.size<20000) fail.push(id+" : image trop légère ("+r.size+" o)");
    if(r.lit<50) fail.push(id+" : pas de texte clair dessiné ("+r.lit+")");
    const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/’/g,"’");
    if(!r.svg.includes(esc(r.n).slice(0,20))) fail.push(id+" : nom absent");
    r.q.forEach(q=>{ if(!r.svg.includes(q)) fail.push(id+" : dose « "+q+" » absente"); });
    want.forEach(w=>{ if(!(w instanceof RegExp?w.test(r.svg):r.svg.includes(w))) fail.push(id+" : « "+w+" » absent"); });
    return r; };
  await chk("negroni",["LA RECETTE","#FFD36B"," cl<"]);
  await chk("nojito",["sans alcool"]);
  await chk("c_9000",["MA CRÉATION","5 cl"]);
  await p.evaluate(()=>{ S.settings.unit="ml"; }); const ml=await p.evaluate(()=>recCardSVG("negroni")); if(!/\d ml</.test(ml)) fail.push("unité ml non suivie");
  await p.evaluate(()=>{ S.settings.unit="cl"; });
  // lien dans la fiche, puis repli « appui long » (pas de partage ni d'enregistrement en Chromium sans écran)
  await p.evaluate(()=>recSheet("negroni")); await p.waitForTimeout(800);
  const link=p.locator('.sheet [data-a="sharecard"][data-id="negroni"]'); if(!await link.count()) fail.push("bouton « Partager en image » absent de la fiche");
  else { await link.scrollIntoViewIfNeeded(); await link.click(); await p.waitForTimeout(1500);
    const im=await p.evaluate(()=>{ const i=document.querySelector('.sheet:last-of-type img.card-img'); return i&&i.complete&&i.naturalWidth; }); if(im!==1080) fail.push("repli appui long : image absente ("+im+")"); }
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  console.log(fail.length? "Carte à partager : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "Carte à partager : PNG 1080 × 1350 pour une recette notée, une sans alcool et une création ; nom, doses (cl et ml), étoiles, « Ma création » ; lien dans la fiche ; image pour appui long en dernier recours.");
  await b.close(); process.exit(fail.length?1:0); })();
