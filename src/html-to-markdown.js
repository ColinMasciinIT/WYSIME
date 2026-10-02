/**
 * WYSIME - What You See Is Markdown Editor
 * Copyright (c) 2026 Colin Timaxian
 * SPDX-License-Identifier: MIT
 */
import { sanitizeHtml } from "./sanitize.js";
import { decodeVisualSource } from "./visuals.js";

function normalizeText(value) {
  return String(value ?? "").replace(/\u00a0/g, " ");
}

function escapeTableCell(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\n+/g, " ").trim();
}

function imageWidth(node) {
  const width = String(node.style?.width || node.getAttribute("width") || "").trim();
  return /^\d{1,4}(?:%|px)$/.test(width) ? width : "";
}

function inlineChildren(node, context) {
  return Array.from(node.childNodes).map((child) => inlineNode(child, context)).join("");
}

function inlineNode(node, context = {}) {
  if (node.nodeType === Node.TEXT_NODE) return normalizeText(node.textContent);
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const tag = node.tagName;
  if (node.getAttribute?.("data-wysime-kind") === "math") {
    const source = decodeVisualSource(node.getAttribute("data-wysime-source") || "");
    return node.getAttribute("data-wysime-display") === "block" ? "$$\n" + source + "\n$$" : "$" + source + "$";
  }
  const content = inlineChildren(node, context);

  if (tag === "STRONG" || tag === "B") return `**${content}**`;
  if (tag === "EM" || tag === "I") return `*${content}*`;
  if (tag === "U") return `<u>${content}</u>`;
  if (tag === "DEL" || tag === "S" || tag === "STRIKE") return `~~${content}~~`;
  if (tag === "SUB") return `<sub>${content}</sub>`;
  if (tag === "SUP") return `<sup>${content}</sup>`;
  if (tag === "CODE" && node.parentElement?.tagName !== "PRE") return `\`${content.replace(/`/g, "\\`")}\``;
  if (tag === "BR") return "  \n";
  if (tag === "A") {
    const href = node.getAttribute("href") || "";
    const title = node.getAttribute("title");
    return href ? `[${content || href}](${href}${title ? ` "${title.replace(/"/g, '\\"')}"` : ""})` : content;
  }
  if (tag === "IMG") {
    const src = node.getAttribute("src") || "";
    const alt = node.getAttribute("alt") || "image";
    const width = imageWidth(node);
    return `![${alt}](${src})${width ? `{width=${width}}` : ""}`;
  }
  if (tag === "INPUT" && node.type === "checkbox") return `[${node.checked ? "x" : " "}] `;
  if (tag === "SPAN" || tag === "SMALL") return content;

  return content;
}

function listItemText(li) {
  return Array.from(li.childNodes)
    .filter((child) => !(child.nodeType === Node.ELEMENT_NODE && ["UL", "OL"].includes(child.tagName)))
    .map((child) => inlineNode(child))
    .join("")
    .replace(/\s+$/g, "")
    .trim();
}

function listToMarkdown(list, level = 0) {
  const ordered = list.tagName === "OL";
  return Array.from(list.children)
    .filter((li) => li.tagName === "LI")
    .map((li, index) => {
      const checkbox = li.querySelector(":scope > input[type='checkbox']");
      const prefix = checkbox ? `- [${checkbox.checked ? "x" : " "}] ` : ordered ? `${index + 1}. ` : "- ";
      let text = listItemText(li);
      if (checkbox) text = text.replace(/^\[[ xX]\]\s*/, "");
      const current = `${"  ".repeat(level)}${prefix}${text || " "}`;
      const nested = Array.from(li.children)
        .filter((child) => ["UL", "OL"].includes(child.tagName))
        .map((child) => listToMarkdown(child, level + 1))
        .filter(Boolean)
        .join("\n");
      return nested ? `${current}\n${nested}` : current;
    })
    .join("\n");
}

function tableToMarkdown(table) {
  const rows = Array.from(table.querySelectorAll("tr"));
  if (!rows.length) return "";
  const firstCells = Array.from(rows[0].children);
  const hasHeaderRow = firstCells.length > 0 && firstCells.every((cell) => cell.tagName === "TH");
  const hasHeaderColumn = rows.slice(1).some((row) => row.children[0]?.tagName === "TH");

  if (!hasHeaderRow || hasHeaderColumn) {
    const clone = table.cloneNode(true);
    clone.classList.remove("wysime-table-active");
    if (!clone.classList.length) clone.removeAttribute("class");
    clone.querySelectorAll("[contenteditable]").forEach((node) => node.removeAttribute("contenteditable"));
    return clone.outerHTML;
  }

  const values = rows.map((row) => Array.from(row.children).map((cell) => escapeTableCell(inlineChildren(cell))));
  const width = values[0].length;
  const header = `| ${values[0].join(" | ")} |`;
  const separator = `| ${Array.from({ length: width }, () => "---").join(" | ")} |`;
  const body = values.slice(1).map((row) => `| ${Array.from({ length: width }, (_, index) => row[index] || "").join(" | ")} |`);
  return [header, separator, ...body].join("\n");
}

