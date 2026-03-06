const { GoogleGenerativeAI } = require("@google/generative-ai");

const CHAT_MODEL = "gemini-1.5-flash-latest";

/* ── Lazy Gemini client ─────────────────────────────────────────────────── */
let _genAI = null;
function getClient() {
  if (!_genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return _genAI;
}

/* ── Cosine similarity ──────────────────────────────────────────────────────── */
function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na  += a[i] * a[i];
    nb  += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}

/* ── Get single embedding ───────────────────────────────────────────────────── */
async function getEmbedding(text) {
  const model = getClient().getGenerativeModel({ model: EMBED_MODEL });
  const result = await model.embedContent(text.slice(0, 8000));
  return result.embedding.values;
}

/* ── Build text chunks from one course document ─────────────────────────────── */
function buildChunks(course) {
  const chunks = [];

  // Course overview chunk
  const overviewParts = [
    `Course: ${course.title}`,
    course.description ? `Description: ${course.description}` : null,
    course.topics?.length ? `Topics: ${course.topics.join(", ")}` : null,
    course.difficulty   ? `Difficulty: ${course.difficulty}` : null,
  ].filter(Boolean);
  if (overviewParts.length > 1) {
    chunks.push({
      type: "course", courseId: course._id, courseTitle: course.title,
      content: overviewParts.join("\n"),
      metadata: { difficulty: course.difficulty },
    });
  }

  // Level chunks (study notes = main learning material)
  (course.levels || []).forEach((lv) => {
    if (!lv.title && !lv.studyNotes) return;
    chunks.push({
      type: "level", courseId: course._id, courseTitle: course.title,
      content: [
        `Course: ${course.title} | Level ${lv.levelNumber}: ${lv.title || ""}`,
        lv.studyNotes || "",
      ].join("\n").trim(),
      metadata: { levelNumber: lv.levelNumber, levelTitle: lv.title },
    });
  });

  // Lesson chunks
  (course.lessons || []).forEach((ls) => {
    if (!ls.title && !ls.content) return;
    chunks.push({
      type: "lesson", courseId: course._id, courseTitle: course.title,
      content: [
        `Course: ${course.title} | Lesson: ${ls.title || ""}`,
        ls.content || "",
      ].join("\n").trim(),
      metadata: { order: ls.order, lessonTitle: ls.title },
    });
  });

  return chunks.filter((c) => c.content.trim().length >= 20);
}

/* ── Index all courses (full rebuild) ─────────────────────────────────────────*/
async function indexAllCourses() {
  const courses = await Course.find();
  await CourseEmbedding.deleteMany({});

  const docs = [];
  for (const course of courses) {
    const chunks = buildChunks(course);
    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk.content);
      docs.push({ ...chunk, embedding });
    }
  }
  if (docs.length > 0) await CourseEmbedding.insertMany(docs);
  return docs.length;
}

/* ── Index or update a single course (called on course save) ─────────────────*/
async function indexCourse(courseId) {
  const course = await Course.findById(courseId);
  if (!course) return;
  // Remove old chunks for this course and reinsert
  await CourseEmbedding.deleteMany({ courseId });
  const chunks = buildChunks(course);
  const docs = [];
  for (const chunk of chunks) {
    const embedding = await getEmbedding(chunk.content);
    docs.push({ ...chunk, embedding });
  }
  if (docs.length > 0) await CourseEmbedding.insertMany(docs);
}

/* ── Check if index exists; build if empty ──────────────────────────────────── */
async function indexCoursesIfNeeded() {
  if (!process.env.GOOGLE_API_KEY) return;
  const count = await CourseEmbedding.countDocuments();
  if (count === 0) {
    console.log("[AI] No embeddings found — building RAG index...");
    const n = await indexAllCourses();
    console.log(`[AI] Index built: ${n} chunks indexed.`);
  }
}

/* ── POST /api/ai/chat ───────────────────────────────────────────────────────── */
const chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    // ── RAG: find relevant course content ─────────────────────────────────────
    let context = "";
    try {
      const queryEmbedding = await getEmbedding(message);
      const allDocs = await CourseEmbedding.find(
        {},
        { content: 1, embedding: 1, courseTitle: 1, type: 1 }
      ).lean();

      if (allDocs.length > 0) {
        const scored = allDocs
          .map((doc) => ({
            content:    doc.content,
            similarity: cosineSimilarity(queryEmbedding, doc.embedding),
          }))
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 4)
          .filter((s) => s.similarity > 0.3);

        if (scored.length > 0) {
          context = scored.map((s) => s.content).join("\n\n---\n\n");
        }
      }
    } catch (ragErr) {
      // RAG failure is non-fatal: fall back to general knowledge
      console.warn("[AI] RAG step failed:", ragErr.message);
    }

    // ── Build prompt for Gemini ───────────────────────────────────────────────
    const systemInstruction = [
      "You are an AI learning assistant for Edu Learn AI, an educational technology platform.",
      "Help students understand course materials, programming concepts, and learning topics.",
      "Be concise, clear, and educational.",
      "Use markdown formatting: ``` for code blocks, `backticks` for inline code, **bold** for key terms, - for bullet lists.",
    ].join("\n");

    // Convert history to Gemini format (role: "user" | "model")
    const geminiHistory = history.slice(-8).map((m) => ({
      role:  m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const model = getClient().getGenerativeModel({
      model: CHAT_MODEL,
      systemInstruction,
    });

    const chatSession = model.startChat({
      history: geminiHistory,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.4 },
    });

    const result = await chatSession.sendMessage(message);
    const reply  = result.response.text()
      || "Sorry, I could not generate a response. Please try again.";

    res.json({ success: true, data: { reply } });
  } catch (error) {
    console.error("[AI] Chat error:", error.message);
    const msg = error.message.includes("GEMINI_API_KEY") || error.message.includes("not set") || error.message.includes("API key")
      ? "AI service is not configured. Please contact the administrator."
      : "AI service error. Please try again later.";
    res.status(500).json({ success: false, message: msg });
  }
};

/* ── POST /api/ai/reindex – no-op (RAG removed) ─────────────────────────────────────────────*/
const reindex = async (req, res) => {
  res.json({ success: true, data: { indexed: 0, message: "Reindex not available." } });
};

module.exports = { chat, reindex, indexCourse, indexCoursesIfNeeded };
