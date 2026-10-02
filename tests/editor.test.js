import { describe, expect, it, vi } from "vitest";
import { WYSIMEditor } from "../src/editor.js";

function selectText(root, text) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const index = node.textContent.indexOf(text);
    if (index < 0) continue;
    const range = document.createRange();
    range.setStart(node, index);
    range.setEnd(node, index + text.length);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    root.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    return range;
  }
  throw new Error(`Text not found: ${text}`);
}

async function nextTick() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("WYSIMEditor", () => {
  it("mounts on a textarea and synchronizes markdown", () => {
    document.body.innerHTML = '<textarea id="source"># Bonjour</textarea>';
    const source = document.querySelector("#source");
    const editor = new WYSIMEditor(source);

    expect(source.classList.contains("wysime-source-hidden")).toBe(true);
    expect(editor.editor.innerHTML).toContain("<h1>Bonjour</h1>");

    editor.setMarkdown("## Nouveau", { emit: false });
    expect(editor.getMarkdown()).toBe("## Nouveau");
    expect(source.value).toBe("## Nouveau");

    editor.destroy();
    expect(source.classList.contains("wysime-source-hidden")).toBe(false);
  });

  it("supports a mount element without a textarea", () => {
    document.body.innerHTML = '<div id="mount"></div>';
    const editor = new WYSIMEditor("#mount", { initialValue: "**Hello**" });
    expect(editor.getMarkdown()).toBe("**Hello**");
    editor.destroy();
  });

  it("emits change callbacks", () => {
    document.body.innerHTML = '<textarea id="source"></textarea>';
    const onChange = vi.fn();
    const editor = new WYSIMEditor("#source", { onChange });
    editor.setMarkdown("Texte");
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)[0]).toBe("Texte");
    editor.destroy();
  });

  it("toggles read only mode", () => {
    document.body.innerHTML = '<textarea id="source">Texte</textarea>';
    const editor = new WYSIMEditor("#source");
    editor.setReadOnly(true);
    expect(editor.editor.contentEditable).toBe("false");
    expect(editor.host.classList.contains("wysime-readonly")).toBe(true);
    editor.setReadOnly(false);
    expect(editor.editor.contentEditable).toBe("true");
    editor.destroy();
  });

  it("applies inline formatting to the selected text", () => {
    document.body.innerHTML = '<textarea id="source">Avant cible après</textarea>';
    const editor = new WYSIMEditor("#source");
    selectText(editor.editor, "cible");

    const button = editor.toolbar.querySelector('[data-inline="strong"]');
    button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    button.click();

    expect(editor.editor.innerHTML).toContain("<strong>cible</strong>");
    expect(editor.getMarkdown()).toContain("Avant **cible** après");
    editor.destroy();
  });

  it.each([
    ["strong", "strong"],
    ["em", "em"],
    ["u", "u"],
    ["del", "del"],
    ["sub", "sub"],
    ["sup", "sup"],
    ["code", "code"]
  ])("toggles %s formatting off when the same action is clicked again", (format, selector) => {
    document.body.innerHTML = '<textarea id="source">Avant cible après</textarea>';
    const editor = new WYSIMEditor("#source");
    selectText(editor.editor, "cible");

    const button = editor.toolbar.querySelector(`[data-inline="${format}"]`);
    button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    button.click();

    expect(editor.editor.querySelector(selector)?.textContent).toBe("cible");
    expect(window.getSelection().toString()).toBe("cible");

    button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    button.click();

    expect(editor.editor.querySelector(selector)).toBeNull();
    expect(editor.editor.textContent).toContain("Avant cible après");
    expect(editor.getMarkdown()).toBe("Avant cible après");
    expect(window.getSelection().toString()).toBe("cible");
    editor.destroy();
  });

  it("removes only the toggled modifier and preserves nested inline formatting", () => {
    document.body.innerHTML = '<textarea id="source">**Avant *cible* après**</textarea>';
    const editor = new WYSIMEditor("#source");
    selectText(editor.editor, "cible");

    const button = editor.toolbar.querySelector('[data-inline="strong"]');
    button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    button.click();

    const italic = Array.from(editor.editor.querySelectorAll("em")).find((node) => node.textContent === "cible");
    expect(italic).not.toBeNull();
    expect(italic.closest("strong,b")).toBeNull();
    expect(window.getSelection().toString()).toBe("cible");
    editor.destroy();
  });

  it("keeps the selected range while an asynchronous block action opens", async () => {
    document.body.innerHTML = '<textarea id="source">Avant code choisi après</textarea>';
    const codeDialog = vi.fn(async (selection) => ({ language: "javascript", code: selection }));
    const editor = new WYSIMEditor("#source", { codeDialog });
    selectText(editor.editor, "code choisi");

    const button = editor.toolbar.querySelector('[data-action="code-block"]');
    button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    button.click();
    await nextTick();

    expect(codeDialog).toHaveBeenCalled();
    expect(codeDialog.mock.calls[0][0]).toBe("code choisi");
    expect(editor.getMarkdown()).toContain("```javascript\ncode choisi\n```");
    expect(editor.getMarkdown()).not.toContain("Avant code choisi après");
    editor.destroy();
  });

  it("shows contextual table controls and edits rows, columns and headers", () => {
    document.body.innerHTML = '<textarea id="source">| A | B |\n| --- | --- |\n| 1 | 2 |</textarea>';
    const editor = new WYSIMEditor("#source");
    const table = editor.editor.querySelector("table");
    const bodyCell = table.querySelector("tbody td");
    bodyCell.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    let popover = document.querySelector(".wysime-table-popover");
    expect(popover).not.toBeNull();

    popover.querySelector('[data-table-action="add-row"]').click();
    expect(table.rows.length).toBe(3);

    popover.querySelector('[data-table-action="add-column"]').click();
    expect(table.rows[0].cells.length).toBe(3);

    popover.querySelector('[data-table-action="edit"]').click();
    popover.querySelector("[data-table-header-column]").checked = true;
    popover.querySelector('[data-table-action="apply-options"]').click();
    expect(Array.from(table.tBodies[0].rows).every((row) => row.cells[0].tagName === "TH")).toBe(true);

    popover.querySelector('[data-table-action="remove-column"]').click();
    expect(table.rows[0].cells.length).toBe(2);

    popover.querySelector('[data-table-action="remove-row"]').click();
    expect(table.rows.length).toBe(2);

    popover.querySelector('[data-table-action="delete"]').click();
    expect(editor.editor.querySelector("table")).toBeNull();
    expect(document.querySelector(".wysime-table-popover")).toBeNull();
    editor.destroy();
  });


  it("opens a modal with the generated Markdown from the toolbar", async () => {
    document.body.innerHTML = '<textarea id="source"># Title\n\n**Bold** and `code`</textarea>';
    const editor = new WYSIMEditor("#source");

    const button = editor.toolbar.querySelector('[data-action="markdown-preview"]');
    expect(button).not.toBeNull();
    expect(button.querySelector("svg")).not.toBeNull();

    button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    button.click();
    await nextTick();

    const dialog = document.querySelector(".wysime-markdown-dialog");
    expect(dialog).not.toBeNull();
    expect(dialog.querySelector("[data-markdown-preview]").value).toBe(editor.getMarkdown());

    dialog.querySelector("[data-confirm]").click();
    await nextTick();
    expect(document.querySelector(".wysime-markdown-dialog")).toBeNull();
    editor.destroy();
  });


  it("edits an existing block equation from its pencil control without polluting output", async () => {
    document.body.innerHTML = '<textarea id="source">$$\nx^2\n$$</textarea>';
    const katexModule = 'export default { renderToString(value) { return `<span class="fake-katex">${value}</span>`; } };';
    const katexUrl = `data:text/javascript,${encodeURIComponent(katexModule)}`;
    const equationDialog = vi.fn(async () => ({ latex: "y=2x", display: true }));
    const editor = new WYSIMEditor("#source", {
      equationDialog,
      visualRuntime: { katex: katexUrl, katexCss: "" }
    });

    await editor.hydrateVisuals();
    const editButton = editor.editor.querySelector("[data-wysime-edit-math]");
    expect(editButton).not.toBeNull();
    expect(editor.getHtml()).not.toContain("data-wysime-edit-math");

    editButton.click();
    await nextTick();
    await nextTick();

    expect(equationDialog).toHaveBeenCalled();
    expect(equationDialog.mock.calls[0][0]).toBe("x^2");
    expect(equationDialog.mock.calls[0][1]).toMatchObject({ display: true, mode: "edit" });
    expect(editor.getMarkdown()).toBe("$$\ny=2x\n$$");
    editor.destroy();
  });

  it("can render the editor interface in English", () => {
    document.body.innerHTML = '<textarea id="source"></textarea>';
    const editor = new WYSIMEditor("#source", { locale: "en" });
    expect(editor.toolbar.getAttribute("aria-label")).toBe("Content formatting");
    expect(editor.toolbar.querySelector('[data-action="table"]').getAttribute("title")).toBe("Insert table");
    expect(editor.toolbar.querySelector('[data-action="markdown-preview"]').getAttribute("title")).toBe("View generated Markdown");
    expect(editor.editor.dataset.placeholder).toBe("Start writing…");
    editor.destroy();
  });
});
