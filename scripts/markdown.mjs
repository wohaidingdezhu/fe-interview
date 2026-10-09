import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

const parser = unified().use(remarkParse).use(remarkGfm);
export function markdownNodes(content, types) {
  const matches = [], wanted = new Set(types);
  function visit(node) {
    if (wanted.has(node.type)) matches.push(node);
    for (const child of node.children ?? []) visit(child);
  }
  visit(parser.parse(content)); return matches;
}

export function withoutDefinitions(content) {
  const definitions = markdownNodes(content, ['definition']);
  let result = content;
  for (const node of definitions.toReversed()) result = result.slice(0, node.position.start.offset) + result.slice(node.position.end.offset);
  return result.trim();
}
