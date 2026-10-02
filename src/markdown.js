/**
 * WYSIME - What You See Is Markdown Editor
 * Copyright (c) 2026 Colin Timaxian
 * SPDX-License-Identifier: MIT
 */
import { escapeHtml, escapeAttribute, sanitizeHtml, isAllowedImageUrl, isAllowedLinkUrl } from "./sanitize.js";
import { createMathPlaceholder, createVisualPlaceholder } from "./visuals.js";

const CALLOUTS = {
  info: { title: "Information", className: "info" },
  attention: { title: "Point d’attention", className: "attention" },
  warning: { title: "Point d’attention", className: "attention" },
  succes: { title: "Résultat attendu", className: "success" },
  success: { title: "Résultat attendu", className: "success" },
  critique: { title: "Critique", className: "critical" },
  critical: { title: "Critique", className: "critical" },
  danger: { title: "Danger", className: "danger" }
};

export function stripFrontMatter(markdown) {
  const source = String(markdown || "").replace(/^\uFEFF/, "");
  if (!source.startsWith("---\n") && !source.startsWith("---\r\n")) return source;
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const end = lines.slice(1).findIndex((line) => line.trim() === "---");
  if (end < 0) return source;
  return lines.slice(end + 2).join("\n").replace(/^\n+/, "");
}

function tokenStore() {
  const values = [];
  return {
    put(html) {
      const token = `\u0000MME${values.length}\u0000`;
      values.push(html);
      return token;
    },
    restore(text) {
      return text.replace(/\u0000MME(\d+)\u0000/g, (_, index) => values[Number(index)] ?? "");
    }
  };
}

function renderControlledInlineHtml(text, tokens, options) {
  let output = text;
  for (const tag of ["u", "sub", "sup"]) {
    const pattern = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "gi");
    output = output.replace(pattern, (_, inner) => tokens.put(`<${tag}>${renderInline(inner, options)}</${tag}>`));
  }
  return output;
}

export function renderInline(value, options = {}) {
  const tokens = tokenStore();
  let text = String(value ?? "");

  text = renderControlledInlineHtml(text, tokens, options);

  if (options.equations !== false) {
    text = text.replace(/(^|[^\\])\$([^$\n]+?)\$/g, (_, prefix, latex) => `${prefix}${tokens.put(createMathPlaceholder(latex.trim(), false))}`);
  }

  text = text.replace(/`([^`\n]+)`/g, (_, code) => tokens.put(`<code>${escapeHtml(code)}</code>`));

  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)(?:\{width=(\d{1,4})(%|px)\})?/g,
    (_, alt, src, _title, width, unit) => {
      if (!isAllowedImageUrl(src, options.sanitizerOptions)) return escapeHtml(`![${alt}](${src})`);
      let style = "";
      if (width && unit) {
        const amount = Number(width);
        if ((unit === "%" && amount >= 1 && amount <= 100) || (unit === "px" && amount >= 1 && amount <= 4000)) {
          style = ` style="width:${amount}${unit};height:auto"`;
        }
      }
      return tokens.put(`<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt || "image")}"${style}>`);
    });

  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, label, href, title) => {
    if (!isAllowedLinkUrl(href, options.sanitizerOptions)) return escapeHtml(`[${label}](${href})`);
    const titleAttr = title ? ` title="${escapeAttribute(title)}"` : "";
    return tokens.put(`<a href="${escapeAttribute(href)}"${titleAttr}>${renderInline(label, options)}</a>`);
  });

  text = escapeHtml(text);
  text = text.replace(/~~([^~\n]+)~~/g, "<del>$1</del>");
  text = text.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__([^_\n]+)__/g, "<strong>$1</strong>");
  text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  text = text.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1<em>$2</em>");
  text = text.replace(/  \n/g, "<br>");

  return tokens.restore(text);
}

