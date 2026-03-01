
### Diagnóstico
- O erro vem de import em `src/App.tsx` para `BuildMode` quando, no ambiente de build, o arquivo `src/pages/build/BuildMode.tsx` não está presente no snapshot.
- Há inconsistência entre documentação e implementação real do BUILD (README descreve estrutura completa, código ainda está parcial), o que aumenta chance de regressão.

### Plano de correção
1. **Garantir arquivo da rota `/build`**
   - Criar/garantir `src/pages/build/BuildMode.tsx` com `export default`.
   - Confirmar nome e caixa exatos: `BuildMode.tsx` em `src/pages/build/`.

2. **Padronizar import em `App.tsx`**
   - Usar caminho explícito e estável (`@/pages/build/BuildMode.tsx` ou `./pages/build/BuildMode.tsx`) e manter um único padrão no projeto.

3. **Evitar imports órfãos no BUILD**
   - Em `BuildMode.tsx`, não importar `src/components/build/*` enquanto esses arquivos não existirem.
   - Manter versão placeholder até concluir wizard completo.

4. **Sincronizar README com o estado real**
   - Ou atualizar README para “BUILD em versão inicial”.
   - Ou criar de fato os arquivos que README já lista (Step1–10, Results, ExportZip).

5. **Validar correção**
   - Rodar `npm run build:dev` e `npm run build`.
   - Abrir `/build` no preview para confirmar renderização.
   - Fazer busca por referências quebradas: `BuildMode`, `components/build`.

### Detalhes técnicos
- A falha é de **resolução de módulo por arquivo ausente**, não de configuração do Vite.
- O aviso de Browserslist está desatualizado, mas **não** causa esse erro de build.
- A mitigação robusta é: **arquivo garantido + import consistente + remoção de imports inexistentes**.
