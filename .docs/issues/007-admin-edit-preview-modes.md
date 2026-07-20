Status: open
Source: `.docs/archive/trellis-tasks/06-13-admin-edit-preview-modes`

## What to build

Keep admin as two explicit workflows: rendered `preview` with `full`/`part`
segmentation, and source-only `edit` with logical modules backed by the single
complete Markdown document. Management actions remain available through one
modal.

## Acceptance criteria

- [x] Preview/edit state, persistence, legacy `all` migration, and context-sensitive controls are implemented.
- [x] Edit modules update only their source range and support image paste/download handling.
- [x] The manage modal exposes maintenance, publish, and level-1/level-2 module creation.
- [x] Module insertion validates adjacent boundaries and selects the new module after insertion.
- [x] `main` remains an aggregate before `Part 3. Video`, while pre-boundary h2 sections and later h3 sections remain individually selectable.
- [x] Edit-module selection persists and preview/edit transitions anchor to the selected module top.
- [ ] Manually validate fresh and persisted state, long module lists, insertion boundaries, paste, publish, and responsive topbar behavior.
- [ ] Run JavaScript syntax, diff, and focused regression checks.

## Progress so far

The base workflow landed in `ab49770`, followed by refinements in `5eba520`,
`d9a9652`, `a857329`, `4c2b578`, and `5b67529`. Binding design details remain
available in the archived `design.md` and `implement.md`.

## Blocked by

None - can start immediately.
