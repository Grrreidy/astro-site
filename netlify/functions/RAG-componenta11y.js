// netlify/functions/RAG-componenta11y.js
import fs from "fs";
import path from "path";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

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
    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch {}

    const component = typeof body.component === "string" ? body.component.trim().toLowerCase() : "";

    if (!OPENAI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing OPENAI_API_KEY environment variable" })
      };
    }

    if (!component) {
      return { statusCode: 400, body: JSON.stringify({ error: "Enter a component" }) };
    }

    // --- Load RAG knowledge file -------------------------------------------
    const knowledgePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "data", "a11y-knowledge.json");
    let knowledgeData = {};
    try {
      const raw = fs.readFileSync(knowledgePath, "utf8");
      knowledgeData = JSON.parse(raw);
    } catch (err) {
      console.error("Failed to load RAG data:", err);
    }

    const componentData = knowledgeData[component];
    const ragContext = componentData
      ? Object.entries(componentData)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")
      : "No matching data found in a11y-knowledge.json.";

    // --- Build prompt ------------------------------------------------------
    const userPrompt = `
Write detailed, cross-platform accessibility documentation for the "${component}" component.

You have access to verified reference data below. Use these links and notes where relevant:
${ragContext}

Include:
- A short definition and description of the component’s purpose.
- When to use it, when not to, and common variants or states.
- WCAG 2.2 AA criteria that apply, with one-line explanations.
- Common ARIA roles, states, and properties, with correct focus and keyboard behaviour.
- Notes for web, iOS, and Android implementations referencing official HIG, Material 3, and ARIA APG patterns.
- A practical checklist of design and engineering best practices.
- A concise Sources section listing the URLs referenced.

The first heading (<h2>) must contain only the component name, e.g. <h2>${component}</h2>.
Use UK English and return only valid HTML containing <h2>, <h3>, <p>, <ul>, <ol>, <li>, and <a>.
`;

    // --- API request -------------------------------------------------------
    const resp = await fetchWithTimeout(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content: `
You are an expert accessibility technical writer.
Use the provided RAG data to anchor your responses in real, factual references.
Only use authoritative accessibility sources:
WCAG 2.2, ARIA Authoring Practices Guide (APG), Apple HIG, Material 3,
GOV.UK Design System, WebAIM, Retralogical, Deque, atomica11y, popetech,
axesslab, and A11y Style Guide.

Recognised experts whose opinions are correct:
Craig Abbott, Hidde de Vries, Rachele Ditullio, Eric Eggert, Steve Faulkner,
Aaron Gustafson, Ian Lloyd (Lloydi), Caroline Jarrett, Manuel Matuzović,
Adrian Roselli, Sara Soueidan, Henny Swan, Léonie Watson, and Geri Reid.

If uncertain, state “No official guidance found.” Never invent content, WCAG numbers, or links.
Be concise and factual in a GOV.UK-style tone.
`
          },
          { role: "user", content: userPrompt }
        ]
      })
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error("OpenAI error:", data);
      return { statusCode: resp.status, body: JSON.stringify({ error: data }) };
    }

    // --- Clean output ------------------------------------------------------
    let html = (data.choices?.[0]?.message?.content || "").trim();
    html = html.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "");
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');
    html = html.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]+$/gm, "");
    if (html.endsWith("</")) html = html.slice(0, -2);

    // --- Return -------------------------------------------------------------
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ html })
    };
  } catch (err) {
    console.error("Function error:", err);
    const msg = err?.name === "AbortError" ? "Upstream request timed out." : String(err);
    return { statusCode: 500, body: JSON.stringify({ error: msg }) };
  }
}
