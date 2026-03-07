import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, analyticsAPI, enrollmentAPI } from "../services/api";

/* ── Global Styles ──────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #060d1a; font-family: 'Nunito', sans-serif; }
  @keyframes spin        { to { transform: rotate(360deg); } }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn      { from{opacity:0} to{opacity:1} }
  @keyframes glowPulse   { 0%,100%{box-shadow:0 0 14px rgba(94,234,212,0.2)} 50%{box-shadow:0 0 26px rgba(94,234,212,0.45)} }
  ::-webkit-scrollbar       { width: 5px; }
  ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
  ::-webkit-scrollbar-thumb { background: rgba(94,234,212,0.18); border-radius: 999px; }
  .sd-search::placeholder   { color: rgba(148,163,184,0.38); }
  .sd-search:focus { border-color: rgba(94,234,212,0.5) !important; background: rgba(15,23,42,0.9) !important; box-shadow: 0 0 0 3px rgba(94,234,212,0.07) !important; }
  .student-row { transition: all 0.2s; }
  .student-row:hover { border-color: rgba(94,234,212,0.28) !important; background: rgba(255,255,255,0.05) !important; }
  .student-row.active { background: rgba(94,234,212,0.07) !important; border-color: rgba(94,234,212,0.35) !important; }
  .stat-mini:hover { border-color: rgba(94,234,212,0.22) !important; background: rgba(255,255,255,0.05) !important; transform: translateY(-1px); }
  .enroll-row:hover { background: rgba(255,255,255,0.04) !important; }
  .full-analytics-btn:hover { opacity: 0.85 !important; transform: translateY(-1px) !important; }
  .retry-btn:hover { border-color: rgba(94,234,212,0.4) !important; color: #5eead4 !important; }
`;

/* ── Spinner ────────────────────────────────────────────────── */
function Spinner({ message = "Loading…", fullPage = false }) {
  const wrap = fullPage
    ? { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#060d1a", gap:"1rem" }
    : { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"3.5rem 2rem", gap:"0.875rem" };
  return (
    <div style={wrap}>
      <div style={{ width:"38px", height:"38px", border:"3px solid rgba(94,234,212,0.1)", borderTopColor:"#5eead4", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <span style={{ color:"rgba(148,163,184,0.5)", fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif" }}>{message}</span>
    </div>
  );
}

/* ── Section Title ──────────────────────────────────────────── */
function SectionTitle({ icon, title }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.875rem" }}>
      <span style={{ fontSize:"1rem" }}>{icon}</span>
      <h3 style={{ fontSize:"0.9rem", fontWeight:800, color:"rgba(226,232,240,0.9)", fontFamily:"'Plus Jakarta Sans',sans-serif", margin:0 }}>{title}</h3>
    </div>
  );
}

/* ── Stat Mini Card ─────────────────────────────────────────── */
function StatMini({ icon, value, label, suffix = "", isText = false, accentColor = "#5eead4" }) {
  const display = isText ? value : `${value}${suffix}`;
  return (
    <div className="stat-mini" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"0.9rem 1rem", transition:"all 0.2s", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:"-12px", right:"-12px", width:"52px", height:"52px", borderRadius:"50%", background:`radial-gradient(circle, ${accentColor}1a 0%, transparent 70%)`, pointerEvents:"none" }} />
      <div style={{ width:"28px", height:"28px", borderRadius:"8px", background:`${accentColor}16`, border:`1px solid ${accentColor}26`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.875rem", marginBottom:"0.5rem" }}>{icon}</div>
      <div style={{ fontSize:"1.25rem", fontWeight:800, color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.02em", lineHeight:1, marginBottom:"0.2rem" }}>{display}</div>
      <div style={{ fontSize:"0.65rem", fontWeight:700, color:"rgba(148,163,184,0.5)", fontFamily:"'Plus Jakarta Sans',sans-serif", textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function StudentDetails() {
  const navigate = useNavigate();
  const [students,           setStudents]           = useState([]);
  const [selectedStudent,    setSelectedStudent]    = useState(null);
  const [studentAnalytics,   setStudentAnalytics]   = useState(null);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [detailsLoading,     setDetailsLoading]     = useState(false);
  const [searchQuery,        setSearchQuery]        = useState("");
  const [error,              setError]              = useState("");

  useEffect(() => { loadStudents(); }, []);

  const loadStudents = async () => {
    try {
      const res = await authAPI.getAllStudents();
      setStudents(res.data.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load students");
    } finally { setLoading(false); }
  };

  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    setDetailsLoading(true);
    setStudentAnalytics(null);
    setStudentEnrollments([]);
    try {
      try {
        const aRes = await analyticsAPI.getStudentAnalytics(student._id);
        setStudentAnalytics(aRes.data.data || null);
      } catch {}
      try {
        const eRes = await enrollmentAPI.getAllEnrollments();
        setStudentEnrollments((eRes.data.data || []).filter(e => e.student?._id === student._id || e.student === student._id));
      } catch { setStudentEnrollments([]); }
    } finally { setDetailsLoading(false); }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#060d1a" }}>
      <style>{STYLES}</style>
      <Spinner message="Loading students…" fullPage />
    </div>
  );

  /* ── Error state ──────────────────────────────────────────── */
  if (error) return (
    <div style={{ minHeight:"100vh", background:"#060d1a" }}>
      <style>{STYLES}</style>
      <Navbar />
      <div style={{ maxWidth:"640px", margin:"4rem auto", padding:"0 1.5rem", textAlign:"center" }}>
        <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>⚠️</div>
        <h2 style={{ fontSize:"1.25rem", fontWeight:800, color:"rgba(226,232,240,0.9)", fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:"0.5rem" }}>Failed to Load Students</h2>
        <p style={{ color:"rgba(148,163,184,0.5)", fontFamily:"'Nunito',sans-serif", fontSize:"0.9rem", marginBottom:"1.5rem" }}>{error}</p>
        <button className="retry-btn" onClick={() => { setError(""); setLoading(true); loadStudents(); }} style={{ padding:"0.7rem 1.5rem", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", color:"rgba(148,163,184,0.6)", fontSize:"0.875rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.2s" }}>
          ↺ Retry
        </button>
      </div>
    </div>
  );

  /* ── Main render ──────────────────────────────────────────── */
  return (
    <div style={{ minHeight:"100vh", background:"#060d1a" }}>
      <style>{STYLES}</style>
      <Navbar />

      <div style={{ maxWidth:"1300px", margin:"0 auto", padding:"1.75rem 1.75rem 4rem", animation:"fadeSlideUp 0.45s ease both" }}>

        {/* Page header */}
        <div style={{ marginBottom:"1.625rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.4rem" }}>
            <div style={{ height:"14px", width:"3px", background:"linear-gradient(180deg,#5eead4,#6366f1)", borderRadius:"999px" }} />
            <p style={{ fontSize:"0.65rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, color:"rgba(94,234,212,0.65)", letterSpacing:"0.12em", textTransform:"uppercase", margin:0 }}>Admin Panel</p>
          </div>
          <h1 style={{ fontSize:"1.625rem", fontWeight:800, color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.02em", marginBottom:"0.3rem" }}>Student Details 👥</h1>
          <p style={{ color:"rgba(148,163,184,0.5)", fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif" }}>View all students and their performance analytics.</p>
        </div>

        {/* Layout grid */}
        <div style={{ display:"grid", gridTemplateColumns: selectedStudent ? "340px 1fr" : "1fr", gap:"1.375rem", alignItems:"start" }}>

          {/* ── LEFT: Student list ─────────────────────────── */}
          <div>
            {/* Search */}
            <div style={{ position:"relative", marginBottom:"0.875rem" }}>
              <svg style={{ position:"absolute", left:"0.8rem", top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.38)" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" className="sd-search" placeholder="Search by name or email…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width:"100%", paddingLeft:"2.25rem", paddingRight:"0.875rem", paddingTop:"0.625rem", paddingBottom:"0.625rem", background:"rgba(15,23,42,0.65)", border:"1px solid rgba(94,234,212,0.12)", borderRadius:"10px", color:"#e2e8f0", fontSize:"0.875rem", outline:"none", fontFamily:"'Nunito',sans-serif", transition:"all 0.22s" }} />
            </div>

            {/* Count */}
            <div style={{ marginBottom:"0.75rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:"0.72rem", fontWeight:700, color:"rgba(148,163,184,0.45)", fontFamily:"'Plus Jakarta Sans',sans-serif", textTransform:"uppercase", letterSpacing:"0.08em" }}>
                {filteredStudents.length} {filteredStudents.length === 1 ? "student" : "students"}
              </span>
              {selectedStudent && (
                <button onClick={() => setSelectedStudent(null)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"0.72rem", color:"rgba(94,234,212,0.5)", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, transition:"color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color="#5eead4"} onMouseLeave={e => e.currentTarget.style.color="rgba(94,234,212,0.5)"}>
                  Clear ×
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", maxHeight:"calc(100vh - 260px)", overflowY:"auto", paddingRight:"2px" }}>
              {filteredStudents.length === 0 ? (
                <div style={{ padding:"3rem 1.5rem", textAlign:"center", background:"rgba(255,255,255,0.02)", border:"1px dashed rgba(255,255,255,0.07)", borderRadius:"14px" }}>
                  <div style={{ fontSize:"2rem", marginBottom:"0.75rem" }}>🔍</div>
                  <p style={{ fontWeight:700, fontSize:"0.9rem", color:"rgba(226,232,240,0.5)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>No students found</p>
                  <p style={{ fontSize:"0.8rem", color:"rgba(148,163,184,0.35)", fontFamily:"'Nunito',sans-serif", marginTop:"0.3rem" }}>Try adjusting your search</p>
                </div>
              ) : (
                filteredStudents.map(student => {
                  const isActive = selectedStudent?._id === student._id;
                  return (
                    <div key={student._id} className={`student-row${isActive ? " active" : ""}`} onClick={() => handleStudentClick(student)} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${isActive ? "rgba(94,234,212,0.35)" : "rgba(255,255,255,0.07)"}`, borderRadius:"12px", padding:"0.875rem 1rem", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.75rem" }}>
                      {/* Avatar */}
                      <div style={{ width:"40px", height:"40px", borderRadius:"50%", background: isActive ? "linear-gradient(135deg,#14b8a6,#6366f1)" : "linear-gradient(135deg,rgba(99,102,241,0.5),rgba(20,184,166,0.5))", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.9375rem", fontWeight:800, fontFamily:"'Plus Jakarta Sans',sans-serif", flexShrink:0, animation: isActive ? "glowPulse 3s ease-in-out infinite" : "none" }}>
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:"0.875rem", color: isActive ? "rgba(226,232,240,0.95)" : "rgba(226,232,240,0.8)", fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:"0.15rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{student.name}</div>
                        <div style={{ fontSize:"0.72rem", color:"rgba(148,163,184,0.45)", fontFamily:"'Nunito',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{student.email}</div>
                      </div>
                      {isActive ? (
                        <div style={{ width:"20px", height:"20px", borderRadius:"50%", background:"rgba(94,234,212,0.15)", border:"1px solid rgba(94,234,212,0.35)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#5eead4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT: Student details ─────────────────────── */}
          {selectedStudent && (
            <div style={{ animation:"fadeIn 0.3s ease both" }}>
              {detailsLoading ? (
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px" }}>
                  <Spinner message="Loading student details…" />
                </div>
              ) : (
                <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", overflow:"hidden" }}>

                  {/* Profile header */}
                  <div style={{ padding:"1.5rem 1.625rem", borderBottom:"1px solid rgba(255,255,255,0.06)", background:"linear-gradient(120deg,rgba(20,184,166,0.06) 0%,rgba(99,102,241,0.06) 100%)", display:"flex", alignItems:"center", gap:"1rem" }}>
                    <div style={{ width:"60px", height:"60px", borderRadius:"16px", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", fontWeight:800, fontFamily:"'Plus Jakarta Sans',sans-serif", flexShrink:0, animation:"glowPulse 3s ease-in-out infinite" }}>
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <h2 style={{ fontSize:"1.25rem", fontWeight:800, color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:"0.25rem", letterSpacing:"-0.01em" }}>{selectedStudent.name}</h2>
                      <p style={{ fontSize:"0.8rem", color:"rgba(148,163,184,0.55)", fontFamily:"'Nunito',sans-serif" }}>{selectedStudent.email}</p>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"0.4rem", flexShrink:0 }}>
                      <span style={{ padding:"0.2rem 0.625rem", borderRadius:"999px", fontSize:"0.6rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", background:"rgba(94,234,212,0.1)", border:"1px solid rgba(94,234,212,0.22)", color:"#5eead4", letterSpacing:"0.08em", textTransform:"uppercase" }}>
                        {selectedStudent.role?.toUpperCase()}
                      </span>
                      <span style={{ fontSize:"0.68rem", color:"rgba(148,163,184,0.38)", fontFamily:"'Nunito',sans-serif" }}>
                        Joined {new Date(selectedStudent.createdAt).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding:"1.375rem 1.625rem", display:"flex", flexDirection:"column", gap:"1.5rem" }}>

                    {/* Analytics */}
                    {studentAnalytics && (
                      <div>
                        <SectionTitle icon="📊" title="Performance Analytics" />

                        {/* Dropout risk */}
                        {studentAnalytics.dropoutRisk === "Yes" && (
                          <div style={{ display:"flex", gap:"0.75rem", background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:"10px", padding:"0.875rem 1rem", color:"#fbbf24", marginBottom:"0.875rem" }}>
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink:0, marginTop:"1px" }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            <div>
                              <strong style={{ display:"block", marginBottom:"2px", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:"0.82rem" }}>Dropout Risk Detected</strong>
                              <span style={{ fontSize:"0.775rem", color:"rgba(251,191,36,0.65)", fontFamily:"'Nunito',sans-serif" }}>This student is at risk. Consider reaching out for support.</span>
                            </div>
                          </div>
                        )}

                        {/* Stats grid */}
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:"0.625rem" }}>
                          <StatMini icon="📝" value={studentAnalytics.totalQuizzesTaken ?? 0}          label="Quizzes Taken"      accentColor="#6366f1" />
                          <StatMini icon="⭐" value={studentAnalytics.averageScore ?? 0}               label="Avg Score" suffix="%" accentColor="#3b82f6" />
                          <StatMini icon="🏆" value={studentAnalytics.recommendedLevel ?? "N/A"}       label="Rec. Level"   isText  accentColor="#fbbf24" />
                          <StatMini icon="🤖" value={studentAnalytics.predictedPerformance ?? "N/A"}   label="AI Prediction" isText accentColor={studentAnalytics.predictedPerformance === "High" ? "#5eead4" : studentAnalytics.predictedPerformance === "Low" ? "#f87171" : "#818cf8"} />
                        </div>
                      </div>
                    )}

                    {/* Enrolled Courses */}
                    <div>
                      <SectionTitle icon="📚" title="Enrolled Courses" />
                      {studentEnrollments.length === 0 ? (
                        <div style={{ padding:"1.75rem 1.25rem", textAlign:"center", background:"rgba(255,255,255,0.02)", border:"1px dashed rgba(255,255,255,0.07)", borderRadius:"12px" }}>
                          <div style={{ fontSize:"1.75rem", marginBottom:"0.5rem" }}>📚</div>
                          <p style={{ fontWeight:700, fontSize:"0.85rem", color:"rgba(226,232,240,0.45)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>No enrollments yet</p>
                          <p style={{ fontSize:"0.775rem", color:"rgba(148,163,184,0.35)", fontFamily:"'Nunito',sans-serif", marginTop:"0.25rem" }}>This student hasn't enrolled in any courses.</p>
                        </div>
                      ) : (
                        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"12px", overflow:"hidden" }}>
                          {studentEnrollments.map((enroll, idx) => {
                            const completed = enroll.status === "completed";
                            return (
                              <div key={enroll._id} className="enroll-row" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:"0.875rem", padding:"0.875rem 1rem", borderBottom: idx < studentEnrollments.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", transition:"background 0.18s" }}>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontWeight:700, fontSize:"0.85rem", color:"rgba(226,232,240,0.85)", fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:"0.15rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{enroll.course?.title || "Unknown Course"}</div>
                                  <div style={{ fontSize:"0.7rem", color:"rgba(148,163,184,0.4)", fontFamily:"'Nunito',sans-serif" }}>
                                    Enrolled {new Date(enroll.createdAt).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
                                  </div>
                                </div>
                                <span style={{ padding:"0.2rem 0.625rem", borderRadius:"999px", fontSize:"0.62rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"0.06em", textTransform:"uppercase", flexShrink:0, background: completed ? "rgba(16,185,129,0.12)" : "rgba(251,191,36,0.12)", border: `1px solid ${completed ? "rgba(16,185,129,0.28)" : "rgba(251,191,36,0.28)"}`, color: completed ? "#34d399" : "#fbbf24" }}>
                                  {enroll.status?.toUpperCase() || "ACTIVE"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Score History */}
                    {studentAnalytics?.scoreHistory?.length > 0 && (
                      <div>
                        <SectionTitle icon="📈" title="Recent Activity" />
                        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"12px", overflow:"hidden" }}>
                          {studentAnalytics.scoreHistory.slice(-5).reverse().map((item, idx, arr) => {
                            const pass = item.score >= 60;
                            return (
                              <div key={idx} style={{ display:"flex", alignItems:"center", gap:"0.875rem", padding:"0.875rem 1rem", borderBottom: idx < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                                <div style={{ width:"34px", height:"34px", borderRadius:"10px", background: pass ? "rgba(16,185,129,0.12)" : "rgba(248,113,113,0.12)", border: `1px solid ${pass ? "rgba(16,185,129,0.25)" : "rgba(248,113,113,0.25)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.875rem", flexShrink:0 }}>
                                  {pass ? "✅" : "📝"}
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontWeight:700, fontSize:"0.8375rem", color:"rgba(226,232,240,0.85)", fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:"0.1rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.course || "Unknown Course"}</div>
                                  <div style={{ fontSize:"0.7rem", color:"rgba(148,163,184,0.4)", fontFamily:"'Nunito',sans-serif" }}>
                                    {item.date ? new Date(item.date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—"}
                                  </div>
                                </div>
                                <span style={{ padding:"0.2rem 0.625rem", borderRadius:"999px", fontSize:"0.72rem", fontWeight:800, fontFamily:"'Plus Jakarta Sans',sans-serif", flexShrink:0, background: pass ? "rgba(16,185,129,0.12)" : "rgba(248,113,113,0.12)", border: `1px solid ${pass ? "rgba(16,185,129,0.28)" : "rgba(248,113,113,0.28)"}`, color: pass ? "#34d399" : "#f87171" }}>
                                  {item.score}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    <button className="full-analytics-btn" onClick={() => navigate(`/analytics/${selectedStudent._id}`)} style={{ width:"100%", padding:"0.8rem", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", border:"none", borderRadius:"12px", fontSize:"0.9rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.22s", boxShadow:"0 4px 16px rgba(20,184,166,0.22)" }}>
                      View Full Analytics →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty right panel prompt */}
          {!selectedStudent && students.length > 0 && (
            <div style={{ display:"none" }} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Navbar ─────────────────────────────────────────────────── */
function Navbar() {
  return (
    <div style={{ background:"rgba(6,16,31,0.96)", borderBottom:"1px solid rgba(94,234,212,0.07)", padding:"0 1.75rem", display:"flex", justifyContent:"space-between", alignItems:"center", height:"60px", position:"sticky", top:0, zIndex:50, backdropFilter:"blur(14px)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
        <div style={{ width:"30px", height:"30px", borderRadius:"8px", background:"linear-gradient(135deg,#14b8a6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", animation:"glowPulse 3s ease-in-out infinite" }}>
          <svg width="17" height="17" fill="none" viewBox="0 0 48 48"><path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="white"/></svg>
        </div>
        <span style={{ color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"1.0625rem", letterSpacing:"-0.02em" }}>EduAI</span>
        <span style={{ background:"rgba(167,139,250,0.15)", border:"1px solid rgba(167,139,250,0.28)", borderRadius:"999px", padding:"0.15rem 0.5rem", fontSize:"0.58rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, color:"#a78bfa", letterSpacing:"0.08em", textTransform:"uppercase" }}>Admin</span>
      </div>
    </div>
  );
}