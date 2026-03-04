

## Plano: Animações de entrada nos cards do Dashboard

### Abordagem

Usar a animação `fade-in` já existente no Tailwind config (`animate-fade-in`: translateY(10px) + opacity 0→1) com delays escalonados via `style={{ animationDelay }}` para criar efeito cascata.

### Alterações em `src/pages/Dashboard.tsx`

1. **SummaryCard** — adicionar `animate-fade-in` com `animationFillMode: "backwards"` e receber prop `delay` (index × 80ms)
2. **ModeActionCard** — mesmo padrão, delay baseado no index
3. **UsageProgressBar container** — `animate-fade-in` com delay fixo
4. **Stats row** — cada card com delay escalonado
5. **QuickActionCard** — `animate-fade-in`
6. **Upgrade banner** — `animate-fade-in`
7. **Greeting section** — `animate-fade-in` sem delay

Passar `index` como prop nos `.map()` calls para calcular `animationDelay: ${index * 80}ms`.

### Arquivo alterado

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Dashboard.tsx` | Adicionar classes de animação e delays escalonados em todos os cards |

