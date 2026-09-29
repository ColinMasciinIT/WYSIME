import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceFiles = [
  "src/editor.js",
  "src/dom.js",
  "src/markdown.js",
  "src/html-to-markdown.js",
  "src/sanitize.js",
  "src/dialogs.js",
  "src/i18n.js",
  "src/icons.js",
  "src/index.js"
];

const projectRoot = process.cwd();

async function readSources() {
  return Promise.all(sourceFiles.map((file) => readFile(resolve(projectRoot, file), "utf8")));
}

describe("architecture constraints", () => {
  it("does not depend on document.execCommand", async () => {
    const sources = await readSources();
    expect(sources.join("\n")).not.toContain("execCommand");
  });

  it("does not hard-code a host application upload API", async () => {
    const sources = await readSources();
    const joined = sources.join("\n");
    expect(joined).not.toContain("/api/uploads");
    expect(joined).not.toContain("service-hub");
  });

  it("contains no legacy project branding", async () => {
    const sources = await readSources();
    const joined = sources.join("\n");
    expect(joined.toLowerCase()).not.toContain(["mas", "ciin"].join(""));
    expect(joined).not.toContain(["m", "me-"].join(""));
  });
});
