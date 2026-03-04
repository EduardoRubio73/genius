

## Plano: Corrigir layout do Typewriter no Hero + Adicionar ciclo de transparência de custos

### Problema 1: Texto "pula para baixo"
O `<h1>` do hero usa `line-height: 1.07` e as palavras do typewriter têm tamanhos diferentes. Quando o texto é longo demais (ex: "com IA — e ganhe cotas"), ele quebra para uma segunda linha, empurrando tudo para baixo.

### Solução 1: Fixar altura do span do typewriter
Envolver o `<span className="grad">` em um container com altura fixa (`min-height: 1.1em`) e `display: block` para que independentemente do comprimento do texto, o espaço reservado seja sempre o mesmo. Também encurtar os textos mais longos para caberem em uma linha.

Palavras atuais: `["com IA — e ganhe cotas", "em segundos, com IA", "e indique, ganhe mais"]`

Palavras novas (mais curtas e uniformes): `["com IA — ganhe cotas", "em segundos, com IA", "e indique amigos", "~R$0,87 por cota"]`

Adicionar no CSS do hero h1 um estilo para o container do typewriter:
```css
.landing-page .hero .tw-line {
  display: block;
  min-height: 1.15em;
  overflow: hidden;
}
```

### Problema 2: Ciclo de transparência de custos no hero
Incluir a mensagem de transparência de custos como parte do ciclo do typewriter no hero.

### Solução 2: Reestruturar o hero h1
Mudar a estrutura do h1 para ciclar entre dois "blocos" de conteúdo, ou mais simplesmente, adicionar frases de custo ao array de palavras do typewriter para que elas apareçam naturalmente no ciclo.

Nova estrutura do h1:
```
Crie prompts e SaaS
[typewriter com palavras curtas + frases de custo]
indicando amigos
```

Palavras do typewriter atualizadas:
```ts
[
  "com IA — ganhe cotas",
  "1 cota ≈ R$0,87",
  "em segundos, com IA",
  "BUILD ≈ R$4,35",
  "e indique amigos",
]
```

### Alterações

| Arquivo | Mudança |
|---------|---------|
| `src/pages/landing/LandingPage.tsx` | Atualizar array de words do hero TypeWriter, envolver em `<span className="tw-line">` |
| `src/pages/landing/landing.css` | Adicionar `.tw-line` com min-height fixa para evitar reflow |

