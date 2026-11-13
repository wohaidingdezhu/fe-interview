# Overall Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the production homepage JavaScript cost while preserving resilient navigation and correct GitHub Pages subpath assets.

**Architecture:** Keep the homepage and shared application shell eager, but load question, library, learning, and guided-path views through React lazy boundaries. A route-scoped error boundary keeps the header and sidebar usable when a view chunk fails, while the HTML shell uses Vite's base placeholder for the favicon.

**Tech Stack:** React 19, TypeScript, Vite 8, Node test runner, Playwright

---

### Task 1: Lock the production-shell boundaries with regression tests

**Files:**
- Modify: `tests/prerender.test.mjs`

- [ ] **Step 1: Add a failing production-shell test**

```js
test('生产壳层使用子路径图标并按页面拆分非首页视图', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /href="%BASE_URL%favicon\.svg"/);
  const source = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8');
  for (const name of ['QuestionList', 'LibraryList', 'LearningPage', 'LearningPath']) {
    assert.match(source, new RegExp(`const ${name} = lazy\\(\\(\\) => import\\('\\./${name}'\\)`));
    assert.doesNotMatch(source, new RegExp(`import \\{ ${name} \\} from '\\./${name}'`));
  }
  assert.match(source, /<RouteBoundary routeKey=/);
});
```

- [ ] **Step 2: Run the focused test and confirm it fails before implementation**

Run: `node --test tests/prerender.test.mjs`

Expected: FAIL because the favicon is absolute and the four views are eagerly imported.

### Task 2: Add resilient route-level loading

**Files:**
- Create: `src/RouteBoundary.tsx`
- Modify: `src/main.tsx`
- Modify: `src/discovery.css`

- [ ] **Step 1: Add a route-scoped error boundary**

```tsx
import { Component, type ReactNode } from 'react';

export class RouteBoundary extends Component<{ children: ReactNode; routeKey: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidUpdate(previous: Readonly<{ routeKey: string }>) {
    if (this.state.failed && previous.routeKey !== this.props.routeKey) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? <section className="route-error" role="alert"><strong>页面暂时无法加载</strong><p>网站可能刚刚更新，刷新后可以重新获取页面模块。</p><button type="button" onClick={() => window.location.reload()}>刷新页面</button></section> : this.props.children;
  }
}
```

- [ ] **Step 2: Convert non-home views to dynamic imports**

```tsx
const QuestionList = lazy(() => import('./QuestionList').then(module => ({ default: module.QuestionList })));
const LibraryList = lazy(() => import('./LibraryList').then(module => ({ default: module.LibraryList })));
const LearningPage = lazy(() => import('./LearningPage').then(module => ({ default: module.LearningPage })));
const LearningPath = lazy(() => import('./LearningPath').then(module => ({ default: module.LearningPath })));
```

- [ ] **Step 3: Wrap the routed view with stable loading and failure UI**

```tsx
<RouteBoundary routeKey={`${view}:${path?.id ?? ''}`}>
  <Suspense fallback={<div className="route-loading" role="status"><span>LOADING</span><strong>正在准备内容…</strong></div>}>
    {/* existing routed view selection */}
  </Suspense>
</RouteBoundary>
```

- [ ] **Step 4: Match the existing editorial visual system**

```css
.route-loading,.route-error{min-height:42vh;border-top:1px solid var(--line);padding-top:28px}
.route-loading{display:flex;flex-direction:column;gap:8px;color:#66796d}
.route-loading span{font-size:9px;letter-spacing:2px;color:#8ba291}
.route-loading strong{font-family:Georgia,'Songti SC',serif;font-size:20px;color:#294735}
.route-error p{color:#718078;font-size:12px;line-height:1.8}
```

### Task 3: Fix subpath assets and verify the production result

**Files:**
- Modify: `index.html`
- Modify: `README.md`
- Modify: `docs/review/next-steps.md`

- [ ] **Step 1: Make the favicon respect the Vite base path**

```html
<link rel="icon" type="image/svg+xml" href="%BASE_URL%favicon.svg" />
```

- [ ] **Step 2: Run focused and full verification**

Run: `node --test tests/prerender.test.mjs`

Expected: all prerender tests pass.

Run: `npm test && npm run typecheck && npm run build && npm run test:e2e`

Expected: unit, type, content, build, and browser suites pass.

- [ ] **Step 3: Record measured bundle changes**

Update `README.md` and `docs/review/next-steps.md` with the exact main and route chunk sizes printed by the final Vite build. Do not estimate values before the build.

- [ ] **Step 4: Commit and push**

```bash
git add index.html src/main.tsx src/RouteBoundary.tsx src/discovery.css tests/prerender.test.mjs README.md docs/review/next-steps.md docs/superpowers/plans/2026-11-13-overall-performance-optimization.md
git commit -m "perf: defer non-home application views"
git push origin main
```
