import { useState, useEffect, useRef, useCallback } from "react";

const sleep = ms => new Promise(r => setTimeout(r, ms));
const SOLANA_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const isValidSolana = a => SOLANA_RE.test((a||"").trim());

const DC = { LOW:"#22c55e", MEDIUM:"#f97316", HIGH:"#ef4444", CRITICAL:"#dc2626", EXISTENTIAL:"#ff1a1a" };
const EC = { FOMO:"#f97316", PANIC:"#ef4444", GREED:"#22c55e", REVENGE:"#a855f7", FEAR:"#3b82f6", EUPHORIA:"#00ff88", APATHY:"#6b7280" };
const AI = { "Exit Liquidity":"🎯","FOMO Chaser":"🚀","Smart Shadow":"🧠","Whale Parasite":"🐋","Revenge Ape":"🦍","Pump.fun Degenerate":"💊","Top Buyer":"📉","Rug Magnet":"🧲","Diamond Hand":"💎","Noise Trader":"📡" };

const FEED = [
  { addr:"7xKX...mQ3f", arch:"FOMO Chaser",        danger:"HIGH",        score:81, emo:"FOMO",    t:"2m ago"  },
  { addr:"9pLR...bW1c", arch:"Rug Magnet",          danger:"CRITICAL",    score:94, emo:"PANIC",   t:"5m ago"  },
  { addr:"3nYT...vR8k", arch:"Smart Shadow",        danger:"LOW",         score:22, emo:"GREED",   t:"9m ago"  },
  { addr:"BqZA...jF4d", arch:"Whale Parasite",      danger:"MEDIUM",      score:56, emo:"GREED",   t:"14m ago" },
  { addr:"Ks9M...hU7p", arch:"Pump.fun Degenerate", danger:"EXISTENTIAL", score:99, emo:"EUPHORIA",t:"21m ago" },
  { addr:"2wCV...nE2s", arch:"Revenge Ape",         danger:"HIGH",        score:78, emo:"REVENGE", t:"28m ago" },
  { addr:"FmDA...xQ5t", arch:"Diamond Hand",        danger:"LOW",         score:18, emo:"APATHY",  t:"35m ago" },
  { addr:"Hj3P...cL9r", arch:"Exit Liquidity",      danger:"HIGH",        score:85, emo:"FEAR",    t:"41m ago" },
  { addr:"4rWN...oB6g", arch:"Noise Trader",        danger:"MEDIUM",      score:49, emo:"APATHY",  t:"52m ago" },
  { addr:"YvQS...kT3m", arch:"Top Buyer",           danger:"CRITICAL",    score:91, emo:"FOMO",    t:"1h ago"  },
];

// live crypto prices (mock, realistic)
const PRICES = [
  { sym:"BTC", price:"$106,240", chg:"+2.14%", up:true  },
  { sym:"ETH", price:"$2,618",   chg:"-0.87%", up:false },
  { sym:"SOL", price:"$171.40",  chg:"+3.52%", up:true  },
  { sym:"BNB", price:"$644.30",  chg:"+0.91%", up:true  },
  { sym:"XRP", price:"$2.31",    chg:"-1.23%", up:false },
];

// example scan result for homepage demo
const DEMO = {
  addr:"7xKX...mQ3f",
  arch:"FOMO Chaser",
  dna:"Volatile-Chasing-Nomad",
  danger:"HIGH",
  emo:"FOMO",
  risk:81, fomo:87, panic:73, revenge:44, degen:68, smart:19,
  commentary:[
    "Wallet panic sold BONK at local bottom, then re-entered 40% higher.",
    "Detected 6 consecutive FOMO entries within 2 hours during pump events.",
    "High emotional instability — 83% of trades made during peak volatility windows.",
  ],
};

// ── counter ────────────────────────────────
function Counter({ to, suffix="" }) {
  const [v, setV] = useState(0);
  const el = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const dur=1500, start=performance.now();
      const tick=now=>{ const p=Math.min((now-start)/dur,1); setV(Math.floor(p*to)); if(p<1)requestAnimationFrame(tick); else setV(to); };
      requestAnimationFrame(tick);
    },{ threshold:0.4 });
    if(el.current)obs.observe(el.current);
    return()=>obs.disconnect();
  },[to]);
  return <span ref={el}>{v.toLocaleString()}{suffix}</span>;
}

// ── particles ──────────────────────────────
function Particles() {
  const cv=useRef(null);
  useEffect(()=>{
    const c=cv.current;if(!c)return;
    const ctx=c.getContext("2d");
    let W=c.width=innerWidth,H=c.height=innerHeight;
    const onR=()=>{W=c.width=innerWidth;H=c.height=innerHeight;};
    addEventListener("resize",onR);
    const pts=Array.from({length:55},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.2,vy:(Math.random()-.5)*.2,r:Math.random()*1.3+.3,col:["#00ff88","#00e5ff","#7c3aed","#ff3b3b"][0|Math.random()*4],a:Math.random()*.4+.1}));
    let raf;
    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<110){ctx.beginPath();ctx.strokeStyle=`rgba(0,229,255,${.05*(1-d/110)})`;ctx.lineWidth=.4;ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.stroke();}}
      pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.col+Math.floor(p.a*255).toString(16).padStart(2,"0");ctx.fill();});
      raf=requestAnimationFrame(draw);
    };
    draw();
    return()=>{cancelAnimationFrame(raf);removeEventListener("resize",onR);};
  },[]);
  return <canvas ref={cv} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,opacity:.28}}/>;
}

// ── brain pulse ────────────────────────────
function BrainPulse() {
  const cv=useRef(null);
  useEffect(()=>{
    const c=cv.current;if(!c)return;
    const ctx=c.getContext("2d"),S=200;c.width=S;c.height=S;
    const cx=S/2,cy=S/2;
    let t=0,raf;
    const rings=[{r:80,col:"#00ff88",spd:.018,dash:12},{r:62,col:"#00e5ff",spd:-.022,dash:8},{r:44,col:"#a855f7",spd:.03,dash:6}];
    const draw=()=>{
      ctx.clearRect(0,0,S,S);
      const g=ctx.createRadialGradient(cx,cy,0,cx,cy,90);g.addColorStop(0,"rgba(0,255,136,.04)");g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.fillRect(0,0,S,S);
      rings.forEach(({r,col,spd,dash})=>{
        ctx.save();ctx.translate(cx,cy);ctx.rotate(t*spd);ctx.beginPath();ctx.setLineDash([dash,dash]);ctx.arc(0,0,r,0,Math.PI*2);ctx.strokeStyle=col+"55";ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);
        const pulse=.5+.5*Math.sin(t*.06);ctx.beginPath();ctx.arc(r,0,3,0,Math.PI*2);ctx.fillStyle=col+Math.floor(80+100*pulse).toString(16);ctx.shadowColor=col;ctx.shadowBlur=10;ctx.fill();ctx.restore();
      });
      const pulse=.5+.5*Math.sin(t*.05);ctx.beginPath();ctx.arc(cx,cy,14+4*pulse,0,Math.PI*2);ctx.fillStyle=`rgba(0,255,136,${.15+.1*pulse})`;ctx.shadowColor="#00ff88";ctx.shadowBlur=20;ctx.fill();ctx.beginPath();ctx.arc(cx,cy,6,0,Math.PI*2);ctx.fillStyle="#00ff88";ctx.shadowBlur=15;ctx.fill();
      ctx.shadowBlur=0;[0,Math.PI/4,Math.PI/2,3*Math.PI/4].forEach(a=>{ctx.save();ctx.translate(cx,cy);ctx.rotate(a);ctx.beginPath();ctx.moveTo(0,-82);ctx.lineTo(0,82);ctx.strokeStyle="rgba(0,255,136,.06)";ctx.lineWidth=.5;ctx.stroke();ctx.restore();});
      t++;raf=requestAnimationFrame(draw);
    };
    draw();return()=>cancelAnimationFrame(raf);
  },[]);
  return <canvas ref={cv} style={{width:200,height:200}}/>;
}

