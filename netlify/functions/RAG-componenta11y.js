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

// --- Helper: build a strict source map and numbered refs ---------------------
function buildSourceMap(info) {
  const sources = {
    ariaPatterns: info.ariaPatterns || null,
    GDS: info.GDS || null,
    appleHIG: info.appleHIG || null,
    material3: info.material3 || null,
    a11yStyleGuide: info.a11yStyleGuide || null,
    hashi: info.hashi || info.helios || null,
    atomica11yWeb: info.atomica11yWeb || null,
    atomica11yiOS: info.atomica11yiOS || null
  };

  const entries = Object.entries(sources).filter(([, v]) => !!v);
  const numbered = entries.map(([k, url], idx) => ({ key: k, url, n: idx + 1 }));

  const byKey = {};
  const byToken = {};
  numbered.forEach(({ key, url, n }) => {
    byKey[key] = url;
    byToken[`S:${n}`] = url;
  });

  return { numbered, byKey, byToken };
}

// --- Helper: hydrate links and keep whitelisted standard URLs ---------------
function hydrateAndSanitiseHTML(html, srcMap) {
  let out = html;

  const whitelist = [
    "https://www.w3.org/",
    "https://developer.apple.com/",
    "https://m3.material.io/",
    "https://design-system.service.gov.uk/",
    "https://a11y-style-guide.com/"
  ];

  // 1) Strip any hrefs except whitelisted domains
  out = out.replace(/<a\b([^>]*?)\bhref\s*=\s*"(.*?)"([^>]*)>/gi, (m, pre, href, post) => {
    if (whitelist.some(domain => href.startsWith(domain))) return m;
    const cleaned = `${pre} ${post}`.replace(/\s+/g, " ").trim();
    return `<a ${cleaned}>`.replace(/\s+>/, ">");
  });

  // 2) Add hrefs from data-ref tokens
  out = out.replace(/<a\b([^>]*?)\bdata-ref\s*=\s*"([^"]+)"([^>]*)>(.*?)<\/a>/gis, (m, pre, ref, post, text) => {
    const keyTrim = ref.trim();
    const url = srcMap.byKey[keyTrim] || srcMap.byToken[keyTrim];
    if (!url) return text;
    const titleMatch = (pre + " " + post).match(/\btitle\s*=\s*"([^"]*)"/i);
    const titleAttr = titleMatch ? ` title="${titleMatch[1]}"` : "";
    return `<a href="${url}" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
  });

  // 3) Remove any <a> tags still without href
  out = out.replace(/<a\b(?![^>]*\bhref=)[^>]*>(.*?)<\/a>/gis, "$1");

  return out;
}

// Lambda handler
export async function handler(event) {
  // Simple HTML test page
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
      </html>`;
    return { statusCode: 200, headers: { "Content-Type": "text/html" }, body: html };
  }

  // Handle POST
  try {
    const body = JSON.parse(event.body || "{}");
    const component = (body.component || "").trim().toLowerCase();

    if (!OPENAI_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing OPENAI_API_KEY" }) };
    }
    if (!component) return { statusCode: 400, body: JSON.stringify({ error: "Enter a component" }) };

    const kb = JSON.parse(fs.readFileSync(knowledgePath, "utf8"));
    const info = kb[component];
    if (!info) {
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ html: invalidComponentMsgHtml }) };
    }

    const { numbered, byKey, byToken } = buildSourceMap(info);
    const sourceList = numbered.map(({ n, key, url }) => `[S:${n} ${key}] ${url}`).join("\n");

    const context = `
Component: ${component}
Notes: ${info.notes || ""}
Verified sources (use ONLY these; cite by token, not URL):
${sourceList}
`.trim();

    const prompt = [
      `You are writing cross-platform accessibility documentation for the "${component}" component.`,
      "",
      "Use the verified sources below and the approved public standards.",
      "For component-specific references, use data-ref tokens like <a data-ref=\"S:1\">ARIA Authoring Practices</a>.",
      "You may include direct URLs for WCAG, ARIA APG, Apple HIG, Material 3, GOV.UK Design System, and A11y Style Guide pages.",
      "Do not use or invent any other domains.",
      "",
      "Knowledge base context:",
      context,
      "",
      "Output requirements:",
      "- Return a single HTML fragment only.",
      "- Allowed elements: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <a>.",
      "- Use sentence case headings, UK English, concise GOV.UK tone.",
      "- Never output markdown, placeholders, or commentary.",
      "",
      `Recognised UI components: ${recognisedComponentsURL}`,
      "",
      "Section order:",
      `1) <h2>${component}</h2>`,
      "2) <h3>Definition</h3> – One-sentence purpose.",
      "3) <h3>Usage</h3> – When to use, when not to, variants and states.",
      "4) <h3>Guidelines</h3> – WCAG 2.2 AA criteria (e.g., “2.4.7 Focus visible”) with short explanations. Link to WCAG if relevant.",
      "5) <h3>Checklist</h3> – Practical verification points.",
      "6) <h3>Keyboard and focus</h3> – Typical keyboard interactions and focus order; mobile gestures if relevant.",
      "7) <h3>ARIA</h3> – Roles, states, and properties; cite ARIA APG pattern via token or link.",
      "8) <h3>Acceptance criteria</h3> – Concise, testable statements.",
      "9) <h3>Who this helps</h3> – User groups and benefits.",
      "",
      "10) <h2>Platform specifics</h2>",
      "11) <h3>Web</h3> – Use ARIA and WCAG links where available.",
      "12) <h3>iOS</h3> – Link Apple HIG component pages when relevant.",
      "13) <h3>Android</h3> – Link Material 3 component pages when relevant.",
      "14) <h3>Design</h3> – High-level advice on naming, semantics, states, and contrast.",
      "",
      "Link policy (only use these domains):",
      linkPolicyBullets("html"),
      "",
      "Return only the HTML fragment."
    ].join("\n");

    const resp = await fetchWithTimeout(OPENAI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are an accessibility technical writer producing verified documentation.

Use only:
• Verified component links from the knowledge base (inserted with <a data-ref="S:n">…</a>)
• Publicly verifiable standards from these domains:
  - https://www.w3.org/WAI/
  - https://developer.apple.com/design/human-interface-guidelines/
  - https://m3.material.io/
  - https://design-system.service.gov.uk/
  - https://a11y-style-guide.com/
If a category is missing, omit it rather than guessing.
Do not invent or infer links.
Return only a valid HTML fragment.`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.15,
        max_tokens: 1300
      })
    });

    const raw = await resp.text();
    console.log("OpenAI raw response:", raw.slice(0, 400));

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ error: `Invalid JSON: ${raw.slice(0, 200)}` }) };
    }

    if (!resp.ok) return { statusCode: resp.status, body: JSON.stringify({ error: data }) };

    let html = (data.choices?.[0]?.message?.content || "").trim();
    html = html.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();
    if (!html) html = `<p>No output returned from model.</p>`;

    const hydrated = hydrateAndSanitiseHTML(html, { byKey, byToken });

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ html: hydrated }) };
  } catch (err) {
    const msg = err?.name === "AbortError" ? "Upstream request timed out." : String(err);
    return { statusCode: 500, body: JSON.stringify({ error: msg }) };
  }
}
