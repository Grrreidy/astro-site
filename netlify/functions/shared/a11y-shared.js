// netlify/functions/shared/a11y-shared.js (CommonJS)

const recognisedComponentsURL = "https://component.gallery/components/";

const approvedSources = [
  { name: "WCAG 2.2 Quick Reference", url: "https://www.w3.org/WAI/WCAG22/quickref/" },
  { name: "Mobile Content Accessibility Guidelines (MCAG)", url: "https://getevinced.github.io/mcag/" },
  { name: "ARIA Authoring Practices (patterns)", url: "https://www.w3.org/WAI/ARIA/apg/patterns/" },
  { name: "Apple Human Interface Guidelines (components)", url: "https://developer.apple.com/design/human-interface-guidelines/components/" },
  { name: "Material 3 components", url: "https://m3.material.io/components" },
  { name: "Atomic A11y", url: "https://www.atomica11y.com/" },
  { name: "WCAG plain-English explanations", url: "https://aaardvarkaccessibility.com/wcag-plain-english/" },
  { name: "MDN Web Docs (accessibility)", url: "https://developer.mozilla.org/en-US/docs/Web/Accessibility" }
];

const invalidComponentMsgHtml =
  '<p>This tool generates accessibility guidance for UI components. Please enter a specific component name (for example, "Button", "Tabs", or "Modal").</p>';

const invalidComponentMsgMd =
  'This tool generates guidance for UI components only. Please enter a specific component name (for example, "Button", "Tabs", or "Modal").';

function linkPolicyBullets(format = "html") {
  const join = (name, url) => (format === "html" ? `${name}: ${url}` : `${name} — ${url}`);
  return approvedSources.map(s => `- ${join(s.name, s.url)}`).join("\n");
}

module.exports = {
  recognisedComponentsURL,
  approvedSources,
  invalidComponentMsgHtml,
  invalidComponentMsgMd,
  linkPolicyBullets
};
