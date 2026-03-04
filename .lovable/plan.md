

## Plano: Bloco Transparência de custos dinâmico

### Mudança

Uma única alteração em `src/pages/landing/LandingPage.tsx`:

1. Adicionar `credit_unit_cost` ao mapeamento de `pricingProducts` (já vem da view)
2. Substituir o bloco hardcoded (linha 518-520) por valores calculados dinamicamente a partir do `credit_unit_cost` do primeiro plano carregado

### Lógica

```tsx
const creditCost = pricingProducts[0]?.credit_unit_cost ?? 0.87;
const promptCost = creditCost * 1;
const buildCost = creditCost * 5;
```

O bloco renderiza esses valores com `.toFixed(2)` e vírgula como separador decimal (pt-BR).

### Arquivo alterado

| Arquivo | Mudança |
|---------|---------|
| `src/pages/landing/LandingPage.tsx` | Adicionar `credit_unit_cost` à interface e mapeamento; tornar bloco de transparência dinâmico |

