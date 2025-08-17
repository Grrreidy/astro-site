// netlify/functions/a11y-docs.js (CommonJS serverless handler)
const {
  recognisedComponentsURL,
  invalidComponentMsgMd,
  linkPolicyBullets
} = require("./shared/a11y-shared.js");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

exports.handler = async (event) => {
  try {
    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch {}
    const component = typeof body.component === "string" ? body.component.trim() : "";
    const url = typeof body.url === "string" ? body.url.trim() : "";

    if (!OPENAI_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing OPENAI_API_KEY environment variable" }) };
    }
    if (!component) {
      return { statusCode: 400, body: JSON.stringify({ error: "Component field is required" }) };
    }

    const dsRefLine = url
      ? `- Reference and mirror the site at: ${url}`
      : "- No URL provided. Emulate clear, neutral DS tone similar to GOV.UK, Polaris, Lightning, or USWDS.";

    const prompt = [
      `You are an accessibility technical writer creating design system documentation for the "${component}" component.`,

      "",
      "If a design system URL is provided, use it to infer naming, variants, states, tone of voice, and typical usage patterns:",
      dsRefLine,

      "",
      "Audience",
      "- Designers and engineers who need concise, practical guidance.",

      "",
      "Guardrail",
      `- If "${component}" is not a recognisable UI component, return exactly:`,
      invalidComponentMsgMd,
      "...and nothing else.",
      `Here is a list of recognised UI components: ${recognisedComponentsURL}`,

      "",
      "Output format",
      "- Return markdown only (no HTML, no fenced code blocks, no inline styles).",
      "- Use sentence case for all headings.",
      "- Keep bullets short and practical (3–7 items).",
      "- Use UK English and a concise, direct tone.",
      "- Prefer native elements over custom ARIA (for example, an accordion trigger should be a real button with aria-expanded, not a generic element with role=\"button\").",

      "",
      "Sections (use exactly these headings)",
      `## ${component}`,

      "",
      "### Definition",
      "One short sentence describing the component’s purpose.",

      "",
      "### Usage",
      "- When to use / when to avoid.",
      "- Common variants and states relevant to this component.",

      "",
      "### Keyboard and focus",
      "- Typical keyboard interactions (desktop): tab/shift+tab, enter/space, arrow keys as appropriate.",
      "- Expected focus order and focus management (for example, where focus moves on open/close).",
      "- If not interactive, state that no keyboard interactions are required.",
      "- Where relevant, include common mobile screen reader gestures at a high level.",

      "",
      "### WAI-ARIA",
      "- Native first: name the specific native element(s) that satisfy the need (button, details/summary, dialog, input[type=range], select, etc.).",
      "- If native does not cover this component’s interaction/state, add a bulleted list titled \"Required ARIA for custom widgets\" with role/state/property and why (role=tablist/tab/tabpanel; aria-selected; aria-controls; aria-expanded; aria-modal=\\\"true\\\"; aria-valuemin/max/now; aria-checked; aria-activedescendant).",
      "- Reference the matching ARIA Authoring Practices pattern name.",
      "- Never output a generic sentence like \"No additional ARIA is required\". If native is sufficient, explicitly name the native element and say so.",
      "- Do not add ARIA that conflicts with native semantics (e.g., do not add role=\\\"button\\\" to a real button).",

      "",
      "### WCAG 2.2 checklist",
      "Provide a short, testable checklist with criterion IDs and one-line checks, using checkbox bullets. Example format:",
      "- [ ] 2.4.7 Focus visible — Focus indicators are clearly visible on all interactive elements.",
      "- [ ] 1.3.1 Info and relationships — Structure is conveyed programmatically (headings, lists, landmarks, relationships).",

      "",
      "### Links",
      "Only include links from the approved domains in “Link policy” and only when you are certain. If unsure of a deep anchor, link to the collection’s main page and still show the exact criterion number and name.",

      "",
      "Link policy (approved sources only; never invent links)",
      linkPolicyBullets("md"),

      "",
      "Writing tips",
      "- Be specific; avoid vague advice like \"make it accessible\".",
      "- Use consistent, component-appropriate naming (mirror the referenced site if a URL is provided).",
      "- Do not copy proprietary content verbatim; summarise and adapt to accessibility guidance.",

      "",
      "Return only the markdown for the sections above."
    ].join("\n");

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
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
        max_tokens: 1200
      })
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error("OpenAI error:", data);
      return { statusCode: resp.status, body: JSON.stringify({ error: data }) };
    }

    const markdown = (data.choices?.[0]?.message?.content || "").trim();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ markdown })
    };
  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
