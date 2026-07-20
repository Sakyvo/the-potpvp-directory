# Admin edit and preview modes implementation plan

## Checklist

1. Refactor admin state names without changing behavior
   - Add top-level `adminWorkMode` with storage key `ppdir-admin-work-mode`.
   - Rename preview segmentation values from `all` to `full`, preserving `part`.
   - Treat old stored `all` as `full`.
   - Keep existing preview rendering behavior working before adding edit features.

2. Update admin topbar markup and CSS
   - Replace old `view-toggle` content with a context-control container.
   - Move top-level `预览 / 编辑` switch into the old `admin-mode-toggle` slot.
   - Replace separate `维护` and `发布` buttons with one `管理` button.
   - Add manage modal shell and add-module modal shell.
   - Keep textarea styling identical to current `.source-editor`.

3. Implement preview context controls
   - In `preview`, render `full / part` controls in the former view-toggle area.
   - `full / part` must call existing preview render paths.
   - Hide/disable source textarea entry in preview.

4. Implement edit module parsing
   - Add a function that derives edit modules from `parseAdminDoc()` output.
   - `main` range: document start to boundary h2 start.
   - Boundary h2: title `Part 3. Video`.
   - h3 module ranges: each h3 under the boundary h2 until the next sibling h3 or boundary section end.
   - Preserve enough identity to reselect a module after edits.

5. Implement edit mode rendering and sync
   - In `edit`, show only `#source-editor`.
   - Render module dropdown in the context-control area.
   - Selecting a module writes pending textarea changes to `sourceBuffer`, reparses, then loads the selected module range.
   - Source textarea input/paste updates only selected module range.
   - Existing image paste handling remains available in the textarea.

6. Implement manage modal
   - `管理` opens modal actions for add level-1, add level-2, maintenance, publish.
   - Maintenance action calls existing maintenance toggle logic.
   - Publish action closes or backgrounds manage modal and calls existing publish flow.

7. Implement add-module modal
   - Open from manage modal with level preselected by action.
   - Populate before/after options from relevant module list.
   - Include `文档开头` / `文档末尾` boundary values.
   - Enforce adjacency before insertion.
   - Insert `## <title>` for level-1 or `### <title>` for level-2.
   - Switch to edit and select the new module.

8. Cache bust and cleanup
   - Update `admin/index.html` JS/CSS query versions.
   - Remove dead old source-preview toggle code paths after replacement.

## Validation Commands

```powershell
node --check js\admin.js
node --check js\app.js
git diff --check
```

## Manual Validation

- Fresh admin load defaults to `预览` + `full`.
- Existing stored `ppdir-admin-view-mode=all` opens as `full`.
- Preview `full / part` still renders correctly.
- Edit mode shows only source textarea and module dropdown.
- Selecting `main`, OBS, Vegas, Upscaling, Interpolation loads the expected Markdown ranges.
- Pasting text/images in edit updates only the selected module.
- Add level-1 rejects non-adjacent before/after choices and inserts at valid boundaries.
- Add level-2 rejects non-adjacent before/after choices and inserts under the boundary h2.
- Manage modal can trigger maintenance and publish.

## Risky Files

- `js/admin.js`: state/range sync and publish/maintenance event wiring.
- `admin/index.html`: topbar and modal structure.
- `css/admin.css`: topbar/modal responsive layout.

## Rollback Points

- If preview behavior regresses, revert the state/topbar refactor before continuing with edit modules.
- If edit range sync corrupts content, keep module parsing but disable edit save/paste until range mapping is fixed.
- If manage modal breaks publish, temporarily expose publish as a direct button again while preserving add-module planning.
