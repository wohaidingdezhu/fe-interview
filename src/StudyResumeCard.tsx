import { useRef } from 'react';
import { articles, useQuestions } from './content';
import { learningTargets } from './learning-view';
import { studyHref, studyProgress, studyQueue, studyResumeTarget } from './study-session';
import { StudyQueueDialog } from './StudyQueueDialog';
import { NavigationLink as Link, type Navigate } from './NavigationLink';
import type { Learning } from './useLearning';
import type { Study } from './useStudySession';

export function StudyResumeCard({ study, learning, navigate }: { study: Study; learning: Learning; navigate: Navigate }) {
  const catalog = useQuestions(), dialog = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLButtonElement>(null);
  if (!study.session) return null;
  if (catalog.loading) return <section className="resume-card"><p role="status">正在恢复暂停的学习清单…</p></section>;
  if (catalog.error) return <section className="resume-card"><p role="alert">{catalog.error}</p><button onClick={catalog.retry}>重试学习清单</button><button onClick={study.end}>结束清单</button></section>;
  const queue = studyQueue(study.session, learningTargets(catalog.questions, articles)), target = studyResumeTarget(study.session, queue), counts = studyProgress(queue, learning.data);
  return <>
    <section className="resume-card study-resume" aria-label="暂停的学习清单"><div><small>当前标签页的学习清单</small><h2>继续学习清单</h2>{target ? <><p>上次清单位置：第 {queue.indexOf(target) + 1} / {queue.length} 项 · {target.title}</p><p>已读 {counts.read} · 待复习 {counts.review} · 未读 {counts.unread}</p>{target.key !== study.session.currentKey && <p>原位置已失效，将从清单第一项继续。</p>}</> : <p>清单中的内容已不在当前目录中，可以结束后重新选择。</p>}{study.error && <p role="alert">{study.error}</p>}</div>
      <div className="study-resume-actions">{target && <><Link navigate={navigate} href={studyHref(target)}>继续清单 →</Link><button ref={trigger} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>查看清单</button></>}<button onClick={study.end}>结束清单</button></div>
    </section>
    <StudyQueueDialog queue={queue} data={learning.data} currentKey={target?.key ?? ''} dialogRef={dialog} onClose={() => trigger.current?.focus()} navigate={navigate} />
  </>;
}
