

## Plan: Fix Build Error + Quota Billing Migration

### 1. Fix Build Error (immediate)
**`src/pages/build/BuildMode.tsx`** line 228 — Change `type="out_of_credits"` to `type="no_credits"` (valid values are `"no_credits" | "trial_expired" | "suspended"`).

### 2. Quota Billing Migration (from uploaded guide)

The uploaded document describes migrating the entire billing UX from **tokens** to **cotas (quotas)**. Key changes:

#### Consumption model
| Action | Cost |
|--------|------|
| Prompt | 1 cota |
| SaaS Spec | 2 cotas |
| Misto | 3 cotas |
| BUILD | 5 cotas |

#### Plans
| Plan | Quotas |
|------|--------|
| Free | 5/month |
| Pro | 120/month |
| Enterprise | Unlimited |

#### Files to change

1. **`src/pages/Dashboard.tsx`** — Replace token consumption display with quota-based UI: used/remaining/total quotas, progress bar, monetary value (R$0.87/cota), consumption breakdown by action type, and "economy" feedback section.

2. **`src/pages/landing/LandingPage.tsx`** — Add BUILD Engine pricing info (5 cotas ≈ R$4.35) and economy comparison (manual R$25-60 vs system R$4.35) to the pricing/features section.

3. **`src/components/misto/CreditModal.tsx`** — Update copy to reference "cotas" instead of generic "credits". Add economy feedback after actions.

4. **`src/pages/build/BuildMode.tsx`** — Add plan-gating: Free users blocked from BUILD, Pro limited to 3/month.

5. **`src/components/layout/AppShell.tsx`** — Ensure header no longer references tokens (already done — just verify).

6. **All mode pages** (`PromptMode`, `SaasMode`, `MistoMode`, `BuildMode`) — After successful generation, show economy feedback toast: "Você economizou ~R$ XX".

7. **New component: `src/components/dashboard/QuotaCard.tsx`** — Reusable quota display with progress bar, monetary values, and action breakdown.

8. **New page or modal: Upgrade flow** — Modal or `/planos` page showing plan comparison with quotas, BUILD availability, and potential economy.

