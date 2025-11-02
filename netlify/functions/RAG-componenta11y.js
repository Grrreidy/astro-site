// netlify/functions/RAG-componenta11y.js

import {
  recognisedComponentsURL,
  invalidComponentMsgHtml,
  linkPolicyBullets
} from "./shared/a11y-shared.js";
import fs from "fs";
import path from "path";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Correct path resolution for Netlify Functions
const knowledgePath = path.join(__dirname, "data", "a11y-knowledge.json");

// Utility: timeout-safe fetch
async function fetchWithTimeout(resource, options = {}, ms = 60000) {
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
  // Serve a minimal test form when accessed via GET
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
            const text = await res.text();
            let data;
            try { data = JSON.parse(text); }
            catch { data = { error: text }; }
            document.getElementById('result').innerHTML =
              data.html || '<p><strong>Error:</strong> ' + (data.error || 'No output') + '</p>';
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

  // Handle POST requests
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
    console.log("Reading knowledge base from:", knowledgePath);
    const kb = JSON.parse(fs.readFileSync(knowledgePath, "utf8"));
    const info = kb[component];

    if (!info) {
      console.log("Component not found in KB:", component);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: invalidComponentMsgHtml })
      };
    }

    const context = `
Component: ${component}
ARIA Authoring Practices: ${info.ariaPatterns || "none"}
Apple HIG: ${info.appleHIG || "none"}
Material 3: ${info.material3 || "none"}
GDS: ${info.GDS || "none"}
A11y Style Guide: ${info.a11yStyleGuide || "none"}
Helios: ${info.hashi || info.helios || "none"}
AtomicA11y: ${info.atomica11yWeb || info.atomica11yiOS || "none"}
Notes: ${info.notes || ""}
`;

    // Strict, retrieval-grounded prompt
    const prompt = [
      `You are writing verified accessibility documentation for the "${component}" component.`,
      "",
      "You must only use the data and URLs explicitly provided in the following knowledge base context.",
      "Do not rely on general knowledge, training data, or any other external information.",
      "If a category (such as Apple HIG or Material 3) is listed as 'none', omit it completely.",
      "Do not invent, infer, or guess additional content, sources, or links.",
      "Every URL must match exactly one of those listed in the knowledge base context.",
      "If the knowledge base lacks a link or topic, skip it entirely rather than fabricating a response.",
      "",
      "Knowledge base context:",
      context,
      "",
      "Return a concise HTML fragment structured in the following exact order:",
      `1) <h2>${component}</h2>`,
      "2) <h3>Definition</h3> - One sentence describing the component’s purpose.",
      "3) <h3>Usage</h3> - When to use it, when not to, and typical variations or states.",
      "4) <h3>Guidelines</h3> - List WCAG 2.2 AA criteria only if verifiable from the knowledge base URLs.",
      "5) <h3>Checklist</h3> - Practical items that can be confirmed visually or via assistive tech testing.",
      "6) <h3>Keyboard and focus</h3> - Describe focus order and keyboard interaction from the ARIA pattern, if present.",
      "7) <h3>ARIA</h3> - Summarise ARIA roles, states, and properties using only what’s found in the knowledge base links.",
      "8) <h3>Acceptance criteria</h3> - Short, testable statements derived from verified information only.",
      "9) <h3>Who this helps</h3> - Short bullets listing user groups (no invented examples).",
      "10) <h2>Platform specifics</h2>",
      "11) <h3>Web</h3> - Use only verified ARIA and WCAG links.",
      "12) <h3>iOS</h3> - Use only verified Apple HIG links if available.",
      "13) <h3>Android</h3> - Use only verified Material 3 links if available.",
      "14) <h3>Design</h3> - Refer only to verified GDS or A11y Style Guide sources.",
      "",
      "Output requirements:",
      "- Output must be a single valid HTML fragment (no <!doctype>, <html>, <head>, or <body>).",
      "- Allowed elements: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <a>.",
      "- Use sentence case for headings.",
      "- Use concise UK English in GOV.UK style.",
      "- Do not mention missing data, 'none', or placeholders.",
      "- Do not output anything outside the listed sections.",
      "",
      "Return only the HTML fragment."
    ].join("\n");

    // Make the API request
    const resp = await fetchWithTimeout(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are an accessibility technical writer producing verified documentation.
You must only use the provided context from the RAG knowledge base.
Never invent, infer, or guess any sources or criteria.
If data is missing, omit that section without explanation.
All external links must match exactly those given in the context.`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 900
      })
    });

    const raw = await resp.text();
    console.log("OpenAI raw response:", raw.slice(0, 500));

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("JSON parse error:", e);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Invalid JSON from OpenAI: ${raw.slice(0, 300)}` })
      };
    }

    if (!resp.ok) {
      console.error("OpenAI error:", data);
      return { statusCode: resp.status, body: JSON.stringify({ error: data }) };
    }

    let html = (data.choices?.[0]?.message?.content || "").trim();
    html = html.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();

    if (!html) {
      html = `<p>No output returned from model.</p>`;
    }

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
