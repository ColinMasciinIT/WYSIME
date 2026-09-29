/**
 * WYSIME - What You See Is Markdown Editor
 * Copyright (c) 2026 Colin Timaxian
 * SPDX-License-Identifier: MIT
 */
const BLOCK_TAGS = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "BLOCKQUOTE", "LI"]);
const INLINE_FORMAT_TAGS = new Set(["STRONG", "B", "EM", "I", "U", "DEL", "S", "STRIKE", "SUB", "SUP", "CODE"]);

export function captureRange(editor) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  return editor.contains(range.commonAncestorContainer) ? range.cloneRange() : null;
}

export function restoreRange(editor, range) {
  editor.focus();
  if (!range) return false;
  try {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  } catch {
    return false;
  }
}

export function setSelection(range) {
  if (!range) return;
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

export function rangeAfter(node) {
  const range = document.createRange();
  range.setStartAfter(node);
  range.collapse(true);
  return range;
}

export function rangeInside(node, collapseToEnd = false) {
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(collapseToEnd);
  return range;
}

export function closestBlock(node, editor) {
  let current = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
  while (current && current !== editor) {
    if (BLOCK_TAGS.has(current.tagName)) return current;
    current = current.parentElement;
  }
  return null;
}

export function selectedBlocks(editor, range, allowed = BLOCK_TAGS) {
  if (!range) return [];
  const blocks = [];
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_ELEMENT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!allowed.has(node.tagName)) continue;
    try {
      if (range.intersectsNode(node)) blocks.push(node);
    } catch {
      // Ignore disconnected nodes.
    }
  }
  if (!blocks.length) {
    const block = closestBlock(range.startContainer, editor);
    if (block && allowed.has(block.tagName)) blocks.push(block);
  }
  return blocks.filter((node) => !blocks.some((other) => other !== node && other.contains(node) && allowed.has(other.tagName)));
}

function templateNodes(html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template;
}

export function insertHtmlAtRange(editor, html, range) {
  let active = range?.cloneRange?.() || captureRange(editor);
  if (!restoreRange(editor, active)) {
    active = document.createRange();
    active.selectNodeContents(editor);
    active.collapse(false);
    restoreRange(editor, active);
  }

  const template = templateNodes(html);
  const topElements = Array.from(template.content.childNodes).filter((node) => node.nodeType === Node.ELEMENT_NODE);
  const containsBlock = topElements.some((node) => ["TABLE", "PRE", "UL", "OL", "BLOCKQUOTE", "ASIDE"].includes(node.tagName));

  if (containsBlock) {
    const startBlock = closestBlock(active.startContainer, editor);
    const endBlock = closestBlock(active.endContainer, editor);
    const splittable = startBlock && startBlock === endBlock
      && startBlock.parentElement === editor
      && ["P", "DIV", "H1", "H2", "H3", "H4", "BLOCKQUOTE"].includes(startBlock.tagName);

    if (splittable) {
      const beforeRange = active.cloneRange();
      beforeRange.setStart(startBlock, 0);
      beforeRange.setEnd(active.startContainer, active.startOffset);
      const before = beforeRange.cloneContents();

      const afterRange = active.cloneRange();
      afterRange.setStart(active.endContainer, active.endOffset);
      afterRange.setEnd(startBlock, startBlock.childNodes.length);
      const after = afterRange.cloneContents();

      const beforeBlock = startBlock.cloneNode(false);
      beforeBlock.appendChild(before);
      const afterBlock = startBlock.cloneNode(false);
      afterBlock.appendChild(after);
      const hasBefore = Boolean((beforeBlock.textContent || "").trim() || beforeBlock.querySelector("img,br"));
      const hasAfter = Boolean((afterBlock.textContent || "").trim() || afterBlock.querySelector("img,br"));

      const fragment = document.createDocumentFragment();
      if (hasBefore) fragment.appendChild(beforeBlock);
      const insertedFragment = template.content.cloneNode(true);
      const insertedNodes = Array.from(insertedFragment.childNodes);
      fragment.appendChild(insertedFragment);
      if (hasAfter) fragment.appendChild(afterBlock);
      startBlock.replaceWith(fragment);

      let nextRange;
      if (hasAfter) {
        nextRange = rangeInside(afterBlock);
      } else {
        const last = insertedNodes.at(-1) || beforeBlock;
        nextRange = rangeAfter(last);
      }
      setSelection(nextRange);
      return nextRange.cloneRange();
    }
  }

  active.deleteContents();
  const fragment = active.createContextualFragment(html);
  const last = fragment.lastChild;
  active.insertNode(fragment);
  const nextRange = last ? rangeAfter(last) : active.cloneRange();
  setSelection(nextRange);
  return nextRange.cloneRange();
}

