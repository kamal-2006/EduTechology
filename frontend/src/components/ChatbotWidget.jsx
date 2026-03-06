import { useState, useRef, useEffect, useContext, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../App.jsx";
import { aiAPI } from "../services/api.js";

const PUBLIC_PATHS = ["/login", "/register"];

/* ── Simple markdown → safe HTML renderer ────────────────────────────────────
   Only AI responses are rendered with this — user messages are plain text.
   HTML is escaped before transforms so XSS is prevented.
──────────────────────────────────────────────────────────────────────────── */
function mdToHtml(raw) {
  // 1. Escape HTML special chars
  let html = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Fenced code blocks  (must run before inline code)
  html = html.replace(
    /```[\w]*\n?([\s\S]*?)```/g,
    (_, code) =>
      `<pre style="background:#1a1a2e;color:#e0e0ff;padding:10px 12px;border-radius:8px;overflow-x:auto;font-size:0.74rem;margin:6px 0;font-family:ui-monospace,monospace;line-height:1.55;white-space:pre">${code.trim()}</pre>`
  );

  // 3. Inline code
  html = html.replace(
    /`([^`\n]+)`/g,
    `<code style="background:rgba(99,102,241,0.12);color:#4338ca;padding:1px 5px;border-radius:4px;font-family:ui-monospace,monospace;font-size:0.83em">$1</code>`
  );

  // 4. Bold
  html = html.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");

  // 5. Italic
  html = html.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  // 6. Bullet list items  →  inline flex rows
  html = html.replace(
    /^[-•*]\s+(.+)$/gm,
    `<div style="display:flex;gap:6px;margin:2px 0"><span style="color:#6366f1;flex-shrink:0;line-height:1.6">•</span><span>$1</span></div>`
  );

  // 7. Numbered list items
  html = html.replace(
    /^(\d+)\.\s+(.+)$/gm,
    `<div style="display:flex;gap:6px;margin:2px 0"><span style="color:#6366f1;flex-shrink:0;min-width:1.4em;line-height:1.6">$1.</span><span>$2</span></div>`
  );

  // 8. Headings (### ## #)
  html = html.replace(/^### (.+)$/gm, `<strong style="display:block;margin:6px 0 2px;font-size:0.88em">$1</strong>`);
  html = html.replace(/^## (.+)$/gm,  `<strong style="display:block;margin:8px 0 3px;font-size:0.92em">$1</strong>`);
  html = html.replace(/^# (.+)$/gm,   `<strong style="display:block;margin:8px 0 3px;font-size:0.96em">$1</strong>`);

  // 9. Paragraph breaks
  html = html.replace(/\n\n+/g, "<br/><br/>");

  // 10. Single line breaks
  html = html.replace(/\n/g, "<br/>");

  return html;
}

/* ── Typing indicator ────────────────────────────────────────────────────────*/
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 2px" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#0d9488",
            animation: "chatBounce 0.9s ease infinite",
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Quick-start prompt chips ───────────────────────────────────────────────*/
const QUICK_PROMPTS = [
  "Explain polymorphism in OOP",
  "What is the TCP/IP model?",
  "Explain recursion with an example",
  "Difference between SQL and NoSQL",
];

/* ── Main ChatbotWidget ──────────────────────────────────────────────────────*/
export default function ChatbotWidget() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const [isOpen,     setIsOpen]     = useState(false);
  const [isClosing,  setIsClosing]  = useState(false);
  const [messages,   setMessages]   = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your **AI Learning Assistant** 🤖\n\nAsk me anything about your courses, programming concepts, or learning topics. I can use your course materials to give you more relevant answers!",
    },
  ]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [showChips, setShowChips] = useState(true);

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) setTimeout(() => textareaRef.current?.focus(), 120);
  }, [isOpen]);

  // Don't render on public pages or when not logged in
  if (!user || PUBLIC_PATHS.includes(location.pathname)) return null;

  const closeChat = () => {
    setIsClosing(true);
    setTimeout(() => { setIsOpen(false); setIsClosing(false); }, 200);
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setShowChips(false);
    const userMsg = { id: Date.now(), role: "user", content: trimmed };

    // Build history from current messages (exclude the static welcome)
    const history = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setLoading(true);

    try {
      const res = await aiAPI.chat(trimmed, history);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: res.data.data.reply },
      ]);
    } catch (err) {
      const errText = err.response?.data?.message || "Sorry, I ran into an error. Please try again.";
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: errText, isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 110) + "px";
  };

  const clearChat = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your **AI Learning Assistant** 🤖\n\nAsk me anything about your courses, programming concepts, or learning topics. I can use your course materials to give you more relevant answers!",
    }]);
    setShowChips(true);
  };

  const handleClose = () => closeChat();

  return (
    <>
      {/* ── Injected animation keyframes ──────────────────────────────────── */}
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatSlideDown {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(20px) scale(0.96); }
        }
        @keyframes chatBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
          40%           { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes chatPulse {
          0%   { box-shadow: 0 0 0 0 rgba(13,148,136,0.55); }
          70%  { box-shadow: 0 0 0 14px rgba(13,148,136,0); }
          100% { box-shadow: 0 0 0 0 rgba(13,148,136,0); }
        }
        @keyframes chatFabIn {
          from { opacity: 0; transform: scale(0.6) rotate(-20deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .chat-msg-scroll::-webkit-scrollbar { width: 4px; }
        .chat-msg-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-msg-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
        .chat-msg-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>

      {/* ── Chat window ─────────────────────────────────────────────────────── */}
      {isOpen && (
        <div style={{
          position:      "fixed",
          bottom:        92,
          right:         24,
          width:         "min(390px, calc(100vw - 48px))",
          height:        "min(560px, calc(100vh - 120px))",
          background:    "var(--surface, #fff)",
          border:        "1.5px solid var(--border, #e2e8f0)",
          borderRadius:  20,
          boxShadow:     "0 24px 64px rgba(0,0,0,0.16), 0 6px 24px rgba(13,148,136,0.18)",
          display:       "flex",
          flexDirection: "column",
          zIndex:        9998,
          overflow:      "hidden",
          animation:     isClosing ? "chatSlideDown 0.2s ease forwards" : "chatSlideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)",
        }}>

          {/* Header */}
          <div style={{
            background:  "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)",
            padding:     "0.85rem 1rem",
            display:     "flex",
            alignItems:  "center",
            gap:         "0.65rem",
            flexShrink:  0,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              border: "2px solid rgba(255,255,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.25rem", flexShrink: 0,
            }}>
              🤖
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#fff", lineHeight: 1.2 }}>
                AI Learning Assistant
              </div>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#86efac", display: "inline-block", flexShrink: 0, boxShadow: "0 0 6px #86efac" }} />
                Online · RAG-powered · GPT-4o mini
              </div>
            </div>
            <button
              onClick={clearChat}
              title="Clear chat"
              style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "4px 8px", color: "rgba(255,255,255,0.85)", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, marginRight: 2, transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.target.style.background = "rgba(255,255,255,0.25)")}
              onMouseLeave={(e) => (e.target.style.background = "rgba(255,255,255,0.15)")}
            >
              Clear
            </button>
            <button
              onClick={handleClose}
              title="Close"
              style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "4px 9px", color: "#fff", cursor: "pointer", fontSize: "1rem", fontWeight: 700, lineHeight: 1, transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.target.style.background = "rgba(255,255,255,0.25)")}
              onMouseLeave={(e) => (e.target.style.background = "rgba(255,255,255,0.15)")}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            className="chat-msg-scroll"
            style={{
              flex: 1, overflowY: "auto",
              padding: "1rem 0.9rem",
              display: "flex", flexDirection: "column", gap: "0.8rem",
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: "0.45rem" }}
              >
                {/* Bot avatar */}
                {msg.role === "assistant" && (
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "linear-gradient(135deg,#0d9488,#0891b2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.8rem", flexShrink: 0,
                  }}>
                    🤖
                  </div>
                )}

                {/* Bubble */}
                <div style={{
                  maxWidth:     "78%",
                  padding:      "0.55rem 0.85rem",
                  borderRadius: msg.role === "user"
                    ? "16px 16px 3px 16px"
                    : "16px 16px 16px 3px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #0d9488, #0891b2)"
                    : msg.isError
                      ? "#fef2f2"
                      : "var(--bg-secondary, #f8fafc)",
                  color: msg.role === "user"
                    ? "#fff"
                    : msg.isError ? "#b91c1c" : "var(--text, #1e293b)",
                  fontSize:   "0.81rem",
                  lineHeight: 1.65,
                  border: msg.role === "user"
                    ? "none"
                    : `1.5px solid ${msg.isError ? "#fecaca" : "var(--border, #e2e8f0)"}`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  wordBreak: "break-word",
                }}>
                  {msg.role === "user" ? (
                    <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: mdToHtml(msg.content) }} />
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "0.45rem" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#0d9488,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>
                  🤖
                </div>
                <div style={{ background: "var(--bg-secondary,#f8fafc)", border: "1.5px solid var(--border,#e2e8f0)", borderRadius: "16px 16px 16px 3px", padding: "0.5rem 0.9rem" }}>
                  <TypingDots />
                </div>
              </div>
            )}

            {/* Quick-start chips */}
            {showChips && messages.length === 1 && !loading && (
              <div style={{ marginTop: "0.25rem" }}>
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted, #94a3b8)", marginBottom: "0.5rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Try asking:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      style={{
                        textAlign: "left", background: "transparent",
                        border: "1.5px solid var(--border, #e2e8f0)",
                        borderRadius: 10, padding: "0.45rem 0.75rem",
                        fontSize: "0.78rem", color: "var(--text, #1e293b)",
                        cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#0d9488"; e.currentTarget.style.background = "rgba(13,148,136,0.05)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border, #e2e8f0)"; e.currentTarget.style.background = "transparent"; }}
                    >
                      💬 {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={{
            borderTop:  "1.5px solid var(--border, #e2e8f0)",
            padding:    "0.65rem 0.75rem",
            display:    "flex",
            gap:        "0.5rem",
            alignItems: "flex-end",
            background: "var(--surface, #fff)",
            flexShrink: 0,
          }}>
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Ask about your courses or any topic…"
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              disabled={loading}
              onFocus={(e)  => (e.target.style.borderColor = "#0d9488")}
              onBlur={(e)   => (e.target.style.borderColor = "var(--border, #e2e8f0)")}
              style={{
                flex:        1,
                border:      "1.5px solid var(--border, #e2e8f0)",
                borderRadius: 12,
                padding:     "0.55rem 0.75rem",
                fontSize:    "0.82rem",
                resize:      "none",
                outline:     "none",
                maxHeight:   110,
                fontFamily:  "inherit",
                lineHeight:  1.55,
                background:  loading ? "var(--bg-secondary, #f8fafc)" : "var(--surface, #fff)",
                color:       "var(--text, #1e293b)",
                transition:  "border-color 0.15s",
                overflowY:   "auto",
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              title="Send (Enter)"
              style={{
                width:          40,
                height:         40,
                borderRadius:   "50%",
                border:         "none",
                background:     input.trim() && !loading
                  ? "linear-gradient(135deg, #0d9488, #0891b2)"
                  : "var(--border, #e2e8f0)",
                color:          input.trim() && !loading ? "#fff" : "var(--text-muted, #94a3b8)",
                cursor:         input.trim() && !loading ? "pointer" : "not-allowed",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                flexShrink:     0,
                transition:     "all 0.2s",
                boxShadow:      input.trim() && !loading ? "0 2px 8px rgba(13,148,136,0.4)" : "none",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Floating toggle button ───────────────────────────────────────────── */}
      <button
        onClick={() => isOpen ? handleClose() : setIsOpen(true)}
        title={isOpen ? "Close AI Assistant" : "Open AI Assistant (AI Doubt Solver)"}
        style={{
          position:       "fixed",
          bottom:         24,
          right:          24,
          width:          60,
          height:         60,
          borderRadius:   "50%",
          border:         "none",
          background:     isOpen
            ? "linear-gradient(135deg, #ef4444, #f97316)"
            : "linear-gradient(135deg, #0d9488, #0891b2)",
          color:          "#fff",
          cursor:         "pointer",
          zIndex:         9999,
          boxShadow:      isOpen
            ? "0 4px 20px rgba(239,68,68,0.4)"
            : "0 4px 24px rgba(13,148,136,0.5)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          transition:     "background 0.25s, box-shadow 0.25s, transform 0.18s",
          animation:      !isOpen ? "chatPulse 2.5s infinite" : "none",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6"  y2="18"/>
            <line x1="6"  y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        )}
      </button>
    </>
  );
}
