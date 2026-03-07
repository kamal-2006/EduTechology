import { useState, useContext, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api.js";
import { AuthContext } from "../App.jsx";

/* ── Animated particle canvas ─────────────────────────────── */
function NeuralCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const NODES = 38;
    const nodes = Array.from({ length: NODES }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2 + 1,
      pulse: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach((n) => {
        n.x += n.vx; n.y += n.vy; n.pulse += 0.02;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });
      for (let i = 0; i < NODES; i++) {
        for (let j = i + 1; j < NODES; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(94,234,212,${(1 - d / 130) * 0.18})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      nodes.forEach((n) => {
        const alpha = 0.5 + 0.5 * Math.sin(n.pulse);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + Math.sin(n.pulse) * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(94,234,212,${alpha * 0.7})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, (n.r + 3) * (0.7 + 0.3 * Math.sin(n.pulse)), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(94,234,212,${alpha * 0.15})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

/* ── Typewriter headline ──────────────────────────────────── */
function Typewriter({ texts }) {
  const [display, setDisplay] = useState("");
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("typing");
  useEffect(() => {
    const current = texts[idx % texts.length];
    let t;
    if (phase === "typing") {
      if (display.length < current.length) {
        t = setTimeout(() => setDisplay(current.slice(0, display.length + 1)), 55);
      } else {
        t = setTimeout(() => setPhase("waiting"), 1800);
      }
    } else if (phase === "waiting") {
      t = setTimeout(() => setPhase("erasing"), 400);
    } else {
      if (display.length > 0) {
        t = setTimeout(() => setDisplay(display.slice(0, -1)), 28);
      } else {
        setIdx((i) => i + 1);
        setPhase("typing");
      }
    }
    return () => clearTimeout(t);
  }, [display, phase, idx, texts]);
  return (
    <span>
      {display}
      <span style={{ animation: "blink 1s step-end infinite", color: "#5eead4" }}>|</span>
    </span>
  );
}

/* ── Demo credentials map ─────────────────────────────────── */
const DEMO = {
  student: { email: "alice@test.com",          password: "student1234" },
  admin:   { email: "admin@educationpsg.com",  password: "admin1234"   },
};

/* ── Main Login ───────────────────────────────────────────── */
export default function Login() {
  const navigate   = useNavigate();
  const { setUser } = useContext(AuthContext);
  const [form, setForm]           = useState({ email: "", password: "" });
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [role, setRole]           = useState("student");
  const [showPassword, setShowPw] = useState(false);
  const [mounted, setMounted]     = useState(false);
  const [demoActive, setDemoActive] = useState(null); // "student" | "admin" | null

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  /* Auto-fill demo credentials with a brief highlight flash */
  const fillDemo = (demoRole) => {
    setRole(demoRole);
    setForm({ email: DEMO[demoRole].email, password: DEMO[demoRole].password });
    setDemoActive(demoRole);
    setTimeout(() => setDemoActive(null), 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally { setLoading(false); }
  };

  const typewriterTexts = [
    "Personalised for you.",
    "AI-driven mastery.",
    "Learn without limits.",
    "Your skills, amplified.",
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; overflow: hidden; }

        @keyframes blink      { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse  {
          0%,100%{ box-shadow: 0 0 18px rgba(94,234,212,0.25), 0 0 40px rgba(94,234,212,0.08); }
          50%    { box-shadow: 0 0 28px rgba(94,234,212,0.45), 0 0 60px rgba(94,234,212,0.15); }
        }
        @keyframes shimmer    { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes floatBadge { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-8px) rotate(-2deg)} }
        @keyframes rotateRing { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes inputFlash {
          0%  { border-color: rgba(94,234,212,0.9); box-shadow: 0 0 0 3px rgba(94,234,212,0.2); background: rgba(94,234,212,0.08); }
          100%{ border-color: rgba(94,234,212,0.18); box-shadow: none; background: rgba(15,23,42,0.6); }
        }

        .edu-input {
          width:100%; background:rgba(15,23,42,0.6); border:1px solid rgba(94,234,212,0.18);
          border-radius:10px; color:#e2e8f0; font-family:'Nunito',sans-serif;
          font-size:0.9rem; outline:none; transition:all 0.25s;
          padding:0.75rem 0.875rem 0.75rem 2.75rem;
        }
        .edu-input::placeholder { color:rgba(148,163,184,0.45); }
        .edu-input:focus { border-color:rgba(94,234,212,0.6); background:rgba(15,23,42,0.85); box-shadow:0 0 0 3px rgba(94,234,212,0.07); }
        .edu-input.flashing { animation: inputFlash 1s ease forwards; }

        .submit-btn {
          width:100%; padding:0.875rem; border:none; border-radius:10px; cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif; font-size:0.9375rem; font-weight:700; letter-spacing:0.01em;
          background:linear-gradient(135deg,#14b8a6 0%,#0891b2 50%,#6366f1 100%);
          background-size:200% 200%; color:white; transition:all 0.3s; position:relative; overflow:hidden;
        }
        .submit-btn:hover:not(:disabled) { background-position:right center; transform:translateY(-1px); box-shadow:0 8px 25px rgba(20,184,166,0.35); }
        .submit-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .submit-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent 20%,rgba(255,255,255,0.08) 50%,transparent 80%); background-size:200% auto; animation:shimmer 2s linear infinite; }

        .tab-btn { flex:1; padding:0.5rem 0.75rem; border:none; border-radius:8px; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-size:0.78rem; font-weight:700; letter-spacing:0.02em; transition:all 0.2s; text-transform:uppercase; }
        .tab-active   { background:linear-gradient(135deg,#14b8a6,#6366f1); color:white; box-shadow:0 2px 12px rgba(99,102,241,0.35); }
        .tab-inactive { background:transparent; color:rgba(148,163,184,0.6); }
        .tab-inactive:hover { color:#94a3b8; }

        .stat-card    { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:1rem 1.25rem; flex:1; }
        .feature-pill { display:flex; align-items:center; gap:0.6rem; background:rgba(94,234,212,0.07); border:1px solid rgba(94,234,212,0.15); border-radius:999px; padding:0.4rem 0.875rem; font-size:0.75rem; color:rgba(94,234,212,0.9); font-family:'Nunito',sans-serif; font-weight:600; }

        .demo-btn {
          flex:1; display:flex; flex-direction:column; align-items:flex-start; gap:0.25rem;
          padding:0.625rem 0.875rem; border-radius:10px; cursor:pointer; transition:all 0.22s; text-align:left;
          border:1px solid rgba(94,234,212,0.2); background:rgba(94,234,212,0.04);
        }
        .demo-btn:hover { background:rgba(94,234,212,0.1); border-color:rgba(94,234,212,0.45); transform:translateY(-1px); }
        .demo-btn.demo-admin { border-color:rgba(167,139,250,0.25); background:rgba(167,139,250,0.04); }
        .demo-btn.demo-admin:hover { background:rgba(167,139,250,0.1); border-color:rgba(167,139,250,0.5); }
        .demo-btn.flashing        { border-color:rgba(94,234,212,0.8)!important; background:rgba(94,234,212,0.15)!important; }
        .demo-btn.demo-admin.flashing { border-color:rgba(167,139,250,0.8)!important; background:rgba(167,139,250,0.15)!important; }

        @media (max-width:900px) {
          .left-panel  { display:none!important; }
          .right-panel { flex:1!important; }
        }
      `}</style>

      <div style={{ display:"flex", height:"100vh", fontFamily:"'Nunito',sans-serif", background:"#060d1a", overflow:"hidden" }}>

        {/* ── LEFT PANEL ── */}
        <div className="left-panel" style={{
          flex:"0 0 52%", position:"relative", overflow:"hidden",
          background:"linear-gradient(160deg,#060d1a 0%,#0a1628 40%,#071420 100%)",
          display:"flex", flexDirection:"column", justifyContent:"center", padding:"3rem",
          opacity: mounted ? 1 : 0, transition:"opacity 0.6s ease",
        }}>
          <NeuralCanvas />
          <div style={{ position:"absolute", top:"-15%", left:"-10%", width:"55%", height:"55%", borderRadius:"50%", background:"radial-gradient(circle,rgba(20,184,166,0.12) 0%,transparent 70%)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:"-15%", right:"-10%", width:"60%", height:"60%", borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 70%)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", top:"8%", right:"8%", width:"120px", height:"120px", pointerEvents:"none", animation:"rotateRing 18s linear infinite" }}>
            <svg viewBox="0 0 120 120" style={{ width:"100%", height:"100%" }}>
              <circle cx="60" cy="60" r="55" fill="none" stroke="rgba(94,234,212,0.12)" strokeWidth="1" strokeDasharray="8 5"/>
            </svg>
          </div>

          <div style={{ position:"relative", zIndex:2, maxWidth:"480px" }}>
            {/* Logo */}
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"2.5rem", animation: mounted ? "fadeUp 0.6s ease both" : "none" }}>
              <div style={{ width:"40px", height:"40px", borderRadius:"10px", background:"linear-gradient(135deg,#14b8a6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 20px rgba(94,234,212,0.3)", animation:"glowPulse 3s ease-in-out infinite" }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 48 48">
                  <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="white"/>
                </svg>
              </div>
              <span style={{ color:"white", fontSize:"1.375rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, letterSpacing:"-0.02em" }}>EduAI</span>
              <span style={{ background:"rgba(94,234,212,0.15)", border:"1px solid rgba(94,234,212,0.3)", borderRadius:"999px", padding:"0.2rem 0.625rem", fontSize:"0.6rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, color:"#5eead4", letterSpacing:"0.1em", textTransform:"uppercase" }}>Hackathon</span>
            </div>

            {/* Headline */}
            <div style={{ animation: mounted ? "fadeUp 0.6s 0.1s ease both" : "none", marginBottom:"1.25rem" }}>
              <p style={{ color:"rgba(94,234,212,0.7)", fontSize:"0.75rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:"0.625rem" }}>AI-Powered Education Platform</p>
              <h1 style={{ color:"white", fontSize:"2.4rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, lineHeight:1.2, letterSpacing:"-0.02em", marginBottom:"0.5rem" }}>
                <Typewriter texts={typewriterTexts} />
              </h1>
              <p style={{ color:"rgba(148,163,184,0.7)", fontSize:"0.9375rem", lineHeight:1.7, fontFamily:"'Nunito',sans-serif" }}>
                Adaptive AI engine maps your unique learning path. Real-time skill assessment. Knowledge that sticks.
              </p>
            </div>

            {/* Feature pills */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", marginBottom:"2rem", animation: mounted ? "fadeUp 0.6s 0.2s ease both" : "none" }}>
              {["🧠 Adaptive AI","📊 Skill Mapping","🎯 Goal Tracking","♿ Accessible"].map(f => (
                <div key={f} className="feature-pill">{f}</div>
              ))}
            </div>

           

            {/* Floating badge */}
            
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel" style={{
          flex:"0 0 48%", display:"flex", alignItems:"center", justifyContent:"center",
          padding:"2rem", background:"#06101f", overflowY:"auto",
          borderLeft:"1px solid rgba(94,234,212,0.07)",
        }}>
          <div style={{
            width:"100%", maxWidth:"400px",
            opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(20px)",
            transition:"opacity 0.7s 0.15s ease, transform 0.7s 0.15s ease",
          }}>

            {/* Heading */}
            <div style={{ marginBottom:"1.75rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.5rem" }}>
                <div style={{ height:"2px", width:"24px", background:"linear-gradient(90deg,#14b8a6,#6366f1)", borderRadius:"999px" }} />
                <span style={{ color:"rgba(94,234,212,0.7)", fontSize:"0.7rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase" }}>Secure Access</span>
              </div>
              <h2 style={{ color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"2rem", letterSpacing:"-0.02em", lineHeight:1.2, marginBottom:"0.375rem" }}>
                Welcome Back
              </h2>
              <p style={{ color:"rgba(148,163,184,0.6)", fontSize:"0.9rem", lineHeight:1.7, fontFamily:"'Nunito',sans-serif" }}>
                Continue your AI-powered learning journey.
              </p>
            </div>

            {/* Role tabs — Student & Admin only */}
            <div style={{ display:"flex", gap:"0.375rem", background:"rgba(255,255,255,0.04)", padding:"0.3rem", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.07)", marginBottom:"1.5rem" }}>
              {[
                { key:"student", label:"Student", icon:"🎓" },
                { key:"admin",   label:"Admin",   icon:"⚙️" },
              ].map(({ key, label, icon }) => (
                <button key={key} className={`tab-btn ${role === key ? "tab-active" : "tab-inactive"}`} onClick={() => setRole(key)}>
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.75rem 0.875rem", borderRadius:"10px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", color:"#fca5a5", fontSize:"0.875rem", marginBottom:"1.25rem", fontFamily:"'Nunito',sans-serif" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"1.125rem" }}>

              {/* Email */}
              <div>
                <label style={{ display:"block", color:"rgba(203,213,225,0.8)", fontSize:"0.78rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:"0.45rem" }}>Email</label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:"0.875rem", top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"rgba(94,234,212,0.5)", fontSize:"0.875rem" }}>✉</span>
                  <input
                    type="email" name="email" autoComplete="email"
                    placeholder="you@university.edu"
                    value={form.email} onChange={handleChange} required
                    className={`edu-input${demoActive ? " flashing" : ""}`}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.45rem" }}>
                  <label style={{ color:"rgba(203,213,225,0.8)", fontSize:"0.78rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase" }}>Password</label>
                  <a href="#" style={{ fontSize:"0.8rem", color:"rgba(94,234,212,0.7)", textDecoration:"none", fontFamily:"'Nunito',sans-serif", fontWeight:600 }}
                    onMouseEnter={e => e.currentTarget.style.color="#5eead4"}
                    onMouseLeave={e => e.currentTarget.style.color="rgba(94,234,212,0.7)"}>
                    Forgot password?
                  </a>
                </div>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:"0.875rem", top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"rgba(94,234,212,0.5)", fontSize:"0.875rem" }}>🔒</span>
                  <input
                    type={showPassword ? "text" : "password"} name="password" autoComplete="current-password"
                    placeholder="Enter your password"
                    value={form.password} onChange={handleChange} required
                    className={`edu-input${demoActive ? " flashing" : ""}`}
                    style={{ paddingRight:"2.75rem" }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ position:"absolute", right:"0.875rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(148,163,184,0.5)", fontSize:"1rem", padding:0, lineHeight:1 }}>
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              {/* ── Demo accounts section ── */}
              <div>
                {/* Divider label */}
                <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.65rem" }}>
                  <div style={{ flex:1, height:"1px", background:"rgba(94,234,212,0.1)" }} />
                  <span style={{ color:"rgba(94,234,212,0.5)", fontSize:"0.68rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", whiteSpace:"nowrap" }}>
                    ⚡ Try a Demo Account
                  </span>
                  <div style={{ flex:1, height:"1px", background:"rgba(94,234,212,0.1)" }} />
                </div>

                {/* Two demo cards */}
                <div style={{ display:"flex", gap:"0.625rem" }}>

                  {/* Student demo */}
                  <button
                    type="button"
                    className={`demo-btn${demoActive === "student" ? " flashing" : ""}`}
                    onClick={() => fillDemo("student")}
                  >
                    <span style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
                      <span style={{ fontSize:"1rem" }}>🎓</span>
                      <span style={{ color:"#5eead4", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:"0.8rem" }}>Student Demo</span>
                      {demoActive === "student" && (
                        <span style={{ fontSize:"0.65rem", color:"#5eead4", fontFamily:"'Nunito',sans-serif", background:"rgba(94,234,212,0.15)", borderRadius:"999px", padding:"0.1rem 0.4rem" }}>✓ filled</span>
                      )}
                    </span>
                    <span style={{ color:"rgba(148,163,184,0.4)", fontSize:"0.68rem", fontFamily:"'Nunito',sans-serif" }}>alice@test.com</span>
                  </button>

                  {/* Admin demo */}
                  <button
                    type="button"
                    className={`demo-btn demo-admin${demoActive === "admin" ? " flashing" : ""}`}
                    onClick={() => fillDemo("admin")}
                  >
                    <span style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
                      <span style={{ fontSize:"1rem" }}>⚙️</span>
                      <span style={{ color:"#a78bfa", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:"0.8rem" }}>Admin Demo</span>
                      {demoActive === "admin" && (
                        <span style={{ fontSize:"0.65rem", color:"#a78bfa", fontFamily:"'Nunito',sans-serif", background:"rgba(167,139,250,0.15)", borderRadius:"999px", padding:"0.1rem 0.4rem" }}>✓ filled</span>
                      )}
                    </span>
                    <span style={{ color:"rgba(148,163,184,0.4)", fontSize:"0.68rem", fontFamily:"'Nunito',sans-serif" }}>admin@educationpsg.com</span>
                  </button>

                </div>
              </div>

              {/* Remember me */}
              <label style={{ display:"flex", alignItems:"center", gap:"0.625rem", cursor:"pointer" }}>
                <div style={{ width:"16px", height:"16px", borderRadius:"4px", border:"1px solid rgba(94,234,212,0.3)", background:"rgba(94,234,212,0.05)", flexShrink:0 }} />
                <span style={{ color:"rgba(148,163,184,0.6)", fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif" }}>Keep me signed in for 30 days</span>
              </label>

              {/* Submit */}
              <button type="submit" disabled={loading} className="submit-btn" style={{ marginTop:"0.25rem" }}>
                {loading ? (
                  <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.6rem" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation:"rotateRing 0.8s linear infinite" }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    Authenticating...
                  </span>
                ) : `Sign In as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
              </button>
            </form>

            {/* Sign up */}
            <p style={{ textAlign:"center", marginTop:"1.75rem", color:"rgba(100,116,139,0.7)", fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif", marginBottom:"1.5rem" }}>
              New to EduAI?{" "}
              <Link to="/register" style={{ color:"#5eead4", fontWeight:700, textDecoration:"none" }}
                onMouseEnter={e => e.currentTarget.style.color="#2dd4bf"}
                onMouseLeave={e => e.currentTarget.style.color="#5eead4"}>
                Create free account →
              </Link>
            </p>

            {/* Footer */}
            <div style={{ display:"flex", justifyContent:"center", gap:"1.25rem" }}>
              {["Privacy","Terms","Help"].map(l => (
                <a key={l} href="#" style={{ fontSize:"0.75rem", color:"rgba(100,116,139,0.4)", textDecoration:"none", fontFamily:"'Nunito',sans-serif", transition:"color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color="rgba(94,234,212,0.6)"}
                  onMouseLeave={e => e.currentTarget.style.color="rgba(100,116,139,0.4)"}>
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}