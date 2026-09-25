// Test dans WebKit (moteur de Safari), via WebKitGTK et WebDriver, sans dépendance.
// Prérequis (Ubuntu) : apt-get install webkit2gtk-driver xvfb
// usage : node tests/webkit.js [dossier-captures]
const {spawn}=require('child_process'),fs=require('fs'),path=require('path');
const PORT=4445, B='http://127.0.0.1:'+PORT, sleep=ms=>new Promise(r=>setTimeout(r,ms));
const MB=['/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1/MiniBrowser','/usr/lib/x86_64-linux-gnu/webkit2gtk-4.0/MiniBrowser'].find(f=>fs.existsSync(f));
async function req(m,p,body){const r=await fetch(B+p,{method:m,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const j=await r.json();if(j.value&&j.value.error)throw Error(j.value.error+': '+j.value.message);return j.value;}
(async()=>{
  const out=process.argv[2];
  const env=Object.assign({},process.env);let xv=null;
  if(!env.DISPLAY){env.DISPLAY=':98';xv=spawn('Xvfb',[':98','-screen','0','1280x1024x24'],{stdio:'ignore'});await sleep(800);}
  const wd=spawn('WebKitWebDriver',['--port='+PORT],{env,stdio:'ignore'});await sleep(800);
  let sid;
  try{
    sid=(await req('POST','/session',{capabilities:{alwaysMatch:{browserName:'MiniBrowser','webkitgtk:browserOptions':{binary:MB,args:['--automation']}}}})).sessionId;
    const S='/session/'+sid;
    await req('POST',S+'/window/rect',{width:390,height:844});
    const js=(f,...a)=>req('POST',S+'/execute/sync',{script:'return ('+f+').apply(null,arguments)',args:a});
    const url='file://'+path.resolve(__dirname,'..','dist','zeste.html');
    await req('POST',S+'/url',{url});
    await js(function(){window.__err=[];window.addEventListener('error',e=>__err.push(e.message));window.addEventListener('unhandledrejection',e=>__err.push('promesse : '+e.reason));});
    await sleep(3500);
    console.log(await js(function(){return navigator.userAgent;}));
    const bad=await js(function(){const bad=[];try{QZ=null;closeOverlay();S.quizSkip=1;}catch(e){}
      for(const r of RECS){try{buildSteps(r);glassSVG(r,{pour:1});recSheet(r.id);const sh=SHEETS[SHEETS.length-1];const t=sh.el.innerText;if(/NaN|undefined|\[object/.test(t))bad.push(r.id+' : texte');SHEETS.pop().el.remove();}catch(e){bad.push(r.id+' : '+e.message);}}
      document.querySelectorAll('#sheets .backdrop').forEach(x=>x.remove());document.body.classList.remove('sheet-open');
      for(const t of ['today','cocktails','bar','labo','profil']){try{switchTab(t);}catch(e){bad.push('onglet '+t+' : '+e.message);}}
      return bad.concat(window.__err);});
    if(out){fs.mkdirSync(out,{recursive:true});
      for(const t of ['today','cocktails','bar','labo','profil']){await js(function(t){closeAll&&closeAll();switchTab(t);},t);await sleep(900);
        fs.writeFileSync(path.join(out,'wk_'+t+'.png'),Buffer.from(await req('GET',S+'/screenshot'),'base64'));}
      await js(function(){recSheet("negroni");});await sleep(3500);
      fs.writeFileSync(path.join(out,'wk_fiche.png'),Buffer.from(await req('GET',S+'/screenshot'),'base64'));}
    console.log(bad.length?bad.join('\n'):'WebKit : toutes les fiches et tous les onglets s’affichent sans erreur.');
    process.exitCode=bad.length?1:0;
  }catch(e){console.log('Échec WebKit : '+e.message);process.exitCode=2;}
  finally{if(sid)await req('DELETE','/session/'+sid).catch(()=>{});wd.kill();if(xv)xv.kill();}
})();
