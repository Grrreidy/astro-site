// netlify/functions/componenta11y.js
import fs from "fs";
import path from "path";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

/* ---------------------------------------------------------------------------
   Component whitelist (must match the RAG filenames)
--------------------------------------------------------------------------- */

const ALLOWED_COMPONENTS = [
  "accordion",
  "aria",
  "breadcrumbs",
  "button",
  "card",
  "carousel",
  "character count",
  "checkbox",
  "combobox",
  "cookiebanner",
  "date time picker",
  "disclosure",
  "divider",
  "error message",
  "file upload",
  "grid",
  "landmarks",
  "link",
  "list",
  "menu",
  "modal dialog",
  "navigation",
  "notification",
  "pagination",
  "password",
  "progress indicator",
  "radio button",
  "scroll",
  "select",
  "skip link",
  "slider",
  "table",
  "tabs",
  "tag",
  "text area",
  "text input",
  "toast",
  "toggle",
  "toolbars",
  "tooltip",
  "treeview",
  "video"
].map(c => c.toLowerCase());

/* ---------------------------------------------------------------------------
   RAG cache
--------------------------------------------------------------------------- */

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

/* ---------------------------------------------------------------------------
   Timeout-safe fetch
--------------------------------------------------------------------------- */
async function fetchWithTimeout(resource, options = {}, ms = 40000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);

  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

/* ---------------------------------------------------------------------------
   HTML cleanup
--------------------------------------------------------------------------- */
function tidyHtml(html) {
  return html
    .replace(/^\s+/, "")
    .replace(/\s+$/, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/>\s+</g, ">\n<")
    .replace(/ {3,}/g, "  ")
    .trim();
}

/* ---------------------------------------------------------------------------
   Handler
--------------------------------------------------------------------------- */
export async function handler(event) {
  try {
    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      console.error("Invalid JSON in request");
    }

    const rawComponent = typeof body.component === "string" ? body.component.trim() : "";
    const component = rawComponent.toLowerCase();

    if (!OPENAI_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing OPENAI_API_KEY environment variable" }) };
    }

    if (!component) {
      return { statusCode: 400, body: JSON.stringify({ error: "Enter a component" }) };
    }

    /* ---------------------------------------------------------------------
       Whitelist validation
    --------------------------------------------------------------------- */
    let allowedMatch = ALLOWED_COMPONENTS.find(c => c === component);

    if (!allowedMatch) {
      const fuzzy = ALLOWED_COMPONENTS.find(c => c.includes(component) || component.includes(c));
      if (fuzzy) {
        allowedMatch = fuzzy;
        console.log(`Whitelist fuzzy match: ${component} → ${fuzzy}`);
      }
    }

    if (!allowedMatch) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `"${component}" is not a recognised component. You're trying to trick me with stupid words, aren't you?`
        })
      };
    }

    const canonicalComponentName = allowedMatch;

    /* ---------------------------------------------------------------------
       RAG lookup
    --------------------------------------------------------------------- */
    const ragKey = canonicalComponentName.replace(/ /g, "").toLowerCase();
    let match = RAG_CACHE[ragKey];

    if (!match) {
      const fuzzy = Object.keys(RAG_CACHE).find(k => k.includes(ragKey));
      if (fuzzy) {
        match = RAG_CACHE[fuzzy];
        console.log(`RAG fuzzy match: ${canonicalComponentName} → ${fuzzy}`);
      }
    }

    const ragContext = match
      ? `Below is trusted RAG DATA for "${canonicalComponentName}":\n${JSON.stringify(match, null, 2)}`
      : `No RAG data found for "${canonicalComponentName}". Use only trusted sources.`;

    /* ---------------------------------------------------------------------
       Prompt
    --------------------------------------------------------------------- */
    const userPrompt = `
    Write detailed, cross-platform accessibility documentation for the "${canonicalComponentName}" component.

    Use the RAG data below as the primary reference:
    ${ragContext}

    Include:
    • A short definition
    • WCAG 2.2 AA criteria (with correct URLs)
    • ARIA roles and states (with MDN URLs)
    • Semantic HTML structure
    • Web, iOS and Android notes
    • A practical checklist
    • A Sources section listing ALL URLs used

    Return valid semantic HTML only.
    The <h2> must contain exactly: ${canonicalComponentName}.
    `;

    /* ---------------------------------------------------------------------
       OpenAI API
    --------------------------------------------------------------------- */
    const resp = await fetchWithTimeout(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0,
        max_tokens: 6000,
        messages: [
          {
            role: "system",
            content: `
            You are an expert accessibility technical writer.
            Use ONLY verified accessibility sources and the provided RAG data.

            Trusted sources:
            WCAG 2.2, ARIA APG, MDN, Apple HIG, Material 3, GOV.UK Design System,
            WebAIM, TetraLogical, Deque, atomica11y, Popetech, Axesslab, A11y Style Guide.

            Never invent URLs or WCAG numbers.
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

    html = html
      .replace(/^```(?:html)?/i, "")
      .replace(/```$/i, "")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');

    html = tidyHtml(html);

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
