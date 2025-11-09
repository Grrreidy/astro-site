// netlify/functions/componenta11y.js
import {
  recognisedComponentsURL,
  invalidComponentMsgHtml,
  linkPolicyBullets
} from "./shared/a11y-shared.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Utility: safe fetch with timeout
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

    const component = typeof body.component === "string" ? body.component.trim() : "";

    if (!OPENAI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing OPENAI_API_KEY environment variable" })
      };
    }

    if (!component) {
      return { statusCode: 400, body: JSON.stringify({ error: "Enter a component" }) };
    }

    // --- Prompt setup -------------------------------------------------------
    const userPrompt = `
Write detailed, cross-platform accessibility documentation for the "${component}" component.

Include:
- A short definition and description of the component’s purpose.
- WCAG 2.2 AA criteria that apply, with one-line explanations. Supply a URL link to each criterion referenced.
- Common ARIA roles, states, and properties, with correct focus and keyboard behaviour.
- Notes for web, iOS, and Android implementations referencing official HIG, Material 3, and ARIA APG patterns. Supply a URL link to each guideline referenced.
- A practical checklist of design and engineering best practices.
- A concise Sources section listing the URLs referenced. Link directly the that component's documentation, no a generic website or page.
Use UK English and return only valid HTML containing <h2>, <h3>, <p>, <ul>, <ol>, <li>, and <a>.
`;

    // --- OpenAI request -----------------------------------------------------
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
Generate accurate, standards-based HTML documentation.

Only use authoritative accessibility sources:
- WCAG 2.2, ARIA Authoring Practices Guide (APG), Apple Human Interface Guidelines (HIG),
  Material 3, GOV.UK Design System, WebAIM, Retralogical, Deque, atomica11y, popetech,
  axesslab, and A11y Style Guide.

For reference, a “component” means a reusable piece of a user interface, such as a button, card, or modal.
A comprehensive list of common components can be found at https://component.gallery/components/.

Follow these rules:
- The first heading (<h2>) must contain only the component name, e.g. <h2>${component}</h2>.
- Never invent or fabricate content, links, or WCAG numbers.
- If uncertain, state “No official guidance found” rather than guessing.
- Do not include markdown, code fences, or placeholders.
- Be concise and factual, in GOV.UK-style tone.
- Output one clean HTML fragment with proper headings in sentence case.
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

    // --- Clean output -------------------------------------------------------
    let html = (data.choices?.[0]?.message?.content || "").trim();

    // Remove code fences if present
    html = html.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "");

    // Fix markdown links to HTML
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');

    // Normalise spacing safely (do NOT remove all multiple spaces or line breaks)
    html = html
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "");

    // Guard against rogue partial tags like "</"
    if (html.endsWith("</")) html = html.slice(0, -2);

    // --- Return -------------------------------------------------------------
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({ html })
    };
  } catch (err) {
    console.error("Function error:", err);
    const msg = err?.name === "AbortError" ? "Upstream request timed out." : String(err);
    return { statusCode: 500, body: JSON.stringify({ error: msg }) };
  }
}
