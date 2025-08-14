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
You are writing accessibility documentation for the "${component}" component on "${platform}".

Output requirements
- Return a single HTML fragment only (no <!doctype>, <html>, <head>, <body>, scripts or inline styles).
- Use only <h2>, <h3>, <p>, <ul>, <ol>, <li>.
- Use sentence case for all headings.
- Keep bullets short and practical (3–7 items). UK English.

Section order and exact headings
1) <h2>${component}</h2>
2) <h3>Definition</h3>
   - One-sentence definition of the component’s purpose.
3) <h3>Usage</h3>
   - When to use, when not to, common variants and states.
4) <h3>Guidelines</h3>
   - List the applicable WCAG 2.2 AA criteria by number and name (e.g., “2.4.7 Focus visible”).
   - For each, give one plain-English implication for this component.
   - Include links per “Link policy” below.
5) <h3>Checklist</h3>
   - Actionable Do/Check items a designer/engineer can verify.
6) <h3>Keyboard and focus</h3>
   - Typical keyboard interactions and expected focus order.
   - If not interactive, state that clearly.
7) <h3>ARIA</h3>
   - Only ARIA roles/states/properties that are necessary (prefer native semantics).
   - Include ARIA Authoring Practices links per “Link policy”.
8) <h3>Acceptance criteria</h3>
   - Concise, testable statements. Where AtomicA11y has relevant items, reflect them; if not, write sensible criteria.
9) <h3>Who this helps</h3>
   - Short bullets naming affected groups (e.g., “People with visual impairments”) with one clause on how this guidance helps.

Platform rules
- Web: prioritise WCAG 2.2 and ARIA Authoring Practices patterns.
- iOS: include relevant Apple Human Interface Guidelines component pages.
- Android: include relevant Material 3 component pages.
- Design: focus on content design, naming, semantics, states, contrast, and error prevention at system level; avoid platform code specifics.

Link policy (use only these domains; never invent other sources)
- WCAG 2.2 Quick Reference: https://www.w3.org/WAI/WCAG22/quickref/  (anchor with the criterion id when certain; otherwise link to the Quick Reference home and show the correct number and name)
- ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- Apple HIG components (iOS): https://developer.apple.com/design/human-interface-guidelines/components/
- Material 3 components (Android): https://m3.material.io/components
- Atomic A11y: https://www.atomica11y.com/
- WCAG plain-English explanations: https://aaardvarkaccessibility.com/wcag-plain-english/

Style rules
- Concise, direct, GOV.UK-style tone.
- No code fences, no markdown, no placeholders like “TBD”.
- Do not include content outside the 9 sections above.

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
