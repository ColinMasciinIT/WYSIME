# Origin and architecture

## Origin

WYSIME (What You See Is Markdown Editor) was originally designed and created by **Colin Timaxian** as an editorial Markdown/WYSIWYG editing experience, then extracted and redesigned as a standalone reusable library.

This repository contains the standalone editor, not the host application in which the original editing experience was first used. Application-specific routes, authentication, storage, business logic and private configuration are deliberately excluded.

## What was intentionally removed

The standalone project does not contain:

- host-application route discovery;
- application-specific links or identifiers;
- private upload endpoints;
- storage-volume names;
- authentication or authorization logic;
- business-specific field IDs;
- application-specific automatic editor discovery;
- administration or business logic;
- identity-provider configuration.

Those concerns are represented by generic options and callback hooks.

## Core design principles

The editor keeps the following design principles:

- Markdown is the canonical persisted format;
- a `contenteditable` surface provides WYSIWYG editing;
- HTML is explicitly serialized back to Markdown;
- image width can be preserved as a Markdown extension;
- task items, tables, links and code blocks are first-class editing operations;
- editorial callouts and procedural `:::steps` blocks are supported;
- upload capability is controlled by the host integration;
- rendered and pasted HTML is sanitized.

## Standalone redesign

The standalone implementation avoids the deprecated `document.execCommand()` API. Editing operations use Selection, Range and DOM transformations in `src/dom.js`.

Host integration is intentionally explicit:

- `uploadImage(file, editor)` controls file storage;
- `internalLinks` exposes host navigation choices;
- optional dialog callbacks allow custom application UX.

## Runtime architecture

```text
Markdown string
     |
     v
markdown.js
     |  Markdown -> HTML
     v
sanitize.js ------> DOMPurify + URL/style policy
     |
     v
contenteditable DOM
     |
     |  user edits / Selection / Range
     v
html-to-markdown.js
     |
     v
canonical Markdown string
```

## Trust boundaries

WYSIME does not make a server upload safe. The host application remains responsible for:

- authentication;
- authorization;
- upload size limits;
- file signature/MIME validation;
- malware scanning where required;
- object naming and path traversal prevention;
- storage lifecycle;
- secure download/serving headers.
