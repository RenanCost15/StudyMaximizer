'use strict';

const STORAGE_KEY = 'studymaximizer-data-v1';
const LEGACY_STORAGE_KEY = 'trilha-concursos-data-v1';
const SUBJECTS = [
  'Português',
  'Raciocínio Lógico e Matemática',
  'Legislação e Administração Pública',
  'Administração',
  'Matemática Financeira e Estatística',
  'Inglês',
  'Tecnologia da Informação',
  'Conhecimentos Bancários',
  'Simulado e redação'
];

const TOPIC_GROUPS = [
  {
    id: 'portugues', name: 'Língua Portuguesa', filter: 'common', tag: 'Base comum',
    topics: [
      ['port-interp', 'Compreensão e interpretação de textos'],
      ['port-tipologia', 'Tipologia e gêneros textuais'],
      ['port-coesao', 'Coesão, coerência e conectivos'],
      ['port-ortografia', 'Ortografia e acentuação'],
      ['port-classes', 'Classes de palavras'],
      ['port-sintaxe', 'Sintaxe da oração e do período'],
      ['port-pontuacao', 'Pontuação'],
      ['port-concordancia', 'Concordância verbal e nominal'],
      ['port-regencia', 'Regência verbal e nominal'],
      ['port-crase', 'Crase'],
      ['port-colocacao', 'Colocação pronominal']
    ]
  },
  {
    id: 'rlm', name: 'Raciocínio Lógico e Matemática', filter: 'common', tag: 'Base comum',
    topics: [
      ['rlm-operacoes', 'Operações básicas e números decimais'],
      ['rlm-fracoes', 'Frações e expressões numéricas'],
      ['rlm-porcentagem', 'Porcentagem'],
      ['rlm-razao', 'Razão, proporção e regra de três'],
      ['rlm-proposicoes', 'Proposições e conectivos lógicos'],
      ['rlm-negacao', 'Negação e equivalências lógicas'],
      ['rlm-conjuntos', 'Conjuntos e diagramas'],
      ['rlm-sequencias', 'Sequências e padrões']
    ]
  },
  {
    id: 'legislacao', name: 'Legislação e Administração Pública', filter: 'admin', tag: 'Administrativo · TI',
    topics: [
      ['leg-principios', 'Princípios da Administração Pública'],
      ['leg-organizacao', 'Organização administrativa'],
      ['leg-agentes', 'Agentes públicos'],
      ['leg-regime', 'Regime jurídico dos servidores (quando previsto)'],
      ['leg-licitacoes', 'Licitações e contratos — Lei nº 14.133/2021'],
      ['leg-constituicao', 'Noções de Constituição Federal e serviço público']
    ]
  },
  {
    id: 'administracao', name: 'Administração', filter: 'admin', tag: 'Administrativo',
    topics: [
      ['adm-funcoes', 'Funções administrativas: planejar, organizar, dirigir e controlar'],
      ['adm-processos', 'Gestão de processos e rotinas administrativas'],
      ['adm-atendimento', 'Atendimento ao público e comunicação organizacional'],
      ['adm-arquivo', 'Gestão documental e arquivologia básica'],
      ['adm-materiais', 'Administração de materiais e patrimônio'],
      ['adm-gestao', 'Gestão de pessoas e trabalho em equipe']
    ]
  },
  {
    id: 'ti', name: 'Tecnologia da Informação', filter: 'it', tag: 'Técnico de TI',
    topics: [
      ['ti-logica', 'Lógica de programação e algoritmos'],
      ['ti-programacao', 'Linguagens e paradigmas de programação'],
      ['ti-estruturas', 'Estruturas de dados'],
      ['ti-sistemas', 'Sistemas operacionais'],
      ['ti-redes', 'Redes de computadores e protocolos'],
      ['ti-banco', 'Bancos de dados e SQL'],
      ['ti-engenharia', 'Engenharia de software e métodos ágeis'],
      ['ti-seguranca', 'Segurança da informação e LGPD'],
      ['ti-governanca', 'Governança, serviços e infraestrutura de TI']
    ]
  },
  {
    id: 'mat-fin', name: 'Matemática Financeira e Estatística', filter: 'bank', tag: 'Bancária',
    topics: [
      ['fin-porcentagem', 'Porcentagem e variação percentual'],
      ['fin-juros', 'Juros simples e compostos'],
      ['fin-descontos', 'Taxas, descontos e equivalência de capitais'],
      ['fin-probabilidade', 'Probabilidade'],
      ['fin-estatistica', 'Estatística descritiva'],
      ['fin-graficos', 'Leitura de tabelas e gráficos']
    ]
  },
  {
    id: 'ingles', name: 'Língua Inglesa', filter: 'bank', tag: 'Conforme o edital',
    topics: [
      ['ing-reading', 'Compreensão geral de textos'],
      ['ing-vocab', 'Vocabulário e expressões recorrentes'],
      ['ing-grammar', 'Estruturas gramaticais essenciais']
    ]
  },
  {
    id: 'bancarios', name: 'Conhecimentos Bancários', filter: 'bank', tag: 'Bancária',
    topics: [
      ['bank-sfn', 'Sistema Financeiro Nacional'],
      ['bank-bacen', 'CMN, Banco Central e órgãos reguladores'],
      ['bank-produtos', 'Produtos e serviços bancários'],
      ['bank-credito', 'Crédito, financiamento e meios de pagamento'],
      ['bank-invest', 'Noções de investimentos e mercado financeiro'],
      ['bank-atendimento', 'Atendimento, relacionamento e vendas'],
      ['bank-etica', 'Ética, compliance e prevenção a fraudes'],
      ['bank-digital', 'Transformação digital, fintechs e inovação']
    ]
  }
];

