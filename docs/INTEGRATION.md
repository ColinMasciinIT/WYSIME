# Integration guide

## Form integration

The simplest integration targets an existing textarea:

```html
<form method="post">
  <textarea id="description" name="description"></textarea>
  <button type="submit">Save</button>
</form>
```

```javascript
import { WYSIMEditor } from "wysime";
import "wysime/style.css";

const editor = new WYSIMEditor("#description");
```

The textarea value is synchronized before normal form submission.

## Interface language

The built-in interface and dialogs are available in French and English:

```javascript
new WYSIMEditor("#description", { locale: "fr" });
new WYSIMEditor("#description", { locale: "en" });
```

French is the default. A custom `placeholder` still overrides the localized default placeholder.

## API-based applications

```javascript
const editor = new WYSIMEditor("#description", {
  initialValue: documentData.markdown,
  onChange(markdown) {
    state.currentMarkdown = markdown;
  }
});

await fetch(`/api/documents/${documentId}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ markdown: editor.getMarkdown() })
});
```

## Upload adapter contract

The browser-side adapter receives the selected `File` and editor instance:

```javascript
async function uploadImage(file, editor) {
  // validate or preprocess if desired
  // upload to your server or object storage
  return {
    url: "/uploads/generated-name.webp",
    alt: file.name,
    width: "60%"
  };
}
```

Server-side recommendations:

- verify authentication and authorization;
- enforce a request-size limit independently of the UI;
- inspect the actual file type, not only the browser MIME string;
- generate server-side storage names instead of trusting the original filename;
- prevent path traversal;
- serve uploads with appropriate `Content-Type` and security headers;
- apply your own antivirus/content-scanning policy where relevant.

## Internal links

Do not make the editor discover the host application's navigation itself. Pass destinations explicitly:

```javascript
const internalLinks = routes.map((route) => ({
  label: route.title,
  href: route.path
}));

new WYSIMEditor("#description", { internalLinks });
```

This keeps the package independent from the host routing system.

## Custom dialogs

Each structured insertion dialog can be replaced. A custom link resolver receives the selected text and editor-provided options:

```javascript
new WYSIMEditor("#description", {
  linkDialog: async (selection, { internalLinks, locale }) => {
    const result = await myApplicationModal({ selection, internalLinks });
    return result && {
      href: result.url,
      label: result.label,
      title: result.tooltip
    };
  }
});
```

Equivalent hooks exist for tables, code blocks, callouts and steps.

Structured actions preserve the editor selection while dialogs are open. This means selected text is passed to link, code, callout and step insertion workflows and the resulting block replaces the selected range rather than being inserted at an unrelated cursor position.

## Contextual table editing

Click a table cell while the editor is editable to open the contextual table toolbar. It can:

- add a row after the active row;
- remove the active row;
- add a column after the active column;
- remove the active column;
- toggle first-row and first-column header modes;
- delete the whole table.

When first-column headers are enabled, WYSIME preserves the table as controlled HTML because standard Markdown tables do not have a first-column-header concept.

## Rendering without an editor

The conversion functions are separately exported:

```javascript
import { markdownToHtml, htmlToMarkdown } from "wysime";

const safeHtml = markdownToHtml(markdown);
const markdownAgain = htmlToMarkdown(safeHtml);
```

## CSS customization

Override CSS variables on a container:

```css
.my-editor-theme {
  --wysime-accent: #5b34da;
  --wysime-bg: #ffffff;
  --wysime-surface: #f8f7fc;
  --wysime-border: #ded9ea;
  --wysime-text: #211a2f;
}
```

No JavaScript change is required.

## Equations, charts and diagrams

All three visual capabilities are enabled by default:

```javascript
new WYSIMEditor("#description", {
  equations: true,
  charts: true,
  diagrams: true
});
```

Set a capability to `false` to remove its toolbar action and keep the corresponding Markdown as ordinary source/code during rendering.

The editor loads MathLive, KaTeX, Vega-Embed and Mermaid only when matching content is present. Default runtime URLs are version-pinned jsDelivr ESM modules. For offline deployments, strict Content-Security-Policy environments or private registries, override them:

Since v0.2.4, the equation dialog is centered normally whenever the MathLive virtual keyboard is hidden. When the keyboard becomes visible, WYSIME listens to MathLive keyboard visibility and geometry events, measures the real keyboard height, and docks the equation dialog immediately above it. The keyboard host remains a direct child of the native `<dialog>` only to stay in the browser top layer and remain clickable above the modal backdrop; it is transparent and does not reserve a white spacer in the dialog layout. WYSIME keeps manual keyboard policy and explicitly opens the keyboard when the math field receives focus.

```javascript
new WYSIMEditor("#description", {
  visualRuntime: {
    mathlive: "/vendor/mathlive/mathlive.mjs",
    katex: "/vendor/katex/katex.mjs",
    katexCss: "/vendor/katex/katex.min.css",
    vegaEmbed: "/vendor/vega-embed/index.mjs",
    mermaid: "/vendor/mermaid/mermaid.esm.mjs"
  }
});
```

Chart categories preserve the exact order written in the `chart` data block. WYSIME disables Vega-Lite's default ascending sort for categorical channels; line/area paths and pie sectors also keep source order.

For standalone Markdown rendering, `markdownToHtml()` creates safe visual placeholders. Call `hydrateVisuals()` after inserting that HTML into the DOM:

```javascript
import { markdownToHtml, hydrateVisuals } from "wysime";

container.innerHTML = markdownToHtml(markdown);
await hydrateVisuals(container);
```

The visual DOM is disposable. The original LaTeX, chart DSL or Mermaid source is stored in encoded metadata and is what `htmlToMarkdown()` serializes back to Markdown.
