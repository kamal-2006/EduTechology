import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api.js";

const ROLES = [
  { value: "student",  label: "Student",  icon: "🎓", desc: "I want to learn"  },
  { value: "faculty",  label: "Faculty",  icon: "👨‍🏫", desc: "I want to teach"  },
];

/* ── Animated neural canvas (shared design with Login) ─────── */
function NeuralCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const NODES = 38;
    const nodes = Array.from({ length: NODES }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2 + 1, pulse: Math.random() * Math.PI * 2,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach(n => { n.x += n.vx; n.y += n.vy; n.pulse += 0.02;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });
      for (let i = 0; i < NODES; i++) for (let j = i+1; j < NODES; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 130) {
          ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(94,234,212,${(1-d/130)*0.18})`; ctx.lineWidth = 0.8; ctx.stroke();
        }
      }
      nodes.forEach(n => {
        const a = 0.5 + 0.5*Math.sin(n.pulse);
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + Math.sin(n.pulse)*0.6, 0, Math.PI*2);
        ctx.fillStyle = `rgba(94,234,212,${a*0.7})`; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x, n.y, (n.r+3)*(0.7+0.3*Math.sin(n.pulse)), 0, Math.PI*2);
        ctx.strokeStyle = `rgba(94,234,212,${a*0.15})`; ctx.lineWidth = 1; ctx.stroke();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }} />;
}

/* ── Password strength meter ───────────────────────────────── */
function PasswordStrength({ password }) {
  const checks = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#ef4444", "#f97316", "#eab308", "#14b8a6"];
  if (!password) return null;
  return (
    <div style={{ marginTop:"0.5rem" }}>
      <div style={{ display:"flex", gap:"3px", marginBottom:"0.3rem" }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex:1, height:"3px", borderRadius:"999px", background: i <= score ? colors[score] : "rgba(255,255,255,0.1)", transition:"background 0.3s" }} />
        ))}
      </div>
      <span style={{ fontSize:"0.7rem", fontFamily:"'Nunito',sans-serif", color: colors[score], fontWeight:600 }}>{labels[score]}</span>
    </div>
  );
}

/* ── Main Register ─────────────────────────────────────────── */
export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", password:"", confirmPassword:"", role:"student" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [agreed, setAgreed]   = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (!agreed) return setError("Please accept the terms to continue.");
    setLoading(true);
    try {
      const { data } = await authAPI.register({ name:form.name, email:form.email, password:form.password, role:form.role });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; overflow: hidden; font-family: 'Nunito', sans-serif; }

        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse {
          0%,100% { box-shadow: 0 0 18px rgba(94,234,212,0.25), 0 0 40px rgba(94,234,212,0.08); }
          50%      { box-shadow: 0 0 28px rgba(94,234,212,0.45), 0 0 60px rgba(94,234,212,0.15); }
        }
        @keyframes shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes rotateRing { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes floatBadge { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-8px) rotate(-2deg)} }

        .reg-input {
          width:100%; background:rgba(15,23,42,0.6); border:1px solid rgba(94,234,212,0.18);
          border-radius:10px; color:#e2e8f0; font-family:'Nunito',sans-serif; font-size:0.9rem;
          outline:none; transition:all 0.25s; padding:0.7rem 0.875rem 0.7rem 2.6rem;
        }
        .reg-input::placeholder { color:rgba(148,163,184,0.45); }
        .reg-input:focus { border-color:rgba(94,234,212,0.6); background:rgba(15,23,42,0.85); box-shadow:0 0 0 3px rgba(94,234,212,0.07); }

        .submit-btn {
          width:100%; padding:0.875rem; border:none; border-radius:10px; cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif; font-size:0.9375rem; font-weight:700; letter-spacing:0.01em;
          background:linear-gradient(135deg,#14b8a6 0%,#0891b2 50%,#6366f1 100%);
          background-size:200% 200%; color:white; transition:all 0.3s; position:relative; overflow:hidden;
        }
        .submit-btn:hover:not(:disabled) { background-position:right center; transform:translateY(-1px); box-shadow:0 8px 25px rgba(20,184,166,0.35); }
        .submit-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .submit-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent 20%,rgba(255,255,255,0.08) 50%,transparent 80%); background-size:200% auto; animation:shimmer 2s linear infinite; }

        .role-card { transition:all 0.2s; cursor:pointer; }
        .role-card:hover { border-color:rgba(94,234,212,0.5) !important; background:rgba(94,234,212,0.04) !important; }

        @media (max-width:900px) {
          .left-panel { display:none !important; }
          .right-panel { flex:1 !important; }
        }
      `}</style>

      <div style={{ display:"flex", height:"100vh", fontFamily:"'Nunito',sans-serif", background:"#060d1a", overflow:"hidden" }}>

        {/* ── LEFT PANEL ── */}
        <div className="left-panel" style={{
          flex:"0 0 48%", position:"relative", overflow:"hidden",
          background:"linear-gradient(160deg,#060d1a 0%,#0a1628 40%,#071420 100%)",
          display:"flex", flexDirection:"column", justifyContent:"center", padding:"3rem",
          opacity: mounted ? 1 : 0, transition:"opacity 0.6s ease",
        }}>
          <NeuralCanvas />

          {/* Glow blobs */}
          <div style={{ position:"absolute", top:"-15%", left:"-10%", width:"55%", height:"55%", borderRadius:"50%", background:"radial-gradient(circle,rgba(20,184,166,0.12) 0%,transparent 70%)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:"-15%", right:"-10%", width:"60%", height:"60%", borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 70%)", pointerEvents:"none" }} />

          {/* Rotating ring */}
          <div style={{ position:"absolute", top:"8%", right:"8%", width:"120px", height:"120px", pointerEvents:"none", animation:"rotateRing 18s linear infinite" }}>
            <svg viewBox="0 0 120 120" style={{ width:"100%", height:"100%" }}>
              <circle cx="60" cy="60" r="55" fill="none" stroke="rgba(94,234,212,0.12)" strokeWidth="1" strokeDasharray="8 5"/>
            </svg>
          </div>

          <div style={{ position:"relative", zIndex:2, maxWidth:"460px" }}>
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

            {/* Hero text */}
            <div style={{ animation: mounted ? "fadeUp 0.6s 0.1s ease both" : "none", marginBottom:"2rem" }}>
              <p style={{ color:"rgba(94,234,212,0.7)", fontSize:"0.75rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:"0.625rem" }}>Join 50,000+ Learners</p>
              <h1 style={{ color:"white", fontSize:"2.2rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, lineHeight:1.2, letterSpacing:"-0.02em", marginBottom:"0.75rem" }}>
                Start your learning journey today.
              </h1>
              <p style={{ color:"rgba(148,163,184,0.7)", fontSize:"0.9375rem", lineHeight:1.7, fontFamily:"'Nunito',sans-serif" }}>
                Create your free account and get instant access to AI-powered courses, skill assessments, and personalised learning paths.
              </p>
            </div>

            {/* Checklist */}
            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem", marginBottom:"2rem", animation: mounted ? "fadeUp 0.6s 0.2s ease both" : "none" }}>
              {[
                ["🧠", "AI adapts to your pace and learning style"],
                ["📊", "Real-time progress tracking & analytics"],
                ["🎯", "Personalised goals with milestone rewards"],
                ["♿", "Fully accessible — learn anywhere, anytime"],
              ].map(([icon, text]) => (
                <div key={text} style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                  <div style={{ width:"28px", height:"28px", borderRadius:"8px", background:"rgba(94,234,212,0.1)", border:"1px solid rgba(94,234,212,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.875rem", flexShrink:0 }}>{icon}</div>
                  <span style={{ color:"rgba(203,213,225,0.75)", fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif", lineHeight:1.4 }}>{text}</span>
                </div>
              ))}
            </div>


            {/* Floating badge */}
            
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel" style={{
          flex:"0 0 52%", display:"flex", alignItems:"center", justifyContent:"center",
          padding:"1.5rem 2rem", background:"#06101f", overflowY:"auto",
          borderLeft:"1px solid rgba(94,234,212,0.07)",
        }}>
          <div style={{
            width:"100%", maxWidth:"460px",
            opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(20px)",
            transition:"opacity 0.7s 0.15s ease, transform 0.7s 0.15s ease",
          }}>

            {/* Heading */}
            <div style={{ marginBottom:"1.5rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.5rem" }}>
                <div style={{ height:"2px", width:"24px", background:"linear-gradient(90deg,#14b8a6,#6366f1)", borderRadius:"999px" }} />
                <span style={{ color:"rgba(94,234,212,0.7)", fontSize:"0.7rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase" }}>Free Forever</span>
              </div>
              <h2 style={{ color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"1.875rem", letterSpacing:"-0.02em", lineHeight:1.2, marginBottom:"0.35rem" }}>
                Create your account
              </h2>
              <p style={{ color:"rgba(148,163,184,0.6)", fontSize:"0.9rem", lineHeight:1.6, fontFamily:"'Nunito',sans-serif" }}>
                Join the EduAI platform — no credit card required.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.75rem 0.875rem", borderRadius:"10px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", color:"#fca5a5", fontSize:"0.875rem", marginBottom:"1.25rem", fontFamily:"'Nunito',sans-serif" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* Role selector */}
            <div style={{ marginBottom:"1.25rem" }}>
              <label style={{ display:"block", color:"rgba(203,213,225,0.8)", fontSize:"0.78rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:"0.6rem" }}>I am a</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                {ROLES.map(r => {
                  const active = form.role === r.value;
                  return (
                    <button key={r.value} type="button" className="role-card"
                      onClick={() => setForm(p => ({ ...p, role: r.value }))}
                      style={{
                        position:"relative", display:"flex", alignItems:"center", gap:"0.75rem",
                        padding:"0.875rem 1rem", borderRadius:"12px", border:"1px solid",
                        borderColor: active ? "rgba(94,234,212,0.5)" : "rgba(255,255,255,0.08)",
                        background: active ? "rgba(94,234,212,0.07)" : "rgba(255,255,255,0.03)",
                        cursor:"pointer", textAlign:"left", transition:"all 0.2s",
                        boxShadow: active ? "0 0 0 1px rgba(94,234,212,0.2), inset 0 1px 0 rgba(94,234,212,0.05)" : "none",
                      }}>
                      <div style={{ width:"36px", height:"36px", borderRadius:"9px", background: active ? "rgba(94,234,212,0.15)" : "rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", flexShrink:0 }}>{r.icon}</div>
                      <div>
                        <p style={{ margin:0, fontSize:"0.875rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, color: active ? "#5eead4" : "rgba(226,232,240,0.9)" }}>{r.label}</p>
                        <p style={{ margin:0, fontSize:"0.72rem", fontFamily:"'Nunito',sans-serif", color: active ? "rgba(94,234,212,0.7)" : "rgba(148,163,184,0.5)", marginTop:"0.1rem" }}>{r.desc}</p>
                      </div>
                      {active && (
                        <div style={{ position:"absolute", top:"0.5rem", right:"0.625rem", width:"16px", height:"16px", borderRadius:"50%", background:"linear-gradient(135deg,#14b8a6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>

              {/* Full name */}
              <div>
                <label style={{ display:"block", color:"rgba(203,213,225,0.8)", fontSize:"0.78rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:"0.4rem" }}>Full Name</label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:"0.875rem", top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"rgba(94,234,212,0.5)", fontSize:"0.875rem" }}>👤</span>
                  <input type="text" name="name" autoComplete="name" placeholder="John Doe" value={form.name} onChange={handleChange} required className="reg-input" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display:"block", color:"rgba(203,213,225,0.8)", fontSize:"0.78rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:"0.4rem" }}>Email Address</label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:"0.875rem", top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"rgba(94,234,212,0.5)", fontSize:"0.875rem" }}>✉</span>
                  <input type="email" name="email" autoComplete="email" placeholder="john@university.edu" value={form.email} onChange={handleChange} required className="reg-input" />
                </div>
              </div>

              {/* Password row */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                {/* Password */}
                <div>
                  <label style={{ display:"block", color:"rgba(203,213,225,0.8)", fontSize:"0.78rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:"0.4rem" }}>Password</label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:"0.875rem", top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"rgba(94,234,212,0.5)", fontSize:"0.875rem" }}>🔒</span>
                    <input type={showPw ? "text" : "password"} name="password" autoComplete="new-password" placeholder="••••••••" value={form.password} onChange={handleChange} required className="reg-input" style={{ paddingRight:"2.5rem" }} />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{ position:"absolute", right:"0.75rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(148,163,184,0.5)", fontSize:"0.9rem", padding:0, lineHeight:1 }}>
                      {showPw ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  <PasswordStrength password={form.password} />
                </div>

                {/* Confirm password */}
                <div>
                  <label style={{ display:"block", color:"rgba(203,213,225,0.8)", fontSize:"0.78rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:"0.4rem" }}>Confirm</label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:"0.875rem", top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"rgba(94,234,212,0.5)", fontSize:"0.875rem" }}>🔑</span>
                    <input type={showCpw ? "text" : "password"} name="confirmPassword" autoComplete="new-password" placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} required className="reg-input" style={{ paddingRight:"2.5rem", borderColor: form.confirmPassword && form.confirmPassword !== form.password ? "rgba(239,68,68,0.5)" : undefined }} />
                    <button type="button" onClick={() => setShowCpw(v => !v)} style={{ position:"absolute", right:"0.75rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(148,163,184,0.5)", fontSize:"0.9rem", padding:0, lineHeight:1 }}>
                      {showCpw ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  {form.confirmPassword && form.confirmPassword !== form.password && (
                    <p style={{ marginTop:"0.35rem", fontSize:"0.7rem", color:"#fca5a5", fontFamily:"'Nunito',sans-serif" }}>Passwords don't match</p>
                  )}
                  {form.confirmPassword && form.confirmPassword === form.password && (
                    <p style={{ marginTop:"0.35rem", fontSize:"0.7rem", color:"#14b8a6", fontFamily:"'Nunito',sans-serif" }}>✓ Looks good!</p>
                  )}
                </div>
              </div>

              {/* Terms checkbox */}
              <label style={{ display:"flex", alignItems:"flex-start", gap:"0.625rem", cursor:"pointer", marginTop:"0.125rem" }} onClick={() => setAgreed(v => !v)}>
                <div style={{ width:"17px", height:"17px", borderRadius:"5px", border:`1px solid ${agreed ? "rgba(94,234,212,0.6)" : "rgba(94,234,212,0.25)"}`, background: agreed ? "rgba(94,234,212,0.15)" : "rgba(94,234,212,0.04)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:"1px", transition:"all 0.2s" }}>
                  {agreed && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#5eead4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ color:"rgba(148,163,184,0.6)", fontSize:"0.8125rem", fontFamily:"'Nunito',sans-serif", lineHeight:1.5 }}>
                  I agree to the{" "}
                  <a href="#" style={{ color:"#5eead4", textDecoration:"none", fontWeight:600 }} onClick={e => e.stopPropagation()}>Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" style={{ color:"#5eead4", textDecoration:"none", fontWeight:600 }} onClick={e => e.stopPropagation()}>Privacy Policy</a>
                </span>
              </label>

              {/* Submit */}
              <button type="submit" disabled={loading} className="submit-btn" style={{ marginTop:"0.25rem" }}>
                {loading ? (
                  <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.6rem" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation:"rotateRing 0.8s linear infinite" }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    Creating your account...
                  </span>
                ) : (
                  <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem" }}>
                    Create Account <span style={{ fontSize:"1rem" }}>→</span>
                  </span>
                )}
              </button>
            </form>

            {/* Sign in link */}
            <p style={{ textAlign:"center", marginTop:"1.5rem", color:"rgba(100,116,139,0.7)", fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif" }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color:"#5eead4", fontWeight:700, textDecoration:"none" }}
                onMouseEnter={e => e.currentTarget.style.color="#2dd4bf"}
                onMouseLeave={e => e.currentTarget.style.color="#5eead4"}>
                Sign in →
              </Link>
            </p>

            {/* Footer */}
            <div style={{ display:"flex", justifyContent:"center", gap:"1.25rem", marginTop:"1.25rem" }}>
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