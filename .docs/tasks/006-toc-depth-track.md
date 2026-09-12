Status: open
Source: `.docs/archive/trellis-tasks/06-10-toc-depth-track`

## What to build

Provide matching public and admin TOCs with persistent 1/2/3 depth controls,
optional active-branch tracking, and useful positioning when the sidebar opens.

## Acceptance criteria

- [x] Public and admin sidebars expose persistent 1/2/3 depth and Track controls.
- [x] Legacy collapse state is read only for migration and is not duplicated in the UI.
- [x] Track visibility and active-item positioning are implemented for both TOCs.
- [ ] Verify public hash/scroll tracking and admin preview/edit tracking in the browser.
- [ ] Verify part/full navigation and TOC clicks still work at each depth.
- [ ] Run the focused JavaScript syntax and regression checks.

## Progress so far

The main implementation landed in `8c13765`, with admin tracking and sidebar
positioning refinements in `6601902` and `eb185dd`.

## Blocked by

None - can start immediately.
