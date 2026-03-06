const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");
const Course = require("../models/Course");
const CourseEmbedding = require("../models/CourseEmbedding");

// Using Flash-Lite as it may have separate quota limits
const CHAT_MODEL = "gemini-flash-lite-latest";
const EMBED_MODEL = "text-embedding-004";

/* ── Lazy Gemini client ─────────────────────────────────────────────────── */
let _genAI = null;
function getClient() {
  // if (!_genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // }
  return _genAI;
}

/* ── Lazy OpenAI client ─────────────────────────────────────────────────── */
let _openAI = null;
function getOpenAIClient() {
  if (!_openAI) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables.");
    }
    _openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openAI;
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

/* ── POST /api/ai/generate-quiz ───────────────────────────────────────────── */
const generateQuiz = async (req, res) => {
  try {
    console.log("[AI] Generate quiz request received");
    console.log("[AI] Request body:", JSON.stringify(req.body, null, 2));
    
    const { concepts, paragraph, numberOfQuestions, difficulty } = req.body;

    // Validate inputs
    if ((!concepts || !concepts.trim()) && (!paragraph || !paragraph.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide either concepts or a paragraph/topic." 
      });
    }

    if (!numberOfQuestions || numberOfQuestions < 1 || numberOfQuestions > 20) {
      return res.status(400).json({ 
        success: false, 
        message: "Number of questions must be between 1 and 20." 
      });
    }

    if (!difficulty || !["Easy", "Medium", "Hard"].includes(difficulty)) {
      return res.status(400).json({ 
        success: false, 
        message: "Difficulty must be Easy, Medium, or Hard." 
      });
    }

    // Detect invalid input (HTML/UI text pollution)
    const inputText = (concepts || paragraph || "").trim();
    const suspiciousPatterns = [
      /←\s*Back/i,
      /Create\s+Quiz/i,
      /Quiz\s+Setup/i,
      /Build\s+a\s+quiz/i,
      /<[^>]+>/,  // HTML tags
      /⚙️|❓|✅/,  // Emoji indicators
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(inputText))) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid input detected. Please ensure you're entering actual concepts or content, not UI text. Clear the form and try again." 
      });
    }

    // Build the prompt based on what was provided
    let mainContent = "";
    if (concepts && concepts.trim()) {
      mainContent = `Topics/Concepts: ${concepts.trim()}`;
    } else {
      mainContent = `Topic/Paragraph: ${paragraph.trim()}`;
    }

    const prompt = `You are an expert quiz generator for an educational platform.

Generate ${numberOfQuestions} multiple choice quiz questions with the following requirements:

${mainContent}
Difficulty Level: ${difficulty}

Each question MUST have:
- A clear question text
- Exactly 4 options (A, B, C, D)
- One correct answer marked by the letter (A, B, C, or D)

Return ONLY a valid JSON object with a "questions" array. Follow this exact format:

{
  "questions": [
    {
      "question": "Question text here?",
      "optionA": "First option",
      "optionB": "Second option",
      "optionC": "Third option",
      "optionD": "Fourth option",
      "correctAnswer": "A"
    }
  ]
}

Requirements:
- Questions should be ${difficulty.toLowerCase()} difficulty
- Make options clear and distinct
- Ensure only one option is correct
- correctAnswer must be exactly "A", "B", "C", or "D"
- Return valid JSON only`;

    let responseText = "";
    let usedProvider = "";

    // Try OpenAI first, fallback to Gemini if it fails
    try {
      if (process.env.OPENAI_API_KEY) {
        console.log("[AI] Attempting quiz generation with OpenAI...");
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an expert quiz generator. Return only valid JSON objects with a 'questions' array."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4096,
          response_format: { type: "json_object" }
        });
        responseText = completion.choices[0].message.content;
        usedProvider = "OpenAI";
        console.log("[AI] Quiz generated successfully with OpenAI");
      } else {
        throw new Error("OpenAI API key not configured");
      }
    } catch (openAIError) {
      // Fallback to Gemini
      console.log("[AI] OpenAI failed:", openAIError.message);
      console.log("[AI] Falling back to Gemini...");
      
      try {
        const systemInstruction = "You are an expert quiz generator. Return only valid JSON objects with a 'questions' array.";
        
        const model = getClient().getGenerativeModel({ 
          model: CHAT_MODEL,
          systemInstruction,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          }
        });

        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        usedProvider = "Gemini";
        console.log("[AI] Quiz generated successfully with Gemini");
      } catch (geminiError) {
        console.error("[AI] Gemini error details:", geminiError.message);
        console.error("[AI] Gemini full error:", geminiError);
        throw new Error("All AI providers failed. Please try again later.");
      }
    }

    // Clean up response - remove markdown code blocks if present
    responseText = responseText.trim();
    if (responseText.startsWith("```json")) {
      responseText = responseText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (responseText.startsWith("```")) {
      responseText = responseText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    // Parse JSON
    let questions;
    try {
      const parsed = JSON.parse(responseText);
      questions = parsed.questions || parsed; // Handle both formats
      if (!Array.isArray(questions)) {
        questions = [parsed]; // Fallback if single object
      }
    } catch (parseErr) {
      console.error("[AI] Failed to parse AI response:", responseText);
      return res.status(500).json({ 
        success: false, 
        message: "AI generated invalid response. Please try again." 
      });
    }

    // Validate response structure
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({ 
        success: false, 
        message: "AI did not generate valid questions. Please try again." 
      });
    }

    // Validate each question
    const validQuestions = questions.filter(q => {
      return q.question && 
             q.optionA && q.optionB && q.optionC && q.optionD &&
             q.correctAnswer &&
             ["A", "B", "C", "D"].includes(q.correctAnswer);
    });

    if (validQuestions.length === 0) {
      return res.status(500).json({ 
        success: false, 
        message: "Generated questions were invalid. Please try again." 
      });
    }

    res.json({ 
      success: true, 
      data: { questions: validQuestions } 
    });

  } catch (error) {
    console.error("[AI] Generate quiz error:", error.message);
    console.error("[AI] Full error:", error);
    
    // Provide user-friendly error messages
    let errorMessage = "Failed to generate quiz. Please try again.";
    let statusCode = 500;

    if (error.message.includes("Invalid input detected")) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message.includes("exceeded your current quota") || 
               error.message.includes("insufficient_quota") ||
               error.message.includes("Quota exceeded") ||
               error.message.includes("Too Many Requests")) {
      errorMessage = "AI service quota exceeded. Please wait a few minutes and try again, or contact support to upgrade your API plan.";
      statusCode = 503;
    } else if (error.message.includes("API key") || 
               error.message.includes("not configured") ||
               error.message.includes("not set")) {
      errorMessage = "AI service is not configured. Please contact the administrator.";
      statusCode = 503;
    } else if (error.message.includes("All AI providers failed")) {
      errorMessage = "All AI services are currently unavailable. Please try again in a few minutes.";
      statusCode = 503;
    }

    res.status(statusCode).json({ success: false, message: errorMessage });
  }
};

module.exports = { chat, reindex, generateQuiz, indexCourse, indexCoursesIfNeeded };
