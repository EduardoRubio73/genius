# Sistema de Indicações (Referral System)

Documentação completa do sistema de indicações da plataforma, incluindo arquitetura, fluxo de dados, regras de negócio e implementação técnica.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Modelo de Dados](#modelo-de-dados)
4. [Regras de Negócio](#regras-de-negócio)
5. [Funções de Banco de Dados](#funções-de-banco-de-dados)
6. [Fluxo Completo](#fluxo-completo)
7. [Componentes Frontend](#componentes-frontend)
8. [Segurança (RLS)](#segurança-rls)
9. [Integração em Novo Projeto](#integração-em-novo-projeto)

---

## Visão Geral

O sistema de indicações permite que usuários com planos pagos convidem novos usuários para a plataforma. Quando o convidado ativa um plano pago, ambos recebem créditos bônus.

### Benefícios

| Evento | Indicador | Convidado |
|--------|-----------|-----------|
| Primeira indicação confirmada | +5 créditos | +5 créditos |
| A cada 10 indicações confirmadas | +10 créditos | — |

### Restrições

- Apenas usuários com plano **pago** podem gerar código de indicação
- Usuários no plano **Free** podem compartilhar o link genérico da plataforma
- Auto-indicação é bloqueada
- Um código só pode ser usado uma vez por organização

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ ReferralPage    │  │ ReferralBonus   │  │ Dashboard       │  │
│  │ /indicacoes     │  │ Card            │  │ (resumo)        │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE CLIENT                              │
│  • supabase.rpc("generate_referral_code", {...})                │
│  • supabase.from("referrals").select(...)                       │
│  • supabase.from("organizations").select(...)                   │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE (PostgreSQL)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ referral_codes  │  │ referrals       │  │ organizations   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
│  RPCs: generate_referral_code, process_referral,                │
│        reward_referral_if_paid, add_extra_credits               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Modelo de Dados

### Tabela: `referral_codes`

Armazena os códigos de indicação gerados por usuários.

```sql
CREATE TABLE public.referral_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL,           -- Organização do indicador
    user_id uuid NOT NULL,          -- Usuário que gerou o código
    code text NOT NULL UNIQUE,      -- Ex: "GENIUS-ABC123"
    is_active boolean DEFAULT true, -- Código ativo/inativo
    uses_limit integer,             -- Limite de usos (null = ilimitado)
    uses_total integer DEFAULT 0,   -- Total de usos
    created_at timestamptz DEFAULT now()
);
```

### Tabela: `referrals`

Registra cada indicação feita.

```sql
CREATE TABLE public.referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_code_id uuid NOT NULL, -- FK para referral_codes
    referrer_org_id uuid NOT NULL,  -- Organização do indicador
    referrer_user_id uuid NOT NULL, -- Usuário indicador
    invitee_org_id uuid,            -- Organização do convidado
    invitee_user_id uuid,           -- Usuário convidado
    invitee_email text,             -- Email do convidado (opcional)
    status referral_status DEFAULT 'pending',
    credits_to_referrer integer DEFAULT 5,
    credits_to_invitee integer DEFAULT 5,
    rewarded_at timestamptz,        -- Quando o bônus foi pago
    expires_at timestamptz DEFAULT (now() + '30 days'),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

### Enum: `referral_status`

```sql
CREATE TYPE public.referral_status AS ENUM (
    'pending',   -- Código compartilhado, aguardando uso
    'trial',     -- Convidado cadastrou, aguardando plano pago
    'rewarded',  -- Bônus creditado para ambos
    'expired'    -- Expirou sem conversão
);
```

### Tabela: `referral_clicks` (Analytics)

Rastreia cliques nos links de indicação.

```sql
CREATE TABLE public.referral_clicks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_code text NOT NULL,
    ip text,
    user_agent text,
    created_at timestamp DEFAULT now()
);
```

### Campos em `organizations`

```sql
ALTER TABLE organizations ADD COLUMN referral_first_bonus_paid boolean DEFAULT false;
ALTER TABLE organizations ADD COLUMN referral_rewards_paid integer DEFAULT 0;
ALTER TABLE organizations ADD COLUMN bonus_credits_total integer DEFAULT 0;
ALTER TABLE organizations ADD COLUMN bonus_credits_used integer DEFAULT 0;
```

| Campo | Descrição |
|-------|-----------|
| `referral_first_bonus_paid` | Se já pagou o bônus da primeira indicação |
| `referral_rewards_paid` | Quantos blocos de 10 indicações já foram recompensados |
| `bonus_credits_total` | Total de créditos bônus acumulados |
| `bonus_credits_used` | Créditos bônus já consumidos |

---

## Regras de Negócio

### 1. Geração de Código

- **Requisito**: Usuário deve ter `plan_tier != 'free'`
- **Formato**: `GENIUS-XXXXXX` (6 caracteres hexadecimais)
- **Unicidade**: Código único no sistema
- **Persistência**: Um usuário só tem um código ativo por vez

### 2. Processamento de Indicação

Quando um novo usuário se cadastra com `?ref=CODE`:

1. Valida se o código existe e está ativo
2. Verifica se não é auto-indicação
3. Verifica se a org do convidado já não foi indicada
4. Cria registro em `referrals` com `status = 'trial'`

### 3. Recompensa de Indicação

Quando o convidado ativa um plano pago:

1. Trigger `trigger_reward_referral` detecta mudança em `billing_subscriptions`
2. Se `status = 'active'` e `plan != 'free'`:
   - Chama `reward_referral_if_paid(org_id)`
   - Paga bônus da primeira indicação se aplicável
   - Atualiza status da indicação para `'rewarded'`
   - Verifica e paga bônus de bloco de 10

### 4. Consumo de Créditos

Prioridade de consumo:
1. **Créditos do plano** (`plan_credits_total - plan_credits_used`)
2. **Créditos extras** (`org_credits.extra_balance`)
3. **Créditos bônus** (`bonus_credits_total - bonus_credits_used`)

---

## Funções de Banco de Dados

### `generate_referral_code(p_org_id, p_user_id)`

Gera ou retorna código existente.

```sql
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_org_id uuid, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
    v_code text;
    v_exists boolean;
    v_attempts integer := 0;
    v_plan text;
begin
    -- Verificar plano
    select plan_tier into v_plan
    from organizations where id = p_org_id;

    if v_plan is null or v_plan = 'free' then
        return 'plan_required';
    end if;

    -- Verificar código existente
    select code into v_code
    from referral_codes
    where user_id = p_user_id and is_active = true
    limit 1;

    if v_code is not null then
        return v_code;
    end if;

    -- Gerar código único
    loop
        v_code := 'GENIUS-' || upper(substring(md5(random()::text),1,6));
        select exists(select 1 from referral_codes where code = v_code) into v_exists;
        exit when not v_exists;
        v_attempts := v_attempts + 1;
        if v_attempts > 10 then
            raise exception 'Falha ao gerar código único';
        end if;
    end loop;

    insert into referral_codes (org_id, user_id, code)
    values (p_org_id, p_user_id, v_code);

    return v_code;
end;
$$;
```

### `process_referral(p_code, p_invitee_org, p_invitee_user)`

Processa uso de código de indicação.

```sql
CREATE OR REPLACE FUNCTION public.process_referral(p_code text, p_invitee_org uuid, p_invitee_user uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
    v_code_rec public.referral_codes%rowtype;
    v_exists boolean;
begin
    -- Buscar código
    select * into v_code_rec
    from public.referral_codes
    where code = upper(trim(p_code)) and is_active = true;

    if not found then return 'invalid_code'; end if;
    if v_code_rec.user_id = p_invitee_user then return 'own_code'; end if;

    -- Limite de uso
    if v_code_rec.uses_limit is not null
    and v_code_rec.uses_total >= v_code_rec.uses_limit then
        return 'limit_reached';
    end if;

    -- Verificar uso duplicado
    select exists(
        select 1 from public.referrals where invitee_org_id = p_invitee_org
    ) into v_exists;

    if v_exists then return 'already_used'; end if;

    -- Criar referral
    insert into public.referrals (
        referrer_code_id, referrer_org_id, referrer_user_id,
        invitee_org_id, invitee_user_id, status
    ) values (
        v_code_rec.id, v_code_rec.org_id, v_code_rec.user_id,
        p_invitee_org, p_invitee_user, 'trial'
    );

    return 'ok_trial';
end;
$$;
```

### `reward_referral_if_paid(p_org_id)`

Paga recompensas quando convidado ativa plano.

```sql
CREATE OR REPLACE FUNCTION public.reward_referral_if_paid(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
    v_ref record;
    v_total integer;
    v_blocks integer;
    v_paid integer;
    v_first_paid boolean;
begin
    for v_ref in
        select r.*, rc.user_id as referrer_user, rc.org_id as referrer_org
        from public.referrals r
        join public.referral_codes rc on rc.id = r.referrer_code_id
        where r.invitee_org_id = p_org_id and r.status = 'trial'
    loop
        -- Bônus da primeira indicação
        select referral_first_bonus_paid into v_first_paid
        from organizations where id = v_ref.referrer_org;

        if v_first_paid = false then
            perform add_extra_credits(v_ref.referrer_org, 5, 'referral_first_bonus');
            perform add_extra_credits(p_org_id, 5, 'referral_first_bonus');
            update organizations set referral_first_bonus_paid = true
            where id = v_ref.referrer_org;
        end if;

        -- Marcar como recompensado
        update public.referrals
        set status = 'rewarded', rewarded_at = now()
        where id = v_ref.id;

        -- Contar referrals confirmados
        select count(*) into v_total
        from referrals
        where referrer_org_id = v_ref.referrer_org and status = 'rewarded';

        -- Bônus de bloco de 10
        v_blocks := floor(v_total / 10);
        select referral_rewards_paid into v_paid
        from organizations where id = v_ref.referrer_org;

        if v_blocks > v_paid then
            perform add_extra_credits(v_ref.referrer_org, 10, 'referral_10_bonus');
            update organizations set referral_rewards_paid = v_blocks
            where id = v_ref.referrer_org;
        end if;
    end loop;
end;
$$;
```

### `add_extra_credits(p_org_id, p_credits, p_source)`

Adiciona créditos extras à organização.

```sql
CREATE OR REPLACE FUNCTION public.add_extra_credits(p_org_id uuid, p_credits integer, p_source text DEFAULT 'stripe_topup')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
    v_balance integer;
begin
    -- Garantir registro em org_credits
    insert into org_credits (organization_id, balance, extra_balance, updated_at)
    values (p_org_id, 0, 0, now())
    on conflict (organization_id) do nothing;

    -- Adicionar créditos extras
    update org_credits
    set extra_balance = coalesce(extra_balance, 0) + p_credits, updated_at = now()
    where organization_id = p_org_id
    returning extra_balance into v_balance;

    -- Registrar transação
    insert into credit_transactions (organization_id, amount, type, source, created_at)
    values (p_org_id, p_credits, 'credit', p_source, now());
end;
$$;
```

---

## Fluxo Completo

### Fluxo 1: Geração de Código

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Usuário abre │───▶│ Frontend     │───▶│ RPC:         │
│ /indicacoes  │    │ chama RPC    │    │ generate_    │
└──────────────┘    └──────────────┘    │ referral_code│
                                        └───────┬──────┘
                                                │
       ┌────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│ 1. Verifica plan_tier != 'free'                      │
│ 2. Verifica se já existe código ativo                │
│ 3. Se não existe, gera código GENIUS-XXXXXX         │
│ 4. Retorna código ou 'plan_required'                 │
└──────────────────────────────────────────────────────┘
```

### Fluxo 2: Uso do Código

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Convidado    │───▶│ Cadastro com │───▶│ handle_new_  │
│ clica link   │    │ ?ref=CODE    │    │ user trigger │
│ ?ref=CODE    │    └──────────────┘    └───────┬──────┘
└──────────────┘                                │
                                                ▼
                                        ┌──────────────┐
                                        │ process_     │
                                        │ referral()   │
                                        └───────┬──────┘
                                                │
       ┌────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│ 1. Valida código                                     │
│ 2. Verifica auto-indicação                           │
│ 3. Verifica uso duplicado                            │
│ 4. Cria registro em referrals (status: trial)        │
└──────────────────────────────────────────────────────┘
```

### Fluxo 3: Recompensa

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Convidado    │───▶│ Stripe       │───▶│ billing_     │
│ paga plano   │    │ webhook      │    │ subscriptions│
└──────────────┘    └──────────────┘    │ atualizado   │
                                        └───────┬──────┘
                                                │
                                        ┌───────▼──────┐
                                        │ trigger_     │
                                        │ reward_      │
                                        │ referral()   │
                                        └───────┬──────┘
                                                │
       ┌────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│ reward_referral_if_paid():                           │
│ 1. Busca referrals com status='trial' para org_id   │
│ 2. Paga bônus primeira indicação (se aplicável)     │
│ 3. Atualiza status para 'rewarded'                   │
│ 4. Verifica e paga bônus de bloco de 10             │
└──────────────────────────────────────────────────────┘
```

---

## Componentes Frontend

### ReferralPage (`/indicacoes`)

Página principal de indicações.

```tsx
// Localização: src/pages/ReferralPage.tsx

// Funcionalidades:
// 1. Exibe programa de indicações para usuários pagos
// 2. Mostra link de convite genérico para usuários Free
// 3. Métricas: confirmadas, próximo bônus, créditos ganhos
// 4. Barra de progresso para bloco de 10
// 5. Lista de indicações com status
// 6. Dialog de celebração na primeira indicação

// Exemplo de uso do RPC:
const { data: code } = await supabase.rpc("generate_referral_code", {
  p_org_id: orgId,
  p_user_id: user.id,
});

// Link formatado:
const referralLink = `https://SEU-DOMINIO.com/?ref=${referralCode}`;
```

### ReferralBonusCard (Dashboard)

Card compacto para Dashboard.

```tsx
// Localização: src/components/referral/ReferralBonusCard.tsx

// Props:
interface Props {
  bonusCredits?: number;  // Total de bônus disponível
  orgId?: string;         // ID da organização
}

// Funcionalidades:
// 1. Exibe bônus disponível
// 2. Botão de compartilhar convite
// 3. Atalho para comprar créditos extras
// 4. Link para página de billing
```

---

## Segurança (RLS)

### referral_codes

```sql
-- Usuário só vê seus próprios códigos
CREATE POLICY referral_codes_select_own ON referral_codes
FOR SELECT USING (user_id = auth.uid());
```

### referrals

```sql
-- Usuário vê indicações onde é referrer ou invitee
CREATE POLICY referrals_select_own ON referrals
FOR SELECT USING (
    referrer_user_id = auth.uid() OR
    invitee_user_id = auth.uid()
);
```

### referral_clicks

```sql
-- Apenas super admin pode ver/modificar
CREATE POLICY referral_clicks_admin_only ON referral_clicks
FOR ALL USING (is_super_admin())
WITH CHECK (is_super_admin());
```

---

## Integração em Novo Projeto

### Passo 1: Criar Tabelas

Execute as migrações SQL na ordem:

```sql
-- 1. Tipos
CREATE TYPE public.referral_status AS ENUM ('pending', 'trial', 'rewarded', 'expired');

-- 2. Tabelas
CREATE TABLE public.referral_codes (...);
CREATE TABLE public.referrals (...);
CREATE TABLE public.referral_clicks (...);

-- 3. Colunas em organizations
ALTER TABLE organizations ADD COLUMN referral_first_bonus_paid boolean DEFAULT false;
ALTER TABLE organizations ADD COLUMN referral_rewards_paid integer DEFAULT 0;

-- 4. Índices
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_user_id);
CREATE INDEX idx_referrals_invitee_id ON referrals(invitee_user_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
```

### Passo 2: Criar Funções

Crie as funções na ordem:
1. `add_extra_credits`
2. `generate_referral_code`
3. `process_referral`
4. `reward_referral_if_paid`

### Passo 3: Criar Triggers

```sql
CREATE OR REPLACE FUNCTION public.trigger_reward_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
    if new.status = 'active' and new.plan <> 'free' then
        perform reward_referral_if_paid(new.org_id);
    end if;
    return new;
end;
$$;

CREATE TRIGGER trg_reward_referral
AFTER INSERT OR UPDATE ON billing_subscriptions
FOR EACH ROW EXECUTE FUNCTION trigger_reward_referral();
```

### Passo 4: Configurar RLS

Habilite RLS e crie as políticas para cada tabela.

### Passo 5: Capturar Código no Cadastro

No `handle_new_user` ou no frontend, capture o parâmetro `?ref=` e chame:

```typescript
// No frontend após cadastro
const ref = new URLSearchParams(window.location.search).get('ref');
if (ref && orgId && userId) {
  await supabase.rpc('process_referral', {
    p_code: ref,
    p_invitee_org: orgId,
    p_invitee_user: userId
  });
}
```

### Passo 6: Implementar Frontend

Copie e adapte:
- `src/pages/ReferralPage.tsx`
- `src/components/referral/ReferralBonusCard.tsx`

### Passo 7: Testar Fluxo

1. Criar usuário com plano pago
2. Gerar código de indicação
3. Criar novo usuário com `?ref=CODE`
4. Verificar status `trial` em referrals
5. Ativar plano pago no convidado
6. Verificar status `rewarded` e créditos creditados

---

## Considerações Finais

### Persistência do Código de Referência

O parâmetro `?ref=` pode ser perdido durante confirmação de email. Recomenda-se:

```typescript
// Salvar no localStorage ao entrar na página
const ref = new URLSearchParams(window.location.search).get('ref');
if (ref) localStorage.setItem('referral_code', ref);

// Usar após login/cadastro
const savedRef = localStorage.getItem('referral_code');
if (savedRef) {
  await supabase.rpc('process_referral', {...});
  localStorage.removeItem('referral_code');
}
```

### Monitoramento

Métricas importantes:
- Taxa de conversão: `referrals.status='rewarded' / total`
- Tempo médio de conversão: `rewarded_at - created_at`
- Top indicadores: `GROUP BY referrer_user_id`

### Escalabilidade

Para alto volume, considere:
- Índices compostos em referrals
- Materializar contagens em organizations
- Fila assíncrona para processamento de recompensas
