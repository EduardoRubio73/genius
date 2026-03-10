

# Redesign do Dashboard com Dock

## Resumo

Aplicar o novo layout do HTML de referência ao Dashboard React, incluindo o Dock de navegação fixo na parte inferior, cards de modo com gradientes coloridos, e layout simplificado das seções colapsáveis. Manter Plus Jakarta Sans como fonte do sistema.

## Mudanças

### 1. Novo componente Dock (`src/components/dashboard/DashboardDock.tsx`)

Dock fixo na parte inferior da tela no estilo macOS:
- 4 atalhos de modos (Prompt, SaaS Spec, Modo Misto, BUILD) com ícones coloridos
- Separador vertical
- 2 links de navegação (Memória, Histórico com badge de sessões)
- Separador vertical
- 2 links de conta (Indicações, Comprar Créditos)
- Efeito hover com magnification (translateY + scale nos vizinhos)
- Labels flutuantes no hover
- Dot de "ativo" para a página atual
- Glassmorphism (backdrop-blur, borda sutil, sombra)
- Suporte dark mode

### 2. Refatorar cards de modo (`ModeActionCard`)

Trocar o estilo atual (bg-card genérico) pelos gradientes coloridos do HTML:
- Purple: `bg-gradient-to-br from-purple-50 to-purple-100` / dark: `from-purple-950/40 to-purple-900/20`
- Blue: similar com blue
- Green: similar com green  
- Amber: similar com amber
- Ícone dentro de wrap com fundo semi-transparente da cor do modo
- Badge com custo + "até N" no estilo pill colorido
- Link "Iniciar →" na cor do modo

Adicionar campo `colorScheme` ao array `MODES`.

### 3. Refatorar seção "Resumo da Conta"

- Stats row como grid de 5 colunas com estilo simplificado (fundo `bg-muted`, border, border-radius menor)
- Progress bars mais finas (h-1.5 em vez de h-3) com gradientes
- Mini stats (4 colunas) com valores grandes e labels pequenos, separados por border-top
- Remover SummaryCard component (substituir por inline stat-items mais compactos)

### 4. Remover seção "Acesso rápido"

O Dock substitui essa seção. Remover o Collapsible de "Acesso rápido" e o import do `ReferralBonusCard` no Dashboard (o dock já linka para `/indicacoes`).

### 5. Adicionar padding-bottom ao body/main

`padding-bottom: 110px` para não sobrepor o dock ao conteúdo.

### 6. Estilos complementares em `src/index.css`

Adicionar animação `dock-magnify` e classes utilitárias para os gradientes de modo se necessário.

## Arquivos a modificar

1. `src/components/dashboard/DashboardDock.tsx` — novo componente
2. `src/pages/Dashboard.tsx` — refatorar layout completo
3. `src/index.css` — estilos complementares do dock

## Resultado esperado

- Dashboard com visual mais limpo seguindo o HTML de referência
- Dock fixo na parte inferior com navegação rápida e efeito magnification
- Cards de modo com gradientes coloridos por tema
- Fonte Plus Jakarta Sans mantida em todo o sistema
- Dark mode totalmente funcional

