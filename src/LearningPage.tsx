import { useRef, useState } from 'react';
import { articles, useQuestions } from './content';
import { articleHref } from './library-utils';
import { NavigationLink as Link, type Navigate } from './NavigationLink';
import { LearningControls } from './LearningControls';
import type { Learning } from './useLearning';
export function LearningPage({ learning, navigate }: { learning: Learning; navigate: Navigate }) {
  const catalog = useQuestions(), [filter, setFilter] = useState('bookmarked'), [message, setMessage] = useState(''), input = useRef<HTMLInputElement>(null);
  const targets = [...catalog.questions.map(q => ({ key: `q:${q.number}`, title: `Q${q.number}｜${q.title}`, category: q.category, href: articleHref(q.articleId, `q${q.number}`) })), ...articles.filter(a => !a.questionCount).map(a => ({ key: `a:${a.id}`, title: a.title, category: a.category, href: articleHref(a.id) }))];
  const validKeys = new Set(targets.map(item => item.key)), validArticles = new Set(articles.map(article => article.id));
  const catalogReady = !catalog.loading && !catalog.error;
  const staleCount = catalogReady ? Object.keys(learning.data.entries).filter(key => !validKeys.has(key)).length + (learning.data.lastRead && !validArticles.has(learning.data.lastRead.articleId) ? 1 : 0) : 0;
  const matching = targets.filter(item => { const e = learning.data.entries[item.key]; return filter === 'bookmarked' ? e?.bookmarked : e?.status === filter; }).sort((a,b) => (learning.data.entries[b.key]?.updatedAt ?? '').localeCompare(learning.data.entries[a.key]?.updatedAt ?? ''));
  const [page, setPage] = useState(1), pages = Math.max(1, Math.ceil(matching.length / 12)), current = Math.min(page, pages);
  const last = learning.data.lastRead;
  function download() {
    const blob = new Blob([JSON.stringify(learning.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `前端资料库-学习记录-${new Date().toISOString().slice(0,10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setMessage('备份已导出。');
  }
  return <><div className="breadcrumb">前端资料库 <span>/</span> 我的学习</div><span className="eyebrow">YOUR PERSONAL READING SHELF</span><h1>我的学习</h1><p className="description">收藏、已读与待复习。把下一次阅读，接在这一次之后。</p>
    {learning.error && <p role="alert">{learning.error}</p>}
    {last && articles.some(a => a.id === last.articleId) && <section className="resume-card"><div><small>上次读到</small><h2>{last.title}</h2></div><Link navigate={navigate} href={articleHref(last.articleId, last.anchor)}>继续阅读 →</Link></section>}
    <div className="learning-backup"><div><strong>记录只保存在当前浏览器</strong><p>换设备时先导出，再在新设备导入。导入会合并记录，同一项保留较新的状态。</p></div><div><button onClick={download}>导出备份</button><button onClick={() => input.current?.click()}>导入备份</button></div><input hidden ref={input} type="file" accept="application/json,.json" onChange={async event => {
      const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
      try { if (file.size > 4_000_000) throw new Error('备份不能超过 4 MB'); learning.restore(await file.text()); setMessage('备份已合并。'); }
      catch (error) { setMessage(`导入失败：${error instanceof Error ? error.message : '文件无效'}`); }
    }} /></div><p role="status" className="backup-message">{message}</p>
    <div className="learning-maintenance"><button disabled={!staleCount} onClick={() => { learning.prune(validKeys, validArticles); setMessage(`已清理 ${staleCount} 条失效记录。`); }}>清理失效记录{staleCount ? `（${staleCount}）` : ''}</button><button className="danger-text" onClick={() => { if (window.confirm('确定清空全部收藏、阅读状态和继续阅读位置吗？建议先导出备份。')) { learning.clear(); setMessage('学习记录已清空。'); setPage(1); } }}>清空全部记录</button></div>
    <div className="learning-tabs" aria-label="学习记录筛选">{[['bookmarked','已收藏'],['read','已读'],['review','待复习']].map(([key,label]) => <button key={key} aria-pressed={filter === key} onClick={() => { setFilter(key); setPage(1); }}>{label} <span>{targets.filter(item => key === 'bookmarked' ? learning.data.entries[item.key]?.bookmarked : learning.data.entries[item.key]?.status === key).length}</span></button>)}</div>
    {catalog.error && <p role="alert">{catalog.error}<button onClick={catalog.retry}>重试题目目录</button></p>}
    {catalog.loading && <p role="status">正在加载题目目录…</p>}
    <div className="resource-list">{matching.slice((current - 1) * 12, current * 12).map(item => <article className="resource-card" key={item.key}><small>{item.category}</small><h2><Link navigate={navigate} href={item.href}>{item.title} →</Link></h2><LearningControls itemKey={item.key} learning={learning} /></article>)}</div>
    {!matching.length && !catalog.loading && !catalog.error && <div className="empty-state"><h2>书架上还没有这类记录</h2><p>从一道感兴趣的题目开始，点击收藏或标记阅读状态。</p><Link navigate={navigate} href="?view=questions">去看看全部题目 →</Link></div>}
    {pages > 1 && <nav className="list-pagination" aria-label="学习记录分页"><button disabled={current === 1} onClick={() => setPage(current - 1)}>← 上一页</button><span>{current} / {pages}</span><button disabled={current === pages} onClick={() => setPage(current + 1)}>下一页 →</button></nav>}
  </>;
}