const ROLE_TRACKS = [
  {
    id: 'admin', symbol: '▤', title: 'Apoio Técnico-Administrativo', subtitle: 'Cargo: Administrativo',
    description: 'Ênfase em rotinas administrativas, gestão pública e legislação aplicável às instituições federais.',
    groups: ['portugues', 'rlm', 'legislacao', 'administracao']
  },
  {
    id: 'it', symbol: '⌘', title: 'Apoio Técnico-Administrativo', subtitle: 'Cargo: Técnico de Tecnologia da Informação',
    description: 'Base comum acompanhada de fundamentos técnicos, desenvolvimento, infraestrutura e segurança da informação.',
    groups: ['portugues', 'rlm', 'legislacao', 'ti']
  },
  {
    id: 'bank', symbol: '◇', title: 'Técnico Bancário Novo / Analista Bancário', subtitle: 'Trilha bancária',
    description: 'Preparação para conhecimentos bancários, matemática financeira, atendimento e conteúdos complementares.',
    groups: ['portugues', 'rlm', 'mat-fin', 'ingles', 'bancarios']
  }
];

const BASE_SCHEDULE = [
  { day: 1, label: 'Segunda-feira', tasks: [
    { id: 'mon-port', subject: 'Português', track: 'common', minutes: 150, title: 'Interpretação de textos e gramática', detail: '45 min de teoria, 75 min de questões e 30 min de correção dos erros.' }
  ]},
  { day: 2, label: 'Terça-feira', tasks: [
    { id: 'tue-port', subject: 'Português', track: 'common', minutes: 60, title: 'Interpretação e leitura ativa', detail: 'Leitura orientada, identificação da ideia central e questões de interpretação.' },
    { id: 'tue-rlm', subject: 'Raciocínio Lógico e Matemática', track: 'common', minutes: 90, title: 'Matemática básica e raciocínio lógico', detail: 'Teoria objetiva, resolução de problemas e registro das dúvidas.' }
  ]},
  { day: 3, label: 'Quarta-feira', tasks: [
    { id: 'wed-leg', subject: 'Legislação e Administração Pública', track: 'admin', minutes: 60, title: 'Legislação e Administração Pública', detail: 'Estude um tópico e resolva questões. Confira a pertinência das normas no edital.' },
    { id: 'wed-admin', subject: 'Administração', track: 'admin', minutes: 60, title: 'Fundamentos de Administração', detail: 'Funções administrativas, processos, rotinas e aplicações práticas.' },
    { id: 'wed-port', subject: 'Português', track: 'common', minutes: 30, title: 'Revisão de Português', detail: 'Retome os erros recentes e resolva questões curtas.' }
  ]},
  { day: 4, label: 'Quinta-feira', tasks: [
    { id: 'thu-port', subject: 'Português', track: 'common', minutes: 60, title: 'Gramática aplicada a questões', detail: 'Estude o tópico da semana e observe como a banca formula as alternativas.' },
    { id: 'thu-fin', subject: 'Matemática Financeira e Estatística', track: 'bank', minutes: 60, title: 'Matemática Financeira e Estatística', detail: 'Porcentagem, juros, leitura de dados ou estatística básica.' },
    { id: 'thu-eng', subject: 'Inglês', track: 'bank', minutes: 30, title: 'Leitura e compreensão em Inglês', detail: 'Leia um texto curto, identifique a ideia principal e revise vocabulário.' }
  ]},
  { day: 5, label: 'Sexta-feira', tasks: [
    { id: 'fri-ti', subject: 'Tecnologia da Informação', track: 'it', minutes: 90, title: 'Conhecimentos específicos de TI', detail: 'Alterne programação, redes, bancos de dados, sistemas, segurança e engenharia de software.' },
    { id: 'fri-port', subject: 'Português', track: 'common', minutes: 60, title: 'Português: prática e correção', detail: 'Questões de concursos e análise detalhada das alternativas.' }
  ]},
  { day: 6, label: 'Sábado', tasks: [
    { id: 'sat-bank', subject: 'Conhecimentos Bancários', track: 'bank', minutes: 60, title: 'Conhecimentos Bancários', detail: 'Sistema financeiro, produtos, serviços, atendimento, ética e conteúdos do edital.' },
    { id: 'sat-admin', subject: 'Administração', track: 'admin', minutes: 60, title: 'Questões de Administração', detail: 'Resolva questões e revise os conceitos que causaram dúvida.' },
    { id: 'sat-writing', subject: 'Simulado e redação', track: 'common', minutes: 30, title: 'Simulado curto ou redação', detail: 'Alterne questões objetivas e treino de texto, conforme as etapas previstas nos editais.' }
  ]}
];

const LEVELS = [
  { min: 0, name: 'Preguiça em movimento', emoji: '🦥', description: 'Comece no seu ritmo e crie uma rotina sustentável.' },
  { min: 500, name: 'Raposa estratégica', emoji: '🦊', description: 'Você está transformando intenção em método e regularidade.' },
  { min: 1500, name: 'Leão persistente', emoji: '🦁', description: 'A consistência e o trabalho acumulado estão ficando visíveis.' },
  { min: 3000, name: 'Vulcão imparável', emoji: '🌋', description: 'Você mantém ritmo, aprende com os resultados e avança com força.' },
  { min: 5000, name: 'Águia de elite', emoji: '🦅', description: 'Uma jornada construída com consistência, estratégia e evolução.' }
];

const VIEW_LABELS = {
  overview: 'Visão geral', schedule: 'Cronograma semanal', subjects: 'Disciplinas',
  careers: 'Progresso por cargo', performance: 'Desempenho', settings: 'Dados e preferências'
};

let state = loadState();
let currentView = 'overview';
let weekOffset = 0;
let subjectFilter = 'all';
let toastTimer = null;

function emptyState() {
  return { version: 1, theme: 'light', completed: {}, topicStatus: {}, sessions: [] };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      ...emptyState(),
      ...parsed,
      completed: parsed.completed && typeof parsed.completed === 'object' ? parsed.completed : {},
      topicStatus: parsed.topicStatus && typeof parsed.topicStatus === 'object' ? parsed.topicStatus : {},
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : []
    };
  } catch (error) {
    console.warn('Não foi possível ler os dados locais.', error);
    return emptyState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    showToast('Não foi possível salvar. Exporte um backup e verifique o armazenamento do navegador.');
    console.error(error);
  }
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function localDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

function addDays(date, amount) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function startOfWeek(date) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - (day === 0 ? 6 : day - 1));
  return copy;
}

function formatDate(date, options = { day: '2-digit', month: 'short' }) {
  return new Intl.DateTimeFormat('pt-BR', options).format(date);
}

function formatMinutes(minutes) {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  if (hours && remainder) return `${hours}h ${remainder}min`;
  if (hours) return `${hours}h`;
  return `${remainder}min`;
}

