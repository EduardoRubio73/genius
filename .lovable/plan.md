

## Plano: 3 Cards Colapsáveis Separados com Cores Pastel

### Situação Atual
Tudo está dentro de um único `Collapsible` wrapper. Preciso separar em 3 cards independentes.

### Alterações em `src/pages/Dashboard.tsx`

**Substituir** o bloco único `<Collapsible>` (linhas 330-444) por 3 collapsibles independentes:

**1. Estado:** Trocar `detailsOpen` por 3 states:
```tsx
const [resumoOpen, setResumoOpen] = useState(false);    // recolhido
const [modosOpen, setModosOpen] = useState(true);        // expandido
const [acessoOpen, setAcessoOpen] = useState(false);     // recolhido
```

**2. Card 1 - "Resumo da Conta"** (azul pastel, recolhido)
- Borda: `border-blue-200 dark:border-blue-800/40`
- Header bg: `bg-blue-50 dark:bg-blue-950/30`
- Conteúdo: Summary cards (Plano, Cotas, Bonus, Renovacao), Usage Progress, Estatísticas, Upgrade banner

**3. Card 2 - "Modos disponíveis"** (rosa pastel, expandido)
- Borda: `border-pink-200 dark:border-pink-800/40`
- Header bg: `bg-pink-50 dark:bg-pink-950/30`
- Conteúdo: Grid de `ModeActionCard` (que atualmente não está no JSX -- precisa ser adicionado de volta, pois parece ter sido removido quando o collapsible foi criado)

**4. Card 3 - "Acesso rápido"** (amarelo pastel, recolhido)
- Borda: `border-yellow-200 dark:border-yellow-800/40`
- Header bg: `bg-yellow-50 dark:bg-yellow-950/30`
- Conteúdo: QuickActionCards + ReferralBonusCard

### Estrutura de cada card:
```tsx
<Collapsible open={resumoOpen} onOpenChange={setResumoOpen}>
  <div className="rounded-xl border border-blue-200 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-950/20 p-5 shadow-md mb-4">
    <CollapsibleTrigger className="flex items-center justify-between w-full cursor-pointer">
      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
        Resumo da Conta
      </p>
      <ChevronDown className={cn("h-4 w-4 text-blue-500 transition-transform", resumoOpen && "rotate-180")} />
    </CollapsibleTrigger>
    <CollapsibleContent className="mt-4 space-y-6">
      {/* conteúdo existente */}
    </CollapsibleContent>
  </div>
</Collapsible>
```

### Nota sobre "Modos disponíveis"
O grid de modos (`MODES.map(...)` com `ModeActionCard`) parece ter sido removido do JSX na edição anterior. Será re-adicionado dentro do Card 2 rosa.

| Arquivo | Ação |
|---------|------|
| `src/pages/Dashboard.tsx` | Separar em 3 collapsibles com cores pastel distintas |

