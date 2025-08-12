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

    if (!component.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Component field is required' })
      };
    }

    const prompt = `
Give me ONE short, sharp sentence about the accessibility of the "${component}" component.
It should be clever, insightful, and something I could say in a meeting to sound informed.
Keep it under 30 words. Use plain English. Avoid jargon.
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
        temperature: 0.7
      })
    });

    const data = await resp.json();
    if (!resp.ok) {
      return { statusCode: resp.status, body: JSON.stringify({ error: data }) };
    }

    const line = data.choices?.[0]?.message?.content?.trim() ?? '';
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
