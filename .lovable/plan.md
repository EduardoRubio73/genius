

## Plano: Correções Landing Page — Badge, Footer, Modal de Contato

### 1. Corrigir scroll horizontal
**Arquivo:** `src/pages/landing/landing.css`

Algum elemento (provavelmente orbs ou elementos com posição absoluta) está vazando. Adicionar `overflow-x: hidden` no `html, body` e garantir que `.landing-page` tem `max-width: 100vw`.

### 2. Footer — remover link "Contato", espaçar de badge
**Arquivo:** `src/pages/landing/LandingPage.tsx` (linhas 631-635)

- Remover o botão "Contato" do footer (ficará apenas "Termos" e "Privacidade")
- Adicionar `margin-bottom` nos `.flinks` para não sobrepor com o badge flutuante

**Arquivo:** `src/pages/landing/landing.css`
- Adicionar `padding-bottom: 80px` no footer para evitar sobreposição com o badge

### 3. Badge "Home" — navegar para landing page corretamente
**Arquivo:** `index.html`

O link Home `<a href="/">` já aponta para `/`. Se o usuário está logado, `/` pode redirecionar para dashboard. Manter como está — já funciona.

### 4. Badge "Contato/Suporte" — conectar ao modal React
**Arquivo:** `index.html`

A função `abrirModalContato()` faz apenas `alert()`. Precisa disparar o modal React. Solução: usar `CustomEvent` no JS vanilla do badge e escutar no React.

**Arquivo:** `src/pages/landing/LandingPage.tsx`
- Adicionar `useEffect` que escuta evento `open-contact-modal` e seta `setModal("contact")`

**Arquivo:** `index.html`
- Alterar `abrirModalContato()` para `document.dispatchEvent(new CustomEvent("open-contact-modal"))`

### 5. Modal de Contato — adicionar logo ZR Agency, categorias e compartilhar
**Arquivo:** Copiar `user-uploads://logo.png` para `src/assets/logo-zragency.png`

**Arquivo:** `src/pages/landing/LandingPage.tsx` — `ContactModalContent`

Reestruturar o modal:
1. **Logo ZR Agency** no topo, clicável (abre site da ZR Agency ou link definido)
2. **Seletor de categoria** — botões pill para: Dúvida, Sugestão, Elogios, Críticas, Dicas/Ideias
   - Estado: `category` — selecionado inclui no `baseBody` da mensagem
3. **Textarea** existente (mantém)
4. **Botões E-mail e WhatsApp** (mantém, incluindo categoria selecionada no texto)
5. **Seção "Compartilhar"** abaixo — texto "Gostou de nossa plataforma? Compartilhe!" com botão que copia link da landing page ou usa `navigator.share`

**Arquivo:** `src/pages/landing/landing.css`
- Adicionar estilos para `.contact-categories` (botões pill), `.contact-share` section, `.contact-logo`

### Arquivos

| Arquivo | Ação |
|---------|------|
| `index.html` | Editar — CustomEvent no badge, overflow fix |
| `src/pages/landing/LandingPage.tsx` | Editar — remover Contato do footer, escutar evento, redesenhar ContactModalContent |
| `src/pages/landing/landing.css` | Editar — padding footer, estilos categorias e compartilhar |
| `src/assets/logo-zragency.png` | Criar — copiar logo do upload |

