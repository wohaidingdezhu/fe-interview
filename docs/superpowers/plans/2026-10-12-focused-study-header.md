# Focused Study Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Execute this plan inline and verify every state before handoff. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make single-question study mode describe the current question instead of the whole interview topic, while preserving the normal article header.

**Architecture:** Extract the article heading area from `main.tsx` into a pure `ArticleHeader` component. The component receives optional study context, so focused rendering can use the current heading without changing persisted study-session data. Extend the existing share control with an optional stable anchor.

**Tech Stack:** React 19, TypeScript, CSS, Node test runner, Vite SSR test harness.

---

### Task 1: Lock the focused-header contract with a rendering test

**Files:**
- Modify: `tests/discovery-rendering.test.mjs`

- [x] **Step 1: Add focused and normal header fixtures**

Render `ArticleHeader` twice with the same fake topic. Assert that focused mode contains `Q5`、`单题学习`、the source topic, and an anchored share URL, while it omits the full-topic question count, reading time, and topic description. Assert that normal mode retains the topic metadata. Separately assert that the selected question becomes the article body's only `h1` in study mode.

- [x] **Step 2: Run the focused rendering test**

Run: `node --test tests/discovery-rendering.test.mjs`

Expected: FAIL because `ArticleHeader` and anchored sharing do not exist yet.

### Task 2: Extract the header and add precise question sharing

**Files:**
- Create: `src/ArticleHeader.tsx`
- Modify: `src/ShareButton.tsx`
- Modify: `src/main.tsx`

- [x] **Step 1: Implement `ArticleHeader`**

Normal mode must preserve the existing breadcrumb, metadata, title, description, tags, and article share control. Focused mode must render a compact question context, a `单题学习` label, source topic/category, a short instruction, a stable question share control, and a link that leaves study mode without clearing the resumable session. The selected question heading itself becomes the page `h1`, avoiding duplicate titles.

- [x] **Step 2: Support an optional share anchor**

Build `articles/<id>/#<anchor>` only when the anchor matches `q[1-9]\d*`. Change labels to “题目链接” in that state and keep existing article labels otherwise.

- [x] **Step 3: Replace inline header markup**

Pass `toc.find(heading => heading.id === question)?.title` into the focused header. Hide the standalone note `LearningControls` during study mode because the fixed study bar already owns status-and-continue actions.

### Task 3: Refine the focused visual hierarchy

**Files:**
- Modify: `src/discovery.css`

- [x] **Step 1: Add restrained editorial styling**

Use the existing warm-white/deep-green palette. Make the source topic a quiet context row, keep the current question as the only dominant heading, and stack actions safely below 760px without introducing a second card-heavy visual language.

### Task 4: Verify the complete change

**Files:**
- Modify only if a failing check reveals a scoped defect.

- [x] **Step 1: Run focused and full automated checks**

Run `node --test tests/discovery-rendering.test.mjs`, `npm test`, `npm run typecheck`, and `npm run build`.

Expected: all checks pass; content validation still reports 403 complete questions.

- [x] **Step 2: Verify real desktop and mobile reading**

Open a normal topic and `?article=interview-javascript&study=1&question=q100#q100`. Verify that normal metadata is unchanged, focused mode displays Q100 rather than topic-wide counts, the full-topic link leaves study mode, the share URL targets Q100, and 390px layout has no horizontal overflow.

- [x] **Step 3: Review the diff without committing**

Run `git diff --check` and inspect `git status --short`. Leave changes uncommitted unless the user explicitly requests a commit.