// ── radar ──────────────────────────────────
function Radar({s=140}) {
  const cv=useRef(null),ang=useRef(0),raf=useRef(null);
  useEffect(()=>{
    const c=cv.current;if(!c)return;
    const ctx=c.getContext("2d");c.width=s;c.height=s;
    const cx=s/2,cy=s/2,R=s/2-4;
    const blips=Array.from({length:5},()=>({a:Math.random()*Math.PI*2,r:Math.random()*R*.8+R*.1,alpha:0}));
    const draw=()=>{
      ctx.clearRect(0,0,s,s);ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.fillStyle="rgba(0,6,14,.96)";ctx.fill();ctx.strokeStyle="#00ff8830";ctx.lineWidth=1;ctx.stroke();
      [.25,.5,.75,1].forEach(f=>{ctx.beginPath();ctx.arc(cx,cy,R*f,0,Math.PI*2);ctx.strokeStyle="#00ff8812";ctx.lineWidth=.5;ctx.stroke();});
      ctx.save();ctx.translate(cx,cy);ctx.rotate(ang.current);const sw=ctx.createLinearGradient(0,0,R,0);sw.addColorStop(0,"rgba(0,255,136,.28)");sw.addColorStop(1,"rgba(0,255,136,0)");ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R,-.42,.42);ctx.fillStyle=sw;ctx.fill();ctx.restore();
      ang.current+=.02;
      blips.forEach(b=>{const sa=((ang.current%(Math.PI*2))+Math.PI*2)%(Math.PI*2);if(((sa-(b.a+Math.PI*2)%(Math.PI*2)+Math.PI*2)%(Math.PI*2))<.07)b.alpha=1;b.alpha*=.97;if(b.alpha>.04){const bx=cx+Math.cos(b.a)*b.r,by=cy+Math.sin(b.a)*b.r;ctx.beginPath();ctx.arc(bx,by,2.5,0,Math.PI*2);ctx.fillStyle=`rgba(0,255,136,${b.alpha})`;ctx.shadowColor="#00ff88";ctx.shadowBlur=6;ctx.fill();ctx.shadowBlur=0;}});
      ctx.beginPath();ctx.arc(cx,cy,2.5,0,Math.PI*2);ctx.fillStyle="#00ff88";ctx.fill();
      raf.current=requestAnimationFrame(draw);
    };
    draw();return()=>cancelAnimationFrame(raf.current);
  },[s]);
  return <canvas ref={cv} style={{width:s,height:s,borderRadius:"50%",display:"block"}}/>;
}

// ── badges ─────────────────────────────────
const DBadge=({l})=>{const c=DC[l]||"#fff";return <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:4,letterSpacing:.8,background:c+"20",border:`1px solid ${c}`,color:c,textShadow:`0 0 6px ${c}`,animation:(l==="CRITICAL"||l==="EXISTENTIAL")?"pulse 1s infinite":"none"}}>{l}</span>;};
const EBadge=({e})=>{const c=EC[e]||"#fff";return <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:4,background:c+"20",border:`1px solid ${c}60`,color:c}}>{e}</span>;};

