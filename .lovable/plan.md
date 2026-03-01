

## Plan: Fix Build Error + Sidebar Button Overflow

### Problem 1: Build Error
The `src/pages/build/BuildMode.tsx` file exists but the build system can't resolve it. This is caused by a stale build cache. The fix is to re-save the file with a trivial change to force Vite to pick it up.

### Problem 2: Sidebar Mode Tabs Cut Off
The 5 mode tabs (Todos, Prompts, Specs, Misto, Build) are crammed into a narrow `w-80` sidebar using `flex-1` on each button. With 5 items, the text and icons get clipped.

**Fix**: Change the mode tabs container from a rigid equal-width flex layout to a scrollable horizontal row with `flex-shrink-0` and `overflow-x-auto`, giving each tab a natural width instead of forcing `flex-1`. Also add `whitespace-nowrap` to prevent label wrapping.

### Problem 3: Build/Mixed Counts Missing
Lines 274-277 in `UnifiedMemorySidebar.tsx` only compute counts for `prompt` and `saas`, defaulting `mixed` and `build` to `0`. Need to add `counts.mixed` and `counts.build` lookups.

### Files to Change

1. **`src/pages/build/BuildMode.tsx`** — Re-save (touch) to clear the build cache error.

2. **`src/components/UnifiedMemorySidebar.tsx`**:
   - Line 272: Change the tab container from `flex gap-0.5` with `flex-1` children to `flex gap-1 overflow-x-auto` with `shrink-0 whitespace-nowrap` children, removing `flex-1`.
   - Lines 274-277: Add missing count branches for `mixed` and `build`:
     ```tsx
     const count = value === "all" ? counts.all
       : value === "prompt" ? counts.prompt
       : value === "saas" ? counts.saas
       : value === "mixed" ? counts.mixed
       : value === "build" ? counts.build
       : 0;
     ```
   - Line 283: Remove `flex-1` from button class, add `shrink-0` and appropriate min-width.

3. **`src/hooks/useUnifiedMemory.ts`** — Verify `counts` memo includes `mixed` and `build` fields (if missing, add them).