function allTasksForWeek(weekStart) {
  return BASE_SCHEDULE.flatMap(day => day.tasks.map(task => {
    const date = addDays(weekStart, day.day - 1);
    return { ...task, day: day.day, date, dateKey: localDateKey(date), key: `${localDateKey(date)}::${task.id}`, dayLabel: day.label };
  }));
}

function getWeekRange(offset = 0) {
  return addDays(startOfWeek(new Date()), offset * 7);
}

function sessionsInRange(start, end) {
  const from = localDateKey(start);
  const to = localDateKey(end);
  return state.sessions.filter(item => item.date >= from && item.date <= to);
}

function weekMetrics(weekStart) {
  const weekEnd = addDays(weekStart, 6);
  const sessions = sessionsInRange(weekStart, weekEnd);
  const minutes = sessions.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);
  const questions = sessions.reduce((sum, item) => sum + (Number(item.questions) || 0), 0);
  const correct = sessions.reduce((sum, item) => sum + (Number(item.correct) || 0), 0);
  const tasks = allTasksForWeek(weekStart);
  const completed = tasks.filter(task => state.completed[task.key]).length;
  return { minutes, questions, correct, accuracy: questions ? correct / questions * 100 : null, completed, taskCount: tasks.length, sessions };
}

function topicStatus(id) {
  return state.topicStatus[id] || 'not';
}

function groupProgress(group) {
  const total = group.topics.length;
  const done = group.topics.filter(([id]) => topicStatus(id) === 'done').length;
  const doing = group.topics.filter(([id]) => topicStatus(id) === 'doing').length;
  return { total, done, doing, percent: total ? Math.round(done / total * 100) : 0 };
}

function roleGroups(role) {
  return TOPIC_GROUPS.filter(group => role.groups.includes(group.id));
}

function roleProgress(role) {
  const groups = roleGroups(role);
  const total = groups.reduce((sum, group) => sum + group.topics.length, 0);
  const done = groups.reduce((sum, group) => sum + group.topics.filter(([id]) => topicStatus(id) === 'done').length, 0);
  const doing = groups.reduce((sum, group) => sum + group.topics.filter(([id]) => topicStatus(id) === 'doing').length, 0);
  return { groups, total, done, doing, percent: total ? Math.round(done / total * 100) : 0 };
}

function recordedStudyDates(weekStart, weekEnd) {
  const startKey = localDateKey(weekStart);
  const endKey = localDateKey(weekEnd);
  const dates = new Set();
  state.sessions.forEach(session => {
    if (session.date >= startKey && session.date <= endKey) dates.add(session.date);
  });
  Object.entries(state.completed).forEach(([key, done]) => {
    if (!done) return;
    const dateKey = key.split('::')[0];
    if (dateKey >= startKey && dateKey <= endKey) dates.add(dateKey);
  });
  return dates;
}

function weeklyXP(weekStart, previousAccuracy = null) {
  const metrics = weekMetrics(weekStart);
  const dates = recordedStudyDates(weekStart, addDays(weekStart, 6));
  const hoursRatio = metrics.minutes / 900;
  const timeXP = Math.floor(metrics.minutes / 30) * 5;
  const taskXP = metrics.completed * 5;
  const frequencyXP = dates.size * 10;
  const questionXP = Math.min(15, Math.floor(metrics.questions / 10));
  const goalXP = hoursRatio >= 1 ? 60 : hoursRatio >= 0.8 ? 35 : hoursRatio >= 0.5 ? 15 : 0;
  const currentAccuracy = metrics.questions >= 10 ? metrics.accuracy : null;
  let learningXP = 0;
  if (currentAccuracy !== null && previousAccuracy !== null) {
    const delta = currentAccuracy - previousAccuracy;
    if (delta >= 5) learningXP = 20;
    else if (delta >= 2) learningXP = 10;
  }
  return {
    total: timeXP + taskXP + frequencyXP + questionXP + goalXP + learningXP,
    timeXP, taskXP, frequencyXP, questionXP, goalXP, learningXP,
    minutes: metrics.minutes, completed: metrics.completed, questions: metrics.questions,
    activeDays: dates.size, accuracy: currentAccuracy
  };
}

function allWeeksWithRecords() {
  const starts = new Map();
  const addDate = dateKey => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey || '')) return;
    const weekStart = startOfWeek(parseDateKey(dateKey));
    const key = localDateKey(weekStart);
    starts.set(key, weekStart);
  };
  state.sessions.forEach(session => addDate(session.date));
  Object.keys(state.completed).forEach(taskKey => addDate(taskKey.split('::')[0]));
  const currentStart = startOfWeek(new Date());
  starts.set(localDateKey(currentStart), currentStart);
  return [...starts.values()].sort((a, b) => a - b);
}

function getGamification() {
  const weeks = allWeeksWithRecords();
  let xp = 0;
  let previousAccuracy = null;
  const weekScores = new Map();
  weeks.forEach(weekStart => {
    const result = weeklyXP(weekStart, previousAccuracy);
    xp += result.total;
    weekScores.set(localDateKey(weekStart), result);
    if (result.accuracy !== null) previousAccuracy = result.accuracy;
  });
  const doneTopics = Object.values(state.topicStatus).filter(status => status === 'done').length;
  const doingTopics = Object.values(state.topicStatus).filter(status => status === 'doing').length;
  const topicXP = doneTopics * 20 + doingTopics * 5;
  xp += topicXP;
  const currentStart = startOfWeek(new Date());
  const thisWeek = weekScores.get(localDateKey(currentStart)) || weeklyXP(currentStart);
  let index = 0;
  LEVELS.forEach((level, i) => { if (xp >= level.min) index = i; });
  const current = LEVELS[index];
  const next = LEVELS[index + 1] || null;
  const progress = next ? Math.min(100, Math.max(0, (xp - current.min) / (next.min - current.min) * 100)) : 100;
  return { xp, index, current, next, progress, remaining: next ? Math.max(0, next.min - xp) : 0, thisWeek, topicXP };
}

