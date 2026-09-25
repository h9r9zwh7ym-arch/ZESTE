// Mesure hors ligne du niveau de chaque son (crête et intensité RMS en dBFS) : NODE_PATH=$(npm root -g) node tests/sounds.js
const {chromium}=require('playwright'),path=require('path');
const NAMES=["tap","select","toggle","check","uncheck","pop","star","level","remove","clink","ice","pour","shake","stir","slosh","whoosh","sheet","spin","ding","chime","success","fanfare","sparkle","fail","flip","jingle"];
(async()=>{ const b=await chromium.launch(), p=await b.newPage(); const res=[];
  for(const n of NAMES){
    await p.addInitScript(()=>{ window.AudioContext=class extends OfflineAudioContext{ constructor(){ super(2,44100*4,44100); window.__ctx=this; } resume(){ return Promise.resolve(); } get state(){ return "running"; } }; window.webkitAudioContext=window.AudioContext;
      localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{unit:"cl",sound:true,vol:0.7,fx:{splash:false}}})); });
    await p.goto("file://"+path.resolve(__dirname,"..","dist","zeste.html")); await p.waitForTimeout(400);
    const r=await p.evaluate(async n=>{ const f=SND[n]; if(!f) return null; f.call(SND, n==="star"?5:n==="level"?3:undefined); if(!window.__ctx) return null;
      const buf=await __ctx.startRendering(); const d=buf.getChannelData(0); let pk=0,s=0,last=0; for(let i=0;i<d.length;i++){ const a=Math.abs(d[i]); if(a>pk) pk=a; s+=d[i]*d[i]; if(a>0.001) last=i; }
      const dur=last/44100, rms=Math.sqrt(s/Math.max(1,last)); return {n,pk:20*Math.log10(pk||1e-9),rms:20*Math.log10(rms||1e-9),dur}; },n);
    if(r) res.push(r); }
  res.sort((a,b)=>b.rms-a.rms).forEach(r=>console.log(r.n.padEnd(9)+" crête "+r.pk.toFixed(1).padStart(6)+" dB  RMS "+r.rms.toFixed(1).padStart(6)+" dB  durée "+r.dur.toFixed(2)+" s"));
  await b.close(); })();
