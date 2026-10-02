# WYSIME

> **What You See Is Markdown Editor**
> A lightweight, framework-free Markdown WYSIWYG editor written in Vanilla JavaScript.

[![npm version](https://img.shields.io/npm/v/wysime.svg)](https://www.npmjs.com/package/wysime)
[![npm downloads](https://img.shields.io/npm/dm/wysime.svg)](https://www.npmjs.com/package/wysime)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**[Live Demo](https://wysime.com/#demo)** ·
**[npm](https://www.npmjs.com/package/wysime)** ·
**[Documentation](./docs/INTEGRATION.md)** ·
**[Report a bug](https://github.com/ColinMasciinIT/WYSIME/issues)**

<p align="center">
  <img src="./assets/Tuto_WYSIME.gif"
       alt="WYSIME Markdown WYSIWYG editor demo"
       width="900">
</p>

WYSIME is a Markdown-first editor designed and created by **Colin Timaxian**. It provides a rich WYSIWYG editing surface while keeping Markdown as the canonical stored format.

The standalone library is deliberately host-agnostic: it contains no application-specific route, authentication mechanism, storage backend or business module.

## Status

`0.2.4` refines the MathLive equation workflow: the equation dialog stays centered while the virtual keyboard is hidden, then automatically docks just above the keyboard when it is shown. The docking offset follows the keyboard's real height, so no fixed white spacer is reserved above it. Chart categories continue to preserve the exact order written in the data input.

The editor is usable, but the API and Markdown serialization rules may still evolve during the `0.x` series.

## Highlights

- Vanilla JavaScript; no ProseMirror, Tiptap, Quill, CodeMirror, Milkdown or Toast UI runtime.
- `contenteditable` editing surface using Selection, Range and DocumentFragment APIs.
- Markdown -> sanitized HTML renderer.
- WYSIWYG HTML -> Markdown serializer.
- Headings, bold, italic, underline, strike, subscript, superscript and inline code.
- Bulleted lists, ordered lists and task items.
- Text alignment.
- Links, tables and fenced code blocks.
- Contextual table editing: add/remove rows and columns, delete the table, and toggle first-row/first-column headers.
- Configurable image upload, drag-and-drop and image width metadata.
- Editorial callouts: `:::info`, `:::attention`, `:::succes`, `:::critique`, `:::danger`.
- Procedure blocks: `:::steps`.
- Front matter stripping for rendering.
- DOMPurify sanitization plus URL/style restrictions.
- Read-only mode.
- Responsive toolbar.
- Dedicated toolbar button to inspect the generated Markdown in a modal.
- MathLive equation input with LaTeX Markdown storage and KaTeX rendering.
- Vega-Lite/Vega-Embed data charts through a compact human-readable `chart` block.
- Mermaid diagrams with a dedicated visual insertion workflow.
- French and English interface through `locale: "fr" | "en"`.
- Bilingual French/English demo.
- No hard-coded backend.
- No `document.execCommand()` dependency.

## Installation

The npm package name is currently `wysime` : https://www.npmjs.com/package/wysime

```bash
npm install wysime
```

For local review:

```bash
npm install
npm run dev
```

## Basic usage

```html
<textarea id="content"></textarea>
```

```javascript
import { WYSIMEditor } from "wysime";
import "wysime/style.css";

const editor = new WYSIMEditor("#content", {
  locale: "en",
  onChange(markdown) {
    console.log(markdown);
  }
});
```

When the target is a `<textarea>`, its value remains synchronized with the canonical Markdown and can still be submitted by a normal HTML form.

## Image upload

WYSIME does not decide where files are stored. The host application provides an upload adapter:

```javascript
const editor = new WYSIMEditor("#content", {
  images: true,
  uploadImage: async (file) => {
    const body = new FormData();
    body.append("file", file);

    const response = await fetch("/api/uploads", {
      method: "POST",
      body
    });

    if (!response.ok) throw new Error("Upload failed");

    const result = await response.json();

    return {
      url: result.url,
      alt: result.originalName || file.name,
      width: "60%"
    };
  }
});
```

The callback may return a URL string or an object:

```javascript
{
  url: "/uploads/image.png",
  alt: "Architecture",
  width: "60%"
}
```

The default client-side limit is 8 MiB. PNG, JPEG, GIF and WebP are accepted by default. Browser-side checks are convenience checks only; repeat validation on the server.

## Internal links

Host applications may explicitly expose internal destinations:

```javascript
new WYSIMEditor("#content", {
  internalLinks: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Support", href: "/support" },
    { label: "Section", href: "#section" }
  ]
});
```

## Main API

### `new WYSIMEditor(target, options)`

`target` may be a CSS selector, a `<textarea>`, or another mount element.

| Option | Type | Default | Purpose |
| --- | --- | --- | --- |
| `locale` | `"fr" \| "en"` | `"fr"` | Built-in editor/dialog language |
| `images` | boolean | `true` | Enable image insertion |
| `equations` | boolean | `true` | Enable MathLive/KaTeX equations |
| `charts` | boolean | `true` | Enable Vega-Lite data charts |
| `diagrams` | boolean | `true` | Enable Mermaid diagrams |
| `visualRuntime` | object | pinned jsDelivr URLs | Override MathLive, KaTeX, Vega-Embed and Mermaid runtime URLs |
| `uploadImage` | function | `null` | Host upload adapter |
| `maxImageBytes` | number | `8 * 1024 * 1024` | Client-side image size limit |
| `acceptedImageTypes` | string[] | PNG/JPEG/GIF/WebP | Allowed client MIME types |
| `initialValue` | string | `""` | Initial Markdown for non-textarea mounts |
| `placeholder` | string | locale-dependent | Empty editor hint |
| `readOnly` | boolean | `false` | Disable editing and hide toolbar |
| `autofocus` | boolean | `false` | Focus editor after mounting |
| `internalLinks` | array | `[]` | Host-defined internal links |
| `sanitizeOptions` | object | `{}` | Sanitizer policy overrides |
| `onChange` | function | `null` | Called after Markdown changes |
| `linkDialog` | function | built-in | Replace the default link dialog |
| `tableDialog` | function | built-in | Replace the table dialog |
| `codeDialog` | function | built-in | Replace the code dialog |
| `calloutDialog` | function | built-in | Replace the callout dialog |
| `stepsDialog` | function | built-in | Replace the steps dialog |

### Instance methods

```javascript
editor.getMarkdown();
editor.setMarkdown("# Document");
editor.getHtml();
editor.insertMarkdown("**text**");
editor.insertHtml("<strong>text</strong>");
editor.setReadOnly(true);
editor.focus();
editor.destroy();
```

## Events

In addition to `onChange`, the editor host dispatches:

```text
wysime:change
```

with:

```javascript
{
  markdown,
  editor
}
```

## Editorial Markdown extensions

See [`docs/EDITORIAL_MARKDOWN.md`](./docs/EDITORIAL_MARKDOWN.md).

Callout:

```markdown
:::info Optional title
Content
:::
```

Procedure:

```markdown
:::steps
1. First step
2. Second step
:::
```

Image width:

```markdown
![Architecture](/uploads/architecture.png){width=70%}
```

Controlled alignment:

```html
<p style="text-align:center">Centered text</p>
```

## Security model

WYSIME treats generated and pasted HTML as untrusted content:

1. Markdown is converted to HTML by the local renderer.
2. HTML is sanitized with DOMPurify.
3. A second policy restricts link/image URL schemes and inline styles.
4. Rich HTML pasted into the editing surface is sanitized before insertion.
5. Uploads remain the responsibility of the host application and must be validated server-side.

See [`SECURITY.md`](./SECURITY.md).

## Build

```bash
npm run build
```

Expected output:

```text
dist/
├── wysime.js
├── wysime.umd.cjs
└── wysime.css
```

DOMPurify remains an explicit npm runtime dependency and is externalized from the library bundle. MathLive, KaTeX, Vega-Embed and Mermaid are visual runtimes loaded on demand from pinned URLs (or from host-provided `visualRuntime` URLs).

## Tests

```bash
npm test
```

The suite covers Markdown rendering, sanitization, Markdown/HTML round trips, selection-aware actions, contextual table editing, architecture constraints and the main editor lifecycle.

## Project structure

```text
WYSIME/
├── src/
│   ├── editor.js
│   ├── dom.js
│   ├── markdown.js
│   ├── html-to-markdown.js
│   ├── sanitize.js
│   ├── dialogs.js
│   ├── i18n.js
│   ├── icons.js
│   ├── styles.css
│   └── index.js
├── demo/
├── docs/
│   ├── EDITORIAL_MARKDOWN.md
│   ├── INTEGRATION.md
│   └── ORIGIN_AND_ARCHITECTURE.md
├── tests/
├── types/
├── AUTHORS.md
├── SECURITY.md
├── CONTRIBUTING.md
├── THIRD_PARTY_NOTICES.md
└── LICENSE
```

## Architectural choices

### Markdown is the source of truth

The WYSIWYG DOM is an editing representation. Persisted content remains portable, diffable Markdown rather than a proprietary document schema.

### No editor framework

The goal is to keep the editing layer inspectable and lightweight while retaining explicit control over Markdown serialization.

### DOMPurify is intentional

HTML sanitization is security-sensitive. Instead of reimplementing an HTML sanitizer, WYSIME isolates that responsibility in DOMPurify. See [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).

## Known limitations in 0.2.x

- The parser targets the documented editorial subset, not every CommonMark/GFM edge case.
- Complex nested inline formatting may normalize during a WYSIWYG round trip.
- Markdown tables only provide basic escaped-pipe handling.
- Complex HTML tables may be preserved as controlled HTML.
- Collaborative editing, comments, track changes and real-time cursors are out of scope.
- Syntax highlighting is not bundled; code blocks expose `language-*` classes for an external highlighter.
- The default visual runtimes require network access to jsDelivr; self-host the pinned runtime files through `visualRuntime` for offline or restrictive-CSP deployments.
- The v0.2.x `chart` DSL intentionally focuses on common single-series visualizations; advanced Vega-Lite specifications are not exposed directly.

## Author

**WYSIME was designed and created by Colin Timaxian.**

See [`AUTHORS.md`](./AUTHORS.md).

## License

MIT License - Copyright (c) 2026 Colin Timaxian.

Third-party licenses are documented in [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).

## Equations, charts and diagrams (v0.2.0)

WYSIME 0.2.0 adds visual scientific and data content while keeping Markdown as the canonical format.

### Equations

Equations are enabled by default. WYSIME uses **MathLive** for visual input, stores the result as LaTeX Markdown, then uses **KaTeX** for rendering:

```markdown
Inline: $E = mc^2$

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

Rendered block equations expose a small pencil control in editable mode. It reopens the MathLive dialog with the existing LaTeX and block/inline mode preloaded. The control is hidden in read-only mode and is never included in Markdown or `getHtml()` output.

Disable the feature with:

```javascript
new WYSIMEditor("#content", { equations: false });
```

### Data charts

Data charts are enabled by default and are rendered through **Vega-Lite / Vega-Embed**. WYSIME deliberately stores a small human-readable `chart` DSL instead of a Vega JSON object:

````markdown
```chart
bar "Revenue"
unit: €
January: 12000
February: 15500
March: 18200
```
````

Supported chart types in 0.2.0 are `bar`, `line`, `area`, `pie` and `scatter`.

Disable them with `charts: false`.

### Diagrams

Mermaid blocks are rendered visually and remain standard Mermaid source in Markdown:

````markdown
```mermaid
flowchart LR
  A[Start] --> B[Review]
  B --> C[Publish]
```
````

Disable them with `diagrams: false`.

### Visual runtime loading

To keep the core package lightweight and framework-free, WYSIME loads the visual runtimes on demand from pinned jsDelivr ESM URLs. Applications with a strict CSP, offline requirements or an internal artifact registry can override every URL:

```javascript
new WYSIMEditor("#content", {
  visualRuntime: {
    mathlive: "/vendor/mathlive/mathlive.mjs",
    katex: "/vendor/katex/katex.mjs",
    katexCss: "/vendor/katex/katex.min.css",
    vegaEmbed: "/vendor/vega-embed/index.mjs",
    mermaid: "/vendor/mermaid/mermaid.esm.mjs"
  }
});
```

No user-authored JavaScript is executed. Mermaid is initialized with `securityLevel: "strict"`, KaTeX runs with `trust: false`, and visual definitions are preserved in sanitized `data-wysime-*` metadata for lossless Markdown round-trips.
