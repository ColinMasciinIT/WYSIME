/**
 * WYSIME - What You See Is Markdown Editor
 * Copyright (c) 2026 Colin Timaxian
 * SPDX-License-Identifier: MIT
 */
import { escapeHtml, escapeAttribute } from "./sanitize.js";
import { getMessages } from "./i18n.js";

function openNativeDialog(dialog) {
  document.body.appendChild(dialog);
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function closeNativeDialog(dialog) {
  if (typeof dialog.close === "function" && dialog.open) dialog.close();
  dialog.remove();
}

export function openDialog({ title, body, confirmLabel = "Insert", cancelLabel = "Cancel", className = "", onMount = null, locale = "fr" }) {
  const messages = getMessages(locale);
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = `wysime-dialog ${className}`.trim();
    dialog.setAttribute("aria-labelledby", `wysime-dialog-title-${Date.now()}`);
    dialog.innerHTML = `
      <form method="dialog" class="wysime-dialog-card">
        <div class="wysime-dialog-header">
          <h2 id="${dialog.getAttribute("aria-labelledby")}">${escapeHtml(title)}</h2>
          <button type="button" class="wysime-dialog-close" aria-label="${escapeAttribute(messages.common.close)}">&times;</button>
        </div>
        <div class="wysime-dialog-body">${body}</div>
        <div class="wysime-dialog-actions">
          ${cancelLabel ? `<button type="button" class="wysime-button wysime-button-secondary" data-cancel>${escapeHtml(cancelLabel)}</button>` : ""}
          ${confirmLabel ? `<button type="button" class="wysime-button wysime-button-primary" data-confirm>${escapeHtml(confirmLabel)}</button>` : ""}
        </div>
      </form>`;

    const finish = (value) => {
      closeNativeDialog(dialog);
      resolve(value);
    };

    dialog.querySelector(".wysime-dialog-close").addEventListener("click", () => finish(null));
    dialog.querySelector("[data-cancel]")?.addEventListener("click", () => finish(null));
    dialog.querySelector("[data-confirm]")?.addEventListener("click", () => finish(dialog));
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      finish(null);
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) finish(null);
    });

    openNativeDialog(dialog);
    if (typeof onMount === "function") onMount(dialog);
    queueMicrotask(() => dialog.querySelector("input,select,textarea,button")?.focus());
  });
}

export async function openMarkdownPreviewDialog(markdown = "", { locale = "fr" } = {}) {
  const messages = getMessages(locale);
  await openDialog({
    title: messages.markdownPreview.title,
    confirmLabel: messages.common.close,
    cancelLabel: null,
    className: "wysime-markdown-dialog",
    locale,
    body: `
      <div class="wysime-markdown-preview-wrap">
        <p class="wysime-dialog-help">${escapeHtml(messages.markdownPreview.help)}</p>
        <textarea class="wysime-markdown-preview" data-markdown-preview readonly spellcheck="false" aria-label="${escapeAttribute(messages.markdownPreview.aria)}">${escapeHtml(markdown)}</textarea>
      </div>`,
    onMount(dialog) {
      const preview = dialog.querySelector("[data-markdown-preview]");
      if (preview) {
        preview.focus();
        preview.setSelectionRange(0, 0);
      }
    }
  });
}

export async function showErrorDialog(message, { title = "", details = "", locale = "fr" } = {}) {
  const messages = getMessages(locale);
  await openDialog({
    title: title || messages.error.title,
    body: `<div class="wysime-error"><strong>${escapeHtml(message)}</strong>${details ? `<p>${escapeHtml(details)}</p>` : ""}</div>`,
    confirmLabel: messages.common.understood,
    cancelLabel: messages.common.close,
    locale
  });
}

