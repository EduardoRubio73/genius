

# Plano: Corrigir badge Free, separar dados Admin vs User, e separar 3 indicadores no Dashboard

## Problemas Identificados

### 1. Badge "free" não aparece na lista de usuários
O `PlanBadge` renderiza corretamente com `tier="free"`, mas o CSS `.adm-badge.free` em light mode usa `color: rgba(255,255,255,.55)` (branco translúcido sobre fundo claro) -- invisível. Em light mode o badge fica em branco sobre branco.

### 2. Admin Overview mistura dados do admin com dados da plataforma
Os cards "Plano Atual", "Créditos Restantes" e "Últimos Consumos" usam `useOrgDashboard(orgId)` e `useOrgUsage(orgId)` onde `orgId` é a **org pessoal do admin logado** (cexrubio). Esses dados pessoais do admin não devem aparecer na visão geral da plataforma. A seção "Faturamento & Stripe" deve mostrar dados **agregados da plataforma** (total de créditos restantes de TODAS as orgs, total de consumos hoje de TODAS as orgs), não do admin.

### 3. Dashboard do usuário: separar Plano, Créditos Extras e Bônus
Atualmente o card "Visão Geral" mistura bônus e extras em um único card "Bônus". O usuário quer 3 indicadores distintos + saldo total:
- **Plano**: cotas do plano (plan_remaining)
- **Créditos Extras**: compras avulsas (extra_credits)
- **Bônus**: indicações (bonus_remaining)
- **Saldo Total**: soma de tudo

## Implementação

### Parte 1: Corrigir CSS do badge "free" em light mode
**Arquivo**: `src/pages/admin/admin.css` (linha 332)
- Alterar `.adm-badge.free` para usar cores visíveis em light mode (cinza escuro sobre fundo cinza claro)

### Parte 2: Remover dados pessoais do admin no AdminOverview
**Arquivo**: `src/pages/admin/AdminOverview.tsx`
- Remover imports e uso de `useOrgDashboard`, `useOrgUsage`, `useOrgSubscription`, `useProfile`
- Substituir card "Plano Atual" por dados agregados da plataforma (já disponíveis via `kpis`)
- Substituir card "Créditos Restantes" por um card com total de créditos restantes de todas as orgs (usar query direta em `organizations` com RLS admin)
- Substituir tabela "Últimos Consumos" por consumos de **toda a plataforma** (query em `credit_transactions` com RLS admin)
- Card "Créditos Consumidos Hoje" deve contar de todas as orgs

### Parte 3: Separar 3 indicadores no Dashboard do usuário
**Arquivo**: `src/pages/Dashboard.tsx`
- Na seção "Visão Geral", trocar os 4 cards atuais (Plano, Cotas Restantes, Bônus, Renovação) por 5 cards:
  1. **Plano Atual** (nome do plano + cotas/mês)
  2. **Cotas do Plano** (plan_remaining)
  3. **Créditos Extras** (extra_credits, compras avulsas)
  4. **Bônus** (bonus_remaining, indicações)
  5. **Saldo Total** (totalRemaining)
- Ou manter 4 cards em grid mas com a separação clara: Plano, Plano Restante, Extras, Bônus
- Atualizar o texto colapsado do resumo para refletir a separação

## Arquivos a Modificar

1. `src/pages/admin/admin.css` -- Corrigir cor do badge free em light mode
2. `src/pages/admin/AdminOverview.tsx` -- Remover dados pessoais, usar dados agregados da plataforma
3. `src/pages/Dashboard.tsx` -- Separar 3 indicadores + saldo total na Visão Geral

