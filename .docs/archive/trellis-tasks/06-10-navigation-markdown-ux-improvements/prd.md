# Plan navigation and markdown UX improvements

## Goal

Plan TOC tracking/depth controls, mobile table scrolling, full-mode search offset retention, and StackEdit-inspired heading/list layout fixes.

## Confirmed Facts

- Public TOC/search/rendering live mainly in `js/app.js`, `index.html`, and `css/main.css`.
- Admin TOC/rendered preview/source navigation live mainly in `js/admin.js`, `admin/index.html`, and shared `css/main.css`.
- Current public TOC uses `TOC_COLLAPSED_KEY`; collapsed mode hides `h4`-`h6`.
- Current admin TOC uses `ADMIN_TOC_COLLAPSED_KEY`; collapsed mode follows the same shared CSS class behavior.
- Public full-mode search clears the input in `closeSearch()` and scrolls matches with the generic topbar-only offset.
- Tables are rendered as raw `.floor-body table` elements with no horizontal overflow wrapper.
- The OBS example in `content/main.md` contains mixed/non-standard Markdown indentation around nested ordered and unordered lists; CSS can improve marker spacing, but malformed source may still need targeted normalization.

## Requirements

### TOC Depth, Tracking, and Auto Positioning

- Apply to both public and admin TOCs.
- Replace the current binary collapse button with a compact slider/segmented control.
- Provide three depth levels:
  - Level 1: same as current collapsed TOC; show `h2` and `h3`.
  - Level 2: show `h2`, `h3`, and `h4`.
  - Level 3: same as current expanded TOC; show `h2` through `h6`.
- Default depth level is 1.
- Persist the selected depth in the user's browser.
- Add a Track control under the depth control.
- When Track is enabled, the active heading branch expands all descendants below the currently visited highest heading; other branches keep the selected depth behavior.
- Opening the TOC should auto-position the current item at the first visible row when possible. If the active branch cannot fit inside the sidebar, align it tolerantly near the bottom rather than forcing an awkward top position.
- Current heading detection may use the hash/URL on initial load and scroll/caret position afterward.

### Mobile Table Scrolling

- Tables that exceed mobile viewport width must be horizontally scrollable/draggable.
- The page itself must not gain unwanted horizontal scrolling.

### Full-Mode Search

- In public full mode, the current search hit must scroll to the first row below the open search panel, not underneath it.
- Closing the search panel must preserve the last query for the current page session.
- Refreshing the page must clear the remembered query.

### Markdown Heading and List Layout

- Use StackEdit as the reference for clearer heading/list rhythm, but keep this project's existing line-height and overall rendering density.
- Slightly increase ordered and unordered list indentation so a child bullet marker aligns visually with the parent list item's text start, matching the provided screenshot intent.
- Fix the OBS old-version list block so `1`-`4` and the low-latency bullet list render at the intended nesting/alignment.
- Targeted source normalization is allowed for the malformed OBS list block.
- Do not change unrelated rendering settings such as global line height.

## Acceptance Criteria

- [ ] Public and admin TOCs expose the new 1/2/3 depth control and no longer use the old binary collapse button.
- [ ] TOC depth defaults to level 1 and persists in browser storage.
- [ ] Track expands the active branch descendants without expanding unrelated branches.
- [ ] Opening the TOC scrolls to the active/current heading branch.
- [ ] Mobile tables can be dragged horizontally without causing full-page horizontal overflow.
- [ ] Full-mode search positions the current match below the search panel while it is open.
- [ ] Closing and reopening search restores the last query until page refresh.
- [ ] Heading/list layout fixes the provided OBS list case and increases list indent only slightly.
- [ ] Existing view mode, hash navigation, search, and admin source/preview switching behavior remain intact.

## Out of Scope

- Broad visual redesign of the site.
- Changing markdown line-height or unrelated spacing.
- Rewriting large content sections unrelated to the reported OBS list block.

## Task Map

- `06-10-toc-depth-track`: TOC depth control, Track behavior, and auto-positioning for both public and admin.
- `06-10-mobile-table-scroll`: mobile horizontal scrolling for wide markdown tables.
- `06-10-search-offset-query-memory`: public full-mode search offset and session-only query memory.
- `06-10-stackedit-markdown-spacing`: StackEdit-inspired list/heading spacing plus targeted OBS source normalization.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
