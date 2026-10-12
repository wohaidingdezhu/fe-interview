import type { ArticleMetadata } from './data-utils';
import { NavigationLink as Link, type Navigate } from './NavigationLink';
import { ShareButton } from './ShareButton';

type StudyContext = { question: string; returnHref: string };

export function ArticleHeader({ article, navigate, study }: { article: ArticleMetadata; navigate: Navigate; study?: StudyContext }) {
  const updated = article.updatedAt ?? article.addedAt;
  if (study) {
    const question = /^q[1-9]\d*$/.test(study.question) ? study.question : '';
    const fullHref = `?article=${encodeURIComponent(article.id)}${question ? `#${question}` : ''}`;
    return <>
      <nav className="breadcrumb" aria-label="面包屑"><Link href={study.returnHref} navigate={navigate}>学习清单</Link><span>/</span>{article.category}<span>/</span><b aria-current="page">{question ? question.toUpperCase() : article.title}</b></nav>
      <header className="study-article-header">
        <span className="eyebrow">FOCUSED STUDY</span>
        <div className="article-meta"><span className="pill">{question ? '单题学习' : '专注阅读'}</span><span>来源专题 · <strong>{article.title}</strong></span><span>{article.category}</span></div>
        {!question && <><h1>{article.title}</h1><p className="description">{article.description}</p></>}
        {question && <p className="description">当前只显示这一题。完成阅读后，使用页面底部记录状态并继续下一项。</p>}
        <div className="study-article-actions"><Link className="study-full-topic-link" href={fullHref} navigate={navigate}>{question ? '查看完整专题（暂停学习） →' : '退出专注阅读 →'}</Link><ShareButton articleId={article.id} anchor={question} /></div>
      </header>
    </>;
  }
  return <>
    <nav className="breadcrumb" aria-label="面包屑"><Link href="?view=notes" navigate={navigate}>专题与笔记</Link><span>/</span><Link href={`?view=notes&category=${encodeURIComponent(article.category)}`} navigate={navigate}>{article.category}</Link><span>/</span><b aria-current="page">{article.title}</b></nav>
    <div className="article-meta"><span className="pill">{article.kind}</span>{article.status === 'draft' && <span className="pill draft-label">草稿 · 仅本地预览</span>}{article.questionCount > 0 && <span>共 {article.questionCount} 题 · 已复核 {article.publishedQuestionCount} · 待处理 {article.questionCount - article.publishedQuestionCount}</span>}<span>约 {Math.max(1, Math.ceil(article.contentLength / 450))} 分钟阅读</span><time dateTime={updated}>{article.updatedAt ? `更新 ${article.updatedAt}` : `收录 ${article.addedAt}`}</time>{article.reviewedAt && <time dateTime={article.reviewedAt}>审核 {article.reviewedAt}</time>}</div>
    <h1>{article.title}</h1><p className="description">{article.description}</p><div className="article-tags">{article.tags.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div>
    <ShareButton articleId={article.id} />
  </>;
}
