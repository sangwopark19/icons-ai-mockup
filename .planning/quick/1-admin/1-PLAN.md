---
phase: quick-1-admin
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/web/src/components/admin/kpi-card.tsx
  - apps/web/src/components/admin/kpi-skeleton.tsx
  - apps/web/src/components/admin/failure-chart.tsx
  - apps/web/src/app/admin/dashboard/page.tsx
autonomous: true
requirements: [ADMIN-COLOR-FIX]
must_haves:
  truths:
    - "Admin dashboard cards have dark background in dark mode, not white"
    - "Card text is readable against card background in both light and dark mode"
    - "Chart tooltip and grid lines use visible borders"
  artifacts:
    - path: "apps/web/src/components/admin/kpi-card.tsx"
      provides: "KPI card with correct CSS variables"
      contains: "var(--bg-secondary)"
    - path: "apps/web/src/components/admin/kpi-skeleton.tsx"
      provides: "Skeleton with correct CSS variables"
      contains: "var(--bg-secondary)"
    - path: "apps/web/src/components/admin/failure-chart.tsx"
      provides: "Chart with correct border/bg variables"
      contains: "var(--border-default)"
    - path: "apps/web/src/app/admin/dashboard/page.tsx"
      provides: "Dashboard chart container with correct variables"
      contains: "var(--bg-secondary)"
  key_links: []
---

<objective>
Fix white-on-white text in admin dashboard by replacing undefined CSS variables with existing ones.

Purpose: Admin dashboard cards use `--bg-card` and `--border-primary` CSS variables that are NOT defined in globals.css. The fallback `#fff` creates white card backgrounds, and in dark mode `--text-primary` is near-white (#fafafa), making text invisible.
Output: All 5 admin dashboard components use defined CSS variables with correct dark/light mode contrast.
</objective>

<execution_context>
@/Users/sangwopark19/.claude/get-shit-done/workflows/execute-plan.md
@/Users/sangwopark19/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@apps/web/src/components/admin/kpi-card.tsx
@apps/web/src/components/admin/kpi-skeleton.tsx
@apps/web/src/components/admin/failure-chart.tsx
@apps/web/src/app/admin/dashboard/page.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace undefined CSS variables in all admin dashboard components</name>
  <files>
    apps/web/src/components/admin/kpi-card.tsx
    apps/web/src/components/admin/kpi-skeleton.tsx
    apps/web/src/components/admin/failure-chart.tsx
    apps/web/src/app/admin/dashboard/page.tsx
  </files>
  <action>
In all 4 files, perform these exact replacements:

1. Replace `var(--bg-card,#fff)` with `var(--bg-secondary)` (dark: #141416, light: #f9fafb)
2. Replace `var(--border-primary)` with `var(--border-default)` (dark: #27272a, light: #e5e7eb)
3. In failure-chart.tsx line 60, replace the CartesianGrid stroke value `var(--border-primary, #e5e7eb)` with `var(--border-default, #e5e7eb)`

Specific locations:
- kpi-card.tsx:49 — card container div className
- kpi-skeleton.tsx:5 — skeleton container div className
- failure-chart.tsx:37 — CustomTooltip container div className
- failure-chart.tsx:60 — CartesianGrid stroke prop
- dashboard/page.tsx:115 — chart section container div className

Do NOT change any other classes or functionality. This is a CSS variable name swap only.
  </action>
  <verify>
    <automated>cd /Users/sangwopark19/icons/icons-ai-mockup && npx tsc --noEmit --project apps/web/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>
All 5 occurrences of undefined CSS variables replaced. No instance of `--bg-card` or `--border-primary` remains in admin components. TypeScript compiles clean.
  </done>
</task>

</tasks>

<verification>
1. `grep -r "bg-card\|border-primary" apps/web/src/components/admin/ apps/web/src/app/admin/dashboard/page.tsx` returns no results
2. `grep -r "bg-secondary\|border-default" apps/web/src/components/admin/ apps/web/src/app/admin/dashboard/page.tsx` shows replacements in all 5 locations
3. TypeScript compiles without errors
</verification>

<success_criteria>
- Zero occurrences of `--bg-card` or `--border-primary` in admin dashboard files
- All card backgrounds use `--bg-secondary` (dark: #141416, light: #f9fafb)
- All borders use `--border-default` (dark: #27272a, light: #e5e7eb)
- Text is readable in both light and dark mode
</success_criteria>

<output>
After completion, create `.planning/quick/1-admin/1-SUMMARY.md`
</output>
