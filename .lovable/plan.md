

# "Copiar Tudo" estruturado — Documento Mestre de Implementação

## Problema atual
O `handleCopyAll` simplesmente concatena os docs com `# título\n\ncontent\n\n---`. O usuário quer que o output seja um **documento mestre estruturado** com header do projeto, stack, fases numeradas e os docs organizados como seções sequenciais — similar ao exemplo "CellManager" fornecido.

## Mudança

### `src/components/UnifiedMemoryDetailDialog.tsx` — reescrever `handleCopyAll`

Construir um markdown estruturado com:

1. **Header**: `# {projectName} — Documento Mestre de Implementação` + instrução ao LLM
2. **Stack**: extraída dos `answers` (stackFrontend, stackBackend, stackDatabase, etc.)
3. **Fases numeradas** mapeando cada doc para uma fase:
   - FASE 1 — BANCO DE DADOS → `sql_schema`
   - FASE 2 — ESTRUTURA E PRD → `prd_md`
   - FASE 3 — MODELO DE DADOS → `erd_md`
   - FASE 4 — CONTROLE DE ACESSO → `rbac_md`
   - FASE 5 — FLUXOS UX → `ux_flows_md`
   - FASE 6 — ROADMAP → `roadmap_md`
   - FASE 7 — ADMIN → `admin_doc_md`
   - FASE 8 — PROMPTS DE IMPLEMENTAÇÃO → `build_prompt`
   - FASE 9 — TESTES → `test_plan_md`
   - FASE 10 — DEPLOY → `deploy_guide_md`
4. **Regras gerais**: extraídas das answers (auth, integrations, branding)

A função lerá `entry.answers` (tipado como `BuildAnswers`) para preencher nome do projeto, stack, paleta de cores, modelo de receita, etc.

### Lógica

```typescript
const handleCopyAll = async () => {
  if (!entry.outputs) return;
  const answers = (entry.answers || {}) as Record<string, any>;
  const projectName = answers.productName || answers.appName || entry.title || "Projeto";
  
  // Build structured header
  let doc = `# ${projectName} — Documento Mestre de Implementação\n\n`;
  doc += `Você é um Arquiteto Sênior. Leia este documento COMPLETO antes de escrever qualquer linha de código. Implemente tudo do zero, na ordem das fases abaixo, sem pular etapas.\n\n---\n\n`;
  
  // Stack section from answers
  doc += `## STACK OBRIGATÓRIA\n\n`;
  if (answers.stackFrontend) doc += `- Frontend: ${answers.stackFrontend}\n`;
  if (answers.stackBackend) doc += `- Backend: ${answers.stackBackend}\n`;
  if (answers.stackDatabase) doc += `- Database: ${answers.stackDatabase}\n`;
  // ... hosting, auth, etc.
  doc += `\n---\n\n`;
  
  // Phases - ordered docs
  const PHASE_ORDER = [
    { key: "sql_schema", phase: "BANCO DE DADOS" },
    { key: "prd_md", phase: "PRD — REQUISITOS DO PRODUTO" },
    { key: "erd_md", phase: "ERD — MODELO DE DADOS" },
    { key: "rbac_md", phase: "RBAC — CONTROLE DE ACESSO" },
    { key: "ux_flows_md", phase: "FLUXOS UX" },
    { key: "roadmap_md", phase: "ROADMAP" },
    { key: "admin_doc_md", phase: "PAINEL ADMINISTRATIVO" },
    { key: "build_prompt", phase: "PROMPTS DE IMPLEMENTAÇÃO" },
    { key: "test_plan_md", phase: "PLANO DE TESTES" },
    { key: "deploy_guide_md", phase: "DEPLOY E INFRAESTRUTURA" },
  ];
  
  let phaseNum = 1;
  for (const { key, phase } of PHASE_ORDER) {
    const content = entry.outputs[key];
    if (!content) continue;
    doc += `## FASE ${phaseNum} — ${phase}\n\n${content}\n\n---\n\n`;
    phaseNum++;
  }
  
  // General rules from answers
  doc += `## REGRAS GERAIS DE IMPLEMENTAÇÃO\n\n`;
  // ... auth, integrations, branding from answers
  
  await navigator.clipboard.writeText(doc);
  toast.success("Documento mestre copiado!");
};
```

### Arquivo modificado

| Arquivo | Mudança |
|---------|---------|
| `src/components/UnifiedMemoryDetailDialog.tsx` | Reescrever `handleCopyAll` para gerar documento mestre estruturado com fases |

