import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { recommendationAPI } from "../services/api.js";

/* ── Icon helpers ─────────────────────────────────────────────────────────── */
const TYPE_META = {
  next_level:    { emoji: "🚀", label: "Next Level",       color: "#10b981", bg: "#dcfce7", border: "#a7f3d0" },
  revise_topic:  { emoji: "📖", label: "Revise Topic",     color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
  rewatch_video: { emoji: "🎬", label: "Rewatch Video",    color: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd" },
  practice_quiz: { emoji: "✏️", label: "Practice Quiz",   color: "#d97706", bg: "#fef3c7", border: "#fcd34d" },
  revisit_level: { emoji: "⚠️", label: "Revisit Level",   color: "#b91c1c", bg: "#fee2e2", border: "#fca5a5" },
};

const STATUS_META = {
  on_track:         { label: "On Track",           color: "#15803d", bg: "#dcfce7", icon: "✅" },
  needs_improvement:{ label: "Needs Improvement",  color: "#a16207", bg: "#fef9c3", icon: "📈" },
  at_risk:          { label: "At Risk",            color: "#b91c1c", bg: "#fee2e2", icon: "⚠️" },
};

const GROUP_ORDER   = ["revisit_level", "revise_topic", "rewatch_video", "practice_quiz", "next_level"];
const GROUP_LABELS  = {
  revisit_level: "Levels to Revisit",
  revise_topic:  "Topics to Revise",
  rewatch_video: "Videos to Rewatch",
  practice_quiz: "Practice Quizzes",
  next_level:    "Next Steps",
};

/**
 * RecommendationsPanel
 *
 * Props:
 *  - studentId {string}  required
 *  - compact   {boolean} renders a condensed version (default: false)
 */
export default function RecommendationsPanel({ studentId, compact = false }) {
  const navigate = useNavigate();
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState("");

  const load = useCallback(async () => {
    if (!studentId) return;
    try {
      const res = await recommendationAPI.getForStudent(studentId);
      setData(res.data.data);
      setError("");
    } catch {
      setError("Could not load recommendations.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await recommendationAPI.refresh(studentId);
      setData(res.data.data);
      setError("");
    } catch {
      setError("Failed to refresh recommendations.");
    } finally {
      setRefreshing(false);
    }
  };

  /* ── Render states ──────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--text-muted)", fontSize: "0.82rem", padding: "1rem 0" }}>
        <div className="spinner" style={{ width: 18, height: 18 }} />
        <span>Generating AI recommendations…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error" style={{ fontSize: "0.82rem" }}>{error}</div>
    );
  }

  const recs = data?.recommendations || [];
  const status = data?.overallStatus || "on_track";
  const sm = STATUS_META[status] || STATUS_META.on_track;

  if (recs.length === 0) {
    return (
      <div style={{ backgroundColor:"#0f172a", border: "1.5px solid var(--border)", borderRadius: 14,
        padding: compact ? "1rem" : "1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎓</div>
        <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: "0 0 0.3rem" }}>No recommendations yet</p>
        <p style={{ fontSize: "0.78rem", margin: 0 }}>Complete a quiz to unlock personalised AI recommendations.</p>
      </div>
    );
  }

  // Group items by type
  const grouped = {};
  GROUP_ORDER.forEach((t) => { grouped[t] = []; });
  recs.forEach((r) => {
    if (grouped[r.type]) grouped[r.type].push(r);
  });

  const visibleGroups = GROUP_ORDER.filter((t) => grouped[t].length > 0);

  return (
    <div>
      {/* ── Status banner ─────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        border: `1.5px solid #0f172a`,backgroundColor:"#0f172a",
        borderRadius: 12, padding: "0.7rem 1rem", marginBottom: "1rem",
        flexWrap: "wrap", gap: "0.5rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.1rem" }}>{sm.icon}</span>
          <div>
            <span style={{ fontWeight: 700, fontSize: "0.82rem", color: sm.color }}>{sm.label}</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
              {recs.length} recommendation{recs.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {data?.generatedAt && (
            <span style={{ fontSize: "0.7rem", color: "var(--text-light)" }}>
              Updated {new Date(data.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              background: "none", border: "1.5px solid var(--border)", borderRadius: 8,
              padding: "0.25rem 0.6rem", fontSize: "0.72rem", fontWeight: 600,
              color: "var(--primary)", cursor: refreshing ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "0.3rem",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ transform: refreshing ? "rotate(180deg)" : "none", transition: "transform 0.4s" }}>
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ── Recommendation groups ──────────────────────────────────────── */}
      {visibleGroups.map((type) => {
        const items = compact ? grouped[type].slice(0, 2) : grouped[type];
        if (items.length === 0) return null;
        const meta = TYPE_META[type];
        return (
          <div key={type} style={{ marginBottom: "0.85rem" }}>
            <div style={{
              fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: "0.4rem",
              display: "flex", alignItems: "center", gap: "0.35rem",
            }}>
              <span>{meta.emoji}</span>
              {GROUP_LABELS[type]}
              <span style={{ background: "var(--border)", borderRadius: 999, padding: "1px 7px", fontSize: "0.65rem", color: "var(--text-light)", fontWeight: 600 }}>
                {grouped[type].length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {items.map((rec, idx) => (
                <RecommendationCard
                  key={idx}
                  rec={rec}
                  meta={meta}
                  onNavigate={() => navigate(`/courses/${rec.courseId}`)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {compact && recs.length > 4 && (
        <button
          onClick={() => navigate(`/analytics/${studentId}`)}
          style={{
            background: "none", border: "none", color: "var(--primary)",
            fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", padding: "0.3rem 0",
          }}
        >
          View all {recs.length} recommendations →
        </button>
      )}
    </div>
  );
}

/* ── Individual recommendation card ──────────────────────────────────────── */
function RecommendationCard({ rec, meta, onNavigate }) {
  return (
    <div
      style={{
        border: `1.5px solid #0f172a`,backgroundColor:"#0f172a",
        borderRadius: 10,
        padding: "0.65rem 0.9rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.65rem",
        cursor: rec.courseId ? "pointer" : "default",
        transition: "box-shadow 0.15s",
      }}
      onClick={rec.courseId ? onNavigate : undefined}
      onMouseEnter={(e) => { if (rec.courseId) e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.09)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
      title={rec.courseId ? `Go to ${rec.courseTitle}` : undefined}
    >
      <span style={{ fontSize: "1.05rem", flexShrink: 0, marginTop: "0.05rem" }}>{meta.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: meta.color }}>{meta.label}</span>
          {rec.courseTitle && (
            <span style={{
              fontSize: "0.68rem", fontWeight: 600, background: "rgba(0,0,0,0.06)",
              borderRadius: 999, padding: "1px 8px", color: "var(--text-muted)", whiteSpace: "nowrap",
            }}>
              {rec.courseTitle}
              {rec.levelNumber != null ? ` · L${rec.levelNumber}` : ""}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text)", lineHeight: 1.5 }}>
          {rec.message}
        </p>
        {rec.videoUrl && (
          <a
            href={rec.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.3rem",
              marginTop: "0.35rem", fontSize: "0.72rem", fontWeight: 600,
              color: meta.color, textDecoration: "none",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Watch Video
          </a>
        )}
      </div>
      {rec.courseId && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2.5" style={{ flexShrink: 0, marginTop: "0.25rem", opacity: 0.7 }}>
          <path d="M9 18l6-6-6-6"/>
        </svg>
      )}
    </div>
  );
}
