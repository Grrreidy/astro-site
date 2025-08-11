export default async (req, context) => {
  // Read the data sent from your form
  const { component, props = '', tokens = '', url = '' } = await req.json();

  const prompt = `Your prompt text here...`;

  // Call the OpenAI API
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    })
  });

  const json = await resp.json();
  const markdown = json.choices?.[0]?.message?.content ?? '';
  return new Response(JSON.stringify({ markdown }), {
    headers: { 'Content-Type':'application/json' }
  });
};
