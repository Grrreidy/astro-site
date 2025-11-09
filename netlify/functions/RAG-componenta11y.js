// netlify/functions/RAG-componenta11y.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
      ? `Below is trusted RAG DATA for the "${component}" component.
These are verified, authoritative references. 
You must use every URL listed in this data in the “Sources” section, and link to relevant ones in the body where they apply.

${JSON.stringify(componentData, null, 2)}`
      : `No RAG data found for the component "${component}".`;

    // --- Build prompt ------------------------------------------------------
    const userPrompt = `
Write detailed, cross-platform accessibility documentation for the "${component}" component.

Use the RAG data below as your primary reference set.
Every URL provided must appear in the “Sources” section.
Where relevant, include inline links to those sources in the body content.

${ragContext}

Include:
- A short definition and description of the component’s purpose.
- WCAG 2.2 AA criteria that apply, with one-line explanations.
- Common ARIA roles, states, and properties, with correct focus and keyboard behaviour.
- Notes for web, iOS, and Android implementations referencing official HIG, Material 3, and ARIA APG patterns.
- A practical checklist of design and engineering best practices.
- A concise “Sources” section listing every URL from the RAG data.

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
        max_tokens: 1300,
        messages: [
          {
            role: "system",
            content: `
You are an expert accessibility technical writer.
Use the provided RAG data as the single source of truth for component-specific references.

You must:
- Include every URL from the RAG data in the “Sources” section.
- Link to relevant RAG URLs within the content body where appropriate.
- Treat the RAG data as verified best practice for this component.

Only use authoritative accessibility sources:
WCAG 2.2, ARIA Authoring Practices Guide (APG), Apple Human Interface Guidelines, Material 3,
GOV.UK Design System, WebAIM, Retralogical, Deque, atomica11y, popetech,
axesslab, A11y Style Guide, and the provided RAG data.

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
