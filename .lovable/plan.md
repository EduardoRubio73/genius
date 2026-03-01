

## Plan: Fix BuildMode Page

### Root Cause
The build errors reference modules that don't exist in the saved file (`@/components/theme-provider`, `@/hooks/use-auth`, `@/lib/api`, etc.) — this indicates Vite is reading a stale/corrupted cached version of `BuildMode.tsx`. The file content I verified looks correct, but the bundler isn't picking it up.

Additionally, `UnifiedMemorySidebar` is called with wrong props (`open`, `onClose`, `onSelect`) — the component actually expects `refreshKey`, `orgId`, `onUseAsBase`, `defaultMode`.

### Fix

**`src/pages/build/BuildMode.tsx`** — Re-write the file to force Vite cache invalidation, with these corrections:

1. Remove the incorrect `UnifiedMemorySidebar` props (`open`, `onClose`, `onSelect`) and replace with the correct interface: `orgId={orgId}` and `defaultMode="build"`
2. Remove the `sidebarOpen` / `setSidebarOpen` state since the sidebar manages its own collapsed state internally
3. Keep everything else identical (wizard steps, generate logic, session creation, credit consumption)

This single file re-save should resolve all 19 build errors since the actual source code is correct — it's the Vite cache that's stale.

