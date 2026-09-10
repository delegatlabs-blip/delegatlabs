/** Plain-text strip for Improve request, composePreview, and POST /posts/manual description. */

const DROP_INNER = new Set(["script", "style", "iframe", "object", "svg"]);

function walk(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  if (DROP_INNER.has(tag)) {
    return "";
  }
  if (tag === "br") {
    return "\n";
  }
  let out = "";
  for (const child of Array.from(el.childNodes)) {
    out += walk(child);
  }
  if (tag === "p" || tag === "li") {
    return `${out}\n`;
  }
  return out;
}

export function stripHtmlToPlain(input: string): string {
  if (!input.includes("<")) {
    return input;
  }
  const doc = new DOMParser().parseFromString(input, "text/html");
  return walk(doc.body);
}
