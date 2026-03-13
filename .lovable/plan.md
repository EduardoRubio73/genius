

# Implementar Tarefas do LOVABLE_FINAL_COMPLETO.md

## O que já existe vs. o que falta

Muito do que o documento pede **já está implementado**:
- ✅ Skills & Agentes tab com categorias e pills (PromptInput.tsx)
- ✅ Single-select de skills
- ✅ Complement card com textarea
- ✅ Cache semântico (usePromptCache.ts)
- ✅ SkillIntentModal
- ✅ `?mode=skill` detection — **NÃO existe ainda**
- ✅ Botão dinâmico "Consultando histórico..." / "Gerando..."

## Tarefas pendentes

### 1. Card "Skill" no Dashboard
Adicionar um 5º card no array `MODES` em `src/pages/Dashboard.tsx`, entre Prompt e SaaS Spec, com custo 2, cor amber, ícone `Zap`, e `href: "/prompt?mode=skill"`.

### 2. Detectar `?mode=skill` no PromptMode
Em `src/pages/prompt/PromptMode.tsx`:
- Ler `useSearchParams()` para `mode=skill`
- Se `isSkillMode`, inicializar `inputMode` como `"skills"` em vez de `"free"`
- Mudar label do modo badge de "Modo Prompt" para "Modo Skill"
- Mudar label do botão para "⚡ Gerar Skill — 2 cotas" quando `isSkillMode`
- Usar `creditCost = isSkillMode ? 2 : 1` (para futuro débito diferenciado)

### 3. Substituir pills por SkillGroupList colapsável
Criar `src/data/skillGroups.ts` com dados de grupos + emojis conforme documento.
Criar `src/components/skills/SkillGroupList.tsx` com accordion por grupo e botão "Criar Skill Personalizada".
Atualizar `PromptInput.tsx` para usar `SkillGroupList` em vez dos pills atuais por categoria.

### 4. Tooltip no campo de detalhes do agente
No complement card dentro de `PromptInput.tsx`, adicionar ícone `HelpCircle` com `Tooltip` contendo sugestões de uso.

### 5. Botão dinâmico por modo
Em `PromptInput.tsx`, aceitar nova prop `isSkillMode` e mudar o label do botão:
- Skills mode: `"⚡ Gerar Skill — 2 cotas"`
- Normal: `"✨ Gerar Prompt — 1 cota"`

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/data/skillGroups.ts` | **CRIAR** — dados dos grupos com emoji |
| `src/components/skills/SkillGroupList.tsx` | **CRIAR** — componente colapsável |
| `src/pages/Dashboard.tsx` | **EDITAR** — adicionar card Skill no array MODES |
| `src/pages/prompt/PromptMode.tsx` | **EDITAR** — detectar `?mode=skill`, passar `isSkillMode` |
| `src/components/prompt/PromptInput.tsx` | **EDITAR** — usar SkillGroupList, tooltip, botão dinâmico |

## Detalhes

### Dashboard MODES array — inserir após Prompt (index 1):
```ts
{
  title: "Skill",
  description: "Selecione um agente especialista e gere uma skill otimizada",
  icon: Zap,
  cost: 2,
  href: "/prompt?mode=skill",
  colorScheme: "amber" as const,
},
```

### PromptMode — useSearchParams:
```ts
const [searchParams] = useSearchParams();
const isSkillMode = searchParams.get("mode") === "skill";
// Initialize inputMode based on URL
const [inputMode, setInputMode] = useState<"free"|"manual"|"skills">(isSkillMode ? "skills" : "free");
```

### SkillGroupList
Accordion-style list replacing flat pills. Each group header shows emoji + label, expands to show skill pills. Includes "Criar Skill Personalizada" dashed button at bottom. Maps skill IDs to existing `skills-data.json` via `findSkillById` for systemPrompt lookup.

### Tooltip
Add `HelpCircle` + `Tooltip` with usage suggestions next to the complement textarea label.

