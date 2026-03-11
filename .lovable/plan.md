

# Refatorar LandingPage.tsx

## Problema
O build falha porque `react-icons/io5` não está instalado. O projeto já usa `lucide-react` para todos os ícones.

## Solução
Substituir `import { IoShareSocial } from "react-icons/io5"` por `import { Share2 } from "lucide-react"` e trocar `<IoShareSocial size={18} />` por `<Share2 size={18} />`.

Também corrigir o mailto malformado na linha 59: `mailto:zragencyia@://gmail.com{subject}` → `mailto:zragencyia@gmail.com?subject=${subject}`.

### Arquivo: `src/pages/landing/LandingPage.tsx`
- Linha 2: trocar import `react-icons/io5` → `lucide-react` (`Share2`)
- Linha 59: corrigir URL do mailto
- Linha 109: trocar `<IoShareSocial>` → `<Share2>`

