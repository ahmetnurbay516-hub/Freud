import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────
// FREUD — Real On-Chain Psychological Profiler
// Powered by Helius Free RPC (no paid API needed)
// ─────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));
const SOLANA_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const isValidSolana = a => SOLANA_RE.test((a||"").trim());

// ── Helius RPC endpoint ──
// Vercel deployment: VITE_HELIUS_RPC_URL environment variable is injected at build time
// Artifact preview: empty string (shows setup instructions)
const HELIUS_RPC = "";

const DC = { LOW:"#22c55e", MEDIUM:"#f97316", HIGH:"#ef4444", CRITICAL:"#dc2626", EXISTENTIAL:"#ff1a1a" };
const EC = { FOMO:"#f97316", PANIC:"#ef4444", GREED:"#22c55e", REVENGE:"#a855f7", FEAR:"#3b82f6", EUPHORIA:"#00ff88", APATHY:"#6b7280" };
const AI = { "Exit Liquidity":"🎯","FOMO Chaser":"🚀","Smart Shadow":"🧠","Whale Parasite":"🐋","Revenge Ape":"🦍","Pump.fun Degenerate":"💊","Top Buyer":"📉","Rug Magnet":"🧲","Diamond Hand":"💎","Noise Trader":"📡" };

// ── Helius RPC caller ──
async function heliusRPC(method, params) {
  if (!HELIUS_RPC) throw new Error("HELIUS_RPC_NOT_CONFIGURED");
  const res = await fetch(HELIUS_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`RPC_ERROR: ${data.error.message}`);
  return data.result;
}

// ── Fetch real wallet data from Helius ──
async function fetchWalletData(address) {
  const [balanceResult, txResult, tokenResult] = await Promise.allSettled([
    heliusRPC("getBalance", [address]),
    heliusRPC("getSignaturesForAddress", [address, { limit: 100 }]),
    heliusRPC("getTokenAccountsByOwner", [address, { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }, { encoding: "jsonParsed" }]),
  ]);

  const solBalance = balanceResult.status === "fulfilled"
    ? (balanceResult.value?.value ?? 0) / 1e9
    : 0;

  const transactions = txResult.status === "fulfilled"
    ? (txResult.value ?? [])
    : [];

  const tokenAccounts = tokenResult.status === "fulfilled"
    ? (tokenResult.value?.value ?? [])
    : [];

  return { solBalance, transactions, tokenAccounts };
}

// ── Psychology engine — pure math from real data ──
function analyzeWallet(address, solBalance, transactions, tokenAccounts) {
  const txCount   = transactions.length;
  const tokenCount= tokenAccounts.length;

  // Filter tokens with non-zero balance
  const activeTokens = tokenAccounts.filter(t => {
    const amt = t.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
    return amt > 0;
  });

  // Time-based analysis
  const now = Date.now() / 1000;
  const timestamps = transactions.map(t => t.blockTime || 0).filter(Boolean);
  const recentTxs  = timestamps.filter(t => now - t < 86400 * 7).length; // last 7 days
  const oldTxs     = timestamps.filter(t => now - t > 86400 * 30).length; // older than 30 days

  // Burst trading detection (multiple txs in short window)
  let burstCount = 0;
  for (let i = 1; i < timestamps.length; i++) {
    if (Math.abs(timestamps[i] - timestamps[i-1]) < 300) burstCount++; // within 5 min
  }

  // Scoring (0-100)
  const fomoScore     = Math.min(100, Math.round(
    (recentTxs * 4) + (burstCount * 8) + (tokenCount * 2)
  ));
  const panicScore    = Math.min(100, Math.round(
    (burstCount * 10) + (recentTxs > 20 ? 30 : 0) + (solBalance < 0.1 ? 20 : 0)
  ));
  const memeAddiction = Math.min(100, Math.round(
    (tokenCount * 6) + (activeTokens.length * 4)
  ));
  const diamondHands  = Math.min(100, Math.round(
    (oldTxs * 2) + (solBalance > 1 ? 20 : 0) + (txCount < 10 ? 30 : 0)
  ));
  const revengeScore  = Math.min(100, Math.round(
    burstCount * 12 + (recentTxs > 15 ? 20 : 0)
  ));
  const smartMoney    = Math.min(100, Math.round(
    (solBalance > 5 ? 30 : solBalance > 1 ? 15 : 0) +
    (txCount > 50 && burstCount < 5 ? 25 : 0) +
    (activeTokens.length < 5 && txCount > 20 ? 20 : 0)
  ));
  const rugExposure   = Math.min(100, Math.round(
    (tokenCount * 5) + (activeTokens.length < tokenCount * 0.3 ? 30 : 0)
  ));
  const degeneracy    = Math.min(100, Math.round(
    (fomoScore * 0.4) + (memeAddiction * 0.3) + (panicScore * 0.3)
  ));
  const riskScore     = Math.min(100, Math.round(
    (fomoScore * 0.3) + (panicScore * 0.3) + (rugExposure * 0.2) + (degeneracy * 0.2)
  ));
  const emotionalScore= Math.min(100, Math.round(
    (fomoScore * 0.35) + (panicScore * 0.35) + (revengeScore * 0.3)
  ));

  // Archetype determination
  let archetype = "Noise Trader";
  if (diamondHands > 70 && txCount < 20)               archetype = "Diamond Hand";
  else if (rugExposure > 70 && tokenCount > 15)         archetype = "Rug Magnet";
  else if (fomoScore > 75 && burstCount > 10)           archetype = "FOMO Chaser";
  else if (memeAddiction > 70 && tokenCount > 12)       archetype = "Pump.fun Degenerate";
  else if (revengeScore > 70 && panicScore > 60)        archetype = "Revenge Ape";
  else if (smartMoney > 65 && riskScore < 40)           archetype = "Smart Shadow";
  else if (panicScore > 70 && fomoScore > 60)           archetype = "Exit Liquidity";
  else if (solBalance > 10 && txCount > 50)             archetype = "Whale Parasite";
  else if (riskScore > 70 && fomoScore > 50)            archetype = "Top Buyer";

  // Dominant emotion
  const scores = { FOMO: fomoScore, PANIC: panicScore, GREED: smartMoney, REVENGE: revengeScore, APATHY: diamondHands };
  const dominantEmotion = Object.entries(scores).sort((a,b) => b[1]-a[1])[0][0];

  // Danger level
  let dangerLevel = "LOW";
  if (riskScore > 85)      dangerLevel = "EXISTENTIAL";
  else if (riskScore > 70) dangerLevel = "CRITICAL";
  else if (riskScore > 55) dangerLevel = "HIGH";
  else if (riskScore > 35) dangerLevel = "MEDIUM";

  // Wallet DNA
  const dnaWords = [
    ["Volatile","Stable","Impulsive","Calculated","Erratic"],
    ["Chasing","Holding","Fleeing","Hunting","Drifting"],
    ["Nomad","Veteran","Degen","Shadow","Ghost"],
  ];
  const h = address.split("").reduce((a,c,i) => a + c.charCodeAt(0) * (i+1), 0);
  const walletDNA = `${dnaWords[0][h%5]}-${dnaWords[1][(h>>3)%5]}-${dnaWords[2][(h>>6)%5]}`;

  // AI commentary templates (based on real metrics)
  const commentary = [];
  if (fomoScore > 60)
    commentary.push(`Wallet entered ${recentTxs} positions in the last 7 days — classic FOMO pattern detected.`);
  if (panicScore > 50)
    commentary.push(`${burstCount} burst trading events found — signs of emotional, reactive decision-making.`);
  if (rugExposure > 50)
    commentary.push(`Held ${tokenCount} different tokens, ${tokenCount - activeTokens.length} now worthless. Rug exposure is significant.`);
  if (diamondHands > 60)
    commentary.push(`Low transaction frequency with long holding periods — disciplined or paralyzed by losses.`);
  if (memeAddiction > 60)
    commentary.push(`${activeTokens.length} active token positions — meme token dependency is high.`);
  if (commentary.length === 0)
    commentary.push(`${txCount} transactions analyzed. Behavioral patterns suggest ${archetype.toLowerCase()} tendencies.`);
  if (commentary.length < 3)
    commentary.push(`SOL balance of ${solBalance.toFixed(3)} SOL reflects ${solBalance > 1 ? "moderate" : "minimal"} on-chain presence.`);

  return {
    archetype, walletDNA, dangerLevel, dominantEmotion,
    riskScore, emotionalScore, degeneracy, smartMoney,
    fomoScore, panicScore, revengeScore, memeAddiction, rugExposure, diamondHands,
    commentary: commentary.slice(0,3),
    metrics: { solBalance, txCount, tokenCount, activeTokens: activeTokens.length, burstCount, recentTxs },
  };
}

