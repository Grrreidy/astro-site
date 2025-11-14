// netlify/functions/componenta11y.js
import fs from "fs";
import path from "path";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

async function fetchWithTimeout(resource, options = {}, ms = 40000) {
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
    } catch {
      console.error("Invalid JSON body received");
    }

    const component = typeof body.component === "string" ? body.component.trim().toLowerCase() : "";
    console.log("Incoming component:", component);

    if (!OPENAI_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing OPENAI_API_KEY environment variable" }) };
    }

    if (!component) {
      return { statusCode: 400, body: JSON.stringify({ error: "Enter a component" }) };
    }

    const knowledgePath = path.join(process.cwd(), "netlify/functions/data/a11y-knowledge.json");
    let knowledgeData = {};
    try {
      const raw = fs.readFileSync(knowledgePath, "utf8");
      knowledgeData = JSON.parse(raw);
    } catch (err) {
      console.error("Failed to load RAG data:", err);
    }

    const componentData = knowledgeData[component];

    const ragContext = componentData
      ? `Below is trusted RAG DATA for the "${component}" component.\n${JSON.stringify(componentData, null, 2)}`
      : `No RAG data found for the component "${component}".`;

    const userPrompt = `
Write detailed, cross-platform accessibility documentation for the "${component}" component.

Use the RAG data below as your primary reference set.
${ragContext}

Include:
- A short definition
- WCAG 2.2 AA criteria with URLs
- A list of ARIA roles and states with links to relevant MDN docs. A brief explanation of how ARIA roles and states are used in this component
- Semantic HTML structure
- Notes for web, iOS, Android
- A checklist
- A Sources section including all URLs

Return valid HTML only.
<h2> must contain exactly: ${component}.
`;

    const resp = await fetchWithTimeout(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 3500,
        messages: [
          {
            role: "system",
            content: `
You are an expert accessibility technical writer.
Use only verified accessibility sources AND the RAG data.

Trusted sources include:
- WCAG 2.2
- ARIA Authoring Practices Guide (APG)
- Apple Human Interface Guidelines
- Material 3 Guidelines
- GOV.UK Design System
- WebAIM
- Tetralogical
- Deque
- atomica11y
- Popetech
- Axesslab
- A11y Style Guide
- MDN (developer.mozilla.org) for ARIA roles, states, properties

Never invent content, links, or WCAG numbers.
Always return readable HTML with <pre><code> for code.
`
          },
          { role: "user", content: userPrompt }
        ]
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      return { statusCode: resp.status, body: JSON.stringify({ error: data }) };
    }

    let html = (data.choices?.[0]?.message?.content || "").trim();

    html = html
      .replace(/^```(?:html)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
