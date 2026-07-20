# Mobile table horizontal scrolling

## Goal

Allow wide markdown tables to scroll horizontally on mobile without changing the rest of the typography.

## Requirements

- Applies to markdown tables in public content and admin rendered preview.
- Tables wider than the viewport/container must be horizontally scrollable with touch drag and mouse/trackpad horizontal scrolling.
- The document body must not gain horizontal overflow.
- Table styling should remain visually consistent with the current borders, padding, and header background.
- Do not change typography, line-height, or unrelated markdown spacing.

## Acceptance Criteria

- [ ] A wide table on mobile can be scrolled horizontally.
- [ ] The page itself does not scroll sideways on mobile.
- [ ] Public rendered content and admin preview behave consistently.
- [ ] Existing table border/padding/header styles remain intact.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
