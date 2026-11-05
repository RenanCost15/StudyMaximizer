# StudyMaximizer — Preparação para Concursos

Painel estático para acompanhar o cronograma semanal, a progressão por disciplina e cargo, sessões de estudo, desempenho e gamificação.

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub (por exemplo, `studymaximizer`).
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
- Gamificação em cinco níveis, com XP baseado em tempo registrado, tarefas concluídas, frequência semanal, metas de horas e evolução na taxa de acertos.
- Indicadores de ritmo em relação ao esperado e frequência de dias ativos.
- Migração automática dos dados da versão anterior quando ela estava salva neste mesmo navegador.
- Exportação e importação de backup em JSON.

## Como os dados são armazenados

Os dados são gravados no `localStorage` do navegador. Isso significa que:

- o GitHub Pages hospeda os arquivos do site, mas não recebe seus registros pessoais;
- os dados não são sincronizados automaticamente entre computador e celular;
- limpar os dados do navegador pode apagar o histórico;
- use **Dados e preferências → Exportar backup** para guardar uma cópia e **Importar backup** para restaurá-la.

## Como funciona a gamificação

O StudyMaximizer calcula XP a partir dos registros disponíveis, em vez de premiar apenas o clique em “concluir”:

- **Tempo estudado:** 5 XP a cada bloco completo de 30 minutos registrados.
- **Atividades concluídas:** 5 XP por tarefa planejada concluída.
- **Frequência:** 10 XP por dia ativo de estudo registrado na semana.
- **Meta de horas:** bônus de 15 XP ao alcançar 50% da carga semanal, 35 XP ao alcançar 80% ou 60 XP ao alcançar 100% (vale apenas o maior patamar).
- **Questões:** bônus pequeno pelo volume de questões, com limite semanal.
- **Evolução:** bônus quando a taxa semanal de acertos melhora em relação à última semana válida com pelo menos 10 questões registradas.
- **Progresso por tópico:** 20 XP para tópico concluído e 5 XP para tópico em andamento.

O indicador “Ritmo vs. esperado” compara tempo registrado, tarefas concluídas e frequência até o dia anterior, ponderados em 45%, 35% e 20%. O dia atual fica fora dessa comparação para não exigir a conclusão de uma agenda que ainda está em andamento. A frequência semanal é exibida como dias ativos de um máximo de seis dias planejados. XP pode aumentar conforme novos registros são adicionados; nenhuma pontuação é retirada por descanso. Corrigir ou excluir dados históricos pode recalcular o total, porque a pontuação é derivada dos registros e não um saldo imutável.

Os níveis são: Preguiça em movimento (0 XP), Raposa estratégica (500 XP), Leão persistente (1.500 XP), Vulcão imparável (3.000 XP) e Águia de elite (5.000 XP).

## Sobre o conteúdo programático

A lista de tópicos é uma base inicial de organização, não uma reprodução de edital vigente ou futuro. Disciplinas, pesos, legislação e conteúdos específicos devem ser conferidos e ajustados conforme cada edital oficial. Tópicos compartilhados são contabilizados em mais de uma trilha para refletir o aproveitamento do estudo.

## Personalização

- O cronograma semanal está definido em `BASE_SCHEDULE`, no arquivo `app.js`.
- Os tópicos por disciplina estão em `TOPIC_GROUPS`.
- Os cargos e suas disciplinas estão em `ROLE_TRACKS`.
- Os nomes, símbolos e faixas de XP estão em `LEVELS`.
