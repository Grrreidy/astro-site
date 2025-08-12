const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

exports.handler = async (event) => {
  try {
    const { component = '', url = '' } = JSON.parse(event.body || '{}');

    if (!OPENAI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing OPENAI_API_KEY environment variable' })
      };
    }
    if (!component || !url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Both "component" and "url" fields are required' })
      };
    }

    const prompt = `
You are writing accessibility documentation for the "${component}" component.
Reference the Storybook, zeroheight or design system site here: ${url}
Return clear MARKDOWN with:
- Usage guidance
- Keyboard interactions and focus order
- WAI-ARIA
- WCAG 2.2 checklist (with IDs and one-line checks)
Writing tips: Keep it concise and in plain English.
Infer usage guidance, ARIA, foundational styles and vibe from the design system docs
Write in the style of the design system docs referenced in the URL.
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
        temperature: 0.2
      })
    });

    const data = await resp.json();
    if (!resp.ok) {
      return { statusCode: resp.status, body: JSON.stringify({ error: data }) };
    }

    const markdown = data.choices?.[0]?.message?.content ?? '';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err) })
    };
  }
};