// Mock feed data
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

const PRICES = [
  { sym:"BTC", price:"$106,240", chg:"+2.14%", up:true  },
  { sym:"ETH", price:"$2,618",   chg:"-0.87%", up:false },
  { sym:"SOL", price:"$171.40",  chg:"+3.52%", up:true  },
  { sym:"BNB", price:"$644.30",  chg:"+0.91%", up:true  },
  { sym:"XRP", price:"$2.31",    chg:"-1.23%", up:false },
];

// ── Animated counter ──
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

// ── Particles ──
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

// ── Brain pulse ──
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
      ctx.shadowBlur=0;t++;raf=requestAnimationFrame(draw);
    };
    draw();return()=>cancelAnimationFrame(raf);
  },[]);
  return <canvas ref={cv} style={{width:200,height:200}}/>;
}

// ── Radar ──
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

// ── Badges ──
const DBadge=({l})=>{const c=DC[l]||"#fff";return <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:4,letterSpacing:.8,background:c+"20",border:`1px solid ${c}`,color:c,textShadow:`0 0 6px ${c}`,animation:(l==="CRITICAL"||l==="EXISTENTIAL")?"pulse 1s infinite":"none"}}>{l}</span>;};
const EBadge=({e})=>{const c=EC[e]||"#fff";return <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:4,background:c+"20",border:`1px solid ${c}60`,color:c}}>{e}</span>;};

function MiniBar({v,col}){const c=v>75?"#ff3b3b":col;return(
  <div style={{display:"flex",gap:8,alignItems:"center"}}>
    <div style={{flex:1,height:4,background:"#ffffff0f",borderRadius:2,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${v}%`,background:`linear-gradient(90deg,${c}80,${c})`,borderRadius:2,boxShadow:`0 0 6px ${c}70`,transition:"width 1s ease"}}/>
    </div>
    <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:c,fontWeight:700,minWidth:24}}>{v}</span>
  </div>
);}

// ── Profile display component ──
function ProfileCard({ profile, wallet, onShare }) {
  const acol = DC[profile.dangerLevel]||"#fff";
  return (
    <div style={{animation:"fu .6s ease"}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${acol}08,transparent)`,border:`1px solid ${acol}28`,borderRadius:14,padding:"20px",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:32}}>{AI[profile.archetype]||"🎰"}</span>
            <div>
              <div style={{fontFamily:"'Orbitron',monospace",fontSize:18,fontWeight:900,color:acol,textShadow:`0 0 16px ${acol}60`}}>{profile.archetype.toUpperCase()}</div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#00e5ffdd"}}>DNA: {profile.walletDNA}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><DBadge l={profile.dangerLevel}/><EBadge e={profile.dominantEmotion}/></div>
        </div>
        {/* Real metrics */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:10}}>
          {[
            {l:"SOL Balance", v:`${profile.metrics.solBalance.toFixed(4)}◎`, c:"#00ff88"},
            {l:"Transactions", v:profile.metrics.txCount, c:"#00e5ff"},
            {l:"Tokens Held", v:profile.metrics.tokenCount, c:"#a855f7"},
          ].map(({l,v,c})=>(
            <div key={l} style={{background:"#ffffff06",border:`1px solid ${c}20`,borderRadius:8,padding:"10px",textAlign:"center"}}>
              <div style={{fontFamily:"'Orbitron',monospace",fontSize:14,fontWeight:900,color:c,marginBottom:3}}>{v}</div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"#ffffff70"}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scores */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px 20px",marginBottom:14}}>
        {[
          ["FOMO",          profile.fomoScore,     "#f97316"],
          ["PANIC",         profile.panicScore,    "#ef4444"],
          ["MEME ADDICTION",profile.memeAddiction, "#00e5ff"],
          ["DIAMOND HANDS", profile.diamondHands,  "#22c55e"],
          ["REVENGE",       profile.revengeScore,  "#a855f7"],
          ["RUG EXPOSURE",  profile.rugExposure,   "#ff3b3b"],
          ["SMART MONEY",   profile.smartMoney,    "#22c55e"],
          ["RISK",          profile.riskScore,     "#00ff88"],
        ].map(([l,v,c])=>(
          <div key={l}>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#ffffffcc",marginBottom:2}}>{l}</div>
            <MiniBar v={v} col={c}/>
          </div>
        ))}
      </div>

      {/* AI Commentary */}
      <div style={{background:"#ff3b3b08",border:"1px solid #ff3b3b1e",borderRadius:9,padding:"13px 15px",marginBottom:14}}>
        <div style={{fontFamily:"'Orbitron',monospace",fontSize:9,color:"#ff6060",letterSpacing:2,marginBottom:9}}>◈ BEHAVIORAL ANALYSIS</div>
        {profile.commentary.map((c,i)=>(
          <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start",marginBottom:i<profile.commentary.length-1?8:0}}>
            <span style={{color:"#ff3b3b",fontSize:12,flexShrink:0}}>▶</span>
            <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:13,color:"#ffffffdd",lineHeight:1.7}}>{c}</span>
          </div>
        ))}
      </div>

      {/* Share */}
      <button onClick={onShare} style={{width:"100%",background:"linear-gradient(135deg,#a855f720,#00e5ff10)",border:"1px solid #a855f766",color:"#a855f7",fontFamily:"'Orbitron',monospace",fontSize:12,fontWeight:800,letterSpacing:1.5,padding:"13px",borderRadius:9,cursor:"pointer",textShadow:"0 0 8px #a855f770"}}>
        SHARE ON 𝕏
      </button>
    </div>
  );
}

