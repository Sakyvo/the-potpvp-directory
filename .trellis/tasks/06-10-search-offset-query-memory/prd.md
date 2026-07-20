# Full-mode search offset and query memory

## Goal

Keep full-mode search results aligned below the search panel and preserve the last query after closing the search UI.

## Requirements

- Applies to public full mode only.
- Search result navigation must place the current match immediately below the open search panel instead of underneath it.
- The offset must account for both the fixed topbar and the search panel height when the panel is open.
- Closing the search panel must preserve the latest query in memory for the current page session.
- Reopening search in the same page session should restore the previous query and show its results.
- Refreshing the page should clear the remembered query.
- Part-mode search behavior must not regress.

## Acceptance Criteria

- [ ] In full mode with search open, the current highlighted match scrolls below the search panel.
- [ ] Closing and reopening search restores the last query without using persistent storage.
- [ ] Reloading the page clears the remembered query.
- [ ] Part-mode search result list and navigation still work.
- [ ] Search close still removes highlights/results from the document view as appropriate.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
