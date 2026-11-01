// ================= ZESTE 1.77 : accueil plus court =================
// « Sans alcool », « Le saviez-vous ? » et « De saison » se suivaient en trois blocs. Ils sont réunis en un seul bloc
// « À découvrir » avec trois onglets : un seul contenu à la fois, l'accueil raccourcit d'autant.
// Chaque section garde son interrupteur et sa place dans « Personnaliser l'accueil » : le bloc se pose à la place de la
// première des trois qui est activée, et ne montre que les onglets activés et non vides (le matin, pas de « Sans alcool »).
const HOME_MIX=[["na","Sans alcool"],["disc","Le saviez-vous"],["season","De saison"]];
const HOME_MIX_RAW={}; HOME_MIX.forEach(([k])=>HOME_MIX_RAW[k]=HOME_SEC[k]);
function homeMix(ctx){
  const on=new Set((S.settings.home||[]).filter(([k,v])=>v).map(([k])=>k));
  const parts=HOME_MIX.filter(([k])=>on.has(k)&&HOME_MIX_RAW[k]).map(([k,n])=>{ let h=""; try{ h=HOME_MIX_RAW[k](ctx)||""; }catch(e){ h=""; } return [k,n,h]; }).filter(x=>x[2]);
  if(!parts.length) return "";
  let cur=S.settings.homeTab; if(!parts.some(x=>x[0]===cur)) cur=parts[0][0];
  const [k,,h0]=parts.find(x=>x[0]===cur);
  // le titre de la section devient l'onglet ; son bouton « Tout voir » éventuel passe dans l'en-tête du bloc
  const hm=h0.match(/^\s*<h2 class="sh">[\s\S]*?<\/h2>/), more=hm&&(hm[0].match(/<button class="more"[\s\S]*?<\/button>/)||[])[0];
  const body=hm? h0.slice(hm[0].length) : h0;
  const tabs=parts.length>1? `<div class="seg home-seg" role="tablist">${parts.map(([kk,n])=>`<button class="${kk===k?"on":""}" role="tab" aria-selected="${kk===k}" data-a="hometab" data-k="${kk}">${n}</button>`).join("")}</div>` : "";
  return `<div class="home-mix" data-k="${k}"><h2 class="sh">${parts.length>1?"À découvrir":esc(parts[0][1])}${more||""}</h2>${tabs}<div class="home-mix-b">${body}</div></div>`;
}
HOME_MIX.forEach(([k])=>{ HOME_SEC[k]=(ctx)=>{ const first=(S.settings.home||[]).find(([kk,v])=>v&&HOME_MIX.some(m=>m[0]===kk)); return first&&first[0]===k? homeMix(ctx) : ""; }; });
Object.assign(ACT,{ hometab:d=>{ S.settings.homeTab=d.k; save(); dirty.today=1; renderView("today");
  const b=document.querySelector("#v-today .home-mix-b"); if(b&&typeof FX==="function"&&FX("reveal")&&b.animate) b.animate([{opacity:0,transform:"translateY(6px)"},{opacity:1,transform:"none"}],{duration:220,easing:"ease-out"}); } });
