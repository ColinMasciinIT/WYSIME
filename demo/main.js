import { WYSIMEditor, fileToDataUrl } from "../src/index.js";
import "./demo.css";

const EXAMPLES = {
  fr: `# Documentation projet

Bienvenue dans **WYSIME — What You See Is Markdown Editor**, un éditeur Markdown WYSIWYG développé en JavaScript natif.

:::info Pourquoi Markdown-first ?
Le contenu enregistré reste du **Markdown lisible**, transportable et versionnable dans Git.
:::

## Fonctionnalités

- Mise en forme riche sans framework d'éditeur
- [x] Listes de tâches
- [ ] Upload d'images configurable
- Tableaux éditables et blocs de code
- Encadrés éditoriaux et procédures

:::steps
1. **Écrivez votre contenu**
   Utilisez la barre d'outils comme dans un traitement de texte.
2. **Récupérez le Markdown**
   Appelez \`editor.getMarkdown()\` ou écoutez \`onChange\`.
3. **Branchez votre stockage**
   Fournissez une fonction \`uploadImage(file)\` adaptée à votre backend.
:::

## Exemple de tableau

| Fonction | État | Note |
| --- | --- | --- |
| WYSIWYG | Prêt | Framework-free |
| Markdown | Prêt | Format canonique |
| Upload | Adaptateur | Fourni par l'hôte |

## Équation

La relation d’Einstein est $E = mc^2$.

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

## Graphique

\`\`\`chart
bar "Chiffre d’affaires"
unit: €
Janvier: 12000
Février: 15500
Mars: 18200
\`\`\`

## Diagramme

\`\`\`mermaid
flowchart LR
  A[Markdown] --> B[WYSIME]
  B --> C[Rendu visuel]
\`\`\`

## Exemple de code

\`\`\`javascript
const editor = new WYSIMEditor("#editor", {
  locale: "fr",
  uploadImage: async (file) => ({ url: await upload(file) })
});
\`\`\`

:::attention Sécurité
Le HTML généré est nettoyé avec DOMPurify, mais votre serveur doit également contrôler les fichiers téléversés.
:::
`,
  en: `# Project documentation

Welcome to **WYSIME — What You See Is Markdown Editor**, a Markdown WYSIWYG editor written in vanilla JavaScript.

:::info Why Markdown-first?
Stored content remains **readable Markdown** that can be moved between systems and versioned in Git.
:::

## Features

- Rich formatting without an editor framework
- [x] Task lists
- [ ] Configurable image uploads
- Editable tables and code blocks
- Editorial callouts and step-by-step procedures

:::steps
1. **Write your content**
   Use the toolbar like a regular word processor.
2. **Read the Markdown**
   Call \`editor.getMarkdown()\` or listen to \`onChange\`.
3. **Connect your storage**
   Provide an \`uploadImage(file)\` function for your backend.
:::

## Table example

| Feature | Status | Note |
| --- | --- | --- |
| WYSIWYG | Ready | Framework-free |
| Markdown | Ready | Canonical format |
| Upload | Adapter | Provided by the host |

## Equation

Einstein’s relation is $E = mc^2$.

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

## Chart

\`\`\`chart
bar "Revenue"
unit: €
January: 12000
February: 15500
March: 18200
\`\`\`

## Diagram

\`\`\`mermaid
flowchart LR
  A[Markdown] --> B[WYSIME]
  B --> C[Visual rendering]
\`\`\`

## Code example

\`\`\`javascript
const editor = new WYSIMEditor("#editor", {
  locale: "en",
  uploadImage: async (file) => ({ url: await upload(file) })
});
\`\`\`

:::attention Security
Generated HTML is sanitized with DOMPurify, but your server should also validate uploaded files.
:::
`
};

const UI = {
  fr: {
    htmlLang: "fr",
    intro: '<strong>What You See Is Markdown Editor</strong> - un éditeur Markdown WYSIWYG léger et sans framework d\'édition.',
    editor: "Éditeur",
    reload: "Recharger l'exemple",
    read: "Mode lecture",
    edit: "Mode édition",
    markdown: "Markdown généré",
    chars: (count) => `${count.toLocaleString("fr-FR")} caractères`,
    note: '<strong>Images :</strong> cette démo les convertit en Data URL uniquement pour fonctionner sans serveur. En production, fournissez votre propre fonction <code>uploadImage(file)</code>.'
  },
  en: {
    htmlLang: "en",
    intro: '<strong>What You See Is Markdown Editor</strong> - a lightweight Markdown WYSIWYG editor with no editor framework.',
    editor: "Editor",
    reload: "Reload example",
    read: "Read-only mode",
    edit: "Edit mode",
    markdown: "Generated Markdown",
    chars: (count) => `${count.toLocaleString("en-US")} characters`,
    note: '<strong>Images:</strong> this demo converts them to Data URLs so it can run without a server. In production, provide your own <code>uploadImage(file)</code> function.'
  }
};

const source = document.querySelector("#editor-source");
const output = document.querySelector("#markdown-output");
const count = document.querySelector("#char-count");
const loadExampleButton = document.querySelector("#load-example");
const readOnlyButton = document.querySelector("#toggle-readonly");
let locale = "fr";
let readOnly = false;
let editor = null;

function renderSource(markdown) {
  output.textContent = markdown;
  count.textContent = UI[locale].chars(markdown.length);
}

function createEditor(value) {
  editor?.destroy();
  source.value = value;
  editor = new WYSIMEditor(source, {
    locale,
    placeholder: locale === "fr" ? "Commencez à écrire…" : "Start writing…",
    uploadImage: async (file) => ({
      url: await fileToDataUrl(file),
      alt: file.name,
      width: "60%"
    }),
    internalLinks: locale === "fr"
      ? [
          { label: "Accueil", href: "/" },
          { label: "Documentation", href: "#documentation" },
          { label: "Support", href: "/support" }
        ]
      : [
          { label: "Home", href: "/" },
          { label: "Documentation", href: "#documentation" },
          { label: "Support", href: "/support" }
        ],
    onChange(markdown) {
      renderSource(markdown);
    }
  });
  editor.setReadOnly(readOnly);
  renderSource(editor.getMarkdown());
  window.demoEditor = editor;
}

function applyLocale(nextLocale, { loadExample = true } = {}) {
  locale = nextLocale === "en" ? "en" : "fr";
  const ui = UI[locale];
  document.documentElement.lang = ui.htmlLang;
  document.querySelector("#demo-intro").innerHTML = ui.intro;
  document.querySelector("#editor-label").textContent = ui.editor;
  document.querySelector("#markdown-label").textContent = ui.markdown;
  document.querySelector("#demo-note").innerHTML = ui.note;
  loadExampleButton.textContent = ui.reload;
  readOnlyButton.textContent = readOnly ? ui.edit : ui.read;
  document.querySelectorAll("[data-locale]").forEach((button) => {
    const active = button.dataset.locale === locale;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  createEditor(loadExample ? EXAMPLES[locale] : (editor?.getMarkdown() || EXAMPLES[locale]));
}

loadExampleButton.addEventListener("click", () => editor.setMarkdown(EXAMPLES[locale]));

readOnlyButton.addEventListener("click", (event) => {
  readOnly = !readOnly;
  editor.setReadOnly(readOnly);
  event.currentTarget.textContent = readOnly ? UI[locale].edit : UI[locale].read;
});

document.querySelectorAll("[data-locale]").forEach((button) => {
  button.addEventListener("click", () => applyLocale(button.dataset.locale));
});

applyLocale("fr");
