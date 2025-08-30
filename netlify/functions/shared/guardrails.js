export function validateHtmlFragment(html, approvedUrlFn) {
  // 1) enforce allowed tags
  const allowed = new Set(["H2","H3","P","UL","OL","LI","A"]);
  if (/<(script|style|iframe|html|body|head|!doctype)/i.test(html)) {
    throw new Error("Only an HTML fragment is allowed.");
  }
  // 2) remove any disallowed tags
  html = html.replace(/<\/?([a-z0-9-]+)\b[^>]*>/gi, (m, tag) => allowed.has(tag.toUpperCase()) ? m : "");

  // 3) verify links
  const bad = [];
  html = html.replace(/<a\s+[^>]*href="([^"]+)"[^>]*>/gi, (m, href) => {
    if (!approvedUrlFn(href)) bad.push(href);
    return m;
  });
  if (bad.length) {
    throw new Error(`Unapproved links found: ${bad.join(", ")}`);
  }
  return html.trim();
}
