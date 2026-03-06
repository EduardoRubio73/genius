

## Plano: Suporte, Campos de Perfil, Desativação de Conta e Verificação no Login

### 1. Botão "Suporte" no Sidebar do Perfil

**Arquivo:** `src/pages/ProfilePage.tsx` (nav, linhas 553-577)

Adicionar botão "Suporte" com ícone `Mail` após os tabs existentes. Ao clicar, abre `mailto:zragencyia@gmail.com` com assunto e corpo pré-preenchidos usando dados do perfil (`profile.full_name`, `profile.email`, data atual).

### 2. Campos adicionais no ProfileTab

**Arquivo:** `src/pages/ProfilePage.tsx` (ProfileTab, linhas 70-115)

- Adicionar campo editável "Celular" (já existe coluna `celular` na tabela `profiles`)
- Adicionar exibição visual do status da conta (ativo/inativo) como badge read-only, obtido da organização (`account_status`)
- Salvar celular junto com `full_name` no `handleSave`

### 3. Funcionalidade "Desativar Conta"

**Arquivo:** `src/pages/ProfilePage.tsx` (ProfileTab)

- Adicionar botão "Desativar Conta" (vermelho) no final do card de perfil
- Modal de confirmação usando `AlertDialog` com texto de aviso
- Ao confirmar:
  - Chamar `supabase.from("profiles").update({ ativo: false })` (coluna já existe)
  - Fazer signOut
  - Redirecionar para `/`

### 4. Verificação de conta inativa no Login

**Arquivo:** `src/pages/Login.tsx`

Após login bem-sucedido, verificar `profiles.ativo`:
- Se `ativo = true` → prosseguir normalmente
- Se `ativo = false` → exibir modal com opções:
  - "Solicitar reativação" → abre `mailto:zragencyia@gmail.com` com email de solicitação pré-preenchido, depois faz signOut
  - "Sair" → signOut e redirecionar

### Resumo de alterações

| Arquivo | Ação |
|---------|------|
| `src/pages/ProfilePage.tsx` | Botão suporte na nav, campo celular, badge status, botão desativar com modal |
| `src/pages/Login.tsx` | Verificar `ativo` pós-login, modal de reativação |

Nenhuma migração necessária — as colunas `celular` e `ativo` já existem na tabela `profiles`.