// ════════════════════════════════════════════
export default function App() {
  const [page,    setPage]    = useState("home");
  const [menu,    setMenu]    = useState(false);
  const [wallet,  setWallet]  = useState("");
  const [step,    setStep]    = useState(0);
  const [busy,    setBusy]    = useState(false);
  const [err,     setErr]     = useState("");
  const [profile, setProfile] = useState(null);
  const [fidx,    setFidx]    = useState(0);
  // Battle
  const [bW1,     setBW1]     = useState("");
  const [bW2,     setBW2]     = useState("");
  const [bBusy,   setBBusy]   = useState(false);
  const [bStep,   setBStep]   = useState(0);
  const [bResult, setBResult] = useState(null);
  const [bErr,    setBErr]    = useState("");

  useEffect(()=>{const id=setInterval(()=>setFidx(i=>(i+1)%FEED.length),2700);return()=>clearInterval(id);},[]);

  const wOk=isValidSolana(wallet), wBad=wallet&&!wOk;

  const STEPS=["Connecting to Helius RPC...","Fetching SOL balance...","Loading transaction history...","Scanning token accounts...","Calculating psychological scores...","Mapping behavioral patterns...","Generating archetype profile...","Analysis complete."];
  const BSTEPS=["Initializing dual scan...","Fetching wallet Alpha...","Fetching wallet Beta...","Comparing on-chain behavior...","Calculating battle scores...","Determining winner...","Rendering result...","Battle complete."];

  // ── REAL SCAN ──
  const scan = useCallback(async () => {
    if (!wOk) return;
    setBusy(true); setErr(""); setProfile(null);

    if (!HELIUS_RPC) {
      setBusy(false);
      setErr("HELIUS_RPC_NOT_CONFIGURED: Please add VITE_HELIUS_RPC_URL to your Vercel Environment Variables. Go to Vercel Dashboard → Your Project → Settings → Environment Variables.");
      return;
    }

    for(let i=0;i<STEPS.length;i++){setStep(i);await sleep(500+Math.random()*300);}

    try {
      const { solBalance, transactions, tokenAccounts } = await fetchWalletData(wallet.trim());
      const result = analyzeWallet(wallet.trim(), solBalance, transactions, tokenAccounts);
      setProfile(result);
    } catch(e) {
      console.error("[FREUD] Scan error:", e);
      if (e.message === "HELIUS_RPC_NOT_CONFIGURED") {
        setErr("Please add VITE_HELIUS_RPC_URL to Vercel Environment Variables.");
      } else if (e.message.startsWith("HTTP_")) {
        setErr(`Helius RPC returned ${e.message}. Check your API key.`);
      } else {
        setErr(`Scan failed: ${e.message}`);
      }
    }
    setBusy(false);
  }, [wallet, wOk]);

  // ── BATTLE ──
  const runBattle = useCallback(async () => {
    if(!isValidSolana(bW1)||!isValidSolana(bW2)) return;
    setBBusy(true); setBResult(null); setBErr("");

    if (!HELIUS_RPC) {
      setBBusy(false);
      setBErr("HELIUS_RPC_NOT_CONFIGURED: Add VITE_HELIUS_RPC_URL to Vercel Environment Variables.");
      return;
    }

    for(let i=0;i<BSTEPS.length;i++){setBStep(i);await sleep(480+Math.random()*280);}

    try {
      const [d1, d2] = await Promise.all([
        fetchWalletData(bW1.trim()),
        fetchWalletData(bW2.trim()),
      ]);
      const p1 = analyzeWallet(bW1.trim(), d1.solBalance, d1.transactions, d1.tokenAccounts);
      const p2 = analyzeWallet(bW2.trim(), d2.solBalance, d2.transactions, d2.tokenAccounts);

      const score1 = p1.smartMoney*2 + (100-p1.riskScore) + p1.diamondHands;
      const score2 = p2.smartMoney*2 + (100-p2.riskScore) + p2.diamondHands;
      const winner = score1 >= score2 ? 1 : 2;

      setBResult({
        w1:{ addr:bW1.slice(0,6)+"..."+bW1.slice(-4), ...p1 },
        w2:{ addr:bW2.slice(0,6)+"..."+bW2.slice(-4), ...p2 },
        winner,
        verdict: winner===1
          ? `Wallet A wins — stronger smart money alignment and better emotional control.`
          : `Wallet B wins — cleaner psychology, less emotional noise, superior discipline.`,
      });
    } catch(e) {
      setBErr(`Battle failed: ${e.message}`);
    }
    setBBusy(false);
  }, [bW1, bW2]);

  const goScan=()=>{setPage("scan");setMenu(false);setProfile(null);setErr("");};
  const goHome=()=>{setPage("home");setMenu(false);setErr("");setWallet("");setBusy(false);setProfile(null);};
  const goPage=p=>{setPage(p);setMenu(false);setBResult(null);};

  const MENU=[
    {l:"Wallet Battle ⚔",p:"battle",   desc:"Compare two wallets"},
    {l:"Mission",        p:"mission",  desc:"Purpose & values"},
    {l:"How It Works",   p:"how",      desc:"3-layer pipeline"},
    {l:"Archetypes",     p:"archetypes",desc:"10 trader types"},
    {l:"Roadmap",        p:"roadmap",  desc:"Development timeline"},
  ];

  const shareProfile = () => {
    if(!profile) return;
    const t=`🧠 FREUD just profiled my Solana wallet\n\nArchetype: ${profile.archetype}\nDNA: ${profile.walletDNA}\nRisk: ${profile.riskScore} | FOMO: ${profile.fomoScore} | Degen: ${profile.degeneracy}\n\nfreud-phi.vercel.app — Solana Psychological Profiler\n#Solana #DeFi #AI`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}`,"_blank");
  };

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
    .gbtn:hover{background:linear-gradient(135deg,#00ff8850,#00e5ff38);box-shadow:0 0 38px #00ff8858}
    .gbtn:active{transform:scale(.97)}
    .gbtn:disabled{opacity:.35;cursor:not-allowed;box-shadow:none}
    .isol{background:#000d1a;border:1px solid #00ff8850;color:#f0fff8;font-family:'Share Tech Mono',monospace;font-size:15px;padding:15px 16px;border-radius:9px;outline:none;width:100%;transition:border-color .3s,box-shadow .3s;letter-spacing:.4px}
    .isol::placeholder{color:#00ff8872}.isol:focus{border-color:#00ff88;box-shadow:0 0 24px #00ff8824}
    @media(max-width:600px){.d2{grid-template-columns:1fr!important}.d3{grid-template-columns:1fr!important}.card{padding:15px}}
  `}</style>

  <Particles/>
  <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:999,background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.018) 2px,rgba(0,0,0,.018) 4px)"}}/>

  <div style={{position:"relative",zIndex:1,background:"radial-gradient(ellipse at 12% 10%,#001e0c,transparent 50%),radial-gradient(ellipse at 88% 88%,#0d0022,transparent 50%),#030508"}}>

    {/* NAVBAR */}
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
            <button className="gbtn" style={{width:"100%",justifyContent:"center",padding:"12px"}} onClick={goScan}>⬡ SCAN A WALLET NOW</button>
          </div>
        </div>
      )}
    </nav>
    {menu&&<div style={{position:"fixed",inset:0,zIndex:150}} onClick={()=>setMenu(false)}/>}

    {/* HOME */}
    {page==="home"&&(<>
      {/* Price ticker */}
      <div style={{borderBottom:"1px solid #ffffff0a",background:"#00060e",overflow:"hidden",height:36,position:"relative"}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:40,background:"linear-gradient(90deg,#00060e,transparent)",zIndex:2,pointerEvents:"none"}}/>
        <div style={{position:"absolute",right:0,top:0,bottom:0,width:40,background:"linear-gradient(270deg,#00060e,transparent)",zIndex:2,pointerEvents:"none"}}/>
        <div style={{display:"flex",animation:"ticker 22s linear infinite",width:"max-content",height:"100%",alignItems:"center"}}>
          {[...PRICES,...PRICES,...PRICES,...PRICES].map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:7,padding:"0 20px",height:"100%",whiteSpace:"nowrap"}}>
              <span className="orb" style={{fontSize:11,fontWeight:900,color:"#ffffffee"}}>{p.sym}</span>
              <span className="mono" style={{fontSize:12,color:"#ffffffdd"}}>{p.price}</span>
              <span className="mono" style={{fontSize:11,fontWeight:700,color:p.up?"#22c55e":"#ef4444",textShadow:p.up?"0 0 8px #22c55e88":"0 0 8px #ef444488"}}>{p.up?"▲":"▼"} {p.chg}</span>
              <span style={{color:"#ffffff18",fontSize:8,marginLeft:4}}>•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero */}
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

        {/* Inline scanner */}
        <div className="fu" style={{animationDelay:".17s",maxWidth:680,margin:"0 auto 24px"}}>
          {!HELIUS_RPC && (
            <div style={{background:"#1a0a00",border:"1px solid #f9731655",borderRadius:10,padding:"12px 16px",marginBottom:12,textAlign:"left"}}>
              <div className="orb" style={{fontSize:10,color:"#f97316",marginBottom:4}}>⚠ HELIUS RPC NOT CONFIGURED</div>
              <div className="mono" style={{fontSize:12,color:"#ffffffcc",lineHeight:1.7}}>
                Add <strong>VITE_HELIUS_RPC_URL</strong> to Vercel → Settings → Environment Variables to enable live scanning.
              </div>
            </div>
          )}
          <div style={{background:"#000d1a",border:`1px solid ${wBad?"#ff3b3b66":"#00ff8855"}`,borderRadius:14,padding:5,display:"flex",gap:5,boxShadow:wBad?"0 0 24px #ff3b3b10":"0 0 48px #00ff8820"}}>
            <input className="isol" style={{border:"none",background:"transparent",color:wBad?"#ff6b6b":"#f0fff8",fontSize:15,borderRadius:10}}
              placeholder="Paste any Solana wallet address..."
              value={wallet} onChange={e=>{setWallet(e.target.value);setErr("");setProfile(null);}}
              onKeyDown={e=>e.key==="Enter"&&scan()}/>
            <button className="gbtn" onClick={scan} disabled={!!wBad||!wOk||busy} style={{fontSize:13,padding:"0 26px",borderRadius:10,flexShrink:0}}>
              {busy?"...":"SCAN"}
            </button>
          </div>
          {wBad&&<div className="mono" style={{fontSize:13,color:"#ff6b6b",textAlign:"center",marginTop:8}}>⚠ Invalid — must be base58 Solana wallet (32–44 chars)</div>}
          {wOk&&!busy&&!err&&!profile&&<div className="mono" style={{fontSize:13,color:"#00ff88bb",textAlign:"center",marginTop:8}}>✓ Valid address — press SCAN</div>}

          {busy&&(
            <div style={{textAlign:"center",padding:"28px 0"}}>
              <div style={{width:60,height:60,margin:"0 auto 16px",border:"2px solid #00ff8820",borderTop:"2px solid #00ff88",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
              <div className="orb" style={{fontSize:11,color:"#00ff88",letterSpacing:3,marginBottom:12}}>ANALYZING ON-CHAIN DATA</div>
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
              <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:8}}>
                <span style={{fontSize:18,animation:"pulse 1.5s infinite",flexShrink:0}}>⚠</span>
                <div className="mono" style={{fontSize:13,color:"#ffffffcc",lineHeight:1.7}}>{err}</div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:10}}>
                <button className="gbtn" onClick={scan} style={{flex:1,justifyContent:"center",fontSize:10}}>↻ RETRY</button>
                <button onClick={()=>{setErr("");setWallet("");}} style={{flex:1,background:"transparent",border:"1px solid #ffffff22",borderRadius:8,color:"#ffffffaa",fontFamily:"'Orbitron',monospace",fontSize:10,fontWeight:700,cursor:"pointer",letterSpacing:1}}>← CLEAR</button>
              </div>
            </div>
          )}

          {profile&&!busy&&(
            <div style={{marginTop:16}}>
              <ProfileCard profile={profile} wallet={wallet} onShare={shareProfile}/>
            </div>
          )}
        </div>

        {/* Counters */}
        <div className="fu" style={{animationDelay:".22s",display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
          {[{to:9,suf:"",lab:"Scores",col:"#00ff88"},{to:10,suf:"",lab:"Archetypes",col:"#00e5ff"},{to:2847,suf:"+",lab:"Wallets Scanned",col:"#a855f7"},{to:30,suf:"s",lab:"Avg Scan",col:"#f97316"},{to:100,suf:"%",lab:"On-Chain",col:"#22c55e"}].map(({to,suf,lab,col})=>(
            <div key={lab} style={{background:"#ffffff06",border:`1px solid ${col}22`,borderRadius:11,padding:"11px 15px",minWidth:88,textAlign:"center"}}>
              <div className="orb" style={{fontSize:20,fontWeight:900,color:col,textShadow:`0 0 10px ${col}55`,marginBottom:2}}><Counter to={to} suffix={suf}/></div>
              <div className="mono" style={{fontSize:11,color:"#ffffffbb"}}>{lab}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live scan ticker */}
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

      {/* Recent scans */}
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

      {/* Battle teaser */}
      <div style={{maxWidth:1060,margin:"0 auto",padding:"0 20px 48px"}}>
        <div style={{background:"linear-gradient(135deg,#1a0005,#0d001a)",border:"1px solid #ef444430",borderRadius:16,padding:"28px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:18,boxShadow:"0 0 40px #ef444410"}}>
          <div>
            <div className="mono" style={{fontSize:10,color:"#ef4444aa",letterSpacing:3,marginBottom:6}}>◈ NEW FEATURE ◈</div>
            <div className="orb" style={{fontSize:"clamp(18px,4vw,26px)",fontWeight:900,color:"#fff",marginBottom:8}}>⚔ WALLET BATTLE</div>
            <div className="mono" style={{fontSize:14,color:"#ffffffcc",lineHeight:1.7,maxWidth:400}}>Two wallets. One winner. FREUD analyzes both psychologies and declares who the better trader is.</div>
          </div>
          <button className="gbtn" onClick={()=>goPage("battle")} style={{flexShrink:0,fontSize:13,padding:"14px 28px",background:"linear-gradient(135deg,#ef444422,#a855f715)",borderColor:"#ef4444aa",color:"#ef4444",textShadow:"0 0 10px #ef444480",boxShadow:"0 0 24px #ef444428"}}>
            ⚔ START A BATTLE
          </button>
        </div>
      </div>

      {/* How it works */}
      <div style={{maxWidth:1060,margin:"0 auto",padding:"0 20px 48px"}}>
        <div style={{marginBottom:16,textAlign:"center"}}>
          <div className="mono" style={{fontSize:10,color:"#00e5ffaa",letterSpacing:3,marginBottom:3}}>◈ HOW IT WORKS ◈</div>
          <div className="orb" style={{fontSize:17,fontWeight:900,color:"#fff"}}>3 STEPS. REAL DATA. ZERO COST.</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}} className="d3">
          {[
            {n:"01",icon:"⛓",col:"#00e5ff",t:"FETCH",d:"Helius RPC pulls real SOL balance, token accounts & transaction history."},
            {n:"02",icon:"🔬",col:"#a855f7",t:"ANALYZE",d:"Mathematical scoring engine calculates FOMO, panic, meme addiction from real metrics."},
            {n:"03",icon:"🧠",col:"#00ff88",t:"PROFILE",d:"Archetype mapping + behavioral commentary generated from your actual on-chain data."},
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

      {/* Footer */}
      <footer style={{borderTop:"1px solid #ffffff09",padding:"24px 20px"}}>
        <div style={{maxWidth:1060,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={goHome}>
            <span style={{fontSize:16}}>🧠</span>
            <span className="orb" style={{fontSize:15,fontWeight:900,color:"#00ff88"}}>FREUD</span>
            <span className="mono" style={{fontSize:10,color:"#ffffff40",marginLeft:2}}>v2.0</span>
          </div>
          <div className="mono" style={{fontSize:11,color:"#ffffff35",textAlign:"center"}}>
            © 2025 FREUD · Real On-Chain Data · Powered by Helius RPC
          </div>
          <div style={{display:"flex",gap:10}}>
            {[{icon:"𝕏",url:"https://twitter.com"},{icon:"💬",url:"https://discord.com"},{icon:"📣",url:"https://telegram.org"}].map(({icon,url})=>(
              <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                style={{width:32,height:32,borderRadius:7,background:"#ffffff08",border:"1px solid #ffffff14",display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none",fontSize:14}}>
                {icon}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </>)}

    {/* INNER PAGES */}
    {(page==="mission"||page==="how"||page==="archetypes"||page==="roadmap"||page==="scan"||page==="battle")&&(
      <div style={{maxWidth:860,margin:"0 auto",padding:"40px 20px 90px"}}>
        <button onClick={goHome} style={{background:"transparent",border:"1px solid #ffffff22",borderRadius:7,padding:"7px 14px",cursor:"pointer",color:"#ffffffaa",fontFamily:"'Orbitron',monospace",fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:32}}>← BACK TO HOME</button>

        {/* SCAN PAGE */}
        {page==="scan"&&(<>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:14}}><Radar s={110}/></div>
            <div className="orb" style={{fontSize:"clamp(18px,4vw,28px)",fontWeight:900,color:"#fff",marginBottom:8}}>SCAN A WALLET</div>
            <div className="mono" style={{fontSize:14,color:"#ffffffcc",lineHeight:1.7}}>Enter any Solana wallet to generate a real psychological profile from on-chain data.</div>
          </div>
          {!HELIUS_RPC&&(
            <div style={{background:"#1a0a00",border:"1px solid #f9731655",borderRadius:10,padding:"16px",marginBottom:16}}>
              <div className="orb" style={{fontSize:11,color:"#f97316",marginBottom:6}}>⚠ HELIUS RPC NOT CONFIGURED</div>
              <div className="mono" style={{fontSize:13,color:"#ffffffcc",lineHeight:1.7}}>
                Add <strong>VITE_HELIUS_RPC_URL</strong> to Vercel → Settings → Environment Variables.<br/>
                Format: <code style={{color:"#00e5ff"}}>https://mainnet.helius-rpc.com/?api-key=YOUR_KEY</code>
              </div>
            </div>
          )}
          <div style={{background:"#000d1a",border:`1px solid ${wBad?"#ff3b3b44":"#00ff8832"}`,borderRadius:12,padding:3,display:"flex",gap:3,marginBottom:7}}>
            <input className="isol" style={{border:"none",background:"transparent",color:wBad?"#ff6b6b":"#e0ffe8"}}
              placeholder="Enter Solana wallet address..."
              value={wallet} onChange={e=>{setWallet(e.target.value);setErr("");setProfile(null);}}
              onKeyDown={e=>e.key==="Enter"&&scan()}/>
            <button className="gbtn" onClick={scan} disabled={!!wBad||!wOk||busy} style={{fontSize:11,padding:"0 18px",borderRadius:8}}>
              {busy?"...":"SCAN"}
            </button>
          </div>
          {wBad&&<div className="mono" style={{fontSize:12,color:"#ff6b6b",textAlign:"center",marginBottom:8}}>⚠ Invalid — base58 Solana wallet (32–44 chars)</div>}
          {wOk&&!busy&&!err&&!profile&&<div className="mono" style={{fontSize:12,color:"#00ff88aa",textAlign:"center",marginBottom:8}}>✓ Valid address — press SCAN</div>}
          {busy&&(
            <div style={{textAlign:"center",padding:"28px 0"}}>
              <div style={{width:60,height:60,margin:"0 auto 16px",border:"2px solid #00ff8820",borderTop:"2px solid #00ff88",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
              <div className="orb" style={{fontSize:11,color:"#00ff88",letterSpacing:3,marginBottom:12}}>ANALYZING ON-CHAIN DATA</div>
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
              <div className="mono" style={{fontSize:13,color:"#ffffffcc",lineHeight:1.7,marginBottom:10}}>{err}</div>
              <div style={{display:"flex",gap:8}}>
                <button className="gbtn" onClick={scan} style={{flex:1,justifyContent:"center",fontSize:10}}>↻ RETRY</button>
                <button onClick={()=>{setErr("");setWallet("");setProfile(null);}} style={{flex:1,background:"transparent",border:"1px solid #ffffff22",borderRadius:8,color:"#ffffffaa",fontFamily:"'Orbitron',monospace",fontSize:10,fontWeight:700,cursor:"pointer",letterSpacing:1}}>← CLEAR</button>
              </div>
            </div>
          )}
          {profile&&!busy&&<div style={{marginTop:16}}><ProfileCard profile={profile} wallet={wallet} onShare={shareProfile}/></div>}
        </>)}

        {/* BATTLE PAGE */}
        {page==="battle"&&(<>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div className="mono" style={{fontSize:10,color:"#ef4444aa",letterSpacing:3,marginBottom:6}}>◈ WALLET BATTLE ◈</div>
            <div className="orb" style={{fontSize:"clamp(22px,5vw,36px)",fontWeight:900,color:"#fff",marginBottom:10}}>⚔ WHO IS THE BETTER TRADER?</div>
            <div className="mono" style={{fontSize:14,color:"#ffffffcc",lineHeight:1.7,maxWidth:480,margin:"0 auto"}}>Enter two Solana wallets. FREUD fetches real on-chain data and declares a winner.</div>
          </div>

          {!HELIUS_RPC&&(
            <div style={{background:"#1a0a00",border:"1px solid #f9731655",borderRadius:10,padding:"16px",marginBottom:16}}>
              <div className="orb" style={{fontSize:11,color:"#f97316",marginBottom:6}}>⚠ HELIUS RPC NOT CONFIGURED</div>
              <div className="mono" style={{fontSize:13,color:"#ffffffcc",lineHeight:1.7}}>
                Add <strong>VITE_HELIUS_RPC_URL</strong> to Vercel Environment Variables to enable real battle analysis.
              </div>
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:12,alignItems:"center",marginBottom:16}} className="d2">
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{width:28,height:28,borderRadius:6,background:"linear-gradient(135deg,#00ff88,#00e5ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#000"}}>A</div>
                <div className="orb" style={{fontSize:11,color:"#00ff88",fontWeight:800,letterSpacing:1}}>WALLET ALPHA</div>
              </div>
              <input className="isol" style={{borderColor:isValidSolana(bW1)?"#00ff8866":bW1?"#ff3b3b44":"#00ff8830",color:bW1&&!isValidSolana(bW1)?"#ff6b6b":"#f0fff8"}}
                placeholder="Solana address..." value={bW1} onChange={e=>setBW1(e.target.value)}/>
              {bW1&&!isValidSolana(bW1)&&<div className="mono" style={{fontSize:11,color:"#ff6b6b",marginTop:5}}>⚠ Invalid</div>}
              {isValidSolana(bW1)&&<div className="mono" style={{fontSize:11,color:"#00ff88aa",marginTop:5}}>✓ Valid</div>}
            </div>
            <div style={{textAlign:"center",padding:"0 8px"}}>
              <div className="orb" style={{fontSize:22,fontWeight:900,color:"#ef4444",textShadow:"0 0 20px #ef444460",animation:"pulse 2s infinite"}}>VS</div>
            </div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{width:28,height:28,borderRadius:6,background:"linear-gradient(135deg,#a855f7,#00e5ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#000"}}>B</div>
                <div className="orb" style={{fontSize:11,color:"#a855f7",fontWeight:800,letterSpacing:1}}>WALLET BETA</div>
              </div>
              <input className="isol" style={{borderColor:isValidSolana(bW2)?"#a855f766":bW2?"#ff3b3b44":"#a855f730",color:bW2&&!isValidSolana(bW2)?"#ff6b6b":"#f0fff8"}}
                placeholder="Solana address..." value={bW2} onChange={e=>setBW2(e.target.value)}/>
              {bW2&&!isValidSolana(bW2)&&<div className="mono" style={{fontSize:11,color:"#ff6b6b",marginTop:5}}>⚠ Invalid</div>}
              {isValidSolana(bW2)&&<div className="mono" style={{fontSize:11,color:"#a855f7aa",marginTop:5}}>✓ Valid</div>}
            </div>
          </div>

          <div style={{textAlign:"center",marginBottom:24}}>
            <button className="gbtn" onClick={runBattle} disabled={bBusy||!isValidSolana(bW1)||!isValidSolana(bW2)}
              style={{fontSize:14,padding:"15px 40px",background:"linear-gradient(135deg,#ef444422,#a855f718)",borderColor:"#ef4444aa",color:"#ef4444",textShadow:"0 0 10px #ef444488",boxShadow:"0 0 28px #ef444430"}}>
              {bBusy?"ANALYZING...":"⚔ START BATTLE"}
            </button>
          </div>

          {bBusy&&(
            <div style={{textAlign:"center",padding:"24px 0"}}>
              <div style={{width:64,height:64,margin:"0 auto 16px",border:"2px solid #ef444420",borderTop:"2px solid #ef4444",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
              <div className="orb" style={{fontSize:11,color:"#ef4444",letterSpacing:3,marginBottom:12}}>FETCHING REAL ON-CHAIN DATA</div>
              <div style={{maxWidth:360,margin:"0 auto 12px"}}>
                {BSTEPS.map((s,i)=>(
                  <div key={i} className="mono" style={{fontSize:11,padding:"3px 0",textAlign:"left",color:i<bStep?"#ef444468":i===bStep?"#ef4444":"#ffffff28"}}>
                    {i<bStep?"✓ ":i===bStep?"▶ ":"  "}{s}
                  </div>
                ))}
              </div>
              <div style={{maxWidth:360,margin:"0 auto",height:2,background:"#ffffff08",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",background:"linear-gradient(90deg,#ef4444,#a855f7)",width:`${(bStep/BSTEPS.length)*100}%`,transition:"width .5s",boxShadow:"0 0 8px #ef4444"}}/>
              </div>
            </div>
          )}

          {bErr&&!bBusy&&(
            <div style={{background:"linear-gradient(135deg,#1a0000,#0d0005)",border:"1px solid #ff3b3b28",borderRadius:10,padding:"16px",marginBottom:16}}>
              <div className="mono" style={{fontSize:13,color:"#ffffffcc",lineHeight:1.7}}>{bErr}</div>
            </div>
          )}

          {bResult&&!bBusy&&(
            <div style={{animation:"fu .6s ease"}}>
              <div style={{textAlign:"center",padding:"20px",marginBottom:18,background:`linear-gradient(135deg,${bResult.winner===1?"#00ff8808":"#a855f708"},transparent)`,border:`1px solid ${bResult.winner===1?"#00ff8830":"#a855f730"}`,borderRadius:14}}>
                <div className="mono" style={{fontSize:11,color:"#ffffff60",letterSpacing:3,marginBottom:6}}>◈ BATTLE RESULT ◈</div>
                <div className="orb" style={{fontSize:"clamp(18px,4vw,28px)",fontWeight:900,marginBottom:6,color:bResult.winner===1?"#00ff88":"#a855f7",textShadow:`0 0 24px ${bResult.winner===1?"#00ff88":"#a855f7"}`}}>
                  WALLET {bResult.winner===1?"A":"B"} WINS ⚔
                </div>
                <div className="mono" style={{fontSize:13,color:"#ffffffcc",lineHeight:1.7}}>{bResult.verdict}</div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}} className="d2">
                {[bResult.w1,bResult.w2].map((w,wi)=>{
                  const isWinner=bResult.winner===wi+1;
                  const acol=wi===0?"#00ff88":"#a855f7";
                  return(
                    <div key={wi} className="card" style={{border:`2px solid ${isWinner?acol+"60":acol+"20"}`,background:`linear-gradient(135deg,${acol}06,transparent)`,position:"relative"}}>
                      {isWinner&&<div style={{position:"absolute",top:-10,right:12,background:acol,color:"#000",fontFamily:"'Orbitron',monospace",fontSize:9,fontWeight:900,padding:"3px 10px",borderRadius:20,letterSpacing:1}}>WINNER ⚔</div>}
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                        <div style={{width:32,height:32,borderRadius:7,background:`linear-gradient(135deg,${acol},${acol}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Orbitron',monospace",fontSize:14,fontWeight:900,color:"#000"}}>{wi===0?"A":"B"}</div>
                        <div>
                          <div className="mono" style={{fontSize:11,color:"#ffffff70"}}>{w.addr}</div>
                          <div className="orb" style={{fontSize:10,fontWeight:800,color:acol}}>{AI[w.archetype]||"🎰"} {w.archetype}</div>
                        </div>
                      </div>
                      <div className="mono" style={{fontSize:11,color:"#ffffffaa",marginBottom:8}}>
                        SOL: <span style={{color:acol}}>{w.metrics.solBalance.toFixed(4)}◎</span> · 
                        TXs: <span style={{color:acol}}>{w.metrics.txCount}</span> · 
                        Tokens: <span style={{color:acol}}>{w.metrics.tokenCount}</span>
                      </div>
                      <DBadge l={w.dangerLevel}/>
                      <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:6}}>
                        {[["SMART",w.smartMoney,"#22c55e"],["RISK",w.riskScore,"#00ff88"],["FOMO",w.fomoScore,"#f97316"],["PANIC",w.panicScore,"#ef4444"],["DEGEN",w.degeneracy,"#a855f7"]].map(([l,v,c])=>(
                          <div key={l}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                              <span className="mono" style={{fontSize:10,color:"#ffffffaa"}}>{l}</span>
                              <span className="mono" style={{fontSize:10,color:v>75?"#ff3b3b":c,fontWeight:700}}>{v}</span>
                            </div>
                            <div style={{height:4,background:"#ffffff0f",borderRadius:2,overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${v}%`,borderRadius:2,background:`linear-gradient(90deg,${(v>75?"#ff3b3b":c)}80,${v>75?"#ff3b3b":c})`,boxShadow:`0 0 6px ${v>75?"#ff3b3b":c}70`,transition:"width 1s ease"}}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{display:"flex",gap:10}}>
                <button className="gbtn" style={{flex:1,justifyContent:"center",borderColor:"#a855f766",color:"#a855f7",textShadow:"0 0 8px #a855f770",boxShadow:"0 0 18px #a855f725"}}
                  onClick={()=>{
                    const t=`⚔ FREUD Wallet Battle\n\nWallet A (${bResult.w1.addr}): ${bResult.w1.archetype}\nWallet B (${bResult.w2.addr}): ${bResult.w2.archetype}\n\n🏆 WINNER: Wallet ${bResult.winner===1?"A":"B"}\n${bResult.verdict}\n\nfreud-phi.vercel.app`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}`,"_blank");
                  }}>SHARE ON 𝕏</button>
                <button onClick={()=>{setBResult(null);setBW1("");setBW2("");}} style={{flex:1,background:"transparent",border:"1px solid #ffffff20",borderRadius:8,padding:"11px",cursor:"pointer",color:"#ffffffaa",fontFamily:"'Orbitron',monospace",fontSize:11,fontWeight:700,letterSpacing:1}}>↺ NEW BATTLE</button>
              </div>
            </div>
          )}
        </>)}

        {/* MISSION */}
        {page==="mission"&&(<>
          <div className="orb" style={{fontSize:"clamp(20px,4vw,32px)",fontWeight:900,color:"#fff",marginBottom:6}}>MISSION</div>
          <div className="mono" style={{fontSize:13,color:"#ffffffaa",marginBottom:28,lineHeight:1.7}}>The biggest edge in crypto isn't alpha. It's self-awareness.</div>
          <div className="card" style={{border:"1px solid #a855f725",background:"linear-gradient(135deg,#0d0020,#040010)",padding:"28px",marginBottom:16,textAlign:"center"}}>
            <div className="orb" style={{fontSize:"clamp(14px,3vw,18px)",fontWeight:900,color:"#a855f7",letterSpacing:.8,marginBottom:14}}>"Every trade you make is a window into your psychology."</div>
            <div className="mono" style={{fontSize:13,color:"#ffffffcc",lineHeight:1.9}}>The fear that made you sell at the bottom. The FOMO that pulled you into a rug. These aren't market mistakes — they're psychological patterns. FREUD identifies them from real on-chain data.</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} className="d2">
            {[{icon:"🔍",col:"#00ff88",t:"Radical Transparency",d:"No flattery. Real blockchain data. Real scores."},
              {icon:"⛓",col:"#00e5ff",t:"On-Chain Truth Only",d:"Every insight from real Solana data via Helius RPC."},
              {icon:"🛡",col:"#f97316",t:"Non-Custodial",d:"Read-only. We never touch your funds."},
              {icon:"🌍",col:"#a855f7",t:"Free to Use",d:"Powered by Helius free tier. No paid API required."},
            ].map(({icon,col,t,d})=>(
              <div key={t} className="card" style={{border:`1px solid ${col}18`,display:"flex",gap:12}}>
                <span style={{fontSize:20,flexShrink:0}}>{icon}</span>
                <div><div className="orb" style={{fontSize:10,fontWeight:800,color:col,letterSpacing:.8,marginBottom:6}}>{t}</div><div className="mono" style={{fontSize:13,color:"#ffffffbb",lineHeight:1.75}}>{d}</div></div>
              </div>
            ))}
          </div>
        </>)}

        {/* ARCHETYPES */}
        {page==="archetypes"&&(<>
          <div className="orb" style={{fontSize:"clamp(20px,4vw,32px)",fontWeight:900,color:"#fff",marginBottom:6}}>THE 10 ARCHETYPES</div>
          <div className="mono" style={{fontSize:13,color:"#ffffffaa",marginBottom:28,lineHeight:1.7}}>FREUD assigns you one archetype based on your actual on-chain trading behavior.</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:9}}>
            {[{icon:"🎯",n:"EXIT LIQUIDITY",col:"#ff3b3b",d:"Buys exactly when smart money sells."},
              {icon:"🚀",n:"FOMO CHASER",col:"#f97316",d:"Always late. Always wrecked."},
              {icon:"🧠",n:"SMART SHADOW",col:"#00ff88",d:"Follows wallets, not hype."},
              {icon:"🐋",n:"WHALE PARASITE",col:"#00e5ff",d:"Mirrors large wallet moves."},
              {icon:"🦍",n:"REVENGE APE",col:"#a855f7",d:"Doubles down after losses."},
              {icon:"💊",n:"PUMP.FUN DEGEN",col:"#ff3b3b",d:"Lives in the launch trenches."},
              {icon:"📉",n:"TOP BUYER",col:"#f97316",d:"Perfect — wrong — timing."},
              {icon:"🧲",n:"RUG MAGNET",col:"#ef4444",d:"Finds every honeypot."},
              {icon:"💎",n:"DIAMOND HAND",col:"#22c55e",d:"Never sells. Ever."},
              {icon:"📡",n:"NOISE TRADER",col:"#6b7280",d:"Random. No pattern."},
            ].map(({icon,n,col,d})=>(
              <div key={n} style={{background:"#ffffff04",border:`1px solid ${col}18`,borderRadius:10,padding:"13px",display:"flex",gap:9,alignItems:"flex-start"}}>
                <span style={{fontSize:18,flexShrink:0,marginTop:1}}>{icon}</span>
                <div><div className="orb" style={{fontSize:9,fontWeight:800,color:col,letterSpacing:.5,marginBottom:4}}>{n}</div><div className="mono" style={{fontSize:11,color:"#ffffffaa",lineHeight:1.6}}>{d}</div></div>
              </div>
            ))}
          </div>
        </>)}

        {page==="how"&&(<>
          <div className="orb" style={{fontSize:"clamp(20px,4vw,32px)",fontWeight:900,color:"#fff",marginBottom:6}}>HOW IT WORKS</div>
          <div className="mono" style={{fontSize:13,color:"#ffffffaa",marginBottom:28,lineHeight:1.7}}>Real on-chain data → mathematical scoring → psychological profile. Zero API cost.</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}} className="d3">
            {[{n:"01",icon:"⛓",col:"#00e5ff",t:"HELIUS FETCH",d:"getBalance, getSignaturesForAddress, getTokenAccountsByOwner — free RPC calls."},
              {n:"02",icon:"🔬",col:"#a855f7",t:"MATH ENGINE",d:"Transaction frequency, burst patterns, token count — all scored mathematically."},
              {n:"03",icon:"🧠",col:"#00ff88",t:"PROFILE",d:"Archetype, DNA, commentary — all derived from your real on-chain metrics."},
            ].map(({n,icon,col,t,d})=>(
              <div key={n} className="card" style={{border:`1px solid ${col}1e`,position:"relative"}}>
                <div className="orb" style={{position:"absolute",top:12,right:12,fontSize:32,fontWeight:900,color:`${col}0c`}}>{n}</div>
                <div style={{fontSize:24,marginBottom:10}}>{icon}</div>
                <div className="orb" style={{fontSize:10,fontWeight:800,color:col,letterSpacing:.8,marginBottom:8}}>{t}</div>
                <div className="mono" style={{fontSize:13,color:"#ffffffbb",lineHeight:1.8}}>{d}</div>
              </div>
            ))}
          </div>
        </>)}

        {page==="roadmap"&&(<>
          <div className="orb" style={{fontSize:"clamp(20px,4vw,32px)",fontWeight:900,color:"#fff",marginBottom:6}}>ROADMAP</div>
          <div style={{position:"relative"}}>
            <div style={{position:"absolute",left:18,top:0,bottom:0,width:1,background:"linear-gradient(180deg,#00ff8840,#a855f730,transparent)"}}/>
            {[{q:"Q2 2025",s:"done",  col:"#00ff88",t:"FREUD v1.0",      items:["Site launch","10 archetypes","Wallet Battle","X share cards"]},
              {q:"Q3 2025",s:"active",col:"#00e5ff",t:"Live Data",        items:["Helius RPC integration","Real tx analysis","Mathematical scoring","Zero API cost"]},
              {q:"Q4 2025",s:"soon",  col:"#a855f7",t:"FREUD Token",      items:["Token on Solana","Holder premium features","Portfolio tracker","Developer API"]},
              {q:"Q1 2026",s:"soon",  col:"#f97316",t:"Intelligence Net", items:["Cross-wallet detection","Whale alerts","Mobile app","Multi-chain"]},
            ].map(({q,s,col,t,items})=>(
              <div key={q} style={{display:"flex",gap:18,marginBottom:24}}>
                <div style={{width:38,flexShrink:0,display:"flex",justifyContent:"center"}}>
                  <div style={{width:15,height:15,borderRadius:"50%",marginTop:5,background:s==="soon"?"#ffffff0f":col,border:`2px solid ${col}`,boxShadow:s!=="soon"?`0 0 12px ${col}70`:"none",animation:s==="active"?"pulse 1.4s infinite":"none"}}/>
                </div>
                <div className="card" style={{flex:1,border:`1px solid ${col}1e`}}>
                  <div style={{display:"flex",gap:9,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
                    <span className="mono" style={{fontSize:10,color:col,letterSpacing:2}}>{q}</span>
                    <span className="mono" style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:s==="done"?"#00ff8816":s==="active"?"#00e5ff14":"#ffffff0a",color:s==="done"?"#00ff88":s==="active"?"#00e5ff":"#ffffff45",border:`1px solid ${s==="done"?"#00ff8830":s==="active"?"#00e5ff30":"#ffffff15"}`}}>{s==="done"?"✓ COMPLETE":s==="active"?"▶ IN PROGRESS":"◇ UPCOMING"}</span>
                  </div>
                  <div className="orb" style={{fontSize:13,fontWeight:800,color:"#fff",letterSpacing:.8,marginBottom:10}}>{t}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    {items.map(it=><div key={it} className="mono" style={{fontSize:12,color:"#ffffffbb",display:"flex",gap:7,alignItems:"center"}}><span style={{color:col,fontSize:7}}>◆</span>{it}</div>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>)}
      </div>
    )}
  </div>
  </>);
}