function selectPlaceholder(node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  setSelection(range);
  return range.cloneRange();
}

const INLINE_TAG_GROUPS = Object.freeze({
  strong: new Set(["STRONG", "B"]),
  em: new Set(["EM", "I"]),
  u: new Set(["U"]),
  del: new Set(["DEL", "S", "STRIKE"]),
  sub: new Set(["SUB"]),
  sup: new Set(["SUP"]),
  code: new Set(["CODE"])
});

function inlineTagGroup(tagName) {
  const tag = String(tagName || "").toLowerCase();
  return INLINE_TAG_GROUPS[tag] || new Set([tag.toUpperCase()]);
}

function commonInlineAncestor(editor, range, tagNames) {
  const endNode = range.endContainer;
  let node = range.startContainer.nodeType === Node.ELEMENT_NODE
    ? range.startContainer
    : range.startContainer.parentElement;
  let match = null;

  while (node && node !== editor) {
    if (tagNames.has(node.tagName) && (node === endNode || node.contains(endNode))) match = node;
    node = node.parentElement;
  }

  return match;
}

function unwrapMatchingTags(root, tagNames) {
  const matches = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  while (walker.nextNode()) {
    if (tagNames.has(walker.currentNode.tagName)) matches.push(walker.currentNode);
  }
  matches.reverse().forEach(unwrap);
}

function fragmentHasContent(fragment) {
  return fragment.childNodes.length > 0;
}

function removeInlineFromRange(editor, range, wrapper, tagNames) {
  const beforeRange = document.createRange();
  beforeRange.selectNodeContents(wrapper);
  beforeRange.setEnd(range.startContainer, range.startOffset);
  const before = beforeRange.cloneContents();

  const selected = range.cloneContents();
  unwrapMatchingTags(selected, tagNames);
  const selectedNodes = Array.from(selected.childNodes);

  const afterRange = document.createRange();
  afterRange.selectNodeContents(wrapper);
  afterRange.setStart(range.endContainer, range.endOffset);
  const after = afterRange.cloneContents();

  const replacement = document.createDocumentFragment();
  if (fragmentHasContent(before)) {
    const beforeWrapper = wrapper.cloneNode(false);
    beforeWrapper.appendChild(before);
    replacement.appendChild(beforeWrapper);
  }

  replacement.appendChild(selected);

  if (fragmentHasContent(after)) {
    const afterWrapper = wrapper.cloneNode(false);
    afterWrapper.appendChild(after);
    replacement.appendChild(afterWrapper);
  }

  wrapper.replaceWith(replacement);

  const first = selectedNodes[0];
  const last = selectedNodes.at(-1);
  if (!first || !last || !editor.contains(first) || !editor.contains(last)) return null;

  const result = document.createRange();
  result.setStartBefore(first);
  result.setEndAfter(last);
  setSelection(result);
  return result.cloneRange();
}

export function wrapInline(editor, range, tagName, placeholder = "texte") {
  const tag = tagName.toLowerCase();
  const active = range?.cloneRange?.() || captureRange(editor);
  if (!active) return null;
  restoreRange(editor, active);

  const wrapper = document.createElement(tag);
  if (active.collapsed) {
    wrapper.textContent = placeholder;
    active.insertNode(wrapper);
    return selectPlaceholder(wrapper);
  }

  try {
    active.surroundContents(wrapper);
  } catch {
    wrapper.appendChild(active.extractContents());
    active.insertNode(wrapper);
  }
  return selectPlaceholder(wrapper);
}

