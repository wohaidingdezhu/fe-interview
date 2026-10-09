import { useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
export type Heading = { id: string; title: string; level: number };
function CodeBlock({ children, ...props }: ComponentPropsWithoutRef<'pre'>) {
  const ref = useRef<HTMLPreElement>(null), [status, setStatus] = useState('复制代码');
  return <div className="code-block"><button className="copy-button" onClick={async () => {
    try { await navigator.clipboard.writeText(ref.current?.textContent || ''); setStatus('已复制'); }
    catch { setStatus('复制失败，请手动选择'); }
  }} aria-live="polite">{status}</button><pre {...props} ref={ref}>{children}</pre></div>;
}
export default function ArticleContent({ content, navigate, onHeadings, hash = '' }: { content: string; navigate: (href: string) => void; onHeadings: (headings: Heading[]) => void; hash?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    onHeadings(Array.from(ref.current?.querySelectorAll('h2, h3') || []).map((heading) => ({ id: heading.querySelector('.question-anchor')?.id || heading.id, title: heading.textContent?.replace(/题目链接$/, '').trim() || '', level: Number(heading.tagName.slice(1)) })));
    if (window.location.hash) {
      try { document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView(); } catch { /* 无效编码不影响阅读。 */ }
    }
  }, [content, onHeadings, hash]);
  return <div className="article-body" ref={ref}><Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug, rehypeHighlight]} components={{
    pre: ({ node: _node, ...props }) => <CodeBlock {...props} />,
    img: ({ node: _node, ...props }) => <img {...props} loading="lazy" decoding="async" />,
    h2: ({ node, children, ...props }) => {
      const first = node?.children[0];
      const question = first?.type === 'text' ? /^Q([1-9]\d*)｜/.exec(first.value) : null;
      const anchor = question ? `q${question[1]}` : undefined;
      return <h2 {...props}>{anchor && <span id={anchor} className="question-anchor" aria-hidden="true" />}{children}{anchor && <a className="question-permalink" href={`#${anchor}`} aria-label={`Q${question![1]} 题目链接`}>题目链接</a>}</h2>;
    },
    a: ({ node: _node, href, children, ...props }) => <a {...props} href={href} onClick={(event) => {
      if (href?.startsWith('?article=') && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) { event.preventDefault(); navigate(href); }
    }}>{children}</a>,
  }}>{content}</Markdown></div>;
}
