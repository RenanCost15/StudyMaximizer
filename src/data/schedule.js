export const WEEK_PLAN = [
  {
    id: 'mon', day: 'Segunda-feira', short: 'SEG', activities: [
      { id: 'mon-pt-theory', subjectId: 'portugues', label: 'Português · teoria guiada', minutes: 60, type: 'Teoria', focus: 'Interpretação de textos e identificação da ideia central', steps: ['Leia a teoria com atenção e marque dúvidas.', 'Faça um resumo de no máximo cinco linhas.', 'Explique o conceito com suas próprias palavras.'], track: 'all' },
      { id: 'mon-pt-questions', subjectId: 'portugues', label: 'Português · questões', minutes: 45, type: 'Questões', focus: 'Questões de interpretação, inferência e intenção do autor', steps: ['Resolva sem consultar o material.', 'Marque questões em que ficou entre duas alternativas.', 'Confira o comentário de todas as questões erradas.'], track: 'all' },
      { id: 'mon-pt-review', subjectId: 'portugues', label: 'Português · caderno de erros', minutes: 45, type: 'Revisão', focus: 'Registrar erros, regra aplicada e exemplo correto', steps: ['Classifique cada erro por assunto.', 'Reescreva a regra com um exemplo.', 'Revise os erros da semana anterior.'], track: 'all' },
    ]
  },
  {
    id: 'tue', day: 'Terça-feira', short: 'TER', activities: [
      { id: 'tue-pt', subjectId: 'portugues', label: 'Português · gramática aplicada', minutes: 60, type: 'Teoria + questões', focus: 'Coesão, classes de palavras ou sintaxe, conforme a sequência de estudo', steps: ['Estude um único bloco de assunto.', 'Resolva pelo menos 10 questões curtas.', 'Anote a regra que mais confundiu.'], track: 'all' },
      { id: 'tue-math', subjectId: 'matematica-logica', label: 'Matemática e Raciocínio Lógico', minutes: 45, type: 'Base', focus: 'Frações, porcentagem, proporção e regra de três', steps: ['Resolva exemplos passo a passo.', 'Mostre os cálculos, sem pular etapas.', 'Refaça duas questões erradas sem olhar a solução.'], track: 'all' },
      { id: 'tue-logic', subjectId: 'matematica-logica', label: 'Raciocínio lógico · prática', minutes: 45, type: 'Questões', focus: 'Proposições, conectivos, padrões ou tópico previsto no edital', steps: ['Identifique o tipo de problema.', 'Use tabela, diagrama ou cálculo quando ajudar.', 'Registre o tempo e o motivo de cada erro.'], track: 'all' },
    ]
  },
  {
    id: 'wed', day: 'Quarta-feira', short: 'QUA', activities: [
      { id: 'wed-law', subjectId: 'legislacao', label: 'Legislação e Administração Pública', minutes: 60, type: 'Teoria', focus: 'Princípios da Administração Pública e legislação selecionada', steps: ['Use a versão vigente da lei em fonte oficial.', 'Monte um quadro de conceitos, prazos e exceções.', 'Resolva questões literais e situacionais.'], track: 'admin' },
      { id: 'wed-admin', subjectId: 'administracao', label: 'Administração e rotinas', minutes: 60, type: 'Teoria + prática', focus: 'Funções administrativas, processos, atendimento ou documentos', steps: ['Estude o conceito e veja um exemplo de aplicação.', 'Crie um mapa curto ou fluxograma.', 'Resolva questões do tema.'], track: 'admin' },
      { id: 'wed-pt-review', subjectId: 'portugues', label: 'Português · revisão espaçada', minutes: 30, type: 'Revisão', focus: 'Revisão de cartões, resumos e erros recentes', steps: ['Revise sem ler o resumo primeiro.', 'Responda às perguntas de memória.', 'Marque os itens que ainda exigem repetição.'], track: 'all' },
    ]
  },
  {
    id: 'thu', day: 'Quinta-feira', short: 'QUI', activities: [
      { id: 'thu-pt', subjectId: 'portugues', label: 'Português · sintaxe e pontuação', minutes: 60, type: 'Teoria + questões', focus: 'Pontuação, concordância, regência ou crase', steps: ['Estude a regra contextualizada.', 'Resolva questões da banca sempre que disponível.', 'Explique por que cada alternativa está certa ou errada.'], track: 'all' },
      { id: 'thu-finance', subjectId: 'mat-fin-estatistica', label: 'Matemática Financeira e Estatística', minutes: 60, type: 'Prática', focus: 'Juros, porcentagem, descontos, estatística ou gráficos', steps: ['Escreva os dados, a fórmula e as unidades.', 'Resolva questões com cálculo completo.', 'Confira se a taxa e o prazo usam a mesma unidade.'], track: 'bancaria' },
      { id: 'thu-english', subjectId: 'ingles', label: 'Inglês · leitura', minutes: 30, type: 'Leitura', focus: 'Vocabulário contextual e compreensão de texto', steps: ['Leia o texto antes de traduzir palavra por palavra.', 'Identifique a ideia central e os cognatos.', 'Registre cinco palavras úteis com contexto.'], track: 'caixa' },
    ]
  },
  {
    id: 'fri', day: 'Sexta-feira', short: 'SEX', activities: [
      { id: 'fri-ti', subjectId: 'ti', label: 'Tecnologia da Informação', minutes: 90, type: 'Conteúdo técnico', focus: 'Alternar redes, sistemas operacionais, banco de dados, programação e segurança', steps: ['Estude um tópico delimitado do edital de referência.', 'Faça um diagrama, comando ou exercício prático.', 'Resolva questões e mantenha um glossário técnico.'], track: 'ti' },
      { id: 'fri-pt', subjectId: 'portugues', label: 'Português · bateria de questões', minutes: 60, type: 'Questões', focus: 'Bateria mista dos assuntos estudados durante a semana', steps: ['Resolva em tempo controlado.', 'Classifique os erros por assunto.', 'Escolha o tema prioritário da próxima revisão.'], track: 'all' },
    ]
  },
  {
    id: 'sat', day: 'Sábado', short: 'SÁB', activities: [
      { id: 'sat-bank', subjectId: 'bancarios', label: 'Conhecimentos Bancários', minutes: 60, type: 'Teoria + questões', focus: 'SFN, produtos, meios de pagamento, crédito e módulo específico do banco', steps: ['Leia o material base e consulte a fonte institucional.', 'Faça questões sobre o tópico.', 'Atualize a lista do que precisa ser conferido no edital.'], track: 'bancaria' },
      { id: 'sat-admin-questions', subjectId: 'administracao', label: 'Administração · revisão por questões', minutes: 60, type: 'Questões', focus: 'Questões de Administração Geral, processos e legislação já estudada', steps: ['Faça um bloco sem consulta.', 'Revise o fundamento das respostas.', 'Reestude o subtema com menor percentual de acertos.'], track: 'admin' },
      { id: 'sat-simulado', subjectId: 'redacao', label: 'Simulado curto ou redação', minutes: 30, type: 'Avaliação', focus: 'Alternar simulado misto e treino de redação a cada semana', steps: ['Controle o tempo e simule as condições de prova.', 'Registre as questões, acertos e dúvidas.', 'Escolha até três prioridades para a próxima semana.'], track: 'all' },
    ]
  },
];

export const PLANNED_HOURS_PER_WEEK = 15;
export const PLANNED_STUDY_DAYS = 6;
