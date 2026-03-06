

## Plan: Move Referral Bonus Card from Profile to Indicações page

### Changes

#### 1. `src/pages/ProfilePage.tsx` — Remove ReferralBonusCard block
- Remove lines 475-478 (the `{/* Referral */}` section with `ReferralBonusCard`)
- Remove the unused import of `ReferralBonusCard`

#### 2. `src/pages/ReferralPage.tsx` — Add "Bônus de Indicações" card
- Add a new card **above** the "Seu link de convite" card (before line 233) containing:
  - Icon + title "Bônus de Indicações"
  - Description text
  - "Bônus disponível: X" (using `bonusTotal`)
  - "Compartilhar convite" button (copies referral link or platform link)
- Import `Share2` icon (already imported)

#### 3. `src/components/referral/ReferralBonusCard.tsx` — No changes
- Keep the component as-is since it's still used in Dashboard

| File | Action |
|------|--------|
| `src/pages/ProfilePage.tsx` | Remove ReferralBonusCard block + import |
| `src/pages/ReferralPage.tsx` | Add bonus card above "Seu link de convite" |

