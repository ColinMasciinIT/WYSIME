/**
 * WYSIME - What You See Is Markdown Editor
 * Copyright (c) 2026 Colin Timaxian
 * SPDX-License-Identifier: MIT
 */
const icon = (path, viewBox = "0 0 18 18") => `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false">${path}</svg>`;

export const icons = {
  chevron: icon('<path d="m4 7 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  image: icon('<rect x="2" y="3" width="14" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="7" r="1.4" fill="currentColor"/><path d="m3.5 13 3.4-3.4 2.3 2.1 2.2-2.3 3.1 3.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'),
  table: icon('<rect x="2" y="3" width="14" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2 7h14M2 11h14M7 3v12M12 3v12" fill="none" stroke="currentColor" stroke-width="1.2"/>'),
  link: icon('<path d="M7.2 11.2 5.6 12.8a3 3 0 0 1-4.2-4.2L4 6a3 3 0 0 1 4.2 0M10.8 6.8l1.6-1.6a3 3 0 1 1 4.2 4.2L14 12a3 3 0 0 1-4.2 0M6.5 9h5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'),
  align: icon('<path d="M3 4h12M5 7h8M3 10h12M6 13h6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'),
  code: icon('<path d="m6.5 5-4 4 4 4M11.5 5l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'),
  markdown: icon('<rect x="2.5" y="4" width="13" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M4.7 11V7l2.1 2 2.1-2v4M11 8.5h3M12.5 7v3" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>'),
  callout: icon('<path d="M4 3h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M9 6v3M9 11h.01" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'),
  steps: icon('<circle cx="4" cy="5" r="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="4" cy="13" r="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M7 5h8M7 13h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'),
  quote: icon('<path d="M4 5h4v4H5.5A3.5 3.5 0 0 1 4 12M11 5h4v4h-2.5a3.5 3.5 0 0 1-1.5 3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>')
};
