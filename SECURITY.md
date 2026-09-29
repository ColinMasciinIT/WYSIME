# Security policy

## Supported versions

Security fixes are currently applied to the latest `0.x` release while the API stabilizes.

## Reporting a vulnerability

Please do not open a public issue for a suspected security vulnerability. Once the repository is public, prefer a private GitHub Security Advisory. Include:

- a description of the issue;
- minimal reproduction steps;
- affected browser/runtime versions;
- the expected security impact.

## Security design

WYSIME treats generated HTML as untrusted output. Rendering passes through DOMPurify and then through an additional policy that restricts URLs and inline styles. Integrators must still validate uploaded files and generated URLs on their server.
