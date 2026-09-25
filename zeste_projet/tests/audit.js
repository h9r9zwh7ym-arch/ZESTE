const fs=require('fs');const h=fs.readFileSync('dist/zeste.html','utf8');let js=h.split('<script>')[1].split('</script>')[0];
global.document={querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},appendChild(){}}),getElementById:()=>null,body:{appendChild(){},prepend(){},classList:{add(){},remove(){},toggle(){}}},documentElement:{dataset:{}}};
global.localStorage={getItem:()=>null,setItem(){}};global.window={addEventListener(){}};global.matchMedia=()=>({matches:false,addEventListener(){}});global.setInterval=()=>0;global.setTimeout=()=>0;global.requestAnimationFrame=()=>0;global.requestAnimationFrame=f=>0;
js=js.replace(/\ninit\(\);[\s\S]*$/,"\n");
eval(js+`
REC_RAW.forEach(r=>{ if(r[9]&&r[9].n){ r[9].tip=r[9].n; delete r[9].n; } }); buildRecipes([]);
const out=[];
RECS.forEach(r=>{
 if(r.c&&!r.h) out.push('classique sans histoire: '+r.id);
 if(!r.c&&!r.cr&&!r.h&&!r.v.length) out.push('orphelin: '+r.id);
 if(/^Aucune,/.test(r.gar)) out.push('garniture: '+r.id);
 if(r.gar && !/[a-zà-ÿ’)]$/i.test(r.gar)) out.push('gar ponct: '+r.id+' '+r.gar);
 if(["coupe","martini","flute"].includes(r.g) && r.ice!=="none") out.push('glace+coupe: '+r.id);
 if(r.m==="stir" && r.ing.some(i=>ING[i.id].cat==="jus"&&!ING[i.id].basic)) out.push('stir avec jus: '+r.id);
 if(r.m==="stir" && r.ing.some(i=>["citron","citron_vert","blanc_oeuf","creme"].includes(i.id))) out.push('stir avec agrume/oeuf: '+r.id);
 if((r.m==="shake"||r.m==="mshake") && r.ing.every(i=>!ING[i.id].ac&&!["blanc_oeuf","creme","oeuf","lait","espresso","ananas"].includes(i.id)) && r.fam!=="stirred") out.push('shake sans raison: '+r.id);
 if(r.h&&r.h.length>330) out.push('histoire longue: '+r.id+' '+r.h.length);
 const m=metricsR(r); if(m.abv<0.5 && !/Sans alcool/.test(r.tip||"")) out.push('sans alcool non signalé: '+r.id);
 if(m.vol>330) out.push('volume énorme: '+r.id+' '+Math.round(m.vol));
 if(m.vol<35 && r.fam!=="shot") out.push('volume minuscule: '+r.id+' '+Math.round(m.vol));
});
console.log(out.join('\\n'));
`);
