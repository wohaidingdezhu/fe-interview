import type { Root } from 'mdast';

const remarkStudyQuestion = ({ question }: { question?: string }) => {
  return (tree: Root) => {
    if (!question) return;
    let selected = false;
    tree.children = tree.children.filter(node => {
      if (node.type === 'heading' && node.depth === 2) {
        const first = node.children[0];
        const number = first?.type === 'text' ? /^Q([1-9]\d*)｜/.exec(first.value)?.[1] : undefined;
        selected = number !== undefined && `q${number}` === question;
      }
      return selected || node.type === 'definition' || node.type === 'footnoteDefinition';
    });
    if (!tree.children.some(node => node.type === 'heading')) tree.children = [{ type: 'paragraph', children: [{ type: 'text', value: '未找到这道题，请从清单目录重新选择。' }] }];
  };
};

export default remarkStudyQuestion;
