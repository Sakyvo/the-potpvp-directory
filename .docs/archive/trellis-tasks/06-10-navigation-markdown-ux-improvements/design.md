# Navigation and Markdown UX Improvements Design

## Scope

This parent task coordinates four independent slices: TOC depth/Track, mobile table scrolling, full-mode search offset/query memory, and markdown list/heading spacing. Each slice should be independently shippable and verifiable.

## Affected Files

- Public UI: `index.html`, `js/app.js`, `css/main.css`
- Admin UI: `admin/index.html`, `js/admin.js`, `css/admin.css`, shared `css/main.css`
- Content normalization: `content/main.md`

## Design

### TOC Depth and Track

- Replace the boolean collapsed state with an integer depth state.
- Public storage keys should follow the existing `ppdir-*` pattern; admin storage keys should follow the existing `ppdir-admin-*` pattern.
- CSS should hide TOC levels above the selected depth via classes/data attributes, with a Track override for active branch descendants.
- JS should mark active/current/ancestor items using existing classes where possible.
- Opening the sidebar should call a shared "scroll active TOC item into view" routine after depth/Track visibility is applied.

### Mobile Tables

- Prefer a post-render enhancement that wraps markdown `table` elements in a scroll container for both public content and admin preview.
- Shared CSS owns the scroll container behavior.
- Keep current table styles on the actual `table`, `th`, and `td`.

### Full-Mode Search

- Keep the previous query in an in-memory variable only.
- `closeSearch()` should close UI and clear highlights/results without blanking the stored query.
- `openSearch()` should restore the stored query and rerun the appropriate search for the active mode.
- Match scrolling should use an offset that includes the search panel height when the search panel is open.

### StackEdit-Style Spacing

- Scope CSS changes to `.floor-body` list/heading selectors.
- Do not change `body` or `.floor-body` line-height.
- Targeted `content/main.md` normalization is allowed only for the OBS old-version preset list block.

## Compatibility

- Existing hash URLs must remain valid.
- Existing browser storage keys for view mode must remain unchanged.
- Existing mode toggles, admin source/preview behavior, copy buttons, image rendering, and table visual styling must remain intact.

## Rollback

Each child slice can be reverted independently because each has a narrow file set and acceptance criteria.
