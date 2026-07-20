# Fix Shimo image upload

## Goal

Normalize Shimo pasted image URLs so uploaded images fetch the authorized redirected image instead of the anti-leech placeholder.

## Requirements

- When a pasted image URL from Shimo matches `https://uploader.shimo.im/f/<id>.png!thumbnail`, the upload flow must resolve the browser redirect and fetch the final authorized `oimages*.shimonote.com` image URL instead of saving the anti-leech placeholder.
- Preserve existing upload behavior for non-Shimo remote images and local image uploads.
- Keep the fix narrowly scoped to URL normalization/fetching.

## Acceptance Criteria

- [ ] A Shimo uploader URL with a `!thumbnail` suffix uploads the actual image content.
- [ ] Existing remote image upload behavior still works for normal image URLs.
- [ ] Validation/build checks pass.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