function isTableSeparator(line) {
  const trimmed = line.trim();
  if (!/^\|?.+\|?$/.test(trimmed)) return false;
  const cells = trimmed.replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function splitTableRow(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function renderTable(lines, options) {
  const header = splitTableRow(lines[0]);
  const body = lines.slice(2).map(splitTableRow);
  const headHtml = `<thead><tr>${header.map((cell) => `<th>${renderInline(cell, options)}</th>`).join("")}</tr></thead>`;
  const bodyHtml = body.length
    ? `<tbody>${body.map((row) => `<tr>${header.map((_, index) => `<td>${renderInline(row[index] ?? "", options)}</td>`).join("")}</tr>`).join("")}</tbody>`
    : "<tbody></tbody>";
  return `<table>${headHtml}${bodyHtml}</table>`;
}

function parseListLine(line) {
  const match = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
  if (!match) return null;
  const raw = match[3];
  const task = raw.match(/^\[([ xX])\]\s+(.*)$/);
  return {
    indent: match[1].replace(/\t/g, "  ").length,
    ordered: /\d+\./.test(match[2]),
    task: Boolean(task),
    checked: task ? /[xX]/.test(task[1]) : false,
    text: task ? task[2] : raw
  };
}

function renderList(listLines, options) {
  const items = listLines.map(parseListLine).filter(Boolean);
  if (!items.length) return "";

  const renderLevel = (start, indent, ordered) => {
    const tag = ordered ? "ol" : "ul";
    const classes = items.slice(start).some((item) => item.indent === indent && item.task) ? ' class="wysime-task-list"' : "";
    let html = `<${tag}${classes}>`;
    let index = start;
    while (index < items.length) {
      const item = items[index];
      if (item.indent < indent) break;
      if (item.indent > indent) {
        index += 1;
        continue;
      }
      if (item.ordered !== ordered && index !== start) break;
      const taskClass = item.task ? ' class="wysime-task"' : "";
      const checkbox = item.task ? `<input type="checkbox"${item.checked ? " checked" : ""}> ` : "";
      html += `<li${taskClass}>${checkbox}<span>${renderInline(item.text, options)}</span>`;
      const next = items[index + 1];
      if (next && next.indent > indent) {
        const child = renderLevel(index + 1, next.indent, next.ordered);
        html += child.html;
        index = child.next - 1;
      }
      html += "</li>";
      index += 1;
    }
    html += `</${tag}>`;
    return { html, next: index };
  };

  return renderLevel(0, items[0].indent, items[0].ordered).html;
}

function renderSteps(content, options) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const steps = [];
  let current = null;
  for (const line of lines) {
    const match = line.match(/^\s*\d+\.\s+(.*)$/);
    if (match) {
      if (current) steps.push(current.join("\n").trim());
      current = [match[1]];
    } else if (current) {
      current.push(line.replace(/^\s{0,3}/, ""));
    }
  }
  if (current) steps.push(current.join("\n").trim());
  if (!steps.length) return `<div class="wysime-steps">${renderBlocks(content, options)}</div>`;
  return `<ol class="wysime-steps">${steps.map((step) => `<li><div class="wysime-step-content">${renderBlocks(step, options)}</div></li>`).join("")}</ol>`;
}

function renderCallout(type, title, content, options) {
  const definition = CALLOUTS[type.toLowerCase()] || CALLOUTS.info;
  const heading = title?.trim() || definition.title;
  return `<aside class="wysime-callout wysime-callout-${definition.className}" data-callout="${escapeAttribute(type.toLowerCase())}" data-title="${escapeAttribute(heading)}"><div class="wysime-callout-title">${escapeHtml(heading)}</div><div class="wysime-callout-content">${renderBlocks(content, options)}</div></aside>`;
}

function isAlignedHtmlLine(line) {
  return /^<(p|h[1-4])\s+style=["']text-align:(left|center|right|justify);?["']>.*<\/\1>\s*$/i.test(line.trim());
}

function startsBlock(lines, index) {
  const line = lines[index] ?? "";
  const next = lines[index + 1] ?? "";
  if (!line.trim()) return true;
  if (/^```/.test(line.trim())) return true;
  if (/^\$\$\s*$/.test(line.trim())) return true;
  if (/^:::[a-zA-Z]/.test(line.trim())) return true;
  if (/^#{1,4}\s+/.test(line)) return true;
  if (/^>\s?/.test(line)) return true;
  if (parseListLine(line)) return true;
  if (isAlignedHtmlLine(line)) return true;
  if (/^<table(?:\s|>)/i.test(line.trim())) return true;
  if (line.includes("|") && isTableSeparator(next)) return true;
  return false;
}

function renderBlocks(markdown, options = {}) {
  const source = String(markdown || "").replace(/\r\n/g, "\n");
  const lines = source.split("\n");
  const output = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (options.equations !== false && /^\$\$\s*$/.test(line.trim())) {
      const latex = [];
      index += 1;
      while (index < lines.length && !/^\$\$\s*$/.test(lines[index].trim())) {
        latex.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      output.push(createMathPlaceholder(latex.join("\n").trim(), true));
      continue;
    }

    const fence = line.trim().match(/^```([A-Za-z0-9_-]*)\s*$/);
    if (fence) {
      const code = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== "```") {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      const languageName = (fence[1] || "").toLowerCase();
      const source = code.join("\n");
      if (languageName === "chart" && options.charts !== false) {
        output.push(createVisualPlaceholder("chart", source));
      } else if (languageName === "mermaid" && options.diagrams !== false) {
        output.push(createVisualPlaceholder("mermaid", source));
      } else {
        const language = fence[1] ? ` class="language-${escapeAttribute(fence[1])}"` : "";
        output.push(`<pre><code${language}>${escapeHtml(source)}</code></pre>`);
      }
      continue;
    }

    const callout = line.trim().match(/^:::([A-Za-z]+)(?:\s+(.+))?$/);
    if (callout) {
      const type = callout[1];
      const content = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== ":::") {
        content.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      output.push(type.toLowerCase() === "steps"
        ? renderSteps(content.join("\n"), options)
        : renderCallout(type, callout[2], content.join("\n"), options));
      continue;
    }

    if (/^<table(?:\s|>)/i.test(line.trim())) {
      const raw = [line];
      index += 1;
      while (index < lines.length) {
        raw.push(lines[index]);
        const done = /<\/table>\s*$/i.test(lines[index].trim());
        index += 1;
        if (done) break;
      }
      output.push(raw.join("\n"));
      continue;
    }

    if (isAlignedHtmlLine(line)) {
      output.push(line.trim());
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      output.push(`<h${heading[1].length}>${renderInline(heading[2], options)}</h${heading[1].length}>`);
      index += 1;
      continue;
    }

    if (line.includes("|") && isTableSeparator(lines[index + 1] || "")) {
      const tableLines = [line, lines[index + 1]];
      index += 2;
      while (index < lines.length && lines[index].trim() && lines[index].includes("|")) {
        tableLines.push(lines[index]);
        index += 1;
      }
      output.push(renderTable(tableLines, options));
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      output.push(`<blockquote>${quote.map((part) => `<p>${renderInline(part, options)}</p>`).join("")}</blockquote>`);
      continue;
    }

    if (parseListLine(line)) {
      const listLines = [];
      while (index < lines.length && parseListLine(lines[index])) {
        listLines.push(lines[index]);
        index += 1;
      }
      output.push(renderList(listLines, options));
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !startsBlock(lines, index)) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    output.push(`<p>${renderInline(paragraph.join("\n"), options)}</p>`);
  }

  return output.join("\n");
}

export function markdownToHtml(markdown, options = {}) {
  const source = stripFrontMatter(markdown);
  const html = renderBlocks(source, options);
  return options.sanitize === false ? html : sanitizeHtml(html, options.sanitizerOptions);
}
