/**
 * WYSIME - What You See Is Markdown Editor
 * Copyright (c) 2026 Colin Timaxian
 * SPDX-License-Identifier: MIT
 */
import "./styles.css";

export { WYSIMEditor } from "./editor.js";
export { markdownToHtml, renderInline, stripFrontMatter } from "./markdown.js";
export { htmlToMarkdown } from "./html-to-markdown.js";
export {
  sanitizeHtml,
  escapeHtml,
  escapeAttribute,
  isAllowedLinkUrl,
  isAllowedImageUrl,
  DEFAULT_SANITIZE_OPTIONS
} from "./sanitize.js";

export async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error || new Error("Unable to read file.")));
    reader.readAsDataURL(file);
  });
}
