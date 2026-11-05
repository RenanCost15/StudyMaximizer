# StudyMaximizer — painel de preparação para concursos

Aplicação React responsiva para planejar estudos, acompanhar conteúdo programático, registrar sessões, visualizar a curva de acertos e acompanhar a gamificação. Foi preparada para publicação estática no GitHub Pages.

## O que está incluído

- **Painel geral:** horas registradas, tarefas concluídas, questões, frequência, conteúdos acompanhados e gamificação.
- **Cronograma semanal:** segunda a sábado, com 2h30 planejadas por dia e navegação entre semanas.
- **Mapa de conteúdo detalhado:** disciplina → bloco de assunto → subassuntos individuais com marcação de conclusão, busca, filtros por trilha e filtros de status.
- **Progresso por cargo:** Administrativo, Técnico de TI, Técnico Bancário Novo (CAIXA), TBN-TI (CAIXA) e Analista Bancário 1 (Banco do Nordeste).
- **Desempenho:** histórico de sessões, tempo estudado, questões, acertos por disciplina e curva de aprendizagem semanal.
- **Gamificação:** cinco níveis, XP por tempo efetivo registrado, tarefas, frequência, volume de questões, bônus por metas semanais concluídas e melhora de acertos em semanas comparáveis.
- **Tema claro e escuro**, responsividade para celular e desktop e ícones Lucide.
- **Backup JSON:** exportação e importação de seus dados.

## Executar localmente

Requisitos: Node.js 20 ou superior e npm.

```bash
npm install
npm run dev
```

Para gerar a versão de produção:

```bash
npm run build
npm run preview
```

A pasta `dist/` será criada pelo Vite.

## Publicar no GitHub Pages

O projeto inclui o workflow `.github/workflows/deploy.yml`.

1. Crie um repositório no GitHub chamado, por exemplo, `StudyMaximizer`.
2. Envie os arquivos e pastas deste projeto para a raiz do repositório, incluindo a pasta `.github`.
3. No GitHub, acesse **Settings → Pages** e selecione **GitHub Actions** como fonte de publicação.
4. Faça `git push` para a branch `main`. O workflow instala as dependências, compila a aplicação e publica `dist/`.
5. Consulte a execução da aba **Actions** para confirmar a publicação; o endereço ficará disponível em **Settings → Pages**.

O Vite está configurado com `base: './'`, compatível com o caminho de projeto do GitHub Pages.

## Como funciona o salvamento

Os registros ficam em `localStorage` no navegador usado para acessar o site. Eles não são enviados ao GitHub, nem sincronizados automaticamente entre computadores ou navegadores. Use **Configurações e fontes → Exportar backup** para manter cópias dos seus dados. Importe um backup apenas depois de exportar os dados atuais, pois a importação substitui o estado local.

A versão React mantém uma chave de armazenamento própria e tenta migrar sessões da versão anterior do StudyMaximizer. O progresso de tópicos de versões antigas, cuja identificação não corresponde à nova matriz detalhada, é mantido no arquivo de origem antigo, mas não é automaticamente atribuído a subassuntos novos.

## Metodologia da gamificação

Os níveis são: **Despertar (0 XP), Explorador (500 XP), Leão persistente (1.500 XP), Vulcão imparável (3.000 XP) e Águia de elite (5.000 XP)**.

O XP acumulado é calculado a partir de:

- 5 XP por bloco completo de 30 minutos registrados;
- 5 XP por tarefa planejada marcada como concluída;
- 10 XP por dia com sessão registrada ou tarefa concluída;
- 2 XP por cada bloco de 10 questões resolvidas;
- bônus semanal de 15, 35 ou 60 XP por desempenho de pelo menos 50%, 80% ou 95% em uma combinação de horas, tarefas e frequência, calculado para semanas encerradas;
- 20 XP por melhora percentual de acertos em relação à semana anterior, se as duas semanas tiverem pelo menos 10 questões registradas.

A tela de cronograma compara o realizado com o esperado até o dia anterior: 45% horas, 35% tarefas vencidas e 20% frequência. O XP estimula a regularidade, mas não é uma medida científica do aprendizado; use os resultados por assunto e a qualidade da correção de erros para orientar o estudo.

## Sobre o conteúdo programático

O mapa foi detalhado para servir como **matriz preliminar de preparação**, combinando assuntos recorrentes em editais anteriores e tópicos de apoio. Ele **não garante que todos os assuntos serão cobrados** em novos concursos. Alguns temas estão marcados em módulos específicos ou dependem da previsão do próximo edital. Quando a publicação oficial ocorrer, ajuste a trilha à versão vigente, incluindo retificações, pesos, banca, regras eliminatórias e etapas adicionais.

Fontes de referência oficiais:

- [UFRN / COMPERVE — programas de estudo de concursos técnico-administrativos](https://comperve.ufrn.br/conteudo/concursos/ufrn_202287/programas.php)
- [UFRN / COMPERVE — programas de estudo de 2025](https://comperve.ufrn.br/conteudo/concursos/ufrn_2025_22_23/programas.php)
- [CAIXA — Edital nº 01/2024/NM (TBN e TBN-TI)](https://www.caixa.gov.br/Downloads/concurso-publico-editais/EDITAL_N_01_2024_NM_DE_22_DE_FEVEREIRO_DE_2024_.pdf)
- [Banco do Nordeste — Edital nº 1/2024 (Analista Bancário 1)](https://www.bnb.gov.br/documents/45807/5758094/Edital%2Bn%C2%BA%2B1%2B-%2BAbertura%2Bde%2Bconcurso%2Bp%C3%BAblico%2B2024.pdf)

## Estrutura

```text
StudyMaximizer/
├── .github/workflows/deploy.yml
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── styles.css
    └── data/
        ├── schedule.js
        └── syllabus.js
```
