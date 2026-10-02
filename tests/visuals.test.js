import { describe, expect, it } from "vitest";
import { markdownToHtml } from "../src/markdown.js";
import { htmlToMarkdown } from "../src/html-to-markdown.js";
import { parseNaturalChart } from "../src/visuals.js";

describe("equations and visual blocks", () => {
  it("renders and serializes inline math", () => {
    const markdown = "Einstein: $E = mc^2$.";
    const html = markdownToHtml(markdown);
    expect(html).toContain('data-wysime-kind="math"');
    expect(htmlToMarkdown(html)).toBe(markdown);
  });

  it("renders and serializes block math", () => {
    const markdown = "$$\n\\frac{a+b}{c}\n$$";
    const html = markdownToHtml(markdown);
    expect(html).toContain('data-wysime-display="block"');
    expect(htmlToMarkdown(html)).toBe(markdown);
  });

  it("keeps chart blocks canonical", () => {
    const markdown = '```chart\nbar "Revenue"\nJan: 12\nFeb: 18\n```';
    const html = markdownToHtml(markdown);
    expect(html).toContain('data-wysime-kind="chart"');
    expect(htmlToMarkdown(html)).toBe(markdown);
  });

  it("keeps Mermaid blocks canonical", () => {
    const markdown = "```mermaid\nflowchart LR\n  A --> B\n```";
    const html = markdownToHtml(markdown);
    expect(html).toContain('data-wysime-kind="mermaid"');
    expect(htmlToMarkdown(html)).toBe(markdown);
  });

  it("can disable equations and charts during rendering", () => {
    expect(markdownToHtml("$x$", { equations: false })).not.toContain("data-wysime-kind");
    expect(markdownToHtml("```chart\nbar\nA: 1\n```", { charts: false })).toContain("language-chart");
  });
});

describe("natural chart parser", () => {
  it("builds a bar Vega-Lite spec", () => {
    const spec = parseNaturalChart('bar "Revenue"\nunit: €\nJanvier: 12000\nFévrier: 15500');
    expect(spec.mark.type).toBe("bar");
    expect(spec.title).toBe("Revenue");
    expect(spec.data.values).toEqual([
      { category: "Janvier", value: 12000 },
      { category: "Février", value: 15500 }
    ]);
    expect(spec.encoding.x.sort).toBeNull();
  });

  it("preserves the written category order for pie charts", () => {
    const spec = parseNaturalChart('pie "Parts"\nZeta: 10\nAlpha: 20\nBeta: 30');
    expect(spec.data.values.map((row) => row.category)).toEqual(["Zeta", "Alpha", "Beta"]);
    expect(spec.encoding.color.sort).toBeNull();
    expect(spec.encoding.order).toEqual({ value: null });
  });

  it("keeps line points in source order", () => {
    const spec = parseNaturalChart('line "Order"\nC: 3\nA: 1\nB: 2');
    expect(spec.data.values.map((row) => row.category)).toEqual(["C", "A", "B"]);
    expect(spec.encoding.x.sort).toBeNull();
    expect(spec.encoding.order).toEqual({ value: null });
  });

  it("builds a scatter Vega-Lite spec", () => {
    const spec = parseNaturalChart("scatter \"Test\"\n1,2\n2,4");
    expect(spec.mark.type).toBe("point");
    expect(spec.data.values).toEqual([{ x: 1, y: 2 }, { x: 2, y: 4 }]);
  });
});
