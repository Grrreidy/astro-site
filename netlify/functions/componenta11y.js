// netlify/functions/componenta11y.js
import {
  recognisedComponentsURL,
  invalidComponentMsgHtml,
  linkPolicyBullets
} from "./shared/a11y-shared.js";

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
    try { body = JSON.parse(event.body || "{}"); } catch {}
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
      "Section order and exact headings",
      `1) <h2>${component}</h2>`,
      "2) <h3>Definition</h3>",
      "   - One sentence describing the component’s purpose.",
      "3) <h3>Usage</h3>",
      "   - When to use, when not to, common variants and states.",
      "4) <h3>Guidelines</h3>",
      "   - List applicable WCAG 2.2 AA criteria by number and name (e.g., \"2.4.7 Focus visible\") with one line on what it means for this component.",
      "   - Link each criterion per Link policy. Only use tested links; never invent links.",
      "5) <h3>Checklist</h3>",
      "   - Actionable items a designer/engineer can verify.",
      "6) <h3>Keyboard and focus</h3>",
      "   - Typical keyboard interactions and expected focus order (if not interactive, state that clearly).",
      "   - For mobile, add common assistive-tech gestures where relevant.",
      "7) <h3>ARIA</h3>",
      "   - Summary of ARIA roles, states and properties relevant to this component across platforms. For example, a pagination component response would include:",
      " - Wrap pagination in a <nav aria-label=Pagination> element to define a navigation region",
      " - Put structure items inside an unordered list <ul>",
      " - Active page includes <aria-current=page> and distinct visual styling",
      " - Disabled Previous or Next links include <aria-disabled=true> and are not focusable",
      " - Provide descriptive labels for arrow controls <aria-label=previous page> and <aria-label=Next page>",
      "   - Reference the matching ARIA Authoring Practices pattern name and link to it. Here is an example URL of the ARIA Authoring Practices pattern: https://www.w3.org/WAI/ARIA/apg/patterns/. Do not invent links",
      "   - Summary of Swift or Kotlin accessibility labels relevant to this component across platforms.",
      "8) <h3>Acceptance criteria</h3>",
      "   - Concise, testable statements (reflect relevant Atomic A11y items where applicable).",
      "9) <h3>Who this helps</h3>",
      "   - Short bullets naming affected groups (e.g., \"People with visual impairments\") with a brief note on how this guidance helps.",

      "10) <h2>Platform specifics</h2>",
      "11) <h3>Web</h3>",
      "   - Notes for web implementations, including relevant ARIA Authoring Practices pattern(s) and any WCAG nuances.",
      "12) <h3>iOS</h3>",
      "   - Notes for iOS with links to the relevant Apple Human Interface Guidelines component page(s). Here is an example URL of a Apple Human Interface Guidelines component: https://developer.apple.com/design/human-interface-guidelines/components. Do not invent links",
      "13) <h3>Android</h3>",
      "   - Notes for Android with links to the relevant Material 3 component page(s); reference MCAG where it adds mobile-specific considerations. Here is an example URL of a Material 3 component: https://m3.material.io/components. Do not invent links",
      "14) <h3>Design</h3>",
      "   - System-level advice on content design, naming, semantics, states, contrast and error prevention. Avoid platform code specifics.",

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
