const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

exports.handler = async (event) => {
  try {
    const { component = '' } = JSON.parse(event.body || '{}');

    if (!OPENAI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing OPENAI_API_KEY environment variable' })
      };
    }

    if (!component) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Component field is required' })
      };
    }

    const prompt = `
Give me TWO short, sharp sentences about the accessibility of the "${component}" component.
It should be clever, insightful, and something I could say in a meeting to sound like an advanced and knowledgable accessibility expert.
Reference specific numbered WCAG criteria. Use plain English. Avoid jargon. Be specific and insightful, not just a generic comment that everyone knows.
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
        temperature: 0.5
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      return { statusCode: resp.status, body: JSON.stringify({ error: data }) };
    }

    const line = data.choices?.[0]?.message?.content ?? '';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err) })
    };
  }
};
