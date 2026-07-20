Status: open
Source: `.docs/archive/trellis-tasks/06-10-mobile-table-scroll`

## What to build

Keep wide Markdown tables usable on mobile by scrolling them inside the
rendered content, with matching behavior in the public view and admin preview.

## Acceptance criteria

- [x] Public and admin render paths wrap Markdown tables in a local scroll container.
- [x] Shared styles preserve the table itself while enabling horizontal overflow on its wrapper.
- [ ] Verify touch scrolling at a mobile viewport without document-level horizontal overflow.
- [ ] Verify existing table borders, padding, headers, and admin preview parity.
- [ ] Run the focused JavaScript syntax and diff checks.

## Progress so far

Implementation landed in commit `ea3017c`; the wrapper and shared styles are
still present in the current public and admin render paths.

## Blocked by

None - can start immediately.
