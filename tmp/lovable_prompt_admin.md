# PROMPT GENIUS — Admin Master Panel
## Prompt para Lovable

---

## CONTEXTO

Adicionar ao projeto Prompt Genius existente uma rota `/admin` protegida, acessível exclusivamente por usuários com `is_superadmin = true` na tabela `public.profiles`. O painel usa as funções RPC do Supabase prefixadas com `admin_` que já foram criadas no banco.

---

## PROTEÇÃO DE ROTA

```typescript
// src/components/guards/SuperAdminGuard.tsx
const { data } = await supabase.rpc('is_superadmin')
if (!data) return <Navigate to="/dashboard" />
```

---

## STACK

- React + TypeScript, Tailwind CSS, shadcn/ui, Lucide React
- Fontes: `IBM Plex Mono` (valores/mono) + `Outfit` (corpo)
- React Router: rota `/admin/*` com layout próprio separado do AppShell do produto
- Recharts para mini gráfico de sessões

---

## ESTRUTURA DE ARQUIVOS

```
src/
├── pages/admin/
│   ├── AdminLayout.tsx
│   ├── AdminOverview.tsx
│   ├── AdminUsers.tsx
│   ├── AdminPrompts.tsx
│   ├── AdminBilling.tsx
│   ├── AdminAIConfig.tsx
│   └── AdminAuditLogs.tsx
├── hooks/admin/
│   ├── useAdminOverview.ts
│   ├── useAdminUsers.ts
│   ├── useAdminSettings.ts
│   └── useAdminAuditLogs.ts
└── components/guards/
    └── SuperAdminGuard.tsx
```

---

## DESIGN SYSTEM DO ADMIN

O admin tem identidade visual DIFERENTE do produto (que é roxo).
Tom: industrial, denso, técnico. Accent laranja para diferenciar.

```
--bg:      #09090E
--bg2:     #0F0F17
--bg3:     #16161F
--accent:  #F97316   (laranja — não usar roxo aqui)
--text:    #E8E6F0
--border:  rgba(255,255,255,0.06)
--success: #22C55E | --danger: #EF4444 | --warning: #EAB308 | --info: #3B82F6
```

---

## AdminLayout.tsx — Sidebar + Topbar

Sidebar fixa 240px:
- Logo: badge laranja `⌘` + "Admin Master" / "Prompt Genius"
- Nav: Overview | Usuários e Orgs (badge novos) | Prompts e Specs | Planos e Billing | Config. de IA | Logs e Auditoria | Feature Flags
- Footer: pill com nome + dot laranja pulsante + "superadmin"

Topbar 56px: breadcrumb mono `admin / {pagina}` + input busca global

---

## AdminOverview.tsx

### 5 KPI Cards (grid 5 colunas, stagger fadeUp)

```typescript
const { data } = await supabase.rpc('admin_get_overview')
```

| Card | Valor | Delta | Cor base |
|------|-------|-------|----------|
| Usuários Total | total_users | +new_users_7d semana | success |
| Orgs Ativas | total_orgs | +new_orgs_7d | info |
| MRR | R$ mrr_brl/100 | variação mês | accent |
| Prompts Gerados | total_prompts | "este mês" | purple |
| Tokens | 1.2M format | warning se >70% | warning |

Cada card: linha colorida 2px na base.

### Tabela Usuários Recentes

```typescript
await supabase.rpc('admin_list_users', { p_limit: 5, p_offset: 0 })
```

Colunas: Nome/Email | Plano (badge) | Prompts | Status (ativo/banido)
Botão "Ver todos →" → `/admin/users`

### Feed de Atividade

```typescript
await supabase.rpc('admin_list_audit_logs', { p_limit: 8 })
```

Dot colorido: insert=verde, update=azul, delete=vermelho, billing=laranja
Timestamp relativo em font mono.

---

## AdminAIConfig.tsx + Feature Flags

```typescript
// Buscar settings por categoria
await supabase.rpc('admin_get_settings', { p_category: 'ai' })
await supabase.rpc('admin_get_settings', { p_category: 'features' })

// Atualizar
await supabase.rpc('admin_update_setting', { p_key, p_value })
```

### Campos de IA (editáveis inline com modal de confirmação):
- `ai_model` — text input
- `ai_temperature` — number 0.0–1.0
- `ai_max_tokens` — number
- `lovable_api_key` — masked `••••••••••••`, botão revelar/editar
- `stripe_secret_key` — mesmo padrão

### Feature Flags (toggles on/off):
- `misto_mode_enabled`
- `saas_mode_enabled`
- `new_signups_enabled`
- `maintenance_mode` — quando true, exibe banner vermelho no topo do produto

---

## AdminUsers.tsx

```typescript
await supabase.rpc('admin_list_users', {
  p_limit: 20, p_offset: page * 20, p_search: searchQuery
})
```

Tabela: Nome/Email | Plano | Org | Prompts | Specs | Cadastro | Ações
Ações: banir/desbanir → `admin_toggle_org_active`
Busca com debounce 300ms. Paginação Anterior/Próximo.

---

## AdminPrompts.tsx

```typescript
await supabase.rpc('admin_list_prompts', {
  p_limit: 20, p_offset: 0, p_search: searchQuery
})
```

Tabela: User | Org | Especialidade | Tarefa (40 chars) | Destino | Rating | Tokens | Data
Ação deletar com confirmação → `admin_delete_prompt`

---

## AdminBilling.tsx

Tabs: Subscriptions / Invoices

```typescript
// Subscriptions
supabase.from('billing_subscriptions')
  .select('*, organizations(name,slug), billing_prices(unit_amount, billing_products(name,plan_tier))')
  .order('created_at', { ascending: false }).limit(50)

// Invoices
supabase.from('billing_invoices')
  .select('*, organizations(name)')
  .order('created_at', { ascending: false }).limit(50)
```

---

## AdminAuditLogs.tsx

```typescript
await supabase.rpc('admin_list_audit_logs', {
  p_limit: 100, p_offset: 0, p_action: filterAction
})
```

Tabela densa: Timestamp (mono) | User | Ação (badge) | Resource | ID
Filtro select: todos / prompt_memory / saas_specs / billing / admin_settings

---

## Mini Chart de Sessões (Recharts BarChart)

```typescript
const { data } = await supabase
  .from('sessions')
  .select('created_at')
  .gte('created_at', new Date(Date.now() - 7*24*60*60*1000).toISOString())
// Agrupar por dia no frontend → BarChart simples cor #F97316
```

---

## ROTAS

```typescript
<Route path="/admin" element={<SuperAdminGuard><AdminLayout /></SuperAdminGuard>}>
  <Route index          element={<AdminOverview />} />
  <Route path="users"   element={<AdminUsers />} />
  <Route path="prompts" element={<AdminPrompts />} />
  <Route path="billing" element={<AdminBilling />} />
  <Route path="ai-config" element={<AdminAIConfig />} />
  <Route path="logs"    element={<AdminAuditLogs />} />
</Route>
```

---

## PRIMEIRO ACESSO — executar no Supabase SQL Editor

```sql
UPDATE public.profiles
SET is_superadmin = true
WHERE email = 'seu@email.com';
```

---

## NÃO FAZER

- Não reutilizar AppShell do produto — admin tem layout próprio
- Não expor admin_settings diretamente (sempre via RPC)
- Não deixar rotas /admin/* acessíveis sem SuperAdminGuard
- Não usar cores roxas — admin é laranja
- Não criar tabelas novas no Supabase
