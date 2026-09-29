/**
 * WYSIME - What You See Is Markdown Editor
 * Copyright (c) 2026 Colin Timaxian
 * SPDX-License-Identifier: MIT
 */
import createDOMPurify from "dompurify";

const DOMPurify = typeof createDOMPurify?.sanitize === "function"
  ? createDOMPurify
  : createDOMPurify(globalThis.window ?? globalThis);

const DEFAULT_ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "del", "s", "sub", "sup", "code", "pre",
  "h1", "h2", "h3", "h4", "blockquote", "ul", "ol", "li", "input", "a", "img",
  "table", "thead", "tbody", "tr", "th", "td", "div", "section", "aside", "span", "small"
];

const DEFAULT_ALLOWED_ATTR = [
  "href", "title", "target", "rel", "src", "alt", "class", "style", "type", "checked", "disabled",
  "role", "aria-label", "aria-multiline", "contenteditable", "data-callout", "data-title"
];

export const DEFAULT_SANITIZE_OPTIONS = Object.freeze({
  allowDataImages: true,
  allowBlobImages: true,
  allowRelativeLinks: true,
  allowRelativeImages: true
});

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

export function isAllowedLinkUrl(value, options = {}) {
  const opts = { ...DEFAULT_SANITIZE_OPTIONS, ...options };
  const url = String(value || "").trim();
  if (!url) return false;
  if (/^(https?:|mailto:)/i.test(url)) return true;
  if (opts.allowRelativeLinks && (/^(\/|#|\.\/|\.\.\/)/.test(url) || !/^[a-z][a-z0-9+.-]*:/i.test(url))) return true;
  return false;
}

export function isAllowedImageUrl(value, options = {}) {
  const opts = { ...DEFAULT_SANITIZE_OPTIONS, ...options };
  const url = String(value || "").trim();
  if (!url) return false;
  if (/^https?:/i.test(url)) return true;
  if (opts.allowBlobImages && /^blob:/i.test(url)) return true;
  if (opts.allowDataImages && /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(url)) return true;
  if (opts.allowRelativeImages && (/^(\/|\.\/|\.\.\/)/.test(url) || !/^[a-z][a-z0-9+.-]*:/i.test(url))) return true;
  return false;
}

function sanitizeStyle(element) {
  const style = String(element.getAttribute("style") || "");
  if (!style) return;
  const safe = [];
  const align = style.match(/(?:^|;)\s*text-align\s*:\s*(left|center|right|justify)\s*(?:;|$)/i);
  if (align && ["P", "H1", "H2", "H3", "H4", "LI", "BLOCKQUOTE"].includes(element.tagName)) {
    safe.push(`text-align:${align[1].toLowerCase()}`);
  }
  if (element.tagName === "IMG") {
    const width = style.match(/(?:^|;)\s*width\s*:\s*(\d{1,4})(%|px)\s*(?:;|$)/i);
    if (width) {
      const amount = Number(width[1]);
      if ((width[2] === "%" && amount >= 1 && amount <= 100) || (width[2] === "px" && amount >= 1 && amount <= 4000)) {
        safe.push(`width:${amount}${width[2].toLowerCase()}`);
        safe.push("height:auto");
      }
    }
  }
  if (safe.length) element.setAttribute("style", safe.join(";"));
  else element.removeAttribute("style");
}

function applyPostPolicy(html, options = {}) {
  const template = document.createElement("template");
  template.innerHTML = html;

  template.content.querySelectorAll("a").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (!isAllowedLinkUrl(href, options)) {
      link.removeAttribute("href");
      link.removeAttribute("target");
      link.removeAttribute("rel");
      return;
    }
    if (/^https?:/i.test(href)) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    } else {
      link.removeAttribute("target");
      link.removeAttribute("rel");
    }
  });

  template.content.querySelectorAll("img").forEach((image) => {
    if (!isAllowedImageUrl(image.getAttribute("src") || "", options)) image.remove();
    else sanitizeStyle(image);
  });

  template.content.querySelectorAll("[style]").forEach(sanitizeStyle);
  template.content.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.setAttribute("type", "checkbox");
    checkbox.removeAttribute("name");
    checkbox.removeAttribute("value");
  });

  return template.innerHTML;
}

export function sanitizeHtml(html, options = {}) {
  const purified = DOMPurify.sanitize(String(html || ""), {
    ALLOWED_TAGS: DEFAULT_ALLOWED_TAGS,
    ALLOWED_ATTR: DEFAULT_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true
  });
  return applyPostPolicy(purified, options);
}
