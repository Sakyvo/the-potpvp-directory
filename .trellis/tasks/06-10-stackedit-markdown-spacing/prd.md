# StackEdit-style markdown spacing

## Goal

Tighten list indentation and fix the OBS preset block hierarchy to match the intended StackEdit-style layout without changing line height or unrelated rendering settings.

## Requirements

- Applies to markdown rendering in public content and admin rendered preview.
- Use StackEdit as the visual reference for list readability, but do not copy its large spacing wholesale.
- Slightly increase ordered/unordered list indentation so nested bullet markers align with the parent item text start, matching the provided screenshot direction.
- Do not change global line-height or unrelated paragraph/code/table spacing.
- Improve heading rhythm only where needed for this issue; avoid broad typography redesign.
- Fix the OBS old-version preset block in `content/main.md` with targeted source normalization:
  - `1` through `4` should appear nested under "标准预设".
  - each numbered item should contain its "特点" and "代价" bullets as children.
  - "低延迟质量" / "低延迟" / "低延迟性能" should be children of "低延迟预设" and remain visually parallel with the explanatory text below that section.

## Acceptance Criteria

- [ ] Public content renders the OBS preset block with the intended nested hierarchy.
- [ ] Admin rendered preview renders the same block consistently.
- [ ] Ordered and unordered list indentation is slightly wider than current styling.
- [ ] The bullet marker aligns visually with the parent item text start in the provided screenshot scenario.
- [ ] Global line-height and unrelated markdown rendering remain unchanged.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