function currentStudyRhythm() {
  const today = new Date();
  const todayKey = localDateKey(today);
  const weekStart = startOfWeek(today);
  const weekdayNumber = today.getDay() === 0 ? 7 : today.getDay();
  const yesterday = addDays(today, -1);
  const tasks = allTasksForWeek(weekStart).filter(task => task.dateKey < todayKey);
  const expectedMinutes = tasks.reduce((sum, task) => sum + task.minutes, 0);
  const completedTasks = tasks.filter(task => state.completed[task.key]).length;
  const sessions = sessionsInRange(weekStart, yesterday);
  const minutes = sessions.reduce((sum, session) => sum + (Number(session.minutes) || 0), 0);
  const activeDates = recordedStudyDates(weekStart, yesterday);
  const passedPlannedDays = BASE_SCHEDULE.filter(day => day.day < weekdayNumber).length;
  const timePct = expectedMinutes ? Math.min(100, minutes / expectedMinutes * 100) : null;
  const taskPct = tasks.length ? completedTasks / tasks.length * 100 : null;
  const frequencyPct = passedPlannedDays ? Math.min(100, activeDates.size / passedPlannedDays * 100) : null;
  const components = [
    { value: timePct, weight: 0.45 },
    { value: taskPct, weight: 0.35 },
    { value: frequencyPct, weight: 0.20 }
  ].filter(item => item.value !== null);
  const totalWeight = components.reduce((sum, item) => sum + item.weight, 0);
  const score = components.length ? components.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight : null;
  const currentWeekDates = recordedStudyDates(weekStart, addDays(weekStart, 6));
  return {
    score: score === null ? null : Math.round(score),
    activeDays: Math.min(6, currentWeekDates.size),
    frequencyPct: Math.round(Math.min(100, currentWeekDates.size / 6 * 100)),
    passedPlannedDays, expectedMinutes, minutes, completedTasks, taskCount: tasks.length,
    timePct, taskPct
  };
}

function currentLevel() {
  const game = getGamification();
  return game;
}