function calloutToMarkdown(node) {
  const rawType = node.getAttribute("data-callout") || "info";
  const type = rawType === "success" ? "succes" : rawType === "critical" ? "critique" : rawType;
  const titleNode = node.querySelector(":scope > .wysime-callout-title");
  const bodyNode = node.querySelector(":scope > .wysime-callout-content");
  const title = node.getAttribute("data-title") || titleNode?.textContent?.trim() || "";
  const defaults = {
    info: "Information",
    attention: "Point d’attention",
    warning: "Point d’attention",
    succes: "Résultat attendu",
    success: "Résultat attendu",
    critique: "Critique",
    critical: "Critique",
    danger: "Danger"
  };
  const titleSuffix = title && title !== defaults[rawType] && title !== defaults[type] ? ` ${title}` : "";
  const body = bodyNode ? containerToMarkdown(bodyNode) : "";
  return `:::${type}${titleSuffix}\n${body}\n:::`;
}

function stepsToMarkdown(list) {
  const items = Array.from(list.children).filter((child) => child.tagName === "LI");
  const lines = items.map((li, index) => {
    const content = li.querySelector(":scope > .wysime-step-content") || li;
    const markdown = containerToMarkdown(content).trim();
    const indented = markdown.split("\n").map((line, lineIndex) => lineIndex === 0 ? line : `   ${line}`).join("\n");
    return `${index + 1}. ${indented}`;
  });
  return `:::steps\n${lines.join("\n")}\n:::`;
}

function blockNode(node) {
  if (node.nodeType === Node.TEXT_NODE) return normalizeText(node.textContent).trim();
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const tag = node.tagName;
  const visualKind = node.getAttribute?.("data-wysime-kind");
  if (visualKind === "math") {
    const source = decodeVisualSource(node.getAttribute("data-wysime-source") || "");
    return node.getAttribute("data-wysime-display") === "block" ? "$$\n" + source + "\n$$" : "$" + source + "$";
  }
  if (visualKind === "chart" || visualKind === "mermaid") {
    const source = decodeVisualSource(node.getAttribute("data-wysime-source") || "");
    return "```" + visualKind + "\n" + source + "\n```";
  }
  const align = String(node.style?.textAlign || "").toLowerCase();

  if (/^H[1-4]$/.test(tag)) {
    const content = inlineChildren(node).trim();
    if (["center", "right", "justify"].includes(align)) return `<${tag.toLowerCase()} style="text-align:${align}">${content}</${tag.toLowerCase()}>`;
    return `${"#".repeat(Number(tag[1]))} ${content}`;
  }

  if (tag === "P") {
    const content = inlineChildren(node).trim();
    if (!content) return "";
    if (["center", "right", "justify"].includes(align)) return `<p style="text-align:${align}">${content}</p>`;
    return content;
  }

  if (tag === "UL" || tag === "OL") {
    if (tag === "OL" && node.classList.contains("wysime-steps")) return stepsToMarkdown(node);
    return listToMarkdown(node);
  }

  if (tag === "BLOCKQUOTE") {
    const content = containerToMarkdown(node).trim();
    return content.split("\n").map((line) => `> ${line}`).join("\n");
  }

  if (tag === "PRE") {
    const codeNode = node.querySelector("code");
    const language = Array.from(codeNode?.classList || []).find((item) => item.startsWith("language-"))?.slice(9) || "";
    const code = normalizeText(codeNode?.textContent ?? node.textContent).replace(/\n+$/g, "");
    return `\`\`\`${language}\n${code}\n\`\`\``;
  }

  if (tag === "TABLE") return tableToMarkdown(node);
  if (tag === "ASIDE" && node.classList.contains("wysime-callout")) return calloutToMarkdown(node);

  if (["DIV", "SECTION", "ARTICLE"].includes(tag)) {
    if (node.classList.contains("wysime-callout-title")) return "";
    return containerToMarkdown(node);
  }

  if (["STRONG", "B", "EM", "I", "U", "DEL", "S", "SUB", "SUP", "CODE", "A", "IMG", "SPAN", "SMALL"].includes(tag)) {
    return inlineNode(node);
  }

  return inlineChildren(node).trim();
}

function containerToMarkdown(container) {
  return Array.from(container.childNodes)
    .map(blockNode)
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function htmlToMarkdown(input, options = {}) {
  const raw = typeof input === "string" ? input : input?.innerHTML || "";
  const html = options.sanitize === false ? raw : sanitizeHtml(raw, options.sanitizerOptions);
  const template = document.createElement("template");
  template.innerHTML = html;
  return containerToMarkdown(template.content);
}
