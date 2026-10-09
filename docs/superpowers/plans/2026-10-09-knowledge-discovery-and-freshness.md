# Knowledge Discovery and Freshness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a growing knowledge library easier to find, connect and periodically review through aliases, related articles and freshness metadata.

**Architecture:** Extend article frontmatter with optional `aliases`, `related`, `updatedAt` and `reviewedAt`. Keep validation centralized in `parseArticle`/`validateContent`, feed aliases into the existing lazy search index, and resolve related IDs only against the runtime catalog so production never links to drafts. Render a restrained editorial related-content rail beneath articles without changing primary navigation.

**Tech Stack:** TypeScript, React 19, Markdown/YAML, Vite virtual assets, Node.js tests.

---

### Task 1: Extend article metadata safely

**Files:**
- Modify: `src/data-utils.ts`
- Test: `tests/data-utils.test.mjs`

- [ ] Add failing tests for deduplicated aliases/related IDs, invalid related IDs, invalid dates, and `updatedAt` earlier than `addedAt`.
- [ ] Add optional metadata with empty-array defaults and ISO date validation.
- [ ] Keep all existing Markdown valid without migration.

### Task 2: Validate knowledge relationships and freshness

**Files:**
- Modify: `scripts/publication.mjs`
- Modify: `scripts/validate-content.mjs`
- Test: `tests/publication.test.mjs`

- [ ] Reject self-related IDs and missing related IDs.
- [ ] Warn when a published article points to a draft relation; production UI will omit it.
- [ ] Warn when reviewed content was updated after its review date, and report published articles missing a review date without blocking current legacy content.

### Task 3: Improve search and article discovery

**Files:**
- Modify: `scripts/content-assets.mjs`
- Modify: `src/main.tsx`
- Modify: `src/style.css`
- Test: `tests/search.test.mjs`

- [ ] Include aliases in the lazy search document so terms such as `Google 浏览器调试` and `F12 调试` find the Chrome article.
- [ ] Show updated/reviewed dates in article metadata when present.
- [ ] Render related public/local articles as compact editorial cards after the article body; silently omit IDs unavailable in the current production catalog.

### Task 4: Update scaffolding and the Chrome article

**Files:**
- Modify: `scripts/new-article.mjs`
- Modify: `tests/new-article.test.mjs`
- Modify: `src/articles/browser/chrome-devtools-workflow.md`
- Modify: `README.md`

- [ ] Accept comma-separated `--aliases`, `--related`, plus `--updated-at` and `--reviewed-at` flags.
- [ ] Add Chrome search aliases and related knowledge IDs.
- [ ] Document semantic IDs, aliases, related links and freshness review workflow.

### Task 5: Verify

- [ ] Run all tests, type checking, content validation and production build.
- [ ] Confirm the draft Chrome article is searchable in development by aliases but absent from production search until explicitly published.
