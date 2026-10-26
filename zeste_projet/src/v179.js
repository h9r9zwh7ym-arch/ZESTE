// ================= ZESTE 1.75 : liquide vivant, mini-verre du Labo, morphing du verre =================
// Une seule boucle d'animation (PHYS) pour tout ce qui bouge par la physique ; elle s'arrête quand tout est au repos.
// Coupée par « Réduire les animations » et par le réglage « Liquide vivant » (FX("live")).
//  1. Surface vivante : sur les verres « live » (accueil, fiche, Labo), une onde amortie sur 16 points remplace la surface
//     plane quand on incline le verre, quand on verse au Labo, et à « Secouer et servir » ; au repos, le dessin d'origine revient.
//  2. Mini-verre au Labo : quand le grand verre sort de l'écran, un petit verre (niveau, couleur, glace en direct) reste en
//     haut à droite ; un toucher remonte au grand verre.
//  3. Morphing : au changement de verre au Labo, la silhouette passe d'une forme à l'autre (ressort amorti).
const PHYS={items:new Set(),raf:0,last:0,frames:0,ms:0};
function physOn(){ return typeof FX==="function"&&FX("live"); }
function physAdd(it){ PHYS.items.add(it); if(!PHYS.raf){ PHYS.last=performance.now(); PHYS.raf=requestAnimationFrame(physTick); } }
function physTick(t){ const t0=performance.now(), dt=Math.min(0.034,Math.max(0.001,(t-PHYS.last)/1000)); PHYS.last=t;
  for(const it of [...PHYS.items]){ let alive=false; try{ alive=it.step(dt); }catch(e){ alive=false; } if(!alive){ try{ it.end&&it.end(); }catch(e){} PHYS.items.delete(it); } }
  PHYS.frames++; PHYS.ms+=performance.now()-t0;
  PHYS.raf=PHYS.items.size? requestAnimationFrame(physTick) : 0; }

