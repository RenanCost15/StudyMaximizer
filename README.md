# Trilha — Preparação para Concursos

Painel estático para acompanhar o cronograma semanal, a progressão por disciplina e cargo, sessões de estudo, desempenho e gamificação.

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub (por exemplo, `trilha-concursos`).
2. Envie para a raiz do repositório os arquivos `index.html`, `styles.css`, `app.js` e `README.md`.
3. No repositório, acesse **Settings → Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/ (root)`, depois clique em **Save**.
6. Aguarde a publicação e abra o endereço informado pelo GitHub Pages.

Não é necessário instalar dependências, configurar servidor ou usar banco de dados.

## Recursos

- Tema claro e escuro, com preferência salva no navegador.
- Cronograma de 15 horas semanais, de segunda a sábado.
- Marcação de atividades concluídas e histórico de tarefas por data.
- Progresso por disciplina e por três trilhas de cargo.
- Registro de tempo estudado, questões resolvidas e acertos.
- Curva de aprendizagem com a taxa de acertos por semana.
- Gamificação em cinco níveis, com pontos de experiência (XP).
- Exportação e importação de backup em JSON.

## Como os dados são armazenados

Os dados são gravados no `localStorage` do navegador. Isso significa que:

- o GitHub Pages hospeda os arquivos do site, mas não recebe seus registros pessoais;
- os dados não são sincronizados automaticamente entre computador e celular;
- limpar os dados do navegador pode apagar o histórico;
- use **Dados e preferências → Exportar backup** para guardar uma cópia e **Importar backup** para restaurá-la.

## Sobre o conteúdo programático

A lista de tópicos é uma base inicial de organização, não uma reprodução de edital vigente ou futuro. Disciplinas, pesos, legislação e conteúdos específicos devem ser conferidos e ajustados conforme cada edital oficial. Tópicos compartilhados são contabilizados em mais de uma trilha para refletir o aproveitamento do estudo.

## Personalização

- O cronograma semanal está definido em `BASE_SCHEDULE`, no arquivo `app.js`.
- Os tópicos por disciplina estão em `TOPIC_GROUPS`.
- Os cargos e suas disciplinas estão em `ROLE_TRACKS`.
- Os nomes, símbolos e faixas de XP estão em `LEVELS`.
