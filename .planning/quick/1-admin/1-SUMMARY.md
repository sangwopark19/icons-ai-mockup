---
phase: quick-1-admin
plan: 01
subsystem: admin-dashboard
tags: [css, dark-mode, admin, bug-fix]
dependency_graph:
  requires: []
  provides: [readable-admin-dashboard-cards]
  affects: [admin/dashboard, kpi-card, kpi-skeleton, failure-chart]
tech_stack:
  added: []
  patterns: [CSS custom properties, defined design tokens]
key_files:
  created: []
  modified:
    - apps/web/src/components/admin/kpi-card.tsx
    - apps/web/src/components/admin/kpi-skeleton.tsx
    - apps/web/src/components/admin/failure-chart.tsx
    - apps/web/src/app/admin/dashboard/page.tsx
decisions:
  - Used --bg-secondary (not --bg-card) and --border-default (not --border-primary) — only defined tokens in globals.css
metrics:
  duration: 5 min
  completed: 2026-03-12
---

# Quick 1 Plan 01: Admin Dashboard CSS Variable Fix Summary

**One-liner:** Swapped 5 undefined `--bg-card`/`--border-primary` references to defined `--bg-secondary`/`--border-default` tokens, fixing white-on-white text in dark mode.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace undefined CSS variables in all admin dashboard components | 1f71ff1 | kpi-card.tsx, kpi-skeleton.tsx, failure-chart.tsx, dashboard/page.tsx |

## Changes Made

### Task 1: CSS Variable Swap (5 occurrences)

**Problem:** Admin dashboard used `--bg-card` and `--border-primary` variables that are not defined in `globals.css`. The `--bg-card` fallback resolves to `#fff` (white). In dark mode, `--text-primary` is near-white (`#fafafa`), making card text invisible (white-on-white).

**Fix:** Replaced with existing defined tokens:
- `var(--bg-card,#fff)` → `var(--bg-secondary)` (dark: #141416, light: #f9fafb)
- `var(--border-primary)` → `var(--border-default)` (dark: #27272a, light: #e5e7eb)
- `var(--border-primary, #e5e7eb)` → `var(--border-default, #e5e7eb)` (CartesianGrid stroke)

**Locations fixed:**
1. `kpi-card.tsx:49` — card container div
2. `kpi-skeleton.tsx:5` — skeleton container div
3. `failure-chart.tsx:37` — CustomTooltip container div
4. `failure-chart.tsx:60` — CartesianGrid stroke prop
5. `dashboard/page.tsx:115` — chart section container div

## Verification

- `grep -r "bg-card\|border-primary"` in admin files returns no results (exit 1)
- All 5 locations confirmed using `--bg-secondary` / `--border-default`
- TypeScript compiles clean (no output = no errors)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- File `apps/web/src/components/admin/kpi-card.tsx`: FOUND
- File `apps/web/src/components/admin/kpi-skeleton.tsx`: FOUND
- File `apps/web/src/components/admin/failure-chart.tsx`: FOUND
- File `apps/web/src/app/admin/dashboard/page.tsx`: FOUND
- Commit `1f71ff1`: FOUND
