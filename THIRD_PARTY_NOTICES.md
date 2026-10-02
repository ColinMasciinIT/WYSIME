# Third-party notices

WYSIME (What You See Is Markdown Editor) is an independently developed Markdown WYSIWYG editor. It does not embed an editor framework such as ProseMirror, Tiptap, Quill, CodeMirror, Milkdown or Toast UI Editor.

## DOMPurify

WYSIME uses DOMPurify for HTML sanitization.

- Project: DOMPurify
- Repository: https://github.com/cure53/DOMPurify
- License: MPL-2.0 OR Apache-2.0
- Package: `dompurify`

DOMPurify remains the copyright of its respective authors and contributors.

## MathLive

WYSIME can load MathLive on demand for visual mathematical input.

- Project: MathLive
- Repository: https://github.com/arnog/mathlive
- Package: `mathlive`
- Default runtime version in WYSIME 0.2.0: `0.111.0`
- License: MIT

## KaTeX

WYSIME can load KaTeX on demand to render LaTeX equations.

- Project: KaTeX
- Repository: https://github.com/KaTeX/KaTeX
- Package: `katex`
- Default runtime version in WYSIME 0.2.0: `0.18.10`
- License: MIT

## Vega-Embed / Vega-Lite

WYSIME can load Vega-Embed on demand to render the WYSIME `chart` DSL as Vega-Lite visualizations.

- Project: Vega-Embed
- Repository: https://github.com/vega/vega-embed
- Package: `vega-embed`
- Default runtime version in WYSIME 0.2.0: `7.3.0`
- License: BSD-3-Clause

Vega-Embed includes/works with the Vega and Vega-Lite visualization ecosystem. Their respective notices and licenses remain applicable to self-hosted or bundled distributions.

## Mermaid

WYSIME can load Mermaid on demand to render fenced Mermaid diagrams.

- Project: Mermaid
- Repository: https://github.com/mermaid-js/mermaid
- Package: `mermaid`
- Default runtime version in WYSIME 0.2.0: `12.0.0`
- License: MIT
