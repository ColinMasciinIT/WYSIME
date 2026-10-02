/**
 * WYSIME - What You See Is Markdown Editor
 * Copyright (c) 2026 Colin Timaxian
 * SPDX-License-Identifier: MIT
 */
export interface InternalLink {
  label: string;
  href: string;
}

export interface ImageUploadResult {
  url: string;
  alt?: string;
  filename?: string;
  width?: string;
}

export interface SanitizerOptions {
  allowDataImages?: boolean;
  allowBlobImages?: boolean;
  allowRelativeLinks?: boolean;
  allowRelativeImages?: boolean;
}

export interface LinkDialogResult {
  href: string;
  label?: string;
  title?: string;
}

export interface TableDialogResult {
  rows: number;
  cols: number;
  headerRow?: boolean;
  headerColumn?: boolean;
}

export interface CodeDialogResult {
  language?: string;
  code: string;
}

export interface CalloutDialogResult {
  type: "info" | "attention" | "succes" | "critique" | "danger" | string;
  title?: string;
  content: string;
}

export interface VisualRuntimeOptions {
  mathlive?: string;
  katex?: string;
  katexCss?: string;
  vegaEmbed?: string;
  mermaid?: string;
}

export interface EquationDialogResult {
  latex: string;
  display?: boolean;
}

export interface VisualDialogResult {
  kind: "chart" | "mermaid";
  source: string;
}

export interface EditorOptions {
  locale?: "fr" | "en";
  images?: boolean;
  equations?: boolean;
  charts?: boolean;
  diagrams?: boolean;
  visualRuntime?: VisualRuntimeOptions;
  uploadImage?: (file: File, editor: WYSIMEditor) => Promise<string | ImageUploadResult>;
  maxImageBytes?: number;
  acceptedImageTypes?: string[];
  initialValue?: string;
  placeholder?: string;
  readOnly?: boolean;
  autofocus?: boolean;
  internalLinks?: InternalLink[];
  sanitizeOptions?: SanitizerOptions;
  onChange?: (markdown: string, editor: WYSIMEditor) => void;
  linkDialog?: (selection: string, options: { internalLinks: InternalLink[]; locale: "fr" | "en" }) => Promise<LinkDialogResult | null>;
  tableDialog?: (options: { locale: "fr" | "en" }) => Promise<TableDialogResult | null>;
  codeDialog?: (selection: string, options: { locale: "fr" | "en" }) => Promise<CodeDialogResult | null>;
  calloutDialog?: (selection: string, options: { locale: "fr" | "en" }) => Promise<CalloutDialogResult | null>;
  stepsDialog?: (selection: string, options: { locale: "fr" | "en" }) => Promise<string[] | null>;
  equationDialog?: (selection: string, options: { locale: "fr" | "en"; visualRuntime: VisualRuntimeOptions; display?: boolean; mode?: "insert" | "edit" }) => Promise<EquationDialogResult | null>;
  visualDialog?: (options: { locale: "fr" | "en"; visualRuntime: VisualRuntimeOptions }) => Promise<VisualDialogResult | null>;
}

export interface MarkdownRenderOptions {
  sanitize?: boolean;
  sanitizerOptions?: SanitizerOptions;
}

export class WYSIMEditor {
  constructor(target: string | Element, options?: EditorOptions);
  readonly target: Element;
  readonly host: HTMLDivElement;
  readonly editor: HTMLDivElement;
  readonly source: HTMLTextAreaElement | null;

  getMarkdown(): string;
  setMarkdown(markdown: string, options?: { emit?: boolean }): this;
  getHtml(): string;
  insertMarkdown(markdown: string): this;
  insertHtml(html: string): this;
  hydrateVisuals(): Promise<this>;
  focus(): this;
  setReadOnly(readOnly?: boolean): this;
  destroy(): void;
}

export function markdownToHtml(markdown: string, options?: MarkdownRenderOptions): string;
export function htmlToMarkdown(input: string | Element, options?: MarkdownRenderOptions): string;
export function renderInline(value: string, options?: MarkdownRenderOptions): string;
export function stripFrontMatter(markdown: string): string;
export function sanitizeHtml(html: string, options?: SanitizerOptions): string;
export function escapeHtml(value: unknown): string;
export function escapeAttribute(value: unknown): string;
export function isAllowedLinkUrl(value: string, options?: SanitizerOptions): boolean;
export function isAllowedImageUrl(value: string, options?: SanitizerOptions): boolean;
export const DEFAULT_SANITIZE_OPTIONS: Readonly<Required<SanitizerOptions>>;
export function fileToDataUrl(file: File): Promise<string | ArrayBuffer | null>;

export const DEFAULT_VISUAL_RUNTIME: Readonly<Required<VisualRuntimeOptions>>;
export function parseNaturalChart(source: string): Record<string, unknown>;
export function hydrateVisuals(root: Element, options?: { equations?: boolean; charts?: boolean; diagrams?: boolean; visualRuntime?: VisualRuntimeOptions; locale?: "fr" | "en" }): Promise<void>;
