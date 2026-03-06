

## Plano: Card colapsável para Resumo + Acesso Rápido

### Objetivo
Envolver as seções "Resumo da Conta", "Uso do Período", "Estatísticas" e "Acesso Rápido + Referral" dentro de um único `Collapsible` (Radix), **recolhido por padrão**. A seção "Modos disponíveis" permanece fora, sem collapsible.

### Alterações

**Arquivo:** `src/pages/Dashboard.tsx`

1. Importar `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` de `@/components/ui/collapsible` e `ChevronDown` de `lucide-react`
2. Adicionar state `const [detailsOpen, setDetailsOpen] = useState(false)`
3. Envolver as seções (Resumo da Conta, Uso do Período, Estatísticas, banner upgrade, Acesso Rápido + Referral) em:

```tsx
<Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
  <div className="rounded-xl border bg-card p-5 shadow-md mb-6">
    <CollapsibleTrigger className="flex items-center justify-between w-full">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        Resumo da Conta & Acesso Rápido
      </p>
      <ChevronDown className={cn("h-4 w-4 transition-transform", detailsOpen && "rotate-180")} />
    </CollapsibleTrigger>
    <CollapsibleContent className="mt-4 space-y-6">
      {/* Resumo da Conta cards */}
      {/* Uso do Período */}
      {/* Estatísticas */}
      {/* Upgrade banner (condicional) */}
      {/* Acesso Rápido + Referral */}
    </CollapsibleContent>
  </div>
</Collapsible>
```

4. Mover o conteúdo interno de cada seção para dentro do `CollapsibleContent`, removendo os wrappers `<section className="mb-6">` individuais (já que o espaçamento será feito pelo `space-y-6` do content)
5. Manter a seção "Modos disponíveis" exatamente como está, fora do collapsible

| Arquivo | Ação |
|---------|------|
| `src/pages/Dashboard.tsx` | Adicionar Collapsible wrapper, reorganizar seções, manter Modos fora |

