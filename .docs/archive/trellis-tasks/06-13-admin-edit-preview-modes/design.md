# Admin edit and preview modes design

## Scope

This task changes only the admin module. The public site rendering and content format stay unchanged except for user-driven Markdown edits made through admin.

Affected files:

- `admin/index.html`
- `css/admin.css`
- `js/admin.js`

## Existing Model

Admin currently has two state axes:

- `currentView`: `rendered` or `source`, controlled by the old `预览 / 源码` buttons.
- `adminMode`: `all` or `part`, stored in `ppdir-admin-view-mode`, controlled by the old single `all/part` button.

`parseAdminDoc()` already produces h2 sections, child segments, entries, and line ranges from a single Markdown buffer. `syncSourceEditorToBuffer()`, `getSegmentMarkdown()`, and `replaceSegmentMarkdown()` already preserve the single source buffer while editing a selected segment.

## New State Model

### Top-level mode

Add a top-level admin mode:

- `preview`
- `edit`

Default: `preview`.

Storage key: `ppdir-admin-work-mode`.

UI labels: `预览` / `编辑`.

### Preview mode

Preview mode is rendered-only. It preserves the current rendered `all/part` behavior, renamed to:

- `full`
- `part`

The existing storage key `ppdir-admin-view-mode` can continue storing the preview segmentation mode, but values must migrate:

- old `all` -> `full`
- old `part` -> `part`

In preview mode, the former `预览 / 源码` topbar area shows the `full / part` switch.

### Edit mode

Edit mode shows only the source textarea, using the current source editor styling. The former `预览 / 源码` topbar area shows a module dropdown.

Edit module model:

- `main`: h2-level module; covers document start through the line before `## Part 3. Video`.
- post-main h3 modules: every h3 range under the boundary h2 `Part 3. Video`, including future h3 headings under that h2.

Boundary is intentionally title-based per product decision.

Edit module selection must update the textarea with only that module's Markdown range. Input/paste sync writes back to only the selected edit module range in `sourceBuffer`.

## Admin Topbar

Current old controls are remapped:

- Old `view-toggle` position -> context control:
  - preview: `full / part`
  - edit: module dropdown
- Old `admin-mode-toggle` position -> top-level `预览 / 编辑`
- Existing `维护`, `发布`, and add-module actions move into a single `管理` modal.

Undo/redo and status remain topbar actions.

## Manage Modal

The `管理` button opens a modal, not a dropdown.

Modal actions:

- Add level-1 module
- Add level-2 module
- Maintenance mode
- Publish

Existing publish progress modal can remain separate and be opened from the manage modal.

## Add Module Modal

Adding a module opens a modal and requires:

- module level: level-1 or level-2, chosen by the manage action that opened it
- title
- segment before
- segment after

Validation:

- before/after must identify one insertion point.
- non-boundary before/after selections must be adjacent in the relevant list.
- boundary values `文档开头` and `文档末尾` are allowed.
- invalid choices must block insertion and leave `sourceBuffer` unchanged.

Insertion:

- level-1 inserts an h2 heading.
- level-2 inserts an h3 heading under the post-main boundary h2 range.
- after insertion, switch to `edit` and select the newly added module.

## Compatibility

- Do not change publish API behavior.
- Do not change Shimo image paste/download handling.
- Do not change public page rendering.
- Existing users with `ppdir-admin-view-mode=all` should land in preview full mode.
- Existing draft/source buffer behavior must remain backed by the single complete Markdown document.

## Risks

- Range synchronization can corrupt content if edit module start/end lines are stale after textarea edits. Reparse after writes and keep active module by stable module identity when possible.
- Title-based boundary can break if `Part 3. Video` is renamed. This is an accepted product trade-off.
- Moving publish/maintenance behind manage modal changes admin muscle memory; keep labels explicit.
