// netlify/functions/componenta11y.js
import fs from "fs";
import path from "path";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// ---------------------------------------------------------------------------
// Whitelist
// ---------------------------------------------------------------------------
const ALLOWED_COMPONENTS = [
  "accordion",
  "aria",
  "breadcrumbs",
  "button",
  "card",
  "carousel",
  "charactercount",
  "checkbox",
  "combobox",
  "cookiebanner",
  "datetimepicker",
  "disclosure",
  "divider",
  "errormessage",
  "fileupload",
  "grid",
  "landmarks",
  "link",
  "list",
  "menu",
  "modaldialog",
  "navigation",
  "notification",
  "pagination",
  "password",
  "progressindicator",
  "radiobutton",
  "scroll",
  "select",
  "skiplink",
  "slider",
  "table",
  "tabs",
  "tag",
  "textarea",
  "textinput",
  "toast",
  "toggle",
  "toolbars",
  "tooltip",
  "treeview",
  "video"
].map(c => c.toLowerCase());

// ---------------------------------------------------------------------------
// Cache RAG data on cold start
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
async function fetchWithTimeout(resource, options = {}, ms = 90000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);

  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

// ---------------------------------------------------------------------------
// Compress RAG to reduce tokens
// ---------------------------------------------------------------------------
function compressRag(obj) {
  return JSON.stringify(obj)
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Tidy HTML output
// ---------------------------------------------------------------------------
function tidyHtml(html) {
  return html
    .replace(/^\s+/, "")
    .replace(/\s+$/, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/>\s+</g, ">\n<")
    .replace(/ {3,}/g, "  ")
    .trim();
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export async function handler(event) {
  try {
    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      console.error("Invalid request JSON");
    }

    const rawComponent = typeof body.component === "string" ? body.component.trim() : "";
    const component = rawComponent.toLowerCase();

    if (!OPENAI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing OPENAI_API_KEY environment variable" })
      };
    }

    if (!component) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Enter a component" })
      };
    }

    // ---------------------------------------------------------------------
    // Whitelist validation
    // ---------------------------------------------------------------------
    let allowedMatch = ALLOWED_COMPONENTS.find(c => c === component);

    if (!allowedMatch) {
      const fuzzy = ALLOWED_COMPONENTS.find(c => c.includes(component));
      if (fuzzy) {
        allowedMatch = fuzzy;
        console.log(`Whitelist fuzzy match: ${component} → ${fuzzy}`);
      }
    }

    if (!allowedMatch) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `"${component}" is not a recognised component. Doh!`
        })
      };
    }

    const canonicalComponent = allowedMatch;

    // ---------------------------------------------------------------------
    // Load RAG
    // ---------------------------------------------------------------------
    let match = RAG_CACHE[canonicalComponent];
    if (!match) {
      const keys = Object.keys(RAG_CACHE);
      const fuzzy = keys.find(k => k.includes(canonicalComponent));
      if (fuzzy) {
        match = RAG_CACHE[fuzzy];
        console.log(`RAG fuzzy match: ${canonicalComponent} → ${fuzzy}`);
      }
    }

    const ragComp = compressRag(match || {});

    // ---------------------------------------------------------------------
    // Prompt
    // ---------------------------------------------------------------------
    const userPrompt = `
Write accessibility documentation for the "${canonicalComponent}" component.

Requirements:
- Short definition
- WCAG 2.2 AA criteria (correct URLs)
- ARIA roles & states (MDN URLs)
- Semantic HTML structure
- Notes for web, iOS, Android
- Practical checklist
- Sources list (all URLs)
- Output semantic HTML only
- <h2> must contain exactly: ${canonicalComponent}

RAG data: ${ragComp}
`;

    // ---------------------------------------------------------------------
    // OpenAI API call (optimised)
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
        max_tokens: 6000,
        response_format: { type: "text" },
        messages: [
          {
            role: "system",
            content: `You write accurate accessibility documentation using WCAG, ARIA APG, MDN, Apple HIG, Material and GOV.UK guidelines. Use RAG data as your primary source. Do not invent URLs or WCAG criteria. Output clean semantic HTML only.`
          },
          {
            role: "user",
            content: userPrompt
          }
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
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
