

## Plan: Fix BuildMode Layout to Match MistoMode Pattern

### Root Cause
`BuildMode.tsx` uses CSS classes that **don't exist** in `misto.css`: `misto-root`, `misto-topbar`, `misto-topbar-left`, `misto-topbar-right`, `misto-topbar-title`, `misto-theme-btn`, `misto-main`. This causes the page to render without any layout styling, breaking the stepper and content.

The build error (`ENOENT`) is also caused by this file — Vite intermittently fails to resolve it with the `@/` alias.

### Fix: Rewrite BuildMode layout to use the same structure as MistoMode

**File: `src/pages/build/BuildMode.tsx`** — Replace the return JSX (lines 188-230) to use the same layout classes that MistoMode uses:

```tsx
return (
  <div className="noise-overlay relative min-h-screen bg-background flex">
    <div className="flex-1 min-w-0">
      <div className="misto-header">
        <button className="misto-back-btn" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="misto-mode-badge">
          <span className="misto-badge-pulse" /> ⚙️ Build Engine
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="misto-theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <BuildStepper currentStep={step} />

      <div className="misto-content">
        {/* step content unchanged */}
      </div>
    </div>
    <UnifiedMemorySidebar ... />
  </div>
);
```

**File: `src/App.tsx`** (line 23) — Change import to relative path with extension to permanently fix the ENOENT:
```tsx
import BuildMode from "./pages/build/BuildMode";
```

### Summary
- 2 files changed: `BuildMode.tsx` (layout classes), `App.tsx` (import path)
- No new CSS needed — reuses existing `misto-header`, `misto-content`, `misto-mode-badge` classes

