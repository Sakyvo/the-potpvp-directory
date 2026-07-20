# TOC depth and track behavior

## Goal

Implement 1/2/3 TOC depth control, active-branch tracking, and auto-positioning for both admin and normal views.

## Requirements

- Applies to both public (`index.html`, `js/app.js`) and admin (`admin/index.html`, `js/admin.js`) TOCs.
- Replace the binary collapse button with a compact 1/2/3 depth control in the sidebar header area.
- Store the selected depth in browser storage separately for public and admin views, matching existing storage-key patterns.
- Depth levels:
  - Level 1: show `h2` and `h3` only; this is the default and matches current collapsed behavior.
  - Level 2: show `h2`, `h3`, and `h4`.
  - Level 3: show `h2` through `h6`; this matches current expanded behavior.
- Add a Track control under the depth control.
- When Track is enabled, the currently visited heading branch expands all descendant headings below the active heading while unrelated branches still follow the selected depth.
- Opening the TOC auto-scrolls the sidebar to the current heading item or active branch.
- If the active branch is taller than the available sidebar area, use tolerant nearest/bottom alignment rather than forcing the active item to the first row.
- Public current heading detection may use URL hash on initial load and scroll position afterward.
- Admin current heading detection should use rendered-preview scroll position in preview mode and caret/line position in source mode.

## Acceptance Criteria

- [ ] Public TOC has a 1/2/3 depth control, defaults to level 1, and persists the selected depth across reloads.
- [ ] Admin TOC has the same depth control and persistence behavior.
- [ ] Existing binary collapse button behavior is removed or replaced, not duplicated.
- [ ] Track control is visible below the depth control in both sidebars.
- [ ] Track expands the active branch descendants without expanding unrelated branches.
- [ ] Opening the public TOC scrolls to the active/current heading.
- [ ] Opening the admin TOC scrolls to the active/current heading in both preview and source workflows.
- [ ] Existing hash navigation, part/full mode behavior, admin all/part mode behavior, and TOC click navigation still work.

## Decision

- Replace the old collapse toggles with `data-toc-depth` button groups plus Track checkboxes in both sidebars.
- Persist public state as `ppdir-toc-depth` / `ppdir-toc-track`; persist admin state as `ppdir-admin-toc-depth` / `ppdir-admin-toc-track`.
- Keep legacy collapsed keys only as one-time read compatibility for deriving the default depth when no depth key exists.
- Use CSS `data-depth` rules for baseline 1/2/3 visibility and `.toc.track .toc-track-visible` for active branch expansion.
- Public current-heading state remains hash/scroll driven; admin current-heading state uses preview scroll in rendered mode and textarea caret line in source mode.
- Opening either sidebar refreshes active state and scrolls to the active/current item with tolerant bottom alignment for tall tracked branches.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
