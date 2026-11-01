// ================= 1.62 (C) : affichage du score du Labo =================
// Mots : Déséquilibré < 40, Buvable 40-69, Réussi 70-84, Excellent ≥ 85 (« Proche d'un classique » ne reste que dans « Ça ressemble à »).
labGrade=function(s){ return s>=85?["Excellent","trophy"]:s>=70?["Réussi","medal"]:s>=40?["Buvable","thumbs-up"]:["Déséquilibré","wrench"]; };
const LAB_GOAL_N={bal:"Équilibre",abv:"Force",fill:"Remplissage",ice:"Glace",gar:"Décor (bonus)"};

// ---------- Labo (point 8) : score en direct à la place de « Tout est bon » ; pastilles seulement sous 70 ----------
{ const _vc=vCompose; vCompose=function(){ let h=_vc(); const M=mixState(); if(!M.items.length) return h;
    const A=analyze(); if(!A) return h; const SC=labScore(A);
    let live;
    if(SC.none) live=`<div class="lab-live lab-none">Ajoute un second ingrédient</div>`;
    else { const [w]=labGrade(SC.score), low=SC.goals.filter(g=>g[0]!=="gar"&&g[2]<0.7);
      live=`<div class="lab-live" role="status"><b>${SC.score}</b> · ${esc(w)}</div>`+(low.length?`<div class="lab-goals warn">${low.map(([k,n,v])=>`<button class="goal ${v<0.4?"bad":"mid"}" data-a="labgoal" data-k="${k}"><i>!</i>${esc(n)}</button>`).join("")}</div>`:""); }
    h=h.replace(/<div class="lab-goals[^"]*">[\s\S]*?<\/div>|<div class="lab-allok">[\s\S]*?<\/div>/,"\u0000");
    return h.includes("\u0000")? h.replace("\u0000",live) : h; }; }

// ---------- « Pour aller plus loin » : rien de ce que propose déjà la suggestion du haut ; plus de badge « Toujours là » ----------
{ const _vc=vCompose; vCompose=function(){ let h=_vc();
    const top=new Set(); (h.match(/<div class="tip-r tip-one[\s\S]*?<\/div>/g)||[]).forEach(t=>(t.match(/data-id="([\w]+)"/g)||[]).forEach(x=>top.add(x.slice(9,-1))));
    if(top.size) h=h.replace(/<div class="pair">[\s\S]*?data-a="mixadd1" data-id="([\w]+)"[^>]*>[^<]*<\/button><\/div>/g,(m,id)=>top.has(id)?"":m);
    h=h.replace(/<span class="badge green">Toujours là<\/span>/g,"");
    return h.replace(/<div class="gh">Pour aller plus loin<\/div><div class="group"><\/div>/,""); }; }

// ---------- Écran « Et voilà ton cocktail » (point 7) ----------
// Sous-score en chiffre à la place des coches, barres blanches (orange sous 70, rouge sous 40), chevron et conseil sous 85,
// plus d'icône près de l'anneau ni de phrases « Tous les objectifs… » / « Touche un objectif… ».
{ const _os=openServe; openServe=function(){ const M=mixState(); if(M.items.length){ const A=analyze(); if(A&&labScore(A).none){ toast("Ajoute un second ingrédient"); return; } }
    _os(); if(!SV) return; const el=SV.el, SC=labScore(analyze());
    // contraste ≥ 4,5:1 du texte blanc : plus la couleur du cocktail est claire, plus le fond est assombri
    { const c=(el.style.getPropertyValue("--c")||"#888888").trim(), n=parseInt(c.slice(1),16), ch=v=>{ v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); };
      const L=0.2126*ch(n>>16&255)+0.7152*ch(n>>8&255)+0.0722*ch(n&255); el.style.setProperty("--svdim",String(L>0.55?0.5:L>0.35?0.58:L>0.18?0.68:L>0.08?0.8:0.9)); }
    const e=el.querySelector(".sv-e"); if(e) e.remove(); const hint=el.querySelector(".sv-hint"); if(hint) hint.remove();
    el.querySelectorAll(".sv-goal").forEach((g,i)=>{ const G=SC.goals[i]; if(!G) return; const [k,,v]=G, p=Math.round(v*100);
      g.className="sv-goal "+(v<0.4?"ko":v<0.7?"mid":"ok")+(k==="gar"?" bonus":"");
      const gi=g.querySelector(".sv-gi"); if(gi){ gi.textContent=String(p); gi.classList.add("sv-num-s"); }
      const lab=g.querySelector("b"); if(lab) lab.textContent=LAB_GOAL_N[k]||lab.textContent;
      if(v<0.85){ g.setAttribute("data-a","svgoal"); g.setAttribute("data-k",k); g.setAttribute("role","button"); g.setAttribute("aria-label",(LAB_GOAL_N[k]||k)+" : "+p+" sur 100, voir le conseil");
        if(!g.querySelector(".sv-chev")) g.insertAdjacentHTML("beforeend",`<span class="sv-chev" aria-hidden="true">${IC.chev}</span>`); }
      else { g.removeAttribute("data-a"); g.removeAttribute("data-k"); g.removeAttribute("role"); g.setAttribute("aria-label",(LAB_GOAL_N[k]||k)+" : "+p+" sur 100"); } });
    const sum=el.querySelector(".sv-sum"); if(sum) sum.textContent=labSummary(analyze(),SC); }; }

// ---------- Seuils (point 10), recalés sur la distribution v3 (tests/m9.js, mélanges aléatoires plausibles) ----------
// ≥ 95 : ~25 % des mélanges ; ≥ 97 : ~22 % ; 100 : ~20 % (la rareté est bornée : un mélange plausible sur cinq atteint 100).
Object.assign(CHAL_MIN,{ing:95,mini:95,long:95,light:95,swiss:97,red:97,zero:97,deco:97,bitter:97,strong:97,bubbles:97,mystery:100,five:100,perfect:100});
{ const T=TROPHIES.find(t=>t[0]==="labpro"); if(T){ T[2]="Obtiens 97/100 au labo"; T[3]=97; } }
LAB_FETE=97;
