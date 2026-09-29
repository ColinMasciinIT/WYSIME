import { describe, expect, it } from "vitest";
import { markdownToHtml, stripFrontMatter } from "../src/markdown.js";

function compact(html) {
  return html.replace(/>\s+</g, "><").trim();
}

describe("markdownToHtml", () => {
  it("renders headings and inline formatting", () => {
    const html = markdownToHtml("# Titre\n\nTexte **gras** et *italique*.");
    expect(html).toContain("<h1>Titre</h1>");
    expect(html).toContain("<strong>gras</strong>");
    expect(html).toContain("<em>italique</em>");
  });

  it("renders tasks", () => {
    const html = compact(markdownToHtml("- [x] Fait\n- [ ] A faire"));
    expect(html).toContain('class="wysime-task-list"');
    expect(html).toContain('type="checkbox" checked');
    expect(html).toContain('class="wysime-task"');
  });

  it("renders editorial callouts", () => {
    const html = compact(markdownToHtml(":::attention Avant de commencer\nVérifiez **les droits**.\n:::"));
    expect(html).toContain("wysime-callout-attention");
    expect(html).toContain("Avant de commencer");
    expect(html).toContain("<strong>les droits</strong>");
  });

  it("renders steps", () => {
    const html = compact(markdownToHtml(":::steps\n1. Première étape\n2. Deuxième étape\n:::"));
    expect(html).toContain('class="wysime-steps"');
    expect(html).toContain("Première étape");
    expect(html).toContain("Deuxième étape");
  });

  it("renders image width metadata", () => {
    const html = markdownToHtml("![Plan](/img/plan.png){width=70%}");
    expect(html).toContain('src="/img/plan.png"');
    expect(html).toContain('alt="Plan"');
    expect(html).toContain("width:70%");
  });

  it("removes unsafe HTML and URLs", () => {
    const html = markdownToHtml('<script>alert(1)</script>\n\n[bad](javascript:alert(1))\n\n![bad](javascript:alert(1))');
    expect(html).not.toContain("<script");
    expect(html).not.toContain('href="javascript:');
    expect(html).not.toContain('src="javascript:');
  });
});

describe("stripFrontMatter", () => {
  it("removes a leading front matter block", () => {
    expect(stripFrontMatter("---\ntitle: Test\n---\n\n# Visible")).toBe("# Visible");
  });
});
