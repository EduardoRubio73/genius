

# Atualizar Interface do PromptInput com base no HTML v2

## Resumo

Adicionar um terceiro modo "skills" na barra de abas, com comportamento específico: oculta Builders/IDEs, mostra apenas LLMs + card de Skills, e exibe um card de complemento ao selecionar um skill.

## Mudanças

### 1. `src/components/prompt/PromptInput.tsx`

- Expandir `inputMode` de `"free" | "manual"` para `"free" | "manual" | "skills"`
- Adicionar terceira aba `🧠 Skills & Agentes` com classe CSS especial para estilo roxo quando ativa
- Novo estado `skillComplement: string` para o textarea de complemento
- Nova prop `onSkillComplementChange` para propagar o texto de complemento ao parent

**Comportamento por modo:**
- `"free"`: textarea + todos os 3 accordions de plataforma + skills card (como está hoje)
- `"manual"`: campos manuais + todos os 3 accordions (como está hoje)
- `"skills"`: SEM textarea/campos, SEM Builders/IDEs — mostra apenas LLMs accordion + Skills card + Complement card

**Complement card** (aparece quando `selectedSkill !== null` E `inputMode === "skills"`):
- Badge roxo com nome do skill selecionado (lookup via `findSkillById`)
- Texto explicativo em caixa com borda roxa à esquerda
- Textarea para contexto adicional (max 1200 chars)
- Ocultar e limpar ao desselecionar skill

**Validação `canGenerate` para modo skills:**
- `selectedSkill !== null && !isGenerating`

**Remover** o skills card dos modos `free` e `manual` (ficará visível apenas no modo `skills`).

### 2. `src/pages/prompt/PromptMode.tsx`

- Mudar tipo de `inputMode` para incluir `"skills"`
- Adicionar estado `skillComplement: string`
- Passar `skillComplement` e `onSkillComplementChange` ao `PromptInput`
- No `handleGenerate`, quando `inputMode === "skills"`:
  - Usar `skillComplement` como `freeText` no payload (se preenchido)
  - Enviar `skillSystemPrompt` como já faz hoje
  - Chamar `refine-prompt` com action `"refine"` diretamente (sem distribute), montando fields a partir do skill selecionado

### 3. `src/pages/misto/misto.css`

Adicionar estilos:
- `.misto-rt.tab-skills.on` — fundo `#f5f0ff`, cor `#5b21b6`, borda `1.5px solid #e8e0ff`
- `.complement-card` — borda `1.5px solid #e8e0ff`, border-radius 16px, padding 20px
- `.complement-card .card-hint` — fundo `#faf7ff`, border-left `3px solid #c4b5fd`, font-size 12px
- `.selected-skill-tag` — fundo `#7c3aed`, cor white, border-radius 999px, font-size 12px
- Dark mode variants para todos os acima

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/components/prompt/PromptInput.tsx` | Terceira aba, lógica de visibilidade por modo, complement card |
| `src/pages/prompt/PromptMode.tsx` | Novo estado `skillComplement`, tipo de inputMode expandido, payload para modo skills |
| `src/pages/misto/misto.css` | Estilos para tab skills ativa, complement card, selected-skill-tag |

