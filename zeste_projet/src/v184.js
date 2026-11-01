// ================= ZESTE 1.80 : ambiance « bar tamisé » le soir =================
// Réglage Paramètres > Apparence > « Ambiance bar le soir » (coupé par défaut) : de 19 h à 6 h, l'app passe dans une
// palette sombre et chaude (bois, ambre, laiton) quel que soit le thème choisi ; le reste du temps, le thème habituel.
// La palette est définie dans style.css (:root[data-warm], posé avec data-theme="dark") ; contraste vérifié par tests/features/warm_test.js.
function warmNow(d){ const h=(d||new Date()).getHours(); return h>=19||h<6; }
function warmOn(){ return !!(S&&S.settings&&S.settings.warm)&&warmNow(); }
{ const _a=applyTheme;
  applyTheme=function(){ const r=_a.apply(this,arguments); const el=document.documentElement;
    // variante du thème sombre : toutes les règles « sombre » s'appliquent, puis la palette chaude (data-warm) par-dessus
    if(warmOn()){ el.dataset.theme="dark"; el.dataset.warm="1"; } else if(el.dataset.warm){ delete el.dataset.warm; _a.apply(this,arguments); }
    const m=document.querySelectorAll('meta[name="theme-color"]'); m.forEach(x=>{ if(!x.dataset.orig) x.dataset.orig=x.content; x.content=warmOn()? "#17110C" : x.dataset.orig; });
    return r; };
}
// bascule à l'heure dite sans relancer l'app
setInterval(()=>{ try{ const want=warmOn(), is=!!document.documentElement.dataset.warm; if(want!==is) applyTheme(); }catch(e){} },60000);
{ const g=SET_GROUPS.look, _b=g[2];
  g[2]=()=>{ const h=_b(); const row=srow("theme","Ambiance bar le soir (19 h – 6 h)",sw(!!S.settings.warm,"setwarm","Ambiance bar le soir, de 19 h à 6 h")); // (règle 1.42 : pas de texte explicatif dans les réglages)
    const k=h.indexOf('</div>',h.indexOf('data-k="theme"')); const end=k<0?-1:h.indexOf('</div>',k+6);
    return end<0? h+row : h.slice(0,end+6)+row+h.slice(end+6); };
}
Object.assign(ACT,{ setwarm:()=>{ S.settings.warm=!S.settings.warm; applyTheme(); changed(); } });
// (ui_final.js appelle applyTheme() au démarrage, après ce module)
