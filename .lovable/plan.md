

# Auto-save + Tabs com documentos no modal de visualização

## 1. Auto-save ao finalizar geração (todos os modos)

Cada modo atualmente exige clique manual em "Salvar". A lógica de save será chamada automaticamente após a geração concluir com sucesso.

### `src/pages/prompt/PromptMode.tsx`
- No `handleGenerate`, após `setStep("results")`, chamar a lógica de save inline (inserir em `prompt_memory`)
- Remover botão "Salvar" manual da UI de resultados (ou manter como "Salvo ✓" sempre)

### `src/pages/saas/SaasMode.tsx`
- No `handleGenerate`, após `setStep("results")`, chamar save inline (inserir em `saas_specs`)
- Remover/desabilitar botão "Salvar"

### `src/pages/misto/MistoMode.tsx`
- No `handleGenerate`, após `setStep("results")`, chamar save inline (inserir em `prompt_memory` + `saas_specs`)
- Remover/desabilitar botão "Salvar"

### `src/pages/build/BuildMode.tsx`
- No `handleGenerate`, após `setStep("results")`, chamar save inline (inserir em `build_projects`)
- Remover/desabilitar botão "Salvar"

Em todos os casos: `setIsSaved(true)` e `setMemoryRefreshKey(k => k+1)` imediatamente após insert. Toast "Salvo automaticamente ✓".

## 2. Tabs de documentos no UnifiedMemoryDetailDialog

Atualmente o modal mostra `fullContent` como bloco único. Para Build (10 docs) e Misto (prompt + spec), isso perde a estrutura.

### Mudanças em `UnifiedMemoryEntry`
- Adicionar campo opcional `outputs?: Record<string, string> | null` ao tipo `UnifiedMemoryEntry`

### Mudanças em `useUnifiedMemory.ts`
- No normalize de build entries, popular `outputs` com o record original (além de `fullContent`)

### Mudanças em `HistoryPage.tsx` → `handleView` para build
- Popular `outputs` no entry quando mode === "build"

### Mudanças em `UnifiedMemoryDetailDialog.tsx`
- Importar DOC_LABELS map (ou definir inline)
- Quando `entry.type === "build"` e `entry.outputs` existe:
  - Renderizar tabs (botões) com os nomes dos documentos
  - Estado local `activeDoc` para controlar qual tab está ativa
  - Mostrar conteúdo do doc ativo com botão "Copiar" individual
- Quando `entry.type === "mixed"`:
  - 2 tabs: "Prompt Gerado" e "Spec Técnica"
  - O prompt fica no `fullContent` (prompt_gerado), a spec precisa ser buscada via `session_id` do `saas_specs`
  - Alternativamente, incluir ambos no entry ao construí-lo

### Mudanças em `MistoResults.tsx`
- Já tem tabs internas (prompt/spec/compare) — sem mudanças necessárias no fluxo de geração

## Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/prompt/PromptMode.tsx` | Auto-save após geração |
| `src/pages/saas/SaasMode.tsx` | Auto-save após geração |
| `src/pages/misto/MistoMode.tsx` | Auto-save após geração |
| `src/pages/build/BuildMode.tsx` | Auto-save após geração |
| `src/hooks/useUnifiedMemory.ts` | Adicionar `outputs` ao tipo e normalização |
| `src/components/UnifiedMemoryDetailDialog.tsx` | Tabs de documentos para Build e Misto |
| `src/pages/HistoryPage.tsx` | Popular `outputs` no handleView para build |

## Detalhes técnicos

### Auto-save pattern (mesmo em todos os modos)
```typescript
// Após setStep("results"):
try {
  await supabase.from("TABLE").insert({ ... });
  setIsSaved(true);
  setMemoryRefreshKey(k => k + 1);
} catch (e) {
  console.warn("Auto-save falhou:", e);
  // Manter botão salvar manual como fallback
}
```

### DOC_LABELS no modal
```typescript
const BUILD_DOC_LABELS: Record<string, string> = {
  prd_md: "📋 PRD", erd_md: "🗂️ ERD", rbac_md: "🔐 RBAC",
  ux_flows_md: "🔄 Fluxos UX", test_plan_md: "🧪 Testes",
  roadmap_md: "🗺️ Roadmap", admin_doc_md: "⚙️ Admin",
  sql_schema: "💾 SQL", build_prompt: "🤖 Prompt", deploy_guide_md: "🚀 Deploy",
};
```

### Tabs UI no modal (Build)
- Botões `flex-wrap gap-1.5` acima do bloco de conteúdo
- Cada tab: `text-[10px] px-2.5 py-1 rounded-full border` com estado ativo destacado
- Botão "Copiar" copia apenas o doc ativo

### Tabs UI no modal (Mixed)
- 2 tabs: "✨ Prompt" e "🏗️ Spec Técnica"
- Prompt vem de `fullContent`, spec precisa ser incluída no entry
- No `HistoryPage.handleView` para misto: buscar `saas_specs` pelo mesmo `session_id` e incluir como `spec_md` no entry
- Adicionar `spec_md?: string` ao `UnifiedMemoryEntry`

