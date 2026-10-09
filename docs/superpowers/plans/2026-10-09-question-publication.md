# Per-Question Publication and Semantic Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow individually reviewed interview questions to publish without exposing the remaining draft questions, and reject requirement-only or definition-only implementations even when their character count is non-zero.

**Architecture:** Store question review state in `src/data/question-publication.json`, keyed by stable global IDs such as `Q134`. The publication plugin will join this manifest with parsed Markdown question sections, validate each published question's quality, sources, version and review date, then emit topic articles containing only approved question sections. Development keeps the full draft body while exposing publication counts in metadata.

**Tech Stack:** Node.js 24, TypeScript, Vite virtual modules, Markdown, React, `node:test`.

---

### Task 1: Define and validate per-question review metadata

**Files:**
- Create: `src/data/question-publication.json`
- Modify: `src/data-utils.ts`
- Modify: `scripts/library.mjs`
- Test: `tests/publication.test.mjs`

- [ ] **Step 1: Add a failing schema test**

```js
assert.deepEqual(validateQuestionPublicationMap({ Q1: { status: 'draft' } }).Q1.status, 'draft');
assert.throws(() => validateQuestionPublicationMap({ question1: { status: 'published' } }), /Q数字/);
assert.throws(() => validateQuestionPublicationMap({ Q1: { status: 'published', sources: ['javascript:bad'] } }), /HTTP/);
```

- [ ] **Step 2: Add the metadata model**

```ts
export type QuestionPublication = {
  status: PublicationStatus;
  quality: 'complete' | 'incomplete';
  sources: string[];
  technologyVersion?: string;
  reviewedAt?: string;
};
```

Validate `Q<number>` keys, URL sources, ISO dates and publication enum values. Missing entries are interpreted as draft/incomplete by the publication layer.

- [ ] **Step 3: Load the manifest with the library**

`readLibrary()` must return `{ articles, resources, questionPublication }` and watch `src/data/question-publication.json` in development.

### Task 2: Filter emitted content at question granularity

**Files:**
- Modify: `scripts/publication.mjs`
- Modify: `scripts/publication-plugin.mjs`
- Modify: `scripts/content-assets.mjs`
- Modify: `src/data-utils.ts`
- Modify: `src/main.tsx`
- Test: `tests/publication.test.mjs`

- [ ] **Step 1: Write failing partial-publication tests**

Create a draft topic with Q1 and Q2, publish only Q2 in the manifest, and assert that production contains Q2 but neither Q1 nor its image/search text. Also assert that a topic with no published questions is absent.

- [ ] **Step 2: Split Markdown into stable question sections**

Each parsed question must expose its raw Markdown section, answer body, semantic issues and global number. Preserve any topic preface only when at least one question is emitted.

- [ ] **Step 3: Select individually published questions**

For question-based articles, include the article when one or more manifest entries are `published`; replace its body with only those sections and expose it as published metadata. Non-question articles keep the existing whole-article behavior.

- [ ] **Step 4: Add publication counts**

Article metadata gains `questionCount` and `publishedQuestionCount`. Development article headers display `x / n 题已公开`; production displays only the filtered count.

### Task 3: Detect answers that contain text but no solution

**Files:**
- Modify: `scripts/publication.mjs`
- Modify: `scripts/validate-content.mjs`
- Test: `tests/publication.test.mjs`

- [ ] **Step 1: Add failing semantic tests**

```js
const requirementOnly = inspectQuestions(article('## Q134｜实现 add\n1. add(1)(2).valueOf()'))[0];
assert.ok(requirementOnly.issues.includes('missing-code'));
const definitionOnly = inspectQuestions(article('## Q137｜实现防抖\n定义：延迟执行。\n![](a.png)'))[0];
assert.ok(definitionOnly.issues.includes('missing-code'));
```

- [ ] **Step 2: Add implementation heuristics**

Titles containing implementation verbs (`实现`, `手写`, `封装`, `反转`, `遍历`, `并发`, `防抖`, `节流`, and related terms) require a fenced code block. Continue reporting empty and short answers, and add `missing-code` / `definition-only` issue labels.

- [ ] **Step 3: Strengthen publication gates and reports**

Published questions must be complete, have no semantic issue, and provide at least one source, a technology version and review date. Draft issues remain warnings. The report summary includes published/draft questions and missing per-question sources/versions.

### Task 4: Complete and test Q134, Q137 and Q138

**Files:**
- Modify: `examples/interview-algorithms.mjs`
- Modify: `src/articles/interview-coding.md`
- Modify: `src/data/question-publication.json`
- Modify: `tests/answer-examples.test.mjs`

- [ ] **Step 1: Add executable implementations**

Add a chainable numeric `add`, trailing debounce with `cancel`/`flush`, and leading-plus-trailing throttle with `cancel`. Explain accepted inputs, `this`, return-value timing and timer cleanup.

- [ ] **Step 2: Test behavior and boundaries**

Test all three add examples, debounce coalescing/cancel/flush, and throttle leading/trailing behavior. Keep article snippets byte-for-byte aligned with exported function source, matching the existing acceptance test.

- [ ] **Step 3: Publish only these reviewed questions**

Mark Q134, Q137 and Q138 as published/complete in the manifest with concrete source URLs, technology versions and `reviewedAt`. All other questions remain draft by omission.

### Task 5: Final verification

**Files:**
- Verify: `.reports/content-quality.md`
- Verify: production `dist/content` and `dist/search`

- [ ] **Step 1: Run tests and validators**

Run `npm test`, `npm run typecheck`, and `npm run validate:content`.

- [ ] **Step 2: Build and inspect production output**

Run `npm run build`. Verify the production catalog has the original seven public notes plus one partially published coding topic, contains Q134/Q137/Q138, and excludes Q123/Q135 and draft-only images/search text.
