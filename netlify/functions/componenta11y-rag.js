import { validateHtmlFragment } from "./shared/guardrails.js";
import {
  recognisedComponentsURL,
  invalidComponentMsgHtml,
  linkPolicyBullets
} from "./shared/a11y-shared.js";
import {
  normaliseComponent, getWcagList, getApgFor,
  getHigFor, getM3For, getMcagAnchors, approvedLink
} from "./shared/knowledge.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

async function openai(payload) {
  const resp = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(JSON.stringify(data));
  return data;
}

export async function handler(event) {
  try {
    const body = JSON.parse(event.body || "{}");
    const input = typeof body.component === "string" ? body.component : "";
    if (!OPENAI_API_KEY) return { statusCode: 500, body: JSON.stringify({ error: "Missing OPENAI_API_KEY environment variable" }) };
    if (!input.trim())   return { statusCode: 400, body: JSON.stringify({ error: "Enter a component" }) };

    const component = normaliseComponent(input);

    // tool schemas
    const tools = [{
      type: "function",
      function: {
        name: "get_canonical_facts",
        description: "Return canonical, pre-approved facts and links for a component. Never invent.",
        parameters: {
          type: "object",
          properties: { component: { type: "string" } },
          required: ["component"]
        }
      }
    }];

    const sys = [
      "You are writing cross-platform accessibility documentation.",
      "You MUST call get_canonical_facts first and only use returned facts/links.",
      "If the input is not a recognisable UI component, return exactly:",
      invalidComponentMsgHtml,
      "Output: a single HTML fragment (no html/head/body), allowed elements: h2,h3,p,ul,ol,li,a.",
      "Use sentence case in headings. Keep bullets short. UK English.",
      "Section order and exact headings:",
      `1) <h2>${component}</h2>`,
      "2) <h3>Definition</h3>",
      "3) <h3>Usage</h3>",
      "4) <h3>Guidelines</h3> (list only WCAG returned by the tool; include id, name, one line)",
      "5) <h3>Checklist</h3>",
      "6) <h3>Keyboard and focus</h3> (align with APG pattern if present)",
      "7) <h3>ARIA</h3> (native-first; link APG pattern from tool)",
      "8) <h3>Acceptance criteria</h3>",
      "9) <h3>Who this helps</h3>",
      "10) <h2>Platform specifics</h2>",
      "11) <h3>Web</h3>",
      "12) <h3>iOS</h3>",
      "13) <h3>Android</h3>",
      "14) <h3>Design</h3>",
      "Link policy (only these domains):",
      linkPolicyBullets("html"),
      "Return only the HTML fragment."
    ].join("\n");

    // first call – model will request tool data
    let messages = [
      { role: "system", content: sys },
      { role: "user", content: `Component: "${component}". Recognised components: ${recognisedComponentsURL}` }
    ];

    const first = await openai({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages,
      tools
    });

    // handle tool call
    const call = first.choices?.[0]?.message?.tool_calls?.[0];
    if (!call || call.function?.name !== "get_canonical_facts") {
      return { statusCode: 500, body: JSON.stringify({ error: "Tool call not made; refusing to proceed without facts." }) };
    }

    const facts = {
      component,
      wcag: getWcagList(),
      apg: getApgFor(component),
      ios_hig: getHigFor(component),
      android_m3: getM3For(component),
      mcag: getMcagAnchors()
    };

    messages.push({
      role: "tool",
      tool_call_id: call.id,
      name: "get_canonical_facts",
      content: JSON.stringify(facts)
    });

    // second call – model writes HTML using only provided facts
    const second = await openai({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 900,
      messages
    });

    let html = (second.choices?.[0]?.message?.content || "").trim();
    html = html.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();

    // validate links and tags
    const safe = validateHtmlFragment(html, approvedLink);

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ html: safe }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err.message || err) }) };
  }
}
