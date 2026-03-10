

# BUILD não aparece na Biblioteca (Memory)

## Problema

O hook `useUnifiedMemory` busca apenas de `prompt_memory` e `saas_specs`. Projetos BUILD (tabela `build_projects`) são completamente ignorados. O contador `build` está hardcoded como `0`.

A sessão BUILD do rsradiotaxi **aparece corretamente no Histórico** (tabela `sessions`), mas a tabela `build_projects` está vazia — o que indica que o usuário gerou mas não salvou o projeto, OU que o save falhou silenciosamente.

## Correção

### 1. Adicionar `build_projects` ao `useUnifiedMemory`

**Arquivo**: `src/hooks/useUnifiedMemory.ts`

- Adicionar um terceiro `useState` para `buildEntries`
- No `fetchAll`, fazer query em `build_projects` com os mesmos filtros de `orgId`, `filter` (gold/favorites), e `limit(40)`
- Normalizar os resultados como `UnifiedMemoryEntry` com `type: "build"`, usando `project_name` como título e concatenação dos outputs como `fullContent`
- Incluir `buildEntries` no `allEntries` combinado
- Corrigir o `counts.build` para contar de `buildEntries.length`
- Adicionar `toggleFavorite` e `deleteEntry` com suporte à tabela `build_projects`

### 2. Adicionar suporte visual no `UnifiedMemorySidebar`

**Arquivo**: `src/components/UnifiedMemorySidebar.tsx`

- Adicionar entry type "build" nos mapas `TYPE_COLORS` e `TYPE_ICONS`

### 3. Adicionar suporte no `UnifiedMemoryDetailDialog`

**Arquivo**: `src/components/UnifiedMemoryDetailDialog.tsx`

- Adicionar "build" ao `TYPE_META` com ícone e estilo
- Mostrar `answers` como campos estruturados quando `entry.type === "build"`

## Arquivos a modificar

1. `src/hooks/useUnifiedMemory.ts` — adicionar query `build_projects` + normalização
2. `src/components/UnifiedMemorySidebar.tsx` — maps de cor/ícone para build
3. `src/components/UnifiedMemoryDetailDialog.tsx` — metadata e visualização build

