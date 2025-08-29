// Small, synchronous lookups loaded once per cold start

import wcag from "./knowledge/wcag.json" with { type: "json" };
import apg from "./knowledge/apg.json" with { type: "json" };
import hig from "./knowledge/hig.json" with { type: "json" };
import m3 from "./knowledge/m3.json" with { type: "json" };
import mcag from "./knowledge/mcag.json" with { type: "json" };
import synonyms from "./knowledge/synonyms.json" with { type: "json" };

export function normaliseComponent(name = "") {
  const n = String(name || "").trim();
  const key = n.replace(/\s+/g, " ");
  return synonyms[key.toLowerCase()] || (key.charAt(0).toUpperCase() + key.slice(1));
}

export function getWcagList() {
  // Return as array so the model can pick, but only from this set.
  return Object.entries(wcag).map(([id, v]) => ({ id, ...v }));
}

export function getApgFor(component) { return apg[component] || null; }
export function getHigFor(component) { return hig[component] || null; }
export function getM3For(component)  { return m3[component]  || null; }
export function getMcagAnchors()     { return mcag; }

export function approvedLink(url) {
  const allowed = [
    "www.w3.org/WAI/WCAG22/Understanding",
    "www.w3.org/WAI/ARIA/apg",
    "developer.apple.com/design/human-interface-guidelines",
    "m3.material.io/components",
    "getevinced.github.io/mcag",
    "developer.mozilla.org/en-US/docs/Web/Accessibility"
  ];
  return allowed.some(dom => url.includes(dom));
}
