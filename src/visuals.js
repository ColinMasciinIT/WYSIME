/**
 * WYSIME - What You See Is Markdown Editor
 * Copyright (c) 2026 Colin Timaxian
 * SPDX-License-Identifier: MIT
 */

export const DEFAULT_VISUAL_RUNTIME = Object.freeze({
  mathlive: "https://cdn.jsdelivr.net/npm/mathlive@0.111.0/+esm",
  katex: "https://cdn.jsdelivr.net/npm/katex@0.18.10/+esm",
  katexCss: "https://cdn.jsdelivr.net/npm/katex@0.18.10/dist/katex.min.css",
  vegaEmbed: "https://cdn.jsdelivr.net/npm/vega-embed@7.3.0/+esm",
  mermaid: "https://cdn.jsdelivr.net/npm/mermaid@12.0.0/+esm"
});

const moduleCache = new Map();

function loadModule(url) {
  if (!moduleCache.has(url)) moduleCache.set(url, import(/* @vite-ignore */ url));
  return moduleCache.get(url);
}

function ensureStylesheet(href, key) {
  if (!href || typeof document === "undefined") return;
  if (document.querySelector(`link[data-wysime-runtime="${key}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.wysimeRuntime = key;
  document.head.appendChild(link);
}

export function encodeVisualSource(value) {
  return encodeURIComponent(String(value ?? ""));
}

export function decodeVisualSource(value) {
  try { return decodeURIComponent(String(value ?? "")); } catch { return String(value ?? ""); }
}

export function createMathPlaceholder(latex, display = false) {
  return `<span class="wysime-math${display ? " wysime-math-block" : ""}" data-wysime-kind="math" data-wysime-display="${display ? "block" : "inline"}" data-wysime-source="${encodeVisualSource(latex)}" contenteditable="false">${display ? "Equation" : "∑"}</span>`;
}

export function createVisualPlaceholder(kind, source) {
  return `<div class="wysime-visual wysime-${kind}" data-wysime-kind="${kind}" data-wysime-source="${encodeVisualSource(source)}" contenteditable="false"><div class="wysime-visual-loading">${kind === "chart" ? "Graphique" : "Diagramme"}</div></div>`;
}

function parseNumber(value) {
  const normalized = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function parseNaturalChart(source) {
  const lines = String(source || "").replace(/\r\n/g, "\n").split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) throw new Error("Empty chart definition.");

  const header = lines.shift().match(/^(bar|line|area|scatter|pie)(?:\s+[\"“](.*?)[\"”])?$/i);
  if (!header) throw new Error("The first line must be: bar, line, area, scatter or pie, optionally followed by a quoted title.");
  const type = header[1].toLowerCase();
  const title = header[2] || "";
  const meta = {};
  const dataLines = [];

  for (const line of lines) {
    const option = line.match(/^(unit|legend|x|y)\s*:\s*(.+)$/i);
    if (option) meta[option[1].toLowerCase()] = option[2].trim();
    else dataLines.push(line);
  }

  if (type === "scatter") {
    const values = dataLines.map((line) => {
      const parts = line.split(/[,;]/).map((part) => part.trim());
      if (parts.length < 2) throw new Error(`Invalid scatter row: ${line}`);
      const x = parseNumber(parts[0]);
      const y = parseNumber(parts[1]);
      if (x === null || y === null) throw new Error(`Scatter values must be numeric: ${line}`);
      return { x, y };
    });
    return {
      $schema: "https://vega.github.io/schema/vega-lite/v6.json",
      title: title || undefined,
      width: "container",
      mark: { type: "point", tooltip: true },
      data: { values },
      encoding: {
        x: { field: "x", type: "quantitative", title: meta.x || "X" },
        y: { field: "y", type: "quantitative", title: meta.y || "Y" }
      }
    };
  }

  const values = dataLines.map((line) => {
    const match = line.match(/^(.+?)\s*:\s*(-?[\d\s.,]+)$/);
    if (!match) throw new Error(`Invalid data row: ${line}`);
    const value = parseNumber(match[2]);
    if (value === null) throw new Error(`Invalid numeric value: ${line}`);
    return { category: match[1].trim(), value };
  });
  if (!values.length) throw new Error("The chart contains no data.");

  const mark = type === "pie"
    ? { type: "arc", tooltip: true }
    : { type: type === "area" ? "area" : type, tooltip: true };
  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v6.json",
    title: title || undefined,
    width: "container",
    data: { values },
    mark
  };
  if (type === "pie") {
    spec.encoding = {
      theta: { field: "value", type: "quantitative" },
      color: { field: "category", type: "nominal", sort: null, legend: meta.legend?.toLowerCase() === "none" ? null : {} },
      order: { value: null },
      tooltip: [
        { field: "category", type: "nominal" },
        { field: "value", type: "quantitative", title: meta.unit ? `Valeur (${meta.unit})` : "Valeur" }
      ]
    };
  } else {
    spec.encoding = {
      x: { field: "category", type: "ordinal", sort: null, title: meta.x || null },
      y: { field: "value", type: "quantitative", title: meta.y || (meta.unit ? `Valeur (${meta.unit})` : null) }
    };
    if (type === "line" || type === "area") spec.encoding.order = { value: null };
  }
  return spec;
}

export async function ensureMathLiveModule(runtime = {}) {
  const urls = { ...DEFAULT_VISUAL_RUNTIME, ...runtime };
  const module = await loadModule(urls.mathlive);
  return module;
}

export async function ensureMathLive(runtime = {}) {
  const existing = customElements.get("math-field");
  if (existing) return existing;
  const module = await ensureMathLiveModule(runtime);
  return module.MathfieldElement || customElements.get("math-field");
}

export async function hydrateVisuals(root, options = {}) {
  if (!root) return;
  const runtime = { ...DEFAULT_VISUAL_RUNTIME, ...(options.visualRuntime || {}) };

  if (options.equations !== false) {
    const mathNodes = Array.from(root.querySelectorAll('[data-wysime-kind="math"]'));
    if (mathNodes.length) {
      ensureStylesheet(runtime.katexCss, "katex");
      try {
        const katexModule = await loadModule(runtime.katex);
        const katex = katexModule.default || katexModule;
        mathNodes.forEach((node) => {
          try {
            node.innerHTML = katex.renderToString(decodeVisualSource(node.dataset.wysimeSource), {
              displayMode: node.dataset.wysimeDisplay === "block",
              throwOnError: false,
              strict: "warn",
              trust: false
            });
            if (!node.querySelector("[data-wysime-edit-math]")) {
              const editButton = document.createElement("button");
              editButton.type = "button";
              editButton.className = "wysime-math-edit";
              editButton.dataset.wysimeEditMath = "";
              editButton.dataset.wysimeUi = "";
              editButton.setAttribute("aria-label", options.locale?.toLowerCase?.().startsWith("en") ? "Edit equation" : "Modifier la formule");
              editButton.title = editButton.getAttribute("aria-label");
              editButton.innerHTML = '<svg viewBox="0 0 18 18" aria-hidden="true" focusable="false"><path d="M4 12.7 3.3 15l2.3-.7 7.7-7.7-1.6-1.6L4 12.7Z" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linejoin="round"/><path d="m10.7 6 1.6-1.6a1.2 1.2 0 0 1 1.7 0l.6.6a1.2 1.2 0 0 1 0 1.7L13 8.3" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"/></svg>';
              node.appendChild(editButton);
            }
            node.classList.remove("wysime-visual-error");
          } catch (error) {
            node.textContent = decodeVisualSource(node.dataset.wysimeSource);
            node.classList.add("wysime-visual-error");
            node.title = error.message;
          }
        });
      } catch (error) {
        mathNodes.forEach((node) => { node.title = error.message; });
      }
    }
  }

  if (options.charts !== false) {
    const charts = Array.from(root.querySelectorAll('[data-wysime-kind="chart"]'));
    if (charts.length) {
      try {
        const module = await loadModule(runtime.vegaEmbed);
        const embed = module.default || module;
        for (const node of charts) {
          try {
            node.innerHTML = "";
            await embed(node, parseNaturalChart(decodeVisualSource(node.dataset.wysimeSource)), {
              actions: false,
              renderer: "svg"
            });
            node.classList.remove("wysime-visual-error");
          } catch (error) {
            node.innerHTML = `<div class="wysime-visual-error-message">${String(error.message || error)}</div>`;
            node.classList.add("wysime-visual-error");
          }
        }
      } catch (error) {
        charts.forEach((node) => { node.textContent = error.message; node.classList.add("wysime-visual-error"); });
      }
    }
  }

  if (options.diagrams !== false) {
    const diagrams = Array.from(root.querySelectorAll('[data-wysime-kind="mermaid"]'));
    if (diagrams.length) {
      try {
        const module = await loadModule(runtime.mermaid);
        const mermaid = module.default || module;
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", suppressErrorRendering: true });
        let index = 0;
        for (const node of diagrams) {
          try {
            const id = `wysime-mermaid-${Date.now()}-${index++}`;
            const { svg, bindFunctions } = await mermaid.render(id, decodeVisualSource(node.dataset.wysimeSource));
            node.innerHTML = svg;
            bindFunctions?.(node);
            node.classList.remove("wysime-visual-error");
          } catch (error) {
            node.innerHTML = `<div class="wysime-visual-error-message">${String(error.message || error)}</div>`;
            node.classList.add("wysime-visual-error");
          }
        }
      } catch (error) {
        diagrams.forEach((node) => { node.textContent = error.message; node.classList.add("wysime-visual-error"); });
      }
    }
  }
}