export function toggleInline(editor, range, tagName, placeholder = "texte") {
  const active = range?.cloneRange?.() || captureRange(editor);
  if (!active) return null;

  const tagNames = inlineTagGroup(tagName);
  if (!active.collapsed) {
    const wrapper = commonInlineAncestor(editor, active, tagNames);
    if (wrapper) {
      const result = removeInlineFromRange(editor, active, wrapper, tagNames);
      if (result) return result;
    }
  }

  return wrapInline(editor, active, tagName, placeholder);
}

function unwrap(element) {
  const parent = element.parentNode;
  if (!parent) return;
  while (element.firstChild) parent.insertBefore(element.firstChild, element);
  element.remove();
}

export function removeFormatting(editor, range) {
  const active = range?.cloneRange?.() || captureRange(editor);
  if (!active) return null;
  restoreRange(editor, active);

  if (active.collapsed) {
    let node = active.startContainer.nodeType === Node.ELEMENT_NODE ? active.startContainer : active.startContainer.parentElement;
    while (node && node !== editor && !INLINE_FORMAT_TAGS.has(node.tagName)) node = node.parentElement;
    if (node && node !== editor) {
      const next = rangeAfter(node);
      unwrap(node);
      setSelection(next);
      return next;
    }
    return active;
  }

  const fragment = active.extractContents();
  const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT);
  const formats = [];
  while (walker.nextNode()) {
    if (INLINE_FORMAT_TAGS.has(walker.currentNode.tagName)) formats.push(walker.currentNode);
  }
  formats.reverse().forEach(unwrap);
  const first = fragment.firstChild;
  const last = fragment.lastChild;
  active.insertNode(fragment);
  if (first && last) {
    const result = document.createRange();
    result.setStartBefore(first);
    result.setEndAfter(last);
    setSelection(result);
    return result.cloneRange();
  }
  return active;
}

function replaceTag(element, tagName) {
  const replacement = document.createElement(tagName.toLowerCase());
  for (const attr of Array.from(element.attributes)) replacement.setAttribute(attr.name, attr.value);
  while (element.firstChild) replacement.appendChild(element.firstChild);
  element.replaceWith(replacement);
  return replacement;
}

export function setBlockType(editor, range, tagName) {
  const active = range?.cloneRange?.() || captureRange(editor);
  if (!active) return null;
  const allowed = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "BLOCKQUOTE"]);
  const blocks = selectedBlocks(editor, active, allowed);
  const replacements = blocks.map((block) => replaceTag(block, tagName));
  const target = replacements.at(-1);
  if (target) {
    const result = rangeInside(target, true);
    setSelection(result);
    return result.cloneRange();
  }
  return active;
}

export function applyAlignment(editor, range, alignment) {
  const active = range?.cloneRange?.() || captureRange(editor);
  if (!active) return null;
  const blocks = selectedBlocks(editor, active);
  blocks.forEach((block) => {
    if (alignment === "left") block.style.removeProperty("text-align");
    else block.style.textAlign = alignment;
  });
  restoreRange(editor, active);
  return active;
}

function textLinesFromRange(range) {
  const text = range?.toString?.() || "";
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

export function insertList(editor, range, ordered = false, placeholder = "Élément") {
  const active = range?.cloneRange?.() || captureRange(editor);
  if (!active) return null;

  const list = document.createElement(ordered ? "ol" : "ul");
  const lines = textLinesFromRange(active);
  const values = lines.length ? lines : [placeholder];
  values.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    list.appendChild(li);
  });
  return insertHtmlAtRange(editor, list.outerHTML, active);
}

export function insertTask(editor, range, text = "Tâche") {
  const list = document.createElement("ul");
  list.className = "wysime-task-list";
  const li = document.createElement("li");
  li.className = "wysime-task";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  const span = document.createElement("span");
  span.textContent = text;
  li.append(checkbox, document.createTextNode(" "), span);
  list.appendChild(li);
  const paragraph = document.createElement("p");
  paragraph.appendChild(document.createElement("br"));

  const active = range?.cloneRange?.() || captureRange(editor);
  if (!active) return null;
  return insertHtmlAtRange(editor, `${list.outerHTML}${paragraph.outerHTML}`, active);
}