export async function openCodeDialog(selection = "", { locale = "fr" } = {}) {
  const messages = getMessages(locale);
  const dialog = await openDialog({
    title: messages.code.title,
    confirmLabel: messages.common.insert,
    cancelLabel: messages.common.cancel,
    locale,
    body: `
      <div class="wysime-form-grid">
        <label>${escapeHtml(messages.code.language)}
          <select data-language>
            <option value="">${escapeHtml(messages.code.text)}</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="powershell">PowerShell</option>
            <option value="bash">Bash</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="sql">SQL</option>
            <option value="json">JSON</option>
            <option value="yaml">YAML</option>
          </select>
        </label>
        <label class="wysime-field-wide">${escapeHtml(messages.code.code)}
          <textarea data-code rows="10" placeholder="${escapeAttribute(messages.code.placeholder)}">${escapeHtml(selection)}</textarea>
        </label>
      </div>`
  });
  if (!dialog) return null;
  return {
    language: dialog.querySelector("[data-language]").value,
    code: dialog.querySelector("[data-code]").value
  };
}

export async function openTableDialog({ locale = "fr" } = {}) {
  const messages = getMessages(locale);
  const dialog = await openDialog({
    title: messages.table.insertTitle,
    confirmLabel: messages.common.insert,
    cancelLabel: messages.common.cancel,
    locale,
    body: `
      <div class="wysime-form-grid">
        <label>${escapeHtml(messages.table.rows)}<input data-rows type="number" min="1" max="50" value="3"></label>
        <label>${escapeHtml(messages.table.columns)}<input data-cols type="number" min="1" max="20" value="3"></label>
        <label class="wysime-check"><input data-header-row type="checkbox" checked> ${escapeHtml(messages.table.headerRow)}</label>
        <label class="wysime-check"><input data-header-col type="checkbox"> ${escapeHtml(messages.table.headerColumn)}</label>
      </div>`
  });
  if (!dialog) return null;
  return {
    rows: Math.max(1, Math.min(50, Number(dialog.querySelector("[data-rows]").value) || 3)),
    cols: Math.max(1, Math.min(20, Number(dialog.querySelector("[data-cols]").value) || 3)),
    headerRow: dialog.querySelector("[data-header-row]").checked,
    headerColumn: dialog.querySelector("[data-header-col]").checked
  };
}

export async function openLinkDialog(selection = "", options = {}) {
  const locale = options.locale || "fr";
  const messages = getMessages(locale);
  const internalLinks = Array.isArray(options.internalLinks) ? options.internalLinks : [];
  const internalOptions = internalLinks
    .map((item) => `<option value="${escapeAttribute(item.href || "")}">${escapeHtml(item.label || item.href || messages.link.defaultLabel)}</option>`)
    .join("");
  const hasInternal = Boolean(internalOptions);

  const dialog = await openDialog({
    title: messages.link.title,
    confirmLabel: messages.common.insert,
    cancelLabel: messages.common.cancel,
    locale,
    body: `
      <div class="wysime-form-grid">
        <label>${escapeHtml(messages.link.type)}
          <select data-link-type>
            <option value="external">${escapeHtml(messages.link.external)}</option>
            ${hasInternal ? `<option value="internal">${escapeHtml(messages.link.internal)}</option>` : ""}
          </select>
        </label>
        <label class="wysime-field-wide" data-external>URL<input data-url type="text" placeholder="https://"></label>
        ${hasInternal ? `<label class="wysime-field-wide wysime-hidden" data-internal>${escapeHtml(messages.link.internal)}<select data-internal-select>${internalOptions}</select></label>` : ""}
        <label class="wysime-field-wide">${escapeHtml(messages.link.displayText)}<input data-label type="text" value="${escapeAttribute(selection || messages.link.defaultLabel)}"></label>
        <label class="wysime-field-wide">${escapeHtml(messages.link.tooltip)}<input data-title type="text" placeholder="${escapeAttribute(messages.link.tooltipPlaceholder)}"></label>
      </div>`,
    onMount(currentDialog) {
      const typeSelect = currentDialog.querySelector("[data-link-type]");
      const update = () => {
        currentDialog.querySelector("[data-external]")?.classList.toggle("wysime-hidden", typeSelect.value !== "external");
        currentDialog.querySelector("[data-internal]")?.classList.toggle("wysime-hidden", typeSelect.value !== "internal");
      };
      typeSelect.addEventListener("change", update);
      update();
    }
  });
  if (!dialog) return null;

  const type = dialog.querySelector("[data-link-type]").value;
  const href = type === "internal"
    ? dialog.querySelector("[data-internal-select]")?.value || ""
    : dialog.querySelector("[data-url]").value.trim();
  return {
    href,
    label: dialog.querySelector("[data-label]").value.trim() || href,
    title: dialog.querySelector("[data-title]").value.trim()
  };
}

