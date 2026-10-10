import { memo, useMemo, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react';
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
  }} aria-live="polite">{status}</button><pre {...props} ref={ref} tabIndex={0} aria-label="代码示例">{children}</pre></div>;
}
function ArticleContent({ content, navigate, onHeadings, hash = '', articleId }: { content: string; navigate: (href: string) => void; onHeadings: (headings: Heading[]) => void; hash?: string; articleId?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    onHeadings(Array.from(ref.current?.querySelectorAll('h2, h3') || []).map((heading) => ({ id: heading.querySelector('.question-anchor')?.id || heading.id, title: heading.textContent?.replace(/题目链接$/, '').trim() || '', level: Number(heading.tagName.slice(1)) })));
  }, [content, onHeadings]);
  useLayoutEffect(() => {
    if (!hash) return;
    // 等待历史记录恢复滚动位置后，再定位并聚焦当前章节。
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
  const markup = useMemo(() => <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug, rehypeHighlight]} components={{
    pre: ({ node: _node, ...props }) => <CodeBlock {...props} />,
    img: ({ node: _node, ...props }) => <img {...props} loading="lazy" decoding="async" />,
    h2: ({ node, children, ...props }) => {
      const first = node?.children[0];
      const question = first?.type === 'text' ? /^Q([1-9]\d*)｜/.exec(first.value) : null;
      const anchor = question ? `q${question[1]}` : undefined;
      const href = articleId ? `?article=${encodeURIComponent(articleId)}#${anchor}` : `#${anchor}`;
      return <h2 {...props}>{anchor && <span id={anchor} className="question-anchor" aria-hidden="true" />}{children}{anchor && <a className="question-permalink" href={href} onClick={event => { if (!(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) { event.preventDefault(); navigate(href); } }} aria-label={`Q${question![1]} 题目链接`}>题目链接</a>}</h2>;
    },
    a: ({ node: _node, href, children, ...props }) => <a {...props} href={href} onClick={(event) => {
      if (href?.startsWith('?article=') && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) { event.preventDefault(); navigate(href); }
    }}>{children}</a>,
  }}>{content}</Markdown>, [content, articleId, navigate]);
  return <div className="article-body" ref={ref}>{markup}</div>;
}

export default memo(ArticleContent);
