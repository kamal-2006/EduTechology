import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
  BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell, LabelList,
} from "recharts";
import { analyticsAPI, enrollmentAPI, levelRegAPI } from "../services/api.js";
import RecommendationsPanel from "../components/RecommendationsPanel.jsx";

/* ── Theme & Constants ─────────────────────────────────────── */
const PIE_COLORS = { High: "#5eead4", Medium: "#fbbf24", Low: "#f87171" };
const PASS_SCORE = 60;

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #060d1a; font-family: 'Nunito', sans-serif; color: rgba(226,232,240,0.88); }
  @keyframes spin        { to { transform: rotate(360deg); } }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glowPulse   { 0%,100%{box-shadow:0 0 14px rgba(94,234,212,0.2)} 50%{box-shadow:0 0 28px rgba(94,234,212,0.45)} }
  @keyframes pulse       { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes toastIn     { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  ::-webkit-scrollbar       { width:5px; }
  ::-webkit-scrollbar-track { background:rgba(255,255,255,0.02); }
  ::-webkit-scrollbar-thumb { background:rgba(94,234,212,0.18); border-radius:999px; }
  .stat-card-dark { transition: all 0.22s; }
  .stat-card-dark:hover { transform: translateY(-3px); border-color: rgba(94,234,212,0.22) !important; box-shadow: 0 12px 32px rgba(0,0,0,0.35) !important; }
  .table-row-dark:hover { background: rgba(255,255,255,0.035) !important; }
`;

const CHART_TOOLTIP = {
  contentStyle: {
    background: "rgba(10,20,40,0.97)",
    border: "1px solid rgba(94,234,212,0.18)",
    borderRadius: 10,
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    fontSize: "0.82rem",
    padding: "8px 14px",
    fontFamily: "'Nunito', sans-serif",
  },
  labelStyle: { fontWeight: 700, color: "#5eead4" },
  itemStyle: { color: "rgba(203,213,225,0.85)" },
  cursor: { fill: "rgba(99,102,241,0.08)", stroke: "rgba(99,102,241,0.15)", strokeWidth: 1 },
};

/* ── Navbar ─────────────────────────────────────────────────── */
function Navbar() {
  return (
    <div style={{ background:"rgba(6,16,31,0.96)", borderBottom:"1px solid rgba(94,234,212,0.07)", padding:"0 1.75rem", display:"flex", alignItems:"center", height:"60px", position:"sticky", top:0, zIndex:50, backdropFilter:"blur(14px)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
        <div style={{ width:"30px", height:"30px", borderRadius:"8px", background:"linear-gradient(135deg,#14b8a6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", animation:"glowPulse 3s ease-in-out infinite" }}>
          <svg width="17" height="17" fill="none" viewBox="0 0 48 48"><path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="white"/></svg>
        </div>
        <span style={{ color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"1.0625rem", letterSpacing:"-0.02em" }}>EduAI</span>
      </div>
    </div>
  );
}

/* ── Root ───────────────────────────────────────────────────── */
export default function Analytics() {
  const { id } = useParams();
  const location = useLocation();
  const raw    = localStorage.getItem("user");
  const user   = raw ? JSON.parse(raw) : {};
  const isAdmin = id === "admin";

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    setLoading(true); setError("");
    const fetch = async () => {
      try {
        const res = isAdmin
          ? await analyticsAPI.getAdminAnalytics()
          : await analyticsAPI.getStudentAnalytics(id);
        setData(res.data.data);
      } catch { setError("Failed to load analytics data."); }
      finally  { setLoading(false); }
    };
    fetch();
  }, [id, location.key]);

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#060d1a", gap:"1rem" }}>
      <style>{STYLES}</style>
      <div style={{ width:"40px", height:"40px", border:"3px solid rgba(94,234,212,0.1)", borderTopColor:"#5eead4", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <span style={{ color:"rgba(148,163,184,0.5)", fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif" }}>Loading analytics…</span>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:"100vh", background:"#060d1a", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{STYLES}</style>
      <div style={{ padding:"1.25rem 2rem", borderRadius:"14px", background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.25)", color:"#f87171", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600 }}>
        ⚠️ {error}
      </div>
    </div>
  );

  if (!data) return null;

  return isAdmin
    ? <><style>{STYLES}</style><Navbar /><AdminAnalytics data={data} /></>
    : <><style>{STYLES}</style><Navbar /><StudentAnalytics data={data} studentName={user?.name} studentId={id} /></>;
}

/* ──────────────────────── STUDENT ANALYTICS ─────────────────── */
function StudentAnalytics({ data, studentName, studentId }) {
  const scoreHistory = (data.scoreHistory || []).map((s, i) => ({
    name: `#${i + 1}`, score: s.score, course: s.course, date: s.date,
  }));

  const perfColor =
    data.predictedPerformance === "High"   ? "#5eead4" :
    data.predictedPerformance === "Medium" ? "#fbbf24" : "#f87171";

  const riskColor = data.dropoutRisk === "Yes" ? "#f87171" : "#5eead4";

  return (
    <div style={{ minHeight:"100vh", background:"#060d1a" }}>
      <div style={{ maxWidth:"1280px", margin:"0 auto", padding:"1.75rem 1.75rem 5rem", animation:"fadeSlideUp 0.45s ease both" }}>

        {/* Page Header */}
        <div style={{ marginBottom:"1.75rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.4rem" }}>
            <div style={{ height:"14px", width:"3px", background:"linear-gradient(180deg,#5eead4,#6366f1)", borderRadius:"999px" }} />
            <p style={{ fontSize:"0.65rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, color:"rgba(94,234,212,0.65)", letterSpacing:"0.12em", textTransform:"uppercase", margin:0 }}>AI-Powered Insights</p>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:"1rem" }}>
            <div>
              <h1 style={{ fontSize:"1.625rem", fontWeight:800, color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.02em", marginBottom:"0.3rem" }}>My Analytics</h1>
              <p style={{ color:"rgba(148,163,184,0.5)", fontSize:"0.875rem" }}>
                {studentName ? `Performance insights for ${studentName}` : "Your learning performance insights"}
              </p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:"10px", padding:"0.4rem 0.875rem" }}>
              <span style={{ fontSize:"0.75rem" }}>🤖</span>
              <span style={{ fontSize:"0.78rem", fontWeight:700, color:"rgba(129,140,248,0.85)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>AI-Powered</span>
            </div>
          </div>
        </div>

        {/* Risk Alert */}
        {data.dropoutRisk === "Yes" && (
          <div style={{ marginBottom:"1.5rem", padding:"1rem 1.25rem", borderRadius:"14px", background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.25)", display:"flex", gap:"0.75rem", alignItems:"flex-start" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" style={{ flexShrink:0, marginTop:"1px" }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <strong style={{ display:"block", marginBottom:"0.2rem", color:"#f87171", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:"0.875rem" }}>Dropout Risk Detected</strong>
              <span style={{ fontSize:"0.8rem", color:"rgba(248,113,113,0.7)" }}>Our AI model flagged a risk based on your recent performance. Consider revisiting course materials or seeking support early.</span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"0.875rem", marginBottom:"2rem" }}>
          <DarkStatCard icon="✅" label="Quizzes Taken"     value={data.totalQuizzesTaken} accent="#5eead4" />
          <DarkStatCard icon="🎯" label="Average Score"     value={`${data.averageScore}%`} accent="#818cf8" />
          <DarkStatCard icon="📈" label="Recommended Level" value={data.recommendedLevel}  accent="#c084fc" />
          <DarkStatCard icon="🤖" label="AI Prediction"     value={data.predictedPerformance} accent={perfColor} />
          <DarkStatCard icon="⚠️" label="Dropout Risk"      value={data.dropoutRisk}       accent={riskColor} />
        </div>

        {/* AI Recommendations */}
        <section style={{ marginBottom:"2rem" }}>
          <SectionHeader label="Personalised">🤖 AI Recommendations</SectionHeader>
          <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(94,234,212,0.1)", borderRadius:"16px", padding:"1.25rem" }}>
            <RecommendationsPanel studentId={studentId} />
          </div>
        </section>

        {scoreHistory.length === 0 ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"5rem 1.5rem", background:"rgba(255,255,255,0.02)", border:"1px dashed rgba(94,234,212,0.12)", borderRadius:"20px", textAlign:"center" }}>
            <div style={{ fontSize:"3.5rem", marginBottom:"1rem" }}>📊</div>
            <h2 style={{ fontSize:"1.1rem", fontWeight:800, color:"rgba(226,232,240,0.7)", fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:"0.5rem" }}>No quiz data yet</h2>
            <p style={{ color:"rgba(148,163,184,0.45)", fontSize:"0.875rem", maxWidth:"300px", lineHeight:1.65 }}>Complete a quiz to see your analytics here.</p>
          </div>
        ) : (
          <>
            {/* Score History */}
            <section style={{ marginBottom:"2rem" }}>
              <SectionHeader>Score History</SectionHeader>
              <ChartCard>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={scoreHistory} margin={{ top:10, right:30, left:0, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fontSize:12, fill:"rgba(148,163,184,0.5)", fontFamily:"'Nunito',sans-serif" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0,100]} tick={{ fontSize:12, fill:"rgba(148,163,184,0.5)", fontFamily:"'Nunito',sans-serif" }} unit="%" axisLine={false} tickLine={false} />
                    <Tooltip {...CHART_TOOLTIP} formatter={(v) => [`${v}%`, "Score"]} labelFormatter={(label, payload) => payload?.[0]?.payload?.course || label} />
                    <Legend wrapperStyle={{ fontSize:"0.82rem", paddingTop:"0.5rem", color:"rgba(148,163,184,0.6)" }} />
                    <ReferenceLine y={PASS_SCORE} stroke="rgba(251,191,36,0.4)" strokeDasharray="5 4"
                      label={{ value:"Pass (60%)", fontSize:10, fill:"rgba(251,191,36,0.6)", position:"insideTopRight", fontFamily:"'Plus Jakarta Sans',sans-serif" }} />
                    <Line type="monotone" dataKey="score" name="Quiz Score" stroke="#6366f1" strokeWidth={2.5}
                      dot={{ r:5, fill:"#6366f1", stroke:"rgba(6,13,26,0.8)", strokeWidth:2 }}
                      activeDot={{ r:8, fill:"#5eead4", stroke:"rgba(6,13,26,0.8)", strokeWidth:2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </section>

            {/* Course Breakdown */}
            {data.courseBreakdown?.length > 0 && (
              <section style={{ marginBottom:"2rem" }}>
                <SectionHeader>Performance by Course</SectionHeader>
                <ChartCard>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.courseBreakdown} margin={{ top:10, right:20, left:0, bottom:50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="courseTitle" tick={{ fontSize:11, fill:"rgba(148,163,184,0.5)" }} angle={-25} textAnchor="end" interval={0} axisLine={false} tickLine={false} />
                      <YAxis domain={[0,100]} tick={{ fontSize:12, fill:"rgba(148,163,184,0.5)" }} unit="%" axisLine={false} tickLine={false} />
                      <Tooltip {...CHART_TOOLTIP} formatter={(v, n) => n === "averageScore" ? [`${v}%`, "Avg Score"] : [v, "Attempts"]} />
                      <Legend wrapperStyle={{ fontSize:"0.82rem", paddingTop:"0.5rem" }} />
                      <Bar dataKey="averageScore" name="Avg Score" fill="#6366f1" radius={[6,6,0,0]}>
                        <LabelList dataKey="averageScore" position="top" formatter={(v) => `${v}%`} style={{ fontSize:10, fill:"rgba(148,163,184,0.5)" }} />
                      </Bar>
                      <Bar dataKey="attempts" name="Attempts" fill="rgba(99,102,241,0.2)" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </section>
            )}

            {/* Attempt History */}
            <section>
              <SectionHeader>Attempt History</SectionHeader>
              <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", overflow:"hidden" }}>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.85rem" }}>
                    <thead>
                      <tr style={{ background:"rgba(255,255,255,0.03)" }}>
                        {["#","Course","Score","Result","Date"].map(h => (
                          <th key={h} style={{ padding:"0.85rem 1.1rem", textAlign:"left", fontWeight:700, color:"rgba(94,234,212,0.5)", fontSize:"0.72rem", textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:"1px solid rgba(255,255,255,0.06)", fontFamily:"'Plus Jakarta Sans',sans-serif", whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...scoreHistory].reverse().map((item, idx) => (
                        <tr key={idx} className="table-row-dark" style={{ borderBottom: idx < scoreHistory.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition:"background 0.15s" }}>
                          <td style={{ padding:"0.8rem 1.1rem", color:"rgba(148,163,184,0.4)", fontWeight:700, fontSize:"0.8rem", width:48 }}>{scoreHistory.length - idx}</td>
                          <td style={{ padding:"0.8rem 1.1rem", fontWeight:600, color:"rgba(226,232,240,0.8)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{item.course || "—"}</td>
                          <td style={{ padding:"0.8rem 1.1rem" }}>
                            <span style={{ fontWeight:800, fontSize:"0.9rem", fontFamily:"'Plus Jakarta Sans',sans-serif", color: item.score >= PASS_SCORE ? "#5eead4" : "#f87171" }}>{item.score}%</span>
                          </td>
                          <td style={{ padding:"0.8rem 1.1rem" }}>
                            <span style={{ padding:"2px 10px", borderRadius:999, fontSize:"0.68rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif",
                              background: item.score >= PASS_SCORE ? "rgba(94,234,212,0.1)" : "rgba(248,113,113,0.1)",
                              color:      item.score >= PASS_SCORE ? "#5eead4" : "#f87171",
                              border:     `1px solid ${item.score >= PASS_SCORE ? "rgba(94,234,212,0.25)" : "rgba(248,113,113,0.25)"}`,
                            }}>
                              {item.score >= PASS_SCORE ? "✓ Passed" : "✗ Failed"}
                            </span>
                          </td>
                          <td style={{ padding:"0.8rem 1.1rem", color:"rgba(148,163,184,0.4)", fontSize:"0.8rem" }}>
                            {item.date ? new Date(item.date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────── ADMIN ANALYTICS ───────────────────── */
function AdminAnalytics({ data }) {
  const pieData = Object.entries(data.performanceDist || {}).map(([k, v]) => ({ name: k, value: v }));
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    enrollmentAPI.getAllEnrollments()
      .then((r) => setEnrollments(r.data.data))
      .catch(() => {});
  }, []);

  return (
    <div style={{ minHeight:"100vh", background:"#060d1a" }}>
      <div style={{ maxWidth:"1280px", margin:"0 auto", padding:"1.75rem 1.75rem 5rem", animation:"fadeSlideUp 0.45s ease both" }}>

        {/* Header */}
        <div style={{ marginBottom:"1.75rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.4rem" }}>
            <div style={{ height:"14px", width:"3px", background:"linear-gradient(180deg,#5eead4,#6366f1)", borderRadius:"999px" }} />
            <p style={{ fontSize:"0.65rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, color:"rgba(94,234,212,0.65)", letterSpacing:"0.12em", textTransform:"uppercase", margin:0 }}>Platform Overview</p>
          </div>
          <h1 style={{ fontSize:"1.625rem", fontWeight:800, color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.02em", marginBottom:"0.3rem" }}>Admin Analytics</h1>
          <p style={{ color:"rgba(148,163,184,0.5)", fontSize:"0.875rem" }}>Platform-wide performance metrics and insights.</p>
        </div>

        {/* Stats */}
        <div style={{width:"100%", display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"0.875rem", marginBottom:"2rem" }}>
          <DarkStatCard icon="👥" label="Total Students"     value={data.totalStudents}    accent="#818cf8" />
          <DarkStatCard icon="📚" label="Total Courses"      value={data.totalCourses}     accent="#c084fc" />
          <DarkStatCard icon="📝" label="Total Submissions"  value={data.totalSubmissions} accent="#38bdf8" />
          <DarkStatCard icon="🎯" label="Avg Platform Score" value={`${data.avgPlatformScore}%`} accent="#5eead4" />
          <DarkStatCard icon="⚠️" label="At-Risk Students"   value={data.atRiskStudents}  accent="#f87171" />
        </div>

        {/* Course Performance */}
        {data.coursePerformance?.length > 0 && (
          <section style={{ marginBottom:"2rem" }}>
            <SectionHeader>Course-wise Performance</SectionHeader>
            <ChartCard>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.coursePerformance} margin={{ top:10, right:20, left:0, bottom:56 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="courseTitle" tick={{ fontSize:11, fill:"rgba(148,163,184,0.5)" }} angle={-25} textAnchor="end" interval={0} axisLine={false} tickLine={false} />
                  <YAxis domain={[0,100]} unit="%" tick={{ fontSize:12, fill:"rgba(148,163,184,0.5)" }} axisLine={false} tickLine={false} />
                  <Tooltip {...CHART_TOOLTIP} formatter={(v, n) => n === "averageScore" ? [`${v}%`, "Avg Score"] : [v, n]} />
                  <Legend wrapperStyle={{ fontSize:"0.82rem", paddingTop:"0.5rem" }} />
                  <Bar dataKey="averageScore" name="Avg Score" fill="#6366f1" radius={[6,6,0,0]}>
                    <LabelList dataKey="averageScore" position="top" formatter={(v) => `${v}%`} style={{ fontSize:10, fill:"rgba(148,163,184,0.5)" }} />
                  </Bar>
                  <Bar dataKey="totalAttempts" name="Attempts" fill="rgba(99,102,241,0.2)" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>
        )}

        {/* Performance Distribution */}
        {pieData.length > 0 && (
          <section style={{ marginBottom:"2rem" }}>
            <SectionHeader>Performance Distribution</SectionHeader>
            <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", padding:"1.5rem", display:"flex", alignItems:"center", justifyContent:"center", flexWrap:"wrap", gap:"2.5rem" }}>
              <PieChart width={260} height={220}>
                <Pie data={pieData} cx={125} cy={105} outerRadius={88} innerRadius={44} dataKey="value" paddingAngle={4}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name] || "#818cf8"} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip {...CHART_TOOLTIP} />
              </PieChart>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem", minWidth:160 }}>
                {pieData.map((entry) => (
                  <div key={entry.name} style={{ display:"flex", alignItems:"center", gap:"0.625rem", fontSize:"0.875rem" }}>
                    <div style={{ width:10, height:10, borderRadius:"50%", background: PIE_COLORS[entry.name] || "#818cf8", flexShrink:0, boxShadow:`0 0 8px ${PIE_COLORS[entry.name] || "#818cf8"}60` }} />
                    <span style={{ color:"rgba(148,163,184,0.55)", flex:1, fontFamily:"'Nunito',sans-serif" }}>{entry.name}</span>
                    <strong style={{ color:"rgba(226,232,240,0.85)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{entry.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Enrollments Table */}
        {enrollments.length > 0 && (
          <section>
            <SectionHeader>Recent Enrollments</SectionHeader>
            <div style={{ background:"rgba(18, 17, 17, 0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", overflow:"hidden" }}>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.85rem" }}>
                  <thead>
                    <tr style={{ background:"rgba(71, 71, 71, 0.03)" }}>
                      {["Student","Email","Course","Difficulty","Enrolled","Levels Done"].map(h => (
                        <th key={h} style={{ padding:"0.85rem 1.1rem", textAlign:"left", fontWeight:700, color:"rgba(94,234,212,0.5)", fontSize:"0.72rem", textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:"1px solid rgba(255,255,255,0.06)", fontFamily:"'Plus Jakarta Sans',sans-serif", whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((e, idx) => (
                      <tr key={e._id} className="table-row-dark" style={{ borderBottom: idx < enrollments.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition:"background 0.15s" }}>
                        <td style={{ padding:"0.8rem 1.1rem", fontWeight:700, color:"rgba(226,232,240,0.85)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{e.studentId?.name || "—"}</td>
                        <td style={{ padding:"0.8rem 1.1rem", color:"rgba(148,163,184,0.45)", fontSize:"0.8rem" }}>{e.studentId?.email || "—"}</td>
                        <td style={{ padding:"0.8rem 1.1rem", fontWeight:600, color:"rgba(226,232,240,0.75)" }}>{e.courseId?.title || "—"}</td>
                        <td style={{ padding:"0.8rem 1.1rem" }}>
                          {e.courseId?.difficulty && (
                            <span style={{ padding:"2px 9px", borderRadius:999, fontSize:"0.68rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", ...diffStyleDark(e.courseId.difficulty) }}>
                              {e.courseId.difficulty}
                            </span>
                          )}
                        </td>
                        <td style={{ padding:"0.8rem 1.1rem", color:"rgba(148,163,184,0.45)", fontSize:"0.8rem" }}>
                          {new Date(e.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                        </td>
                        <td style={{ padding:"0.8rem 1.1rem" }}>
                          <span style={{ fontWeight:800, color:"#818cf8", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{e.completedLevels?.length ?? 0}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ── Shared Helpers ─────────────────────────────────────────── */
function SectionHeader({ children, label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.875rem" }}>
      <h2 style={{ fontSize:"0.9375rem", fontWeight:800, color:"rgba(226,232,240,0.88)", fontFamily:"'Plus Jakarta Sans',sans-serif", margin:0 }}>{children}</h2>
      {label && (
        <span style={{ padding:"2px 8px", borderRadius:999, fontSize:"0.62rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", background:"rgba(94,234,212,0.08)", color:"rgba(94,234,212,0.65)", border:"1px solid rgba(94,234,212,0.18)" }}>{label}</span>
      )}
    </div>
  );
}

function ChartCard({ children }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", padding:"1.5rem" }}>
      {children}
    </div>
  );
}

function DarkStatCard({ icon, label, value, accent }) {
  return (
    <div className="stat-card-dark" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", padding:"1.1rem 1.2rem", display:"flex", flexDirection:"column", gap:"0.5rem" }}>
      <span style={{ fontSize:"1.25rem" }}>{icon}</span>
      <span style={{ fontSize:"1.3rem", fontWeight:800, color: accent, fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1 }}>{value}</span>
      <span style={{ fontSize:"0.72rem", fontWeight:600, color:"rgba(148,163,184,0.45)", fontFamily:"'Plus Jakarta Sans',sans-serif", textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</span>
    </div>
  );
}

function diffStyleDark(d) {
  if (d === "Beginner")     return { background:"rgba(94,234,212,0.1)",  color:"#5eead4", border:"1px solid rgba(94,234,212,0.2)" };
  if (d === "Intermediate") return { background:"rgba(251,191,36,0.1)",  color:"#fbbf24", border:"1px solid rgba(251,191,36,0.2)" };
  if (d === "Advanced")     return { background:"rgba(248,113,113,0.1)", color:"#f87171", border:"1px solid rgba(248,113,113,0.2)" };
  return {};
}