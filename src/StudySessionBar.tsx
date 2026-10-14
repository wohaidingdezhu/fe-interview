import { useEffect, useRef, useState } from 'react';
import { articles, useQuestions } from './content';
import { learningTargets } from './learning-view';
import { studyHref, studyIndex, studyQueue } from './study-session';
import { NavigationLink as Link, type Navigate } from './NavigationLink';
import type { Learning } from './useLearning';
import type { Study } from './useStudySession';
import { StudyQueueDialog } from './StudyQueueDialog';
import { StudySummary } from './StudySummary';

export function StudySessionBar({ study, learning, route, navigate, openDirectory, directoryReady, readingReady = true }: { study: Study; learning: Learning; route: URL; navigate: Navigate; openDirectory: () => void; directoryReady: boolean; readingReady?: boolean }) {
  const catalog = useQuestions();
  const [message, setMessage] = useState(''), [summary, setSummary] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const session = study.session;
  const queue = session ? studyQueue(session, learningTargets(catalog.questions, articles)) : [];
  const index = studyIndex(queue, route), current = queue[index];
  useEffect(() => { if (!catalog.loading && !catalog.error && current) study.move(current.key); }, [catalog.loading, catalog.error, current?.key, study.move]);
  if (!session) return <section className="study-session" aria-label="连续学习"><p>当前没有可用清单，请重新选择学习内容。{study.error}</p><Link navigate={navigate} href="?view=learning">返回我的学习 →</Link></section>;
  if (catalog.loading) return <section className="study-session" aria-label="连续学习"><p role="status">正在恢复学习清单…</p></section>;
  if (catalog.error) return <section className="study-session" aria-label="连续学习"><p role="alert">{catalog.error}</p><button onClick={catalog.retry}>重试学习清单</button><Link navigate={navigate} href={session.returnSearch}>暂停并返回列表</Link></section>;
  const next = queue[index + 1];
  function markAndContinue(status: 'read' | 'review') {
    if (!current || !readingReady) return;
    const saved = learning.update(current.key, { status });
    if (saved.error) { setMessage('当前项已在本次访问标记，但尚未保存。请导出备份，或重试保存后继续。'); return; }
    setMessage('');
    if (next) navigate(studyHref(next)); else setSummary(true);
  }
  return <section className="study-session" aria-label="连续学习">
    {current ? <>
      <div className="study-session-heading"><strong>学习清单 {index + 1} / {queue.length}</strong><span>{learning.data.entries[current.key]?.status === 'read' ? '当前项已读' : learning.data.entries[current.key]?.status === 'review' ? '当前项待复习' : '阅读后可标记状态'}</span></div>
      <p className="study-session-title">{current.title}</p>
      <nav aria-label="清单切换">
        <button className="study-session-primary" disabled={!readingReady} onClick={() => markAndContinue('read')}>{next ? '标记已读并继续' : '标记已读并查看结果'}</button>
        <button disabled={!readingReady} onClick={() => markAndContinue('review')}>{next ? '待复习并继续' : '待复习并查看结果'}</button>
      </nav>
    </> : <p role="status">{queue.length ? '当前阅读内容不在这份清单中。' : '清单内容已不在当前目录中。'}{queue.length > 0 && <Link href={studyHref(queue[0])} navigate={navigate}>从清单第一项继续 →</Link>}</p>}
    <div className="study-session-footer"><Link href={session.returnSearch} navigate={navigate}>暂停</Link><button ref={trigger} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>清单目录</button>
      <details className="study-more"><summary>更多操作</summary><div>
        {index > 0 && <Link href={studyHref(queue[index - 1])} navigate={navigate}>← 上一项</Link>}
        {next && <Link href={studyHref(next)} navigate={navigate}>跳过当前项 →</Link>}
        <button aria-haspopup="dialog" disabled={!directoryReady} onClick={event => { event.currentTarget.focus(); openDirectory(); }}>正文目录</button>
        <button aria-haspopup="dialog" onClick={() => setSummary(true)}>查看结果 / 结束清单</button>
      </div></details>
    </div>
    {(message || study.error) && <p role="alert">{message || study.error}</p>}
    <StudyQueueDialog queue={queue} data={learning.data} currentKey={current?.key ?? session.currentKey} dialogRef={dialog} onClose={() => trigger.current?.focus()} navigate={navigate} />
    {summary && <StudySummary queue={queue} learning={learning} study={study} navigate={navigate} onClose={() => setSummary(false)} />}
  </section>;
}
