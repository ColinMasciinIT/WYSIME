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
