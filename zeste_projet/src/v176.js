// ================= ZESTE 1.72 : carte recette à partager =================
// Une image portrait 1080 × 1350 (format Instagram) : le verre sur la couleur du cocktail, le nom, la méthode, le verre,
// les doses dans ton unité, ta note, « Ma création » pour une création, et la marque. Même chaîne que le Rewind
// (SVG → image → canvas → PNG) ; envoi par le partage du téléphone, sinon enregistrement, sinon appui long.
const CARD_W=1080, CARD_H=1350;
function cardTxt(s,n){ s=String(s); return s.length>n? s.slice(0,n-1).trimEnd()+"…" : s; }
function recCardSVG(id){ const r=RMAP[id]; if(!r) return "";
  const col=/^#[0-9a-f]{6}$/i.test(r.col||"")?r.col:"#2E7A52", rt=S.ratings[id]||0, mine=!!(r.mine||r.cr);
  const g=svgStandalone(glassSVG(r)).replace("<svg",`<svg x="390" y="196" width="300" height="370"`);
  const name=cardTxt(r.n,30), fs=Math.min(84,Math.round(1640/Math.max(10,name.length)));
  const m=metricsR(r), sub=[METH[r.m],GNAME[r.g],Math.round(m.abv)>0?Math.round(m.abv)+" %":"sans alcool"].filter(Boolean).join("  ·  ");
  const yName=rt?630:660, ySub=rt?768:718, L=r.ing, N=Math.min(L.length,9), y0=ySub+100, dy=Math.min(58,(1170-y0)/Math.max(1,N));
  const rows=L.slice(0,N).map((it,k)=>{ const y=y0+k*dy, last=k===N-1&&L.length>N;
    if(last) return `<text x="540" y="${y}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="34" fill="rgba(255,255,255,.7)">et ${L.length-N+1} autres ingrédients</text>`;
    return `<text x="470" y="${y}" text-anchor="end" font-family="Helvetica,Arial,sans-serif" font-weight="700" font-size="36" fill="#fff">${esc(fmtQ(it))}</text><text x="500" y="${y}" font-family="Helvetica,Arial,sans-serif" font-size="36" fill="rgba(255,255,255,.88)">${esc(cardTxt(ING[it.id].n,28))}${it.r==="opt"?" (facultatif)":""}</text>`; }).join("");
  const star=(x,on)=>`<path transform="translate(${x} 672) scale(1.6)" d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" fill="${on?"#FFD36B":"rgba(255,255,255,.22)"}"/>`;
  const stars=rt?[0,1,2,3,4].map(k=>star(540-2.5*44+k*44-19,k<rt)).join(""):"";
  const mark=typeof zesteMark==="function"?zesteMark({round:true}).replace(/ class="[^"]*"/g,"").replace(/ aria-hidden="true"/,"").replace("<svg",'<svg x="452" y="1238" width="56" height="56"'):"";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}"><defs><radialGradient id="bg" cx="50%" cy="26%" r="85%"><stop offset="0" stop-color="${col}"/><stop offset=".5" stop-color="${mix(col,"#000000",.62)}"/><stop offset="1" stop-color="#0C0810"/></radialGradient></defs><rect width="${CARD_W}" height="${CARD_H}" fill="url(#bg)"/>
    <text x="540" y="92" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-weight="700" font-size="30" letter-spacing="4" fill="rgba(255,255,255,.75)">${mine?"MA CRÉATION":"LA RECETTE"}</text>${g}
    <text x="540" y="${yName}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="${fs}" fill="#fff">${esc(name)}</text>${stars}
    <text x="540" y="${ySub}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="32" fill="rgba(255,255,255,.72)">${esc(sub)}</text>
    <line x1="340" y1="${ySub+34}" x2="740" y2="${ySub+34}" stroke="rgba(255,255,255,.22)" stroke-width="2"/>${rows}
    ${mark}<text x="${mark?522:540}" y="1280" text-anchor="${mark?"start":"middle"}" font-family="Georgia,serif" font-weight="700" font-size="40" fill="rgba(255,255,255,.9)">zeste</text></svg>`;
}
async function recCardBlob(id){ const svg=recCardSVG(id); if(!svg) return null;
  const img=new Image(); img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg); await img.decode();
  const cv=document.createElement("canvas"); cv.width=CARD_W; cv.height=CARD_H; cv.getContext("2d").drawImage(img,0,0);
  return await new Promise(res=>cv.toBlob(res,"image/png")); }
function cardName(id){ return "zeste-"+((RMAP[id]&&RMAP[id].n)||"recette").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+".png"; }
async function shareCard(id){
  let blob; try{ blob=await recCardBlob(id); }catch(e){ blob=null; } if(!blob){ toast("Impossible de créer l’image ici"); return; }
  const name=cardName(id), r=RMAP[id];
  // 1. le partage du téléphone (WhatsApp, Messages, Instagram…) ; annulé par l'utilisateur : on s'arrête là
  try{ const f=new File([blob],name,{type:"image/png"}); if(navigator.canShare&&navigator.canShare({files:[f]})){ await navigator.share({files:[f],title:r.n}); return; } }catch(e){ if(e&&e.name==="AbortError") return; }
  // 2. l'enregistrement de fichier de claude.ai
  try{ const dl=window.claude&&await claude.use("downloads"); if(dl){ await dl.save({filename:name,data:blob}); return; } }catch(e){ if(e&&e.code==="declined") return; }
  // 3. l'image à enregistrer d'un appui long
  const url=URL.createObjectURL(blob);
  openSheet(()=>({title:"Ta carte",body:`<p class="body" style="margin-bottom:var(--z-s2)">Appuie longuement sur l’image pour l’enregistrer ou la partager.</p><div style="padding:0 16px"><img class="card-img" src="${url}" alt="Carte de la recette ${esc(r.n)}" style="width:100%;border-radius:16px"></div>`}));
}
Object.assign(ACT,{ sharecard:d=>{ shareCard(d.id); } });
// le bouton en haut à gauche de la fiche, en miroir de « Fermer » (la barre du bas est déjà pleine)
{ const _rs=recSheet;
  recSheet=function(id){ const ret=_rs(id), sh=SHEETS[SHEETS.length-1]; if(!sh||sh.recId!==id||!sh.render) return ret; const r0=sh.render;
    sh.render=()=>{ const o=r0(); if(!o.left) o.left=`<button class="close-x" data-a="sharecard" data-id="${id}" aria-label="Partager en image">${IC.share.replace("<svg","<svg style='width:16px;height:16px'")}</button>`; return o; };
    paintSheet(sh); return ret; };
}