export async function openCalloutDialog(selection = "", { locale = "fr" } = {}) {
  const messages = getMessages(locale);
  const dialog = await openDialog({
    title: messages.callout.title,
    confirmLabel: messages.common.insert,
    cancelLabel: messages.common.cancel,
    locale,
    body: `
      <div class="wysime-form-grid">
        <label>${escapeHtml(messages.callout.type)}
          <select data-callout-type>
            <option value="info">${escapeHtml(messages.callout.info)}</option>
            <option value="attention">${escapeHtml(messages.callout.attention)}</option>
            <option value="succes">${escapeHtml(messages.callout.success)}</option>
            <option value="critique">${escapeHtml(messages.callout.critical)}</option>
            <option value="danger">${escapeHtml(messages.callout.danger)}</option>
          </select>
        </label>
        <label class="wysime-field-wide">${escapeHtml(messages.callout.optionalTitle)}<input data-callout-title type="text" placeholder="${escapeAttribute(messages.callout.titlePlaceholder)}"></label>
        <label class="wysime-field-wide">${escapeHtml(messages.callout.content)}<textarea data-callout-content rows="6" placeholder="${escapeAttribute(messages.callout.contentPlaceholder)}">${escapeHtml(selection)}</textarea></label>
      </div>`
  });
  if (!dialog) return null;
  return {
    type: dialog.querySelector("[data-callout-type]").value,
    title: dialog.querySelector("[data-callout-title]").value.trim(),
    content: dialog.querySelector("[data-callout-content]").value.trim() || messages.callout.defaultContent
  };
}

export async function openStepsDialog(selection = "", { locale = "fr" } = {}) {
  const messages = getMessages(locale);
  const dialog = await openDialog({
    title: messages.steps.title,
    confirmLabel: messages.common.insert,
    cancelLabel: messages.common.cancel,
    locale,
    body: `
      <div class="wysime-form-grid">
        <p class="wysime-field-wide wysime-dialog-help">${escapeHtml(messages.steps.help)}</p>
        <label class="wysime-field-wide">${escapeHtml(messages.steps.steps)}<textarea data-steps rows="8" placeholder="${escapeAttribute(messages.steps.placeholder)}">${escapeHtml(selection)}</textarea></label>
      </div>`
  });
  if (!dialog) return null;
  return dialog.querySelector("[data-steps]").value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

export async function openImagePropertiesDialog(image, { locale = "fr" } = {}) {
  const messages = getMessages(locale);
  const currentWidth = String(image.style.width || "60%");
  const presets = ["25%", "50%", "60%", "75%", "100%"];
  const dialog = await openDialog({
    title: messages.image.propertiesTitle,
    confirmLabel: messages.common.apply,
    cancelLabel: messages.common.cancel,
    locale,
    body: `
      <div class="wysime-form-grid">
        <label class="wysime-field-wide">${escapeHtml(messages.image.alt)}<input data-alt type="text" value="${escapeAttribute(image.getAttribute("alt") || messages.image.defaultAlt)}"></label>
        <label>${escapeHtml(messages.image.width)}
          <select data-width>
            ${presets.map((width) => `<option value="${width}"${width === currentWidth ? " selected" : ""}>${width}</option>`).join("")}
            <option value="custom"${!presets.includes(currentWidth) ? " selected" : ""}>${escapeHtml(messages.image.custom)}</option>
          </select>
        </label>
        <label>${escapeHtml(messages.image.customWidth)}<input data-custom-width type="text" placeholder="${escapeAttribute(messages.image.customWidthPlaceholder)}" value="${!presets.includes(currentWidth) ? escapeAttribute(currentWidth) : ""}"></label>
      </div>`
  });
  if (!dialog) return null;
  const choice = dialog.querySelector("[data-width]").value;
  return {
    alt: dialog.querySelector("[data-alt]").value.trim() || messages.image.defaultAlt,
    width: choice === "custom" ? dialog.querySelector("[data-custom-width]").value.trim() : choice
  };
}
