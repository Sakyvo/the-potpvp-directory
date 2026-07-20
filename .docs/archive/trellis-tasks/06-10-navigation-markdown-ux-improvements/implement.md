# Navigation and Markdown UX Improvements Implementation Plan

## Execution Order

1. `06-10-stackedit-markdown-spacing`
   - Update list/heading CSS in `css/main.css`.
   - Normalize only the OBS old-version preset block in `content/main.md`.
   - Verify public/admin rendering of the block.

2. `06-10-mobile-table-scroll`
   - Add a table enhancement wrapper in public render flow.
   - Add the same enhancement to admin rendered preview.
   - Add shared scroll-container CSS.

3. `06-10-search-offset-query-memory`
   - Add session-only query memory.
   - Adjust search match scroll offset when search panel is open.
   - Verify full mode and part mode.

4. `06-10-toc-depth-track`
   - Replace sidebar collapse controls in public/admin HTML.
   - Replace boolean collapse state with depth and Track state in public/admin JS.
   - Add CSS visibility rules and active-branch override.
   - Verify hash/caret/scroll-driven active item positioning.

## Validation Commands

```powershell
node --check js\app.js
node --check js\admin.js
git diff --check
```

Manual browser checks:

- Public full mode and part mode.
- Admin rendered preview and source mode.
- Mobile viewport for wide tables and sidebar behavior.
- OBS preset block hierarchy and list alignment.

## Review Gates

- Do not start Phase 2 until the user approves this plan.
- Do not archive any task until human approval is recorded.
- Commit implementation changes after validation and push to `pages`.
