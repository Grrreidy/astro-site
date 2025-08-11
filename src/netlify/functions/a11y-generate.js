export default async (req) => {
  try {
    const { component, url } = await req.json();

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
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};