// ---------- 1. Surface vivante ----------
const WAVE_N=16;
function surfOf(svg){ if(!svg) return null; if(svg._surf) return svg._surf;
  const liq=svg.querySelector(".liq"), main=liq&&liq.querySelector('rect[height="110"]'); if(!main) return null;
  // couches flottantes (rects ajoutés au-dessus du liquide principal) : la surface reste plane, on garde l'ancienne animation
  if(liq.querySelectorAll('rect').length>3) return null;
  const y=+main.getAttribute("y"), vb=svg.viewBox.baseVal, ns="http://www.w3.org/2000/svg";
  const fid=(main.getAttribute("fill").match(/#([^)]+)\)/)||[])[1], st=fid&&svg.querySelector('[id="'+fid+'"] stop'), fill=st?st.getAttribute("stop-color"):main.getAttribute("fill"), A=2.6;
  const body=document.createElementNS(ns,"path"); body.setAttribute("fill",fill); body.setAttribute("opacity",main.getAttribute("opacity")||"1"); body.setAttribute("class","surf");
  const line=document.createElementNS(ns,"path"); line.setAttribute("fill","none"); line.setAttribute("stroke","#fff"); line.setAttribute("stroke-opacity",".6"); line.setAttribute("stroke-width","1.3"); line.setAttribute("class","surf-l");
  const S0={svg,liq,main,y,A,body,line,h:new Float32Array(WAVE_N),v:new Float32Array(WAVE_N),x0:-8,x1:(vb&&vb.width||64)+8,on:false,
    setup(){ if(this.on) return; this.on=true; this.main.setAttribute("y",this.y+this.A); this.main.after(this.body); this.body.after(this.line); this.svg.classList.add("phys"); },
    teardown(){ if(!this.on) return; this.on=false; this.main.setAttribute("y",this.y); this.body.remove(); this.line.remove(); this.svg.classList.remove("phys"); this.h.fill(0); this.v.fill(0); },
    draw(){ const n=WAVE_N, dx=(this.x1-this.x0)/(n-1), P=[]; for(let i=0;i<n;i++) P.push([this.x0+i*dx, this.y+Math.max(-this.A*2.2,Math.min(this.A*2.2,this.h[i]))]);
      let d=`M-40 ${P[0][1].toFixed(2)}L${P[0][0].toFixed(2)} ${P[0][1].toFixed(2)}`;
      for(let i=1;i<n;i++){ const mx=(P[i-1][0]+P[i][0])/2, my=(P[i-1][1]+P[i][1])/2; d+=`Q${P[i-1][0].toFixed(2)} ${P[i-1][1].toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`; }
      d+=`L${P[n-1][0].toFixed(2)} ${P[n-1][1].toFixed(2)}L104 ${P[n-1][1].toFixed(2)}`;
      this.line.setAttribute("d",d); this.body.setAttribute("d",d+`V${(this.y+this.A+0.6).toFixed(2)}H-40Z`); },
    // équation d'onde amortie, bords libres
    step(dt){ if(!this.svg.isConnected) return false; const n=WAVE_N, K=2000, damp=3.6, sub=4, h=this.h, v=this.v; let E=0;
      for(let s=0;s<sub;s++){ const k=dt/sub; for(let i=0;i<n;i++){ const l=h[i?i-1:1], r=h[i<n-1?i+1:n-2]; v[i]+=(K*(l+r-2*h[i]) - damp*v[i] - 20*h[i])*k; }
        let m=0; for(let i=0;i<n;i++){ h[i]+=v[i]*k; m+=h[i]; } m/=n; for(let i=0;i<n;i++) h[i]-=m; } // volume conservé
      for(let i=0;i<n;i++) E+=h[i]*h[i]+v[i]*v[i]*0.01;
      this.draw(); return E>0.0004; },
    end(){ this.teardown(); },
    kick(f){ if(!physOn()) return; this.setup(); f(this.h,this.v); this.draw(); physAdd(this); } };
  svg._surf=S0; return S0; }
// inclinaison : la surface se balance dans le sens inverse (remplace l'animation CSS « slosh »)
function waveTilt(svg,a){ const s=surfOf(svg); if(!s) return false; const k=Math.max(-1,Math.min(1,a/30));
  s.kick((h,v)=>{ for(let i=0;i<WAVE_N;i++){ const u=i/(WAVE_N-1)*2-1; v[i]+=-k*u*70; } }); return true; }
// versement : une onde part du point de chute
function wavePour(svg,x){ const s=surfOf(svg); if(!s) return false; const c=x==null?0.5:x;
  s.kick((h,v)=>{ for(let i=0;i<WAVE_N;i++){ const u=i/(WAVE_N-1); v[i]+=-60*Math.exp(-((u-c)**2)/0.008); } }); return true; }
function waveShake(svg){ const s=surfOf(svg); if(!s) return false; s.kick((h,v)=>{ for(let i=0;i<WAVE_N;i++) v[i]+=(Math.sin(i*1.7)+Math.cos(i*0.9))*34; }); return true; }
document.addEventListener("pointerup",()=>{ if(typeof TILT==="undefined"||!TILT||!TILT.drag) return; const svg=TILT.h.querySelector("svg.live"); if(svg&&Math.abs(TILT.a)>2) waveTilt(svg,TILT.a); },true);
// versement au Labo : labGlassSVG(true) prépare l'animation de niveau ; on lance l'onde quand le nouveau verre est en place
let LAB_POUR_KICK=false;
{ const _lg=labGlassSVG; labGlassSVG=function(big){ const before=LAB_LASTY; const s=_lg.apply(this,arguments); if(big&&LAB_LASTY!=null&&before!=null&&Math.abs(before-LAB_LASTY)>0.3&&LAB_LASTY<before) LAB_POUR_KICK=true; return s; }; }
{ const W=(k,f)=>{ const g=ACT[k]; if(!g) return; ACT[k]=(d,t)=>{ const r=g(d,t); try{ f(d||{}); }catch(e){} return r; }; };
  W("mixserve",()=>{ const m=mixState().m; if(m==="shake"||m==="stir") setTimeout(()=>waveShake(document.querySelector("#v-labo .lab-glass svg")),m==="shake"?900:700); }); }

// ---------- 2. Mini-verre du Labo ----------
let MINI=null;
function miniSync(){ const v=document.getElementById("v-labo"), big=v&&v.querySelector(".lab-glass");
  if(!big||TAB!=="labo"||LT!=="compose"||!mixState().items.length){ if(MINI) MINI.el.classList.remove("show"); return; }
  if(!MINI){ const el=document.createElement("button"); el.className="mini-glass"; el.setAttribute("aria-label","Remonter au verre"); el.dataset.a="minigo"; document.body.appendChild(el);
    MINI={el,io:null,target:null,vis:true}; }
  const s=labGlassSVG(false).replace(/<animateTransform[\s\S]*?\/>/g,"").replace(/ transform="translate\(0 [\d.]+\)"/,"").replace(/(<svg[^>]*?) class="[^"]*"/,"$1");
  MINI.el.innerHTML=s;
  if(MINI.target!==big){ if(MINI.io) MINI.io.disconnect(); MINI.target=big;
    if("IntersectionObserver" in window){ MINI.io=new IntersectionObserver(E=>{ E.forEach(e=>{ MINI.vis=e.isIntersecting; MINI.el.classList.toggle("show",!MINI.vis&&TAB==="labo"); }); },{threshold:0.15}); MINI.io.observe(big); } }
  MINI.el.classList.toggle("show",!MINI.vis); }
Object.assign(ACT,{ minigo:()=>{ const b=document.querySelector("#v-labo .lab-glass"); if(b) b.scrollIntoView({behavior:REDUCED.matches?"auto":"smooth",block:"center"}); } });

// ---------- 3. Morphing du verre ----------
let MORPH_FROM=null;
{ const g=ACT.mixglass; if(g) ACT.mixglass=(d,t)=>{ const old=labGlass().g; MORPH_FROM=GLASS_SHAPES[old]&&!GLASS_SHAPES[old].mug? {old,from:GLASS_SHAPES[old].o} : null;
    try{ return g(d,t); } finally { MORPH_FROM=null; } }; } // le rendu du Labo a lieu pendant l'action : il consomme MORPH_FROM
function samplePath(d,n){ const ns="http://www.w3.org/2000/svg", sv=document.createElementNS(ns,"svg"), p=document.createElementNS(ns,"path"); p.setAttribute("d",d); sv.appendChild(p);
  sv.setAttribute("style","position:absolute;width:0;height:0;visibility:hidden"); document.body.appendChild(sv);
  const L=p.getTotalLength(), P=[]; for(let i=0;i<n;i++){ const q=p.getPointAtLength(L*i/n); P.push([q.x,q.y]); } sv.remove(); return P; }
// aligne le départ des deux contours sur le point le plus en haut à gauche, pour éviter qu'ils tournent l'un vers l'autre
function alignPts(P){ let k=0; P.forEach((p,i)=>{ if(p[1]+p[0]*0.2<P[k][1]+P[k][0]*0.2) k=i; }); return P.slice(k).concat(P.slice(0,k)); }
function morphGlass(svg,from,to){ if(!svg||!physOn()) return false;
  const N=72, A=alignPts(samplePath(from,N)), B=alignPts(samplePath(to,N));
  let paths=[], others=[]; const bind=sv=>{ paths=[...sv.querySelectorAll("path")].filter(p=>p.getAttribute("d")===to||p._morph); others=[...sv.querySelectorAll(".garn,.ice,path[stroke-opacity='.55']")];
    paths.forEach(p=>p._morph=1); others.forEach(e=>e.style.opacity="0"); svg=sv; return paths.length>0; };
  if(!bind(svg)) return false;
  const it={x:0,v:0,step(dt){ if(!svg.isConnected){ const ns=document.querySelector("#v-labo .lab-glass svg"); if(!ns||!bind(ns)) return false; } // verre redessiné : on continue sur le nouveau
      const k=260, c=2*Math.sqrt(k); this.v+=(k*(1-this.x)-c*this.v)*dt; this.x+=this.v*dt;
      const x=Math.min(1.04,this.x), d="M"+A.map((a,i)=>(a[0]+(B[i][0]-a[0])*x).toFixed(2)+" "+(a[1]+(B[i][1]-a[1])*x).toFixed(2)).join("L")+"Z";
      paths.forEach(p=>p.setAttribute("d",d)); return Math.abs(1-this.x)>0.002||Math.abs(this.v)>0.01; },
    end(){ paths.forEach(p=>{ if(p.isConnected) p.setAttribute("d",to); p._morph=0; }); others.forEach(e=>{ e.style.transition="opacity .25s"; e.style.opacity=""; }); } };
  physAdd(it); return true; }

// après chaque rendu du Labo : morphing en attente, onde de versement, mini-verre
{ const _rv=renderView;
  renderView=function(t){ const r=_rv.apply(this,arguments);
    try{ if(t==="labo"){ const svg=document.querySelector("#v-labo .lab-glass svg");
        if(MORPH_FROM){ const M=MORPH_FROM, g=labGlass().g, sh=GLASS_SHAPES[g]; MORPH_FROM=null; if(g!==M.old&&sh&&!sh.mug) morphGlass(svg,M.from,sh.o); }
        if(LAB_POUR_KICK){ LAB_POUR_KICK=false; setTimeout(()=>wavePour(document.querySelector("#v-labo .lab-glass svg"),0.5),420); } }
      miniSync(); }catch(e){}
    return r; };
}
{ const _sw=switchTab; switchTab=function(){ const r=_sw.apply(this,arguments); try{ miniSync(); }catch(e){} return r; }; }
