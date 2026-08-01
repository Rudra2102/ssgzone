# D5 — UI/UX Design System | Part 01: Foundations & Tokens

## 1. Design Philosophy

| Principle | Description |
|-----------|-------------|
| Clarity First | Every element must communicate its purpose without explanation |
| Density-Aware | Information-dense layouts for power users; clean defaults for casual users |
| Tenant-Branded | SaaS tenants can override brand tokens without breaking layout |
| Accessible | WCAG 2.1 AA minimum across all components |
| Mobile-First | Responsive breakpoints, touch targets ≥ 44px |

---

## 2. Design Token System

All tokens are CSS custom properties defined at `:root` and overridable per-tenant via a `data-theme` attribute on `<body>`.

### 2.1 Color Tokens

#### Base Palette (SSGzone Default)
```css
:root {
  /* Brand */
  --color-brand-50:  #EEF2FF;
  --color-brand-100: #E0E7FF;
  --color-brand-200: #C7D2FE;
  --color-brand-300: #A5B4FC;
  --color-brand-400: #818CF8;
  --color-brand-500: #6366F1;   /* Primary */
  --color-brand-600: #4F46E5;   /* Primary Dark */
  --color-brand-700: #4338CA;
  --color-brand-800: #3730A3;
  --color-brand-900: #312E81;

  /* Neutral */
  --color-neutral-0:   #FFFFFF;
  --color-neutral-50:  #F9FAFB;
  --color-neutral-100: #F3F4F6;
  --color-neutral-200: #E5E7EB;
  --color-neutral-300: #D1D5DB;
  --color-neutral-400: #9CA3AF;
  --color-neutral-500: #6B7280;
  --color-neutral-600: #4B5563;
  --color-neutral-700: #374151;
  --color-neutral-800: #1F2937;
  --color-neutral-900: #111827;

  /* Semantic */
  --color-success-light: #D1FAE5;
  --color-success:       #10B981;
  --color-success-dark:  #065F46;

  --color-warning-light: #FEF3C7;
  --color-warning:       #F59E0B;
  --color-warning-dark:  #92400E;

  --color-error-light:   #FEE2E2;
  --color-error:         #EF4444;
  --color-error-dark:    #991B1B;

  --color-info-light:    #DBEAFE;
  --color-info:          #3B82F6;
  --color-info-dark:     #1E40AF;
}
```

#### Semantic Surface Tokens
```css
:root {
  --surface-bg:          var(--color-neutral-50);
  --surface-card:        var(--color-neutral-0);
  --surface-sidebar:     var(--color-neutral-900);
  --surface-sidebar-hover: var(--color-neutral-800);
  --surface-overlay:     rgba(0,0,0,0.5);
  --surface-input:       var(--color-neutral-0);
  --surface-input-focus: var(--color-brand-50);

  --text-primary:        var(--color-neutral-900);
  --text-secondary:      var(--color-neutral-500);
  --text-disabled:       var(--color-neutral-300);
  --text-inverse:        var(--color-neutral-0);
  --text-brand:          var(--color-brand-600);
  --text-link:           var(--color-brand-500);
  --text-link-hover:     var(--color-brand-700);

  --border-default:      var(--color-neutral-200);
  --border-focus:        var(--color-brand-500);
  --border-error:        var(--color-error);
}
```

#### Dark Mode Overrides
```css
[data-theme="dark"] {
  --surface-bg:          var(--color-neutral-900);
  --surface-card:        var(--color-neutral-800);
  --surface-sidebar:     #0F172A;
  --surface-sidebar-hover: var(--color-neutral-800);
  --surface-input:       var(--color-neutral-800);
  --surface-input-focus: var(--color-neutral-700);

  --text-primary:        var(--color-neutral-50);
  --text-secondary:      var(--color-neutral-400);
  --text-disabled:       var(--color-neutral-600);

  --border-default:      var(--color-neutral-700);
}
```

