import { createLowlight } from 'lowlight';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import http from 'highlight.js/lib/languages/http';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import nginx from 'highlight.js/lib/languages/nginx';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const highlighter = createLowlight({ bash, css, dockerfile, http, javascript, json, nginx, sql, typescript, xml });
const aliases: Readonly<Record<string, string>> = {
  js: 'javascript', jsx: 'javascript', javascript: 'javascript',
  ts: 'typescript', tsx: 'typescript', typescript: 'typescript',
  html: 'xml', vue: 'xml', xml: 'xml', shell: 'bash', sh: 'bash',
};

function text(node: HastNode): string {
  if (node.type === 'text') return node.value ?? '';
  return node.children?.map(text).join('') ?? '';
}

function transform(node: HastNode, parent?: HastNode): void {
  if (node.type === 'element' && node.tagName === 'code' && parent?.tagName === 'pre') {
    const classes = Array.isArray(node.properties?.className) ? node.properties.className.map(String) : [];
    const languageClass = classes.find(name => name.startsWith('language-'));
    const requested = languageClass?.slice('language-'.length).toLocaleLowerCase();
    const language = requested ? aliases[requested] ?? requested : '';
    if (language && highlighter.registered(language)) {
      const result = highlighter.highlight(language, text(node));
      node.children = result.children as HastNode[];
      node.properties = { ...node.properties, className: ['hljs', ...classes.filter(name => name !== 'hljs')] };
    }
  }
  for (const child of node.children ?? []) transform(child, node);
}

/** 只注册资料库实际使用的语言，避免把完整 Highlight.js 常用语言集合发送给每位读者。 */
export default function rehypeCodeHighlight() {
  return (tree: unknown) => transform(tree as HastNode);
}
