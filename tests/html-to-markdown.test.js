import { describe, expect, it } from "vitest";
import { htmlToMarkdown } from "../src/html-to-markdown.js";
import { markdownToHtml } from "../src/markdown.js";

describe("htmlToMarkdown", () => {
  it("serializes basic formatting", () => {
    const markdown = htmlToMarkdown("<h2>Titre</h2><p>Un <strong>texte</strong> <em>riche</em>.</p>");
    expect(markdown).toBe("## Titre\n\nUn **texte** *riche*.");
  });

  it("serializes tasks", () => {
    const markdown = htmlToMarkdown('<ul class="wysime-task-list"><li class="wysime-task"><input type="checkbox" checked><span>Fait</span></li></ul>');
    expect(markdown).toBe("- [x] Fait");
  });

  it("serializes image width metadata", () => {
    const markdown = htmlToMarkdown('<p><img src="/img/a.png" alt="A" style="width:60%;height:auto"></p>');
    expect(markdown).toBe("![A](/img/a.png){width=60%}");
  });

  it("serializes callouts", () => {
    const markdown = htmlToMarkdown('<aside class="wysime-callout wysime-callout-info" data-callout="info" data-title="À savoir"><div class="wysime-callout-title">À savoir</div><div class="wysime-callout-content"><p>Texte</p></div></aside>');
    expect(markdown).toBe(":::info À savoir\nTexte\n:::");
  });

  it("serializes markdown-compatible tables", () => {
    const markdown = htmlToMarkdown("<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>");
    expect(markdown).toContain("| A | B |");
    expect(markdown).toContain("| --- | --- |");
    expect(markdown).toContain("| 1 | 2 |");
  });

  it("does not persist contextual editor classes in HTML tables", () => {
    const markdown = htmlToMarkdown('<table class="wysime-table-active"><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><th>1</th><td>2</td></tr></tbody></table>');
    expect(markdown).toContain("<table>");
    expect(markdown).not.toContain("wysime-table-active");
  });

  it("round-trips the editorial subset", () => {
    const source = "## Test\n\n- [x] OK\n\n:::danger\nAttention **forte**.\n:::\n";
    const markdown = htmlToMarkdown(markdownToHtml(source));
    expect(markdown).toContain("## Test");
    expect(markdown).toContain("- [x] OK");
    expect(markdown).toContain(":::danger");
    expect(markdown).toContain("**forte**");
  });
});
