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

export function openDialog({ title, body, confirmLabel = "Insert", cancelLabel = "Cancel", className = "", onMount = null, onClose = null, locale = "fr" }) {
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
      try {
        if (typeof onClose === "function") onClose(dialog, value);
      } finally {
        closeNativeDialog(dialog);
        resolve(value);
      }
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

export async function openEquationDialog(selection = "", { locale = "fr", visualRuntime = {}, display = true, mode = "insert" } = {}) {
  const messages = getMessages(locale);
  let mathKeyboard = null;
  let previousKeyboardContainer = null;
  const keyboardCleanup = [];
  const dialog = await openDialog({
    title: mode === "edit" ? messages.equation.editTitle : messages.equation.title,
    confirmLabel: mode === "edit" ? messages.common.apply : messages.common.insert,
    cancelLabel: messages.common.cancel,
    className: "wysime-equation-dialog",
    locale,
    body: `
      <div class="wysime-form-grid">
        <label class="wysime-field-wide">${escapeHtml(messages.equation.expression)}
          <div class="wysime-math-field-wrap" data-math-field-wrap>
            <textarea data-latex-fallback rows="3" spellcheck="false">${escapeHtml(selection || "x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}")}</textarea>
          </div>
        </label>
        <label class="wysime-check wysime-field-wide"><input data-display-mode type="checkbox"${display !== false ? " checked" : ""}> ${escapeHtml(messages.equation.displayMode)}</label>
        <p class="wysime-dialog-help wysime-field-wide">${escapeHtml(messages.equation.help)}</p>
      </div>`,
    async onMount(currentDialog) {
      try {
        const { ensureMathLiveModule } = await import("./visuals.js");
        const mathliveModule = await ensureMathLiveModule(visualRuntime);
        const wrap = currentDialog.querySelector("[data-math-field-wrap]");
        const fallback = currentDialog.querySelector("[data-latex-fallback]");
        if (!wrap || !fallback || !customElements.get("math-field")) return;

        const keyboardHost = document.createElement("div");
        keyboardHost.className = "wysime-math-keyboard-host";
        keyboardHost.dataset.mathKeyboardHost = "";
        keyboardHost.setAttribute("aria-hidden", "true");
        const keyboardMount = document.createElement("div");
        keyboardMount.className = "wysime-math-keyboard-mount";
        keyboardMount.dataset.mathKeyboardMount = "";
        keyboardHost.appendChild(keyboardMount);
        currentDialog.appendChild(keyboardHost);
        const field = document.createElement("math-field");
        field.className = "wysime-math-field";
        field.value = fallback.value;
        field.setAttribute("aria-label", messages.equation.expression);
        field.dataset.mathField = "";
        wrap.replaceChildren(field, fallback);
        fallback.hidden = true;

        mathKeyboard = mathliveModule?.mathVirtualKeyboard || globalThis.mathVirtualKeyboard || null;
        if (mathKeyboard && keyboardHost) {
          try { previousKeyboardContainer = mathKeyboard.container || document.body; } catch { previousKeyboardContainer = document.body; }
          mathKeyboard.container = keyboardMount;
          field.mathVirtualKeyboardPolicy = "manual";

          const getKeyboardHeight = (event) => {
            const rect = event?.detail?.boundingRect || mathKeyboard?.boundingRect;
            const height = Number(rect?.height || 0);
            return Number.isFinite(height) && height > 0 ? Math.ceil(height) : 0;
          };

          const setKeyboardState = (visible, height = 0) => {
            if (!currentDialog.isConnected) return;
            if (height > 0) currentDialog.style.setProperty("--wysime-math-keyboard-height", `${height}px`);
            currentDialog.classList.toggle("wysime-equation-dialog-with-keyboard", Boolean(visible));
            keyboardHost.classList.toggle("wysime-math-keyboard-visible", Boolean(visible));
            keyboardHost.setAttribute("aria-hidden", visible ? "false" : "true");
          };

          const onKeyboardToggle = (event) => {
            const visible = typeof event?.detail?.visible === "boolean"
              ? event.detail.visible
              : Boolean(mathKeyboard.visible);
            setKeyboardState(visible, getKeyboardHeight(event));
          };
          const onKeyboardGeometry = (event) => {
            const height = getKeyboardHeight(event);
            const visible = mathKeyboard.visible !== false && (height > 0 || currentDialog.classList.contains("wysime-equation-dialog-with-keyboard"));
            if (visible) setKeyboardState(true, height);
          };

          if (typeof mathKeyboard.addEventListener === "function") {
            mathKeyboard.addEventListener("before-virtual-keyboard-toggle", onKeyboardToggle);
            mathKeyboard.addEventListener("virtual-keyboard-toggle", onKeyboardToggle);
            mathKeyboard.addEventListener("geometrychange", onKeyboardGeometry);
            keyboardCleanup.push(() => mathKeyboard.removeEventListener?.("before-virtual-keyboard-toggle", onKeyboardToggle));
            keyboardCleanup.push(() => mathKeyboard.removeEventListener?.("virtual-keyboard-toggle", onKeyboardToggle));
            keyboardCleanup.push(() => mathKeyboard.removeEventListener?.("geometrychange", onKeyboardGeometry));
          }

          const showKeyboard = () => {
            setKeyboardState(true, getKeyboardHeight());
            try {
              if (typeof mathKeyboard.show === "function") mathKeyboard.show();
              else mathKeyboard.visible = true;
            } catch {}
            queueMicrotask(() => {
              const height = getKeyboardHeight();
              if (height > 0 || mathKeyboard.visible === true) setKeyboardState(true, height);
            });
          };
          field.addEventListener("focusin", showKeyboard);
          keyboardCleanup.push(() => field.removeEventListener("focusin", showKeyboard));
          queueMicrotask(() => {
            try { field.focus(); } catch {}
            showKeyboard();
          });
        }
      } catch {
        // The LaTeX textarea remains usable when the optional runtime cannot load.
      }
    },
    onClose(currentDialog) {
      while (keyboardCleanup.length) {
        try { keyboardCleanup.pop()?.(); } catch {}
      }
      currentDialog.classList.remove("wysime-equation-dialog-with-keyboard");
      currentDialog.style.removeProperty("--wysime-math-keyboard-height");
      if (!mathKeyboard) return;
      try { mathKeyboard.hide?.(); } catch {}
      try { mathKeyboard.container = previousKeyboardContainer?.isConnected ? previousKeyboardContainer : document.body; } catch {}
    }
  });
  if (!dialog) return null;
  const field = dialog.querySelector("math-field[data-math-field]");
  const fallback = dialog.querySelector("[data-latex-fallback]");
  const latex = String(field?.value || fallback?.value || "").trim();
  return { latex, display: dialog.querySelector("[data-display-mode]")?.checked !== false };
}

export async function openVisualDialog({ locale = "fr", visualRuntime = {} } = {}) {
  const messages = getMessages(locale);
  const dialog = await openDialog({
    title: messages.visual.title,
    confirmLabel: messages.common.insert,
    cancelLabel: messages.common.cancel,
    className: "wysime-visual-dialog",
    locale,
    body: `
      <div class="wysime-form-grid">
        <label>${escapeHtml(messages.visual.kind)}
          <select data-visual-kind>
            <option value="chart">${escapeHtml(messages.visual.chart)}</option>
            <option value="mermaid">${escapeHtml(messages.visual.diagram)}</option>
          </select>
        </label>
        <div class="wysime-field-wide" data-chart-fields>
          <div class="wysime-form-grid">
            <label>${escapeHtml(messages.visual.chartType)}
              <select data-chart-type>
                <option value="bar">${escapeHtml(messages.visual.bar)}</option>
                <option value="line">${escapeHtml(messages.visual.line)}</option>
                <option value="area">${escapeHtml(messages.visual.area)}</option>
                <option value="pie">${escapeHtml(messages.visual.pie)}</option>
                <option value="scatter">${escapeHtml(messages.visual.scatter)}</option>
              </select>
            </label>
            <label>${escapeHtml(messages.visual.unit)}<input data-chart-unit type="text" placeholder="€"></label>
            <label class="wysime-field-wide">${escapeHtml(messages.visual.chartTitle)}<input data-chart-title type="text" placeholder="${escapeAttribute(messages.visual.chartTitlePlaceholder)}"></label>
            <label class="wysime-field-wide">${escapeHtml(messages.visual.data)}
              <textarea data-chart-data rows="7" spellcheck="false" placeholder="Janvier: 12000\nFévrier: 15500\nMars: 18200">Janvier: 12000\nFévrier: 15500\nMars: 18200</textarea>
            </label>
          </div>
        </div>
        <div class="wysime-field-wide wysime-hidden" data-mermaid-fields>
          <label>${escapeHtml(messages.visual.diagramType)}
            <select data-diagram-type>
              <option value="flowchart">Flowchart</option>
              <option value="sequenceDiagram">Sequence diagram</option>
              <option value="classDiagram">Class diagram</option>
              <option value="stateDiagram-v2">State diagram</option>
              <option value="erDiagram">ER diagram</option>
              <option value="gantt">Gantt</option>
            </select>
          </label>
          <label>${escapeHtml(messages.visual.definition)}
            <textarea data-mermaid-source rows="10" spellcheck="false">flowchart LR\n  A[Début] --> B[Étape]\n  B --> C[Fin]</textarea>
          </label>
        </div>
        <div class="wysime-field-wide wysime-visual-dialog-preview" data-visual-preview aria-live="polite"></div>
        <p class="wysime-dialog-help wysime-field-wide">${escapeHtml(messages.visual.help)}</p>
      </div>`,
    async onMount(currentDialog) {
      const kind = currentDialog.querySelector("[data-visual-kind]");
      const chartFields = currentDialog.querySelector("[data-chart-fields]");
      const mermaidFields = currentDialog.querySelector("[data-mermaid-fields]");
      const source = currentDialog.querySelector("[data-mermaid-source]");
      const diagramType = currentDialog.querySelector("[data-diagram-type]");
      const preview = currentDialog.querySelector("[data-visual-preview]");
      let visualHelpers = null;
      try { visualHelpers = await import("./visuals.js"); } catch {}
      const chartSource = () => {
        const type = currentDialog.querySelector("[data-chart-type]").value;
        const title = currentDialog.querySelector("[data-chart-title]").value.trim();
        const unit = currentDialog.querySelector("[data-chart-unit]").value.trim();
        const data = currentDialog.querySelector("[data-chart-data]").value.trim();
        return [title ? type + ' "' + title.replace(/"/g, "'") + '"' : type, unit ? "unit: " + unit : "", data].filter(Boolean).join("\n");
      };
      let previewTimer = null;
      const renderPreview = () => {
        clearTimeout(previewTimer);
        previewTimer = setTimeout(async () => {
          if (!preview || !visualHelpers) return;
          const visualKind = kind.value === "chart" ? "chart" : "mermaid";
          const visualSource = visualKind === "chart" ? chartSource() : source.value.trim();
          preview.innerHTML = visualHelpers.createVisualPlaceholder(visualKind, visualSource);
          await visualHelpers.hydrateVisuals(preview, { charts: true, diagrams: true, equations: false, visualRuntime });
        }, 120);
      };
      const update = () => {
        const isChart = kind.value === "chart";
        chartFields.classList.toggle("wysime-hidden", !isChart);
        mermaidFields.classList.toggle("wysime-hidden", isChart);
        renderPreview();
      };
      kind.addEventListener("change", update);
      currentDialog.querySelectorAll("[data-chart-type],[data-chart-title],[data-chart-unit],[data-chart-data],[data-mermaid-source]").forEach((field) => {
        field.addEventListener("input", renderPreview);
        field.addEventListener("change", renderPreview);
      });
      diagramType.addEventListener("change", () => {
        const templates = {
          flowchart: "flowchart LR\n  A[Début] --> B[Étape]\n  B --> C[Fin]",
          sequenceDiagram: "sequenceDiagram\n  Alice->>Bob: Bonjour\n  Bob-->>Alice: Réponse",
          classDiagram: "classDiagram\n  class Projet\n  Projet : +String nom",
          "stateDiagram-v2": "stateDiagram-v2\n  [*] --> Brouillon\n  Brouillon --> Publié",
          erDiagram: "erDiagram\n  CLIENT ||--o{ COMMANDE : passe",
          gantt: "gantt\n  title Planning\n  dateFormat YYYY-MM-DD\n  section Projet\n  Conception :2026-10-01, 5d"
        };
        source.value = templates[diagramType.value] || source.value;
        renderPreview();
      });
      update();
    }
  });
  if (!dialog) return null;
  const kind = dialog.querySelector("[data-visual-kind]").value;
  if (kind === "mermaid") return { kind, source: dialog.querySelector("[data-mermaid-source]").value.trim() };
  const type = dialog.querySelector("[data-chart-type]").value;
  const title = dialog.querySelector("[data-chart-title]").value.trim();
  const unit = dialog.querySelector("[data-chart-unit]").value.trim();
  const data = dialog.querySelector("[data-chart-data]").value.trim();
  const first = title ? `${type} "${title.replace(/"/g, "'")}"` : type;
  return { kind, source: [first, unit ? `unit: ${unit}` : "", data].filter(Boolean).join("\n") };
}
