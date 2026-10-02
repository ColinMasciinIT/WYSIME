# Changelog

All notable WYSIME releases are documented in this file.

## 0.2.4 - 2026-10-02

### Fixes

- Rework the MathLive equation dialog layout so it is centered normally when the virtual keyboard is hidden and docks immediately above the keyboard only while the keyboard is visible.
- Use MathLive `virtual-keyboard-toggle` and `geometrychange` events to track visibility and the keyboard's real height instead of permanently reserving half of the viewport.
- Remove the white spacer above the virtual keyboard by making the keyboard host/mount transparent and sizing the docking offset from the keyboard geometry.

## 0.2.3 - 2026-10-02

### Fixes

- Move the MathLive virtual keyboard out of the equation card flow and render it as a fixed panel occupying the lower half of the viewport.
- Keep the equation dialog constrained to the upper half of the viewport while the keyboard is visible, with an independently scrollable dialog body when needed.
- Keep the keyboard host inside the native dialog top layer so it remains clickable above the modal backdrop without overlapping the equation card.

## 0.2.2 - 2026-10-02

### Fixes

- Preserve data categories in the exact order written in the `chart` data input instead of letting Vega-Lite apply its default ascending sort. Line/area paths and pie sectors also retain source order.
- Restore the MathLive virtual keyboard on desktop by using manual keyboard policy and explicitly showing it when the math field is focused, while keeping the keyboard mounted inside the equation modal.

## 0.2.1 - 2026-10-02

### Fixes

- Enlarged the equation dialog and attached the MathLive virtual keyboard to a container inside the native modal so it remains usable above the dialog top layer.
- Added a pencil edit control to rendered block equations; existing LaTeX and display mode are restored when reopening the equation editor.
- Enlarged the chart/diagram dialog and hardened its responsive grid sizing so inputs no longer overflow the modal.
- Internal equation edit controls are excluded from `getHtml()` output and do not affect Markdown serialization.

## 0.2.0 - 2026-10-02

### Features

- Added equation insertion with a dedicated SVG toolbar icon. MathLive provides visual input, LaTeX remains the canonical Markdown representation, and KaTeX renders the result.
- Added inline math with `$...$` and block math with `$$...$$`.
- Added configurable `equations`, `charts` and `diagrams` feature flags, enabled by default.
- Added data charts through a human-readable fenced `chart` DSL rendered by Vega-Lite/Vega-Embed.
- Added bar, line, area, pie and scatter chart types.
- Added Mermaid fenced blocks with a dedicated chart/diagram SVG toolbar icon and insertion interface with live preview.
- Added on-demand visual runtime loading with overridable URLs for MathLive, KaTeX, Vega-Embed and Mermaid.
- Added lossless HTML-to-Markdown serialization for equations, charts and diagrams after visual hydration.
- Added TypeScript declarations and public helpers for visual runtime hydration and natural chart parsing.

### Security

- Mermaid is initialized with `securityLevel: "strict"`.
- KaTeX rendering uses `trust: false`.
- Visual source definitions are URI-encoded and pass through the existing DOMPurify pipeline.

## 0.1.1 - 2026-09-30

### Features

- Added a toolbar button with a dedicated SVG icon to inspect the generated Markdown in a read-only modal.

## 0.1.0 - 2026-09-28

### Features

- Framework-free Markdown WYSIWYG editor built with Vanilla JavaScript and `contenteditable`.
- Markdown-first storage with Markdown-to-HTML rendering and HTML-to-Markdown serialization.
- Headings, bold, italic, underline, strikethrough, subscript, superscript and inline code.
- Bulleted lists, numbered lists, task items and blockquotes.
- Links, fenced code blocks and editable tables.
- Contextual table controls to add or remove rows and columns, delete a table, and configure first-row/first-column headers.
- Image upload adapter, drag-and-drop support, image width metadata and image property editing.
- Editorial callouts (`:::info`, `:::attention`, `:::succes`, `:::critique`, `:::danger`).
- Step-by-step procedure blocks (`:::steps`).
- Controlled text alignment.
- HTML sanitization through DOMPurify.
- Selection-aware toolbar actions: formatting and block actions apply to the selected content.
- Toggleable inline formatting: clicking bold, italic, underline, strikethrough, subscript, superscript or inline code again removes that modifier from the selected text.
- French and English editor interface through the `locale` option.
- Bilingual French/English interactive demo.
- Read-only mode, change callbacks and the `wysime:change` DOM event.
- TypeScript declarations for the public API.
