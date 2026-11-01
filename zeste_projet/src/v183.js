// ================= ZESTE 1.79 : les vrais verres =================
// Quatre verres de plus, dessinés comme les autres (contour, liquide découpé, glace, décor) :
//  - Nick & Nora : petit verre à pied en tulipe, pour les cocktails remués servis sans glace (Martinez, Last Word…) ;
//  - julep : timbale en métal givré (opaque : on voit le métal et le dôme de glace pilée, pas le liquide) ;
//  - hurricane : grand verre en tulipe à petit pied (Hurricane, Piña Colada) ;
//  - tiki : chope en céramique sculptée d'un visage (opaque aussi).
// Ils sont proposés au Labo et attribués aux recettes qui y sont servies traditionnellement.
Object.assign(GLASS_SHAPES,{
  nick:{o:"M18 13H46C46.5 27 42 37 32 37C22 37 17.5 27 18 13Z",y:18,stem:[37,69],base:[22,42],rim:[18,46,13],hl:"M21.5 17Q21.5 27 26 33",bot:34},
  julep:{o:"M15 13H49L46.5 70Q46.2 73 43.2 73H20.8Q17.8 73 17.5 70Z",y:17,rim:[15,49,13],hl:"M19.5 18L21.5 67",bot:70,opaque:"metal",ice:{cubes:[[20,24,14,13,-7],[30,40,14,13,9]]}},
  hurricane:{o:"M20 5C17 15 17 25 22 33C25 38 24.5 45 22.5 53C21 60 24 66 29 67H35C40 66 43 60 41.5 53C39.5 45 39 38 42 33C47 25 47 15 44 5Z",y:11,stem:[67,71],base:[23,41],rim:[20,44,5],hl:"M23.5 9Q21 21 25 31",bot:64,ice:{cubes:[[24,15,13,12,-8],[28,30,11,10,10],[26,45,11,10,-4]]}},
  tiki:{o:"M16 9H48L46.5 69Q46.2 74 41.5 74H22.5Q17.8 74 17.5 69Z",y:14,rim:[16,48,9],hl:"M20 14L21.5 66",bot:71,opaque:"tiki",ice:{cubes:[[21,18,14,13,-7],[29,32,14,13,9]]}}
});
Object.assign(GLASS_BOTW,{nick:5,julep:13,hurricane:7,tiki:12});
STEMMED.add("nick"); STEMMED.add("hurricane");
Object.assign(GNAME,{nick:"Nick & Nora",julep:"Julep",hurricane:"Hurricane",tiki:"Tiki"});
Object.assign(GLASSES,{nick:"un verre Nick & Nora",julep:"une timbale à julep",hurricane:"un verre hurricane",tiki:"une chope tiki"});
Object.assign(GNAME_SHORT,{nick:"verre",julep:"timbale",hurricane:"verre",tiki:"chope"});
// Labo : choix et contenances (Nick & Nora 15 cl, julep 35 cl, hurricane 45 cl, tiki 45 cl)
[["nick","Nick & Nora",150],["julep","Julep",350],["hurricane","Hurricane",450],["tiki","Tiki",450]].forEach(x=>{ if(!LGLASS.some(y=>y[0]===x[0])){ LGLASS.push(x); LCAP[x[0]]=x[2]; } });
// Recettes servies traditionnellement dans ces verres
const GLASS_FIX={nick:["martinez","last_word","hanky_panky","bijou","tuxedo"],julep:["mint_julep"],hurricane:["hurricane","pina_colada"],tiki:["zombie","scorpion","painkiller","fog_cutter","navy_grog"]};
function applyGlassFix(){ Object.entries(GLASS_FIX).forEach(([g,ids])=>ids.forEach(id=>{ const r=RMAP[id]; if(r&&r.g!==g){ r.g=g; delete r._m; delete r._sh; } })); GFULL={}; THUMB={}; }
applyGlassFix();
{ const _b=buildRecipes; buildRecipes=function(){ const r=_b.apply(this,arguments); applyGlassFix(); return r; }; }

// Verres opaques : le corps (métal ou céramique) couvre le liquide ; la glace pilée et le décor restent visibles.
{ const _g=glassSVGRaw;
  glassSVGRaw=function(r,opt={}){ let s=_g(r,opt); const sh=GLASS_SHAPES[r&&r.g]; if(!sh||!sh.opaque) return s;
    const k="op"+(++GID), [L,R,Y]=sh.rim;
    let body;
    if(sh.opaque==="metal"){
      body=`<linearGradient id="${k}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9AA3A8"/><stop offset=".35" stop-color="#E9EEF0"/><stop offset=".6" stop-color="#C3CACD"/><stop offset="1" stop-color="#8D969B"/></linearGradient>`
        +`<path d="${sh.o}" fill="url(#${k})"/>`
        // givre
        +[...Array(14)].map((_,i)=>`<circle cx="${(L+3+hrand("jf"+i)*(R-L-6)).toFixed(1)}" cy="${(Y+6+hrand("jy"+i)*(sh.bot-Y-8)).toFixed(1)}" r="${(0.5+hrand("jr"+i)*0.7).toFixed(2)}" fill="#fff" opacity=".7"/>`).join("")
        +`<path d="M${L+1} ${Y+2.5}H${R-1}" stroke="#fff" stroke-opacity=".7" stroke-width="1.6"/>`;
      // dôme de glace pilée au-dessus du bord
      body+=`<path d="M${L+2} ${Y+1}C${L+5} ${Y-6} ${R-5} ${Y-6} ${R-2} ${Y+1}Z" fill="#F4F8FA"/>`+[...Array(7)].map((_,i)=>`<circle cx="${(L+6+i*(R-L-12)/6).toFixed(1)}" cy="${(Y-2.2-Math.sin(i/6*Math.PI)*2.2).toFixed(1)}" r="1.8" fill="#fff" stroke="#DCE6EA" stroke-width=".5"/>`).join("");
    } else {
      body=`<linearGradient id="${k}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5B3A22"/><stop offset=".45" stop-color="#9A6438"/><stop offset="1" stop-color="#4E3019"/></linearGradient>`
        +`<path d="${sh.o}" fill="url(#${k})"/>`
        // visage sculpté : sourcils, yeux, nez, bouche
        +`<path d="M${L+6} 23.5L${L+13.5} 27M${R-6} 23.5L${R-13.5} 27" stroke="#3A2414" stroke-width="2" stroke-linecap="round"/>`
        +`<ellipse cx="${L+10}" cy="31" rx="3.4" ry="2.6" fill="#2E1C10"/><ellipse cx="${R-10}" cy="31" rx="3.4" ry="2.6" fill="#2E1C10"/>`
        +`<path d="M32 33V42Q32 45 29 45M32 45Q35 45 35 42" stroke="#3A2414" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
        +`<rect x="${L+8}" y="51" width="${R-L-16}" height="8" rx="3" fill="#2E1C10"/><path d="M${L+11} 51V59M${L+15.5} 51V59M32 51V59M${R-15.5} 51V59M${R-11} 51V59" stroke="#C99A6A" stroke-width="1.2"/>`
        +`<path d="M${L+1} ${Y+3}H${R-1}M${L+1.5} 66H${R-1.5}" stroke="#C99A6A" stroke-opacity=".6" stroke-width="1.4"/>`;
    }
    // le corps opaque se pose juste avant le contour final (le décor reste devant)
    const at=s.lastIndexOf(`<path d="${sh.o}" fill="none" stroke="var(--glass-stroke)"`);
    return at<0? s : s.slice(0,at)+`<g class="opaque">${body}</g>`+s.slice(at); };
}