// ── mini bar ───────────────────────────────
function MiniBar({v,col}){const c=v>75?"#ff3b3b":col;return(
  <div style={{display:"flex",gap:8,alignItems:"center"}}>
    <div style={{flex:1,height:4,background:"#ffffff0f",borderRadius:2,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${v}%`,background:`linear-gradient(90deg,${c}80,${c})`,borderRadius:2,boxShadow:`0 0 6px ${c}70`,transition:"width 1s ease"}}/>
    </div>
    <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:c,fontWeight:700,minWidth:24}}>{v}</span>
  </div>
);}

// ════════════════════════════════════════════
export default function App() {
  const [page,   setPage]   = useState("home");
  const [menu,   setMenu]   = useState(false);
  const [wallet, setWallet] = useState("");
  const [step,   setStep]   = useState(0);
  const [busy,   setBusy]   = useState(false);
  const [err,    setErr]    = useState("");
  const [fidx,   setFidx]   = useState(0);
  const [pidx,   setPidx]   = useState(0);
  // ── BATTLE state ──
  const [bW1,  setBW1]  = useState("");
  const [bW2,  setBW2]  = useState("");
  const [bBusy,setBBusy]= useState(false);
  const [bStep,setBStep]= useState(0);
  const [bResult,setBResult]= useState(null);

  useEffect(()=>{const id=setInterval(()=>setFidx(i=>(i+1)%FEED.length),2700);return()=>clearInterval(id);},[]);
  useEffect(()=>{const id=setInterval(()=>setPidx(i=>(i+1)%PRICES.length),1800);return()=>clearInterval(id);},[]);

  const wOk=isValidSolana(wallet), wBad=wallet&&!wOk;
  const STEPS=["Initializing neural engine...","Fetching on-chain signatures...","Parsing SPL accounts...","Analyzing swap behavior...","Detecting emotional patterns...","Profiling psychological DNA...","Running FREUD engine...","Generating report..."];

  const scan=useCallback(async()=>{
    if(!wOk)return;
    setBusy(true);setErr("");
    for(let i=0;i<STEPS.length;i++){setStep(i);await sleep(560+Math.random()*360);}
    setBusy(false);
    setErr("Live analysis requires backend deployment. Connect Helius + Claude API keys via Vercel.");
  },[wallet,wOk]);

  const goScan=()=>{setPage("scan");setMenu(false);};
  const goHome=()=>{setPage("home");setMenu(false);setErr("");setWallet("");setBusy(false);};
  const goPage=p=>{setPage(p);setMenu(false);setBResult(null);};

  // ── BATTLE LOGIC ──
  const BSTEPS=["Initializing dual neural scan...","Fetching wallet alpha data...","Fetching wallet beta data...","Comparing behavioral patterns...","Calculating psychological scores...","Determining dominant archetype...","Analyzing emotional stability...","Rendering battle result..."];

  // Deterministic pseudo-score from wallet address string
  const walletScore=(addr,seed)=>{
    let h=seed;
    for(let i=0;i<addr.length;i++)h=(h*31+addr.charCodeAt(i))&0xfffffff;
    return{
      risk:   20+(h%60),
      fomo:   15+((h>>3)%70),
      panic:  10+((h>>6)%65),
      smart:  10+((h>>9)%75),
      degen:  20+((h>>12)%60),
      revenge:10+((h>>15)%55),
      emo:    15+((h>>18)%65),
    };
  };
  const ARCH_LIST=["Exit Liquidity","FOMO Chaser","Smart Shadow","Whale Parasite","Revenge Ape","Pump.fun Degenerate","Top Buyer","Rug Magnet","Diamond Hand","Noise Trader"];
  const pickArch=(h)=>ARCH_LIST[h%ARCH_LIST.length];

  const runBattle=useCallback(async()=>{
    if(!isValidSolana(bW1)||!isValidSolana(bW2))return;
    setBBusy(true);setBResult(null);
    for(let i=0;i<BSTEPS.length;i++){setBStep(i);await sleep(500+Math.random()*300);}
    // Deterministic scores from address
    const h1=bW1.split("").reduce((a,c)=>a*31+c.charCodeAt(0),7)&0xfffffff;
    const h2=bW2.split("").reduce((a,c)=>a*31+c.charCodeAt(0),13)&0xfffffff;
    const s1=walletScore(bW1,7), s2=walletScore(bW2,13);
    const total1=s1.smart*2+s1.risk*0.5+(100-s1.panic)*0.8+(100-s1.degen)*0.6;
    const total2=s2.smart*2+s2.risk*0.5+(100-s2.panic)*0.8+(100-s2.degen)*0.6;
    const winner=total1>=total2?1:2;
    setBResult({
      w1:{ addr:bW1.slice(0,6)+"..."+bW1.slice(-4), arch:pickArch(h1), scores:s1,
        danger:s1.risk>75?"CRITICAL":s1.risk>55?"HIGH":s1.risk>35?"MEDIUM":"LOW" },
      w2:{ addr:bW2.slice(0,6)+"..."+bW2.slice(-4), arch:pickArch(h2), scores:s2,
        danger:s2.risk>75?"CRITICAL":s2.risk>55?"HIGH":s2.risk>35?"MEDIUM":"LOW" },
      winner,
      verdict: winner===1
        ? `Wallet A dominates — superior smart money alignment and emotional control.`
        : `Wallet B wins — cleaner psychology, less emotional noise, stronger discipline.`,
    });
    setBBusy(false);
  },[bW1,bW2]);

  const MENU=[
    {l:"Wallet Battle ⚔", p:"battle",    desc:"Compare two wallets"},
    {l:"Mission",         p:"mission",   desc:"Purpose & values"},
    {l:"How It Works",    p:"how",       desc:"3-layer AI pipeline"},
    {l:"Archetypes",      p:"archetypes",desc:"10 trader types"},
    {l:"Roadmap",         p:"roadmap",   desc:"Development timeline"},
  ];

  return(<>
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}body{background:#030508;overflow-x:hidden;color:#fff}
    ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#000}::-webkit-scrollbar-thumb{background:#00ff8840}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes fu{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes gsh{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    @keyframes slideD{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes breathe{0%,100%{box-shadow:0 0 16px #00ff8828}50%{box-shadow:0 0 40px #00ff8855}}
    @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    .fu{animation:fu .6s ease both}
    .card{background:linear-gradient(135deg,#ffffff07,#ffffff02);border:1px solid #ffffff0d;border-radius:14px;padding:18px;position:relative;overflow:hidden}
    .card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,#00ff8805,transparent 55%);pointer-events:none}
    .mono{font-family:'Share Tech Mono',monospace}.orb{font-family:'Orbitron',monospace}
    .gbtn{background:linear-gradient(135deg,#00ff8830,#00e5ff1e);border:1px solid #00ff88bb;color:#00ff88;font-family:'Orbitron',monospace;font-size:12px;font-weight:800;letter-spacing:1.5px;padding:12px 24px;border-radius:9px;cursor:pointer;text-transform:uppercase;transition:all .22s;text-shadow:0 0 10px #00ff88aa;box-shadow:0 0 18px #00ff8828;display:inline-flex;align-items:center;gap:7px}
    .gbtn:hover{background:linear-gradient(135deg,#00ff8850,#00e5ff38);box-shadow:0 0 38px #00ff8858,0 0 12px #00ff8830}
    .gbtn:active{transform:scale(.97)}
    .gbtn:disabled{opacity:.35;cursor:not-allowed;box-shadow:none}
    .isol{background:#000d1a;border:1px solid #00ff8850;color:#f0fff8;font-family:'Share Tech Mono',monospace;font-size:15px;padding:15px 16px;border-radius:9px;outline:none;width:100%;transition:border-color .3s,box-shadow .3s;letter-spacing:.4px}
    .isol::placeholder{color:#00ff8872}.isol:focus{border-color:#00ff88;box-shadow:0 0 24px #00ff8824}
    @media(max-width:600px){.d2{grid-template-columns:1fr!important}.d3{grid-template-columns:1fr!important}.card{padding:15px}.hide-xs{display:none!important}}
  `}</style>

  <Particles/>
  <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:999,background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.018) 2px,rgba(0,0,0,.018) 4px)"}}/>

  <div style={{position:"relative",zIndex:1,background:"radial-gradient(ellipse at 12% 10%,#001e0c,transparent 50%),radial-gradient(ellipse at 88% 88%,#0d0022,transparent 50%),#030508"}}>

    {/* ══ NAVBAR ══ */}
    <nav style={{position:"sticky",top:0,zIndex:200,borderBottom:"1px solid #ffffff0b",background:"rgba(3,5,8,.92)",backdropFilter:"blur(20px)",padding:"0 18px"}}>
      <div style={{maxWidth:1060,margin:"0 auto",display:"flex",alignItems:"center",height:56,gap:10}}>
        <div onClick={goHome} style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer",marginRight:"auto"}}>
          <div style={{width:32,height:32,borderRadius:7,background:"linear-gradient(135deg,#00ff88,#00e5ff)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 16px #00ff8848",animation:"breathe 3s ease-in-out infinite"}}>
            <span style={{fontSize:16}}>🧠</span>
          </div>
          <div>
            <div className="orb" style={{fontSize:17,fontWeight:900,color:"#00ff88",letterSpacing:2.5,textShadow:"0 0 10px #00ff8848",lineHeight:1}}>FREUD</div>
            <div className="mono" style={{fontSize:8.5,color:"#00ff8870",letterSpacing:.8,marginTop:1}}>SOLANA PSYCHOLOGICAL INTELLIGENCE</div>
          </div>
        </div>
        <button onClick={()=>setMenu(m=>!m)} style={{background:"transparent",border:"1px solid #ffffff1a",borderRadius:7,padding:"8px 9px",cursor:"pointer",display:"flex",flexDirection:"column",gap:4.5,alignItems:"center"}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{width:17,height:1.8,borderRadius:2,background:menu?"#00ff88":"#ffffffbb",transition:"all .22s",
              transform:menu?(i===0?"rotate(45deg) translate(4px,4px)":i===2?"rotate(-45deg) translate(4px,-4px)":"scaleX(0)"):"none"}}/>
          ))}
        </button>
      </div>

      {/* ── dropdown ── */}
      {menu&&(
        <div style={{position:"absolute",top:56,left:0,right:0,background:"rgba(3,5,8,.98)",backdropFilter:"blur(22px)",borderBottom:"1px solid #00ff8818",animation:"slideD .18s ease",zIndex:300}}>
          <div style={{maxWidth:1060,margin:"0 auto",padding:"14px 18px 18px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:10}}>
              {MENU.map(({l,p,desc})=>(
                <button key={p} onClick={()=>goPage(p)} style={{background:"#ffffff05",border:"1px solid #ffffff0b",borderRadius:9,padding:"12px 14px",cursor:"pointer",textAlign:"left",transition:"border-color .18s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="#00ff8828"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="#ffffff0b"}>
                  <div className="orb" style={{fontSize:10,fontWeight:800,color:"#00ff88cc",letterSpacing:.8,marginBottom:2}}>{l.toUpperCase()}</div>
                  <div className="mono" style={{fontSize:10,color:"#ffffff55"}}>{desc}</div>
                </button>
              ))}
            </div>
            {/* stack + resources row */}
            <div style={{display:"flex",gap:16,marginBottom:10,flexWrap:"wrap",paddingTop:8,borderTop:"1px solid #ffffff0a"}}>
              <div>
                <div className="mono" style={{fontSize:9,color:"#a855f7aa",letterSpacing:2,marginBottom:6}}>STACK</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {[["Claude AI","#a855f7"],["Helius RPC","#00e5ff"],["Solana","#9945ff"],["Jupiter","#00ff88"],["Pump.fun","#f97316"]].map(([n,c])=>(
                    <span key={n} className="mono" style={{fontSize:10,color:c,background:c+"12",border:`1px solid ${c}25`,borderRadius:4,padding:"2px 7px"}}>{n}</span>
                  ))}
                </div>
              </div>
              <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"flex-end"}}>
                {[{l:"helius.dev",u:"https://helius.dev"},{l:"Vercel",u:"https://vercel.com"}].map(({l,u})=>(
                  <a key={l} href={u} target="_blank" rel="noopener noreferrer" className="mono" style={{fontSize:10,color:"#00e5ffaa",textDecoration:"none",border:"1px solid #00e5ff25",padding:"3px 9px",borderRadius:5}}>{l} →</a>
                ))}
              </div>
            </div>
            <button className="gbtn" style={{width:"100%",justifyContent:"center",padding:"12px"}} onClick={goScan}>⬡ SCAN A WALLET NOW</button>
          </div>
        </div>
      )}
    </nav>
    {menu&&<div style={{position:"fixed",inset:0,zIndex:150}} onClick={()=>setMenu(false)}/>}

    {/* ══════════════════════════════════════
        HOME — product focused
    ══════════════════════════════════════ */}
    {page==="home"&&(<>

      {/* ── LIVE PRICE TICKER ── */}
      <div style={{borderBottom:"1px solid #ffffff0a",background:"#00060e",overflow:"hidden",height:36,position:"relative"}}>
        {/* subtle left/right fade */}
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:40,background:"linear-gradient(90deg,#00060e,transparent)",zIndex:2,pointerEvents:"none"}}/>
        <div style={{position:"absolute",right:0,top:0,bottom:0,width:40,background:"linear-gradient(270deg,#00060e,transparent)",zIndex:2,pointerEvents:"none"}}/>
        <div style={{display:"flex",animation:"ticker 22s linear infinite",width:"max-content",height:"100%",alignItems:"center"}}>
          {[...PRICES,...PRICES,...PRICES,...PRICES].map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:7,padding:"0 20px",height:"100%",whiteSpace:"nowrap"}}>
              <span className="orb" style={{fontSize:11,fontWeight:900,color:"#ffffffee",letterSpacing:.5}}>{p.sym}</span>
              <span className="mono" style={{fontSize:12,color:"#ffffffdd",fontWeight:600}}>{p.price}</span>
              <span className="mono" style={{fontSize:11,fontWeight:700,
                color:p.up?"#22c55e":"#ef4444",
                textShadow:p.up?"0 0 8px #22c55e88":"0 0 8px #ef444488"}}>
                {p.up?"▲":"▼"} {p.chg}
              </span>
              <span style={{color:"#ffffff18",fontSize:8,marginLeft:4}}>•</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── HERO ── */}
      <div style={{padding:"56px 20px 36px",maxWidth:1060,margin:"0 auto",textAlign:"center"}}>
        <div className="fu" style={{animationDelay:"0s"}}>
          <div className="mono" style={{fontSize:12,color:"#00e5ffee",letterSpacing:3,marginBottom:12}}>◈ SOLANA WALLET PSYCHOLOGICAL PROFILER ◈</div>
        </div>
        <div className="fu" style={{animationDelay:".04s",display:"flex",justifyContent:"center",marginBottom:14}}><BrainPulse/></div>
        <div className="fu" style={{animationDelay:".09s"}}>
          <h1 className="orb" style={{fontSize:"clamp(30px,6vw,60px)",fontWeight:900,lineHeight:1.06,marginBottom:16}}>
            <span style={{color:"#fff"}}>YOUR WALLET IS YOUR</span><br/>
            <span style={{background:"linear-gradient(90deg,#00ff88,#00e5ff,#a855f7,#00ff88)",backgroundSize:"300% 100%",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"gsh 4s ease infinite"}}>UNCONSCIOUS MIND</span>
          </h1>
        </div>
        <div className="fu" style={{animationDelay:".13s"}}>
          <p className="mono" style={{fontSize:16,color:"#ffffffdd",maxWidth:520,margin:"0 auto 26px",lineHeight:1.8}}>
            FREUD reads your Solana on-chain history and exposes the FOMO, panic, revenge, and emotional instability behind every trade.
          </p>
        </div>
        {/* ── INLINE SCANNER — larger ── */}
        <div className="fu" style={{animationDelay:".17s",maxWidth:680,margin:"0 auto 24px"}}>
          <div style={{background:"#000d1a",border:`1px solid ${wBad?"#ff3b3b66":"#00ff8855"}`,borderRadius:14,padding:5,display:"flex",gap:5,boxShadow:wBad?"0 0 24px #ff3b3b10":"0 0 48px #00ff8820,0 0 16px #00ff8810"}}>
            <input className="isol" style={{border:"none",background:"transparent",color:wBad?"#ff6b6b":"#f0fff8",fontSize:15,borderRadius:10}}
              placeholder="Paste any Solana wallet address..."
              value={wallet} onChange={e=>{setWallet(e.target.value);setErr("");}}
              onKeyDown={e=>e.key==="Enter"&&scan()}/>
            <button className="gbtn" onClick={scan} disabled={!!wBad||!wOk||busy}
              style={{fontSize:13,padding:"0 26px",borderRadius:10,flexShrink:0,boxShadow:"0 0 28px #00ff8858,0 0 8px #00ff8840"}}>
              {busy?"...":"SCAN"}
            </button>
          </div>
          {wBad&&<div className="mono" style={{fontSize:13,color:"#ff6b6b",textAlign:"center",marginTop:8}}>⚠ Invalid — must be base58 Solana wallet (32–44 chars)</div>}
          {wOk&&!busy&&!err&&<div className="mono" style={{fontSize:13,color:"#00ff88bb",textAlign:"center",marginTop:8}}>✓ Valid address — press SCAN</div>}
          {busy&&(
            <div style={{textAlign:"center",padding:"28px 0"}}>
              <div style={{width:60,height:60,margin:"0 auto 16px",border:"2px solid #00ff8820",borderTop:"2px solid #00ff88",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
              <div className="orb" style={{fontSize:11,color:"#00ff88",letterSpacing:3,marginBottom:12}}>SCANNING NEURAL PATTERNS</div>
              <div style={{maxWidth:360,margin:"0 auto 12px"}}>
                {STEPS.map((s,i)=>(
                  <div key={i} className="mono" style={{fontSize:12,padding:"3px 0",textAlign:"left",transition:"color .4s",color:i<step?"#00ff8878":i===step?"#00ff88":"#ffffff35"}}>
                    {i<step?"✓ ":i===step?"▶ ":"  "}{s}
                  </div>
                ))}
              </div>
              <div style={{maxWidth:360,margin:"0 auto",height:2,background:"#ffffff0a",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",background:"linear-gradient(90deg,#00ff88,#00e5ff)",width:`${(step/STEPS.length)*100}%`,transition:"width .5s",boxShadow:"0 0 8px #00ff88"}}/>
              </div>
            </div>
          )}
          {err&&!busy&&(
            <div style={{marginTop:14,background:"linear-gradient(135deg,#1a0000,#0d0005)",border:"1px solid #ff3b3b28",borderRadius:10,padding:"16px"}}>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:18,animation:"pulse 1.5s infinite"}}>⚠</span>
                <div className="orb" style={{fontSize:11,fontWeight:800,color:"#ff3b3b"}}>SCAN FAILED</div>
              </div>
              <div className="mono" style={{fontSize:13,color:"#ffffffdd",lineHeight:1.7,marginBottom:10}}>{err}</div>
              <div style={{display:"flex",gap:8}}>
                <button className="gbtn" onClick={scan} style={{flex:1,justifyContent:"center",fontSize:10}}>↻ RETRY</button>
                <button onClick={()=>{setErr("");setWallet("");}} style={{flex:1,background:"transparent",border:"1px solid #ffffff22",borderRadius:8,color:"#ffffffcc",fontFamily:"'Orbitron',monospace",fontSize:10,fontWeight:700,cursor:"pointer",letterSpacing:1}}>← CLEAR</button>
              </div>
            </div>
          )}
        </div>

        {/* stat counters */}
        <div className="fu" style={{animationDelay:".22s",display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
          {[{to:9,suf:"",lab:"Scores",col:"#00ff88"},{to:10,suf:"",lab:"Archetypes",col:"#00e5ff"},{to:2847,suf:"+",lab:"Wallets Scanned",col:"#a855f7"},{to:30,suf:"s",lab:"Avg Scan",col:"#f97316"},{to:100,suf:"%",lab:"On-Chain",col:"#22c55e"}].map(({to,suf,lab,col})=>(
            <div key={lab} style={{background:"#ffffff06",border:`1px solid ${col}22`,borderRadius:11,padding:"11px 15px",minWidth:88,textAlign:"center"}}>
              <div className="orb" style={{fontSize:20,fontWeight:900,color:col,textShadow:`0 0 10px ${col}55`,marginBottom:2}}><Counter to={to} suffix={suf}/></div>
              <div className="mono" style={{fontSize:11,color:"#ffffffbb"}}>{lab}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── LIVE SCAN TICKER ── */}
      <div style={{maxWidth:1060,margin:"0 auto",padding:"0 20px 36px"}}>
        <div style={{background:"#000d1a",border:"1px solid #ff3b3b1e",borderRadius:12,padding:"11px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
            <span style={{animation:"blink 1s infinite",color:"#ef4444",fontSize:8}}>●</span>
            <span className="orb" style={{fontSize:9,color:"#ff6060dd",letterSpacing:2}}>LIVE SCAN FEED</span>
            <span className="mono" style={{fontSize:11,color:"#ffffff45",marginLeft:"auto"}}>10 latest profiles</span>
          </div>
          <div style={{overflow:"hidden",height:32,position:"relative"}}>
            {FEED.map((w,i)=>{const dc=DC[w.danger]||"#fff",vis=i===fidx;return(
              <div key={i} style={{position:"absolute",top:0,left:0,right:0,display:"flex",alignItems:"center",gap:8,opacity:vis?1:0,transform:vis?"translateY(0)":"translateY(8px)",transition:"opacity .4s,transform .4s",pointerEvents:vis?"auto":"none"}}>
                <span className="mono" style={{fontSize:12,color:"#ffffff60"}}>{w.addr}</span>
                <span style={{fontSize:14}}>{AI[w.arch]||"🎰"}</span>
                <span className="orb" style={{fontSize:10,fontWeight:700,color:dc}}>{w.arch}</span>
                <DBadge l={w.danger}/><EBadge e={w.emo}/>
                <span className="mono" style={{fontSize:11,color:"#ffffff35",marginLeft:"auto"}}>{w.t}</span>
              </div>
            );})}
          </div>
        </div>
      </div>

      {/* ── RECENT SCANS TABLE ── */}
      <div style={{maxWidth:1060,margin:"0 auto",padding:"0 20px 48px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div>
            <div className="mono" style={{fontSize:10,color:"#ef4444aa",letterSpacing:3,marginBottom:3}}>◈ RECENT SCANS ◈</div>
            <div className="orb" style={{fontSize:17,fontWeight:900,color:"#fff"}}>LAST 10 ANALYZED WALLETS</div>
          </div>
          <button className="gbtn" onClick={goScan} style={{fontSize:10,padding:"9px 18px"}}>SCAN YOURS →</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {FEED.map((w,i)=>{const dc=DC[w.danger]||"#fff";return(
            <div key={i} style={{background:"#ffffff05",border:"1px solid #ffffff0a",borderRadius:10,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",animation:`fu .5s ease ${i*.03}s both`}}>
              <span className="orb" style={{fontSize:10,color:"#ffffff30",width:16,flexShrink:0}}>{i+1}</span>
              <span className="mono" style={{fontSize:12,color:"#ffffff70",minWidth:80,flexShrink:0}}>{w.addr}</span>
              <span style={{fontSize:16}}>{AI[w.arch]||"🎰"}</span>
              <span className="orb" style={{fontSize:11,fontWeight:800,color:dc,flex:1,minWidth:90}}>{w.arch}</span>
              <div style={{display:"flex",gap:5}}><DBadge l={w.danger}/><EBadge e={w.emo}/></div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div className="orb" style={{fontSize:18,fontWeight:900,color:dc,textShadow:`0 0 10px ${dc}55`}}>{w.score}</div>
                <div className="mono" style={{fontSize:9,color:"#ffffff40"}}>RISK</div>
              </div>
              <span className="mono" style={{fontSize:11,color:"#ffffff38",flexShrink:0}}>{w.t}</span>
            </div>
          );})}
        </div>
      </div>

      {/* ── EXAMPLE SCAN RESULT ── */}
      <div style={{maxWidth:1060,margin:"0 auto",padding:"0 20px 48px"}}>
        <div style={{marginBottom:14}}>
          <div className="mono" style={{fontSize:10,color:"#a855f7aa",letterSpacing:3,marginBottom:3}}>◈ EXAMPLE RESULT ◈</div>
          <div className="orb" style={{fontSize:17,fontWeight:900,color:"#fff"}}>WHAT A SCAN LOOKS LIKE</div>
        </div>
        <div style={{background:"linear-gradient(135deg,#00ff8806,#a855f705)",border:"1px solid #00ff8822",borderRadius:14,padding:"20px",position:"relative",overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:28}}>🚀</span>
              <div>
                <div className="orb" style={{fontSize:17,fontWeight:900,color:"#f97316",textShadow:"0 0 16px #f9731660"}}>{DEMO.arch.toUpperCase()}</div>
                <div className="mono" style={{fontSize:12,color:"#00e5ffdd"}}>DNA: {DEMO.dna}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}><DBadge l={DEMO.danger}/><EBadge e={DEMO.emo}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px 20px",marginBottom:16}} className="d2">
            {[["RISK",DEMO.risk,"#00ff88"],["FOMO",DEMO.fomo,"#f97316"],["PANIC",DEMO.panic,"#ef4444"],["DEGENERACY",DEMO.degen,"#a855f7"],["REVENGE",DEMO.revenge,"#a855f7"],["SMART MONEY",DEMO.smart,"#22c55e"]].map(([l,v,c])=>(
              <div key={l}>
                <div className="mono" style={{fontSize:11,color:"#ffffffcc",marginBottom:3}}>{l}</div>
                <MiniBar v={v} col={c}/>
              </div>
            ))}
          </div>
          <div style={{background:"#ff3b3b08",border:"1px solid #ff3b3b1e",borderRadius:9,padding:"13px 15px"}}>
            <div className="orb" style={{fontSize:9,color:"#ff6060",letterSpacing:2,marginBottom:9}}>◈ AI COMMENTARY</div>
            {DEMO.commentary.map((c,i)=>(
              <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start",marginBottom:i<DEMO.commentary.length-1?8:0}}>
                <span style={{color:"#ff3b3b",fontSize:12,flexShrink:0}}>▶</span>
                <span className="mono" style={{fontSize:13,color:"#ffffffdd",lineHeight:1.7}}>{c}</span>
              </div>
            ))}
          </div>
          <div style={{position:"absolute",top:14,right:16}}><span className="mono" style={{fontSize:9,color:"#ffffff35",letterSpacing:2}}>DEMO RESULT</span></div>
        </div>
      </div>

      {/* ── ARCHETYPE PREVIEW ── */}
      <div style={{maxWidth:1060,margin:"0 auto",padding:"0 20px 48px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div>
            <div className="mono" style={{fontSize:10,color:"#f97316aa",letterSpacing:3,marginBottom:3}}>◈ ARCHETYPES ◈</div>
            <div className="orb" style={{fontSize:17,fontWeight:900,color:"#fff"}}>WHICH ONE ARE YOU?</div>
          </div>
          <button onClick={()=>goPage("archetypes")} style={{background:"transparent",border:"1px solid #ffffff28",borderRadius:8,padding:"8px 16px",cursor:"pointer",color:"#ffffffcc",fontFamily:"'Orbitron',monospace",fontSize:10,fontWeight:700,letterSpacing:1}}>SEE ALL 10 →</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8}}>
          {Object.entries(AI).map(([name,icon])=>{
            const cols={"Exit Liquidity":"#ff3b3b","FOMO Chaser":"#f97316","Smart Shadow":"#00ff88","Whale Parasite":"#00e5ff","Revenge Ape":"#a855f7","Pump.fun Degenerate":"#ff3b3b","Top Buyer":"#f97316","Rug Magnet":"#ef4444","Diamond Hand":"#22c55e","Noise Trader":"#6b7280"};
            const c=cols[name]||"#fff";
            return(
              <div key={name} style={{background:"#ffffff05",border:`1px solid ${c}1a`,borderRadius:10,padding:"12px",display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:20,flexShrink:0}}>{icon}</span>
                <div className="orb" style={{fontSize:9,fontWeight:800,color:c,letterSpacing:.4,lineHeight:1.3}}>{name.toUpperCase()}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BATTLE TEASER ── */}
      <div style={{maxWidth:1060,margin:"0 auto",padding:"0 20px 48px"}}>
        <div style={{
          background:"linear-gradient(135deg,#1a0005,#0d001a)",
          border:"1px solid #ef444430",
          borderRadius:16,padding:"28px 24px",
          display:"flex",alignItems:"center",justifyContent:"space-between",
          flexWrap:"wrap",gap:18,
          boxShadow:"0 0 40px #ef444410",
        }}>
          <div>
            <div className="mono" style={{fontSize:10,color:"#ef4444aa",letterSpacing:3,marginBottom:6}}>◈ NEW FEATURE ◈</div>
            <div className="orb" style={{fontSize:"clamp(18px,4vw,26px)",fontWeight:900,color:"#fff",marginBottom:8}}>
              ⚔ WALLET BATTLE
            </div>
            <div className="mono" style={{fontSize:14,color:"#ffffffcc",lineHeight:1.7,maxWidth:400}}>
              Two wallets. One winner. FREUD analyzes both psychologies and declares who the better trader is.
            </div>
          </div>
          <button className="gbtn" onClick={()=>goPage("battle")}
            style={{flexShrink:0,fontSize:13,padding:"14px 28px",
              background:"linear-gradient(135deg,#ef444422,#a855f715)",
              borderColor:"#ef4444aa",color:"#ef4444",
              textShadow:"0 0 10px #ef444480",
              boxShadow:"0 0 24px #ef444428"}}>
            ⚔ START A BATTLE
          </button>
        </div>
      </div>

      {/* ── HOW IT WORKS (SHORT) ── */}
      <div style={{maxWidth:1060,margin:"0 auto",padding:"0 20px 48px"}}>
        <div style={{marginBottom:16,textAlign:"center"}}>
          <div className="mono" style={{fontSize:10,color:"#00e5ffaa",letterSpacing:3,marginBottom:3}}>◈ HOW IT WORKS ◈</div>
          <div className="orb" style={{fontSize:17,fontWeight:900,color:"#fff"}}>3 STEPS. UNDER 30 SECONDS.</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}} className="d3">
          {[
            {n:"01",icon:"⛓",col:"#00e5ff",t:"FETCH",d:"Helius RPC pulls your full Solana transaction history."},
            {n:"02",icon:"🔬",col:"#a855f7",t:"PARSE",d:"Every swap tagged with an emotional signature."},
            {n:"03",icon:"🧠",col:"#00ff88",t:"PROFILE",d:"Claude AI generates your archetype, scores & DNA."},
          ].map(({n,icon,col,t,d})=>(
            <div key={n} className="card" style={{border:`1px solid ${col}1e`,textAlign:"center",padding:"16px 14px",position:"relative"}}>
              <div className="orb" style={{position:"absolute",top:8,right:10,fontSize:24,fontWeight:900,color:`${col}0c`}}>{n}</div>
              <div style={{fontSize:22,marginBottom:8}}>{icon}</div>
              <div className="orb" style={{fontSize:10,fontWeight:800,color:col,letterSpacing:.8,marginBottom:6}}>{t}</div>
              <div className="mono" style={{fontSize:12,color:"#ffffffcc",lineHeight:1.7}}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER — MINIMAL ── */}
      <footer style={{borderTop:"1px solid #ffffff09",padding:"24px 20px"}}>
        <div style={{maxWidth:1060,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
          {/* logo */}
          <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={goHome}>
            <span style={{fontSize:16}}>🧠</span>
            <span className="orb" style={{fontSize:15,fontWeight:900,color:"#00ff88"}}>FREUD</span>
            <span className="mono" style={{fontSize:10,color:"#ffffff40",marginLeft:2}}>v1.0</span>
          </div>
          {/* copyright */}
          <div className="mono" style={{fontSize:11,color:"#ffffff35",textAlign:"center"}}>
            © 2025 FREUD · Solana Psychological Profiler · Not financial advice
          </div>
          {/* social */}
          <div style={{display:"flex",gap:10}}>
            {[
              {icon:"𝕏",  label:"X / Twitter", url:"https://twitter.com"},
              {icon:"💬", label:"Discord",      url:"https://discord.com"},
              {icon:"📣", label:"Telegram",     url:"https://telegram.org"},
            ].map(({icon,label,url})=>(
              <a key={label} href={url} target="_blank" rel="noopener noreferrer" title={label}
                style={{width:32,height:32,borderRadius:7,background:"#ffffff08",border:"1px solid #ffffff14",display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none",fontSize:14,transition:"border-color .2s,background .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#00ff8840";e.currentTarget.style.background="#00ff8810";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="#ffffff14";e.currentTarget.style.background="#ffffff08";}}>
                {icon}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </>)}

    {/* ══════════════════════════════════════
        INNER PAGES (from hamburger)
    ══════════════════════════════════════ */}
    {(page==="mission"||page==="how"||page==="archetypes"||page==="roadmap"||page==="scan"||page==="battle")&&(
      <div style={{maxWidth:860,margin:"0 auto",padding:"40px 20px 90px"}}>
        <button onClick={goHome} style={{background:"transparent",border:"1px solid #ffffff22",borderRadius:7,padding:"7px 14px",cursor:"pointer",color:"#ffffffaa",fontFamily:"'Orbitron',monospace",fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:32}}>← BACK TO HOME</button>

        {/* ── MISSION ── */}
        {page==="mission"&&(<>
          <div className="orb" style={{fontSize:"clamp(20px,4vw,32px)",fontWeight:900,color:"#fff",marginBottom:6}}>MISSION</div>
          <div className="mono" style={{fontSize:13,color:"#ffffffaa",marginBottom:28,lineHeight:1.7}}>The biggest edge in crypto isn't alpha. It's self-awareness.</div>
          <div className="card" style={{border:"1px solid #a855f725",background:"linear-gradient(135deg,#0d0020,#040010)",padding:"28px",marginBottom:16,textAlign:"center"}}>
            <div className="orb" style={{fontSize:"clamp(14px,3vw,18px)",fontWeight:900,color:"#a855f7",letterSpacing:.8,marginBottom:14,textShadow:"0 0 18px #a855f755"}}>
              "Every trade you make is a window into your psychology."
            </div>
            <div className="mono" style={{fontSize:13,color:"#ffffffcc",lineHeight:1.9,marginBottom:12}}>The fear that made you sell at the bottom. The greed that kept you in too long. The FOMO that pulled you into a rug. These aren't market mistakes — they're psychological patterns. FREUD identifies them.</div>
            <div className="mono" style={{fontSize:13,color:"#ffffff70",lineHeight:1.8}}>Built on real Solana on-chain data, powered by Claude AI. No fake scores. No simulations. Just the truth about your trading psychology.</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} className="d2">
            {[{icon:"🔍",col:"#00ff88",t:"Radical Transparency",d:"No flattery. FREUD tells you exactly what your on-chain behavior reveals. If you're an Exit Liquidity provider, you'll know."},
              {icon:"⛓",col:"#00e5ff",t:"On-Chain Truth Only",d:"Every insight comes from real Solana blockchain data via Helius RPC. No simulations. What happened, happened."},
              {icon:"🛡",col:"#f97316",t:"Non-Custodial",d:"Read-only wallet analysis. We access public blockchain data only. Your keys, your funds — always safe."},
              {icon:"🌍",col:"#a855f7",t:"Global Intelligence",d:"Built for every DeFi trader worldwide. From Solana meme degens to institutional observers."},
            ].map(({icon,col,t,d})=>(
              <div key={t} className="card" style={{border:`1px solid ${col}18`,display:"flex",gap:12}}>
                <span style={{fontSize:20,flexShrink:0}}>{icon}</span>
                <div><div className="orb" style={{fontSize:10,fontWeight:800,color:col,letterSpacing:.8,marginBottom:6}}>{t}</div><div className="mono" style={{fontSize:13,color:"#ffffffbb",lineHeight:1.75}}>{d}</div></div>
              </div>
            ))}
          </div>
        </>)}

        {/* ── HOW IT WORKS ── */}
        {page==="how"&&(<>
          <div className="orb" style={{fontSize:"clamp(20px,4vw,32px)",fontWeight:900,color:"#fff",marginBottom:6}}>HOW IT WORKS</div>
          <div className="mono" style={{fontSize:13,color:"#ffffffaa",marginBottom:28,lineHeight:1.7}}>Three-layer AI system that turns raw blockchain noise into psychological clarity.</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}} className="d3">
            {[{n:"01",icon:"⛓",col:"#00e5ff",t:"ON-CHAIN INGESTION",d:"Pulls your complete transaction history via Helius RPC — every SPL swap, Jupiter route, Pump.fun launch, and token account change on Solana mainnet."},
              {n:"02",icon:"🔬",col:"#a855f7",t:"BEHAVIORAL PARSING",d:"Each transaction is decoded and tagged with an emotional signature. FOMO buy? Panic sell? Revenge ape? Every trade contributes to your 9 psychological scores."},
              {n:"03",icon:"🧠",col:"#00ff88",t:"AI PROFILE GENERATION",d:"Claude AI synthesizes your behavioral patterns into an archetype, Wallet DNA fingerprint, danger level, and brutally honest commentary."},
            ].map(({n,icon,col,t,d})=>(
              <div key={n} className="card" style={{border:`1px solid ${col}1e`,position:"relative"}}>
                <div className="orb" style={{position:"absolute",top:12,right:12,fontSize:32,fontWeight:900,color:`${col}0c`}}>{n}</div>
                <div style={{fontSize:24,marginBottom:10}}>{icon}</div>
                <div className="orb" style={{fontSize:10,fontWeight:800,color:col,letterSpacing:.8,marginBottom:8}}>{t}</div>
                <div className="mono" style={{fontSize:13,color:"#ffffffbb",lineHeight:1.8}}>{d}</div>
              </div>
            ))}
          </div>
          <div style={{background:"#ffffff04",border:"1px solid #ffffff0b",borderRadius:14,padding:"20px"}}>
            <div className="orb" style={{fontSize:11,color:"#fff",fontWeight:800,letterSpacing:1.5,marginBottom:14,textAlign:"center"}}>THE 9 PSYCHOLOGICAL SCORES</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:8}}>
              {[{n:"Risk Score",col:"#00ff88",d:"Overall recklessness"},{n:"Emotional Score",col:"#00e5ff",d:"Emotion vs. logic ratio"},{n:"Degeneracy Index",col:"#a855f7",d:"Pure degen level"},{n:"Smart Money",col:"#22c55e",d:"Smart wallet alignment"},{n:"Panic Score",col:"#ef4444",d:"Panic decision rate"},{n:"FOMO Score",col:"#f97316",d:"Late-entry behavior"},{n:"Revenge Score",col:"#a855f7",d:"Loss-chasing tendency"},{n:"Meme Addiction",col:"#00e5ff",d:"Meme token dependency"},{n:"Rug Exposure",col:"#ff3b3b",d:"Historical rug pull rate"}].map(({n,col,d})=>(
                <div key={n} style={{background:"#ffffff04",border:`1px solid ${col}18`,borderRadius:9,padding:"10px"}}>
                  <div className="orb" style={{fontSize:9,fontWeight:800,color:col,letterSpacing:.4,marginBottom:3}}>{n}</div>
                  <div className="mono" style={{fontSize:11,color:"#ffffff60"}}>{d}</div>
                </div>
              ))}
            </div>
          </div>
        </>)}

        {/* ── ARCHETYPES ── */}
        {page==="archetypes"&&(<>
          <div className="orb" style={{fontSize:"clamp(20px,4vw,32px)",fontWeight:900,color:"#fff",marginBottom:6}}>THE 10 ARCHETYPES</div>
          <div className="mono" style={{fontSize:13,color:"#ffffffaa",marginBottom:28,lineHeight:1.7}}>FREUD assigns you one archetype based on your actual on-chain trading behavior. Which one are you?</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}} className="d2">
            {[{icon:"🎯",n:"EXIT LIQUIDITY",col:"#ff3b3b",d:"You have an uncanny ability to buy exactly when smart money is selling. Your entries are other people's exits. Every pump you chase has already peaked."},
              {icon:"🧠",n:"SMART SHADOW",  col:"#00ff88",d:"You don't follow hype — you follow wallets. Systematic pattern of tracking high-performing addresses and mirroring their moves before the crowd notices."},
            ].map(({icon,n,col,d})=>(
              <div key={n} className="card" style={{border:`1px solid ${col}28`,background:`linear-gradient(135deg,${col}07,transparent)`}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}><span style={{fontSize:26}}>{icon}</span><div className="orb" style={{fontSize:12,fontWeight:900,color:col,letterSpacing:.7,textShadow:`0 0 12px ${col}55`}}>{n}</div></div>
                <div className="mono" style={{fontSize:13,color:"#ffffffcc",lineHeight:1.8}}>{d}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:9}}>
            {[{icon:"🚀",n:"FOMO CHASER",col:"#f97316",d:"Always late. Always wrecked. Buys every pump 5 minutes after smart money exits."},
              {icon:"🐋",n:"WHALE PARASITE",col:"#00e5ff",d:"Mirrors large wallet moves with precision. Lives and dies by whale decisions."},
              {icon:"🦍",n:"REVENGE APE",col:"#a855f7",d:"Can't accept losses. Doubles down repeatedly. Small losses become catastrophic ones."},
              {icon:"💊",n:"PUMP.FUN DEGEN",col:"#ff3b3b",d:"Lives in the launch trenches. Snipes new tokens within seconds of creation."},
              {icon:"📉",n:"TOP BUYER",col:"#f97316",d:"Consistently enters positions at local or absolute highs. Perfect — wrong — timing."},
              {icon:"🧲",n:"RUG MAGNET",col:"#ef4444",d:"Finds every honeypot instinctively. Attracted to tokens with exit scam mechanics."},
              {icon:"💎",n:"DIAMOND HAND",col:"#22c55e",d:"Never sells. Whether profit or loss. Holds through 95% crashes without blinking."},
              {icon:"📡",n:"NOISE TRADER",col:"#6b7280",d:"Random. Chaotic. No discernible strategy. Pure impulse, no detectable pattern."},
            ].map(({icon,n,col,d})=>(
              <div key={n} style={{background:"#ffffff04",border:`1px solid ${col}18`,borderRadius:10,padding:"13px",display:"flex",gap:9,alignItems:"flex-start"}}>
                <span style={{fontSize:18,flexShrink:0,marginTop:1}}>{icon}</span>
                <div><div className="orb" style={{fontSize:9,fontWeight:800,color:col,letterSpacing:.5,marginBottom:4}}>{n}</div><div className="mono" style={{fontSize:11,color:"#ffffffaa",lineHeight:1.6}}>{d}</div></div>
              </div>
            ))}
          </div>
        </>)}

        {/* ── ROADMAP ── */}
        {page==="roadmap"&&(<>
          <div className="orb" style={{fontSize:"clamp(20px,4vw,32px)",fontWeight:900,color:"#fff",marginBottom:6}}>ROADMAP</div>
          <div className="mono" style={{fontSize:13,color:"#ffffffaa",marginBottom:28,lineHeight:1.7}}>Building the most powerful on-chain psychological intelligence layer in DeFi.</div>
          <div style={{position:"relative"}}>
            <div style={{position:"absolute",left:18,top:0,bottom:0,width:1,background:"linear-gradient(180deg,#00ff8840,#a855f730,#f9731620,transparent)"}}/>
            {[{q:"Q2 2025",s:"done",  col:"#00ff88",t:"FREUD v1.0 Launch",      items:["Wallet psychology profiler","9 behavioral scores","10 trader archetypes","AI commentary engine","X / Twitter share cards"]},
              {q:"Q3 2025",s:"active",col:"#00e5ff",t:"Live Data Integration",   items:["Helius RPC real-time data","Jupiter swap parsing","Pump.fun tracking","Wallet DNA fingerprinting","Global leaderboard"]},
              {q:"Q4 2025",s:"soon",  col:"#a855f7",t:"FREUD Token Launch",      items:["FREUD token on Solana","Holder premium features","Portfolio tracker","Wallet comparison tool","Developer API"]},
              {q:"Q1 2026",s:"soon",  col:"#f97316",t:"Intelligence Network",    items:["Cross-wallet pattern detection","Whale monitoring alerts","AI trade risk scoring","Mobile app iOS & Android","Multi-chain expansion"]},
            ].map(({q,s,col,t,items})=>(
              <div key={q} style={{display:"flex",gap:18,marginBottom:24,position:"relative"}}>
                <div style={{width:38,flexShrink:0,display:"flex",justifyContent:"center"}}>
                  <div style={{width:15,height:15,borderRadius:"50%",marginTop:5,background:s==="soon"?"#ffffff0f":col,border:`2px solid ${col}`,boxShadow:s!=="soon"?`0 0 12px ${col}70`:"none",animation:s==="active"?"pulse 1.4s infinite":"none"}}/>
                </div>
                <div className="card" style={{flex:1,border:`1px solid ${col}1e`}}>
                  <div style={{display:"flex",gap:9,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
                    <span className="mono" style={{fontSize:10,color:col,letterSpacing:2}}>{q}</span>
                    <span className="mono" style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:s==="done"?"#00ff8816":s==="active"?"#00e5ff14":"#ffffff0a",color:s==="done"?"#00ff88":s==="active"?"#00e5ff":"#ffffff45",border:`1px solid ${s==="done"?"#00ff8830":s==="active"?"#00e5ff30":"#ffffff15"}`}}>
                      {s==="done"?"✓ COMPLETE":s==="active"?"▶ IN PROGRESS":"◇ UPCOMING"}
                    </span>
                  </div>
                  <div className="orb" style={{fontSize:13,fontWeight:800,color:"#fff",letterSpacing:.8,marginBottom:10}}>{t}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    {items.map(it=>(
                      <div key={it} className="mono" style={{fontSize:12,color:"#ffffffbb",display:"flex",gap:7,alignItems:"center"}}>
                        <span style={{color:col,fontSize:7}}>◆</span>{it}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>)}

        {/* ── WALLET SAVAŞI ── */}
        {page==="battle"&&(<>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div className="mono" style={{fontSize:10,color:"#ef4444aa",letterSpacing:3,marginBottom:6}}>◈ WALLET BATTLE ◈</div>
            <div className="orb" style={{fontSize:"clamp(22px,5vw,36px)",fontWeight:900,color:"#fff",marginBottom:10}}>
              ⚔ WHO IS THE BETTER TRADER?
            </div>
            <div className="mono" style={{fontSize:14,color:"#ffffffcc",lineHeight:1.7,maxWidth:480,margin:"0 auto"}}>
              Enter two Solana wallets. FREUD analyzes both psychologies and declares a winner.
            </div>
          </div>

          {/* inputs */}
          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:12,alignItems:"center",marginBottom:16}} className="d2" >
            {/* wallet 1 */}
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{width:28,height:28,borderRadius:6,background:"linear-gradient(135deg,#00ff88,#00e5ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#000"}}>A</div>
                <div className="orb" style={{fontSize:11,color:"#00ff88",fontWeight:800,letterSpacing:1}}>WALLET ALPHA</div>
              </div>
              <input className="isol"
                style={{borderColor: isValidSolana(bW1)?"#00ff8866":bW1?"#ff3b3b44":"#00ff8830",
                  color: bW1&&!isValidSolana(bW1)?"#ff6b6b":"#f0fff8"}}
                placeholder="Solana address..."
                value={bW1} onChange={e=>setBW1(e.target.value)}/>
              {bW1&&!isValidSolana(bW1)&&<div className="mono" style={{fontSize:11,color:"#ff6b6b",marginTop:5}}>⚠ Invalid address</div>}
              {isValidSolana(bW1)&&<div className="mono" style={{fontSize:11,color:"#00ff88aa",marginTop:5}}>✓ Valid</div>}
            </div>

            {/* VS */}
            <div style={{textAlign:"center",padding:"0 8px"}}>
              <div className="orb" style={{fontSize:22,fontWeight:900,color:"#ef4444",textShadow:"0 0 20px #ef444460",animation:"pulse 2s infinite"}}>VS</div>
            </div>

            {/* wallet 2 */}
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{width:28,height:28,borderRadius:6,background:"linear-gradient(135deg,#a855f7,#00e5ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#000"}}>B</div>
                <div className="orb" style={{fontSize:11,color:"#a855f7",fontWeight:800,letterSpacing:1}}>WALLET BETA</div>
              </div>
              <input className="isol"
                style={{borderColor: isValidSolana(bW2)?"#a855f766":bW2?"#ff3b3b44":"#a855f730",
                  color: bW2&&!isValidSolana(bW2)?"#ff6b6b":"#f0fff8"}}
                placeholder="Solana address..."
                value={bW2} onChange={e=>setBW2(e.target.value)}/>
              {bW2&&!isValidSolana(bW2)&&<div className="mono" style={{fontSize:11,color:"#ff6b6b",marginTop:5}}>⚠ Invalid address</div>}
              {isValidSolana(bW2)&&<div className="mono" style={{fontSize:11,color:"#a855f7aa",marginTop:5}}>✓ Valid</div>}
            </div>
          </div>

          {/* battle button */}
          <div style={{textAlign:"center",marginBottom:24}}>
            <button className="gbtn" onClick={runBattle}
              disabled={bBusy||!isValidSolana(bW1)||!isValidSolana(bW2)}
              style={{fontSize:14,padding:"15px 40px",
                background:"linear-gradient(135deg,#ef444422,#a855f718)",
                borderColor:"#ef4444aa",color:"#ef4444",
                textShadow:"0 0 10px #ef444488",
                boxShadow:"0 0 28px #ef444430"}}>
              {bBusy?"ANALYZING...":"⚔ START BATTLE"}
            </button>
          </div>

          {/* scanning */}
          {bBusy&&(
            <div style={{textAlign:"center",padding:"24px 0",animation:"fu .4s ease"}}>
              <div style={{width:64,height:64,margin:"0 auto 16px",border:"2px solid #ef444420",borderTop:"2px solid #ef4444",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
              <div className="orb" style={{fontSize:11,color:"#ef4444",letterSpacing:3,marginBottom:12}}>BATTLE ANALYSIS IN PROGRESS</div>
              <div style={{maxWidth:360,margin:"0 auto 12px"}}>
                {BSTEPS.map((s,i)=>(
                  <div key={i} className="mono" style={{fontSize:11,padding:"3px 0",textAlign:"left",transition:"color .4s",
                    color:i<bStep?"#ef444468":i===bStep?"#ef4444":"#ffffff28"}}>
                    {i<bStep?"✓ ":i===bStep?"▶ ":"  "}{s}
                  </div>
                ))}
              </div>
              <div style={{maxWidth:360,margin:"0 auto",height:2,background:"#ffffff08",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",background:"linear-gradient(90deg,#ef4444,#a855f7)",
                  width:`${(bStep/BSTEPS.length)*100}%`,transition:"width .5s",boxShadow:"0 0 8px #ef4444"}}/>
              </div>
            </div>
          )}

          {/* RESULT */}
          {bResult&&!bBusy&&(
            <div style={{animation:"fu .6s ease"}}>
              {/* winner banner */}
              <div style={{
                textAlign:"center",padding:"20px",marginBottom:18,
                background:`linear-gradient(135deg,${bResult.winner===1?"#00ff8808":"#a855f708"},transparent)`,
                border:`1px solid ${bResult.winner===1?"#00ff8830":"#a855f730"}`,
                borderRadius:14,
              }}>
                <div className="mono" style={{fontSize:11,color:"#ffffff60",letterSpacing:3,marginBottom:6}}>◈ BATTLE RESULT ◈</div>
                <div className="orb" style={{fontSize:"clamp(18px,4vw,28px)",fontWeight:900,marginBottom:6,
                  color:bResult.winner===1?"#00ff88":"#a855f7",
                  textShadow:`0 0 24px ${bResult.winner===1?"#00ff88":"#a855f7"}`}}>
                  WALLET {bResult.winner===1?"A":"B"} WINS ⚔
                </div>
                <div className="mono" style={{fontSize:13,color:"#ffffffcc",lineHeight:1.7}}>{bResult.verdict}</div>
              </div>

              {/* side by side scores */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}} className="d2">
                {[bResult.w1,bResult.w2].map((w,wi)=>{
                  const isWinner=bResult.winner===wi+1;
                  const acol=wi===0?"#00ff88":"#a855f7";
                  const letter=wi===0?"A":"B";
                  return(
                    <div key={wi} className="card" style={{
                      border:`2px solid ${isWinner?acol+"60":acol+"20"}`,
                      background:`linear-gradient(135deg,${acol}06,transparent)`,
                      position:"relative",
                    }}>
                      {isWinner&&(
                        <div style={{position:"absolute",top:-10,right:12,
                          background:acol,color:"#000",
                          fontFamily:"'Orbitron',monospace",fontSize:9,fontWeight:900,
                          padding:"3px 10px",borderRadius:20,letterSpacing:1}}>
                          WINNER ⚔
                        </div>
                      )}
                      {/* header */}
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                        <div style={{width:32,height:32,borderRadius:7,
                          background:`linear-gradient(135deg,${acol},${acol}88)`,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontFamily:"'Orbitron',monospace",fontSize:14,fontWeight:900,color:"#000"}}>
                          {letter}
                        </div>
                        <div>
                          <div className="mono" style={{fontSize:11,color:"#ffffff70"}}>{w.addr}</div>
                          <div className="orb" style={{fontSize:11,fontWeight:800,color:acol}}>{AI[w.arch]||"🎰"} {w.arch}</div>
                        </div>
                      </div>
                      <DBadge l={w.danger}/>
                      {/* score bars */}
                      <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:7}}>
                        {[
                          ["SMART MONEY", w.scores.smart,  "#22c55e"],
                          ["RISK",        w.scores.risk,   "#00ff88"],
                          ["FOMO",        w.scores.fomo,   "#f97316"],
                          ["PANIC",       w.scores.panic,  "#ef4444"],
                          ["DEGEN",       w.scores.degen,  "#a855f7"],
                          ["REVENGE",     w.scores.revenge,"#7c3aed"],
                        ].map(([l,v,c])=>(
                          <div key={l}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                              <span className="mono" style={{fontSize:10,color:"#ffffffaa"}}>{l}</span>
                              <span className="mono" style={{fontSize:10,color:v>75?"#ff3b3b":c,fontWeight:700}}>{v}</span>
                            </div>
                            <div style={{height:4,background:"#ffffff0f",borderRadius:2,overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${v}%`,borderRadius:2,
                                background:`linear-gradient(90deg,${(v>75?"#ff3b3b":c)}80,${v>75?"#ff3b3b":c})`,
                                boxShadow:`0 0 6px ${v>75?"#ff3b3b":c}70`,transition:"width 1s ease"}}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* share button */}
              <div style={{textAlign:"center"}}>
                <button className="gbtn"
                  style={{borderColor:"#a855f766",color:"#a855f7",textShadow:"0 0 8px #a855f770",boxShadow:"0 0 18px #a855f725"}}
                  onClick={()=>{
                    const t=`⚔ FREUD Wallet Battle\n\nWallet A (${bResult.w1.addr}): ${bResult.w1.arch}\nWallet B (${bResult.w2.addr}): ${bResult.w2.arch}\n\n🏆 WINNER: Wallet ${bResult.winner===1?"A":"B"}\n\n${bResult.verdict}\n\nfreudai.com — Solana Psychological Profiler`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}`,"_blank");
                  }}>
                  SHARE ON 𝕏
                </button>
                <button onClick={()=>{setBResult(null);setBW1("");setBW2("");}}
                  style={{marginLeft:10,background:"transparent",border:"1px solid #ffffff20",borderRadius:8,padding:"11px 20px",cursor:"pointer",color:"#ffffffaa",fontFamily:"'Orbitron',monospace",fontSize:11,fontWeight:700,letterSpacing:1}}>
                  ↺ NEW BATTLE
                </button>
              </div>
            </div>
          )}
        </>)}

        {/* ── SCAN PAGE ── */}
        {page==="scan"&&(<>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:14}}><Radar s={110}/></div>
            <div className="orb" style={{fontSize:"clamp(18px,4vw,28px)",fontWeight:900,color:"#fff",marginBottom:8}}>SCAN A WALLET</div>
            <div className="mono" style={{fontSize:14,color:"#ffffffcc",lineHeight:1.7}}>Enter any Solana wallet address to generate a full psychological profile.</div>
          </div>
          <div style={{background:"#000d1a",border:`1px solid ${wBad?"#ff3b3b44":"#00ff8832"}`,borderRadius:12,padding:3,display:"flex",gap:3,marginBottom:7}}>
            <input className="isol" style={{border:"none",background:"transparent",color:wBad?"#ff6b6b":"#e0ffe8"}}
              placeholder="Enter Solana wallet address..."
              value={wallet} onChange={e=>{setWallet(e.target.value);setErr("");}}
              onKeyDown={e=>e.key==="Enter"&&scan()}/>
            <button className="gbtn" onClick={scan} disabled={!!wBad||!wOk||busy} style={{fontSize:11,padding:"0 18px",borderRadius:8}}>
              {busy?"...":"SCAN"}
            </button>
          </div>
          {wBad&&<div className="mono" style={{fontSize:12,color:"#ff6b6b",textAlign:"center",marginBottom:8}}>⚠ Invalid — base58 Solana wallet (32–44 chars)</div>}
          {wOk&&!busy&&!err&&<div className="mono" style={{fontSize:12,color:"#00ff88aa",textAlign:"center",marginBottom:8}}>✓ Valid address — press SCAN</div>}
          {busy&&(
            <div style={{textAlign:"center",padding:"28px 0"}}>
              <div style={{width:60,height:60,margin:"0 auto 16px",border:"2px solid #00ff8820",borderTop:"2px solid #00ff88",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
              <div className="orb" style={{fontSize:11,color:"#00ff88",letterSpacing:3,marginBottom:12}}>SCANNING NEURAL PATTERNS</div>
              <div style={{maxWidth:360,margin:"0 auto 12px"}}>
                {STEPS.map((s,i)=>(
                  <div key={i} className="mono" style={{fontSize:11,padding:"3px 0",textAlign:"left",color:i<step?"#00ff8868":i===step?"#00ff88":"#ffffff28"}}>{i<step?"✓ ":i===step?"▶ ":"  "}{s}</div>
                ))}
              </div>
              <div style={{maxWidth:360,margin:"0 auto",height:2,background:"#ffffff08",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",background:"linear-gradient(90deg,#00ff88,#00e5ff)",width:`${(step/STEPS.length)*100}%`,transition:"width .5s",boxShadow:"0 0 8px #00ff88"}}/>
              </div>
            </div>
          )}
          {err&&!busy&&(
            <div style={{marginTop:14,background:"linear-gradient(135deg,#1a0000,#0d0005)",border:"1px solid #ff3b3b28",borderRadius:10,padding:"16px"}}>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:18,animation:"pulse 1.5s infinite"}}>⚠</span>
                <div className="orb" style={{fontSize:11,fontWeight:800,color:"#ff3b3b"}}>SCAN FAILED</div>
              </div>
              <div className="mono" style={{fontSize:12,color:"#ffffffcc",lineHeight:1.7,marginBottom:10}}>{err}</div>
              <div style={{display:"flex",gap:8}}>
                <button className="gbtn" onClick={scan} style={{flex:1,justifyContent:"center",fontSize:10}}>↻ RETRY</button>
                <button onClick={()=>{setErr("");setWallet("");}} style={{flex:1,background:"transparent",border:"1px solid #ffffff22",borderRadius:8,color:"#ffffffaa",fontFamily:"'Orbitron',monospace",fontSize:10,fontWeight:700,cursor:"pointer",letterSpacing:1}}>← CLEAR</button>
              </div>
            </div>
          )}
          {!busy&&!err&&(
            <div style={{marginTop:20,background:"#00061a",border:"1px solid #00e5ff18",borderRadius:12,padding:"14px"}}>
              <div className="orb" style={{fontSize:9,color:"#00e5ffcc",letterSpacing:1.5,marginBottom:10}}>⬡ DEPLOYMENT REQUIREMENTS</div>
              {[{icon:"🔑",l:"Helius API Key",d:"Free at helius.dev",link:"https://helius.dev"},{icon:"🤖",l:"Claude API Key",d:"console.anthropic.com",link:"https://console.anthropic.com"},{icon:"☁",l:"Vercel Account",d:"Free hosting + serverless",link:"https://vercel.com"}].map(({icon,l,d,link})=>(
                <div key={l} style={{display:"flex",gap:10,alignItems:"center",padding:"7px 0",borderBottom:"1px solid #ffffff07"}}>
                  <span style={{fontSize:14}}>{icon}</span>
                  <div style={{flex:1}}><div className="orb" style={{fontSize:10,color:"#fff",fontWeight:700}}>{l}</div><div className="mono" style={{fontSize:10,color:"#ffffff50"}}>{d}</div></div>
                  <a href={link} target="_blank" rel="noopener noreferrer" style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#00e5ff",textDecoration:"none",border:"1px solid #00e5ff25",padding:"3px 9px",borderRadius:5}}>GET →</a>
                </div>
              ))}
            </div>
          )}
        </>)}
      </div>
    )}

  </div>
  </>);
}
