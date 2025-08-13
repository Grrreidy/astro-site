const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

exports.handler = async (event) => {
  try {
    const { platform = '', component = '' } = JSON.parse(event.body || '{}');

    if (!OPENAI_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing OPENAI_API_KEY environment variable' }) };
    }
    if (!platform || !component) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Platform and component are required' }) };
    }

    const prompt = `
You are writing accessibility documentation for the ${component} on ${platform}.

Return HTML (no <html> or <body>) using only headings, paragraphs, and lists, styled by the site's CSS. Use sentence case for headings.

First heading: Component name (use <h2>)
Subsequent headings (use <h3>)
- One short sentence component definition
- Usage guidance
- Guidelines (e.g., WCAG 2.2 criteria that applies with links to the criteria including the number; for iOS components also include relevant Apple Human Interface Guidelines with links with links to the relevant component page(s) https://developer.apple.com/design/human-interface-guidelines/components; for Android include Material 3 guidance with links to the relevant component page(s) https://m3.material.io/components)
- Checklist
- Keyboard interactions and focus order
- WAI-ARIA
- Which disabilities and impairments could be affected by this component?

Rules:
- UK English. Concise, plain language.
- Link WCAG 2.2 criteria via the Quick Reference where possible.
- If platform is Web: prioritise WCAG 2.2 and ARIA Authoring Practices.
- If platform is iOS: include relevant HIG pages (Apple Human Interface Guidelines).
- If platform is Android: include relevant Material 3 guidance.
- If platform is Design: focus on content design, naming, semantics, states, contrast and error prevention at a system level.
- Keep lists short and practical (3–7 bullets).
- Do NOT include code fences or markdown; output clean HTML only.
- Writing style: similar to GOV.UK Design System components: https://design-system.service.gov.uk/components/

Return only the HTML fragment.
`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });

    const data = await resp.json();
    if (!resp.ok) {
      return { statusCode: resp.status, body: JSON.stringify({ error: data }) };
    }

    const html = (data.choices?.[0]?.message?.content || '').trim();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
