

# Adicionar botão de excluir sessão com confirmação

## Plano

Adicionar um botão "Excluir" (ícone lixeira) em cada card de sessão no histórico. Ao clicar, abre um `AlertDialog` do Shadcn pedindo confirmação antes de deletar. Após confirmação, deleta a sessão do Supabase e remove do state local.

## Alterações

### `src/pages/HistoryPage.tsx`

1. **SessionCard** — adicionar prop `onDelete` e botão com ícone `Trash2` ao lado do "Ver", estilizado em vermelho sutil
2. **AlertDialog de confirmação** — state `deleteTarget` no `HistoryPage`. Quando set, abre `AlertDialog` com mensagem "Tem certeza que deseja excluir esta sessão? Esta ação não pode ser desfeita."
3. **Lógica de exclusão** — `handleDelete`: chama `supabase.from("sessions").delete().eq("id", id)`, remove do state `sessions`, exibe toast de sucesso/erro
4. Importar `Trash2` do lucide e `AlertDialog*` do Shadcn

### Fluxo UX
- Usuário clica no ícone 🗑️ → AlertDialog aparece com título "Excluir sessão" e descrição de aviso
- Botão "Cancelar" fecha o dialog
- Botão "Excluir" (destructive) executa a deleção e mostra toast

**Nota**: A tabela `sessions` pode não ter policy de DELETE para o usuário. Se a deleção falhar por RLS, será necessário adicionar uma policy. Isso será verificado no momento da implementação.

