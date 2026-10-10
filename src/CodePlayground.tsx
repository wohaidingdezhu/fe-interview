import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createRunnerDocument, nextRunner } from './playground-utils';

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'system';
type LogEntry = { id: number; level: LogLevel; text: string };

const starterCode = `const scores = [72, 91, 66, 88, 95];
const passed = scores.filter((score) => score >= 80);

console.log('通过人数：', passed.length);
console.log({ passed, average: scores.reduce((a, b) => a + b, 0) / scores.length });

document.querySelector('#app').innerHTML = \`
  <h2>运行结果</h2>
  <p>通过分数：\${passed.join('、')}</p>
\`;`;

export function CodePlayground() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const channelRef = useRef(`playground-${Math.random().toString(36).slice(2)}`);
  const sequenceRef = useRef(0);
  const [code, setCode] = useState(starterCode);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [runner, setRunner] = useState(() => ({ key: 0, document: createRunnerDocument(starterCode, channelRef.current) }));

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as { source?: string; channel?: string; level?: LogLevel; values?: unknown[] };
      if (data?.source !== 'fe-js-playground' || data.channel !== channelRef.current || !data.level || !Array.isArray(data.values)) return;
      const text = data.values.map(String).join(' ');
      if (data.level === 'system' && text === 'sandbox-ready') return;
      setLogs((current) => [...current.slice(-79), { id: ++sequenceRef.current, level: data.level!, text }]);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  function run(nextCode = code) {
    setLogs([]);
    setRunner((current) => nextRunner(current.key, nextCode, channelRef.current));
  }

  function reset() {
    setCode(starterCode);
    run(starterCode);
  }

  function onEditorKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      run();
    }
  }

  return <section className="js-workbench" aria-labelledby="js-workbench-title">
    <header className="workbench-header">
      <div><span className="workbench-kicker">JS LAB · BROWSER SANDBOX</span><h2 id="js-workbench-title">边学边运行</h2><p>代码只在隔离 iframe 中执行，不会访问本站页面。</p></div>
      <div className="workbench-actions">
        <button type="button" className="workbench-secondary" onClick={() => setLogs([])}>清空控制台</button>
        <button type="button" className="workbench-secondary" onClick={reset}>重置</button>
        <button type="button" className="workbench-run" onClick={() => run()}>运行 <span>⌘↵</span></button>
      </div>
    </header>
    <div className="workbench-grid">
      <label className="editor-pane"><span><i /> main.js</span><textarea value={code} onChange={(event) => setCode(event.target.value)} onKeyDown={onEditorKeyDown} spellCheck={false} aria-label="JavaScript 代码编辑器" /></label>
      <div className="output-stack">
        <div className="preview-pane"><span className="pane-label"><i /> Preview</span><iframe key={runner.key} ref={iframeRef} srcDoc={runner.document} sandbox="allow-scripts" title="JavaScript 运行结果" /></div>
        <div className="console-pane" aria-live="polite"><span className="pane-label"><i /> Console</span><div className="console-lines">{logs.length ? logs.map((entry) => <p key={entry.id} className={`console-${entry.level}`}><span>{entry.level === 'error' ? '×' : entry.level === 'warn' ? '!' : entry.level === 'system' ? '✓' : '›'}</span>{entry.text}</p>) : <p className="console-empty">运行代码后在这里查看 console 输出</p>}</div></div>
      </div>
    </div>
    <footer className="workbench-footer"><span>快捷键：⌘/Ctrl + Enter</span><span>支持 DOM 操作、异步函数和 console 输出</span></footer>
  </section>;
}
