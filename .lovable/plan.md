

# Atualização do Dashboard — Nova Versão do Dock + Share Modal

## Mudanças Identificadas

### 1. Dock reestruturado (`DashboardDock.tsx`)

O HTML de referência mudou completamente a estrutura do Dock:
- **Antes**: 4 modos + divider + 2 nav + divider + 2 conta (10 itens)
- **Agora**: Home, Memória, Histórico | Créditos, Convide e Ganhe (5 itens)

Os modos foram removidos do dock (já estão nos cards). O item "Convide e Ganhe" agora abre um **Share Modal** em vez de navegar para `/indicacoes`.

### 2. Share Modal (novo)

Modal com:
- Link de referral copiável (usa `orgId` ou referral code)
- Botão "Copiar" com feedback visual
- Botão "WhatsApp" (abre wa.me com texto)
- Botão "Compartilhar" (usa `navigator.share` ou fallback para copy)
- Backdrop blur, fecha ao clicar fora

### 3. Cards colapsados por padrão

- `resumoOpen` → `useState(false)` (já está assim)
- `modosOpen` → `useState(false)` (mudar de `true` para `false`)

### 4. Dark mode completo

O HTML de referência é light-only. O código atual já tem suporte dark mode nos cards e dock via Tailwind classes. Manter e garantir que o Share Modal também tenha dark mode.

### 5. Responsividade mobile-first

- Dock: em telas `< 640px`, reduzir tamanho dos ícones (42px em vez de 52px), padding menor
- Stats row: já usa `grid-cols-2 sm:grid-cols-5` — OK
- Modos grid: já usa `grid-cols-2 lg:grid-cols-4` — OK
- Share Modal: `max-width: 360px; width: 90%` — responsivo

## Arquivos a modificar

### `src/components/dashboard/DashboardDock.tsx`
- Remover `MODE_ITEMS` do dock
- Reestruturar para: Home (`/dashboard`), Memória, Histórico | Créditos, Share
- Adicionar ícone Home (`Home` de lucide)
- Item "Convide e Ganhe" com `onClick` que abre Share Modal (via callback prop `onShareOpen`)
- Adicionar tooltip "Compartilhar" no item Share
- Mobile: classes responsivas `h-[42px] w-[42px] sm:h-[52px] sm:w-[52px]`

### `src/components/dashboard/ShareModal.tsx` (novo)
- Dialog/modal com backdrop blur
- Input com link de referral (`{origin}/?ref={orgId}`)
- Botão Copiar com estado (✓ Copiado!)
- Botão WhatsApp + Botão Compartilhar nativo
- Dark mode: `bg-card border-border` em vez de cores fixas
- Recebe `open`, `onOpenChange`, `orgId` como props

### `src/pages/Dashboard.tsx`
- `modosOpen` → `useState(false)` (ambos colapsados por padrão)
- Adicionar state `shareOpen` + importar `ShareModal`
- Passar `onShareOpen` ao `DashboardDock`

### `src/index.css`
- Sem mudanças — os dock styles existentes suportam a nova estrutura

