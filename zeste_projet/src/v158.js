// ================= ZESTE 1.56 (C) : Paramètres — « Sexe » sur une ligne =================
{ const _ss=settingsSheet;
  settingsSheet=function(){ _ss.apply(this,arguments); const sh=SHEETS[SHEETS.length-1]; if(!sh) return; const r0=sh.render;
    sh.render=()=>{ const o=r0(); o.body=o.body.replace(/(<div class="grow">Sexe<\/div>)(<\/div>)<div class="row set-sub">(<div class="seg[^"]*"[^>]*>[\s\S]*?<\/div>)<\/div>/,(m,a,b,seg)=>a+seg.replace('class="seg','class="seg sex-seg')+b); return o; };
    paintSheet(sh); };
}
