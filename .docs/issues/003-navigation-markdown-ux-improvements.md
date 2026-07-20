Status: open
Source: `.docs/archive/trellis-tasks/06-10-navigation-markdown-ux-improvements`

## What to build

Complete the coordinated navigation and Markdown UX batch: TOC depth and
tracking, mobile table scrolling, session-only full-search memory, and the
targeted nested-list layout correction.

## Acceptance criteria

- [x] Each of the four independently shippable slices has an implementation in the repository.
- [ ] All four child issues pass their remaining browser and regression checks.
- [ ] Existing view modes, hash navigation, search behavior, and admin preview/edit switching remain intact together.

## Progress so far

The archived design split this batch into four vertical slices, and commits
`56d62a1` through `eb185dd` implemented and refined them. This issue remains
open as the batch-level validation gate.

## Blocked by

- `002-mobile-table-scroll.md`
- `004-search-offset-query-memory.md`
- `005-stackedit-markdown-spacing.md`
- `006-toc-depth-track.md`
