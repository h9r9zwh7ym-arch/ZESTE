// ================= 1.27 : accueil du matin (l'étagère a été retirée en 1.42) =================
// (1.42 : l'étagère du bar a été retirée)

// ---------- Accueil du matin : pas de propositions de cocktails ----------
// Le matin n'est pas vraiment l'heure de l'apéro : la carrousel « Aussi pour toi » ne s'affiche pas dans ce cas.
// Le reste (préparation qui périme, mets, etc.) continue de s'afficher normalement.
const _suggestMorning=HOME_SEC.suggest;
HOME_SEC.suggest=(ctx)=>{ if(ctxInfo().moment==="matin") return ""; return _suggestMorning(ctx); };
const _naMorning=HOME_SEC.na;
HOME_SEC.na=(ctx)=>{ if(ctxInfo().moment==="matin") return ""; return _naMorning(ctx); };
