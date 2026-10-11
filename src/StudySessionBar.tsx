import { useEffect, useRef, useState } from 'react';
import { articles, useQuestions } from './content';
import { learningTargets } from './learning-view';
import { studyHref, studyIndex, studyQueue } from './study-session';
import { NavigationLink as Link, type Navigate } from './NavigationLink';
import type { Learning } from './useLearning';
import type { Study } from './useStudySession';
import { StudyQueueDialog } from './StudyQueueDialog';

export function StudySessionBar({ study, learning, route, navigate, openDirectory, directoryReady }: { study: Study; learning: Learning; route: URL; navigate: Navigate; openDirectory: () => void; directoryReady: boolean }) {
  const catalog = useQuestions();
  const [message, setMessage] = useState('');
  const dialog = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const session = study.session;
  const queue = session ? studyQueue(session, learningTargets(catalog.questions, articles)) : [];
  const index = studyIndex(queue, route), current = queue[index];
  useEffect(() => { if (!catalog.loading && !catalog.error && current) study.move(current.key); }, [catalog.loading, catalog.error, current?.key, study.move]);
  if (!study.session) return <section className="study-session" aria-label="连续学习"><p>当前标签页没有可用清单，请回到学习页重新选择内容。</p><Link navigate={navigate} href="?view=learning">返回我的学习 →</Link></section>;
  const returnSearch = study.session.returnSearch;
  function finish() { study.end(); navigate(returnSearch); }
  if (catalog.loading) return <section className="study-session" aria-label="连续学习"><p role="status">正在恢复学习清单…</p></section>;
  if (catalog.error) return <section className="study-session" aria-label="连续学习"><p role="alert">{catalog.error}</p><button onClick={catalog.retry}>重试学习清单</button><button onClick={finish}>结束并返回列表</button></section>;
  const next = queue[index + 1];
  function markAndContinue(status: 'read' | 'review') {
    if (!current) return;
    const saved = learning.update(current.key, { status });
    if (saved.error) { setMessage(`当前项已在本次访问标记${status === 'read' ? '已读' : '待复习'}，但尚未保存。请导出备份，或重试保存后继续。`); return; }
    setMessage('');
    if (next) navigate(studyHref(next)); else finish();
  }
  return <section className="study-session" aria-label="连续学习">
    {current ? <>
      <div className="study-session-heading"><strong>学习清单 {index + 1} / {queue.length}</strong><span>{learning.data.entries[current.key]?.status === 'read' ? '当前项已读' : learning.data.entries[current.key]?.status === 'review' ? '当前项待复习' : '阅读后可标记状态'}</span></div>
      <p className="study-session-title">{current.title}</p>
      <nav aria-label="清单切换">
        {index > 0 ? <Link href={studyHref(queue[index - 1])} navigate={navigate}>← 清单上一项</Link> : <button disabled>← 清单上一项</button>}
        {next ? <Link href={studyHref(next)} navigate={navigate}>清单下一项 →</Link> : <button disabled>清单下一项 →</button>}
        <button className="study-session-primary" onClick={() => markAndContinue('read')}>{next ? '标记已读并继续' : '标记已读并返回'}</button>
        <button onClick={() => markAndContinue('review')}>{next ? '待复习并继续' : '待复习并返回'}</button>
      </nav>
    </> : <p role="status">{queue.length ? '当前阅读内容不在这份清单中。' : '清单内容已不在当前目录中。'}{queue.length > 0 && <Link href={studyHref(queue[0])} navigate={navigate}>从清单第一项继续 →</Link>}</p>}
    <div className="study-session-footer"><Link href={study.session.returnSearch} navigate={navigate}>暂停清单</Link><button ref={trigger} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>清单目录</button><button aria-haspopup="dialog" disabled={!directoryReady} onClick={openDirectory}>正文目录</button><button onClick={finish}>结束清单</button></div>
    <small>清单顺序在开始时固定。标记只作用于上方列出的当前项；下方正文仍可自由浏览。</small>
    {(message || study.error) && <p role="alert">{message || study.error}</p>}
    <StudyQueueDialog queue={queue} data={learning.data} currentKey={current?.key ?? study.session.currentKey} dialogRef={dialog} onClose={() => trigger.current?.focus()} navigate={navigate} />
  </section>;
}
