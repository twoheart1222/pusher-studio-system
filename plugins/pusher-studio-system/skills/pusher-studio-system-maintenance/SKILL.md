---
name: pusher-studio-system-maintenance
description: Use when working on the Pusher Studio internal management system repo, especially changes to quotes, projects, costs, inventory, QR scanning/labels, contacts, Firebase auth/roles, UI polish, validation, or GitHub push workflow.
---

# Pusher Studio System Maintenance

This repo is a static internal management system for Pusher Studio. It is mostly standalone HTML/CSS/JS files with Firebase Authentication and Firestore, plus browser-local cache fallbacks.

## System Map

- `index.html`: quote generator, printable paper layout, customer/vendor database helpers.
- `project.html`: project timeline, tasks, linked cost/project records.
- `cost.html`: project income/cost tracking and independent budget calculator.
- `inventory.html`: equipment inventory, loans/returns, QR labels, NIIMBOT 14x30 PNG export, mobile scan-first workflow.
- `contacts.html`: customer/vendor records and links to projects/quotes.
- `admin-roles.html`: user and permission management.
- `login.html`: Firebase email/password login and reset password flow.
- `roles.js`: shared permission guard mapping pages and `data-role-section` controls.
- `ui-redesign.css`: global visual override layer used across pages.

## Working Rules

- Treat this as a production internal tool. Prefer small, targeted changes over broad rewrites.
- Use existing plain HTML/CSS/JS patterns. Do not add a bundler or framework unless the user explicitly asks.
- Use `apply_patch` for manual edits.
- Keep `ui-redesign.css` as the preferred place for global visual polish.
- Preserve Traditional Chinese UI copy unless there is a clear reason to change it.
- Keep desktop workflows complete, but optimize `inventory.html` mobile for field scanning, borrowing, and returning rather than management dashboards.

## QR And Inventory Constraints

- Do not change printed QR payloads unless the user explicitly asks. Existing QR labels should continue to encode the equipment ID only.
- When touching QR label generation, preserve NIIMBOT N1 14mm x 30mm label layout and downloadable PNG/ZIP behavior.
- For scanner work, test that small QR codes remain readable and keep manual search fallback by name/model/last digits.
- Camera permission issues often depend on HTTPS, Safari permissions, and iOS behavior. Avoid automatically prompting for camera on page load.

## Firebase And Data Constraints

- Auth and permissions use Firebase Authentication plus Firestore `users/{uid}`.
- Operational collections include `cost_projects`, `cost_items`, `proj_tasks`, `inv_items`, `inv_loans`, `inv_repairs`, and `databases/clientDB` / `databases/vendorDB`.
- LocalStorage is used as cache/fallback. Avoid breaking existing keys unless a migration is included.
- Permission visibility is controlled by `roles.js` and `data-role-section`; preserve those attributes when moving buttons.

## Validation Checklist

Before finishing code changes:

- Run `git status --short --branch`.
- Run `git diff --check`.
- Syntax-check non-module, non-importmap inline scripts in touched HTML files with Node `new Function(...)`.
- For UI changes, start or reuse `python -m http.server 8087 --bind 127.0.0.1` and verify relevant pages in the in-app browser when login state allows.
- If browser verification is blocked by login, say so clearly and report the checks that did run.
- For QR changes, confirm the QR text remains equipment ID only unless the user requested otherwise.

## GitHub Workflow

- The user often asks to `commit / push` after changes.
- Default remote is `https://github.com/twoheart1222/pusher-studio-system.git` on `main`.
- Before pushing, run `git fetch origin main` and confirm `git rev-list --left-right --count HEAD...origin/main` is `0 0`.
- Use concise commit messages that describe the user-visible change.
