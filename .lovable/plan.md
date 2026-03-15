

# Melhorar UX do Login — Branding Genius

## O que será feito

Extrair o botão Google OAuth e o header de branding em componentes separados, e atualizar a página de login para dar destaque à marca Genius antes do fluxo OAuth.

## Mudanças

### 1. Criar `src/components/auth/AuthBrand.tsx`
- Componente simples com logo (`src/assets/logo.png` — já existe), título "Entrar no Genius" e subtítulo
- Usa classes Tailwind existentes, sem CSS extra

### 2. Criar `src/components/auth/SocialLogin.tsx`
- Botão "Entrar com Google" com ícone SVG inline (já usado no Login.tsx atual)
- Chama `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: "https://www.zragencyia.com.br/genius/dashboard" } })`
- Aceita prop `disabled` e `onError` para integrar com toast

### 3. Atualizar `src/pages/Login.tsx`
- Substituir o header atual (linhas 407-413) por `<AuthBrand />`
- Substituir o bloco do botão Google (linhas 497-531) por `<SocialLogin />`
- Manter todo o restante: formulário email/senha, signup, modais WhatsApp e conta inativa
- O `redirectTo` será atualizado para `https://www.zragencyia.com.br/genius/dashboard` conforme solicitado

### Notas
- Não será criada pasta `/public/branding` — o logo já existe em `src/assets/logo.png`
- Não será criado arquivo CSS separado — usaremos Tailwind consistente com o resto do projeto
- O ícone Google SVG inline já está no código atual, será reutilizado no componente

