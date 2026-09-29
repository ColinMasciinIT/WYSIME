# Changelog

All notable WYSIME releases are documented in this file.

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
