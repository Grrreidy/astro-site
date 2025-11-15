// netlify/functions/componenta11y.js
import fs from "fs";
import path from "path";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Timeout-safe fetch wrapper
async function fetchWithTimeout(resource, options = {}, ms = 40000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function handler(event) {
  try {
    // Parse incoming request
    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      console.error("Invalid JSON in request body");
    }

    const rawComponent = typeof body.component === "string" ? body.component.trim() : "";
    const component = rawComponent.toLowerCase();
    console.log("Incoming component:", component);

    if (!OPENAI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing OPENAI_API_KEY environment variable" })
      };
    }

    if (!component) {
      return { statusCode: 400, body: JSON.stringify({ error: "Enter a component" }) };
    }

    // ---------------------------------------------------------------------
    // Load all JSON files from /data/RAG
    // ---------------------------------------------------------------------
    const ragDir = path.join(process.cwd(), "netlify/functions/data/RAG");
    console.log("Loading RAG directory:", ragDir);

    let ragData = {};

    try {
      const files = fs.readdirSync(ragDir);

      for (const file of files) {
        if (file.endsWith(".json")) {
          const raw = fs.readFileSync(path.join(ragDir, file), "utf8");
          const json = JSON.parse(raw);

          // normalise file name → key
          const key = file.replace(".json", "").toLowerCase();
          ragData[key] = json;
        }
      }
    } catch (err) {
      console.error("Failed to load RAG files:", err);
    }

    // ---------------------------------------------------------------------
    // Look up the component
    // ---------------------------------------------------------------------
    let match = ragData[component];

    // Fuzzy fallback
    if (!match) {
      const keys = Object.keys(ragData);
      const fuzzy = keys.find(k => k.includes(component));
      if (fuzzy) {
        match = ragData[fuzzy];
        console.log(`Fuzzy match used: ${component} → ${fuzzy}`);
      }
    }

    const ragContext = match
      ? `Below is trusted RAG DATA for the "${component}" component:\n${JSON.stringify(match, null, 2)}`
      : `No RAG data found for "${component}".`;

    // ---------------------------------------------------------------------
    // Build prompt
    // ---------------------------------------------------------------------
    const userPrompt = `
Write detailed, cross-platform accessibility documentation for the "${component}" component.

Use the RAG data below as your primary reference set:
${ragContext}

Include:
- A short definition
- WCAG 2.2 AA criteria with URLs
- ARIA roles and states with MDN URLs and simple explanations
- Semantic HTML structure
- Notes for web, iOS and Android with official guideline links
- A practical checklist
- A Sources section with all URLs used

Return valid HTML only.
<h2> must contain exactly: ${component}.
`;

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
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 3500,
        messages: [
          {
            role: "system",
            content: `
You are an expert accessibility technical writer.
Use ONLY verified accessibility sources and the provided RAG data.

Trusted sources:
WCAG 2.2, ARIA APG, MDN, Apple HIG, Material 3, GOV.UK Design System,
WebAIM, TetraLogical, Deque, atomica11y, Popetech, Axesslab, A11y Style Guide.

Never invent WCAG numbers or URLs.
Always output clean, semantic HTML.
`
          },
          { role: "user", content: userPrompt }
        ]
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("OpenAI API error:", data);
      return { statusCode: resp.status, body: JSON.stringify({ error: data }) };
    }

    let html = (data.choices?.[0]?.message?.content || "").trim();

    // Clean HTML
    html = html
      .replace(/^```(?:html)?/i, "")
      .replace(/```$/i, "")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html })
    };

  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
