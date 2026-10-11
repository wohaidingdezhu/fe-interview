import { learningOverview, type LearningTarget } from './learning-view';
import type { LearningData } from './learning-utils';
import { NavigationLink as Link, type Navigate } from './NavigationLink';

export function LearningOverview({ targets, data, navigate }: { targets: LearningTarget[]; data: LearningData; navigate: Navigate }) {
  const { total, categories } = learningOverview(targets, data);
  return <section className="learning-overview" aria-labelledby="learning-progress-title">
    <div className="section-heading"><div><h2 id="learning-progress-title">学习进度</h2><p>按当前题目与独立笔记统计；已读和待复习分别计数。</p></div><span>{total.read} / {total.total} 已读</span></div>
    <progress className="learning-progress" value={total.read} max={total.total || 1} aria-label="整体已读进度" />
    <div className="learning-stats">{[
      { key: 'read', label: '已读', count: total.read },
      { key: 'review', label: '待复习', count: total.review },
      { key: 'unread', label: '未读', count: total.unread },
    ].map(item => <Link key={item.key} navigate={navigate} href={`?view=learning&filter=${item.key}`}><strong>{item.count}</strong><span>{item.label} →</span></Link>)}</div>
    <details className="category-progress"><summary>按分类查看进度 <span>{categories.length} 个分类</span></summary>
      <div className="category-progress-grid">{categories.map(item => <article key={item.category}>
        <div><h3>{item.category}</h3><span>{item.read} / {item.total} 已读</span></div>
        <progress className="learning-progress" value={item.read} max={item.total || 1} aria-label={`${item.category}已读进度`} />
        <div className="category-progress-actions">
          {item.review > 0 ? <Link navigate={navigate} href={`?view=learning&filter=review&category=${encodeURIComponent(item.category)}`}>复习 {item.review} 条 →</Link> : <span>暂无待复习</span>}
          {item.unread > 0 && <Link navigate={navigate} href={`?view=learning&filter=unread&category=${encodeURIComponent(item.category)}`}>学习未读 {item.unread} 条 →</Link>}
        </div>
      </article>)}</div>
    </details>
  </section>;
}