#### Tenant Brand Override Pattern
```css
/* Injected per-tenant via API response */
[data-tenant="nabc"] {
  --color-brand-500: #0EA5E9;
  --color-brand-600: #0284C7;
  --color-brand-50:  #F0F9FF;
}
```

---

### 2.2 Typography Tokens

```css
:root {
  /* Font Families */
  --font-sans:  'Inter', system-ui, -apple-system, sans-serif;
  --font-mono:  'JetBrains Mono', 'Fira Code', monospace;

  /* Scale (Major Third — 1.25) */
  --text-xs:   0.64rem;   /* 10.24px */
  --text-sm:   0.8rem;    /* 12.8px  */
  --text-base: 1rem;      /* 16px    */
  --text-lg:   1.25rem;   /* 20px    */
  --text-xl:   1.563rem;  /* 25px    */
  --text-2xl:  1.953rem;  /* 31.25px */
  --text-3xl:  2.441rem;  /* 39px    */

  /* Weight */
  --font-regular:   400;
  --font-medium:    500;
  --font-semibold:  600;
  --font-bold:      700;

  /* Line Height */
  --leading-tight:  1.25;
  --leading-normal: 1.5;
  --leading-loose:  1.75;

  /* Letter Spacing */
  --tracking-tight:  -0.025em;
  --tracking-normal:  0em;
  --tracking-wide:    0.025em;
  --tracking-widest:  0.1em;
}
```

#### Typography Usage Rules
| Token | Usage |
|-------|-------|
| `--text-3xl + --font-bold` | Page titles (H1) |
| `--text-2xl + --font-semibold` | Section headers (H2) |
| `--text-xl + --font-semibold` | Card headers (H3) |
| `--text-lg + --font-medium` | Subheadings (H4) |
| `--text-base + --font-regular` | Body text |
| `--text-sm + --font-regular` | Labels, captions |
| `--text-xs + --font-medium` | Badges, tags, timestamps |
| `--font-mono` | Code, email addresses, IDs |

---

### 2.3 Spacing Tokens

```css
:root {
  /* 4px base grid */
  --space-0:   0;
  --space-1:   0.25rem;  /* 4px  */
  --space-2:   0.5rem;   /* 8px  */
  --space-3:   0.75rem;  /* 12px */
  --space-4:   1rem;     /* 16px */
  --space-5:   1.25rem;  /* 20px */
  --space-6:   1.5rem;   /* 24px */
  --space-8:   2rem;     /* 32px */
  --space-10:  2.5rem;   /* 40px */
  --space-12:  3rem;     /* 48px */
  --space-16:  4rem;     /* 64px */
  --space-20:  5rem;     /* 80px */
  --space-24:  6rem;     /* 96px */
}
```

---

### 2.4 Border & Radius Tokens

```css
:root {
  --radius-sm:   0.25rem;  /* 4px  — inputs, tags */
  --radius-md:   0.5rem;   /* 8px  — cards, dropdowns */
  --radius-lg:   0.75rem;  /* 12px — modals, panels */
  --radius-xl:   1rem;     /* 16px — large cards */
  --radius-full: 9999px;   /* pills, avatars */

  --border-width-thin:   1px;
  --border-width-medium: 2px;
  --border-width-thick:  4px;
}
```

---

### 2.5 Shadow Tokens

```css
:root {
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);
  --shadow-xl: 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04);
  --shadow-focus: 0 0 0 3px rgba(99,102,241,0.4);  /* brand-500 at 40% */
}
```

---

### 2.6 Motion Tokens

