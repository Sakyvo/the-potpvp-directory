Status: open
Source: `.docs/archive/trellis-tasks/06-10-stackedit-markdown-spacing`

## What to build

Render the OBS preset lists with the intended nested hierarchy and restrained
list indentation in both public content and admin preview, without changing
global typography.

## Acceptance criteria

- [x] The targeted OBS source block has the intended parent/child hierarchy.
- [x] List indentation changes remain scoped to rendered Markdown content.
- [x] Global line-height and unrelated Markdown surfaces are unchanged by the implementation.
- [ ] Visually verify the supplied nested-list scenario in public and admin views.
- [ ] Run the focused diff and rendering regression checks.

## Progress so far

Commits `56d62a1` and `47fb63b` normalized the source block and refined marker
alignment. The current quality contract records the required scope.

## Blocked by

None - can start immediately.
