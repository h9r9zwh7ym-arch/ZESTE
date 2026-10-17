// ================= ZESTE 1.58 : décisions de l'audit 1.57 =================
// « Ta version » : les − et + aux extrémités de chaque piste deviennent de vrais boutons 44×44 (action adj existante, ±1, bornes -2…2)
{ const _rp=recPolish; recPolish=function(o){ o=_rp(o);
    o.body=o.body.replace(/<div class="adj-dots">([\s\S]*?)<\/div>/g,(m,inner)=>{
      const on=inner.match(/<button class="on[^"]*" data-a="adj" data-id="([^"]+)" data-k="(\w)" data-v="(-?\d)" aria-label="([^"]*?) -?\d"/); if(!on) return m;
      const [,id,k,v0,n]=on, v=+v0, step=(d,sym,lab)=>{ const t=v+d, off=t<-2||t>2; return `<button class="adj-step" data-a="adj" data-id="${id}" data-k="${k}" data-v="${t}" aria-label="${n} : ${lab}"${off?" disabled":""}>${sym}</button>`; };
      inner=inner.replace(/<span class="adj-end" aria-hidden="true">[−+]<\/span>/g,"");
      return `<div class="adj-dots">${step(-1,IC.minus,"moins")}<div class="adj-track">${inner}</div>${step(1,IC.plus,"plus")}</div>`; });
    return o; }; }
// Pictos de l'étagère du Labo : même teinte de famille, assombrie (clair) ou éclaircie (sombre) jusqu'à 3,2:1 contre le fond de la tuile
function picLum(h){ const n=parseInt(h.slice(1),16), f=v=>{ v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4); }; return .2126*f(n>>16&255)+.7152*f(n>>8&255)+.0722*f(n&255); }
function picCol(hex,bg,toward){ if(!/^#[0-9a-f]{6}$/i.test(hex||"")) return hex; const lb=picLum(bg); let c=hex;
  for(let t=0;t<=1;t+=.04){ c=t?mix(hex,toward,t):hex; const l=picLum(c); if((Math.max(l,lb)+.05)/(Math.min(l,lb)+.05)>=3.2) break; } return c; }
// Labo : plus de pastille de dose sur les tuiles (la dose est déjà dans « Les ingrédients ») ; la sélection reste la bordure d'accent
{ const _vc=vCompose; vCompose=function(){ return _vc().replace(/<span class="sh-q">[^<]*<\/span>/g,""); }; }
