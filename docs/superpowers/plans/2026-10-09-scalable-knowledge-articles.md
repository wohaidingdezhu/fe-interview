# Scalable Knowledge Articles and Chrome DevTools Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a sourced Chrome DevTools debugging workflow article and make future knowledge additions easier to organize and scaffold safely.

**Architecture:** Keep standalone knowledge as one Markdown file per topic, separate from legacy `Qxxx` interview-bank sections. Extend the library reader to recursively discover categorized subdirectories, and add a no-overwrite CLI that creates valid draft frontmatter. Existing publication, lazy loading, search and deployment pipelines consume the same parsed article model without UI changes.

**Tech Stack:** Node.js 24, Markdown/YAML, React/Vite virtual library, `node:test`.

---

### Task 1: Recursively discover categorized article directories

**Files:**
- Modify: `scripts/library.mjs`
- Test: `tests/library.test.mjs`

- [ ] **Step 1: Write a failing recursive discovery test**

Create `src/articles/browser/chrome.md` and `src/articles/react/hooks/persist.md` in a temporary repository, then assert `readLibrary(root)` returns both parsed IDs and preserves duplicate-ID validation.

- [ ] **Step 2: Implement recursive Markdown discovery**

Use `readdir(..., { withFileTypes: true })`, recurse only into real directories, ignore hidden directories and symbolic links, and sort relative paths before parsing for deterministic results.

- [ ] **Step 3: Run the targeted test**

Run: `node --test tests/library.test.mjs`

Expected: PASS.

### Task 2: Add a safe article scaffolding command

**Files:**
- Create: `scripts/new-article.mjs`
- Modify: `package.json`
- Test: `tests/new-article.test.mjs`

- [ ] **Step 1: Write failing CLI tests**

Verify a command with `browser/chrome-devtools-workflow`, title, category, description and tags creates nested directories and valid draft frontmatter. Verify path traversal, invalid IDs and overwriting an existing article fail without changing the file.

- [ ] **Step 2: Implement the scaffold**

Support:

```bash
npm run new:article -- browser/chrome-devtools-workflow \
  --title "Chrome DevTools 调试操作流程" \
  --category 浏览器 \
  --description "从复现问题到定位、验证和记录的完整调试流程。" \
  --tags "Chrome DevTools,调试,性能"
```

Generate `status: draft`, `quality: incomplete`, empty `sources`, optional `technologyVersion`, a stable ID derived from the final path segment, and an `## 内容提纲` body. Use exclusive file creation so existing content is never overwritten.

- [ ] **Step 3: Run the targeted test**

Run: `node --test tests/new-article.test.mjs`

Expected: PASS.

### Task 3: Add the Chrome DevTools workflow article

**Files:**
- Create: `src/articles/browser/chrome-devtools-workflow.md`

- [ ] **Step 1: Write validated metadata**

Use semantic ID `chrome-devtools-workflow`, category `浏览器`, tags for Chrome DevTools/debugging/performance, `status: draft`, `quality: complete`, official Chrome sources and a rolling Chrome DevTools version note.

- [ ] **Step 2: Write the operational workflow**

Cover: opening DevTools; reproduce-and-record loop; Elements/CSS; Sources breakpoints and stepping; Console helpers; Network request diagnosis; Application storage/service workers; Performance recordings; Memory snapshots; mobile and Android remote debugging; source maps; common symptom-to-panel flows; evidence capture and safety cautions.

- [ ] **Step 3: Keep procedures testable**

Every workflow states the action, the expected observable result, and the next branch when the result differs. Do not claim UI labels that are not backed by official Chrome documentation.

### Task 4: Document the large-knowledge-base convention

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document storage rules**

State that general knowledge uses one semantic Markdown file per topic under category subdirectories; `Qxxx` remains a legacy stable ID only for the interview bank; new unrelated knowledge does not receive a Q number.

- [ ] **Step 2: Document the scaffold and publication flow**

Explain scaffold → write → sources/version → `quality: complete` → review → `status: published` → test/build. Warn that the original handbook importer is a bootstrap tool and must not overwrite curated content.

### Task 5: Final verification

**Files:**
- Verify: generated article and metadata

- [ ] **Step 1: Run `npm test`, `npm run typecheck`, and `npm run validate:content`**

Expected: all pass; the new article is visible only in development because it remains draft.

- [ ] **Step 2: Run `npm run build`**

Expected: production succeeds and does not contain the Chrome article body until its status is explicitly published.

### Task 6: Add a local maintenance queue for large libraries

**Files:**
- Modify: `src/data-utils.ts`
- Modify: `src/LibraryList.tsx`
- Modify: `src/style.css`
- Test: `tests/data-utils.test.mjs`

- [ ] **Step 1: Add failing maintenance-filter tests**

Verify `incomplete` returns incomplete notes, `ready` returns draft/complete notes, `draft` returns all drafts, and `published` returns public items. Resources without a quality field must not appear in `incomplete` or `ready`.

- [ ] **Step 2: Extend the shared filter model**

Add optional `status` and `quality` fields to `ListItem` and a `maintenance` filter supporting `draft`, `published`, `incomplete`, and `ready` (`draft + complete`). Keep existing callers compatible by making the new filter optional.

- [ ] **Step 3: Add the URL-backed maintenance selector**

On the notes list, add a `维护状态` select whose value is stored in the `maintenance` query parameter. Display compact badges for `待补充`, `待审核`, and `已公开`. Hide the selector on external resources where quality does not apply.

- [ ] **Step 4: Preserve the editorial visual language**

Use restrained amber for review-ready content, muted gray for incomplete drafts, and green for public content. Keep mobile controls stacked and keyboard focus visible.
