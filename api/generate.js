// /api/generate.js — Vercel Serverless Function
// Never Overthink a Message Again — Backend

// ─── Simple In-Memory Rate Limiter ────────────────────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  // Periodic cleanup of map when it gets large (e.g. 1000+ entries)
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now - val.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  record.count += 1;
  return false;
}

// ─── Prompt Injection Sanitizer ───────────────────────────────────────────────
const BANNED_PHRASES = [
  "ignore previous instructions",
  "ignore all instructions",
  "disregard the above",
  "forget your instructions",
  "you are now",
  "act as",
  "new persona",
  "jailbreak",
  "dan mode",
  "pretend you are",
  "override instructions",
  "system prompt",
  "as an ai",
  "you must obey",
];

function sanitizeInput(text) {
  if (!text || typeof text !== "string") return "";
  let sanitized = text.trim();
  const lower = sanitized.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) {
      return "[input sanitized]";
    }
  }
  return sanitized.slice(0, 500); // hard cap
}

// ─── CORS Helper ──────────────────────────────────────────────────────────────
function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = (process.env.ALLOWED_ORIGIN || "*").toLowerCase().split(",").map(s => s.trim());
  
  if (origin && allowedOrigins.includes(origin.toLowerCase())) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN?.split(",")[0] || "*");
  }
  
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCorsHeaders(req, res);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  if (isRateLimited(ip)) {
    return res.status(429).json({
      error: "Too many requests. Please wait a minute before trying again.",
    });
  }

  // ── Request size guard ────────────────────────────────────────────────────
  const contentLength = parseInt(req.headers["content-length"] || "0");
  if (contentLength > 5000) {
    return res.status(413).json({ error: "Request too large." });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  const body = req.body;
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Invalid request body." });
  }

  const {
    recipient,
    situation,
    tone,
    context,
    relationship,
    includeExplanation,
  } = body;

  // ── Validate required fields ──────────────────────────────────────────────
  if (!situation || typeof situation !== "string" || situation.trim().length < 3) {
    return res.status(400).json({ error: "Situation is required (min 3 characters)." });
  }
  if (situation.trim().length > 500) {
    return res.status(400).json({ error: "Situation must be under 500 characters." });
  }

  // ── Sanitize all inputs ───────────────────────────────────────────────────
  const cleanRecipient    = sanitizeInput(recipient || "Unknown");
  const cleanSituation    = sanitizeInput(situation);
  const cleanTone         = sanitizeInput(tone || "Neutral");
  const cleanContext      = sanitizeInput(context || "");
  const cleanRelationship = sanitizeInput(relationship || "Semi-formal");
  const cleanExplanation  = includeExplanation === true || includeExplanation === "true" ? "Yes" : "No";

  // ── Build AI Prompts ──────────────────────────────────────────────────────
  const systemPrompt = `You are an expert communication assistant.

Your job is to generate realistic, polite, and socially appropriate messages.

Rules:
- Keep responses believable and grounded
- Avoid extreme, unethical, or illegal excuses
- Maintain tone based on recipient and relationship
- Keep messages between 40–120 words
- Be concise and natural
- Focus on preserving trust

Output ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "professional": "...",
  "casual": "...",
  "smart": "..."
}

Where:
- professional: A formal, polished message
- casual: A relaxed, friendly message
- smart: A slightly creative but realistic message`;

  const userPrompt = `Generate 3 messages based on:

Recipient: ${cleanRecipient}
Situation: ${cleanSituation}
Tone: ${cleanTone}
Context: ${cleanContext || "Not provided"}
Relationship: ${cleanRelationship}
Include explanation: ${cleanExplanation}`;

  // ── Call AI API ───────────────────────────────────────────────────────────
  try {
    const openaiKey   = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    let result;

    if (openaiKey) {
      result = await callOpenAI(systemPrompt, userPrompt, openaiKey);
    } else if (anthropicKey) {
      result = await callAnthropic(systemPrompt, userPrompt, anthropicKey);
    } else {
      return res.status(500).json({
        error: "No AI API key configured.",
      });
    }

    return res.status(200).json(result);
  } catch (err) {
    // Don't leak internal error details
    console.error("[generate] Error:", err.message);
    return res.status(500).json({ error: "Failed to generate messages. Please try again." });
  }
}

// ─── OpenAI Caller ────────────────────────────────────────────────────────────
async function callOpenAI(systemPrompt, userPrompt, apiKey) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  return parseAIResponse(content);
}

// ─── Anthropic Caller ─────────────────────────────────────────────────────────
async function callAnthropic(systemPrompt, userPrompt, apiKey) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || "";
  return parseAIResponse(content);
}

// ─── JSON Response Parser ─────────────────────────────────────────────────────
function parseAIResponse(raw) {
  // Strip possible markdown code fences
  const cleaned = raw.replace(/```json?/gi, "").replace(/```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed.professional || !parsed.casual || !parsed.smart) {
      throw new Error("Missing fields in AI response");
    }
    return {
      professional: String(parsed.professional).trim(),
      casual:       String(parsed.casual).trim(),
      smart:        String(parsed.smart).trim(),
    };
  } catch {
    // Fallback: return raw as all three if parsing fails
    const fallback = cleaned || "Unable to generate message. Please try again.";
    return {
      professional: fallback,
      casual:       fallback,
      smart:        fallback,
    };
  }
}
