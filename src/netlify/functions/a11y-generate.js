// Netlify Function: a11y-generate
// This expects your OPENAI_API_KEY to be set in Netlify → Site settings → Environment variables

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

exports.handler = async (event) => {
  try {
    // Parse the incoming POST body
    const { component = '', url = '' } = JSON.parse(event.body || '{}');

    // Quick validation
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

    // Build the AI prompt
    const prompt = `
You are writing accessibility documentation for the "${component}" component.
Reference the Storybook page here: ${url}
Return clear MARKDOWN with:
- Usage guidance (semantics, structure, examples)
- Keyboard interactions and focus order
- WCAG 2.2 checklist (with IDs and one-line checks)
- Notes for ACR/VPAT
- Keep it concise, plain English, and specific to the component.
`;

    // Call the OpenAI API
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
      return {
        statusCode: resp.status,
        body: JSON.stringify({ error: data })
      };
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
