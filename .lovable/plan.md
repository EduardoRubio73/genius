

# Implementar Modal de Intenção + Cache Semântico no Modo Skills

## Resumo

Duas melhorias no modo Skills & Agentes:
1. **Modal de intenção** — ao clicar "Gerar", abre modal perguntando "Gerar Prompt" ou "Criar Skill" antes de prosseguir
2. **Cache semântico** — antes de chamar a IA, consulta `search_prompts_text` no Supabase para reutilizar prompts similares (0 créditos)

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/skills/SkillIntentModal.tsx` | **CRIAR** — modal com 2 opções (Gerar Prompt / Criar Skill) |
| `src/hooks/usePromptCache.ts` | **CRIAR** — hook que chama RPC `search_prompts_text` |
| `src/pages/prompt/PromptMode.tsx` | **EDITAR** — integrar modal + cache no fluxo de geração |
| `src/components/prompt/PromptInput.tsx` | **EDITAR** — botão passa a aceitar `searching` state para texto dinâmico |

## Detalhes

### 1. `SkillIntentModal.tsx`
Componente conforme especificado no documento: Dialog com 2 cards lado a lado (roxo para "Gerar Prompt", âmbar para "Criar Skill"), usando `Dialog` do shadcn. Props: `open`, `skillName`, `onSelect(intent)`, `onClose`.

### 2. `usePromptCache.ts`
- Concatena campos (especialidade, tarefa, objetivo, contexto) em texto de busca
- Chama `supabase.rpc("search_prompts_text", { search_query, filter_org_id, filter_destino, match_count: 3 })`
- Retorna primeiro resultado com `fromCache: true` se encontrado, ou `null`
- Expõe `{ findSimilarPrompt, searching, lastCacheHit }`

### 3. `PromptMode.tsx` — Fluxo atualizado
```
Clica "Gerar" (modo skills)
  → Abre SkillIntentModal
    → Usuário escolhe "prompt" ou "skill"
      → Se "prompt": consulta cache primeiro
        → Cache HIT: exibe resultado + badge "Do Histórico" (0 créditos)
        → Cache MISS: chama IA normalmente
      → Se "skill": chama IA diretamente (fluxo futuro, por ora igual ao prompt)
```

Novos estados: `intentModalOpen`, `selectedIntent`, `cachedResult`.
O `handleGenerate` recebe `intent` e `forceAI` opcional.

### 4. Badge de cache no resultado
Quando `cachedResult !== null`, exibir banner âmbar acima do prompt final:
> ⚡ Resultado do seu histórico — nenhum crédito foi consumido. [Gerar novo com IA]

### 5. `PromptInput.tsx`
- Nova prop `searching: boolean`
- Botão muda texto: "Consultando histórico..." quando `searching`, "Gerando..." quando `isGenerating`
- No modo skills, `onGenerate` apenas abre o modal (lógica no parent)

