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
    const prompt = [
      `You are writing cross-platform accessibility documentation for the "${component}" component.`,
      "Your goal is to generate accurate, standards-based guidance that references credible accessibility sources. The output will help designers and engineers implement this component accessibly across web, iOS, and Android.",

      "Use only information from trusted, authoritative sources:",
      "- WCAG 2.2 (AA level), ARIA Authoring Practices Guide (APG), Apple Human Interface Guidelines (HIG), Material 3, GOV.UK Design System, WebAIM, Retralogical, Deque, atomica11y, popetech, axesslab, A11y Style Guide.",
      "- The following experts may be treated as authoritative: Craig Abbott, Hidde de Vries, Rachele Ditullio, Eric Eggert, Steve Faulkner, Aaron Gustafson, Ian Lloyd (Lloydi), Caroline Jarrett, Manuel Matuzović, Adrian Roselli, Sara Soueidan, Henny Swan, Léonie Watson.",
      "- Do not use or invent any other domains or authors.",

      "",
      "Output requirements:",
      "- Return a single HTML fragment only (no <!doctype>, <html>, <head>, <body>, scripts, or inline styles).",
      "- Allowed elements: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <a>.",
      "- Use UK English, sentence case headings, and a concise GOV.UK-style tone.",
      "- Keep bullets short and practical (3–7 items).",
      "- Do not mention these instructions, the link policy, or any meta notes in the output.",

      "",
      `Recognised UI components: ${recognisedComponentsURL}`,
      "If the input is not a recognisable component, return:",
      invalidComponentMsgHtml,
      "and nothing else.",

      "",
      "Section order and exact headings:",
      `1) <h2>${component}</h2>`,
      "2) <h3>Definition</h3>",
      "   - One sentence describing the component’s purpose.",
      "3) <h3>Usage</h3>",
      "   - When to use, when not to, and common variants and states.",
      "4) <h3>Guidelines</h3>",
      "   - List applicable WCAG 2.2 AA criteria by number and name (e.g. “2.4.7 Focus visible”), with one line explaining what it means for this component.",
      "   - Include a link directly to each criterion cited.",
      "   - Include tested links only; never invent links.",
      "   - For mobile, mention relevant assistive-technology gestures.",
      "5) <h3>ARIA</h3>",
      "   - Summarise relevant ARIA roles, states and properties across platforms.",
      "   - Include examples such as wrapping pagination in <nav aria-label=Pagination>, using <ul> for list structure, <aria-current=page> for active pages, and <aria-disabled=true> for disabled controls.",
      "   - Reference the official ARIA Authoring Practices pattern(s) from https://www.w3.org/WAI/ARIA/apg/patterns/.",
      "   - Summarise Swift or Kotlin accessibility labels where relevant.",
      "6) <h3>Keyboard and focus</h3>",
      "   - Typical keyboard interactions and expected focus order (if not interactive, state that clearly).",
      "7) <h3>Checklist</h3>",
      "   - Actionable items a designer or engineer can verify.",
      "   - Concise, testable statements reflecting Atomic A11y or equivalent criteria.",
      "8) <h2>Platform specifics</h2>",
      "9) <h3>Web</h3>",
      "   - Notes for web implementations, referencing relevant ARIA Authoring Practices pattern(s) and WCAG nuances.",
      "10) <h3>iOS</h3>",
      "   - Notes for iOS with links to relevant Apple Human Interface Guidelines component page(s): https://developer.apple.com/design/human-interface-guidelines/components.",
      "11) <h3>Android</h3>",
      "   - Notes for Android with links to relevant Material 3 component page(s): https://m3.material.io/components. Reference MCAG where mobile-specific considerations apply.",
      "12) <h3>Design</h3>",
      "   - System-level advice on content design, naming, semantics, states, contrast, and error prevention.",
      "13) <h3>Sources</h3>",
      "   - List all referenced sources with working links (only from trusted domains). Sources should be specific to this component, not generic links to WCAG or the HIG.",

      "",
      "Link policy (use only these domains; never invent or alter URLs):",
      linkPolicyBullets("html"),

      "",
      "Style rules:",
      "- Concise and factual, in GOV.UK-style tone.",
      "- No code fences, markdown, or placeholders (e.g. “TBD”).",
      "- Do not include content outside the specified sections and headings.",
      "- Return only the HTML fragment."
    ].join("\n");

    // --- OpenAI request -----------------------------------------------------
    const resp = await fetchWithTimeout(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0, // fully deterministic for factual accuracy
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content:
              "You are an expert accessibility technical writer. Follow instructions exactly and output clean, standards-based HTML only. " +
              "If a detail is uncertain, omit it rather than guessing. Never invent sources, URLs, or WCAG criteria."
          },
          { role: "user", content: prompt }
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
