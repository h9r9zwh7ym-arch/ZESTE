// ================= ZESTE 1.51 : Profil — l'engrenage du haut suffit (rendu seulement) =================
{ const _vp=vProfil;
  vProfil=function(){ return _vp().replace(/<div class="sp24"><\/div><div class="group"><button class="row tap" data-a="settings"[\s\S]*?<\/button><\/div>/,""); }; }
