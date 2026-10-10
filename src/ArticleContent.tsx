import { useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
export type Heading = { id: string; title: string; level: number };
function CodeBlock({ children, ...props }: ComponentPropsWithoutRef<'pre'>) {
  const ref = useRef<HTMLPreElement>(null), [status, setStatus] = useState('复制代码');
  return <div className="code-block"><button className="copy-button" onClick={async () => {
    try { await navigator.clipboard.writeText(ref.current?.textContent || ''); setStatus('已复制'); }
    catch { setStatus('复制失败，请手动选择'); }
  }} aria-live="polite">{status}</button><pre {...props} ref={ref} tabIndex={0} aria-label="代码示例">{children}</pre></div>;
}
// 保持组件类型稳定，父组件更新目录或搜索状态时不重建标题和代码块。
const readingComponents: Components = {
  pre: ({ node: _node, ...props }) => <CodeBlock {...props} />,
  img: ({ node: _node, ...props }) => <img {...props} loading="lazy" decoding="async" />,
  h2: ({ node, children, ...props }) => {
    const first = node?.children[0];
    const question = first?.type === 'text' ? /^Q([1-9]\d*)｜/.exec(first.value) : null;
    const anchor = question ? `q${question[1]}` : undefined;
    return <h2 {...props}>{anchor && <span id={anchor} className="question-anchor" aria-hidden="true" />}{children}{anchor && <a className="question-permalink" href={`#${anchor}`} aria-label={`Q${question![1]} 题目链接`}>题目链接</a>}</h2>;
  },
};
export default function ArticleContent({ content, navigate, onHeadings, hash = '' }: { content: string; navigate: (href: string) => void; onHeadings: (headings: Heading[]) => void; hash?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    onHeadings(Array.from(ref.current?.querySelectorAll('h2, h3') || []).map((heading) => ({ id: heading.querySelector('.question-anchor')?.id || heading.id, title: heading.textContent?.replace(/题目链接$/, '').trim() || '', level: Number(heading.tagName.slice(1)) })));
  }, [content, onHeadings]);
  useLayoutEffect(() => {
    if (!hash) return;
    // 等待浏览器完成历史记录的滚动恢复，再按当前章节定位。
    const frame = requestAnimationFrame(() => {
      try {
        const anchor = document.getElementById(decodeURIComponent(hash.slice(1)));
        anchor?.scrollIntoView({ behavior: 'instant' });
        const heading = anchor?.closest('h2, h3') ?? anchor;
        if (heading instanceof HTMLElement) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
      } catch { /* 无效编码不影响阅读。 */ }
    });
    return () => cancelAnimationFrame(frame);
  }, [content, hash]);
  return <div className="article-body" ref={ref}><Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug, rehypeHighlight]} components={{
    ...readingComponents,
    a: ({ node: _node, href, children, ...props }) => <a {...props} href={href} onClick={(event) => {
      if (href?.startsWith('?article=') && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) { event.preventDefault(); navigate(href); }
    }}>{children}</a>,
  }}>{content}</Markdown></div>;
}
