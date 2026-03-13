

# Adicionar tooltips nos cards de modo do Dashboard

## Mudança

**`src/pages/Dashboard.tsx`**

1. Adicionar um campo `tooltip` em cada item do array `MODES` com texto explicativo + exemplo:
   - **Prompt**: "Transforme uma ideia em texto livre em um prompt estruturado e otimizado para qualquer LLM. Ex: 'Crie um chatbot de atendimento' → prompt completo com persona, contexto e formato."
   - **Skill**: "Escolha um agente especialista pronto (ex: Arquiteto de Software, UX Writer) e gere instruções otimizadas para a tarefa. Ex: Selecione 'Code Reviewer' e receba um prompt de revisão de código."
   - **SaaS Spec**: "Responda 7 perguntas sobre seu produto e receba uma especificação técnica completa. Ex: Descreva seu SaaS de gestão → spec com stack, features, modelo de dados."
   - **Modo Misto**: "Combina Prompt + Spec em um fluxo automatizado. A IA extrai campos, refina e gera a spec. Ex: Descreva 'app de delivery' → prompt refinado + spec técnica."
   - **BUILD Engine**: "Da ideia ao pacote completo: PRD, ERD, RBAC, API e mais. Ex: 'Marketplace de freelancers' → 10 documentos prontos para deploy."

2. Envolver o `<button>` do `ModeActionCard` com `<Tooltip>` / `<TooltipTrigger>` / `<TooltipContent>` do Radix, mostrando o texto ao passar o mouse. Importar `TooltipProvider` no nível do grid para não precisar de um provider por card.

3. O tooltip aparece no `side="bottom"` para não sobrepor o card vizinho.

**Arquivo:** `src/pages/Dashboard.tsx` (único arquivo modificado)

