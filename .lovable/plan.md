

# Ajustes de UX: Perfil, Assinatura, Alertas e Spinners

## Mudanças planejadas

### 1. Aumentar limite de caracteres de 600 para 1200
**Arquivo:** `src/components/prompt/PromptInput.tsx`
- Alterar `slice(0, 600)` → `slice(0, 1200)`
- Alterar validação `freeLen <= 600` → `freeLen <= 1200`
- Alterar contador `{freeLen} / 600` → `{freeLen} / 1200`

### 2. "Membro desde" no card de Perfil
**Arquivo:** `src/pages/ProfilePage.tsx` (ProfileTab)
- Exibir `profile.created_at` formatado em DD/MM/AAAA logo abaixo do badge Ativo/Inativo

### 3. Status humanizado na seção "Gerenciar Assinatura"
**Arquivo:** `src/pages/ProfilePage.tsx` (BillingTab)
- Mapear status: `none` → "Inativo", `active` → "Ativo", `trialing` → "Em teste", `past_due` → "Pendente", `canceled` → "Cancelado", `incomplete_expired` → "Expirado"
- Badge colorido por status (verde=Ativo, cinza=Inativo, amarelo=Pendente, vermelho=Cancelado/Expirado)

### 4. Data de contratação com fallback
- Se `current_period_start` for null, calcular `renewalDate - 30 dias` como fallback

### 5. Card de Renovação com alerta visual
- Quando a renovação estiver a ≤7 dias, no dia, ou vencida: card fica vermelho, clicável, abre portal Stripe
- Ícone de alerta e texto de urgência

### 6. Sistema de alertas global de renovação
**Arquivo:** `src/pages/ProfilePage.tsx`, `src/pages/Dashboard.tsx`
- Criar componente `SubscriptionAlert` reutilizável que exibe banner quando assinatura vencida/próxima
- Renderizar no Dashboard e no ProfilePage
- Toast de aviso ao carregar Dashboard quando assinatura vencida

### 7. Spinner nos botões "Gerar" de todos os modos
**Arquivos:** `src/components/prompt/PromptInput.tsx`, `src/components/misto/MistoInput.tsx`, `src/components/saas/SaasStep7.tsx`, `src/pages/build/BuildMode.tsx`
- Quando `isGenerating`/`disabled`, mostrar spinner (Loader2 animado) + texto "Gerando..."
- Feedback imediato ao clicar

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `src/components/prompt/PromptInput.tsx` | Limite 1200 chars + spinner no botão |
| `src/components/misto/MistoInput.tsx` | Spinner no botão Gerar |
| `src/components/saas/SaasStep7.tsx` | Spinner no botão Gerar |
| `src/pages/build/BuildMode.tsx` | Spinner no botão Gerar |
| `src/pages/ProfilePage.tsx` | created_at no perfil, status humanizado, fallback contratação, card renovação vermelho/clicável, alert banner |
| `src/pages/Dashboard.tsx` | Alert banner de renovação + toast |
| `src/components/SubscriptionAlert.tsx` | Novo componente reutilizável de alerta de assinatura |

