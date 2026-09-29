/**
 * WYSIME - What You See Is Markdown Editor
 * Copyright (c) 2026 Colin Timaxian
 * SPDX-License-Identifier: MIT
 */
import { icons } from "./icons.js";
import { markdownToHtml } from "./markdown.js";
import { htmlToMarkdown } from "./html-to-markdown.js";
import { sanitizeHtml, escapeHtml, escapeAttribute, isAllowedImageUrl, isAllowedLinkUrl } from "./sanitize.js";
import {
  captureRange,
  restoreRange,
  insertHtmlAtRange,
  toggleInline,
  removeFormatting,
  setBlockType,
  applyAlignment,
  insertList,
  insertTask,
  rangeInside
} from "./dom.js";
import {
  openCodeDialog,
  openTableDialog,
  openLinkDialog,
  openCalloutDialog,
  openStepsDialog,
  openImagePropertiesDialog,
  showErrorDialog
} from "./dialogs.js";
import { getMessages } from "./i18n.js";

const DEFAULT_OPTIONS = Object.freeze({
  images: true,
  uploadImage: null,
  maxImageBytes: 8 * 1024 * 1024,
  acceptedImageTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
  initialValue: "",
  placeholder: "Commencez à écrire…",
  readOnly: false,
  autofocus: false,
  internalLinks: [],
  locale: "fr",
  sanitizeOptions: {},
  onChange: null
});

function resolveElement(target) {
  if (typeof target === "string") return document.querySelector(target);
  return target instanceof Element ? target : null;
}

function toolbarHtml({ images = true, messages = getMessages("fr") } = {}) {
  const t = messages.toolbar;
  return `
    <div class="wysime-toolbar" role="toolbar" aria-label="${escapeAttribute(t.aria)}">
      <select class="wysime-toolbar-select" data-block-style title="${escapeAttribute(t.textStyle)}" aria-label="${escapeAttribute(t.textStyle)}">
        <option value="P">${escapeHtml(t.normal)}</option>
        <option value="H1">${escapeHtml(t.heading1)}</option>
        <option value="H2">${escapeHtml(t.heading2)}</option>
        <option value="H3">${escapeHtml(t.heading3)}</option>
        <option value="H4">${escapeHtml(t.heading4)}</option>
        <option value="BLOCKQUOTE">${escapeHtml(t.quote)}</option>
      </select>

      <button type="button" data-inline="strong" title="${escapeAttribute(t.bold)}" aria-label="${escapeAttribute(t.bold)}"><strong>B</strong></button>
      <button type="button" data-inline="u" title="${escapeAttribute(t.underline)}" aria-label="${escapeAttribute(t.underline)}"><u>U</u></button>
      <button type="button" data-inline="em" title="${escapeAttribute(t.italic)}" aria-label="${escapeAttribute(t.italic)}"><em>I</em></button>

      <details class="wysime-toolbar-menu">
        <summary title="${escapeAttribute(t.moreFormatting)}" aria-label="${escapeAttribute(t.moreFormatting)}">${icons.chevron}</summary>
        <div class="wysime-toolbar-menu-content">
          <button type="button" data-inline="del">${escapeHtml(t.strike)}</button>
          <button type="button" data-inline="sub">${escapeHtml(t.subscript)}</button>
          <button type="button" data-inline="sup">${escapeHtml(t.superscript)}</button>
          <button type="button" data-inline="code">${escapeHtml(t.inlineCode)}</button>
          <button type="button" data-remove-format>${escapeHtml(t.clearFormatting)}</button>
        </div>
      </details>

      <button type="button" data-list="ul" title="${escapeAttribute(t.bulletList)}" aria-label="${escapeAttribute(t.bulletList)}">•</button>
      <button type="button" data-list="ol" title="${escapeAttribute(t.orderedList)}" aria-label="${escapeAttribute(t.orderedList)}">1.</button>
      <button type="button" data-action="task" title="${escapeAttribute(t.task)}" aria-label="${escapeAttribute(t.task)}">□</button>

      <details class="wysime-toolbar-menu">
        <summary title="${escapeAttribute(t.alignment)}" aria-label="${escapeAttribute(t.alignment)}">${icons.align}</summary>
        <div class="wysime-toolbar-menu-content">
          <button type="button" data-align="left">${escapeHtml(t.alignLeft)}</button>
          <button type="button" data-align="center">${escapeHtml(t.alignCenter)}</button>
          <button type="button" data-align="right">${escapeHtml(t.alignRight)}</button>
          <button type="button" data-align="justify">${escapeHtml(t.alignJustify)}</button>
        </div>
      </details>

      <button type="button" data-action="code-block" title="${escapeAttribute(t.codeBlock)}" aria-label="${escapeAttribute(t.codeBlock)}">${icons.code}</button>
      ${images ? `<label class="wysime-upload-button" title="${escapeAttribute(t.image)}" aria-label="${escapeAttribute(t.image)}">${icons.image}<input data-image-input type="file" accept="image/png,image/jpeg,image/gif,image/webp"></label>` : ""}
      <button type="button" data-action="table" title="${escapeAttribute(t.table)}" aria-label="${escapeAttribute(t.table)}">${icons.table}</button>
      <button type="button" data-action="link" title="${escapeAttribute(t.link)}" aria-label="${escapeAttribute(t.link)}">${icons.link}</button>
      <button type="button" data-action="callout" title="${escapeAttribute(t.callout)}" aria-label="${escapeAttribute(t.callout)}">${icons.callout}</button>
      <button type="button" data-action="steps" title="${escapeAttribute(t.steps)}" aria-label="${escapeAttribute(t.steps)}">${icons.steps}</button>

      <button type="button" class="wysime-toolbar-mobile-toggle" data-mobile-toggle title="${escapeAttribute(t.moreTools)}" aria-label="${escapeAttribute(t.moreTools)}" aria-expanded="false">${icons.chevron}</button>
    </div>`;
}

