// ================= SONS 2.0 (synthétisés, aucun fichier) =================
const SND=(()=>{
  let ctx=null, out=null, rev=null, noiseBuf=null, unlocked=false;
  const on=()=>S.settings&&S.settings.sound!==false;
  const vol=()=>(S.settings&&S.settings.vol!=null?S.settings.vol:0.7);
  function build(){
    ctx=new (window.AudioContext||window.webkitAudioContext)();
    const comp=ctx.createDynamicsCompressor(); comp.threshold.value=-18; comp.knee.value=12; comp.ratio.value=3; comp.attack.value=0.003; comp.release.value=0.15; comp.connect(ctx.destination);
    out=ctx.createGain(); out.connect(comp);
    rev=ctx.createGain(); rev.gain.value=0.22;
    noiseBuf=ctx.createBuffer(1,Math.floor(ctx.sampleRate*1.2),ctx.sampleRate); const nd=noiseBuf.getChannelData(0); for(let i=0;i<nd.length;i++) nd[i]=Math.random()*2-1;
    // la réverbération est préparée juste après, sans bloquer le geste en cours
    setTimeout(()=>{ try{ const len=Math.floor(ctx.sampleRate*0.9), ir=ctx.createBuffer(2,len,ctx.sampleRate); const a=ir.getChannelData(0), b=ir.getChannelData(1); for(let i=0;i<len;i++){ const e=Math.pow(1-i/len,3.2); a[i]=(Math.random()*2-1)*e; b[i]=(Math.random()*2-1)*e; } const conv=ctx.createConvolver(); conv.buffer=ir; rev.connect(conv); conv.connect(comp); }catch(e){} },60);
  }
  function ac(){ if(!on()) return null; try{ if(!ctx) build(); }catch(e){ return null; } out.gain.value=vol()*0.9; if(ctx.state==="suspended") ctx.resume().catch(()=>{}); return ctx; }
  // iOS ne débloque l'audio qu'à la fin d'un geste : touchend et click, avec un son muet
  function unlock(){ if(unlocked||!on()) return; const c=ac(); if(!c) return; try{ const b=c.createBuffer(1,1,22050), s=c.createBufferSource(); s.buffer=b; s.connect(c.destination); s.start(0); }catch(e){} c.resume().then(()=>{ if(c.state==="running") unlocked=true; }).catch(()=>{}); }
  ["touchend","click","keydown"].forEach(ev=>document.addEventListener(ev,unlock,{capture:true,passive:true}));
  // le contexte audio est créé en tâche de fond après le démarrage (il reste en veille jusqu'au premier geste)
  setTimeout(()=>{ if(on()&&!ctx){ const go=()=>{ try{ build(); out.gain.value=vol()*0.9; }catch(e){} }; (window.requestIdleCallback||setTimeout)(go,{timeout:2000}); } },2600);
  const T=t=>ctx.currentTime+(t||0);
  function osc(type,f,t,dur,v,o={}){ const c=ac(); if(!c) return; const {f2,wet=0,att=0.004}=o; const n=c.createOscillator(), g=c.createGain(); g.gain.value=0.0001; n.type=type; n.frequency.setValueAtTime(f,T(t)); if(f2) n.frequency.exponentialRampToValueAtTime(f2,T(t)+dur*0.9);
    g.gain.setValueAtTime(0.0001,T(t)); g.gain.exponentialRampToValueAtTime(v,T(t)+att); g.gain.exponentialRampToValueAtTime(0.0001,T(t)+dur); n.connect(g); g.connect(out); if(wet){ const w=c.createGain(); w.gain.value=wet; g.connect(w); w.connect(rev); } n.start(T(t)); n.stop(T(t)+dur+0.05); }
  function noise(t,dur,v,o={}){ const c=ac(); if(!c) return; const {type="bandpass",f=1000,q=1,f2,wet=0,att=0.01}=o; const s=c.createBufferSource(); s.buffer=noiseBuf; const fl=c.createBiquadFilter(); fl.type=type; fl.frequency.setValueAtTime(f,T(t)); if(f2) fl.frequency.exponentialRampToValueAtTime(f2,T(t)+dur); fl.Q.value=q; const g=c.createGain(); g.gain.value=0.0001;
    g.gain.setValueAtTime(0.0001,T(t)); g.gain.exponentialRampToValueAtTime(v,T(t)+att); g.gain.exponentialRampToValueAtTime(0.0001,T(t)+dur); s.connect(fl); fl.connect(g); g.connect(out); if(wet){ const w=c.createGain(); w.gain.value=wet; g.connect(w); w.connect(rev); } s.start(T(t),Math.random()*0.8); s.stop(T(t)+dur+0.05); }
  function glass(f,t,v,wet=0.5){ [[1,1,0.9],[2.32,0.45,0.55],[4.25,0.25,0.3],[6.63,0.12,0.18]].forEach(([m,a,d])=>osc("sine",f*m,t,d,v*a,{wet})); }
  function bell(f,t,v,d=1.2,wet=0.6){ osc("sine",f,t,d,v,{wet}); osc("sine",f*2.01,t,d*0.5,v*0.3,{wet}); osc("sine",f*3.02,t,d*0.25,v*0.12,{wet}); }
  let lastDet=-1, lastT=0;
  const api={
    tap(){ osc("sine",1250,0,0.045,0.06,{f2:820,att:0.002}); },
    select(){ osc("sine",880,0,0.06,0.05,{f2:1100,att:0.002}); osc("sine",1320,0.03,0.08,0.03,{wet:0.3}); },
    toggle(onOff){ if(onOff){ osc("sine",660,0,0.07,0.06,{att:0.002}); osc("sine",990,0.055,0.09,0.06,{att:0.002}); } else { osc("sine",880,0,0.07,0.05,{att:0.002}); osc("sine",590,0.055,0.09,0.05,{att:0.002}); } },
    check(){ osc("triangle",1320,0,0.08,0.05,{att:0.002}); osc("sine",1980,0.045,0.14,0.05,{wet:0.3}); },
    uncheck(){ osc("sine",700,0,0.07,0.04,{f2:520,att:0.002}); },
    pop(p=1){ osc("sine",320*p,0,0.08,0.13,{f2:900*p,att:0.002}); osc("sine",1800*p,0.035,0.03,0.03); },
    star(n){ const f=[523,587,659,784,1047][Math.max(0,Math.min(4,n-1))]; bell(f*2,0,0.07,0.5,0.35); if(n>=5) setTimeout(()=>api.sparkle(),120); },
    detent(v){ const step=Math.round(v*20), now=performance.now(); if(step===lastDet||now-lastT<28) return; lastDet=step; lastT=now; osc("sine",480+v*820,0,0.035,0.045,{att:0.001}); },
    level(n){ const f=[330,392,494,587,698][Math.max(0,Math.min(4,n))]; osc("sine",f,0,0.12,0.08,{f2:f*1.15}); noise(0,0.08,0.03,{f:f*3,q:4}); },
    remove(){ osc("sine",420,0,0.12,0.08,{f2:180}); },
    clink(){ glass(2350,0,0.07); glass(3120,0.018,0.05); },
    ice(){ for(let k=0;k<3;k++){ const t=k*0.06+Math.random()*0.025; glass(2600+Math.random()*1800,t,0.035,0.35); noise(t,0.03,0.03,{type:"highpass",f:5000}); } },
    pour(d=0.6){ const c=ac(); if(!c) return; const s=c.createBufferSource(); s.buffer=noiseBuf; const bp=c.createBiquadFilter(); bp.type="bandpass"; bp.Q.value=2.2; bp.frequency.value=800; const lfo=c.createOscillator(), lg=c.createGain(); lfo.frequency.value=7+Math.random()*4; lg.gain.value=320; lfo.connect(lg); lg.connect(bp.frequency);
      const g=c.createGain(); g.gain.value=0.0001; g.gain.setValueAtTime(0.0001,T()); g.gain.exponentialRampToValueAtTime(0.14,T()+0.06); g.gain.setValueAtTime(0.14,T()+d*0.7); g.gain.exponentialRampToValueAtTime(0.0001,T()+d); s.connect(bp); bp.connect(g); g.connect(out); s.start(T(),Math.random()*0.6); s.stop(T()+d+0.05); lfo.start(T()); lfo.stop(T()+d+0.05);
      for(let k=0;k<Math.round(d*9);k++) osc("sine",500+Math.random()*700,k*0.1+Math.random()*0.05,0.05,0.025,{f2:1300+Math.random()*600}); },
    shake(d=1.2){ const n=Math.round(d/0.14); for(let k=0;k<n;k++){ const t=k*0.14, a=k%2?0.7:1; noise(t,0.1,0.16*a,{f:3200,q:1.6,att:0.004}); noise(t,0.06,0.06*a,{type:"highpass",f:6000,att:0.002}); if(k%2===0) glass(2800+Math.random()*1400,t+0.02,0.018,0.1); } },
    stir(d=1.1){ for(let k=0;k<Math.round(d/0.3);k++){ glass(3000+Math.random()*900,k*0.3,0.022,0.3); noise(k*0.3,0.22,0.02,{f:1400,q:3}); } },
    slosh(){ noise(0,0.45,0.1,{type:"lowpass",f:900,q:1.5,f2:260}); },
    whoosh(up=true){ noise(0,0.3,0.045,{f:up?400:2000,f2:up?2200:500,q:0.8,att:0.08}); },
    sheet(){ noise(0,0.22,0.022,{f:600,f2:1800,q:0.7,att:0.05}); osc("sine",520,0.02,0.1,0.018,{f2:760}); },
    spin(){ noise(0,0.018,0.07,{f:2600,q:3,att:0.001}); osc("sine",1500+Math.random()*120,0,0.02,0.02,{att:0.001}); },
    ding(){ bell(1318,0,0.09,1.1); bell(1976,0.07,0.06,1.0); },
    chime(){ [1047,1319,1568,2093].forEach((f,i)=>bell(f,i*0.08,0.07,1.1)); },
    success(){ bell(1175,0,0.08,0.8); bell(1760,0.1,0.08,1.2); api.sparkle(0.15); },
    fanfare(){ [784,988,1175,1568].forEach((f,i)=>{ bell(f,i*0.09,0.08,1.3); osc("triangle",f/2,i*0.09,0.4,0.03); }); [523,659,784].forEach(f=>osc("triangle",f,0.42,1.6,0.035,{wet:0.5})); api.sparkle(0.45); },
    sparkle(t0=0){ for(let k=0;k<9;k++) osc("sine",2600+Math.random()*3200,t0+k*0.045+Math.random()*0.03,0.12,0.018,{wet:0.6,att:0.002}); },
    fail(){ osc("sine",520,0,0.14,0.06,{f2:440}); osc("sine",440,0.12,0.22,0.05,{f2:360}); },
    flip(){ noise(0,0.18,0.05,{f:1200,f2:3000,q:0.9,att:0.02}); osc("sine",700,0.1,0.08,0.03,{f2:1000}); },
    test(){ api.clink(); setTimeout(()=>api.pour(0.5),300); setTimeout(()=>api.chime(),900); },
    jingle(){ if(!ac()) return;
      osc("triangle",560,0,0.09,0.05,{f2:1200}); noise(0.08,0.05,0.5,{f:2300,q:1.4,f2:700,att:0.002}); osc("sine",220,0.08,0.16,0.35,{f2:58});
      for(let k=0;k<36;k++) osc("sine",2400+Math.random()*4800,0.14+Math.pow(Math.random(),1.7)*1.0,0.03,0.012+Math.random()*0.02,{att:0.001,wet:0.3});
      noise(0.12,1.0,0.035,{type:"highpass",f:5600});
      [880,1109,1319,1760].forEach((f,i)=>bell(f,0.98+i*0.075,0.075,1.3,0.7));
      [440,554,659].forEach(f=>osc("triangle",f,1.34,1.8,0.04,{wet:0.5})); },
    jingleSplash(stillOpen){ if(!on()) return; const c=ac(); if(!c) return; if(c.state==="running"){ api.jingle(); return; } c.resume().then(()=>{ if(stillOpen()) api.jingle(); }).catch(()=>{}); }
  };
  return api;
})();
(function(){
  const W=(k,f)=>{ const g=ACT[k]; if(!g) return; ACT[k]=(d,t)=>{ const r=g(d,t); try{ f(d||{},t); }catch(e){} return r; }; };
  ["tab","lt","cmain","cmode2","tf","tsort","bf","as","barview","unit","unit2","setcur","setexplore","settheme","setfxp","homemv","qznav","bmnav","mapzoom","radpreset","radmine","filters","ver","mult","bmmult","mm","mixtype","mixglass","mixglassauto","showall","region","mapreg","lineage","cmode","setmoment","famgo","nafilter"].forEach(k=>W(k,()=>SND.tap()));
  ["setamb","setna","setctx","setsplash","nobasic"].forEach(k=>W(k,()=>SND.toggle(true)));
  W("setfx",(d)=>SND.toggle(FX(d.k))); W("homeon",(d)=>SND.toggle(!!(S.settings.home.find(x=>x[0]===d.k)||[])[1]));
  W("stepck",(d,t)=>t&&t.classList.contains("done")?SND.check():SND.uncheck()); W("bmck",()=>SND.check());
  W("toggle",(d)=>d.id&&has(d.id)?SND.check():SND.remove()); W("addtoggle",(d)=>d.id&&has(d.id)?SND.check():SND.remove()); W("refill",()=>SND.pour(0.45));
  W("lvl",(d)=>SND.level(+(d.n??d.l??d.v??2))); W("setlvl",(d)=>SND.level(+(d.n??d.l??d.v??2)));
  ["rmstock","mixrm","delcustom","delprep","adjreset"].forEach(k=>W(k,()=>SND.remove()));
  W("fav",(d)=>S.fav.includes(d.id)?SND.pop(1.2):SND.remove());
  ["mixgar","dish","city","qzpick","svgoal","labgoal","term","trophy","chal","rlinfo","maprec"].forEach(k=>W(k,()=>SND.pop()));
  ["rate","remind","bmrate"].forEach(k=>W(k,(d)=>SND.star(+d.n||3)));
  W("mixpour",()=>SND.pour(0.55)); W("mixfit",()=>SND.pour(0.4)); W("mixice",(d)=>d.v==="none"?SND.tap():SND.ice()); W("mixfix",()=>SND.pour(0.4)); W("mixadd1",()=>SND.pour(0.4)); W("advdo",()=>SND.pop(1.3));
  W("made",()=>setTimeout(()=>SND.clink(),FX("clink")?520:0)); W("bmfinish",()=>setTimeout(()=>SND.clink(),120)); W("rlgo",()=>SND.clink());
  W("jiggle",()=>SND.clink()); W("flip",()=>SND.flip()); W("mapfs",()=>SND.whoosh()); W("mapclose",()=>SND.whoosh(false)); W("adj",(d)=>SND.detent((+d.v+2)/4));
  const _os=openSheet; openSheet=function(r,o){ const s=_os(r,o); SND.sheet(); return s; };
  const _cf=confetti; confetti=function(x,y,c){ _cf(x,y,c); if(FX("confetti")) SND.sparkle(); };
  const _p=paintRL; paintRL=function(r,spinning){ _p(r,spinning); spinning?SND.spin():SND.ding(); };
  const _st=showTrophy; showTrophy=function(){ const had=TRO_Q.length&&!TRO_SHOW; _st(); if(had&&TRO_SHOW) setTimeout(()=>SND.fanfare(),250); };
  const _rw=rwShow; rwShow=function(i){ _rw(i); SND.whoosh(); };
  const _serve=openServe; openServe=function(){ const m=S.mix.m; _serve(); if(!SV) return;
    if(m==="shake") SND.shake(1.3); else if(m==="stir") SND.stir(1.3);
    const tTool=m==="build"?150:1350; setTimeout(()=>{ if(SV){ SND.pour(0.9); SND.ice(); } },tTool);
    setTimeout(()=>{ if(!SV) return; for(let k=0;k<10;k++) setTimeout(()=>SV&&SND.detent(0.15+k*0.085),k*95); },tTool+1250);
    setTimeout(()=>{ if(!SV) return; document.querySelectorAll(".sv-goal").forEach((g,i)=>setTimeout(()=>SND.pop(1+i*0.08),i*110)); },tTool+2150);
    setTimeout(()=>{ if(!SV) return; SV.score>=85?SND.fanfare():SV.score>=60?SND.chime():SND.ding(); const ch=document.querySelector(".sv-chal"); if(ch) setTimeout(()=>ch.classList.contains("win")?SND.success():SND.fail(),700); },tTool+3000); };
  document.addEventListener("pointerup",()=>{ if(typeof TILT!=="undefined"&&TILT&&TILT.drag&&Math.abs(TILT.a)>8) SND.slosh(); },{capture:true,passive:true});
  document.addEventListener("pointermove",()=>{ if(typeof RADDRAG!=="undefined"&&RADDRAG!=null&&RAD) SND.detent(RAD[RADDRAG]); },{passive:true});
  document.addEventListener("touchmove",()=>{ const p=document.getElementById("pull"); if(!p) return; if(p.classList.contains("armed")&&!p.dataset.snd){ p.dataset.snd=1; SND.select(); } else if(!p.classList.contains("armed")) delete p.dataset.snd; },{passive:true});
  Object.assign(ACT,{ setsound:()=>{ S.settings.sound=S.settings.sound===false; save(); if(S.settings.sound!==false) SND.test(); refreshSheets(); }, soundtest:()=>SND.test(), sndvol:(d)=>{ S.settings.vol=+d.v; save(); SND.clink(); refreshSheets(); } });
})();
