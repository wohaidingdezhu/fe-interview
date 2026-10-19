import { memo, useEffect, useMemo, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type MouseEvent } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeCodeHighlight from './rehype-code-highlight';
import remarkStudyQuestion from './remark-study-question';
import { studyHref } from './study-session';
import { NavigationLink as Link } from './NavigationLink';
import { ArticleImage, LinkedImage } from './ArticleImage';
export type Heading = { id: string; title: string; level: number };
const CodeBlock = ({ children, ...props }: ComponentPropsWithoutRef<'pre'>) => {
  const ref = useRef<HTMLPreElement>(null), [status, setStatus] = useState('复制代码');
  return <div className="code-block"><button className="copy-button" onClick={async () => {
    try { await navigator.clipboard.writeText(ref.current?.textContent || ''); setStatus('已复制'); }
    catch {
      const selection = window.getSelection(), range = document.createRange();
      if (selection && ref.current) {
        range.selectNodeContents(ref.current); selection.removeAllRanges(); selection.addRange(range);
        setStatus('代码已选中，请按复制快捷键');
      } else setStatus('复制失败，请手动选择');
    }
  }} aria-live="polite">{status}</button><pre {...props} ref={ref} tabIndex={0} aria-label="代码示例">{children}</pre></div>;
};
const QuestionPermalink = ({ href, number }: { href: string; number: string }) => {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle'), timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const announce = (next: 'copied' | 'failed') => {
    clearTimeout(timer.current); setStatus(next); timer.current = window.setTimeout(() => setStatus('idle'), 1800);
  };
  const copy = async (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    try { await navigator.clipboard.writeText(new URL(href, document.baseURI).href); announce('copied'); }
    catch { announce('failed'); }
  };
  const label = status === 'copied' ? `Q${number} 链接已复制` : status === 'failed' ? `Q${number} 链接复制失败，请右键复制` : `复制 Q${number} 题目链接`;
  return <span className="question-link-control"><a className="question-permalink" href={href} onClick={copy} title={label} aria-label={label}>{status === 'copied' ? '已复制' : status === 'failed' ? '复制失败' : '复制链接'}</a><span className="sr-only" aria-live="polite">{status === 'copied' ? '题目链接已复制' : status === 'failed' ? '复制失败，请右键复制题目链接' : ''}</span></span>;
};
const ArticleContent = ({ content, navigate, onHeadings, onReady, hash = '', articleId, studyMode = false, question }: { content: string; navigate: (href: string) => void; onHeadings: (headings: Heading[]) => void; onReady?: (ready: boolean) => void; hash?: string; articleId?: string; studyMode?: boolean; question?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    onHeadings(Array.from(ref.current?.querySelectorAll('h1, h2, h3') || []).map((heading) => {
      const copy = heading.cloneNode(true) as HTMLElement; copy.querySelector('.question-link-control')?.remove();
      return { id: heading.querySelector('.question-anchor')?.id || heading.id, title: copy.textContent?.trim() || '', level: Number(heading.tagName.slice(1)) };
    }));
    onReady?.(true);
    return () => onReady?.(false);
  }, [content, question, studyMode, onHeadings, onReady]);
  useLayoutEffect(() => {
    if (!hash) return;
    // 下一任务再定位，避免后台标签页暂停 requestAnimationFrame 时深链接一直停在页首。
    const timer = window.setTimeout(() => {
      try {
        const anchor = document.getElementById(decodeURIComponent(hash.slice(1)));
        anchor?.scrollIntoView({ behavior: 'instant' });
        const heading = anchor?.closest('h1, h2, h3') ?? anchor;
        if (heading instanceof HTMLElement) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
      } catch { /* 无效编码不影响阅读。 */ }
    }, 0);
    return () => clearTimeout(timer);
  }, [content, hash, question]);
  const markup = useMemo(() => <Markdown remarkPlugins={[remarkGfm, [remarkStudyQuestion, { question }]]} rehypePlugins={[rehypeSlug, rehypeCodeHighlight]} components={{
    pre: ({ node: _node, ...props }) => <CodeBlock {...props} />,
    img: ({ node: _node, ...props }) => <ArticleImage {...props} />,
    h2: ({ node, children, ...props }) => {
      const first = node?.children[0];
      const matchedQuestion = first?.type === 'text' ? /^Q([1-9]\d*)｜/.exec(first.value) : null;
      const anchor = matchedQuestion ? `q${matchedQuestion[1]}` : undefined;
      const href = articleId ? `?article=${encodeURIComponent(articleId)}#${anchor}` : `#${anchor}`;
      const Heading = studyMode && anchor && anchor === question ? 'h1' : 'h2';
      return <Heading {...props}>{anchor && <span id={anchor} className="question-anchor" aria-hidden="true" />}{children}{anchor && <QuestionPermalink href={href} number={matchedQuestion![1]} />}</Heading>;
    },
    a: ({ node: _node, href, children, ...props }) => {
      const localHref = articleId && href?.startsWith('#') ? `?article=${encodeURIComponent(articleId)}${href}` : href;
      const target = studyMode && href?.startsWith('#') && localHref ? studyHref({ href: localHref }, question) : localHref;
      return <LinkedImage.Provider value={true}><Link {...props} href={target ?? ''} navigate={navigate}>{children}</Link></LinkedImage.Provider>;
    },
  }}>{content}</Markdown>, [content, articleId, navigate, studyMode, question]);
  return <div className="article-body" ref={ref}>{markup}</div>;
};

export default memo(ArticleContent);