function setTheme(theme) {
  state.theme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = state.theme;
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) themeIcon.textContent = state.theme === 'dark' ? '☀' : '☾';
  document.querySelectorAll('[data-set-theme]').forEach(button => {
    button.classList.toggle('selected', button.dataset.setTheme === state.theme);
  });
  saveState();
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function navigate(view) {
  if (!VIEW_LABELS[view]) return;
  currentView = view;
  document.querySelectorAll('.view').forEach(section => section.classList.toggle('active', section.id === `view-${view}`));
  document.querySelectorAll('.nav-item[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  document.getElementById('breadcrumbCurrent').textContent = VIEW_LABELS[view];
  document.getElementById('sidebar').classList.remove('open');
  if (view === 'overview') renderOverview();
  if (view === 'schedule') renderSchedule();
  if (view === 'subjects') renderSubjects();
  if (view === 'careers') renderCareers();
  if (view === 'performance') renderPerformance();
  if (view === 'settings') renderSettings();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderChart(container, weeks, emptyMessage = 'Registre sessões com questões para começar sua curva.') {
  const points = weeks.map((week, index) => ({ ...week, index })).filter(week => week.accuracy !== null);
  if (!points.length) {
    container.innerHTML = `<div class="chart-empty"><div class="empty-mark">⌁</div><strong>Sua curva começa aqui.</strong><span>${escapeHTML(emptyMessage)}</span></div>`;
    return { average: null, count: 0 };
  }
  const width = 700, height = 205, left = 43, right = 15, top = 13, bottom = 35;
  const plotW = width - left - right, plotH = height - top - bottom;
  const y = value => top + (100 - value) / 100 * plotH;
  const x = index => left + index * (plotW / Math.max(1, weeks.length - 1));
  let grid = '';
  [0, 25, 50, 75, 100].forEach(value => {
    const yy = y(value);
    grid += `<line x1="${left}" y1="${yy}" x2="${width-right}" y2="${yy}" stroke="var(--border)" stroke-dasharray="3 5"/><text x="${left-10}" y="${yy+3}" text-anchor="end" font-size="9" fill="var(--muted-2)">${value}</text>`;
  });
  let labels = '';
  weeks.forEach((week, index) => {
    const xx = x(index);
    labels += `<text x="${xx}" y="${height-9}" text-anchor="middle" font-size="9" fill="var(--muted-2)">${escapeHTML(week.label)}</text>`;
  });
  const linePoints = points.map(point => `${x(point.index)},${y(point.accuracy)}`).join(' ');
  const fillPath = points.length > 1 ? `M ${x(points[0].index)} ${y(points[0].accuracy)} L ${points.map(point => `${x(point.index)} ${y(point.accuracy)}`).join(' L ')} L ${x(points[points.length-1].index)} ${top+plotH} L ${x(points[0].index)} ${top+plotH} Z` : '';
  const dots = points.map(point => {
    const xx = x(point.index), yy = y(point.accuracy);
    return `<circle cx="${xx}" cy="${yy}" r="4.5" fill="var(--sage)" stroke="var(--surface)" stroke-width="2"><title>${escapeHTML(point.label)}: ${Math.round(point.accuracy)}%</title></circle>`;
  }).join('');
  const avg = points.reduce((sum, point) => sum + point.accuracy, 0) / points.length;
  container.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Evolução da taxa de acertos nas últimas oito semanas">${grid}${fillPath ? `<path d="${fillPath}" fill="var(--sage)" opacity=".10"/>` : ''}${points.length > 1 ? `<polyline points="${linePoints}" fill="none" stroke="var(--sage)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>` : ''}${dots}${labels}</svg>`;
  return { average: avg, count: points.length };
}

function lastEightWeeks() {
  const currentMonday = startOfWeek(new Date());
  return Array.from({ length: 8 }, (_, i) => {
    const start = addDays(currentMonday, (i - 7) * 7);
    const metrics = weekMetrics(start);
    return { start, label: formatDate(start, { day: '2-digit', month: '2-digit' }), accuracy: metrics.accuracy };
  });
}

function renderOverview() {
  const metrics = weekMetrics(startOfWeek(new Date()));
  const hours = metrics.minutes / 60;
  const hourPct = Math.min(100, hours / 15 * 100);
  const taskPct = metrics.taskCount ? metrics.completed / metrics.taskCount * 100 : 0;
  document.getElementById('hoursValue').textContent = hours === 0 ? '0h' : `${Number(hours.toFixed(1)).toLocaleString('pt-BR')}h`;
  document.getElementById('hoursContext').textContent = 'de 15h planejadas';
  document.getElementById('hoursProgress').style.width = `${hourPct}%`;
  document.getElementById('hoursPercent').textContent = `${Math.round(hourPct)}% da meta semanal`;
  document.getElementById('hoursRemaining').textContent = `${Math.max(0, 15 - hours).toFixed(1).replace('.', ',')}h restantes`;
  document.getElementById('tasksValue').textContent = `${metrics.completed}/${metrics.taskCount}`;
  document.getElementById('tasksProgress').style.width = `${taskPct}%`;
  document.getElementById('tasksPercent').textContent = `${Math.round(taskPct)}% da agenda`;
  document.getElementById('questionsValue').textContent = metrics.questions.toLocaleString('pt-BR');
  document.getElementById('correctValue').textContent = metrics.questions ? `${metrics.correct} acertos` : 'Sem registros ainda';
  document.getElementById('accuracyValue').textContent = metrics.accuracy === null ? '—' : `${Math.round(metrics.accuracy)}%`;
  document.getElementById('accuracyContext').textContent = metrics.accuracy === null ? 'Registre questões para medir' : `${metrics.correct} de ${metrics.questions} questões`;

  const chartInfo = renderChart(document.getElementById('learningChart'), lastEightWeeks());
  document.getElementById('chartAverage').textContent = chartInfo.average === null ? '—' : `${Math.round(chartInfo.average)}%`;

  const level = currentLevel();
  const rhythm = currentStudyRhythm();
  document.getElementById('levelEmoji').textContent = level.current.emoji;
  document.getElementById('levelName').textContent = level.current.name;
  document.getElementById('levelDescription').textContent = level.current.description;
  document.getElementById('xpValue').textContent = `${level.xp.toLocaleString('pt-BR')} XP`;
  document.getElementById('nextLevelText').textContent = level.next ? `${level.remaining.toLocaleString('pt-BR')} XP para o próximo nível` : 'Nível máximo alcançado';
  document.getElementById('xpProgress').style.width = `${level.progress}%`;
  document.getElementById('levelNext').textContent = level.next ? `Próximo nível: ${level.next.name} ${level.next.emoji}` : 'Você chegou ao topo da jornada.';
  document.querySelectorAll('[data-level-step]').forEach((step, index) => {
    step.classList.toggle('reached', index < level.index);
    step.classList.toggle('active', index === level.index);
  });

  const paceValue = document.getElementById('paceValue');
  const paceProgress = document.getElementById('paceProgress');
  const paceHint = document.getElementById('paceHint');
  paceValue.textContent = rhythm.score === null ? '—' : `${rhythm.score}%`;
  paceProgress.style.width = `${rhythm.score ?? 0}%`;
  if (rhythm.score === null) {
    paceHint.textContent = 'A comparação começa após o primeiro dia planejado.';
  } else if (rhythm.score >= 90) {
    paceHint.textContent = 'No ritmo esperado ou acima dele. Continue com qualidade.';
  } else if (rhythm.score >= 70) {
    paceHint.textContent = 'Bom ritmo. Ajustes pequenos podem aproximar você da meta.';
  } else {
    paceHint.textContent = 'Há diferença para o plano. Veja qual parte ficou para trás e retome sem tentar compensar tudo de uma vez.';
  }
  document.getElementById('frequencyValue').textContent = `${rhythm.activeDays}/6 dias`;
  document.getElementById('frequencyProgress').style.width = `${rhythm.frequencyPct}%`;
  document.getElementById('frequencyHint').textContent = 'Conta um dia com sessão registrada ou tarefa concluída. Referência: 6 dias planejados na semana.';
  document.getElementById('weeklyXpValue').textContent = `+${level.thisWeek.total.toLocaleString('pt-BR')} XP`;
  const bonusBits = [];
  if (level.thisWeek.goalXP) bonusBits.push(`meta de horas: +${level.thisWeek.goalXP}`);
  if (level.thisWeek.learningXP) bonusBits.push(`evolução nos acertos: +${level.thisWeek.learningXP}`);
  document.getElementById('weeklyXpHint').textContent = bonusBits.length ? `Bônus incluídos — ${bonusBits.join(' · ')} XP.` : 'XP por tempo, atividades e frequência; bônus de meta quando o ritmo semanal avançar.';

  const today = new Date();
  const dayNumber = today.getDay() === 0 ? 7 : today.getDay();
  const dayPlan = BASE_SCHEDULE.find(day => day.day === dayNumber);
  document.getElementById('todayPlanTitle').textContent = dayNumber === 7 ? 'Domingo de descanso' : `Plano de ${dayPlan.label.toLocaleLowerCase('pt-BR')}`;
  document.getElementById('todayPlanSubtitle').textContent = formatDate(today, { weekday: 'long', day: '2-digit', month: 'long' });
  const todayContainer = document.getElementById('todayTasks');
  if (!dayPlan) {
    todayContainer.innerHTML = '<div class="empty-day">Hoje é dia de descanso. Recuperar as energias também faz parte do plano.</div>';
  } else {
    const dateKey = localDateKey(today);
    todayContainer.innerHTML = dayPlan.tasks.map(task => {
      const key = `${dateKey}::${task.id}`;
      const done = !!state.completed[key];
      return `<div class="today-task ${done ? 'is-done' : ''}"><button class="task-check ${done ? 'checked' : ''}" data-complete="${escapeHTML(key)}" aria-label="${done ? 'Reabrir' : 'Concluir'} ${escapeHTML(task.title)}">${done ? '✓' : ''}</button><div class="today-task-copy"><strong>${escapeHTML(task.title)}</strong><span>${escapeHTML(task.subject)}</span></div><span class="task-minutes">${formatMinutes(task.minutes)}</span></div>`;
    }).join('');
  }
  document.getElementById('careerSnapshot').innerHTML = ROLE_TRACKS.map(role => {
    const progress = roleProgress(role);
    return `<div><div class="career-mini-top"><strong>${escapeHTML(role.subtitle.replace('Cargo: ', ''))}</strong><span>${progress.percent}%</span></div><div class="career-mini-track"><i style="width:${progress.percent}%"></i></div></div>`;
  }).join('');
}

function renderSchedule() {
  const weekStart = getWeekRange(weekOffset);
  const weekEnd = addDays(weekStart, 6);
  const metrics = weekMetrics(weekStart);
  const isCurrent = weekOffset === 0;
  document.getElementById('weekTitle').textContent = isCurrent ? 'Semana atual' : `${formatDate(weekStart, { day: '2-digit', month: 'short' })} – ${formatDate(weekEnd, { day: '2-digit', month: 'short', year: 'numeric' })}`;
  document.getElementById('weekSubTitle').textContent = '15 horas planejadas · segunda a sábado';
  document.getElementById('weekDoneCount').textContent = `${metrics.completed} de ${metrics.taskCount} atividades`;
  const pct = metrics.taskCount ? metrics.completed / metrics.taskCount * 100 : 0;
  document.getElementById('weekProgressFill').style.width = `${pct}%`;
  document.getElementById('weekProgressText').textContent = `${Math.round(pct)}%`;

  const todayKey = localDateKey(new Date());
  const container = document.getElementById('weeklySchedule');
  container.innerHTML = BASE_SCHEDULE.map(day => {
    const date = addDays(weekStart, day.day - 1);
    const dateKey = localDateKey(date);
    const isToday = dateKey === todayKey;
    const dayMinutes = day.tasks.reduce((sum, task) => sum + task.minutes, 0);
    const doneCount = day.tasks.filter(task => state.completed[`${dateKey}::${task.id}`]).length;
    const tasksMarkup = day.tasks.map(task => {
      const key = `${dateKey}::${task.id}`;
      const done = !!state.completed[key];
      return `<div class="schedule-task ${done ? 'is-done' : ''}">
        <button class="task-check ${done ? 'checked' : ''}" data-complete="${escapeHTML(key)}" aria-label="${done ? 'Reabrir' : 'Concluir'} ${escapeHTML(task.title)}">${done ? '✓' : ''}</button>
        <div class="schedule-task-content"><div class="schedule-task-title">${escapeHTML(task.title)}</div><div class="schedule-task-description">${escapeHTML(task.detail)}</div><div class="schedule-task-meta">${escapeHTML(task.subject)} · ${formatMinutes(task.minutes)}</div></div>
        <div class="schedule-task-actions"><button class="mini-action" data-record="${escapeHTML(key)}" title="Registrar esta sessão">Registrar</button></div>
      </div>`;
    }).join('');
    return `<article class="day-card ${isToday && isCurrent ? 'today' : ''}"><div class="day-card-header"><div class="day-name-wrap"><div class="day-date-badge">${String(date.getDate()).padStart(2,'0')}</div><div><div class="day-name">${day.label}</div><div class="day-date">${formatDate(date, { month: 'long', year: 'numeric' })}${isToday && isCurrent ? ' · Hoje' : ''}</div></div></div><span class="day-load">${doneCount}/${day.tasks.length} · ${formatMinutes(dayMinutes)}</span></div><div class="day-tasks">${tasksMarkup}</div></article>`;
  }).join('') + `<article class="day-card day-rest"><div class="day-card-header"><div class="day-name-wrap"><div class="day-date-badge">${String(addDays(weekStart,6).getDate()).padStart(2,'0')}</div><div><div class="day-name">Domingo</div><div class="day-date">${formatDate(addDays(weekStart,6), { month: 'long', year: 'numeric' })}</div></div></div><span class="day-load">Descanso</span></div><div class="day-tasks"><div class="empty-day">Recupere as energias, organize a próxima semana e, se desejar, faça uma revisão leve. Não há tarefas obrigatórias neste dia.</div></div></article>`;
}

function statusLabel(status) {
  if (status === 'doing') return 'Em andamento';
  if (status === 'done') return 'Concluído';
  return 'Não iniciado';
}

function nextStatus(status) {
  return status === 'not' ? 'doing' : status === 'doing' ? 'done' : 'not';
}

function renderSubjects() {
  const filtered = TOPIC_GROUPS.filter(group => subjectFilter === 'all' || group.filter === subjectFilter || (['admin', 'it'].includes(subjectFilter) && group.id === 'legislacao'));
  const total = TOPIC_GROUPS.reduce((sum, group) => sum + group.topics.length, 0);
  const done = TOPIC_GROUPS.reduce((sum, group) => sum + group.topics.filter(([id]) => topicStatus(id) === 'done').length, 0);
  document.getElementById('subjectOverall').textContent = `${Math.round(done / total * 100)}% do conteúdo concluído`;
  document.getElementById('subjectsContainer').innerHTML = filtered.map(group => {
    const progress = groupProgress(group);
    const rows = group.topics.map(([id, label]) => {
      const status = topicStatus(id);
      return `<div class="topic-row"><span>${escapeHTML(label)}</span><button class="topic-status-button status-${status}" data-topic="${id}" title="Clique para alterar o status"><i class="status-dot status-${status}"></i>${statusLabel(status)}</button></div>`;
    }).join('');
    return `<article class="subject-card"><div class="subject-card-header"><div class="subject-title">${escapeHTML(group.name)}</div><span class="subject-tag">${escapeHTML(group.tag)}</span></div><div class="subject-progress-line"><div class="progress-track"><div class="progress-fill progress-sage" style="width:${progress.percent}%"></div></div><span>${progress.percent}%</span></div><div class="topic-list">${rows}</div></article>`;
  }).join('');
}

function renderCareers() {
  document.getElementById('careersContainer').innerHTML = ROLE_TRACKS.map(role => {
    const progress = roleProgress(role);
    const groupRows = progress.groups.map(group => {
      const p = groupProgress(group);
      return `<div class="career-subject-item"><div class="career-subject-head"><span>${escapeHTML(group.name)}</span><span>${p.done}/${p.total} concluídos</span></div><div class="career-subject-track"><i style="width:${p.percent}%"></i></div></div>`;
    }).join('');
    return `<article class="panel career-card"><div class="career-card-header"><div class="career-symbol">${role.symbol}</div><div class="career-card-title"><h2>${escapeHTML(role.title)}</h2><p>${escapeHTML(role.subtitle)}</p></div><div class="career-percent">${progress.percent}%</div></div><div class="career-main-progress"><div class="progress-track"><div class="progress-fill progress-sage" style="width:${progress.percent}%"></div></div><div class="career-progress-label"><span>${progress.done} de ${progress.total} tópicos concluídos</span><span>${progress.doing} em andamento</span></div></div><p class="career-shared-note">${escapeHTML(role.description)}</p><div class="career-subject-list">${groupRows}</div></article>`;
  }).join('');
}

function getAllTimeMetrics() {
  const minutes = state.sessions.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);
  const questions = state.sessions.reduce((sum, item) => sum + (Number(item.questions) || 0), 0);
  const correct = state.sessions.reduce((sum, item) => sum + (Number(item.correct) || 0), 0);
  return { minutes, questions, correct, accuracy: questions ? correct / questions * 100 : null };
}

function renderPerformance() {
  const all = getAllTimeMetrics();
  const kpis = [
    ['TEMPO TOTAL', formatMinutes(all.minutes)],
    ['QUESTÕES RESOLVIDAS', all.questions.toLocaleString('pt-BR')],
    ['TAXA GERAL DE ACERTOS', all.accuracy === null ? '—' : `${Math.round(all.accuracy)}%`],
    ['ATIVIDADES CONCLUÍDAS', `${Object.values(state.completed).filter(Boolean).length}`]
  ];
  document.getElementById('performanceKpis').innerHTML = kpis.map(([label, value]) => `<div class="performance-kpi"><span>${label}</span><strong>${value}</strong></div>`).join('');
  renderChart(document.getElementById('performanceChart'), lastEightWeeks());
  const sessions = [...state.sessions].sort((a,b) => `${b.date}${b.id}`.localeCompare(`${a.date}${a.id}`));
  document.getElementById('sessionCount').textContent = `${sessions.length} ${sessions.length === 1 ? 'registro' : 'registros'}`;
  const table = document.getElementById('sessionsTable');
  if (!sessions.length) {
    table.innerHTML = '<div class="table-empty">Nenhuma sessão registrada ainda. Use “Nova sessão” para começar seu histórico de estudos.</div>';
  } else {
    table.innerHTML = `<div class="table-wrap"><table><thead><tr><th>DATA</th><th>DISCIPLINA</th><th>TRILHA</th><th>TEMPO</th><th>QUESTÕES</th><th>ACERTOS</th><th></th></tr></thead><tbody>${sessions.slice(0,30).map(session => {
      const accuracy = session.questions ? `${Math.round(session.correct / session.questions * 100)}%` : '—';
      const track = ({common:'Base comum',admin:'Administrativo',it:'TI',bank:'Bancária'})[session.track] || 'Base comum';
      return `<tr><td>${formatDate(parseDateKey(session.date), { day:'2-digit', month:'2-digit', year:'numeric' })}</td><td><strong>${escapeHTML(session.subject)}</strong>${session.note ? `<div class="table-secondary">${escapeHTML(session.note)}</div>` : ''}</td><td class="table-secondary">${track}</td><td>${formatMinutes(session.minutes)}</td><td>${Number(session.questions)||0}</td><td><span class="accuracy-pill">${accuracy}</span></td><td><button class="delete-session" data-delete-session="${escapeHTML(session.id)}" aria-label="Excluir registro">×</button></td></tr>`;
    }).join('')}</tbody></table></div>${sessions.length > 30 ? `<div class="small-muted" style="margin-top:9px">Exibindo os 30 registros mais recentes de ${sessions.length}.</div>` : ''}`;
  }
  const bySubject = {};
  state.sessions.forEach(item => {
    if (!item.questions) return;
    if (!bySubject[item.subject]) bySubject[item.subject] = { questions: 0, correct: 0 };
    bySubject[item.subject].questions += Number(item.questions) || 0;
    bySubject[item.subject].correct += Number(item.correct) || 0;
  });
  const entries = Object.entries(bySubject).sort((a,b) => (b[1].questions - a[1].questions));
  document.getElementById('subjectAccuracy').innerHTML = entries.length ? `<div class="subject-accuracy-list">${entries.map(([subject, item]) => {
    const accuracy = item.questions ? item.correct / item.questions * 100 : 0;
    return `<div class="accuracy-row"><div class="accuracy-row-label">${escapeHTML(subject)}</div><div class="accuracy-row-track"><i style="width:${accuracy}%"></i></div><div class="accuracy-row-value">${Math.round(accuracy)}% · ${item.questions}</div></div>`;
  }).join('')}</div>` : '<div class="table-empty">Quando houver questões registradas, o desempenho por disciplina aparecerá aqui.</div>';
}

function renderSettings() {
  document.querySelectorAll('[data-set-theme]').forEach(button => button.classList.toggle('selected', button.dataset.setTheme === state.theme));
}

function renderAll() {
  renderOverview();
  renderSchedule();
  renderSubjects();
  renderCareers();
  renderPerformance();
  renderSettings();
}

function subjectOptions(selected = 'Português') {
  return SUBJECTS.map(subject => `<option value="${escapeHTML(subject)}" ${subject === selected ? 'selected' : ''}>${escapeHTML(subject)}</option>`).join('');
}

function openSessionModal(options = {}) {
  const modal = document.getElementById('sessionModal');
  const date = options.date || localDateKey(new Date());
  const subject = options.subject || 'Português';
  document.getElementById('sessionTaskKey').value = options.taskKey || '';
  document.getElementById('sessionDate').value = date;
  document.getElementById('sessionSubject').innerHTML = subjectOptions(subject);
  document.getElementById('sessionTrack').value = options.track || 'common';
  document.getElementById('sessionMinutes').value = options.minutes || 60;
  document.getElementById('sessionQuestions').value = 0;
  document.getElementById('sessionCorrect').value = 0;
  document.getElementById('sessionNote').value = options.note || '';
  document.getElementById('formError').textContent = '';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  setTimeout(() => document.getElementById('sessionSubject').focus(), 50);
}

function closeSessionModal() {
  const modal = document.getElementById('sessionModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

function recordFromTask(key) {
  const [dateKey, taskId] = key.split('::');
  const day = BASE_SCHEDULE.find(item => item.tasks.some(task => task.id === taskId));
  const task = day?.tasks.find(item => item.id === taskId);
  if (!task) return;
  openSessionModal({ taskKey: key, date: dateKey, subject: task.subject, track: task.track, minutes: task.minutes, note: task.title });
}

function completeTask(key) {
  if (state.completed[key]) {
    delete state.completed[key];
    showToast('Atividade reaberta.');
  } else {
    state.completed[key] = true;
    showToast('Atividade concluída. XP recalculado pelo seu progresso.');
  }
  saveState();
  renderAll();
}

function deleteSession(id) {
  const session = state.sessions.find(item => item.id === id);
  if (!session) return;
  if (!window.confirm('Excluir este registro de estudo?')) return;
  state.sessions = state.sessions.filter(item => item.id !== id);
  saveState();
  renderAll();
  showToast('Registro excluído.');
}

function exportBackup() {
  const payload = { ...state, exportedAt: new Date().toISOString(), app: 'StudyMaximizer — Preparação para Concursos' };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `studymaximizer-backup-${localDateKey(new Date())}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('Backup exportado. Guarde o arquivo em local seguro.');
}

async function importBackup(file) {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (!parsed || typeof parsed !== 'object' || !parsed.sessions || !parsed.completed || !parsed.topicStatus) {
      throw new Error('Estrutura de backup inválida.');
    }
    const okay = window.confirm('Importar este backup substituirá os dados atualmente salvos neste navegador. Deseja continuar?');
    if (!okay) return;
    state = {
      ...emptyState(),
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      completed: parsed.completed,
      topicStatus: parsed.topicStatus,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : []
    };
    saveState();
    setTheme(state.theme);
    renderAll();
    showToast('Backup importado com sucesso.');
  } catch (error) {
    console.error(error);
    showToast('Não foi possível importar. Verifique se o arquivo é um backup válido.');
  }
}

function clearAllData() {
  const okay = window.confirm('Tem certeza? Todos os registros, tópicos concluídos, tarefas e XP deste navegador serão apagados. Faça um backup antes, se necessário.');
  if (!okay) return;
  const theme = state.theme;
  state = emptyState();
  state.theme = theme;
  saveState();
  renderAll();
  showToast('Dados locais apagados.');
}

function bindEvents() {
  document.querySelectorAll('.nav-item[data-view]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.view)));
  document.querySelectorAll('[data-navigate]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.navigate)));
  document.getElementById('themeToggle').addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));
  document.getElementById('mobileMenu').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
  document.getElementById('prevWeek').addEventListener('click', () => { weekOffset -= 1; renderSchedule(); });
  document.getElementById('nextWeek').addEventListener('click', () => { weekOffset += 1; renderSchedule(); });
  document.getElementById('currentWeek').addEventListener('click', () => { weekOffset = 0; renderSchedule(); });
  document.getElementById('subjectFilters').addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    subjectFilter = button.dataset.filter;
    document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.toggle('active', tab === button));
    renderSubjects();
  });
  document.addEventListener('click', event => {
    const complete = event.target.closest('[data-complete]');
    if (complete) { completeTask(complete.dataset.complete); return; }
    const record = event.target.closest('[data-record]');
    if (record) { recordFromTask(record.dataset.record); return; }
    const topic = event.target.closest('[data-topic]');
    if (topic) {
      const id = topic.dataset.topic;
      state.topicStatus[id] = nextStatus(topicStatus(id));
      saveState();
      renderSubjects();
      renderCareers();
      renderOverview();
      showToast(`Tópico atualizado: ${statusLabel(state.topicStatus[id]).toLowerCase()}.`);
      return;
    }
    const del = event.target.closest('[data-delete-session]');
    if (del) deleteSession(del.dataset.deleteSession);
  });

  const openQuick = () => openSessionModal();
  document.getElementById('quickLog').addEventListener('click', openQuick);
  document.getElementById('scheduleLog').addEventListener('click', openQuick);
  document.getElementById('performanceLog').addEventListener('click', openQuick);
  document.getElementById('closeModal').addEventListener('click', closeSessionModal);
  document.getElementById('cancelModal').addEventListener('click', closeSessionModal);
  document.getElementById('sessionModal').addEventListener('click', event => { if (event.target.id === 'sessionModal') closeSessionModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeSessionModal(); });

  document.getElementById('sessionForm').addEventListener('submit', event => {
    event.preventDefault();
    const date = document.getElementById('sessionDate').value;
    const subject = document.getElementById('sessionSubject').value;
    const track = document.getElementById('sessionTrack').value;
    const minutes = Number(document.getElementById('sessionMinutes').value);
    const questions = Number(document.getElementById('sessionQuestions').value || 0);
    const correct = Number(document.getElementById('sessionCorrect').value || 0);
    const note = document.getElementById('sessionNote').value.trim();
    const error = document.getElementById('formError');
    if (!date || !subject || !Number.isFinite(minutes) || minutes < 1 || minutes > 1440) {
      error.textContent = 'Informe uma data, disciplina e duração válida (entre 1 e 1.440 minutos).'; return;
    }
    if (!Number.isInteger(questions) || !Number.isInteger(correct) || questions < 0 || correct < 0 || correct > questions) {
      error.textContent = 'Confira as questões: os acertos devem ser um número entre zero e o total resolvido.'; return;
    }
    const id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    state.sessions.push({ id, date, subject, track, minutes, questions, correct, note });
    const taskKey = document.getElementById('sessionTaskKey').value;
    if (taskKey) state.completed[taskKey] = true;
    saveState();
    closeSessionModal();
    renderAll();
    showToast(taskKey ? 'Sessão registrada e atividade concluída. XP recalculado.' : 'Sessão registrada com sucesso.');
  });

  document.querySelectorAll('[data-set-theme]').forEach(button => button.addEventListener('click', () => setTheme(button.dataset.setTheme)));
  document.getElementById('exportData').addEventListener('click', exportBackup);
  document.getElementById('importData').addEventListener('change', event => {
    importBackup(event.target.files?.[0]);
    event.target.value = '';
  });
  document.getElementById('clearData').addEventListener('click', clearAllData);
}

function init() {
  document.getElementById('todayLabel').textContent = formatDate(new Date(), { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  setTheme(state.theme);
  bindEvents();
  renderAll();
}

init();
