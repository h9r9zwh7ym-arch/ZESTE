// ================= ZESTE 1.50 : Labo (Composer) — débordement en un seul message, retouches (rendu seulement) =================
MORE_OPEN.add("labgar");   // le décor : une seule rangée défilante avec tous les décors, sans « Plus de décors »
const ICE_IC=`<svg class="lu ice-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 8.5 10.5 8M8 11.5V8.5"/></svg>`;
{ const _vc=vCompose;
  vCompose=function(){ let h=_vc(); const over=/class="lab-stage over/.test(h);
    // pas de score : pas de cercle
    h=h.replace(/<span class="lab-score[^"]*"[^>]*><span class="lab-ring"[^>]*>–<\/span><\/span>/,"");
    // légende de la jauge : « 18,4 / 10,4 cl », glaçon si la glace est déduite
    h=h.replace(/<span>([^<]*?) versés sur ([^<]*?) disponibles(, glace déduite)?<\/span>/,(m,a,b,ice)=>`<span class="lab-legend">${a.replace(/\s*cl$/,"")} / ${b}${ice?`<span class="lab-legice" title="Glace déduite">${ICE_IC}</span>`:""}</span>`);
    // pastilles : couleur de la barre, point d'exclamation
    h=h.replace(/<button class="goal ([^"]*)"([^>]*)><i>[^<]*<\/i>/g,(m,c,at)=>`<button class="goal ${over?"bad":"mid"}"${at}><i>!</i>`);
    // un seul message pour le débordement : la carte « Ça déborde ! » ; pas de lien en double dans l'en-tête
    if(/class="tip-r tip-one bad"/.test(h)) h=h.replace(/<button class="more" data-a="mixfit">[^<]*<\/button>/,"");
    // steppers : unité longue abrégée
    h=h.replace(/(<div class="stepper">[\s\S]*?<span>)([^<]*)(<\/span>)/g,(m,a,t,b)=>a+t.replace("c. à café","c. café").replace("c. à soupe","c. soupe")+b);
    return h; };
}
// le toast « Avec cette glace, ça déborde un peu » est supprimé : la barre rouge, les pastilles et la carte suffisent
{ const _mi=ACT.mixice;
  ACT.mixice=function(){ const t=toast; toast=function(m){ if(/déborde/.test(String(m))) return; return t.apply(this,arguments); };
    try{ return _mi.apply(this,arguments); } finally { toast=t; } }; }
// les autres messages du Labo s'affichent au-dessus de la barre Servir, jamais dessus
function liftToast(){ const b=TAB==="labo"&&document.querySelector('#v-labo .lab-servebar'); document.body.style.setProperty("--serve-h",b?(b.querySelector('.lab-serve').offsetHeight+16)+"px":"0px"); document.body.classList.toggle("lab-serving",!!b); }
{ const _rv=renderView; renderView=function(){ const r=_rv.apply(this,arguments); liftToast(); return r; }; }
{ const _sw=switchTab; switchTab=function(){ const r=_sw.apply(this,arguments); liftToast(); return r; }; }
