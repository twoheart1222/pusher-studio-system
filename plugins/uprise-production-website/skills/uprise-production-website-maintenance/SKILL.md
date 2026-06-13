---
name: uprise-production-website-maintenance
description: Use when working on the Uprise Production company website repo, especially static HTML/CSS/JS page changes, Firebase/Firestore CMS loading, cache-busting, GitHub deployment, local-vs-live verification, responsive QA, and visual polish.
---

# Uprise Production Website Maintenance

This repo is the public company website for Uprise Production. It is a mostly static site made from standalone HTML/CSS/JS files, with Firebase/Firestore used as CMS data where available and Markdown files used as fallback content.

## Repo Map

- `index.html`: homepage with hero video, services, behind-the-scenes content, and shared logo/global data loading.
- `about.html`: about page; enhanced by `js/interactive-pages.js` for the editorial layout.
- `contact.html`: contact page and Formspree form; enhanced by `js/interactive-pages.js`.
- `success.html`: contact form success page.
- `works.html`, `team.html`, `member.html`: portfolio/team/member pages with Firebase-aware data loading.
- `css/site-fixes.css`: broad visual override and cross-page polish layer.
- `css/interactive-pages.css`: editorial/interactive page layouts and motion helpers.
- `js/site-fixes.js`: shared behavior fixes and transitions.
- `js/interactive-pages.js`: homepage/about/contact/success enhancement layer.
- `admin/index.html`: Firebase CMS/admin interface.
- `admin/firebase-frontend-loader.js`: Firestore-first content loader that falls back to Markdown.
- `content/*.md`: Markdown fallback content for pages.
- `firebase.json`, `firestore.rules`, `storage.rules`: Firebase hosting/rules configuration.

## Working Rules

- Treat this as a production public website. Prefer small, targeted changes that preserve current visual direction.
- Use existing plain HTML/CSS/JS patterns. Do not introduce React, bundlers, package managers, or a framework unless explicitly requested.
- Preserve Traditional Chinese copy unless the user asks for wording changes.
- Keep page-specific inline styles working, but prefer shared polish in `css/site-fixes.css` or `css/interactive-pages.css` when behavior spans pages.
- Keep Firebase and Markdown fallback behavior intact. If Firestore fails, pages should still render useful content from `content/*.md`.
- For any changed CSS/JS used by live pages, update query-string cache busters on all pages that reference it, for example `?v=sync-YYYYMMDDx`.
- Support both extension and extensionless routes. Live hosting may serve `/about` while local preview serves `/about.html`.
- Be careful with first-paint behavior. Avoid visible title/layout jumps by waiting for fonts, loader state, and layout stability before revealing rebuilt interactive content.

## Firebase And CMS Notes

- Firestore project: `uprise-videoproduction-admin`.
- Public page documents live under `pages/{pageName}` such as `home`, `about`, `contact`, `works`, `team`, `member`.
- Public reads are expected for page content. Writes should remain restricted to the authorized admin account in rules.
- `admin/firebase-frontend-loader.js` should expose `window.loadFirebasePage` and `window.subscribeFirebasePage` when modules load correctly.
- Several pages include REST fallback reads to Firestore. Preserve this when changing data loading.
- `contact.html` uses Formspree. Keep the form action configurable from CMS data when possible.

## Local And Live Verification

Before finishing site changes:

- Run `git status -sb`.
- Run `node --check js/interactive-pages.js` when touched.
- Run `node --check js/site-fixes.js` when touched.
- Validate JSON configs such as `firebase.json`.
- Start or reuse `python -m http.server 8765 --bind 127.0.0.1` from the website repo for local static preview.
- Use the Browser plugin for UI changes when possible. Check desktop and mobile-sized behavior for layout changes.
- Verify live pages with cache-busting URLs after push, e.g. `https://www.uprise-videoproduction.com/about?fresh=<commit>`.
- When debugging deploy mismatch, compare:
  - GitHub raw file contents
  - live HTML references and query-string versions
  - live JS/CSS syntax and body classes
  - extensionless live routes such as `/about`, `/contact`, `/success`

## GitHub Workflow

- Main repo remote: `https://github.com/twoheart1222/Uprise-production.git`.
- Main branch: `main`.
- The user often expects commit and push when the website is fixed.
- Before pushing, run `git status -sb`; if remote may have changed, run `git fetch origin main`.
- Do not force push unless explicitly requested.
- Use concise commit messages describing the visible fix.
- After pushing, confirm GitHub raw content and live site content when the user is asking about deployment differences.

## Common Failure Patterns

- New files are created but not added to Git. Always check untracked files before push.
- Live site strips `.html` routes, so page detection must work for both `about.html` and `about`.
- Browser/CDN caches old CSS/JS unless query-string versions are bumped.
- Firebase module may fail silently; pages should still work via REST/Markdown fallback.
- Rebuilding `main.innerHTML` after first paint can cause visible jumps. Hide pending interactive pages until content, fonts, loader, and title layout have stabilized.

## Recommended Plugin Set For This Repo

- Browser: required for local/live page verification and screenshot/DOM inspection.
- GitHub: useful for commit/push, deployment mismatch checks, and PR/CI workflows.
- Build Web Apps: useful for frontend polish and interaction work.
- Codex Security: useful before changing Firebase rules/admin/auth surfaces.
- Responsive: only useful if connected to external proposal/content-library workflows; not needed for ordinary website maintenance.
- Supabase: not needed for this Firebase-based website unless a future migration is planned.
