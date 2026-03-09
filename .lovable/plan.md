
# Plano: Correções Admin + Confirmação Suporte

## Problemas Identificados

### 1. Usuário RS não aparece na lista Admin
A view `admin_users_overview` tem `WHERE is_super_admin()` - se o usuário admin atual não está sendo reconhecido como super admin pela função, a view retorna vazio.

**Verificação**: A view está correta, mas a função `is_super_admin()` pode não estar retornando `true` para o usuário logado no preview.

### 2. Bônus por Indicação
O usuário RS **JÁ TEM 10 créditos de bônus** (`bonus_credits_total: 10`). Esses vieram das 2 compras de créditos extras que foram processadas manualmente.

**ATENÇÃO**: O sistema **não tem** lógica para dar bônus de indicação quando alguém compra créditos extras. O sistema de indicação atual só dá bônus quando:
- O indicado assina um plano pago (`reward_referral_if_paid`)
- Não quando compra créditos extras (top-up)

**Se você quer bônus ao indicado comprar créditos extras**, isso precisa ser implementado.

### 3. Confirmação no botão Suporte
Atualmente é um `<a href="mailto:...">` direto. Precisa virar um botão com dialog de confirmação.

---

## Implementação

### Parte 1: Corrigir visibilidade Admin Users
Verificar se `is_super_admin()` funciona e testar com o usuário certo.

### Parte 2: Confirmação Suporte
No `AccountSidebar.tsx`:
1. Converter o link em botão
2. Adicionar state para dialog
3. Mostrar AlertDialog perguntando "Deseja enviar um email ao suporte?"
4. Ao confirmar, abrir o mailto

### Parte 3 (Opcional): Bônus por compra de créditos extras
Se desejado, adicionar trigger que dá bônus ao referrer quando o indicado compra créditos extras.

---

## Arquivos a Modificar

1. `src/components/layout/AccountSidebar.tsx` - Adicionar dialog de confirmação no Suporte

---

## Decisão Necessária
Você quer implementar bônus de indicação também para compra de créditos extras (além de assinatura de plano)?
