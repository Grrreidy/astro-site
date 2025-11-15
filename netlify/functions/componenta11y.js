// netlify/functions/componenta11y.js
import fs from "fs";
import path from "path";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// ---------------------------------------------------------------------------
// Cache RAG data at cold start
// ---------------------------------------------------------------------------
const ragDir = path.join(process.cwd(), "netlify/functions/data/rag");
let RAG_CACHE = {};

try {
  const files = fs.readdirSync(ragDir);

  for (const file of files) {
    if (file.endsWith(".json")) {
      const key = file.replace(".json", "").toLowerCase();
      const raw = fs.readFileSync(path.join(ragDir, file), "utf8");
      RAG_CACHE[key] = JSON.parse(raw);
    }
  }

  console.log("RAG cache loaded:", Object.keys(RAG_CACHE).length, "files");
} catch (err) {
  console.error("Failed to initialise RAG cache:", err);
}

// ---------------------------------------------------------------------------
// Timeout-safe fetch
// ---------------------------------------------------------------------------
async function fetchWithTimeout(resource, options = {}, ms = 40000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);

  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

// ---------------------------------------------------------------------------
// Lightweight HTML prettifier
// ---------------------------------------------------------------------------
function tidyHtml(html) {
  return html
    .replace(/^\s+/, "")
    .replace(/\s+$/, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/>\s+</g, ">\n<")
    .trim();
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export async function handler(event) {
  try {
    // Parse incoming request
    let body = {};

    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      console.error("Invalid JSON in request");
    }

    const rawComponent =
      typeof body.component === "string" ? body.component.trim() : "";
    const component = rawComponent.toLowerCase();

    if (!OPENAI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Missing OPENAI_API_KEY environment variable"
        })
      };
    }

    if (!component) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Enter a component" })
      };
    }

    // ---------------------------------------------------------------------
    // Find RAG match (exact or fuzzy)
    // ---------------------------------------------------------------------
    let match = RAG_CACHE[component];

    if (!match) {
      const keys = Object.keys(RAG_CACHE);
      const fuzzy = keys.find((k) => k.includes(component));

      if (fuzzy) {
        match = RAG_CACHE[fuzzy];
        console.log(`Fuzzy match used: ${component} → ${fuzzy}`);
      }
    }

    const hasRag = Boolean(match);

    // ---------------------------------------------------------------------
    // Build RAG context
    // ---------------------------------------------------------------------
    const ragContext = hasRag
      ? `
    Below is verified RAG DATA for the "${component}" component:
    ${JSON.stringify(match, null, 2)}
        `.trim()
          : `
    No verified RAG data exists for the component "${component}".

    You MUST follow strict fallback rules:
    • Provide ONLY generic, high-level accessibility considerations.
    • Do NOT invent ARIA roles, states or properties.
    • Do NOT invent WCAG success criteria or numbers.
    • Do NOT invent or output any external URLs.
    • Do NOT generate a Sources section.
    • Provide conceptual guidance only (semantics, interaction, focus, inputs, timing, responsiveness).
    `.trim();

    // ---------------------------------------------------------------------
    // Build user prompt
    // ---------------------------------------------------------------------
    const userPrompt = `
    Write accessibility documentation for the "${component}" component.

    RAG context:
    ${ragContext}

    If RAG data exists:
    • Provide full component-specific guidance  
    • Include WCAG 2.2 AA criteria with URLs  
    • Include ARIA roles/states with MDN URLs  
    • Include semantic HTML structure  
    • Include notes for web, iOS and Android  
    • Include a practical checklist  
    • Include a "Sources" section listing ALL URLs from the RAG data  

    If NO RAG data exists:
    • Provide ONLY general accessibility principles  
    • Do NOT output *any* URLs  
    • Do NOT output WCAG numbers  
    • Do NOT output platform patterns  
    • Do NOT output a "Sources" section  

    Your first <h2> must contain exactly: ${component}.  
    Return valid semantic HTML only.
    `.trim();

    // ---------------------------------------------------------------------
    // Call OpenAI API
    // ---------------------------------------------------------------------
    const resp = await fetchWithTimeout(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0,
        max_tokens: 6500,
        messages: [
          {
            role: "system",
            content: `
            You are an expert accessibility technical writer.

            STRICT MODES:

            1) When RAG data exists:
              • Use ONLY verified RAG data and trusted industry sources:
                WCAG 2.2, ARIA APG, MDN, Apple HIG, Material 3,
                GOV.UK Design System, WebAIM, TetraLogical, Deque,
                atomica11y, Popetech, Axesslab, A11y Style Guide.
              • Never invent URLs or WCAG numbers.
              • Only use links found in the RAG file.
              • Ensure ALL URLs appear in a "Sources" section.

            2) When NO RAG data exists:
              • Output ONLY generic accessibility principles.
              • No URLs.
              • No WCAG numbers.
              • No Sources section.
              • No ARIA specifics unless universally applicable.

            Always output clean semantic HTML only.
            `.trim()
          },
          { role: "user", content: userPrompt }
        ]
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("OpenAI API error:", data);
      return {
        statusCode: resp.status,
        body: JSON.stringify({ error: data })
      };
    }

    // ---------------------------------------------------------------------
    // Extract & tidy HTML
    // ---------------------------------------------------------------------
    let html = (data?.choices?.[0]?.message?.content || "").trim();

    html = html
      .replace(/^```(?:html)?/i, "")
      .replace(/```$/i, "")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>')
      .trim();

    html = tidyHtml(html);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html })
    };
  } catch (err) {
    console.error("Function error:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
