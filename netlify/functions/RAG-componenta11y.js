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

async function fetchWithTimeout(resource, options = {}, ms = 28000) {
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

    if (!info) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: invalidComponentMsgHtml })
      };
    }

    // Prepare context for LLM
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
      "You have access to the following verified data from the internal accessibility knowledge base:",
      context,
      "",
      "Use only these verified URLs when referencing patterns or guidelines. Do not invent or guess any links.",
      "",
      "Follow the same HTML structure and content order as in componenta11y.js:",
      "Definition, Usage, Guidelines, Checklist, Keyboard and focus, ARIA, Acceptance criteria, Who this helps, Platform specifics (Web, iOS, Android, Design).",
      "",
      "Return only the HTML fragment, never markdown or explanations."
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
