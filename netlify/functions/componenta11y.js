// netlify/functions/RAG-componenta11y.js

import {
  recognisedComponentsURL,
  invalidComponentMsgHtml,
  linkPolicyBullets
} from "./shared/a11y-shared.js";
import fs from "fs";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const knowledgePath = "./netlify/data/a11y-knowledge.json";

// Utility: fetch with timeout safeguard
async function fetchWithTimeout(resource, options = {}, ms = 28000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

// Main Netlify Function
export async function handler(event) {
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

    // --- Retrieve verified data for RAG ---
    const kb = JSON.parse(fs.readFileSync(knowledgePath, "utf8"));
    const info = kb[component];

    if (!info) {
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
Notes: ${info.notes || ""}
`;

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
      "Verified data from accessibility knowledge base:",
      context,

      "",
      "Section order and exact headings",
      `1) <h2>${component}</h2>`,
      "2) <h3>Definition</h3>",
      "3) <h3>Usage</h3>",
      "4) <h3>Guidelines</h3>",
      "   - List applicable WCAG 2.2 AA criteria with one-line summaries.",
      "   - Use verified links only; never invent links.",
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
      "- No markdown, placeholders, or commentary.",
      "- Return only the HTML fragment."
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
