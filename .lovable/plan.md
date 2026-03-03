

## Plan: Redesign Admin Panel to Match HTML V2 Reference

The uploaded HTML file defines a polished admin design system with specific typography (Plus Jakarta Sans + JetBrains Mono), CSS variables for dark/light themes, larger spacing, rounded-14px table cards, styled badges, a modal with meta-grid layout, and code-boxes for long text. The current React admin uses smaller fonts, tighter spacing, and a different visual language.

### Design Token Differences (HTML vs Current)

| Element | HTML Reference | Current React |
|---------|---------------|---------------|
| Font | Plus Jakarta Sans | Outfit |
| Mono font | JetBrains Mono | IBM Plex Mono |
| Background | `#0d0d12` | `#09090E` |
| Surface | `#16161e` | `#0F0F17` |
| Surface2 | `#1c1c26` | `#16161F` |
| Border | `#2a2a3a` | `white/[0.06]` |
| Accent | `#f05a28` | `#F97316` (orange-500) |
| Table card | `border-radius:14px` | `rounded-[10px]` |
| Table header bg | `var(--surface2)` | transparent |
| Row padding | `16px` | `py-3 px-5` (12/20px) |
| Page title | `24px font-weight:800` | `text-lg font-semibold` |
| Badge style | `4px 10px, radius:7px, font-weight:700` | smaller, thinner |
| Modal | `660px, radius:18px, sticky header` | `max-w-2xl` dialog |
| Pagination | bottom of table-card, inline | separate div below |
| Sidebar user | gradient avatar + name/role | dot + name/role |
| Tab style | solid accent bg on active | semi-transparent bg |

### Changes

**1. Create admin CSS file: `src/pages/admin/admin.css`**
- Define CSS custom properties matching the HTML reference (`--bg`, `--surface`, `--surface2`, `--border`, `--accent`, etc.)
- Import Plus Jakarta Sans + JetBrains Mono from Google Fonts
- Define reusable classes: `.table-card`, `.badge`, `.meta-grid`, `.meta-lbl`, `.meta-val`, `.code-box`, `.pag`, `.tabs .tab`, `.filter-input`, `.page-title`
- Include row animation keyframes

**2. Rewrite `AdminLayout.tsx`**
- Apply new design tokens: `--bg` for body, `--surface` for sidebar/topbar
- Sidebar: 230px width, gradient avatar circle (instead of dot), show user name + "superadmin" role below
- Topbar: 60px height, breadcrumb with `bc-sep` style, search pill (not button)
- Nav items: 14px font, 9px border-radius, accent-soft bg on active
- Content area: 28px 32px padding

**3. Update `AdminOverview.tsx`**
- Apply `.table-card` class (14px radius, surface bg, border)
- KPI cards: use `--surface` bg, `--border` border, larger text
- Tables: add `--surface2` header bg, larger row padding

**4. Update `AdminUsers.tsx`**
- Page title: `<h1 class="page-title">` (24px/800)
- Search: use `.filter-input` pattern (surface bg, border, icon + input)
- Table: `.table-card` wrapper, surface2 header, 16px cell padding
- Pagination: inside table-card bottom area (`.pag` pattern)
- User detail modal: use `.meta-grid` layout for info tab, `.code-box` for long text

**5. Update `AdminPrompts.tsx`**
- Tabs: solid accent bg on active tab (`.tab.active { background: var(--accent); color: white }`)
- Table: same `.table-card` treatment
- Badges: destination badges use `.badge.lovable` (purple-soft) and `.badge.chatgpt` (green-soft)
- Rating: orange circle (`.rating-num`) when present
- Detail modal: `.meta-grid` for metadata, `.code-box` for contexto/prompt_gerado sections
- Export button: `.btn-outline` style with icon

**6. Update `AdminBilling.tsx`**
- Same table-card, tabs, filter-input patterns
- Larger row padding, surface2 header

**7. Update `AdminAIConfig.tsx`**
- Same design treatment for settings list and model configs table

**8. Update `AdminFlags.tsx`**
- Same card/list styling with new border-radius and spacing

**9. Update `AdminAuditLogs.tsx`**
- Same table-card pattern, surface2 headers

**10. Update `Badges.tsx`**
- Match HTML badge style: `padding: 4px 10px`, `border-radius: 7px`, `font-size: 12px`, `font-weight: 700`
- Add destination-specific variants: `.badge.lovable` (purple), `.badge.chatgpt` (green), `.badge.neutral`

### Files to Edit

| File | Action |
|------|--------|
| `src/pages/admin/admin.css` | Create — design tokens + utility classes |
| `src/pages/admin/AdminLayout.tsx` | Rewrite — new sidebar/topbar/content styling |
| `src/pages/admin/AdminOverview.tsx` | Update — apply new design tokens |
| `src/pages/admin/AdminUsers.tsx` | Update — table-card, meta-grid modal, pagination |
| `src/pages/admin/AdminPrompts.tsx` | Update — tabs, table-card, badges, code-box modal |
| `src/pages/admin/AdminBilling.tsx` | Update — same design treatment |
| `src/pages/admin/AdminAIConfig.tsx` | Update — same design treatment |
| `src/pages/admin/AdminFlags.tsx` | Update — same design treatment |
| `src/pages/admin/AdminAuditLogs.tsx` | Update — same design treatment |
| `src/components/admin/Badges.tsx` | Update — new badge sizing/variants |

### No database changes required. This is purely a frontend UI redesign.

