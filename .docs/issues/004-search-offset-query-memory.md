Status: open
Source: `.docs/archive/trellis-tasks/06-10-search-offset-query-memory`

## What to build

In public full mode, place the active search match below the open search panel
and retain the last query only for the current page session.

## Acceptance criteria

- [x] Full-mode match scrolling includes the open search panel in its offset.
- [x] Closing and reopening search retains the query in memory without persistent storage.
- [ ] Verify a reload clears the query and closing search removes its highlights/results.
- [ ] Verify part-mode result navigation remains unchanged.
- [ ] Run the focused JavaScript syntax and regression checks.

## Progress so far

Implementation landed in `4ba6737` and dismissal behavior was refined in
`eb185dd`. The current state uses an in-memory `fullModeSearchQuery`.

## Blocked by

None - can start immediately.
