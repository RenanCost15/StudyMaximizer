# StudyMaximizer — painel de preparação para concursos

Aplicação React + Vite para planejar estudos, acompanhar conteúdo programático, registrar sessões, visualizar a curva de acertos e acompanhar a gamificação. O projeto está preparado para publicação no **GitHub Pages via GitHub Actions**.

## Importante: não publique os arquivos-fonte diretamente

Se a página ficar branca e o console mostrar `Failed to load resource: ... /src/main.jsx (404)`, o GitHub Pages provavelmente está servindo o `index.html` de desenvolvimento em vez do site compilado. **React/Vite precisa ser compilado antes da publicação.** Não resolva apenas trocando o caminho de `main.jsx`.

## Publicação correta no GitHub Pages

1. Extraia todos os arquivos deste ZIP.
2. Envie o conteúdo da pasta `StudyMaximizer` para a raiz de um repositório GitHub. Preserve a pasta oculta `.github/workflows/deploy.yml` e a pasta `src/`.
3. No repositório, abra **Settings → Pages**.
4. Em **Build and deployment → Source**, selecione **GitHub Actions** — não selecione **Deploy from a branch**.
5. Confirme que a branch de publicação é `main` (ou ajuste `.github/workflows/deploy.yml` para a branch que você realmente usa).
6. Faça um commit/push para `main`, ou abra **Actions → Deploy StudyMaximizer to GitHub Pages → Run workflow**.
7. Abra a aba **Actions** e aguarde a execução ficar verde/sucesso. Só então acesse a URL de Pages exibida em **Settings → Pages**.
8. Recarregue a página com `Ctrl + F5` para limpar recursos antigos em cache.

O workflow executa `npm install`, `npm run build` e publica a pasta `dist/`. O `vite.config.js` usa `base: './'`, para que os arquivos compilados funcionem em URLs do GitHub Pages com nome de repositório.

### Se ainda aparecer uma página branca

- Em **Actions**, abra a execução mais recente. Se estiver vermelha, abra a etapa `Build` e copie o erro completo.
- Verifique se `Settings → Pages → Source` está em **GitHub Actions**.
- Verifique se o repositório contém `.github/workflows/deploy.yml`, `package.json`, `vite.config.js`, `index.html` e `src/main.jsx`.
- Verifique se o workflow está configurado para a branch que recebeu o commit (`main` por padrão).
- O erro 404 de `favicon.ico` era apenas um ícone ausente e não impedia o React de renderizar. Esta versão inclui `public/favicon.svg`.

## Executar localmente

Requisitos: Node.js 20 ou superior e npm.

```bash
npm install
npm run dev
```

Para validar a versão de produção:

```bash
npm run build
npm run preview
```

## O que está incluído

- **Painel geral:** horas registradas, tarefas concluídas, questões, frequência, conteúdos acompanhados e gamificação.
- **Cronograma semanal:** segunda a sábado, com 2h30 planejadas por dia e navegação entre semanas.
- **Mapa de conteúdo detalhado:** disciplina → assunto → subassuntos individuais, busca, filtros por trilha e estado de progresso.
- **Progresso por cargo:** Administrativo, Técnico de TI, Técnico Bancário Novo (CAIXA), TBN-TI (CAIXA) e Analista Bancário 1 (Banco do Nordeste).
- **Desempenho:** histórico de sessões, tempo estudado, questões, acertos por disciplina e curva de aprendizagem semanal.
- **Gamificação:** cinco níveis, XP por tempo efetivo registrado, tarefas, frequência, volume de questões, metas semanais e melhora de acertos.
- **Tema claro/escuro**, responsividade, ícones Lucide e favicon próprio.
- **Backup JSON:** exportação e importação dos dados locais.

## Salvamento

Os dados ficam no `localStorage` do navegador e não são sincronizados automaticamente entre dispositivos. Use as opções de backup nas configurações para exportar e restaurar seus registros.

## Conteúdo programático

O mapa é uma matriz preliminar de preparação inspirada em editais anteriores, não uma garantia de que todos os tópicos serão cobrados em concursos futuros. Quando os editais forem publicados, ajuste as trilhas aos conteúdos oficiais, às retificações, aos pesos, à banca e às regras eliminatórias.

Fontes de referência:

- [UFRN / COMPERVE — programas de estudo técnico-administrativos](https://comperve.ufrn.br/conteudo/concursos/ufrn_202287/programas.php)
- [UFRN / COMPERVE — programas de estudo de 2025](https://comperve.ufrn.br/conteudo/concursos/ufrn_2025_22_23/programas.php)
- [CAIXA — edital de 2024](https://www.caixa.gov.br/Downloads/concurso-publico-editais/EDITAL_N_01_2024_NM_DE_22_DE_FEVEREIRO_DE_2024_.pdf)
- [Banco do Nordeste — edital de 2024](https://www.bnb.gov.br/documents/45807/5758094/Edital%2Bn%C2%BA%2B1%2B-%2BAbertura%2Bde%2Bconcurso%2Bp%C3%BAblico%2B2024.pdf)
