
# Dashboard: Resumo da Conta com breakdown e data de renovação

## Problema
1. O header colapsado mostra apenas `Saldo: 40` sem o breakdown `(25 plano + 5 bônus + 10 extras)`
2. A data de renovação mostra "—" porque usa `current_period_end` que pode ser null; o campo `reset_at` (que tem fallback para `plan_credits_reset_at`) não está sendo usado
3. O card "Plano Atual" não exibe a data de renovação

## Mudanças em `src/pages/Dashboard.tsx`

### 1. Usar `reset_at` como fallback para data de renovação
```typescript
const renewalDate = (quota?.reset_at || quota?.current_period_end)
  ? new Date((quota?.reset_at || quota?.current_period_end)!).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  : "—";
```

### 2. Header colapsado com breakdown
Linha 243-245 — alterar o texto do span para incluir breakdown:
```
Saldo: {totalRemaining} ({creditsRemaining} plano + {bonusRemaining} bônus + {extraCredits} extras) · Renova {renewalDate}
```

### 3. Card "Plano Atual" com data de renovação
No grid de 5 cards (linha 265), atualizar o sub do card "Plano" para incluir a data:
```typescript
{ emoji: "👑", label: "Plano", value: planName, sub: `${creditsLimit} cotas/mês · Renova ${renewalDate}` }
```

### Arquivo modificado
| Arquivo | Mudança |
|---------|---------|
| `src/pages/Dashboard.tsx` | Breakdown no header colapsado, fallback `reset_at` para renovação, renovação no card Plano |