function tableHtml(config, messages = getMessages("fr")) {
  const rows = Array.from({ length: config.rows }, (_, rowIndex) => {
    const cells = Array.from({ length: config.cols }, (_, colIndex) => {
      const header = (config.headerRow && rowIndex === 0) || (config.headerColumn && colIndex === 0);
      const tag = header ? "th" : "td";
      const text = config.headerRow && rowIndex === 0
        ? messages.table.column(colIndex + 1)
        : config.headerColumn && colIndex === 0
          ? messages.table.row(rowIndex + 1)
          : messages.table.cell;
      return `<${tag}>${escapeHtml(text)}</${tag}>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  });
  const head = config.headerRow ? `<thead>${rows.shift()}</thead>` : "";
  return `<table>${head}<tbody>${rows.join("")}</tbody></table>`;
}

function calloutHtml({ type, title, content }, messages = getMessages("fr")) {
  const labels = {
    info: messages.callout.info,
    attention: messages.callout.attention,
    succes: messages.callout.success,
    critique: messages.callout.critical,
    danger: messages.callout.danger
  };
  const normalized = type || "info";
  const renderedTitle = title || labels[normalized] || labels.info;
  const body = markdownToHtml(content || messages.callout.defaultContent, { sanitize: true });
  const cssType = normalized === "succes" ? "success" : normalized === "critique" ? "critical" : normalized;
  return `<aside class="wysime-callout wysime-callout-${cssType}" data-callout="${escapeAttribute(normalized)}" data-title="${escapeAttribute(renderedTitle)}"><div class="wysime-callout-title">${escapeHtml(renderedTitle)}</div><div class="wysime-callout-content">${body}</div></aside>`;
}

function stepsHtml(steps) {
  return `<ol class="wysime-steps">${steps.map((step) => `<li><div class="wysime-step-content"><p>${escapeHtml(step)}</p></div></li>`).join("")}</ol>`;
}

export class WYSIMEditor {
  constructor(target, options = {}) {
    this.target = resolveElement(target);
    if (!this.target) throw new Error("WYSIMEditor: target element not found.");

    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
      acceptedImageTypes: options.acceptedImageTypes || DEFAULT_OPTIONS.acceptedImageTypes,
      sanitizeOptions: { ...DEFAULT_OPTIONS.sanitizeOptions, ...(options.sanitizeOptions || {}) }
    };
    this.messages = getMessages(this.options.locale);
    if (!Object.prototype.hasOwnProperty.call(options, "placeholder")) {
      this.options.placeholder = this.messages.placeholder;
    }
    this.savedRange = null;
    this.tablePopover = null;
    this.activeTable = null;
    this.activeTableCell = null;
    this.syncing = false;
    this.destroyed = false;
    this.abortController = new AbortController();

    this.source = this.target.tagName === "TEXTAREA" ? this.target : null;
    this.mount = this.source ? document.createElement("div") : this.target;
    if (this.source) {
      this.mount.className = "wysime-mount";
      this.source.insertAdjacentElement("afterend", this.mount);
      this.source.classList.add("wysime-source-hidden");
    }

    this.host = document.createElement("div");
    this.host.className = "wysime-shell";
    this.host.innerHTML = `${toolbarHtml({ images: this.options.images, messages: this.messages })}<div class="wysime-editor" contenteditable="${this.options.readOnly ? "false" : "true"}" role="textbox" aria-multiline="true" data-placeholder="${escapeAttribute(this.options.placeholder)}"></div>`;
    this.mount.appendChild(this.host);
    this.toolbar = this.host.querySelector(".wysime-toolbar");
    this.editor = this.host.querySelector(".wysime-editor");

    if (this.options.readOnly) this.host.classList.add("wysime-readonly");

    this.bindEvents();
    const initial = this.source ? this.source.value : this.options.initialValue;
    this.setMarkdown(initial || "", { emit: false });
    if (this.options.autofocus && !this.options.readOnly) this.focus();
  }

  bindEvents() {
    const signal = this.abortController.signal;
    const save = () => this.saveSelection();
    ["keyup", "mouseup", "focus", "input"].forEach((eventName) => {
      this.editor.addEventListener(eventName, save, { signal });
    });

    document.addEventListener("selectionchange", () => {
      const range = captureRange(this.editor);
      if (range) this.savedRange = range;
    }, { signal });

    this.editor.addEventListener("input", () => this.sync(), { signal });
    this.editor.addEventListener("change", () => this.sync(), { signal });

    this.editor.addEventListener("keydown", (event) => this.handleKeydown(event), { signal });
    this.editor.addEventListener("paste", (event) => this.handlePaste(event), { signal });
    this.editor.addEventListener("drop", (event) => this.handleDrop(event), { signal });
    this.editor.addEventListener("dragover", (event) => {
      if (Array.from(event.dataTransfer?.items || []).some((item) => item.kind === "file")) event.preventDefault();
    }, { signal });

    this.editor.addEventListener("dblclick", async (event) => {
      const image = event.target.closest("img");
      if (!image || !this.editor.contains(image) || this.options.readOnly) return;
      const result = await openImagePropertiesDialog(image, { locale: this.options.locale });
      if (!result) return;
      if (/^\d{1,4}(?:%|px)$/.test(result.width)) image.style.cssText = `width:${result.width};height:auto`;
      image.alt = result.alt;
      this.sync();
    }, { signal });

    this.editor.addEventListener("click", (event) => {
      if (this.options.readOnly) return;
      const table = event.target.closest("table");
      if (table && this.editor.contains(table)) {
        const cell = event.target.closest("th,td");
        this.openTableControls(table, cell);
      } else {
        this.closeTableControls();
      }
    }, { signal });

    this.toolbar?.addEventListener("mousedown", (event) => {
      const range = captureRange(this.editor);
      if (range) this.savedRange = range;
      if (event.target.closest("button,summary,label.wysime-upload-button")) event.preventDefault();
    }, { signal });

    document.addEventListener("mousedown", (event) => {
      if (!this.tablePopover || !this.activeTable) return;
      if (this.tablePopover.contains(event.target) || this.activeTable.contains(event.target)) return;
      this.closeTableControls();
    }, { signal });

    window.addEventListener("resize", () => this.positionTableControls(), { signal });
    window.addEventListener("scroll", () => this.positionTableControls(), { signal, capture: true });

    this.toolbar?.addEventListener("click", (event) => this.handleToolbarClick(event), { signal });
    this.toolbar?.querySelector("[data-block-style]")?.addEventListener("change", (event) => {
      const actionRange = this.cloneSavedRange();
      this.restoreSelection(actionRange);
      this.savedRange = setBlockType(this.editor, actionRange, event.target.value || "P");
      this.sync();
    }, { signal });

    this.toolbar?.querySelector("[data-image-input]")?.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        await this.uploadAndInsertImage(file);
      } finally {
        event.target.value = "";
      }
    }, { signal });

    if (this.source) {
      this.source.addEventListener("input", () => {
        if (!this.syncing) this.refresh();
      }, { signal });
    }
  }

  handleKeydown(event) {
    if (this.options.readOnly) return;
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && !event.shiftKey) {
      const shortcuts = { b: "strong", i: "em", u: "u" };
      const tag = shortcuts[event.key.toLowerCase()];
      if (tag) {
        event.preventDefault();
        this.applyInline(tag);
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      const selection = window.getSelection();
      const rawNode = selection?.anchorNode;
      const node = rawNode?.nodeType === Node.ELEMENT_NODE ? rawNode : rawNode?.parentElement;
      const task = node?.closest?.(".wysime-task");
      if (task && this.editor.contains(task)) {
        event.preventDefault();
        const list = task.closest("ul,ol") || task;
        const paragraph = document.createElement("p");
        paragraph.appendChild(document.createElement("br"));
        list.insertAdjacentElement("afterend", paragraph);
        const range = rangeInside(paragraph);
        restoreRange(this.editor, range);
        this.savedRange = range.cloneRange();
        this.sync();
      }
    }
  }

  handlePaste(event) {
    if (this.options.readOnly) return;
    event.preventDefault();
    this.saveSelection();
    const html = event.clipboardData?.getData("text/html");
    const text = event.clipboardData?.getData("text/plain") || "";
    const content = html
      ? sanitizeHtml(html, this.options.sanitizeOptions)
      : escapeHtml(text).replace(/\r?\n/g, "<br>");
    this.insertHtml(content);
  }

  async handleDrop(event) {
    if (this.options.readOnly || !this.options.images) return;
    const file = Array.from(event.dataTransfer?.files || []).find((item) => item.type.startsWith("image/"));
    if (!file) return;
    event.preventDefault();
    const range = document.caretRangeFromPoint?.(event.clientX, event.clientY);
    if (range && this.editor.contains(range.commonAncestorContainer)) this.savedRange = range.cloneRange();
    await this.uploadAndInsertImage(file);
  }

  async handleToolbarClick(event) {
    if (this.options.readOnly) return;
    const actionRange = this.cloneSavedRange();
    const mobile = event.target.closest("[data-mobile-toggle]");
    if (mobile) {
      const expanded = this.toolbar.classList.toggle("wysime-toolbar-expanded");
      mobile.setAttribute("aria-expanded", String(expanded));
      return;
    }

    const inline = event.target.closest("[data-inline]");
    if (inline) {
      this.applyInline(inline.dataset.inline, actionRange);
      return;
    }

    if (event.target.closest("[data-remove-format]")) {
      this.restoreSelection(actionRange);
      this.savedRange = removeFormatting(this.editor, actionRange);
      this.sync();
      return;
    }

    const list = event.target.closest("[data-list]");
    if (list) {
      this.restoreSelection(actionRange);
      this.savedRange = insertList(this.editor, actionRange, list.dataset.list === "ol", this.messages.placeholders.listItem);
      this.sync();
      return;
    }

    const align = event.target.closest("[data-align]");
    if (align) {
      this.restoreSelection(actionRange);
      this.savedRange = applyAlignment(this.editor, actionRange, align.dataset.align);
      this.sync();
      return;
    }

    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    await this.runAction(action, actionRange);
  }

  applyInline(tag, range = this.cloneSavedRange()) {
    const actionRange = range?.cloneRange?.() || range;
    this.restoreSelection(actionRange);
    const placeholder = tag === "code" ? this.messages.placeholders.code : this.messages.placeholders.text;
    this.savedRange = toggleInline(this.editor, actionRange, tag, placeholder);
    this.saveSelection();
    this.sync();
  }

  async runAction(action, range = this.cloneSavedRange()) {
    const actionRange = range?.cloneRange?.() || range;
    const selection = actionRange?.toString() || "";

    if (action === "task") {
      this.savedRange = insertTask(this.editor, actionRange, selection || this.messages.placeholders.task);
      this.sync();
      return;
    }

    if (action === "link") {
      const resolver = this.options.linkDialog || openLinkDialog;
      const link = await resolver(selection, { internalLinks: this.options.internalLinks, locale: this.options.locale });
      if (!link?.href || !isAllowedLinkUrl(link.href, this.options.sanitizeOptions)) return;
      const title = link.title ? ` title="${escapeAttribute(link.title)}"` : "";
      this.insertHtml(`<a href="${escapeAttribute(link.href)}"${title}>${escapeHtml(link.label || link.href)}</a>`, actionRange);
      return;
    }

    if (action === "table") {
      const config = await (this.options.tableDialog || openTableDialog)({ locale: this.options.locale });
      if (config) this.insertHtml(tableHtml(config, this.messages), actionRange);
      return;
    }

    if (action === "code-block") {
      const result = await (this.options.codeDialog || openCodeDialog)(selection, { locale: this.options.locale });
      if (!result) return;
      const language = /^[A-Za-z0-9_-]+$/.test(result.language || "") ? result.language : "";
      this.insertHtml(`<pre><code${language ? ` class="language-${language}"` : ""}>${escapeHtml(result.code || "")}</code></pre>`, actionRange);
      return;
    }

    if (action === "callout") {
      const result = await (this.options.calloutDialog || openCalloutDialog)(selection, { locale: this.options.locale });
      if (result) this.insertHtml(calloutHtml(result, this.messages), actionRange);
      return;
    }

    if (action === "steps") {
      const result = await (this.options.stepsDialog || openStepsDialog)(selection, { locale: this.options.locale });
      if (result?.length) this.insertHtml(stepsHtml(result), actionRange);
    }
  }

  async uploadAndInsertImage(file) {
    try {
      this.validateImage(file);
      if (typeof this.options.uploadImage !== "function") {
        throw new Error(this.messages.image.uploadMissing);
      }
      const result = await this.options.uploadImage(file, this);
      const normalized = typeof result === "string" ? { url: result, alt: file.name } : result;
      if (!normalized?.url || !isAllowedImageUrl(normalized.url, this.options.sanitizeOptions)) {
        throw new Error(this.messages.image.uploadInvalidUrl);
      }
      const alt = normalized.alt || normalized.filename || file.name || this.messages.image.defaultAlt;
      const width = /^\d{1,4}(?:%|px)$/.test(normalized.width || "") ? normalized.width : "60%";
      this.insertHtml(`<img src="${escapeAttribute(normalized.url)}" alt="${escapeAttribute(alt)}" style="width:${width};height:auto">`);
      return normalized;
    } catch (error) {
      const size = Math.round(this.options.maxImageBytes / 1024 / 1024);
      await showErrorDialog(error.message || this.messages.image.uploadFailed, {
        title: this.messages.image.uploadDialogTitle,
        details: this.messages.image.details(size),
        locale: this.options.locale
      });
      return null;
    }
  }

  validateImage(file) {
    if (!file) throw new Error(this.messages.image.noFile);
    if (!this.options.acceptedImageTypes.includes(file.type)) {
      throw new Error(this.messages.image.unsupported);
    }
    if (file.size > this.options.maxImageBytes) {
      throw new Error(this.messages.image.tooLarge(Math.round(this.options.maxImageBytes / 1024 / 1024)));
    }
  }

  insertHtml(html, range = this.cloneSavedRange()) {
    const safe = sanitizeHtml(html, this.options.sanitizeOptions);
    const actionRange = range?.cloneRange?.() || range;
    this.restoreSelection(actionRange);
    this.savedRange = insertHtmlAtRange(this.editor, safe, actionRange);
    this.saveSelection();
    this.sync();
    return this;
  }

  insertMarkdown(markdown) {
    return this.insertHtml(markdownToHtml(markdown, { sanitizerOptions: this.options.sanitizeOptions }));
  }

  saveSelection() {
    const range = captureRange(this.editor);
    if (range) this.savedRange = range;
    return this.savedRange;
  }

  cloneSavedRange() {
    return this.savedRange?.cloneRange?.() || null;
  }

  restoreSelection(range = this.savedRange) {
    return restoreRange(this.editor, range);
  }

  getTableHeaderModes(table) {
    const rows = Array.from(table.rows || []);
    if (!rows.length) return { headerRow: false, headerColumn: false };
    const headerRow = Array.from(rows[0].cells || []).length > 0
      && Array.from(rows[0].cells || []).every((cell) => cell.tagName === "TH");
    const bodyRows = rows.slice(headerRow ? 1 : 0);
    const headerColumn = bodyRows.length > 0
      && bodyRows.every((row) => row.cells[0]?.tagName === "TH");
    return { headerRow, headerColumn };
  }

  replaceTableCellTag(cell, tagName) {
    if (!cell || cell.tagName === tagName) return cell;
    const replacement = document.createElement(tagName.toLowerCase());
    for (const attribute of Array.from(cell.attributes)) replacement.setAttribute(attribute.name, attribute.value);
    while (cell.firstChild) replacement.appendChild(cell.firstChild);
    cell.replaceWith(replacement);
    return replacement;
  }

  applyTableHeaderModes(table, { headerRow = false, headerColumn = false } = {}) {
    const rows = Array.from(table.rows || []);
    if (!rows.length) return;

    let body = table.tBodies[0];
    if (!body) body = table.createTBody();

    let head = table.tHead;
    if (headerRow && !head) head = table.createTHead();

    rows.forEach((row, rowIndex) => {
      if (headerRow && rowIndex === 0) head.appendChild(row);
      else body.appendChild(row);

      Array.from(row.cells || []).forEach((cell, columnIndex) => {
        const shouldBeHeader = (headerRow && rowIndex === 0) || (headerColumn && columnIndex === 0);
        this.replaceTableCellTag(cell, shouldBeHeader ? "TH" : "TD");
      });
    });

    if (!headerRow && table.tHead) table.tHead.remove();
    Array.from(table.tBodies).slice(1).forEach((extraBody) => {
      while (extraBody.firstChild) body.appendChild(extraBody.firstChild);
      extraBody.remove();
    });
  }

  tableCellPosition(table, cell) {
    const rows = Array.from(table.rows || []);
    const row = cell?.closest?.("tr") || rows[0] || null;
    const rowIndex = Math.max(0, rows.indexOf(row));
    const columnIndex = Math.max(0, Array.from(row?.cells || []).indexOf(cell));
    return { row, rowIndex, columnIndex };
  }

  addTableRow(table, cell) {
    const rows = Array.from(table.rows || []);
    if (!rows.length) return;
    const modes = this.getTableHeaderModes(table);
    const { row, rowIndex } = this.tableCellPosition(table, cell);
    const columnCount = Math.max(...rows.map((item) => item.cells.length), 1);
    const newRow = document.createElement("tr");
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const tag = modes.headerColumn && columnIndex === 0 ? "th" : "td";
      const newCell = document.createElement(tag);
      newCell.textContent = "";
      newRow.appendChild(newCell);
    }

    const nextRow = rows[rowIndex + 1];
    if (nextRow) nextRow.parentNode.insertBefore(newRow, nextRow);
    else (table.tBodies[0] || table.createTBody()).appendChild(newRow);
    this.applyTableHeaderModes(table, modes);
    this.activeTableCell = newRow.cells[Math.min(this.tableCellPosition(table, cell).columnIndex, newRow.cells.length - 1)] || newRow.cells[0];
  }

  removeTableRow(table, cell) {
    const rows = Array.from(table.rows || []);
    if (rows.length <= 1) return;
    const modes = this.getTableHeaderModes(table);
    const { row, rowIndex, columnIndex } = this.tableCellPosition(table, cell);
    row?.remove();
    this.applyTableHeaderModes(table, modes);
    const remainingRows = Array.from(table.rows || []);
    const nextRow = remainingRows[Math.min(rowIndex, remainingRows.length - 1)];
    this.activeTableCell = nextRow?.cells[Math.min(columnIndex, Math.max(0, nextRow.cells.length - 1))] || null;
  }

  addTableColumn(table, cell) {
    const rows = Array.from(table.rows || []);
    if (!rows.length) return;
    const modes = this.getTableHeaderModes(table);
    const { columnIndex } = this.tableCellPosition(table, cell);
    rows.forEach((row, rowIndex) => {
      const insertionIndex = Math.min(columnIndex + 1, row.cells.length);
      const shouldBeHeader = (modes.headerRow && rowIndex === 0) || (modes.headerColumn && insertionIndex === 0);
      const newCell = document.createElement(shouldBeHeader ? "th" : "td");
      newCell.textContent = "";
      const reference = row.cells[insertionIndex] || null;
      row.insertBefore(newCell, reference);
    });
    this.applyTableHeaderModes(table, modes);
    const activeRow = this.activeTableCell?.closest("tr") || rows[0];
    this.activeTableCell = activeRow?.cells[Math.min(columnIndex + 1, activeRow.cells.length - 1)] || null;
  }

  removeTableColumn(table, cell) {
    const rows = Array.from(table.rows || []);
    if (!rows.length) return;
    const maxColumns = Math.max(...rows.map((row) => row.cells.length), 0);
    if (maxColumns <= 1) return;
    const modes = this.getTableHeaderModes(table);
    const { columnIndex } = this.tableCellPosition(table, cell);
    rows.forEach((row) => row.cells[columnIndex]?.remove());
    this.applyTableHeaderModes(table, modes);
    const activeRow = this.activeTableCell?.closest("tr") || table.rows[0];
    this.activeTableCell = activeRow?.cells[Math.min(columnIndex, Math.max(0, activeRow.cells.length - 1))] || null;
  }

  openTableControls(table, cell = null) {
    if (!table || this.options.readOnly) return;
    this.closeTableControls();
    this.activeTable = table;
    this.activeTableCell = cell || table.querySelector("th,td");
    const messages = this.messages.table;
    const common = this.messages.common;
    const modes = this.getTableHeaderModes(table);

    const popover = document.createElement("div");
    popover.className = "wysime-table-popover";
    popover.setAttribute("role", "dialog");
    popover.setAttribute("aria-label", messages.actions);
    popover.innerHTML = `
      <div class="wysime-table-popover-actions">
        <button type="button" data-table-action="add-row" title="${escapeAttribute(messages.addRow)}">+R</button>
        <button type="button" data-table-action="remove-row" title="${escapeAttribute(messages.removeRow)}">−R</button>
        <button type="button" data-table-action="add-column" title="${escapeAttribute(messages.addColumn)}">+C</button>
        <button type="button" data-table-action="remove-column" title="${escapeAttribute(messages.removeColumn)}">−C</button>
        <button type="button" data-table-action="edit" title="${escapeAttribute(messages.edit)}">✎</button>
        <button type="button" class="wysime-table-delete" data-table-action="delete" title="${escapeAttribute(messages.deleteTable)}">×</button>
      </div>
      <div class="wysime-table-popover-edit wysime-hidden" data-table-edit-panel>
        <strong>${escapeHtml(messages.editTitle)}</strong>
        <label class="wysime-check"><input type="checkbox" data-table-header-row${modes.headerRow ? " checked" : ""}> ${escapeHtml(messages.headerRow)}</label>
        <label class="wysime-check"><input type="checkbox" data-table-header-column${modes.headerColumn ? " checked" : ""}> ${escapeHtml(messages.headerColumn)}</label>
        <button type="button" class="wysime-button wysime-button-primary" data-table-action="apply-options">${escapeHtml(common.apply)}</button>
      </div>`;

    popover.addEventListener("mousedown", (event) => {
      if (event.target.closest("button")) event.preventDefault();
    });
    popover.addEventListener("click", (event) => {
      const action = event.target.closest("[data-table-action]")?.dataset.tableAction;
      if (!action || !this.activeTable) return;
      if (action === "add-row") this.addTableRow(this.activeTable, this.activeTableCell);
      if (action === "remove-row") this.removeTableRow(this.activeTable, this.activeTableCell);
      if (action === "add-column") this.addTableColumn(this.activeTable, this.activeTableCell);
      if (action === "remove-column") this.removeTableColumn(this.activeTable, this.activeTableCell);
      if (action === "edit") popover.querySelector("[data-table-edit-panel]")?.classList.toggle("wysime-hidden");
      if (action === "apply-options") {
        this.applyTableHeaderModes(this.activeTable, {
          headerRow: popover.querySelector("[data-table-header-row]").checked,
          headerColumn: popover.querySelector("[data-table-header-column]").checked
        });
        popover.querySelector("[data-table-edit-panel]")?.classList.add("wysime-hidden");
      }
      if (action === "delete") {
        const deleted = this.activeTable;
        this.closeTableControls();
        deleted.remove();
        this.sync();
        return;
      }
      this.sync();
      this.positionTableControls();
    });

    document.body.appendChild(popover);
    this.tablePopover = popover;
    table.classList.add("wysime-table-active");
    this.positionTableControls();
  }

  positionTableControls() {
    if (!this.tablePopover || !this.activeTable?.isConnected) return;
    const rect = this.activeTable.getBoundingClientRect();
    const popoverRect = this.tablePopover.getBoundingClientRect();
    const margin = 8;
    const maxLeft = Math.max(margin, window.innerWidth - popoverRect.width - margin);
    const left = Math.min(Math.max(rect.left, margin), maxLeft);
    const preferredTop = rect.bottom + margin;
    const top = preferredTop + popoverRect.height <= window.innerHeight - margin
      ? preferredTop
      : Math.max(margin, rect.top - popoverRect.height - margin);
    this.tablePopover.style.left = `${Math.round(left)}px`;
    this.tablePopover.style.top = `${Math.round(top)}px`;
  }

  closeTableControls() {
    this.activeTable?.classList.remove("wysime-table-active");
    this.tablePopover?.remove();
    this.tablePopover = null;
    this.activeTable = null;
    this.activeTableCell = null;
  }

  refresh() {
    if (this.destroyed || this.syncing) return this;
    this.closeTableControls();
    const markdown = this.source ? this.source.value : this._value || "";
    this.editor.innerHTML = markdownToHtml(markdown, { sanitizerOptions: this.options.sanitizeOptions }) || "<p><br></p>";
    this.editor.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => checkbox.removeAttribute("disabled"));
    return this;
  }

  sync({ emit = true } = {}) {
    if (this.destroyed) return "";
    const markdown = htmlToMarkdown(this.editor, { sanitizerOptions: this.options.sanitizeOptions });
    this.syncing = true;
    this._value = markdown;
    if (this.source) {
      this.source.value = markdown;
      if (emit) this.source.dispatchEvent(new Event("input", { bubbles: true }));
    }
    this.syncing = false;

    if (emit) {
      if (typeof this.options.onChange === "function") this.options.onChange(markdown, this);
      this.host.dispatchEvent(new CustomEvent("wysime:change", { bubbles: true, detail: { markdown, editor: this } }));
    }
    return markdown;
  }

  getMarkdown() {
    return this.sync({ emit: false });
  }

  setMarkdown(markdown, { emit = true } = {}) {
    this.closeTableControls();
    const value = String(markdown ?? "");
    this._value = value;
    if (this.source) this.source.value = value;
    this.editor.innerHTML = markdownToHtml(value, { sanitizerOptions: this.options.sanitizeOptions }) || "<p><br></p>";
    this.editor.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => checkbox.removeAttribute("disabled"));
    if (emit) this.sync({ emit: true });
    return this;
  }

  getHtml() {
    return sanitizeHtml(this.editor.innerHTML, this.options.sanitizeOptions);
  }

  focus() {
    this.editor.focus();
    if (!this.savedRange) {
      const range = document.createRange();
      range.selectNodeContents(this.editor);
      range.collapse(false);
      this.savedRange = range;
      restoreRange(this.editor, range);
    }
    return this;
  }

  setReadOnly(readOnly = true) {
    this.options.readOnly = Boolean(readOnly);
    this.editor.contentEditable = this.options.readOnly ? "false" : "true";
    this.host.classList.toggle("wysime-readonly", this.options.readOnly);
    return this;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.closeTableControls();
    this.abortController.abort();
    this.host.remove();
    if (this.source) {
      this.source.classList.remove("wysime-source-hidden");
      this.mount.remove();
    }
  }
}
