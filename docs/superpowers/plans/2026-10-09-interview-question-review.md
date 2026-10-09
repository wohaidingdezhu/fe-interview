# Interview Question Technical Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Technically review Q1–Q403 in number order, complete executable answers, attach per-question sources and versions, publish only verified questions, and isolate subjective decisions for the owner.

**Architecture:** Keep question bodies in the existing topic Markdown files and use `question-publication.json` as the review ledger. Executable answers are mirrored in `examples/interview-algorithms.mjs` and tested; browser-only examples receive complete code plus verification steps. A separate owner-decision report records questions that cannot be approved from public specifications alone.

**Tech Stack:** Markdown, JavaScript, browser APIs, Node.js `node:test`, official Web/React/Vue specifications and documentation.

---

### Task 1: Repair the 13 semantic completeness findings

**Files:**
- Modify: the affected `src/articles/interview-*.md` files
- Modify: `examples/interview-algorithms.mjs`
- Modify: `tests/answer-examples.test.mjs`
- Modify: `src/data/question-publication.json`
- Create: `docs/review/manual-review-needed.md`

- [x] Add runnable or fully specified implementations for Q25, Q54, Q63, Q88, Q94, Q96, Q150, Q151, Q157, Q158, Q266 and Q319.
- [x] Add executable tests for countdown scheduling, callback-to-Promise adaptation, safe path setting, permutations, linked-list middle, chain methods, and call/apply/bind boundaries.
- [x] Resolve Q197 with the fixed Alien Signals v2.0.0 commit and a separately labeled, tested teaching implementation.
- [x] Publish only questions whose code, explanation, sources and version pass validation.

### Task 2: Review Q1–Q39

- [x] Check HTML/CSS terminology against MDN/CSS specifications, correct examples, add per-question sources/version, then publish approved questions in ascending order.

### Task 3: Review Q40–Q122

- [x] Review JavaScript and TypeScript answers against ECMAScript, MDN and TypeScript documentation; execute code examples and record manual-only engine claims separately.

### Task 4: Review Q123–Q203

- [x] Review coding and Vue answers; require runnable tests for algorithms and fixed upstream versions/commits for framework internals.

### Task 5: Review Q204–Q289

- [x] Review React, engineering, browser, performance and design-pattern answers; separate stable API behavior from implementation details.

### Task 6: Review Q290–Q367

- [x] Review operating systems, networking, DevOps, server and database answers using standards and official project documentation.

### Task 7: Review Q368–Q403

- [x] Review AI/full-stack and business scenarios; mark provider/version-sensitive claims, and move organization-specific judgment to the owner-decision report.

### Task 8: Final audit

- [x] Require zero published-question validation errors, run all tests/build, inspect the production search/body/image outputs, and report exact published/draft/manual counts without claiming owner approval.

Final evidence: docs/review/project-verification.md. Completion means technical revision and stated checks, not owner sign-off or deployment.
