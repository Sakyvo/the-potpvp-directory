# Admin edit and preview modes

## Goal

Redesign the admin module mode model so the top-level admin workflow is split into `preview` and `edit`.

`preview` is the default mode and preserves the existing admin `all` / `part` preview behavior. `edit` is optimized for copying, pasting, and editing logical document modules that do not match the existing public preview split.

## Confirmed Facts

- Admin currently has two independent controls:
  - Render/source view: `currentView` is `rendered` or `source`, controlled by `#view-toggle`.
  - Preview segmentation mode: `adminMode` is `all` or `part`, stored in `ppdir-admin-view-mode`, controlled by `#admin-mode-toggle`.
- Current `all` / `part` behavior is implemented in `renderPreview()`, `renderAdminSectionPreview()`, `renderAdminPartPreview()`, `ensureActiveSegment()`, and `parseAdminDoc()`.
- Current segmentation is generated from Markdown headings:
  - h2 headings become top-level sections.
  - Each section's first nested heading level becomes its child segment level.
- Current content headings confirm:
  - `## 序` starts at line 1.
  - `## Part 3. Video` starts at line 1104.
  - Video h3 children include `3.1. OBS`, `3.2. Vegas`, `3.3. Upscaling`, and `3.4. Interpolation`.
- There is no existing dedicated "add edit module" UI in admin.

## Requirements

- Replace the current admin top-level mode concept with `preview` and `edit`.
- Top-level mode UI labels are Chinese: `预览` and `编辑`; internal state values remain English `preview` and `edit`.
- The top-level `预览 / 编辑` mode switch is placed where the current admin `all / part` button lives.
- The old `预览 / 源码` control area becomes context-sensitive:
  - In `preview`, it shows the preview segmentation switch.
  - In `edit`, it shows the edit module dropdown.
- Rename the preview segmentation labels and state from `all / part` to `full / part`.
- Default the top-level admin mode to `preview`.
- Persist the user's selected top-level admin mode in browser local storage.
- Preserve existing `all` / `part` behavior under `preview`.
- `preview` is rendered-only: remove the existing source textarea entry from preview.
- Add `edit` mode for editing copy/paste-friendly modules.
- `edit` mode shows only the source textarea editor, using the same frontend styling as the existing admin source mode.
- In `edit`, the module selector is displayed where the existing `预览 / 源码` view toggle currently lives in the admin topbar.
- The edit module selector is a dropdown/select control showing `main` and every post-main h3 edit module.
- In `edit`, show and edit logical modules:
  - `main`: level-1 edit module; max heading h2; covers `序` through `2.3.4. Drill`, ending before `## Part 3. Video`.
  - Every h3 heading after `main` is a level-2 edit module. Current examples include `3.1. OBS`, `3.2. Vegas`, `3.3. Upscaling`, and `3.4. Interpolation`; future h3 headings after `main` follow the same rule automatically.
- The boundary between `main` and post-main h3 edit modules is the h2 heading titled `Part 3. Video`.
- Add functionality to create new edit modules:
  - Add level-1 module, for new h2-level content.
  - Add level-2 module, for new h3-level content under an h2 parent, especially when creating a new part across heading boundaries.
- Adding an edit module uses a modal dialog.
- The add-module modal lets the user enter the new module title and manually choose the segment before it and the segment after it.
- The add-module modal strongly validates the selected before/after segments:
  - The selected before and after segments must be adjacent in the relevant module list.
  - Boundary values `文档开头` and `文档末尾` are allowed.
  - Invalid non-adjacent combinations block insertion and must not modify `sourceBuffer`.
- Keep publish behavior compatible with the single underlying Markdown source.
- Keep existing image paste/download handling available in edit workflows.
- Replace separate topbar action buttons for maintenance, publish, and add-module actions with a single `管理` button.
- Clicking `管理` opens a modal dialog containing existing maintenance and publish actions plus new add-module actions.

## Acceptance Criteria

- [ ] Opening admin defaults to `preview` when no local preference exists.
- [ ] Selecting `preview` or `edit` persists in browser local storage.
- [ ] Top-level mode control displays `预览` / `编辑` while code state uses `preview` / `edit`.
- [ ] Top-level mode switch occupies the current admin `all / part` button location.
- [ ] The former `预览 / 源码` topbar area shows `full / part` in `preview` and a module dropdown in `edit`.
- [ ] Existing stored/admin `all` mode is migrated or treated as `full`.
- [ ] In `preview`, the existing `all` / `part` behavior remains available and keeps current rendering/navigation behavior.
- [ ] In `preview`, there is no source textarea toggle; source editing is only available in `edit`.
- [ ] In `edit`, the former `预览 / 源码` topbar area is replaced by the edit module selector.
- [ ] Edit module selector is a dropdown/select control that supports long module lists without overflowing the topbar.
- [ ] In `edit`, users can select `main` and every post-main h3 edit module from the admin sidebar or equivalent module list.
- [ ] Edit module boundary detection uses the h2 heading title `Part 3. Video`.
- [ ] Selecting an edit module shows only the source textarea for that module, styled like the existing admin source mode.
- [ ] Editing/pasting inside an edit module updates only that module's Markdown range in the underlying document.
- [ ] Adding a level-1 edit module inserts an h2-level module at the intended location without corrupting existing headings.
- [ ] Adding a level-2 edit module inserts an h3-level module under the intended h2 parent without corrupting existing headings.
- [ ] Add-module modal requires enough information to determine a single insertion point before modifying `sourceBuffer`.
- [ ] Add-module modal rejects non-adjacent before/after segment combinations.
- [ ] Add-module modal supports `文档开头` and `文档末尾` boundary insertion points.
- [ ] After adding a module, admin switches to the new module in `edit` mode.
- [ ] Topbar exposes one `管理` entry for maintenance, publish, and add-module actions.
- [ ] Clicking `管理` opens a modal, not a dropdown menu.
- [ ] Existing maintenance and publish behavior remain available from `管理`.
- [ ] Publishing still writes the complete Markdown document.

## Out of Scope

- Changing public site rendering.
- Changing Markdown typography/list/table rendering outside admin module selection needs.
- Replacing the existing publish API.

## Open Questions

- None currently blocking initial design.
