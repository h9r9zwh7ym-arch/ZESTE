// Compare les recettes de Zeste aux recettes officielles de l'IBA (data/iba.json).
// usage : node tests/ibacmp.js [-v]   → écrit data/ibareport.json
const fs=require('fs'),path=require('path');
const d=require('./load.js')(),iba=require('../data/iba.json').cocktails,man=require('../data/ibapairs.json');
const norm=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const key=s=>norm(s).replace(/[^a-z0-9]/g,'');
const RM={},byN={};d.REC_RAW.forEach(r=>{RM[r[0]]=r;byN[key(r[1])]=byN[key(r[1])]||r[0];byN[key(r[0])]=byN[key(r[0])]||r[0];});
// Ingrédients IBA → ingrédients Zeste (le premier motif qui correspond l'emporte ; ordre du plus précis au plus général)
const MAP=[
 [/donn/, 'DONN'],[/sugar cane juice/,'jus_canne'],[/vanilla sugar/,'sucre_vanille'],[/vanilla extract/,'vanille'],[/vanilla vodka|vodka vanilla/,'vodka_vanille'],
 [/passion fruit liqueur/,'passoa'],[/passion fruit puree/,'passion_puree'],[/passion fruit syrup/,'sirop_passion'],
 [/egg yolk/,'jaune_oeuf'],[/egg white/,'blanc_oeuf'],[/orange flower/,'fleur_oranger'],[/coconut cream/,'creme_coco'],[/cream/,'creme'],
 [/ginger beer/,'ginger_beer'],[/ginger ale/,'ginger_ale'],[/old tom/,'old_tom'],[/\bgin\b/,'gin'],[/vodka|smirnoff/,'vodka'],
 [/agricole/,'rhum_agricole'],[/jamaica|goslings|blackstrap|demerara rum/,'RUMDARK'],[/martinique molasses|aged rum|gold puerto|blended aged/,'rhum_ambre'],[/ron profundo|ron smoky/,'rhum_ambre'],
 [/white rum|white cuban|cuban rum|aguardiente|^rum$|^\d+ ml rum/,'rhum_blanc'],[/cachac/,'cachaca'],
 [/mezcal/,'mezcal'],[/tequila/,'tequila'],[/lagavulin|islay/,'islay'],[/scotch/,'scotch'],[/irish whiskey/,'irish'],[/rye whiskey|bourbon/,'WHISKY'],
 [/cognac|brandy luxardo/,'X'],[/pisco/,'pisco'],[/calvados/,'calvados'],[/grappa/,'grappa'],[/absinthe|pernod/,'absinthe'],
 [/cherry brandy|cherry sangue/,'cerise'],[/apricot brandy/,'abricot'],[/peach brandy|peach schnapps/,'peche'],[/^.*brandy$/,'cognac'],
 [/grand marnier/,'grand_marnier'],[/cointreau|triple sec|curacao/,'triple_sec'],[/maraschino/,'maraschino'],[/yellow chartreuse/,'chartreuse_jaune'],[/chartreuse/,'chartreuse'],
 [/benedictine/,'benedictine'],[/amaretto/,'amaretto'],[/frangelico/,'frangelico'],[/kahlua|coffee liqueur/,'kahlua'],[/cassis/,'cassis'],[/creme de mure/,'creme_mure'],
 [/cacao/,'creme_cacao'],[/menthe/,'creme_menthe'],[/violette/,'violette'],[/drambuie/,'drambuie'],[/falernum/,'falernum'],[/allspice/,'allspice'],[/raspberry liqueur/,'framboise_liq'],
 [/campari/,'campari'],[/aperol/,'aperol'],[/fernet/,'fernet'],[/nonino/,'amaro'],[/cynar/,'cynar'],
 [/dry vermouth/,'vermouth_dry'],[/vermouth/,'vermouth_rouge'],[/lillet/,'lillet'],[/champagne or prosecco/,'BULLES'],[/prosecco/,'prosecco'],[/champagne|sparkling wine/,'champagne'],[/white wine/,'vin_blanc'],[/red wine/,'vin_rouge'],
 [/port wine/,'porto'],[/sherry|palo cortado/,'sherry'],
 [/angostura|aromatic bitters/,'angostura'],[/orange bitters/,'orange_bitters'],[/peychaud/,'peychaud'],
 [/honey syrup|honey mix|raw honey/,'HONEY'],[/grenadine/,'grenadine'],[/orgeat/,'orgeat'],[/raspberry syrup/,'sirop_framboise'],[/agave/,'sirop_agave'],[/elderflower/,'sirop_sureau'],
 [/chamomile/,'cordial_camomille'],[/demerara sugar syrup|sugar syrup|simple syrup/,'sirop_sucre'],[/sugar cube/,'sucre'],[/sugar/,'SUGAR'],
 [/pink grapefruit soda/,'soda_pamplemousse'],[/grapefruit/,'pamplemousse'],[/lime wedges|lime cut/,'citron_vert_fr'],[/lime/,'citron_vert'],[/lemon wheel/,'citron_fr'],[/orange wheel/,'orange_fr'],[/lemon/,'citron'],
 [/orange juice/,'orange'],[/pineapple chunk/,'ananas_fr'],[/pineapple/,'ananas'],[/cranberry/,'canneberge'],[/tomato/,'tomate'],[/peach puree/,'peche_puree'],
 [/espresso/,'espresso'],[/coffee/,'cafe'],[/ginger beer/,'ginger_beer'],[/ginger ale/,'ginger_ale'],[/gengibre|fresh ginger/,'gingembre'],[/cola/,'cola'],[/soda water/,'eau_gazeuse'],[/water/,'eau'],
 [/mint/,'menthe'],[/basil/,'basilic'],[/worcestershire/,'worcestershire'],[/tabasco/,'tabasco'],[/salt/,'sel'],[/cloves/,'clou_girofle'],[/chili/,'piment'],
];
// Écarts assumés et expliqués dans la fiche (note n ou garniture)
const EXC={
 'Pisco Sour':['en trop dans Zeste : angostura'],            // l’amargo de l’IBA est en garniture : Zeste le verse en surface
 'Porn Star Martini':['manque dans Zeste : 50 ml Champagne to serve on the side'], // servi à côté : indiqué dans la garniture
};
// Équivalences d'ingrédients acceptées (IBA → Zeste), toutes expliquées dans la note de la recette
const ALT={RUMDARK:['rhum_jam','rhum_brun'],WHISKY:['bourbon','rye'],X:['cognac','cerise'],HONEY:['sirop_miel','miel'],SUGAR:['sucre_poudre','sucre','sucre_vanille'],DONN:['pamplemousse','sirop_cannelle'],BULLES:['champagne','prosecco']};
function ingOf(s){const t=norm(s);for(const [re,id] of MAP) if(re.test(t)) return id; return null;}
function mlOf(s){const t=norm(s),m=t.match(/^([\d.]+)\s*ml/);if(m)return +m[1];const tb=t.match(/^(\d+) tablespoons?/);return tb?15*tb[1]:null;}
const U={d:'trait',f:'feuille',u:'unité',bs:'c. à café',br:'brin',gt:'goutte'};
const out=[];let ok=0;const verbose=process.argv.includes('-v');
for(const c of iba){
  const id=man[c.title]||byN[key(c.title)], r=RM[id];
  if(!r){out.push({iba:c.title,statut:'absent'});continue;}
  const pb=[];const zi=r[7].map(([i,q,u,ro])=>({i,q,u:u||'ml',ro:ro||''}));
  // Les ingrédients IBA peuvent être sur une même ligne (« Tabasco, Celery Salt, Pepper ») : on ne garde que le premier motif
  const lines=c.ingredients.flatMap(s=>s.split(/(?<=Elizabeth)(?=\d)/));
  const used=new Set(), tot={}, cnt={};
  for(const s of lines){const m=ingOf(s),ml=mlOf(s);if(m&&ml!=null){tot[m]=(tot[m]||0)+ml;cnt[m]=(cnt[m]||0)+1;}}
  for(const s of lines){const m=ingOf(s);if(!m){pb.push('ingrédient IBA non reconnu : '+s);continue;}
    const cand=ALT[m]||[m];const z=zi.filter(x=>cand.includes(x.i));
    if(!z.length){ if(/optional|to taste|garnish/i.test(s)&&!/egg white/i.test(s)) continue; pb.push('manque dans Zeste : '+s);continue;}
    z.forEach(x=>used.add(x.i));
    if(m==='DONN'||z.length>1) continue;
    const ml=mlOf(s),x=z[0];
    if(ml!=null&&x.u==='ml'&&x.ro!=='rinse'&&!/top|fill/i.test(s)){ const want=cnt[m]>1?tot[m]:ml; if(Math.abs(want-x.q)>0.01&&!pb.includes(`dose ${x.i} : IBA ${want} ml, Zeste ${x.q} ml`)) pb.push(`dose ${x.i} : IBA ${want} ml, Zeste ${x.q} ml`); }
    if(/optional/i.test(s)&&x.ro!=='opt') pb.push('facultatif dans l’IBA : '+s);
    if(!/optional/i.test(s)&&x.ro==='opt') pb.push('facultatif dans Zeste mais pas dans l’IBA : '+s);
  }
  zi.forEach(x=>{ if(!used.has(x.i)&&x.ro!=='opt') pb.push('en trop dans Zeste : '+x.i); });
  const meth=norm(c.method);
  const GL=[['highball',/tiki glass|hurricane|highball|tall|collins|large glass/],['flute',/flute|champagne glass/],['vin',/goblet|copo|coppa|wine glass/],
   ['rocks',/old fashioned|old-fashioned|rock|tumbler|julep|terracotta|clay/],['mug',/mule cup|mug/],['tasse',/irish coffee glass/],['coupe',/martini|cocktail glass|coupe/]];
  const gl=GL.filter(([g,re])=>re.test(meth)).map(([g])=>g), gz=r[4]==='martini'?'coupe':r[4];
  if(gl.length&&!gl.includes(gz)) pb.push(`verre : IBA ${gl.join(' ou ')}, Zeste ${r[4]}`);
  if(!c.method.trim()) {}
  // méthode : mixeur → shake (avec étapes propres), verre à mélange → stir, directement dans le verre → build
  const mIBA=/blend/.test(meth)?['shake']:/shak|shake/.test(meth)?['shake','mshake']:/mixing glass/.test(meth)?['stir']:
   /directly|build|into .*glass|in .*glass|glass filled|pour|combine|mix|place|muddle/.test(meth)?['build','mbuild','hot']:null;
  if(verbose) console.log(c.title.padEnd(24),(mIBA||["?"]).join("/").padEnd(18),r[3].padEnd(7),(gl.join("/")||"?").padEnd(14),r[4]);
  if(mIBA&&!mIBA.includes(r[3])) pb.push(`méthode : IBA ${mIBA[0]}, Zeste ${r[3]}`);
  (EXC[c.title]||[]).forEach(e=>{const k=pb.indexOf(e);if(k>=0)pb.splice(k,1);});
  out.push({iba:c.title,zeste:id,statut:pb.length?'à examiner':'conforme',ecarts:pb,url:c.url});
  if(!pb.length) ok++;
}
fs.writeFileSync(path.join(__dirname,'..','data','ibareport.json'),JSON.stringify(out,null,1));
const bad=out.filter(o=>o.statut==='à examiner'),abs=out.filter(o=>o.statut==='absent');
console.log(`${out.length-abs.length} cocktails comparés, ${ok} conformes, ${bad.length} à examiner, ${abs.length} absents`);
bad.forEach(o=>console.log('• '+o.iba+' ('+o.zeste+')\n   '+o.ecarts.join('\n   ')));
abs.forEach(o=>console.log('• ABSENT : '+o.iba));
