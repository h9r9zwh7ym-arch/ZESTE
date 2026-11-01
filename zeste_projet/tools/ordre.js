// Ordre de chargement des sources (1.84) : src/ORDRE, un chemin par ligne relatif à src/, « # » pour les commentaires.
// Utilisé par build.sh (via grep) et par les outils et tests qui lisent les sources dans l'ordre.
const fs=require('fs'), path=require('path');
module.exports=function(root){ const p=path.join(root||path.join(__dirname,'..'),'src','ORDRE');
  return fs.readFileSync(p,'utf8').split('\n').map(l=>l.replace(/#.*/,'').trim()).filter(Boolean); };
