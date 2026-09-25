// Charge les données de recettes et d'ingrédients depuis le bundle index.html.
const fs=require('fs'),vm=require('vm'),path=require('path');
function load(file){
  const html=fs.readFileSync(file||path.join(__dirname,'..','index.html'),'utf8');
  const js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
  const a=js.indexOf('const ING_RAW'),b=js.indexOf('ING_RAW.forEach(');
  const ctx={};vm.createContext(ctx);
  vm.runInContext(js.slice(a,b)+'\n;this.ING_RAW=ING_RAW;this.REC_RAW=REC_RAW;',ctx);
  return {ING_RAW:ctx.ING_RAW,REC_RAW:ctx.REC_RAW,html,js};
}
module.exports=load;
if(require.main===module){const d=load();console.log(d.ING_RAW.length,'ingrédients,',d.REC_RAW.length,'recettes');}
