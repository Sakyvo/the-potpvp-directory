# Quality Guidelines

> Code quality standards for frontend development.

---

## Overview

Frontend changes must stay scoped, preserve existing flows, and validate browser-specific behavior when external hosts depend on request headers or referrer policy.

---

## Forbidden Patterns

### Don't: Fetch Shimo image URLs with the default referrer

**Problem**

Shimo pasted image URLs can return an anti-leech placeholder when the page referrer is sent.

**Why it's bad**

The upload flow stores the placeholder instead of the actual image.

**Instead**

```js
await fetch(url, { mode: 'cors', referrerPolicy: 'no-referrer' });
```

Set the same policy on any `Image` fallback used for the same URL.

### Don't: Expand the workaround to all remote images

**Problem**

Blanket header changes can alter unrelated image imports.

**Why it's bad**

Non-Shimo hosts should keep existing behavior.

### Don't: Change global typography for one markdown spacing issue

**Problem**

List, heading, table, and paragraph styling all share the markdown rendering surface.

**Why it's bad**

Global line-height, font-size, or paragraph changes can silently alter every article and the admin preview.

---

## Required Patterns

### Pattern: Host-scoped remote-image normalization

**What**

Treat `uploader.shimo.im` and `*.shimonote.com` image URLs as a special case during remote import.

**Why**

These hosts may require a no-referrer request to resolve the final authorized image response.

**Example**

```js
const dataUrl = await fetchAsDataUrl(url, { noReferrer: isShimoImageUrl(url) });
```

### Pattern: Scope markdown layout tweaks to `.floor-body`

**What**

Adjust article markdown spacing through the smallest relevant `.floor-body` selector.

**Why**

The public article view and admin preview share these rules, so scoped changes keep both views consistent without affecting chrome, TOC, or editor controls.

**Example**

```css
.floor-body ul, .floor-body ol { padding-left: 1.7em; }
.floor-body li > ul, .floor-body li > ol { padding-left: 1.15em; }
```

### Pattern: Nested list alignment

**What**

Tighten nested list indentation so child bullets sit under the parent item text start, not under the marker column.

**Why**

This keeps article markdown readable without widening all list spacing or changing line-height.

### Pattern: Wrap rendered markdown tables for mobile scrolling

**What**

After rendering markdown, wrap `.floor-body table` elements in `.table-scroll-wrap`.

**Why**

Wide tables need a local horizontal scroll container on mobile. The document body must not become horizontally scrollable.

**Example**

```js
wrap.appendChild(table);
```

### Pattern: Mirror public render enhancements in admin preview

**What**

When adding a post-render enhancement to public markdown content, add the matching enhancement to admin rendered preview in the same change.

**Why**

Admin preview is the editing verification surface for the same Markdown. If public-only helpers such as code-copy buttons, table wrappers, anchors, or link normalization are not mirrored, authors see different behavior before publishing.

**Example**

```js
enhanceScrollableTables(container);
enhanceCodeBlocks(container);
```

---

## Testing Requirements

- Run syntax check and diff check for JS changes.
- When a fix depends on browser request headers or redirects, validate the final network response path against the affected host.
- Keep validation focused on the touched flow.
- For markdown spacing changes, verify both public content and admin preview and confirm global line-height did not change.
- For nested list alignment, verify a numbered list with child bullets aligns visually with the parent item text start.
- For table scrolling changes, verify public content and admin preview both wrap tables and keep table cell styling intact.
- For post-render markdown enhancements, verify the public page and admin preview both apply the enhancement to the same `.floor-body` elements.

---

## Code Review Checklist

- Confirm the host scope is narrow.
- Confirm non-Shimo remote images still use the existing path.
- Confirm primary fetch and fallback image load use the same referrer policy.
- Confirm public markdown render enhancements are mirrored in admin preview unless the task explicitly scopes them out.