```css
:root {
  --duration-instant: 0ms;
  --duration-fast:    100ms;
  --duration-normal:  200ms;
  --duration-slow:    300ms;
  --duration-slower:  500ms;

  --ease-default:  cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in:       cubic-bezier(0.4, 0, 1, 1);
  --ease-out:      cubic-bezier(0, 0, 0.2, 1);
  --ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

Motion rules:
- Hover/focus transitions: `--duration-fast`
- Panel open/close: `--duration-normal`
- Modal enter: `--duration-slow` with `--ease-out`
- Toast/notification: `--duration-slow` with `--ease-spring`
- Respect `prefers-reduced-motion`: set all durations to `0ms`

---

### 2.7 Z-Index Scale

```css
:root {
  --z-base:      0;
  --z-raised:    10;
  --z-dropdown:  100;
  --z-sticky:    200;
  --z-overlay:   300;
  --z-modal:     400;
  --z-toast:     500;
  --z-tooltip:   600;
}
```

---

## 3. Breakpoint System

| Name | Min Width | Target |
|------|-----------|--------|
| `xs` | 0px | Mobile portrait |
| `sm` | 480px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Wide desktop |
| `2xl` | 1536px | Ultra-wide |

```css
/* Usage pattern */
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
```

---

## 4. Grid System

### 4.1 App Shell Layout
```
┌─────────────────────────────────────────────────┐
│  TopBar (height: 56px, sticky)                  │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │  Main Content Area                   │
│ (240px)  │  (flex-grow: 1, overflow-y: auto)    │
│          │                                      │
│          │  ┌──────────────────────────────┐    │
│          │  │  Page Header (breadcrumb)    │    │
│          │  ├──────────────────────────────┤    │
│          │  │  Content (padding: 24px)     │    │
│          │  └──────────────────────────────┘    │
└──────────┴──────────────────────────────────────┘
```

- Sidebar collapses to icon-only (64px) at `lg` breakpoint toggle
- Sidebar becomes bottom nav drawer on `md` and below
- TopBar always visible; contains: logo, global search, notifications, user avatar

### 4.2 Content Grid
```css
.content-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-6);
  padding: var(--space-6);
}
```

Column span conventions:
| Width | Columns | Use Case |
|-------|---------|----------|
| Full | 12 | Tables, mail list |
| 3/4 | 9 | Main content with aside |
| 2/3 | 8 | Forms, detail views |
| 1/2 | 6 | Side-by-side cards |
| 1/3 | 4 | Stat cards (3-up) |
| 1/4 | 3 | Sidebar widgets |

---

## 5. Iconography

- **Library**: Lucide React (MIT license, tree-shakeable)
- **Size scale**: 14px (xs), 16px (sm), 20px (base), 24px (lg), 32px (xl)
- **Stroke width**: 1.5px default, 2px for emphasis
- **Color**: inherits `currentColor` — never hardcode icon colors
- **Accessibility**: all icons paired with `aria-label` or adjacent visible text

### Module Icon Map
| Module | Icon |
|--------|------|
| Mail | `Mail` |
| Calendar | `Calendar` |
| Contacts | `Users` |
| Chat | `MessageSquare` |
| Video | `Video` |
| Drive | `FolderOpen` |
| Notifications | `Bell` |
| Search | `Search` |
| Settings | `Settings` |
| Admin | `Shield` |
| Billing | `CreditCard` |
| Analytics | `BarChart2` |
| Audit | `FileText` |
| Directory | `BookOpen` |

---

## 6. Accessibility Standards

| Requirement | Standard |
|-------------|----------|
| Color contrast (text) | ≥ 4.5:1 (AA) |
| Color contrast (large text) | ≥ 3:1 |
| Color contrast (UI components) | ≥ 3:1 |
| Focus indicator | 3px outline, `--shadow-focus` |
| Keyboard navigation | Full tab order, no keyboard traps |
| Screen reader | Semantic HTML + ARIA where needed |
| Touch targets | ≥ 44×44px |
| Motion | Respect `prefers-reduced-motion` |
| Forms | All inputs have associated `<label>` |
| Images | All `<img>` have `alt` attribute |

---

*Part 01 of 03 — Next: Component Library*
