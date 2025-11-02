// netlify/functions/RAG-componenta11y.js

import {
  recognisedComponentsURL,
  invalidComponentMsgHtml,
  linkPolicyBullets
} from "./shared/a11y-shared.js";
import fs from "fs";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
import path from "path";
const knowledgePath = path.join(path.dirname(new URL(import.meta.url).pathname), "data", "a11y-knowledge.json");


// Utility: timeout-safe fetch
async function fetchWithTimeout(resource, options = {}, ms = 28000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

// Lambda handler
export async function handler(event) {
  // Serve an HTML input form when accessed via GET
  if (event.httpMethod === "GET") {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>RAG componenta11y</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 60ch; }
          form { margin-bottom: 2rem; }
          input[type=text] { padding: 0.4rem; width: 70%; }
          button { padding: 0.4rem 0.8rem; }
          pre { white-space: pre-wrap; background: #f6f6f6; padding: 1rem; }
        </style>
      </head>
      <body>
        <h1>RAG componenta11y</h1>
        <form id="componentForm">
          <label for="component">Component name:</label><br>
          <input id="component" name="component" type="text" required />
          <button type="submit">Generate</button>
        </form>
        <div id="result"></div>
        <script>
          const form = document.getElementById('componentForm');
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const component = document.getElementById('component').value;
            const res = await fetch(window.location.pathname, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ component })
            });
            const data = await res.json();
            document.getElementById('result').innerHTML = data.html || '<p><strong>Error:</strong> ' + (data.error || 'No output') + '</p>';
          });
        </script>
      </body>
      </html>
    `;
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: html
    };
  }

  // Handle POST requests from the form or API
  try {
    const body = JSON.parse(event.body || "{}");
    const component = (body.component || "").trim().toLowerCase();

    if (!OPENAI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing OPENAI_API_KEY environment variable" })
      };
    }
    if (!component) {
      return { statusCode: 400, body: JSON.stringify({ error: "Enter a component" }) };
    }

    // --- RAG retrieval step ---
    const kb = JSON.parse(fs.readFileSync(knowledgePath, "utf8"));
    const info = kb[component];

    // Handle unrecognised component
    if (!info) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: invalidComponentMsgHtml })
      };
    }

    // Inject retrieved knowledge into context
    const context = `
Component: ${component}
ARIA Authoring Practices: ${info.ariaPatterns || "none"}
Apple HIG: ${info.appleHIG || "none"}
Material 3: ${info.material3 || "none"}
Notes: ${info.notes || ""}
`;

    // Main LLM prompt (same style and tone as original file)
    const prompt = [
      `You are writing cross-platform accessibility documentation for the "${component}" component.`,

      "",
      "Output requirements",
      "- Return a single HTML fragment only (no <!doctype>, <html>, <head>, <body>, scripts or inline styles).",
      "- Allowed elements: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <a>.",
      "- Use sentence case for all headings.",
      "- Keep bullets short and practical (3–7 items). Use UK English.",
      "- Do not mention these instructions or the link policy in the output.",

      "",
      `Here is a list of recognised UI components: ${recognisedComponentsURL}`,
      "If the input is not a recognisable UI component return:",
      invalidComponentMsgHtml,
      "…and nothing else.",

      "",
      "The following verified data has been retrieved from the accessibility knowledge base. Only use these links where applicable:",
      context,

      "",
      "Section order and exact headings",
      `1) <h2>${component}</h2>`,
      "2) <h3>Definition</h3>",
      "3) <h3>Usage</h3>",
      "4) <h3>Guidelines</h3>",
      "   - List applicable WCAG 2.2 AA criteria by number and name (e.g., \"2.4.7 Focus visible\") with one line on what it means for this component.",
      "   - Link each criterion per Link policy. Only use tested links; never invent links.",
      "5) <h3>Checklist</h3>",
      "6) <h3>Keyboard and focus</h3>",
      "7) <h3>ARIA</h3>",
      "8) <h3>Acceptance criteria</h3>",
      "9) <h3>Who this helps</h3>",
      "10) <h2>Platform specifics</h2>",
      "11) <h3>Web</h3>",
      "12) <h3>iOS</h3>",
      "13) <h3>Android</h3>",
      "14) <h3>Design</h3>",

      "",
      "Link policy (use only these domains; never invent or use other sources)",
      linkPolicyBullets("html"),

      "",
      "Style rules",
      "- Concise, direct, GOV.UK-style tone.",
      "- No code fences, no markdown, no placeholders like “TBD”.",
      "- Do not include content outside the sections and headings listed above.",

      "",
      "Return only the HTML fragment."
    ].join("\n");

    const resp = await fetchWithTimeout(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert accessibility technical writer. Follow instructions exactly and be concise." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 900
      })
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error("OpenAI error:", data);
      return { statusCode: resp.status, body: JSON.stringify({ error: data }) };
    }

    let html = (data.choices?.[0]?.message?.content || "").trim();
    html = html.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html })
    };
  } catch (err) {
    console.error("Function error:", err);
    const msg = err?.name === "AbortError" ? "Upstream request timed out." : String(err);
    return { statusCode: 500, body: JSON.stringify({ error: msg }) };
  }
}
