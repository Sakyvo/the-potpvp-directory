Status: open
Source: `.docs/archive/trellis-tasks/06-09-fix-shimo-image-upload`

## What to build

Import Shimo-hosted images without sending a referrer so redirected image URLs
produce the authorized image rather than an anti-leech placeholder. Other
remote and local image imports must retain their existing behavior.

## Acceptance criteria

- [x] Shimo and Shimonote URLs use the no-referrer path in both fetch and image fallback handling.
- [x] The host-specific behavior does not alter the fetch path for other remote image hosts.
- [ ] Validate a representative `uploader.shimo.im` URL through the complete upload flow.
- [ ] Run the focused JavaScript syntax and regression checks.

## Progress so far

Implementation landed in commit `2cb81f6`. The current code detects Shimo
hosts and scopes `referrerPolicy: 'no-referrer'` to those URLs.

## Blocked by

None - can start immediately.
