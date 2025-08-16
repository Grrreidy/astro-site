const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

exports.handler = async (event) => {
  try {
    const { component = '' } = JSON.parse(event.body || '{}');

    if (!OPENAI_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing OPENAI_API_KEY environment variable' }) };
    }
    if (!component) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Component is required' }) };
    }

    const prompt = `
You are writing cross-platform accessibility documentation for the "${component}" component.

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
   - Applicable WCAG 2.2 AA criteria by number and name (e.g., “2.4.7 Focus visible”) with a one-line implication for this component.
   - Link each criterion per Link policy.
5) <h3>Checklist</h3>
   - Actionable items a designer/engineer can verify.
6) <h3>Keyboard and focus</h3>
   - Typical keyboard interactions and expected focus order (state if not interactive).
7) <h3>ARIA</h3>
   - Only ARIA roles/states/properties that are necessary (prefer native semantics). Include ARIA Authoring Practices links per Link policy.
8) <h3>Acceptance criteria</h3>
   - Concise, testable statements (reflect relevant Atomic A11y items where applicable).
9) <h3>Who this helps</h3>
   - Short bullets naming affected groups (e.g., “People with visual impairments”) with a brief note on how the guidance helps.

10) <h2>Platform specifics</h2>
11) <h3>Web</h3>
   - Notes specific to web implementations, including relevant ARIA Authoring Practices pattern(s) and any extra WCAG nuances.
12) <h3>iOS</h3>
   - Notes specific to iOS with links to the relevant Apple Human Interface Guidelines component page(s).
13) <h3>Android</h3>
   - Notes specific to Android with links to the relevant Material 3 component page(s).
14) <h3>Design</h3>
   - System-level advice on content design, naming, semantics, states, contrast and error prevention. Avoid platform code specifics.

Link policy (use only these domains; never invent other sources)
- WCAG 2.2 Quick Reference: https://www.w3.org/WAI/WCAG22/quickref/  (when a stable deep anchor is known, use it; otherwise link to the Quick Reference home but still show the exact criterion number and name)
- Mobile Content Accessibility Guidelines: https://getevinced.github.io/mcag/
- ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/patterns/
- Apple HIG components (iOS): https://developer.apple.com/design/human-interface-guidelines/components/
- Material 3 components (Android): https://m3.material.io/components
- Atomic A11y: https://www.atomica11y.com/
- WCAG plain-English explanations: https://aaardvarkaccessibility.com/wcag-plain-english/
- MDN docs accessibility: https://developer.mozilla.org/en-US/docs/Web/Accessibility

Style rules
- Concise, direct, GOV.UK-style tone.
- No code fences, no markdown, no placeholders like “TBD”.
- Do not include content outside the sections and headings listed above.

Return only the HTML fragment.

Here is a best practice example for the "Accordion" component:

## Accordion

### Definition and usage
Accordions show and hide related content. 

Usage
* Use accordions to break up long pages into segmented, prioritised sections. 
* Avoid for critical information.

### Guidelines
2.4.7 Focus visible - Ensure focus indicators are visible when navigating.
2.1.1 Keyboard accessible - All functionality must be operable via keyboard.
3.3.2 Labels or instructions - Provide clear labels for each section.
1.4.13 Content on hover or focus - Avoid content that appears only on hover or focus.

### Checklist
* Ensure all sections are keyboard navigable.
* Verify that expanded sections are visually distinct.
* Check for appropriate ARIA roles and properties.
* Confirm that labels are clear and descriptive.
* Test with screen readers for proper announcement of states.

### Keyboard and focus
* Tab to navigate between sections.
* Enter or space to expand panel.
* Shift + Tab to return to previous section.
* Focus should move to the first focusable element within expanded sections.

### ARIA
* Use role="button" for section headers.
* Use aria-expanded to indicate the state of each section.
* Use aria-controls to associate headers with their content.
* Refer to ARIA Authoring Practices for implementation guidance.

### Acceptance criteria

1. Test with keyboard only
* Tab: Visibly moves focus to the next focussable element.
* Shift+Tab: Visibly moves focus to the previous focussable element.
* Spacebar or enter: Expands or collapses the panel. 

2. Test with mobile screenreader gestures
* Swipe: Focus moves to the element
* Doubletap: Expands or collapses the panel. 

3. Test with screen readers
* Name: Clear purpose is announced
* Role: Role is announced
* State: State is announced (expanded/collapsed)


### Who these guidelines helps
* People with visual impairments - clear labels and focus indicators aid navigation.
* People with motor impairments - keyboard accessibility ensures usability.
* People with cognitive disabilities - simplified content management improves understanding.

### Platform specifics

#### Web
* Follow the ARIA Authoring Practices for web implementations.

#### iOS
* Refer to the Apple Human Interface Guidelines for iOS specifics.
* Ensure touch targets are large enough for easy interaction.

#### Android
* Refer to the Material 3 components for Android specifics.

#### Design
* Use clear, descriptive headings for each section.
* Maintain consistent spacing and alignment for visual clarity.
* Ensure sufficient contrast between text and background.
* Prevent errors by confirming actions before expanding sections.

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
