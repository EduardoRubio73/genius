

## Show usage summary when "Resumo da Conta" is collapsed

When the collapsible is closed, the header area is empty -- just the title and chevron. We'll add a compact inline summary right in the trigger row that only appears when collapsed.

### Design

The trigger row will show, when `!resumoOpen`:
- A small usage bar (thin progress bar)
- Text: `{creditsUsed}/{creditsLimit} cotas` + renewal date

This gives instant visibility without opening the card.

### Implementation

**File: `src/pages/Dashboard.tsx`**

Inside the `CollapsibleTrigger` (line 335-340), add a conditional block that renders when `!resumoOpen && !isQuotaLoading`:

```tsx
<CollapsibleTrigger className="flex items-center justify-between w-full cursor-pointer">
  <p className="text-sm font-semibold text-blue-700 ...">
    Resumo da Conta
  </p>
  
  {/* NEW: Inline summary when collapsed */}
  {!resumoOpen && !isQuotaLoading && (
    <div className="flex items-center gap-3 mr-2">
      {/* Mini progress bar */}
      <div className="h-1.5 w-20 rounded-full bg-blue-200/50 overflow-hidden">
        <div className={cn("h-full rounded-full", percentUsed >= 80 ? "bg-destructive" : "bg-blue-500")}
             style={{ width: `${Math.min(100, percentUsed)}%` }} />
      </div>
      <span className="text-[11px] text-blue-600 dark:text-blue-400 tabular-nums font-medium whitespace-nowrap">
        {creditsUsed}/{creditsLimit} · Renova {renewalDate}
      </span>
    </div>
  )}
  
  <ChevronDown ... />
</CollapsibleTrigger>
```

Need to compute `percentUsed` from quota (already available as `quota?.percent_used ?? 0`).

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Add inline collapsed summary with mini progress bar + quota text in the trigger row |

