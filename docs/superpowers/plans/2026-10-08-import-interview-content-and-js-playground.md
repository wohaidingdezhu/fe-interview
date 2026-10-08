# Interview Content Import and JavaScript Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import the 403 questions from the optimized interview handbook into 17 correctly classified site articles, then add a safe in-browser JavaScript scratchpad to JavaScript-category article pages.

**Architecture:** Treat `/Users/bytedance/Desktop/大前端面试宝典108/大前端面试宝典-飞书优化版.md` as the checked-in-content source of truth and split only the `答案与解析` portion. Generate one Markdown article per top-level topic, rewrite local image references into `public/images/interview/`, and keep the existing article loader unchanged. Implement the editor as an isolated React component that runs user code in a sandboxed iframe and reports console output through a scoped `postMessage` channel.

**Tech Stack:** React 19, TypeScript, Vite, Markdown/YAML content, Node.js scripts and `node:test`.

---

### Task 1: Add a deterministic handbook importer

**Files:**
- Create: `scripts/import-interview-content.mjs`
- Test: `tests/import-interview-content.test.mjs`

- [ ] **Step 1: Write the failing importer test**

Create a temporary handbook fixture containing two `#` topic sections below `# 🧠 答案与解析`, run the importer against temporary article/image destinations, and assert:

```js
assert.equal(result.status, 0, result.stderr);
assert.match(await readFile(join(articleDir, 'interview-javascript.md'), 'utf8'), /category: "JavaScript"/);
assert.match(await readFile(join(articleDir, 'interview-javascript.md'), 'utf8'), /## Q40｜/);
assert.doesNotMatch(await readFile(join(articleDir, 'interview-javascript.md'), 'utf8'), /Q117/);
assert.equal(await readFile(join(imageDir, 'example.png'), 'utf8'), 'image');
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/import-interview-content.test.mjs`

Expected: FAIL because `scripts/import-interview-content.mjs` does not exist.

- [ ] **Step 3: Implement the importer**

The importer must:

```js
const sectionDefinitions = [
  ['HTML + CSS', 'interview-html-css', 'HTML + CSS', 'Q1–Q39'],
  ['Javascript', 'interview-javascript', 'JavaScript', 'Q40–Q116'],
  ['Typescript', 'interview-typescript', 'TypeScript', 'Q117–Q122'],
  ['代码编程', 'interview-coding', '代码编程', 'Q123–Q158'],
  ['Vue 生态', 'interview-vue', 'Vue 生态', 'Q159–Q203'],
  ['React 生态', 'interview-react', 'React 生态', 'Q204–Q227'],
  ['前端构建 & 工程化', 'interview-engineering', '前端构建 & 工程化', 'Q228–Q244'],
  ['浏览器', 'interview-browser', '浏览器', 'Q245–Q246'],
  ['前端性能', 'interview-performance', '前端性能', 'Q247–Q260'],
  ['设计模式', 'interview-design-patterns', '设计模式', 'Q261–Q289'],
  ['操作系统', 'interview-operating-system', '操作系统', 'Q290–Q292'],
  ['计算机网络', 'interview-network', '计算机网络', 'Q293–Q329'],
  ['DevOps', 'interview-devops', 'DevOps', 'Q330–Q345'],
  ['服务端', 'interview-server', '服务端', 'Q346–Q355'],
  ['数据库', 'interview-database', '数据库', 'Q356–Q367'],
  ['AI 全栈', 'interview-ai-fullstack', 'AI 全栈', 'Q368–Q396'],
  ['业务场景', 'interview-business', '业务场景', 'Q397–Q403'],
];
```

It must reject missing/duplicate sections, require exactly 403 unique `## Qn｜` headings spanning Q1 through Q403, copy only referenced images, and write frontmatter accepted by `parseArticle()`.

- [ ] **Step 4: Run the importer tests**

Run: `node --test tests/import-interview-content.test.mjs`

Expected: PASS.

### Task 2: Generate the 17 classified articles

**Files:**
- Create: `src/articles/interview-*.md` (17 files)
- Create: `public/images/interview/*` (referenced PNG files)

- [ ] **Step 1: Run the importer against the optimized handbook**

Run:

```bash
node scripts/import-interview-content.mjs \
  /Users/bytedance/Desktop/大前端面试宝典108/大前端面试宝典-飞书优化版.md \
  /Users/bytedance/Desktop/大前端面试宝典108/images
```

Expected: `导入完成：17 篇专题，403 道题，86 张正文图片。`

- [ ] **Step 2: Verify classification boundaries**

Run a Node assertion that checks Q1/Q39 are in HTML + CSS, Q40/Q116 are in JavaScript, Q117 is in TypeScript, and Q403 is in 业务场景. Also assert that no question heading appears in more than one generated file.

- [ ] **Step 3: Validate all content**

Run: `npm run validate:content`

Expected: PASS with 24 notes and 8 resources.

### Task 3: Build the sandboxed JavaScript playground

**Files:**
- Create: `src/CodePlayground.tsx`
- Modify: `src/main.tsx`
- Modify: `src/style.css`

- [ ] **Step 1: Implement isolated execution**

Create a component with a JavaScript textarea, Run, Reset, and Clear buttons, preview iframe, and console panel. Generate iframe `srcDoc` so code runs only with `sandbox="allow-scripts"`. Override `console.log`, `console.warn`, and `console.error` inside the iframe and send formatted messages through `postMessage`; accept messages only when both the iframe window and a component-specific channel match.

- [ ] **Step 2: Integrate only with JavaScript articles**

In `src/main.tsx`, render:

```tsx
{article.category === 'JavaScript' && <CodePlayground />}
```

immediately before the Markdown article body. This makes the editor available to the imported JavaScript handbook article and the existing closure/event-loop notes without mixing it into TypeScript or other topics.

- [ ] **Step 3: Style the workbench**

Use a compact dark terminal/editor surface that fits the existing editorial green UI. Include clear focus states, responsive stacking below 760px, monospace editing, readable output levels, and a visible `Ctrl/⌘ + Enter` run hint.

- [ ] **Step 4: Verify editor safety and behavior**

Manually verify that `console.log`, thrown errors, DOM output, Reset, Clear, and keyboard execution work, while the iframe cannot access the parent DOM because `allow-same-origin` is absent.

### Task 4: Final verification

**Files:**
- Test: `tests/*.test.mjs`
- Verify: generated Markdown and images

- [ ] **Step 1: Run all tests**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Run content and TypeScript validation**

Run: `npm run validate:content && npm run typecheck`

Expected: both commands pass.

- [ ] **Step 3: Build production output**

Run: `npm run build`

Expected: Vite build succeeds and emits `dist/` without unresolved image references.

- [ ] **Step 4: Browser smoke test**

Verify `?view=notes`, `?article=interview-javascript`, JavaScript execution, a non-JavaScript article without the editor, image rendering, search, and mobile navigation.

