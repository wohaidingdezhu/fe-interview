import { readingInStudy } from './study-session';
import { articles } from './content';
import { libraryCounts, articleHref } from './library-utils';
import { NavigationLink as Link, type Navigate } from './NavigationLink';
import type { Learning } from './useLearning';
import type { Study } from './useStudySession';
import { StudyResumeCard } from './StudyResumeCard';
import { reactPathHref } from './react-path';
export const HomePage = ({ navigate, learning, study }: { navigate: Navigate; learning: Learning; study?: Study }) => {
  const counts = libraryCounts(articles, []), topics = articles.filter(a => a.questionCount > 0), notes = articles.filter(a => !a.questionCount && a.section !== 'resources');
  const last = learning.data.lastRead, lastArticle = articles.find(a => a.id === last?.articleId);
  return <div className="home-page">
    <section className="home-hero"><div className="eyebrow">THE FRONTEND FIELD NOTES</div><span className="hero-index" aria-hidden="true">01 / EXPLORE</span><h1>知识有来处，<br />学习有路径。</h1><p>从一个问题开始，连接原理、代码与实践。<br />把值得反复阅读的前端知识，放在一起。</p><div className="hero-actions"><Link navigate={navigate} href="?view=questions" className="primary-link">浏览全部题目 <span>→</span></Link><Link navigate={navigate} href="?view=notes&collection=notes">阅读知识笔记 →</Link></div></section>
    <nav className="home-stats" aria-label="内容入口">{[
      [counts.questions, '道面试题', '?view=questions', '按题查找'], [counts.topics, '个专题', '?view=notes&collection=topics', '系统学习'],
      [counts.notes, '篇知识笔记', '?view=notes&collection=notes', '理解与实践'],
    ].map(([count, label, href, caption]) => <Link key={label} href={String(href)} navigate={navigate}><strong>{count}</strong><span>{label}</span><small>{caption} →</small></Link>)}</nav>
    {study?.error && !study.session && <p role="alert">{study.error}</p>}
    {study?.session && <StudyResumeCard study={study} learning={learning} navigate={navigate} />}
    {last && lastArticle && !readingInStudy(study?.session, last) && <section className="resume-card"><div><span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>上次自由阅读</h2><p>{last.title} <span>· {lastArticle.category}</span></p></div><Link className="primary-link" navigate={navigate} href={articleHref(last.articleId, last.anchor)}>接着读 →</Link></section>}
    <section className="home-learning" aria-labelledby="react-path-title"><span className="eyebrow">A GUIDED LEARNING PATH</span><h2 id="react-path-title">从状态到 Hooks，顺着一条路径学 React</h2><p>把题目、原理笔记与代码实践串成 7 步。先看清每步目标，再按顺序学习。</p><Link navigate={navigate} href={reactPathHref}>查看 React 学习路径 →</Link></section>
    <section className="home-section"><div className="section-heading"><div><span className="eyebrow">LEARN BY SUBJECT</span><h2>顺着专题，建立体系</h2></div><Link navigate={navigate} href="?view=questions">全部题目 →</Link></div><div className="subject-grid">{topics.map((topic, index) => <Link navigate={navigate} key={topic.id} href={`?view=questions&category=${encodeURIComponent(topic.category)}`}><span className="subject-number">{String(index + 1).padStart(2, '0')}</span><strong>{topic.category}</strong><small>{topic.publishedQuestionCount} 道题 <span>→</span></small></Link>)}</div></section>
    <section className="home-section"><div className="section-heading"><div><span className="eyebrow">NOTES FOR THE EVERYDAY</span><h2>把知识用在开发里</h2></div><Link navigate={navigate} href="?view=notes&collection=notes">全部笔记 →</Link></div><div className="home-notes">{[...notes].sort((a,b) => b.addedAt.localeCompare(a.addedAt)).slice(0,4).map(note => <Link navigate={navigate} href={articleHref(note.id)} key={note.id}><small>{note.category}</small><h3>{note.title}</h3><p>{note.description}</p><span>阅读笔记 →</span></Link>)}</div></section>
    <section className="home-learning"><h2>让读过的内容，留下痕迹。</h2><p>收藏想深读的题目，标记已经理解的知识，再给需要巩固的内容留一个复习入口。</p><Link navigate={navigate} href="?view=learning">打开我的学习记录 →</Link><small>记录保存在当前浏览器，可导出备份。</small></section>
    <section className="home-learning"><h2>开发之外，也留些值得回看的资料。</h2><p>终端工具、工程实践、成长建议与生活摘录，按主题收藏在这里。</p><Link navigate={navigate} href="?view=resources">浏览 {counts.resources} 篇相关资料 →</Link></section>
  </div>;
};
