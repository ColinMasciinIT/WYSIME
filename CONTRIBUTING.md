# Contributing to WYSIME

Thank you for considering a contribution to WYSIME (What You See Is Markdown Editor).

## Local development

```bash
npm install
npm run dev
```

Run the test suite before submitting a change:

```bash
npm test
npm run build
```

## Design constraints

The core editor intentionally remains framework-free. Contributions should avoid introducing a full rich-text editor framework into the runtime dependency tree.

Security-sensitive changes to HTML rendering, URL validation, file handling or sanitization should include tests.

## Attribution

WYSIME was originally created by Colin Timaxian. New contributions remain attributed through Git history and release notes where appropriate.
