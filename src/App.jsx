import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowDownToLine, ArrowLeft, ArrowRight, Award, BarChart3, BookOpen,
  BookOpenText, Building2, CalendarCheck, CalendarDays, Check, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Circle, CircleAlert,
  CircleHelp, Clock3, Code2, Compass, Download, ExternalLink, FileDown, FileText,
  Flame, Gauge, GraduationCap, Landmark, Languages, LayoutDashboard, Leaf,
  ListChecks, ListTodo, LockKeyhole, Menu, Moon, NotebookPen, PenLine, Plus,
  RefreshCw, Search, Settings2, ShieldCheck, SlidersHorizontal, Sprout, Sun,
  Target, Timer, TrendingUp, Trophy, Upload, Workflow, X, Zap, Banknote,
  Calculator, ClipboardList, Database, Scale, Bird, CheckCheck, Filter, Mail,
} from 'lucide-react';
import { SUBJECTS, TRACKS, SOURCES, flattenSubject, slug } from './data/syllabus.js';
import { WEEK_PLAN, PLANNED_HOURS_PER_WEEK, PLANNED_STUDY_DAYS } from './data/schedule.js';
import { supabase, supabaseConfigured, CLOUD_TABLE } from './lib/supabase.js';
import { detectInitialLocale, LANGUAGE_STORAGE_KEY, SUPPORTED_LOCALES, translate, translateAuthError, setActiveLocale, getActiveLocale } from './i18n.js';

const STORAGE_KEY = 'studymaximizer-react-v2';
const CLOUD_MIGRATION_OWNER_KEY = 'studymaximizer-cloud-migration-owner-v1';
const THEME_PREFERENCE_KEY = 'studymaximizer-theme-preference-v1';
const userCacheKey = userId => `${STORAGE_KEY}:user:${userId}`;
const LEVELS = [
  { name: 'Despertar', threshold: 0, subtitle: 'O primeiro passo já conta.', Icon: Sprout },
  { name: 'Explorador', threshold: 500, subtitle: 'Você está construindo seu método.', Icon: Compass },
  { name: 'Leão persistente', threshold: 1500, subtitle: 'Consistência que gera resultado.', Icon: ShieldCheck },
  { name: 'Vulcão imparável', threshold: 3000, subtitle: 'Seu ritmo está virando força.', Icon: Flame },
  { name: 'Águia de elite', threshold: 5000, subtitle: 'Visão, domínio e execução.', Icon: Bird },
];

const ICONS = {
  LayoutDashboard, CalendarDays, BookOpenText, Building2, BarChart3, Settings2,
  BookOpen, Calculator, Scale, ClipboardList, Code2, Landmark, Languages,
  PenLine, Database, Banknote, ShieldCheck, Sprout, Compass, Bird, Flame,
  GraduationCap, Timer, Target, CheckCircle2, TrendingUp, Clock3, ListChecks,
};
function Icon({ name, size = 18, strokeWidth = 1.8, ...props }) {
  const Component = ICONS[name] || Circle;
  return <Component size={size} strokeWidth={strokeWidth} aria-hidden="true" {...props} />;
}

const emptyState = {
  version: 3,
  theme: 'system',
  completedTasks: {},
  topicDone: {},
  topicStatus: {},
  sessions: [],
  targetHours: PLANNED_HOURS_PER_WEEK,
};

function getInitialThemePreference() {
  try {
    const storedPreference = localStorage.getItem(THEME_PREFERENCE_KEY);
    if (['light', 'dark', 'system'].includes(storedPreference)) return storedPreference;
    // Older versions stored the default light theme without distinguishing it from a user choice.
    // Preserve an explicit-looking dark choice, but make the old default follow the device theme.
    const oldRaw = localStorage.getItem(STORAGE_KEY)
      || localStorage.getItem('studymaximizer-data-v1')
      || localStorage.getItem('trilha-concursos-data-v1');
    if (oldRaw && JSON.parse(oldRaw)?.theme === 'dark') return 'dark';
  } catch { /* use browser preference when storage is unavailable */ }
  return 'system';
}

function getSystemThemeIsDark() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

function normalizeAppState(value) {
  const input = value && typeof value === 'object' ? value : {};
  return {
    ...emptyState,
    ...input,
    version: 3,
    theme: input.version && input.version < 3 ? (input.theme === 'dark' ? 'dark' : getInitialThemePreference()) : (['light', 'dark', 'system'].includes(input.theme) ? input.theme : 'system'),
    completedTasks: input.completedTasks && typeof input.completedTasks === 'object' ? input.completedTasks : {},
    topicDone: input.topicDone && typeof input.topicDone === 'object' ? input.topicDone : {},
    topicStatus: input.topicStatus && typeof input.topicStatus === 'object' ? input.topicStatus : {},
    sessions: Array.isArray(input.sessions) ? input.sessions : [],
    targetHours: Math.max(1, Math.min(60, Number(input.targetHours) || PLANNED_HOURS_PER_WEEK)),
  };
}

function mergeAppStates(localState, remoteState) {
  const local = normalizeAppState(localState);
  const remote = normalizeAppState(remoteState);
  const sessionsById = new Map();
  [...local.sessions, ...remote.sessions].forEach((session, index) => {
    const id = session.id || `${session.date || 'session'}-${index}`;
    sessionsById.set(id, { ...sessionsById.get(id), ...session, id });
  });
  const sessions = [...sessionsById.values()].sort((a, b) =>
    String(a.date || '').localeCompare(String(b.date || '')) || String(a.id).localeCompare(String(b.id))
  );
  return {
    ...local,
    ...remote,
    completedTasks: { ...local.completedTasks, ...remote.completedTasks },
    topicDone: { ...local.topicDone, ...remote.topicDone },
    topicStatus: { ...local.topicStatus, ...remote.topicStatus },
    sessions,
  };
}

function readUserCache(userId) {
  try {
    const raw = localStorage.getItem(userCacheKey(userId));
    return raw ? normalizeAppState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

const oldSubjectMap = {
  'Português': 'portugues',
  'Raciocínio Lógico e Matemática': 'matematica-logica',
  'Legislação e Administração Pública': 'legislacao',
  'Administração': 'administracao',
  'Matemática Financeira e Estatística': 'mat-fin-estatistica',
  'Inglês': 'ingles',
  'Tecnologia da Informação': 'ti',
  'Conhecimentos Bancários': 'bancarios',
  'Simulado e redação': 'redacao',
};
function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
      || localStorage.getItem('studymaximizer-data-v1')
      || localStorage.getItem('trilha-concursos-data-v1');
    if (!raw) return { ...emptyState, theme: getInitialThemePreference() };
    const parsed = JSON.parse(raw);
    if (parsed.version >= 2 && parsed.sessions && parsed.completedTasks) {
      return { ...emptyState, ...parsed, version: 3, theme: getInitialThemePreference(), topicDone: parsed.topicDone && typeof parsed.topicDone === 'object' ? parsed.topicDone : {}, topicStatus: parsed.topicStatus && typeof parsed.topicStatus === 'object' ? parsed.topicStatus : {}, sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [] };
    }
    const oldSessions = Array.isArray(parsed.sessions) ? parsed.sessions.map((s, index) => ({
      id: s.id || `migrated-${index}-${s.date || 'session'}`,
      date: s.date || dateKey(new Date()),
      subjectId: s.subjectId || oldSubjectMap[s.subject] || 'portugues',
      track: ({ common: 'all', admin: 'admin', it: 'tae-ti', bank: 'bnb' })[s.track] || s.track || 'all',
      minutes: Number(s.minutes) || 0,
      questions: Number(s.questions) || 0,
      correct: Number(s.correct) || 0,
      note: s.note || '',
      migrated: true,
    })) : [];
    return {
      ...emptyState,
      theme: getInitialThemePreference(),
      sessions: oldSessions,
      legacyArchive: { completed: parsed.completed || {}, topicStatus: parsed.topicStatus || {} },
      topicDone: {},
      topicStatus: {},
      completedTasks: {},
    };
  } catch (error) {
    console.warn('Não foi possível ler o progresso salvo.', error);
    return emptyState;
  }
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function parseDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}
function startOfWeek(date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}
function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}
function daysOfWeek(weekStart) {
  return Array.from({ length: PLANNED_STUDY_DAYS }, (_, index) => addDays(weekStart, index));
}
function intlLocale() {
  return getActiveLocale() === 'en' ? 'en-US' : 'pt-BR';
}
function formatDate(value, options = { day: '2-digit', month: 'short' }) {
  return new Intl.DateTimeFormat(intlLocale(), options).format(value);
}
function formatLongDate(value) {
  return new Intl.DateTimeFormat(intlLocale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(value);
}
function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours}h ${String(rest).padStart(2, '0')}min` : `${hours}h`;
}
function formatWeekRange(start) {
  const end = addDays(start, 5);
  return `${formatDate(start, { day: '2-digit', month: 'long' })} – ${formatDate(end, { day: '2-digit', month: 'long', year: 'numeric' })}`;
}
function safePercent(value) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}
function subjectById(id) {
  return SUBJECTS.find(subject => subject.id === id) || SUBJECTS[0];
}
function taskKey(date, taskId) {
  return `${date}|${taskId}`;
}
function isTaskDone(data, date, taskId) {
  return Boolean(data.completedTasks[taskKey(date, taskId)]);
}
function isGroupInTrack(subject, group, trackId) {
  const tracks = group.tracks || subject.tracks;
  return trackId === 'all' || tracks.includes(trackId);
}
function flattenForTrack(trackId) {
  return SUBJECTS.flatMap(subject => {
    if (trackId !== 'all' && !subject.tracks.includes(trackId)) return [];
    return flattenSubject(subject).filter(item => trackId === 'all' || item.tracks.includes(trackId));
  });
}
function getTopicStatus(data, itemId) {
  const status = data.topicStatus?.[itemId];
  if (status === 'not' || status === 'doing' || status === 'done') return status;
  return data.topicDone?.[itemId] ? 'done' : 'not';
}
function topicProgress(data, trackId = 'all') {
  const items = flattenForTrack(trackId);
  const done = items.filter(item => getTopicStatus(data, item.id) === 'done').length;
  return { total: items.length, done, percent: items.length ? safePercent(done / items.length * 100) : 0 };
}
function subjectProgress(data, subject, trackId = 'all') {
  const items = flattenSubject(subject).filter(item => trackId === 'all' || item.tracks.includes(trackId));
  const done = items.filter(item => getTopicStatus(data, item.id) === 'done').length;
  return { total: items.length, done, percent: items.length ? safePercent(done / items.length * 100) : 0 };
}
function getWeekStats(data, weekStart, targetHours = data.targetHours || PLANNED_HOURS_PER_WEEK) {
  const dates = daysOfWeek(weekStart);
  const keys = new Set(dates.map(dateKey));
  const today = dateKey(new Date());
  const sessions = data.sessions.filter(session => keys.has(session.date));
  const sessionMinutes = sessions.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);
  const questions = sessions.reduce((sum, item) => sum + (Number(item.questions) || 0), 0);
  const correct = sessions.reduce((sum, item) => sum + Math.min(Number(item.correct) || 0, Number(item.questions) || 0), 0);
  const activeDates = new Set(sessions.map(item => item.date));
  Object.entries(data.completedTasks).forEach(([key, value]) => {
    if (value) {
      const [date] = key.split('|');
      if (keys.has(date)) activeDates.add(date);
    }
  });
  const allTasks = dates.flatMap((date, dayIndex) => WEEK_PLAN[dayIndex].activities.map(task => ({ ...task, date: dateKey(date) })));
  const tasksDone = allTasks.filter(task => isTaskDone(data, task.date, task.id)).length;
  const dayTaskCounts = dates.map((date, index) => ({ date: dateKey(date), tasks: WEEK_PLAN[index].activities }));
  const elapsedStudyDays = dayTaskCounts.filter(day => day.date < today).length;
  const dueTasks = dayTaskCounts.filter(day => day.date < today).flatMap(day => day.tasks);
  const dueTasksDone = dueTasks.filter(task => isTaskDone(data, dayTaskCounts.find(day => day.tasks.some(t => t.id === task.id))?.date || '', task.id)).length;
  const dueMinutes = elapsedStudyDays * (targetHours * 60 / PLANNED_STUDY_DAYS);
  const completedDueTasks = dayTaskCounts.filter(day => day.date < today).reduce((sum, day) => sum + day.tasks.filter(task => isTaskDone(data, day.date, task.id)).length, 0);
  const hoursRatio = dueMinutes ? Math.min(sessionMinutes / dueMinutes, 1) : 0;
  const tasksRatio = dueTasks.length ? Math.min(completedDueTasks / dueTasks.length, 1) : 0;
  const frequencyRatio = elapsedStudyDays ? Math.min([...activeDates].filter(day => day < today).length / elapsedStudyDays, 1) : 0;
  const pace = elapsedStudyDays ? safePercent((hoursRatio * 0.45 + tasksRatio * 0.35 + frequencyRatio * 0.20) * 100) : 0;
  const activeCount = activeDates.size;
  return {
    sessions, sessionMinutes, hours: sessionMinutes / 60, questions, correct,
    accuracy: questions ? safePercent(correct / questions * 100) : 0,
    activeDates, activeCount, tasksDone, tasksTotal: allTasks.length,
    taskPercent: allTasks.length ? safePercent(tasksDone / allTasks.length * 100) : 0,
    elapsedStudyDays, dueTasks: dueTasks.length, completedDueTasks, pace,
    score: safePercent((Math.min(sessionMinutes / Math.max(targetHours * 60, 1), 1) * 0.45
      + Math.min(tasksDone / Math.max(allTasks.length, 1), 1) * 0.35
      + Math.min(activeCount / PLANNED_STUDY_DAYS, 1) * 0.20) * 100),
  };
}
function weekKeyForDate(key) {
  return dateKey(startOfWeek(parseDate(key)));
}
function allKnownWeekStarts(data) {
  const keys = new Set();
  data.sessions.forEach(item => keys.add(weekKeyForDate(item.date)));
  Object.entries(data.completedTasks).forEach(([key, value]) => { if (value) keys.add(weekKeyForDate(key.split('|')[0])); });
  keys.add(dateKey(startOfWeek(new Date())));
  return [...keys].sort();
}
function computeGamification(data) {
  const totalMinutes = data.sessions.reduce((sum, item) => sum + Math.max(0, Number(item.minutes) || 0), 0);
  const taskCount = Object.values(data.completedTasks).filter(Boolean).length;
  const questionCount = data.sessions.reduce((sum, item) => sum + Math.max(0, Number(item.questions) || 0), 0);
  const activeDates = new Set(data.sessions.map(item => item.date));
  Object.entries(data.completedTasks).forEach(([key, value]) => { if (value) activeDates.add(key.split('|')[0]); });
  let weeklyBonuses = 0;
  let improvementBonuses = 0;
  const starts = allKnownWeekStarts(data);
  const accuracyByWeek = starts.map(start => {
    const stat = getWeekStats(data, parseDate(start));
    return { start, accuracy: stat.accuracy, questions: stat.questions, stat };
  });
  const todayStart = dateKey(startOfWeek(new Date()));
  accuracyByWeek.forEach((entry, index) => {
    const weekEnd = dateKey(addDays(parseDate(entry.start), 6));
    if (weekEnd < dateKey(new Date())) {
      const { stat } = entry;
      if (stat.score >= 95) weeklyBonuses += 60;
      else if (stat.score >= 80) weeklyBonuses += 35;
      else if (stat.score >= 50) weeklyBonuses += 15;
      if (index > 0) {
        const previous = accuracyByWeek[index - 1];
        if (entry.questions >= 10 && previous.questions >= 10 && entry.accuracy > previous.accuracy) improvementBonuses += 20;
      }
    }
  });
  const baseXp = Math.floor(totalMinutes / 30) * 5 + taskCount * 5 + activeDates.size * 10 + Math.floor(questionCount / 10) * 2;
  const xp = baseXp + weeklyBonuses + improvementBonuses;
  let currentIndex = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].threshold) currentIndex = i;
  const current = LEVELS[currentIndex];
  const next = LEVELS[currentIndex + 1] || null;
  const progress = next ? safePercent((xp - current.threshold) / (next.threshold - current.threshold) * 100) : 100;
  const currentWeek = getWeekStats(data, startOfWeek(new Date()));
  return {
    xp, baseXp, weeklyBonuses, improvementBonuses, activeDays: activeDates.size,
    current, next, currentIndex, progress, currentWeekScore: currentWeek.score,
    accuracyByWeek,
  };
}
function getWeeklyTrend(data) {
  return allKnownWeekStarts(data).map(start => {
    const stats = getWeekStats(data, parseDate(start));
    return { start, label: formatDate(parseDate(start), { day: '2-digit', month: 'short' }), accuracy: stats.accuracy, questions: stats.questions, hours: stats.hours };
  }).filter(item => item.questions > 0).slice(-8);
}
function calculateTrackProgress(data, trackId) {
  return topicProgress(data, trackId);
}

function App() {
  const [data, setData] = useState(loadSavedState);
  const [locale, setLocale] = useState(() => { const initialLocale = detectInitialLocale(); setActiveLocale(initialLocale); return initialLocale; });
  const changeLocale = nextLocale => { setActiveLocale(nextLocale); setLocale(nextLocale); };
  const [systemDark, setSystemDark] = useState(getSystemThemeIsDark);
  const effectiveTheme = data.theme === 'system' ? (systemDark ? 'dark' : 'light') : data.theme;
  const tx = text => translate(text, locale);
  const [view, setView] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(() => startOfWeek(new Date()));
  const [selectedTrack, setSelectedTrack] = useState('all');
  const [contentSearch, setContentSearch] = useState('');
  const [contentStatus, setContentStatus] = useState('all');
  const [expandedSubjects, setExpandedSubjects] = useState({ portugues: true });
  const [expandedGroups, setExpandedGroups] = useState({});
  const [sessionModal, setSessionModal] = useState(null);
  const [toast, setToast] = useState('');
  const [session, setSession] = useState(null);
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(() => typeof window !== 'undefined' && /type=recovery/i.test(window.location.hash));
  const [authLoading, setAuthLoading] = useState(supabaseConfigured);
  const [cloudReady, setCloudReady] = useState(!supabaseConfigured);
  const [cloudStatus, setCloudStatus] = useState(supabaseConfigured ? 'connecting' : 'local');
  const [cloudError, setCloudError] = useState('');
  const [cloudRetry, setCloudRetry] = useState(0);
  const [cloudPushRetry, setCloudPushRetry] = useState(0);
  const importInputRef = useRef(null);
  const dataRef = useRef(data);
  const remoteDataRef = useRef(null);
  const activeUserIdRef = useRef(null);
  const currentUserId = session?.user?.id || null;
  dataRef.current = data;

  useEffect(() => {
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, locale); } catch { /* language remains active in memory */ }
    document.documentElement.lang = locale === 'en' ? 'en' : 'pt-BR';
  }, [locale]);

  useEffect(() => {
    try { localStorage.setItem(THEME_PREFERENCE_KEY, data.theme); } catch { /* theme remains active in memory */ }
  }, [data.theme]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = event => setSystemDark(event.matches);
    setSystemDark(media.matches);
    media.addEventListener?.('change', sync);
    if (!media.addEventListener) media.addListener?.(sync);
    return () => {
      media.removeEventListener?.('change', sync);
      if (!media.removeEventListener) media.removeListener?.(sync);
    };
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) {
      setAuthLoading(false);
      setCloudReady(true);
      setCloudStatus('local');
      return undefined;
    }
    let alive = true;
    supabase.auth.getSession().then(({ data: result, error }) => {
      if (!alive) return;
      if (error) setCloudError(tx('A conexão com a nuvem falhou. Verifique a conexão e tente novamente.'));
      const nextSession = result?.session || null;
      const nextUserId = nextSession?.user?.id || null;
      if (activeUserIdRef.current !== nextUserId) {
        activeUserIdRef.current = nextUserId;
        remoteDataRef.current = null;
        setCloudReady(false);
      }
      setSession(nextSession);
      setAuthLoading(false);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!alive) return;
      if (event === 'PASSWORD_RECOVERY') setPasswordRecoveryMode(true);
      const nextUserId = nextSession?.user?.id || null;
      if (activeUserIdRef.current !== nextUserId) {
        activeUserIdRef.current = nextUserId;
        remoteDataRef.current = null;
        setCloudReady(false);
        setCloudStatus(nextUserId ? 'loading' : 'signed-out');
      }
      setSession(nextSession || null);
      if (!nextSession) {
        setCloudReady(false);
        setCloudStatus('signed-out');
        remoteDataRef.current = null;
      }
    });
    return () => {
      alive = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabaseConfigured || !currentUserId) {
      if (supabaseConfigured) setCloudReady(false);
      return undefined;
    }
    let alive = true;
    const loadFromCloud = async () => {
      setCloudReady(false);
      setCloudStatus('loading');
      setCloudError('');
      const { data: row, error } = await supabase
        .from(CLOUD_TABLE)
        .select('data, updated_at')
        .eq('user_id', currentUserId)
        .maybeSingle();
      if (!alive) return;
      if (error) {
        setCloudError(tx('Não foi possível carregar seus dados. Verifique a conexão e tente novamente.'));
        setCloudStatus('error');
        return;
      }

      if (row?.data) {
        const normalized = normalizeAppState(row.data);
        const snapshot = JSON.stringify(normalized);
        remoteDataRef.current = snapshot;
        setData(normalized);
        try { localStorage.setItem(userCacheKey(currentUserId), snapshot); } catch {}
        setCloudStatus('synced');
        setCloudReady(true);
        return;
      }

      // Migrate this browser's existing progress only once, to the first account linked.
      // A separate cache is used for each account so one account cannot seed another.
      const scopedCache = readUserCache(currentUserId);
      const migrationOwner = localStorage.getItem(CLOUD_MIGRATION_OWNER_KEY);
      let seedState;
      if (scopedCache) {
        seedState = scopedCache;
      } else if (!migrationOwner || migrationOwner === currentUserId) {
        seedState = normalizeAppState(dataRef.current);
      } else {
        seedState = normalizeAppState(emptyState);
      }
      const snapshot = JSON.stringify(seedState);
      const { error: saveError } = await supabase
        .from(CLOUD_TABLE)
        .upsert({ user_id: currentUserId, data: seedState, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (!alive) return;
      if (saveError) {
        setCloudError(tx('Não foi possível iniciar seu espaço na nuvem. Verifique a configuração do banco e tente novamente.'));
        setCloudStatus('error');
        return;
      }
      try {
        localStorage.setItem(CLOUD_MIGRATION_OWNER_KEY, currentUserId);
        localStorage.setItem(userCacheKey(currentUserId), snapshot);
      } catch {}
      remoteDataRef.current = snapshot;
      setData(seedState);
      setCloudStatus('synced');
      setCloudReady(true);
    };
    loadFromCloud();
    return () => { alive = false; };
  }, [currentUserId, cloudRetry]);

  useEffect(() => {
    try {
      if (!supabaseConfigured) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // Do not create a user-scoped cache until this user's cloud state has been loaded.
      if (currentUserId && cloudReady) localStorage.setItem(userCacheKey(currentUserId), JSON.stringify(data));
    } catch (error) { console.warn('Falha ao salvar o cache local.', error); }
  }, [data, currentUserId, cloudReady]);

  useEffect(() => {
    if (!supabaseConfigured || !currentUserId || !cloudReady) return undefined;
    const snapshot = JSON.stringify(data);
    if (snapshot === remoteDataRef.current) return undefined;
    const timeout = window.setTimeout(async () => {
      setCloudStatus('saving');
      setCloudError('');
      const { error } = await supabase
        .from(CLOUD_TABLE)
        .upsert({ user_id: currentUserId, data: JSON.parse(snapshot), updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (error) {
        setCloudStatus('error');
        setCloudError(tx('Não foi possível sincronizar seus dados. Verifique a conexão e tente novamente.'));
        return;
      }
      remoteDataRef.current = snapshot;
      setCloudStatus('synced');
      setCloudError('');
    }, 650);
    return () => window.clearTimeout(timeout);
  }, [data, currentUserId, cloudReady, cloudPushRetry]);

  useEffect(() => {
    if (!supabaseConfigured || !currentUserId || !cloudReady) return undefined;
    const handleOnline = () => setCloudPushRetry(value => value + 1);
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [currentUserId, cloudReady]);

  useEffect(() => {
    if (!supabaseConfigured || !currentUserId || !cloudReady) return undefined;
    const channel = supabase
      .channel(`studymaximizer-data-${currentUserId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: CLOUD_TABLE, filter: `user_id=eq.${currentUserId}`,
      }, payload => {
        const rowState = payload.new?.data;
        if (!rowState) return;
        const remoteState = normalizeAppState(rowState);
        const remoteSnapshot = JSON.stringify(remoteState);
        if (remoteSnapshot === remoteDataRef.current) return;
        const localSnapshot = JSON.stringify(dataRef.current);
        if (remoteSnapshot === localSnapshot) {
          remoteDataRef.current = remoteSnapshot;
          setCloudStatus('synced');
          return;
        }
        const merged = mergeAppStates(dataRef.current, remoteState);
        remoteDataRef.current = remoteSnapshot;
        setData(merged);
        setCloudStatus(JSON.stringify(merged) === remoteSnapshot ? 'synced' : 'saving');
      })
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setCloudError(tx('A conexão de atualização em tempo real caiu. Os salvamentos automáticos continuam tentando funcionar.'));
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, cloudReady]);
  useEffect(() => {
    document.documentElement.dataset.theme = effectiveTheme;
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.content = effectiveTheme === 'dark' ? '#111520' : '#f6f7fb';
  }, [effectiveTheme]);
  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 3400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const today = new Date();
  const todayKey = dateKey(today);
  const weekDates = useMemo(() => daysOfWeek(selectedWeek), [selectedWeek]);
  const currentStats = useMemo(() => getWeekStats(data, selectedWeek), [data, selectedWeek]);
  const gamification = useMemo(() => computeGamification(data), [data]);
  const totalContentProgress = useMemo(() => topicProgress(data, 'all'), [data]);
  const subjectProgressList = useMemo(() => SUBJECTS.map(subject => ({ subject, ...subjectProgress(data, subject) })), [data]);
  const trend = useMemo(() => getWeeklyTrend(data), [data]);
  const trackProgress = useMemo(() => TRACKS.map(track => ({ track, ...calculateTrackProgress(data, track.id) })), [data]);

  const notify = message => setToast(tx(message));
  const updateData = fn => setData(previous => typeof fn === 'function' ? fn(previous) : ({ ...previous, ...fn }));
  const handleSignOut = async () => {
    if (!supabaseConfigured) return;
    if (cloudStatus === 'saving') {
      notify('Aguarde a sincronização terminar antes de sair.');
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) setCloudError(tx('Não foi possível sair da conta. Tente novamente.'));
  };
  const retryCloudSync = () => {
    setCloudError('');
    setCloudPushRetry(value => value + 1);
  };
  const toggleTheme = () => updateData(previous => ({ ...previous, theme: effectiveTheme === 'dark' ? 'light' : 'dark' }));
  const toggleTask = (date, taskId) => {
    const key = taskKey(date, taskId);
    const wasDone = Boolean(data.completedTasks[key]);
    updateData(previous => ({
      ...previous,
      completedTasks: { ...previous.completedTasks, [key]: !wasDone },
    }));
    notify(wasDone ? 'Atividade reaberta.' : 'Atividade concluída. Boa consistência!');
  };
  const toggleTopic = itemId => {
    const current = getTopicStatus(data, itemId);
    const next = current === 'not' ? 'doing' : current === 'doing' ? 'done' : 'not';
    updateData(previous => ({
      ...previous,
      topicStatus: { ...previous.topicStatus, [itemId]: next },
      topicDone: { ...previous.topicDone, [itemId]: next === 'done' },
    }));
  };
  const saveSession = session => {
    updateData(previous => ({ ...previous, sessions: [...previous.sessions, session] }));
    setSessionModal(null);
    notify('Sessão registrada. Seu histórico e sua curva de aprendizagem foram atualizados.');
  };
  const deleteSession = id => {
    updateData(previous => ({ ...previous, sessions: previous.sessions.filter(session => session.id !== id) }));
    notify('Registro removido.');
  };
  const exportBackup = () => {
    const file = new Blob([JSON.stringify({ ...data, exportedAt: new Date().toISOString(), app: 'StudyMaximizer' }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `studymaximizer-backup-${todayKey}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify('Backup exportado. Guarde o arquivo em um local seguro.');
  };
  const importBackup = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || !Array.isArray(parsed.sessions)) throw new Error('Arquivo inválido');
      updateData({
        ...emptyState,
        ...parsed,
        version: 3,
        completedTasks: parsed.completedTasks || {},
        topicDone: parsed.topicDone || {},
        topicStatus: parsed.topicStatus || {},
        sessions: parsed.sessions,
        targetHours: Math.max(1, Number(parsed.targetHours) || PLANNED_HOURS_PER_WEEK),
        theme: getInitialThemePreference(),
      });
      notify('Backup importado com sucesso.');
    } catch (error) {
      notify('Não foi possível importar. Selecione um backup JSON válido do StudyMaximizer.');
    } finally {
      event.target.value = '';
    }
  };
  const openLogForTask = (task, date) => setSessionModal({
    date, subjectId: task.subjectId, track: task.track === 'admin' ? 'admin' : task.track === 'ti' ? 'tae-ti' : task.track === 'bancaria' ? 'bnb' : 'all',
    minutes: task.minutes, note: task.label,
  });
  const changeWeek = amount => setSelectedWeek(previous => addDays(previous, amount * 7));
  const navItems = [
    { id: 'overview', label: tx('Visão geral'), Icon: LayoutDashboard },
    { id: 'schedule', label: tx('Cronograma semanal'), Icon: CalendarDays },
    { id: 'syllabus', label: tx('Conteúdo programático'), Icon: BookOpenText, pill: `${totalContentProgress.done}/${totalContentProgress.total}` },
    { id: 'tracks', label: tx('Progresso por cargo'), Icon: Building2 },
    { id: 'performance', label: tx('Desempenho'), Icon: BarChart3 },
  ];
  const pageTitles = {
    overview: [tx('Visão geral'), tx('Uma visão clara do que você fez, do que falta e do que merece atenção.')],
    schedule: [tx('Cronograma semanal'), tx('Organize sua semana, conclua tarefas e registre cada sessão.')],
    syllabus: [tx('Conteúdo programático'), tx('Assuntos e subassuntos detalhados para acompanhar sua evolução por tópico.')],
    tracks: [tx('Progresso por cargo'), tx('Compare sua preparação para cada caminho e descubra onde concentrar esforço.')],
    performance: [tx('Desempenho e curva de aprendizagem'), tx('Acompanhe horas, questões, acertos e evolução ao longo das semanas.')],
    settings: [tx('Configurações e fontes'), tx('Personalize metas, proteja seus registros e consulte os editais de referência.')],
  };

  const renderContent = () => {
    if (view === 'schedule') return <SchedulePage
      data={data} weekStart={selectedWeek} weekDates={weekDates} stats={currentStats}
      changeWeek={changeWeek} todayKey={todayKey} toggleTask={toggleTask} openLog={openLogForTask}
      openGeneralLog={() => setSessionModal({ date: todayKey, subjectId: 'portugues', track: 'all', minutes: 45, note: '' })}
    />;
    if (view === 'syllabus') return <SyllabusPage
      data={data} selectedTrack={selectedTrack} setSelectedTrack={setSelectedTrack}
      search={contentSearch} setSearch={setContentSearch} status={contentStatus} setStatus={setContentStatus}
      expandedSubjects={expandedSubjects} setExpandedSubjects={setExpandedSubjects}
      expandedGroups={expandedGroups} setExpandedGroups={setExpandedGroups} toggleTopic={toggleTopic}
    />;
    if (view === 'tracks') return <TracksPage data={data} trackProgress={trackProgress} setSelectedTrack={setSelectedTrack} setView={setView} />;
    if (view === 'performance') return <PerformancePage data={data} stats={currentStats} selectedWeek={selectedWeek} trend={trend} deleteSession={deleteSession} openGeneralLog={() => setSessionModal({ date: todayKey, subjectId: 'portugues', track: 'all', minutes: 45, note: '' })} />;
    if (view === 'settings') return <SettingsPage
      data={data} updateData={updateData} exportBackup={exportBackup}
      importBackup={() => importInputRef.current?.click()} supabaseConfigured={supabaseConfigured}
      session={session} cloudStatus={cloudStatus} cloudError={cloudError}
      onSignOut={handleSignOut} onRetrySync={retryCloudSync} locale={locale} onLocaleChange={changeLocale} tx={tx}
    />;
    return <OverviewPage
      data={data} stats={getWeekStats(data, startOfWeek(new Date()))} gamification={gamification} trend={trend}
      subjectProgressList={subjectProgressList} trackProgress={trackProgress} totalContentProgress={totalContentProgress}
      todayKey={todayKey} today={today} toggleTask={toggleTask} openLog={openLogForTask}
      openSchedule={() => setView('schedule')} openContent={() => setView('syllabus')} openPerformance={() => setView('performance')} openTracks={() => setView('tracks')}
    />;
  };

  if (supabaseConfigured && authLoading) {
    return <CloudStartupScreen title={tx('Conferindo sua sessão')} text={tx('Conectando o StudyMaximizer à sua conta com segurança.')} theme={effectiveTheme} themePreference={data.theme} onThemeChange={theme => updateData(previous => ({ ...previous, theme }))} locale={locale} onLocaleChange={changeLocale} tx={tx} />;
  }
  if (supabaseConfigured && passwordRecoveryMode) {
    return <PasswordRecoveryScreen theme={effectiveTheme} themePreference={data.theme} onThemeChange={theme => updateData(previous => ({ ...previous, theme }))} locale={locale} onLocaleChange={changeLocale} onContinue={() => setPasswordRecoveryMode(false)} />;
  }
  if (supabaseConfigured && !session) {
    return <AuthScreen theme={effectiveTheme} themePreference={data.theme} onThemeChange={theme => updateData(previous => ({ ...previous, theme }))} locale={locale} onLocaleChange={changeLocale} />;
  }
  if (supabaseConfigured && session && !cloudReady) {
    return <CloudStartupScreen
      title={tx(cloudStatus === 'error' ? 'Não foi possível carregar seus dados' : 'Sincronizando seus dados')}
      text={cloudStatus === 'error' ? (cloudError || tx('A conexão com a nuvem falhou. Verifique a conexão e tente novamente.')) : tx('Estamos carregando seu progresso salvo na nuvem.')}
      theme={effectiveTheme} themePreference={data.theme} onThemeChange={theme => updateData(previous => ({ ...previous, theme }))} locale={locale} onLocaleChange={changeLocale} tx={tx}
      error={cloudStatus === 'error'} onRetry={() => setCloudRetry(value => value + 1)}
      onSignOut={handleSignOut}
    />;
  }

  const cloudStatusText = tx(({
    local: 'Salvo neste navegador', connecting: 'Conectando à nuvem…', loading: 'Carregando nuvem…',
    saving: 'Sincronizando…', synced: 'Sincronizado na nuvem', error: 'Falha na sincronização',
    'signed-out': 'Sessão encerrada',
  })[cloudStatus] || 'Sincronização automática');

  return (
    <div className="app-shell" data-theme={effectiveTheme}>
      {mobileMenuOpen && <button className="mobile-scrim" aria-label={translate("Fechar menu")} onClick={() => setMobileMenuOpen(false)} />}
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><GraduationCap size={25} strokeWidth={2.2} /></div>
          <div className="brand-name-wrap"><span className="brand-name">{translate("StudyMaximizer")}</span><span className="brand-caption">{translate("STUDY WITH PURPOSE")}</span></div>
          <button className="icon-button sidebar-close" aria-label={translate("Fechar menu")} onClick={() => setMobileMenuOpen(false)}><X size={18} /></button>
        </div>
        <div className="sidebar-profile">
          <div className="profile-avatar"><BookOpen size={20} /></div>
          <div className="profile-copy"><strong>{session?.user?.email || tx('Minha preparação')}</strong><span>{supabaseConfigured ? tx('Conta sincronizada') : 'Concursos 2027 · ciclo-base'}</span></div>
          <span className={`profile-dot ${cloudStatus === 'error' ? 'profile-dot-error' : ''}`} title={cloudStatusText} />
        </div>
        <div className="nav-label">{tx('ACOMPANHAMENTO')}</div>
        <nav className="sidebar-nav" aria-label={tx('Navegação principal')}>
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => { setView(item.id); setMobileMenuOpen(false); }}>
              <item.Icon size={19} strokeWidth={1.8} /><span>{item.label}</span>
              {item.pill && <small className="nav-pill">{item.pill}</small>}
              {view === item.id && <span className="nav-active-edge" />}
            </button>
          ))}
        </nav>
        <div className="nav-label nav-label-spaced">{tx('SISTEMA')}</div>
        <nav className="sidebar-nav" aria-label={translate("Ferramentas")}>
          <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => { setView('settings'); setMobileMenuOpen(false); }}>
            <Settings2 size={19} strokeWidth={1.8} /><span>{tx('Configurações e fontes')}</span>{view === 'settings' && <span className="nav-active-edge" />}
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-goal">
            <div className="goal-icon"><Target size={18} /></div>
            <div><strong>{tx('Meta semanal')}</strong><span>{data.targetHours || 15} {tx('horas de estudo')}</span></div>
            <button aria-label={translate("Editar meta")} className="tiny-icon-button" onClick={() => setView('settings')}><Settings2 size={14} /></button>
          </div>
          <div className="sidebar-note"><LockKeyhole size={14} /><span>{tx(supabaseConfigured ? 'Seus registros sincronizam com a nuvem.' : 'Seus registros ficam neste navegador.')}</span></div>
          <div className="sidebar-footer">{translate("STUDYMAXIMIZER")}{' '}<span>{translate("·")}</span> {translate("V2.0")}</div>
        </div>
      </aside>

      <main className="main-area">
        <div className="mobile-topbar">
          <button className="icon-button" aria-label={translate("Abrir menu")} onClick={() => setMobileMenuOpen(true)}><Menu size={21} /></button>
          <div className="mobile-brand"><div className="brand-mark small"><GraduationCap size={19} /></div><span>{translate("StudyMaximizer")}</span></div>
          <button className="icon-button" aria-label={effectiveTheme === 'dark' ? tx('Ativar tema claro') : tx('Ativar tema escuro')} onClick={toggleTheme}>{effectiveTheme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button>
        </div>
        <header className="topbar">
          <div className="breadcrumbs"><span>{translate("StudyMaximizer")}</span><ChevronRight size={14} /><strong>{pageTitles[view]?.[0] || 'Visão geral'}</strong></div>
          <div className="topbar-actions">
            <span className={`save-indicator ${cloudStatus === 'error' ? 'save-indicator-error' : ''}`} title={cloudError || cloudStatusText}><span className={`save-dot ${cloudStatus === 'error' ? 'save-dot-error' : ''}`} />{cloudStatusText}</span>
            <label className="locale-control" aria-label={tx('Idioma')}><Languages size={16} /><select value={locale} onChange={event => changeLocale(event.target.value)} aria-label={tx('Idioma')}>{SUPPORTED_LOCALES.map(item => <option value={item.code} key={item.code}>{item.shortLabel}</option>)}</select></label>
            <button className="icon-button theme-button" aria-label={effectiveTheme === 'dark' ? tx('Ativar tema claro') : tx('Ativar tema escuro')} title={effectiveTheme === 'dark' ? tx('Tema claro') : tx('Tema escuro')} onClick={toggleTheme}>{effectiveTheme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button>
            <button className="button button-primary top-log-button" onClick={() => setSessionModal({ date: todayKey, subjectId: 'portugues', track: 'all', minutes: 45, note: '' })}><Plus size={17} /> {tx('Registrar estudo')}</button>
          </div>
        </header>
        <div className="page-content">
          <section className="page-heading">
            <div><p className="eyebrow">{formatLongDate(today).toLocaleUpperCase(intlLocale())}</p><h1>{pageTitles[view]?.[0] || 'Visão geral'}</h1><p className="page-subtitle">{pageTitles[view]?.[1]}</p></div>
            {view === 'overview' && <div className="heading-badge"><span className="badge-pulse" /><span>{tx('Seu ciclo de preparação')}</span></div>}
          </section>
          {renderContent()}
          <footer className="page-footer"><span>{translate("StudyMaximizer")}</span><span>{tx('Feito para estudar com intenção, método e constância.')}</span><button onClick={() => setView('settings')}>{tx('Fontes e dados')} <ArrowRight size={13} /></button></footer>
        </div>
      </main>

      {sessionModal && <SessionModal initial={sessionModal} onClose={() => setSessionModal(null)} onSave={saveSession} storageLabel={supabaseConfigured && session ? tx('Sincronização automática com a nuvem') : tx('Salvo neste navegador')} tx={tx} />}
      <input ref={importInputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={importBackup} />
      {toast && <div className="toast" role="status"><CheckCircle2 size={18} />{toast}</div>}
    </div>
  );
}

function ThemeLocaleControls({ themePreference, theme, onThemeChange, locale, onLocaleChange, tx, compact = false }) {
  return <div className={`auth-utility-controls ${compact ? 'auth-utility-compact' : ''}`}>
    <label className="auth-utility-select" title={tx('Idioma')}>
      <Languages size={16} aria-hidden="true" />
      <select value={locale} onChange={event => onLocaleChange(event.target.value)} aria-label={tx('Idioma')}>
        {SUPPORTED_LOCALES.map(item => <option value={item.code} key={item.code}>{item.shortLabel}</option>)}
      </select>
    </label>
    <label className="auth-utility-select auth-theme-select" title={tx('Aparência')}>
      {theme === 'dark' ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
      <select value={themePreference} onChange={event => onThemeChange(event.target.value)} aria-label={tx('Aparência')}>
        <option value="system">{tx('Seguir sistema')}</option>
        <option value="light">{tx('Tema claro')}</option>
        <option value="dark">{tx('Tema escuro')}</option>
      </select>
    </label>
  </div>;
}

function CloudStartupScreen({ title, text, error = false, onRetry, onSignOut, theme = 'light', themePreference = 'system', onThemeChange = () => {}, locale = 'pt-BR', onLocaleChange = () => {}, tx = value => value }) {
  return <main className="cloud-startup-screen" data-theme={theme}>
    <section className="cloud-startup-card">
      <ThemeLocaleControls themePreference={themePreference} theme={theme} onThemeChange={onThemeChange} locale={locale} onLocaleChange={onLocaleChange} tx={tx} />
      <div className={`auth-logo-mark ${error ? 'auth-logo-error' : ''}`}><GraduationCap size={28} /></div>
      <span className="auth-eyebrow">{translate("STUDYMAXIMIZER ·")}{' '}{tx('Sincronização segura')}</span>
      <h1>{title}</h1>
      <p>{text}</p>
      {!error && <div className="loading-pulse"><span /><span /><span /></div>}
      {error && <div className="auth-action-row"><button className="button button-primary" onClick={onRetry}><RefreshCw size={16} /> {tx('Tentar novamente')}</button>{onSignOut && <button className="button button-secondary" onClick={onSignOut}>{tx('Sair da conta')}</button>}</div>}
      <small>{tx('Se o problema continuar, confira se o script supabase/schema.sql foi executado no SQL Editor do projeto.')}</small>
    </section>
  </main>;
}

function AuthScreen({ theme, themePreference, onThemeChange, locale, onLocaleChange }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [canReset, setCanReset] = useState(false);
  const tx = text => translate(text, locale);

  const resendConfirmation = async () => {
    if (!email.trim()) {
      setError(tx('Informe um endereço de e-mail válido.'));
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { error: requestError } = await supabase.auth.resend({
        type: 'signup', email: email.trim(), options: { emailRedirectTo: window.location.href },
      });
      if (requestError) throw requestError;
      setMessage(tx('Se houver um cadastro pendente para este e-mail, enviaremos uma nova mensagem de confirmação. Confira também a pasta de spam.'));
    } catch (requestError) {
      setError(translateAuthError(requestError, locale, 'signup'));
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      setError(tx('Informe um endereço de e-mail válido.'));
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { error: requestError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.href,
      });
      if (requestError) throw requestError;
      setMessage(tx('Se existir uma conta associada a este e-mail, enviaremos instruções para redefinir a senha.'));
    } catch (requestError) {
      setError(translateAuthError(requestError, locale, 'login'));
    } finally {
      setBusy(false);
    }
  };

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    setCanResend(false);
    setCanReset(false);
    try {
      if (mode === 'signup') {
        const { data: result, error: requestError } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: window.location.href },
        });
        if (requestError) throw requestError;
        const identities = result?.user?.identities;
        // Supabase obfuscates some duplicate sign-ups. An empty identity list is its documented signal
        // for an existing confirmed account when email confirmation is enabled.
        if (Array.isArray(identities) && identities.length === 0) {
          setError(tx('Este e-mail já está associado a uma conta. Tente entrar; se a confirmação estiver pendente, solicite outro e-mail, ou redefina sua senha.'));
          setMode('login');
          setCanResend(true);
          setCanReset(true);
        } else if (result?.session) {
          setMessage(tx('Conta criada. Abrindo seu espaço de estudos…'));
        } else {
          setMessage(tx('Cadastro aguardando confirmação. Confira seu e-mail. Se este endereço já tinha um cadastro pendente, solicite um novo e-mail de confirmação abaixo.'));
          setCanResend(true);
        }
      } else {
        const { error: requestError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (requestError) throw requestError;
        setMessage(tx('Login confirmado. Carregando seu progresso…'));
      }
    } catch (requestError) {
      const code = String(requestError?.code || '').toLowerCase();
      const errorText = translateAuthError(requestError, locale, mode);
      setError(errorText);
      if (code === 'email_not_confirmed' || String(requestError?.message || '').toLowerCase().includes('email not confirmed')) setCanResend(true);
      if (mode === 'signup' && ['user_already_exists', 'email_exists'].includes(code)) { setCanResend(true); setCanReset(true); }
      if (mode === 'login') setCanReset(true);
    } finally {
      setBusy(false);
    }
  };

  return <main className="auth-screen" data-theme={theme}>
    <section className="auth-card">
      <ThemeLocaleControls themePreference={themePreference} theme={theme} onThemeChange={onThemeChange} locale={locale} onLocaleChange={onLocaleChange} tx={tx} />
      <div className="auth-brand"><div className="auth-logo-mark"><GraduationCap size={29} /></div><div><strong>{translate("StudyMaximizer")}</strong><span>{translate("STUDY WITH PURPOSE")}</span></div></div>
      <div className="auth-intro"><span className="auth-eyebrow">{tx('Sua preparação, em qualquer lugar')}</span><h1>{mode === 'login' ? tx('Entre na sua conta') : tx('Crie sua conta')}</h1><p>{mode === 'login' ? tx('Acesse seu cronograma, progresso e histórico sincronizados.') : tx('Crie sua conta para manter seus estudos sincronizados entre dispositivos.')}</p></div>
      <form className="auth-form" onSubmit={submit}>
        <label className="auth-field"><span>{tx('E-mail')}</span><div><Mail size={18} /><input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder={translate("voce@exemplo.com")} /></div></label>
        <label className="auth-field"><span>{tx('Senha')}</span><div><LockKeyhole size={18} /><input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} required value={password} onChange={event => setPassword(event.target.value)} placeholder={tx('Pelo menos 6 caracteres')} /></div></label>
        {error && <div className="auth-feedback auth-feedback-error" role="alert"><CircleAlert size={17} /><span>{error}</span></div>}
        {message && <div className="auth-feedback auth-feedback-success" role="status"><CheckCircle2 size={17} /><span>{message}</span></div>}
        <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? <RefreshCw size={17} className="auth-spinner" /> : <ArrowRight size={17} />}{busy ? tx('Processando…') : mode === 'login' ? tx('Entrar e sincronizar') : tx('Criar conta')}</button>
      </form>
      {mode === 'login' && <button type="button" className="auth-link-button" disabled={busy} onClick={resetPassword}>{tx('Esqueci minha senha')}</button>}
      {canResend && <button type="button" className="auth-link-button" disabled={busy} onClick={resendConfirmation}>{busy ? tx('Processando…') : tx('Reenviar confirmação')}</button>}
      <div className="auth-switch"><span>{mode === 'login' ? tx('Ainda não tem conta?') : tx('Já tem uma conta?')}</span><button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); setCanResend(false); setCanReset(false); }}>{mode === 'login' ? tx('Criar conta') : tx('Fazer login')}</button></div>
      {canReset && error && <p className="auth-inline-hint">{tx('Para proteger sua conta, o login não informa se o e-mail não está cadastrado ou se a senha está incorreta. Se necessário, crie uma conta ou recupere a senha.')}</p>}
      <div className="auth-security-note"><ShieldCheck size={17} /><span>{tx('Seus registros são privados. O banco aplica regras para que cada conta acesse apenas os próprios dados.')}</span></div>
    </section>
  </main>;
}


function PasswordRecoveryScreen({ theme, themePreference, onThemeChange, locale, onLocaleChange, onContinue }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const tx = text => translate(text, locale);

  const submit = async event => {
    event.preventDefault();
    setError('');
    if (password.length < 6) {
      setError(tx('A senha precisa ter pelo menos 6 caracteres.'));
      return;
    }
    if (password !== confirmPassword) {
      setError(tx('As senhas não coincidem.'));
      return;
    }
    setBusy(true);
    try {
      const { error: requestError } = await supabase.auth.updateUser({ password });
      if (requestError) throw requestError;
      setSaved(true);
    } catch (requestError) {
      setError(translateAuthError(requestError, locale, 'signup'));
    } finally {
      setBusy(false);
    }
  };

  return <main className="auth-screen" data-theme={theme}>
    <section className="auth-card">
      <ThemeLocaleControls themePreference={themePreference} theme={theme} onThemeChange={onThemeChange} locale={locale} onLocaleChange={onLocaleChange} tx={tx} />
      <div className="auth-brand"><div className="auth-logo-mark"><GraduationCap size={29} /></div><div><strong>StudyMaximizer</strong><span>STUDY WITH PURPOSE</span></div></div>
      <div className="auth-intro"><span className="auth-eyebrow">{tx('Segurança da conta')}</span><h1>{saved ? tx('Senha atualizada') : tx('Criar uma nova senha')}</h1><p>{saved ? tx('Sua senha foi atualizada com sucesso. Continue para voltar ao seu espaço de estudos.') : tx('Escolha uma nova senha para recuperar o acesso à sua conta.')}</p></div>
      {saved ? <div className="auth-action-row"><button className="button button-primary auth-submit" type="button" onClick={onContinue}>{tx('Continuar para meus estudos')} <ArrowRight size={17} /></button></div> : <form className="auth-form" onSubmit={submit}>
        <label className="auth-field"><span>{tx('Nova senha')}</span><div><LockKeyhole size={18} /><input type="password" autoComplete="new-password" minLength={6} required value={password} onChange={event => setPassword(event.target.value)} placeholder={tx('Pelo menos 6 caracteres')} /></div></label>
        <label className="auth-field"><span>{tx('Confirmar nova senha')}</span><div><LockKeyhole size={18} /><input type="password" autoComplete="new-password" minLength={6} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder={tx('Digite a senha novamente')} /></div></label>
        {error && <div className="auth-feedback auth-feedback-error" role="alert"><CircleAlert size={17} /><span>{error}</span></div>}
        <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? <RefreshCw size={17} className="auth-spinner" /> : <CheckCircle2 size={17} />}{busy ? tx('Processando…') : tx('Salvar nova senha')}</button>
      </form>}
      <div className="auth-security-note"><ShieldCheck size={17} /><span>{tx('Nunca compartilhe links de redefinição de senha. Se você não solicitou isso, feche esta página.')}</span></div>
    </section>
  </main>;
}

function StatCard({ label, value, suffix, foot, Icon: CardIcon, tone = 'blue', meter }) {
  return <article className={`stat-card stat-${tone}`}>
    <div className="stat-top"><span>{translate(label)}</span><span className="stat-icon"><CardIcon size={20} strokeWidth={1.8} /></span></div>
    <div className="stat-value">{value}<small>{suffix || ''}</small></div>
    {meter !== undefined && <div className="stat-meter"><span style={{ width: `${safePercent(meter)}%` }} /></div>}
    <div className="stat-foot">{foot}</div>
  </article>;
}

function ProgressBar({ value, color = 'blue', height = 7 }) {
  return <div className={`progress-track progress-${color}`} style={{ height }}><span style={{ width: `${safePercent(value)}%` }} /></div>;
}

function OverviewPage({ data, stats, gamification, trend, subjectProgressList, trackProgress, totalContentProgress, todayKey, today, toggleTask, openLog, openSchedule, openContent, openPerformance, openTracks }) {
  const CurrentLevelIcon = gamification.current.Icon;
  const dayIndex = (today.getDay() + 6) % 7;
  const todayActivities = dayIndex < 6 ? WEEK_PLAN[dayIndex].activities : [];
  const todayDone = todayActivities.filter(task => isTaskDone(data, todayKey, task.id)).length;
  const weekHoursPct = safePercent(stats.hours / Math.max(Number(data.targetHours) || 15, 1) * 100);
  const xpToNext = gamification.next ? Math.max(0, gamification.next.threshold - gamification.xp) : 0;
  const prioritySubjects = [...subjectProgressList].filter(item => item.subject.id === 'portugues' || ['legislacao', 'matematica-logica', 'ti', 'bancarios'].includes(item.subject.id)).slice(0, 5);
  return <div className="dashboard-stack">
    <section className="hero-card">
      <div className="hero-content">
        <div className="hero-overline"><span className="hero-overline-dot" />{translate("SEU PLANO, SUA EVOLUÇÃO")}</div>
        <h2>{translate("Consistência hoje.")}<br /><em>{translate("Confiança no dia da prova.")}</em></h2>
        <p>{translate("Pequenos blocos bem feitos, revisões frequentes e acompanhamento honesto do progresso.")}</p>
        <div className="hero-actions"><button className="button button-light" onClick={openSchedule}>{translate("Ver meu cronograma")}{' '}<ArrowRight size={16} /></button><button className="button button-hero-ghost" onClick={openContent}>{translate("Explorar conteúdos")}{' '}<BookOpen size={16} /></button></div>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-glow" /><div className="hero-emblem"><GraduationCap size={52} strokeWidth={1.35} /></div><div className="hero-float-card float-one"><Target size={16} /><span>{translate("15h semanais")}</span></div><div className="hero-float-card float-two"><TrendingUp size={16} /><span>{translate("Progresso real")}</span></div><span className="hero-star star-one">{translate("✦")}</span><span className="hero-star star-two">{translate("✧")}</span></div>
    </section>

    <section className="stat-grid" aria-label={translate("Resumo de desempenho semanal")}>
      <StatCard label="Horas registradas" value={stats.hours.toLocaleString(intlLocale(), { maximumFractionDigits: 1 })} suffix="h" foot={`${translate("Meta")}: ${data.targetHours || 15}h ${translate("por semana")}`} Icon={Clock3} tone="blue" meter={weekHoursPct} />
      <StatCard label="Tarefas concluídas" value={stats.tasksDone} suffix={`/${stats.tasksTotal}`} foot={`${stats.taskPercent}% ${translate("do cronograma semanal")}`} Icon={CheckCheck} tone="green" meter={stats.taskPercent} />
      <StatCard label="Questões resolvidas" value={stats.questions} foot={stats.questions ? `${stats.accuracy}% ${translate("de acertos nesta semana")}` : translate('Registre questões nas sessões')} Icon={ListChecks} tone="violet" meter={stats.accuracy} />
      <StatCard label="Frequência semanal" value={stats.activeCount} suffix={`/6 ${translate("dias")}`} foot={translate("Dias com sessão ou tarefa concluída")} Icon={CalendarCheck} tone="amber" meter={stats.activeCount / 6 * 100} />
    </section>

    <div className="dashboard-main-grid">
      <section className="panel today-panel">
        <div className="panel-heading"><div><span className="section-kicker">{translate("EXECUÇÃO")}</span><h3>{translate("Plano de hoje")}</h3><p>{formatLongDate(today)}</p></div><button className="text-button" onClick={openSchedule}>{translate("Semana completa")}{' '}<ArrowRight size={15} /></button></div>
        {todayActivities.length ? <>
          <div className="day-progress-row"><span>{todayDone} {translate("de")}{' '}{todayActivities.length} {translate("atividades concluídas")}</span><span>{safePercent(todayDone / todayActivities.length * 100)}{translate("%")}</span></div><ProgressBar value={todayDone / todayActivities.length * 100} color="blue" />
          <div className="today-task-list">{todayActivities.map(task => <TaskRow key={task.id} task={task} date={todayKey} done={isTaskDone(data, todayKey, task.id)} toggleTask={toggleTask} openLog={openLog} compact />)}</div>
        </> : <div className="rest-day"><div className="rest-icon"><Leaf size={25} /></div><div><strong>{translate("Domingo de recuperação")}</strong><p>{translate("Descanse sem culpa. Uma rotina sustentável também inclui pausa.")}</p></div></div>}
        <button className="panel-bottom-link" onClick={openSchedule}>{translate("Abrir cronograma detalhado")}{' '}<ArrowRight size={15} /></button>
      </section>

      <section className="panel level-panel">
        <div className="panel-heading"><div><span className="section-kicker">{translate("GAMIFICAÇÃO")}</span><h3>{translate("Sua jornada")}</h3><p>{translate("O nível reflete suas atividades registradas.")}</p></div><div className="level-medal"><Trophy size={20} /></div></div>
        <div className="level-current"><div className="level-illustration"><CurrentLevelIcon size={30} strokeWidth={1.6} /></div><div className="level-current-copy"><span>{translate("NÍVEL")}{' '}{gamification.currentIndex + 1} {translate("DE")}{' '}{LEVELS.length}</span><strong>{translate(gamification.current.name)}</strong><small>{translate(gamification.current.subtitle)}</small></div></div>
        <div className="xp-metrics"><div><strong>{gamification.xp.toLocaleString(intlLocale())}</strong><span>{translate("XP acumulados")}</span></div><div className="xp-next">{gamification.next ? <><strong>{xpToNext.toLocaleString(intlLocale())} {translate("XP")}</strong><span>{translate("para o próximo nível")}</span></> : <><strong>{translate("Nível máximo")}</strong><span>{translate("Você chegou ao topo")}</span></>}</div></div>
        <ProgressBar value={gamification.progress} color="violet" height={9} />
        <div className="level-progress-caption"><span>{translate(gamification.current.name)}</span><span>{gamification.next ? translate(gamification.next.name) : translate('Elite')}</span></div>
        <div className="gamification-note"><Zap size={15} /><span>{translate("XP por tempo estudado, tarefas, frequência, questões e evolução nos acertos.")}</span></div>
        <button className="panel-bottom-link" onClick={openPerformance}>{translate("Ver desempenho e curva de aprendizagem")}{' '}<ArrowRight size={15} /></button>
      </section>
    </div>

    <div className="dashboard-bottom-grid">
      <section className="panel chart-panel">
        <div className="panel-heading"><div><span className="section-kicker">{translate("RESULTADO")}</span><h3>{translate("Curva de aprendizagem")}</h3><p>{translate("Percentual de acertos por semana, a partir dos seus registros.")}</p></div><button className="icon-button subtle" aria-label={translate("Abrir desempenho")} onClick={openPerformance}><ArrowRight size={17} /></button></div>
        <AccuracyChart trend={trend} compact />
        <div className="chart-legend"><span><i className="legend-dot" />{translate("Taxa de acertos")}</span><span><i className="legend-line" />{translate("Meta de referência: 80%")}</span></div>
      </section>
      <section className="panel focus-panel">
        <div className="panel-heading"><div><span className="section-kicker">{translate("PRÓXIMO PASSO")}</span><h3>{translate("Conteúdos em acompanhamento")}</h3><p>{translate("Confira o avanço dos principais blocos de estudo.")}</p></div><button className="text-button" onClick={openContent}>{translate("Ver tudo")}{' '}<ArrowRight size={15} /></button></div>
        <div className="focus-subject-list">{prioritySubjects.map(({ subject, done, total, percent }) => <div className="focus-subject" key={subject.id}><div className={`focus-icon icon-${subject.color}`}><Icon name={subject.icon} size={17} /></div><div className="focus-subject-info"><div className="focus-subject-name"><strong>{subject.title}</strong><span>{done}{translate("/")}{total}</span></div><ProgressBar value={percent} color={subject.color} height={5} /></div></div>)}</div>
        <div className="content-total-row"><span><BookOpenText size={15} /> {translate("Conteúdo total mapeado")}</span><strong>{totalContentProgress.done} {translate("de")}{' '}{totalContentProgress.total} {translate("subtópicos")}</strong></div>
      </section>
    </div>

    <WeeklyPacePanel data={data} stats={stats} todayKey={todayKey} />

    <section className="panel tracks-overview-panel">
      <div className="panel-heading"><div><span className="section-kicker">{translate("ROTAS DE PREPARAÇÃO")}</span><h3>{translate("Progresso por cargo")}</h3><p>{translate("As matérias compartilhadas ajudam em mais de um caminho, mas os conteúdos específicos permanecem separados.")}</p></div><button className="text-button" onClick={() => openTracks()}>{translate("Detalhar cargos")}{' '}<ArrowRight size={15} /></button></div>
      <div className="track-mini-grid">{trackProgress.map(({ track, done, total, percent }) => { const TrackIcon = ICONS[track.icon] || Building2; return <div className="track-mini-card" key={track.id}><div className={`track-mini-icon track-${track.color}`}><TrackIcon size={19} /></div><div className="track-mini-main"><strong>{track.short}</strong><span>{track.institution}</span><ProgressBar value={percent} color={track.color} height={5} /><small>{done} {translate("de")}{' '}{total} {translate("subtópicos concluídos")}</small></div><strong className="track-mini-percent">{percent}{translate("%")}</strong></div>; })}</div>
    </section>
    <section className="panel level-ladder-panel"><div className="panel-heading"><div><span className="section-kicker">{translate("SUA JORNADA")}</span><h3>{translate("Os cinco níveis StudyMaximizer")}</h3><p>{translate("A evolução considera o esforço registrado, a regularidade e a melhora de desempenho — não apenas cliques em tarefas.")}</p></div></div><div className="level-ladder">{LEVELS.map((level, index) => { const LevelIcon = level.Icon; const active = level.name === gamification.current.name; const passed = gamification.xp >= level.threshold; return <div className={`ladder-item ${active ? 'ladder-active' : ''} ${passed ? 'ladder-passed' : ''}`} key={level.name}><div className="ladder-icon"><LevelIcon size={21} /></div><strong>{translate(level.name)}</strong><span>{level.threshold.toLocaleString(intlLocale())} {translate("XP")}</span>{active && <small>{translate("NÍVEL ATUAL")}</small>}</div>; })}</div></section>
  </div>;
}


function WeeklyPacePanel({ data, stats, todayKey }) {
  const expectedHours = (Number(data.targetHours) || PLANNED_HOURS_PER_WEEK) / PLANNED_STUDY_DAYS * stats.elapsedStudyDays;
  const activePastDays = [...stats.activeDates].filter(date => date < todayKey).length;
  const hoursProgress = expectedHours > 0 ? safePercent(stats.hours / expectedHours * 100) : 0;
  const taskProgress = stats.dueTasks > 0 ? safePercent(stats.completedDueTasks / stats.dueTasks * 100) : 0;
  const frequencyProgress = stats.elapsedStudyDays > 0 ? safePercent(activePastDays / stats.elapsedStudyDays * 100) : 0;
  const dueHoursLabel = `${expectedHours.toLocaleString(intlLocale(), { maximumFractionDigits: 1 })}h`;
  return <section className="panel pace-panel">
    <div className="panel-heading"><div><span className="section-kicker">{translate("REALIZADO × ESPERADO")}</span><h3>{translate("Seu ritmo está acompanhando o plano?")}</h3><p>{translate("Compara o tempo, as tarefas vencidas e a frequência até o dia anterior, sem cobrar o dia atual antes de terminar.")}</p></div><div className={`pace-score ${stats.elapsedStudyDays ? '' : 'pace-waiting'}`}><strong>{stats.elapsedStudyDays ? `${stats.pace}%` : '—'}</strong><span>{stats.elapsedStudyDays ? translate('ritmo acumulado') : translate('semana começando')}</span></div></div>
    {stats.elapsedStudyDays ? <div className="pace-metrics-grid">
      <div className="pace-metric"><div><span>{translate("Tempo estudado")}</span><strong>{stats.hours.toLocaleString(intlLocale(), { maximumFractionDigits: 1 })}{translate("h")}{' '}<small>{translate("/")}{' '}{dueHoursLabel} {translate("esperadas")}</small></strong></div><ProgressBar value={hoursProgress} color="blue" height={7} /><small>{hoursProgress >= 100 ? translate('Meta temporal em dia') : `${safePercent(hoursProgress)}% ${translate('do tempo esperado')}`}</small></div>
      <div className="pace-metric"><div><span>{translate("Tarefas vencidas")}</span><strong>{stats.completedDueTasks} <small>{translate("/")}{' '}{stats.dueTasks} {translate("concluídas")}</small></strong></div><ProgressBar value={taskProgress} color="green" height={7} /><small>{taskProgress >= 100 ? translate('Todas as tarefas vencidas concluídas') : `${taskProgress}% ${translate('das tarefas esperadas')}`}</small></div>
      <div className="pace-metric"><div><span>{translate("Frequência até ontem")}</span><strong>{activePastDays} <small>{translate("/")}{' '}{stats.elapsedStudyDays} {translate("dias ativos")}</small></strong></div><ProgressBar value={frequencyProgress} color="violet" height={7} /><small>{frequencyProgress >= 100 ? translate('Boa regularidade até aqui') : translate('Priorize retomar a rotina, sem tentar compensar tudo de uma vez')}</small></div>
    </div> : <div className="pace-start-note"><CalendarCheck size={20} /><div><strong>{translate("A semana ainda está começando.")}</strong><p>{translate("Esse indicador passa a comparar o esperado com o realizado após o primeiro dia planejado terminar.")}</p></div></div>}
    <div className="pace-footnote"><Zap size={14} /><span>{translate("O indicador combina horas (45%), tarefas vencidas (35%) e frequência (20%). O XP semanal só libera bônus de meta após o encerramento da semana.")}</span></div>
  </section>;
}

function TaskRow({ task, date, done, toggleTask, openLog, compact = false }) {
  const subject = subjectById(task.subjectId);
  return <div className={`task-row ${done ? 'task-done' : ''} ${compact ? 'task-row-compact' : ''}`}>
    <button className={`task-check ${done ? 'checked' : ''}`} aria-label={done ? 'Reabrir atividade' : 'Concluir atividade'} onClick={() => toggleTask(date, task.id)}>{done && <Check size={15} strokeWidth={2.5} />}</button>
    <div className="task-copy"><div className="task-title-row"><strong>{task.label}</strong>{done && <span className="completed-label">{translate("Concluída")}</span>}</div><span className="task-focus">{task.focus}</span><div className="task-meta"><span className={`subject-dot dot-${subject.color}`} />{subject.title}<span className="meta-separator">{translate("·")}</span><Clock3 size={13} />{formatDuration(task.minutes)}<span className="meta-separator">{translate("·")}</span>{task.type}</div></div>
    <button className="icon-button task-log-button" title={translate("Registrar sessão desta atividade")} aria-label={translate("Registrar sessão")} onClick={() => openLog(task, date)}><Plus size={17} /></button>
  </div>;
}

function SchedulePage({ data, weekStart, weekDates, stats, changeWeek, todayKey, toggleTask, openLog, openGeneralLog }) {
  const [selectedDay, setSelectedDay] = useState(Math.max(0, Math.min(5, (new Date().getDay() + 6) % 7)));
  const totalTarget = Number(data.targetHours) || PLANNED_HOURS_PER_WEEK;
  const weekIsCurrent = dateKey(startOfWeek(new Date())) === dateKey(weekStart);
  const selectedDate = weekDates[selectedDay];
  const selectedDateKey = dateKey(selectedDate);
  const dayTasks = WEEK_PLAN[selectedDay].activities;
  const dayDone = dayTasks.filter(task => isTaskDone(data, selectedDateKey, task.id)).length;
  const selectedStats = getWeekStats(data, weekStart);
  return <div className="page-stack">
    <section className="schedule-summary-row">
      <div className="schedule-week-card panel"><div className="week-picker"><button className="icon-button" aria-label={translate("Semana anterior")} onClick={() => changeWeek(-1)}><ChevronLeft size={20} /></button><div><span>{translate("SEMANA DE ESTUDOS")}</span><strong>{formatWeekRange(weekStart)}</strong><small>{weekIsCurrent ? 'Semana atual' : dateKey(weekStart) < dateKey(startOfWeek(new Date())) ? 'Semana anterior' : 'Planejamento futuro'}</small></div><button className="icon-button" aria-label={translate("Próxima semana")} onClick={() => changeWeek(1)}><ChevronRight size={20} /></button></div><div className="week-stats-strip"><div><strong>{formatDuration(selectedStats.sessionMinutes)}</strong><span>{translate("Tempo registrado")}</span></div><div><strong>{selectedStats.tasksDone}{translate("/")}{selectedStats.tasksTotal}</strong><span>{translate("Tarefas concluídas")}</span></div><div><strong>{selectedStats.questions}</strong><span>{translate("Questões")}</span></div></div></div>
      <div className="weekly-target-card"><div className="target-card-top"><div className="target-ring" style={{ '--ring': `${safePercent(selectedStats.hours / Math.max(totalTarget, 1) * 100)}%` }}><span>{safePercent(selectedStats.hours / Math.max(totalTarget, 1) * 100)}<small>{translate("%")}</small></span></div><div><span className="section-kicker">{translate("META DA SEMANA")}</span><strong>{selectedStats.hours.toLocaleString(intlLocale(), { maximumFractionDigits: 1 })}{translate("h")}{' '}<small>{translate("de")}{' '}{totalTarget}{translate("h")}</small></strong><p>{translate("Horas efetivamente registradas")}</p></div></div><ProgressBar value={selectedStats.hours / Math.max(totalTarget, 1) * 100} color="blue" height={7} /><button className="text-button" onClick={openGeneralLog}>{translate("Registrar sessão avulsa")}{' '}<ArrowRight size={14} /></button></div>
    </section>

    <section className="panel week-planner-panel">
      <div className="panel-heading"><div><span className="section-kicker">{translate("PLANEJAMENTO DIÁRIO")}</span><h3>{translate("Seu ciclo de segunda a sábado")}</h3><p>{translate("Cada dia contém 2h30 planejadas. Marque a tarefa após executá-la e use o botão + para registrar o tempo real.")}</p></div><div className="inline-legend"><span><i className="legend-status done" />{translate("Concluída")}</span><span><i className="legend-status pending" />{translate("Pendente")}</span></div></div>
      <div className="week-day-tabs">{weekDates.map((date, index) => { const day = WEEK_PLAN[index]; const completed = day.activities.filter(task => isTaskDone(data, dateKey(date), task.id)).length; const isToday = dateKey(date) === todayKey; return <button key={day.id} className={`week-day-tab ${selectedDay === index ? 'selected' : ''} ${isToday ? 'today' : ''}`} onClick={() => setSelectedDay(index)}><span>{day.short}</span><strong>{date.getDate()}</strong><small>{completed === day.activities.length ? 'Completo' : `${completed}/${day.activities.length} feitas`}</small><span className="day-tab-progress"><i style={{ width: `${completed / day.activities.length * 100}%` }} /></span></button>; })}</div>
      <div className="day-detail-heading"><div className="day-date-badge"><CalendarDays size={20} /></div><div><h4>{WEEK_PLAN[selectedDay].day}</h4><span>{formatLongDate(selectedDate)} {translate("·")}{' '}{formatDuration(dayTasks.reduce((sum, item) => sum + item.minutes, 0))} {translate("planejadas")}</span></div><div className="day-completion-pill"><CheckCircle2 size={15} />{dayDone}{translate("/")}{dayTasks.length} {translate("tarefas")}</div></div>
      <div className="day-task-stack">{dayTasks.map(task => <TaskRow key={task.id} task={task} date={selectedDateKey} done={isTaskDone(data, selectedDateKey, task.id)} toggleTask={toggleTask} openLog={openLog} />)}</div>
      <div className="day-footer-note"><CircleHelp size={17} /><span>{translate("Marcar tarefa como concluída atualiza a consistência. Para que horas, questões e curva de acertos sejam calculadas, registre também uma sessão com o tempo real estudado.")}</span></div>
    </section>
    <section className="schedule-guidelines-grid"><InfoCard Icon={Timer} title={translate("Blocos de foco")} text="Experimente 45–50 minutos de concentração, com pausas curtas entre blocos. O tempo de pausa não entra nas horas estudadas." /><InfoCard Icon={NotebookPen} title={translate("Correção ativa")} text="Não conte apenas questões respondidas. Registre os motivos dos erros e retorne a eles nas revisões." /><InfoCard Icon={Leaf} title={translate("Rotina sustentável")} text="Domingo é reservado para descanso e revisão do planejamento. Um dia sem estudo não apaga o progresso anterior." /></section>
  </div>;
}

function InfoCard({ Icon: CardIcon, title, text }) {
  return <article className="info-card"><div className="info-icon"><CardIcon size={19} /></div><div><strong>{title}</strong><p>{text}</p></div></article>;
}

function SyllabusPage({ data, selectedTrack, setSelectedTrack, search, setSearch, status, setStatus, expandedSubjects, setExpandedSubjects, expandedGroups, setExpandedGroups, toggleTopic }) {
  const filtered = SUBJECTS.filter(subject => selectedTrack === 'all' ? true : subject.tracks.includes(selectedTrack)).map(subject => {
    const groups = subject.groups.filter(group => isGroupInTrack(subject, group, selectedTrack)).map(group => {
      const topicId = `${subject.id}-${slug(group.title)}`;
      const items = group.items.map((label, index) => ({ id: `${topicId}-${index + 1}`, label, status: getTopicStatus(data, `${topicId}-${index + 1}`) }));
      const visibleItems = items.filter(item => {
        const matchesStatus = status === 'all' || (status === 'done' ? item.status === 'done' : status === 'doing' ? item.status === 'doing' : item.status === 'not');
        const q = search.trim().toLocaleLowerCase('pt-BR');
        const matchesSearch = !q || subject.title.toLocaleLowerCase('pt-BR').includes(q) || group.title.toLocaleLowerCase('pt-BR').includes(q) || item.label.toLocaleLowerCase('pt-BR').includes(q);
        return matchesStatus && matchesSearch;
      });
      return { ...group, topicId, items: visibleItems, allCount: items.length, doneCount: items.filter(item => item.status === 'done').length, doingCount: items.filter(item => item.status === 'doing').length };
    }).filter(group => group.items.length > 0);
    const items = flattenSubject(subject).filter(item => selectedTrack === 'all' || item.tracks.includes(selectedTrack));
    const done = items.filter(item => getTopicStatus(data, item.id) === 'done').length;
    const doing = items.filter(item => getTopicStatus(data, item.id) === 'doing').length;
    return { subject, groups, done, doing, total: items.length, percent: items.length ? safePercent(done / items.length * 100) : 0 };
  }).filter(entry => entry.groups.length > 0);
  const allVisibleCount = filtered.reduce((sum, entry) => sum + entry.groups.reduce((groupSum, group) => groupSum + group.items.length, 0), 0);
  const selectedTrackObject = TRACKS.find(track => track.id === selectedTrack);
  return <div className="page-stack">
    <section className="syllabus-hero panel"><div className="syllabus-hero-icon"><BookOpenText size={28} /></div><div className="syllabus-hero-main"><span className="section-kicker">{translate("MAPA DE CONTEÚDO")}</span><h3>{translate("Um assunto por vez. Cada avanço fica registrado.")}</h3><p>{translate("Marque os subassuntos após estudar e revisar. O percentual acompanha a quantidade de itens concluídos, não substitui uma avaliação de domínio por questões.")}</p></div><div className="syllabus-summary"><strong>{topicProgress(data, selectedTrack).done}<span>{translate("/")}{topicProgress(data, selectedTrack).total}</span></strong><small>{translate("subassuntos concluídos")}</small><ProgressBar value={topicProgress(data, selectedTrack).percent} color="blue" /></div></section>
    <section className="panel syllabus-filters"><div className="search-field"><Search size={18} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={translate("Buscar disciplina, assunto ou subassunto...")} aria-label={translate("Buscar conteúdo programático")} />{search && <button className="clear-search" onClick={() => setSearch('')} aria-label={translate("Limpar busca")}><X size={15} /></button>}</div><label className="select-field"><span>{translate("Trilha")}</span><select value={selectedTrack} onChange={event => setSelectedTrack(event.target.value)}><option value="all">{translate("Todas as trilhas")}</option>{TRACKS.map(track => <option value={track.id} key={track.id}>{track.short}</option>)}</select></label><label className="select-field status-filter"><span>{translate("Status")}</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="all">{translate("Todos os itens")}</option><option value="pending">{translate("Não iniciados")}</option><option value="doing">{translate("Em andamento")}</option><option value="done">{translate("Concluídos")}</option></select></label></section>
    {selectedTrackObject && <div className="track-context-note"><div className={`track-mini-icon track-${selectedTrackObject.color}`}><Icon name={selectedTrackObject.icon} size={18} /></div><div><strong>{selectedTrackObject.label}</strong><span>{selectedTrackObject.description}</span></div><button className="text-button" onClick={() => setSelectedTrack('all')}>{translate("Ver todas as trilhas")}{' '}<X size={14} /></button></div>}
    <div className="status-legend"><span><Circle size={13} /> {translate("Não iniciado")}</span><span><Clock3 size={13} /> {translate("Em andamento")}</span><span><CheckCircle2 size={13} /> {translate("Concluído")}</span><small>{translate("Clique no ícone ao lado de um subassunto para avançar seu status.")}</small></div>
    <div className="syllabus-results-heading"><span><strong>{filtered.length}</strong> {translate("disciplinas ·")}{' '}<strong>{allVisibleCount}</strong> {translate("subassuntos exibidos")}</span><span><CheckCircle2 size={15} /> {topicProgress(data, selectedTrack).percent}{translate("% concluído nesta visão")}</span></div>
    {filtered.length ? <div className="syllabus-list">{filtered.map(({ subject, groups, done, doing, total, percent }) => {
      const isOpen = Boolean(expandedSubjects[subject.id]);
      const SubjectIcon = ICONS[subject.icon] || BookOpen;
      return <article className={`syllabus-subject-card ${isOpen ? 'subject-open' : ''}`} key={subject.id}>
        <button className="syllabus-subject-heading" onClick={() => setExpandedSubjects(previous => ({ ...previous, [subject.id]: !previous[subject.id] }))} aria-expanded={isOpen}>
          <div className={`subject-main-icon icon-${subject.color}`}><SubjectIcon size={21} strokeWidth={1.8} /></div>
          <div className="subject-heading-copy"><div className="subject-heading-title"><h3>{subject.title}</h3><span className="subject-category-tag">{subject.category}</span></div><p>{subject.description}</p><div className="subject-heading-meta"><span className={`priority-tag priority-${slug(subject.priority)}`}>{translate("Prioridade")}{' '}{subject.priority.toLowerCase()}</span><span>{subject.estimate}</span><span>{groups.length} {translate("blocos de assunto")}</span></div></div>
          <div className="subject-progress-block"><strong>{percent}{translate("%")}</strong><span>{done}{translate("/")}{total} {translate("concluídos")}{doing ? ` · ${doing} em andamento` : ''}</span><ProgressBar value={percent} color={subject.color} height={6} /></div>
          <div className="expand-icon">{isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
        </button>
        {isOpen && <div className="subject-groups">{groups.map(group => {
          const expandedKey = `${subject.id}|${group.topicId}`;
          const groupOpen = Boolean(expandedGroups[expandedKey]) || Boolean(search.trim());
          const doneCount = group.doneCount;
          return <section className="topic-group" key={group.topicId}><button className="topic-group-heading" onClick={() => setExpandedGroups(previous => ({ ...previous, [expandedKey]: !previous[expandedKey] }))} aria-expanded={groupOpen}><span className="topic-number">{group.title.split('·')[0].trim()}</span><span className="topic-group-title">{group.title.split('·').slice(1).join('·').trim()}</span><span className="topic-count">{doneCount}{translate("/")}{group.allCount}{group.doingCount ? ` · ${group.doingCount} em curso` : ''}</span><div className="topic-group-progress"><ProgressBar value={group.allCount ? doneCount / group.allCount * 100 : 0} color={subject.color} height={4} /></div>{groupOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</button>
            {groupOpen && <div className="subtopic-list">{group.items.map((item, itemIndex) => <div key={item.id} className={`subtopic-item subtopic-${item.status}`}><button type="button" className={`subtopic-state state-${item.status}`} title={item.status === 'not' ? 'Não iniciado — clique para marcar em andamento' : item.status === 'doing' ? 'Em andamento — clique para marcar como concluído' : 'Concluído — clique para reabrir'} aria-label={`${item.label}: ${item.status === 'not' ? 'não iniciado' : item.status === 'doing' ? 'em andamento' : 'concluído'}. Clique para avançar o status.`} aria-pressed={item.status === 'done'} onClick={() => toggleTopic(item.id)}>{item.status === 'done' ? <Check size={13} /> : item.status === 'doing' ? <Clock3 size={12} /> : <Circle size={12} />}</button><span className="subtopic-label">{item.label}</span><span className="subtopic-index">{String(itemIndex + 1).padStart(2, '0')}</span></div>)}</div>}
          </section>;
        })}{!groups.length && <div className="empty-state"><Search size={22} /><strong>{translate("Nenhum subassunto encontrado")}</strong><p>{translate("Altere a busca ou os filtros para ver outros itens.")}</p></div>}</div>}
      </article>;
    })}</div> : <div className="panel empty-state"><Search size={30} /><h3>{translate("Nenhum conteúdo encontrado")}</h3><p>{translate("Experimente limpar a busca ou mudar a trilha e o status.")}</p><button className="button button-secondary" onClick={() => { setSearch(''); setStatus('all'); setSelectedTrack('all'); }}>{translate("Limpar filtros")}</button></div>}
    <section className="content-notice"><CircleAlert size={19} /><div><strong>{translate("Matriz de preparação, não previsão de edital")}</strong><p>{translate("Os assuntos foram organizados a partir de programas e editais anteriores e ampliados para servir como trilha de estudo. Alguns tópicos são condicionais. Quando um edital for publicado, ajuste a matriz ao conteúdo oficial, aos pesos e aos critérios de eliminação.")}</p></div></section>
  </div>;
}

function TracksPage({ data, trackProgress, setSelectedTrack, setView }) {
  return <div className="page-stack">
    <section className="tracks-intro panel"><div className="tracks-intro-icon"><Building2 size={26} /></div><div><span className="section-kicker">{translate("VISÃO POR OBJETIVO")}</span><h3>{translate("Uma preparação, diferentes caminhos.")}</h3><p>{translate("Use a base comum para ganhar eficiência, mas avalie cada cargo com seu próprio conteúdo e desempenho. A porcentagem abaixo mede subtópicos marcados como estudados.")}</p></div></section>
    <div className="track-cards-grid">{trackProgress.map(({ track, total, done, percent }) => { const TrackIcon = ICONS[track.icon] || Building2; const related = SUBJECTS.filter(subject => subject.tracks.includes(track.id)); const common = related.filter(subject => subject.tracks.length > 1).length; return <article className={`track-detail-card track-card-${track.color}`} key={track.id}><div className="track-card-top"><div className={`track-card-icon track-${track.color}`}><TrackIcon size={24} /></div><span className="track-card-kicker">{track.institution}</span></div><h3>{track.label}</h3><p>{track.description}</p><div className="track-card-metrics"><div><strong>{percent}{translate("%")}</strong><span>{translate("conteúdo concluído")}</span></div><div><strong>{done}{translate("/")}{total}</strong><span>{translate("subtópicos marcados")}</span></div></div><ProgressBar value={percent} color={track.color} height={8} /><div className="track-card-footer"><span><BookOpenText size={15} />{related.length} {translate("disciplinas na trilha")}</span><span>{common} {translate("compartilhadas")}</span></div><button className="button button-secondary full-width" onClick={() => { setSelectedTrack(track.id); setView('syllabus'); }}>{translate("Abrir conteúdo desta trilha")}{' '}<ArrowRight size={15} /></button></article>; })}</div>
    <section className="panel shared-matters-panel"><div className="panel-heading"><div><span className="section-kicker">{translate("ESTRATÉGIA")}</span><h3>{translate("Como aproveitar as disciplinas compartilhadas")}</h3><p>{translate("Os nomes podem se repetir entre concursos, mas o peso e a abordagem não são necessariamente iguais.")}</p></div><div className="shared-icon"><Workflow size={21} /></div></div><div className="shared-matter-grid"><InfoCard Icon={BookOpenText} title={translate("Português")} text="Manter contato frequente e analisar erros de interpretação, sintaxe e reescrita. É a prioridade central da sua rotina." /><InfoCard Icon={Calculator} title={translate("Matemática e lógica")} text="Construir fundamentos antes de avançar para lógica formal, matemática financeira e estatística, conforme o edital." /><InfoCard Icon={Target} title={translate("Conteúdos específicos")} text="Separar TI, Administração Pública e Conhecimentos Bancários em trilhas próprias, sem presumir que todo assunto vale para todos os cargos." /></div></section>
  </div>;
}

function AccuracyChart({ trend, compact = false }) {
  if (!trend.length) return <div className={`chart-empty ${compact ? 'chart-empty-compact' : ''}`}><div className="chart-empty-icon"><BarChart3 size={24} /></div><strong>{translate("Sua curva começa no primeiro registro")}</strong><p>{translate("Registre sessões com questões respondidas e acertos para visualizar a evolução percentual por semana.")}</p></div>;
  const width = 680;
  const height = compact ? 210 : 270;
  const pad = { left: 38, right: 20, top: 18, bottom: 34 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const points = trend.map((item, index) => ({ ...item, x: pad.left + (trend.length === 1 ? plotW / 2 : index / (trend.length - 1) * plotW), y: pad.top + (100 - item.accuracy) / 100 * plotH }));
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const targetY = pad.top + (100 - 80) / 100 * plotH;
  return <div className="accuracy-chart-wrap"><svg className="accuracy-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={translate("Gráfico da taxa de acertos por semana")}>
    {[0, 25, 50, 75, 100].map(tick => { const y = pad.top + (100 - tick) / 100 * plotH; return <g key={tick}><line x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="chart-grid-line" /><text x={pad.left - 9} y={y + 4} textAnchor="end" className="chart-axis-label">{tick}{translate("%")}</text></g>; })}
    <line x1={pad.left} x2={width - pad.right} y1={targetY} y2={targetY} className="chart-target-line" />
    <path d={path} className="chart-line" />
    {points.map(point => <g key={point.start}><circle cx={point.x} cy={point.y} r={4.5} className="chart-point" /><circle cx={point.x} cy={point.y} r={8} className="chart-point-halo" /><text x={point.x} y={height - 11} textAnchor="middle" className="chart-axis-label">{point.label}</text><title>{`${point.label}: ${point.accuracy}% em ${point.questions} questões`}</title></g>)}
  </svg>{!compact && <div className="chart-data-strip">{trend.slice(-4).map(item => <div key={item.start}><span>{item.label}</span><strong>{item.accuracy}{translate("%")}</strong><small>{item.questions} {translate("questões ·")}{' '}{item.hours.toLocaleString(intlLocale(), { maximumFractionDigits: 1 })}{translate("h")}</small></div>)}</div>}</div>;
}

function PerformancePage({ data, stats, selectedWeek, trend, deleteSession, openGeneralLog }) {
  const [filterSubject, setFilterSubject] = useState('all');
  const sessions = [...data.sessions].sort((a, b) => `${b.date}-${b.id}`.localeCompare(`${a.date}-${a.id}`));
  const filteredSessions = sessions.filter(session => filterSubject === 'all' || session.subjectId === filterSubject);
  const subjectStats = SUBJECTS.map(subject => {
    const subset = data.sessions.filter(item => item.subjectId === subject.id);
    const questions = subset.reduce((sum, item) => sum + (Number(item.questions) || 0), 0);
    const correct = subset.reduce((sum, item) => sum + Math.min(Number(item.correct) || 0, Number(item.questions) || 0), 0);
    const minutes = subset.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);
    return { subject, questions, correct, minutes, accuracy: questions ? safePercent(correct / questions * 100) : 0, sessions: subset.length };
  }).filter(item => item.minutes || item.questions).sort((a, b) => b.minutes - a.minutes);
  const totalQuestions = data.sessions.reduce((sum, item) => sum + (Number(item.questions) || 0), 0);
  const totalCorrect = data.sessions.reduce((sum, item) => sum + Math.min(Number(item.correct) || 0, Number(item.questions) || 0), 0);
  const allAccuracy = totalQuestions ? safePercent(totalCorrect / totalQuestions * 100) : 0;
  return <div className="page-stack">
    <section className="performance-summary-grid"><div className="performance-highlight panel"><span className="section-kicker">{translate("VISÃO ACUMULADA")}</span><h3>{translate("Dados para decidir o que estudar a seguir.")}</h3><p>{translate("Use os registros para encontrar lacunas reais. Uma taxa de acertos só é comparável quando você pratica questões de dificuldade semelhante.")}</p><button className="button button-primary" onClick={openGeneralLog}><Plus size={16} /> {translate("Registrar sessão")}</button></div><div className="performance-kpis"><div className="mini-kpi"><Clock3 size={18} /><span>{translate("Tempo total")}</span><strong>{formatDuration(data.sessions.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0))}</strong></div><div className="mini-kpi"><ListChecks size={18} /><span>{translate("Questões")}</span><strong>{totalQuestions}</strong></div><div className="mini-kpi"><Target size={18} /><span>{translate("Taxa global de acertos")}</span><strong>{totalQuestions ? `${allAccuracy}%` : '—'}</strong></div><div className="mini-kpi"><CalendarCheck size={18} /><span>{translate("Sessões registradas")}</span><strong>{data.sessions.length}</strong></div></div></section>
    <section className="panel performance-chart-panel"><div className="panel-heading"><div><span className="section-kicker">{translate("TENDÊNCIA")}</span><h3>{translate("Curva de aprendizagem")}</h3><p>{translate("A linha representa a taxa de acertos calculada a partir dos registros de cada semana.")}</p></div><div className="chart-target-badge"><span className="target-line-preview" />{translate("80% · referência visual")}</div></div><AccuracyChart trend={trend} /><div className="chart-footnote"><CircleHelp size={15} /> {translate("Sem pelo menos uma questão registrada, uma semana não aparece na curva. O gráfico não atribui progresso fictício.")}</div></section>
    <section className="panel subject-performance-panel"><div className="panel-heading"><div><span className="section-kicker">{translate("DIAGNÓSTICO")}</span><h3>{translate("Desempenho por disciplina")}</h3><p>{translate("Identifique onde investir tempo de teoria e revisão.")}</p></div></div>{subjectStats.length ? <div className="subject-performance-list">{subjectStats.map(item => <div key={item.subject.id} className="subject-performance-row"><div className={`subject-mini-icon icon-${item.subject.color}`}><Icon name={item.subject.icon} size={17} /></div><div className="subject-performance-title"><strong>{item.subject.title}</strong><span>{item.sessions} {translate("sessões ·")}{' '}{formatDuration(item.minutes)} {translate("·")}{' '}{item.questions} {translate("questões")}</span></div><div className="subject-performance-bar"><ProgressBar value={item.accuracy} color={item.subject.color} height={7} /><small>{item.questions ? `${item.accuracy}% de acertos` : 'Sem questões registradas'}</small></div><div className={`accuracy-number ${item.accuracy >= 80 && item.questions ? 'accuracy-good' : item.questions && item.accuracy < 60 ? 'accuracy-low' : ''}`}>{item.questions ? `${item.accuracy}%` : '—'}</div></div>)}</div> : <EmptyState Icon={BarChart3} title={translate("Ainda não há dados por disciplina")} text="Registre suas primeiras sessões com tempo e, quando possível, quantidade de questões e acertos." actionLabel="Registrar sessão" action={openGeneralLog} />}</section>
    <section className="panel sessions-panel"><div className="panel-heading"><div><span className="section-kicker">{translate("HISTÓRICO")}</span><h3>{translate("Sessões de estudo")}</h3><p>{translate("Os registros alimentam as horas, a frequência e a curva de aprendizagem.")}</p></div><label className="select-field session-filter"><span>{translate("Disciplina")}</span><select value={filterSubject} onChange={event => setFilterSubject(event.target.value)}><option value="all">{translate("Todas")}</option>{SUBJECTS.map(subject => <option key={subject.id} value={subject.id}>{subject.title}</option>)}</select></label></div>{filteredSessions.length ? <div className="sessions-table-wrap"><table className="sessions-table"><thead><tr><th>{translate("Data")}</th><th>{translate("Disciplina")}</th><th>{translate("Tempo")}</th><th>{translate("Questões")}</th><th>{translate("Acertos")}</th><th>{translate("Observação")}</th><th aria-label={translate("Ações")} /></tr></thead><tbody>{filteredSessions.slice(0, 40).map(session => <tr key={session.id}><td>{formatDate(parseDate(session.date), { day: '2-digit', month: 'short', year: 'numeric' })}</td><td><strong>{subjectById(session.subjectId).title}</strong></td><td>{formatDuration(session.minutes)}</td><td>{session.questions || '—'}</td><td>{session.questions ? `${safePercent(session.correct / session.questions * 100)}%` : '—'}</td><td className="session-note-cell">{session.note || '—'}</td><td><button className="icon-button delete-session" title={translate("Excluir registro")} aria-label={translate("Excluir registro")} onClick={() => deleteSession(session.id)}><X size={15} /></button></td></tr>)}</tbody></table></div> : <EmptyState Icon={NotebookPen} title={translate("Seu histórico ainda está vazio")} text="Registre as sessões para formar uma visão confiável de tempo, questões e acertos." actionLabel="Adicionar primeira sessão" action={openGeneralLog} />}</section>
    <section className="content-notice"><CircleAlert size={19} /><div><strong>{translate("Como interpretar sua evolução")}</strong><p>{translate("Uma semana pode ter menos acertos por conter questões mais difíceis. Combine taxa de acerto, volume de questões, tempo dedicado e revisão dos erros antes de mudar a estratégia.")}</p></div></section>
  </div>;
}

function EmptyState({ Icon: EmptyIcon, title, text, actionLabel, action }) {
  return <div className="empty-state"><div className="empty-icon"><EmptyIcon size={24} /></div><h3>{title}</h3><p>{text}</p>{action && <button className="button button-secondary" onClick={action}>{actionLabel || 'Continuar'} <ArrowRight size={15} /></button>}</div>;
}

function SettingsPage({ data, updateData, exportBackup, importBackup, supabaseConfigured, session, cloudStatus, cloudError, onSignOut, onRetrySync, locale = 'pt-BR', onLocaleChange = () => {}, tx = value => value }) {
  const [hours, setHours] = useState(String(data.targetHours || PLANNED_HOURS_PER_WEEK));
  useEffect(() => setHours(String(data.targetHours || PLANNED_HOURS_PER_WEEK)), [data.targetHours]);
  const saveHours = () => {
    const parsed = Math.min(60, Math.max(1, Number(hours) || PLANNED_HOURS_PER_WEEK));
    updateData(previous => ({ ...previous, targetHours: parsed }));
  };
  return <div className="page-stack settings-stack">
    <section className="settings-card panel"><div className="settings-card-heading"><div className="settings-icon"><Database size={21} /></div><div><h3>{translate("Conta e sincronização")}</h3><p>{translate(supabaseConfigured ? 'Sua preparação fica associada à sua conta e pode ser acessada em outros dispositivos.' : 'A conexão com o Supabase ainda não foi configurada nesta versão do site.')}</p></div></div>{supabaseConfigured ? <div className="cloud-account-panel"><div className="cloud-account-status"><span className={`cloud-status-indicator ${cloudStatus === 'error' ? 'error' : cloudStatus === 'synced' ? 'online' : ''}`} /><div><strong>{session?.user?.email || translate('Conta autenticada')}</strong><span>{tx(({ loading: 'Carregando seus dados…', saving: 'Salvando alterações na nuvem…', synced: 'Tudo sincronizado', error: 'Atenção: sincronização com erro', connecting: 'Conectando…' })[cloudStatus] || 'Conectado')}</span></div></div>{cloudError && <div className="cloud-inline-error"><CircleAlert size={16} />{cloudError}</div>}<div className="cloud-account-actions"><button className="button button-secondary" onClick={onRetrySync}><RefreshCw size={16} /> {translate("Tentar sincronizar")}</button><button className="button button-secondary" onClick={onSignOut}><LockKeyhole size={16} /> {translate("Sair da conta")}</button></div></div> : <div className="cloud-setup-instructions"><p>{translate("Para ativar a sincronização entre computadores:")}</p><ol><li>{translate("Execute")}{' '}<code>{translate("supabase/schema.sql")}</code> {translate("no SQL Editor do seu projeto Supabase.")}</li><li>{translate("Configure")}{' '}<code>{translate("VITE_SUPABASE_URL")}</code> {translate("e")}{' '}<code>{translate("VITE_SUPABASE_PUBLISHABLE_KEY")}</code> {translate("como variáveis no GitHub Actions.")}</li><li>{translate("Publique novamente pelo workflow do GitHub Pages e crie sua conta no StudyMaximizer.")}</li></ol><p>{translate("Para testar localmente, copie")}{' '}<code>{translate(".env.example")}</code> {translate("para")}{' '}<code>{translate(".env.local")}</code> {translate("e informe os mesmos valores.")}</p></div>}</section>
    <section className="settings-card panel"><div className="settings-card-heading"><div className="settings-icon"><Target size={21} /></div><div><h3>{translate("Meta semanal de estudo")}</h3><p>{translate("O cronograma atual foi planejado para 15 horas. Altere a meta se sua disponibilidade mudar.")}</p></div></div><div className="settings-control-row"><label htmlFor="target-hours">{translate("Horas líquidas por semana")}</label><div className="hours-control"><input id="target-hours" type="number" min="1" max="60" step="0.5" value={hours} onChange={event => setHours(event.target.value)} /><span>{translate("horas")}</span><button className="button button-primary" onClick={saveHours}>{translate("Salvar meta")}</button></div></div><div className="setting-hint"><CircleHelp size={15} /> {translate("Alterar a meta ajusta os indicadores de desempenho; os blocos do cronograma somam 15 horas e podem ser reorganizados manualmente conforme sua rotina.")}</div></section>
    <section className="settings-card panel"><div className="settings-card-heading"><div className="settings-icon"><Moon size={21} /></div><div><h3>{tx('Aparência')}</h3><p>{tx('Escolha um tema confortável para estudar de dia ou à noite.')}</p></div></div><div className="theme-options"><button className={`theme-option ${data.theme === 'system' ? 'selected' : ''}`} onClick={() => updateData(previous => ({ ...previous, theme: 'system' }))}><div className="theme-preview theme-preview-system"><Sun size={16} /><Moon size={16} /></div><div><strong>{tx('Seguir sistema')}</strong><small>{tx('Usar a preferência de aparência do dispositivo.')}</small></div>{data.theme === 'system' && <CheckCircle2 size={19} />}</button><button className={`theme-option ${data.theme === 'light' ? 'selected' : ''}`} onClick={() => updateData(previous => ({ ...previous, theme: 'light' }))}><div className="theme-preview theme-preview-light"><div /><span /></div><div><strong>{tx('Tema claro')}</strong><small>{tx('Leve e luminoso')}</small></div>{data.theme === 'light' && <CheckCircle2 size={19} />}</button><button className={`theme-option ${data.theme === 'dark' ? 'selected' : ''}`} onClick={() => updateData(previous => ({ ...previous, theme: 'dark' }))}><div className="theme-preview theme-preview-dark"><div /><span /></div><div><strong>{tx('Tema escuro')}</strong><small>{tx('Reduz a luminosidade')}</small></div>{data.theme === 'dark' && <CheckCircle2 size={19} />}</button></div></section>
    <section className="settings-card panel"><div className="settings-card-heading"><div className="settings-icon"><Languages size={21} /></div><div><h3>{tx('Idioma da interface')}</h3><p>{tx('Escolha o idioma da interface. O conteúdo programático permanece em português para preservar os termos de estudo.')}</p></div></div><div className="settings-control-row"><label htmlFor="interface-language">{tx('Idioma')}</label><select id="interface-language" value={locale} onChange={event => onLocaleChange(event.target.value)}>{SUPPORTED_LOCALES.map(item => <option value={item.code} key={item.code}>{item.label}</option>)}</select></div></section>
    <section className="settings-card panel"><div className="settings-card-heading"><div className="settings-icon"><LockKeyhole size={21} /></div><div><h3>{translate("Dados e backup")}</h3><p>{translate(supabaseConfigured ? 'O progresso é sincronizado com sua conta; o backup continua disponível como cópia de segurança.' : 'O progresso é salvo no armazenamento local deste navegador, não na nuvem.')}</p></div></div><div className="backup-actions"><div className="backup-action"><div className="backup-action-icon"><Download size={20} /></div><div><strong>{translate("Exportar backup")}</strong><p>{translate("Baixe um arquivo JSON com seus registros, atividades e conteúdos marcados.")}</p></div><button className="button button-secondary" onClick={exportBackup}><ArrowDownToLine size={16} /> {translate("Exportar")}</button></div><div className="backup-action"><div className="backup-action-icon"><Upload size={20} /></div><div><strong>{translate("Importar backup")}</strong><p>{translate("Restaure dados de um arquivo JSON previamente exportado do StudyMaximizer.")}</p></div><button className="button button-secondary" onClick={importBackup}><Upload size={16} /> {translate("Importar")}</button></div></div><div className="backup-warning"><CircleAlert size={16} /><span>{translate("Importar um backup substitui os dados atuais. Exporte uma cópia antes de restaurar outro arquivo.")}</span></div></section>
    <section className="settings-card panel sources-panel"><div className="settings-card-heading"><div className="settings-icon"><FileText size={21} /></div><div><h3>{translate("Editais e programas de referência")}</h3><p>{translate("O conteúdo é uma matriz de partida baseada em editais anteriores, não uma previsão dos próximos editais.")}</p></div></div><div className="source-list">{SOURCES.map((source, index) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url} className="source-item"><span className="source-index">{String(index + 1).padStart(2, '0')}</span><span className="source-copy"><strong>{source.name}</strong><small>{source.note}</small></span><ExternalLink size={17} /></a>)}</div><div className="source-note"><CircleHelp size={16} /><p>{translate("Ao sair edital novo, compare o conteúdo programático, os pesos, a banca, a redação e os critérios eliminatórios. Retire ou acrescente tópicos conforme a publicação oficial e suas retificações.")}</p></div></section>
    <section className="settings-card panel about-panel"><div className="settings-card-heading"><div className="settings-icon"><GraduationCap size={21} /></div><div><h3>{translate("Sobre o StudyMaximizer")}</h3><p>{translate("Uma ferramenta pessoal de planejamento, execução e revisão para concursos.")}</p></div></div><div className="about-feature-grid"><div><CheckCircle2 size={17} /><span>{translate("Progresso por disciplina, assunto e subassunto")}</span></div><div><CheckCircle2 size={17} /><span>{translate("Trilhas independentes por cargo")}</span></div><div><CheckCircle2 size={17} /><span>{translate("Gamificação com desenvolvimento e frequência")}</span></div><div><CheckCircle2 size={17} /><span>{translate("Curva de acertos baseada em registros reais")}</span></div><div><CheckCircle2 size={17} /><span>{translate("Backup JSON e sincronização na nuvem quando configurada")}</span></div><div><CheckCircle2 size={17} /><span>{translate("Compatível com publicação estática no GitHub Pages")}</span></div></div></section>
  </div>;
}

function SessionModal({ initial, onClose, onSave, storageLabel, tx = value => value }) {
  const [subjectId, setSubjectId] = useState(initial.subjectId || 'portugues');
  const [track, setTrack] = useState(initial.track || 'all');
  const [date, setDate] = useState(initial.date || dateKey(new Date()));
  const [minutes, setMinutes] = useState(String(initial.minutes || 45));
  const [questions, setQuestions] = useState('');
  const [correct, setCorrect] = useState('');
  const [note, setNote] = useState(initial.note || '');
  const [error, setError] = useState('');
  useEffect(() => {
    const handleKey = event => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);
  const submit = event => {
    event.preventDefault();
    const minuteValue = Number(minutes);
    const questionValue = Math.max(0, Number(questions) || 0);
    const correctValue = Math.max(0, Number(correct) || 0);
    if (!date || !Number.isFinite(minuteValue) || minuteValue < 1 || minuteValue > 1440) { setError(tx('Informe uma data e um tempo válido entre 1 e 1.440 minutos.')); return; }
    if (correctValue > questionValue) { setError(tx('A quantidade de acertos não pode ser maior que a quantidade de questões.')); return; }
    onSave({ id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`, date, subjectId, track, minutes: minuteValue, questions: questionValue, correct: correctValue, note: note.trim() });
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className="session-modal" role="dialog" aria-modal="true" aria-labelledby="session-modal-title"><div className="modal-heading"><div className="modal-title-icon"><NotebookPen size={21} /></div><div><span className="section-kicker">{translate("REGISTRO DE ATIVIDADE")}</span><h2 id="session-modal-title">{translate("Registrar sessão de estudo")}</h2><p>{translate("Registre o que aconteceu de fato. Esses dados alimentam seu histórico e a curva de acertos.")}</p></div><button className="icon-button" aria-label={translate("Fechar")} onClick={onClose}><X size={20} /></button></div><form onSubmit={submit} className="session-form"><div className="form-grid"><label className="form-field form-field-wide"><span>{translate("Disciplina")}</span><select value={subjectId} onChange={event => setSubjectId(event.target.value)}>{SUBJECTS.map(subject => <option key={subject.id} value={subject.id}>{subject.title}</option>)}</select></label><label className="form-field"><span>{translate("Trilha / cargo")}</span><select value={track} onChange={event => setTrack(event.target.value)}><option value="all">{translate("Base comum / avulsa")}</option>{TRACKS.map(item => <option key={item.id} value={item.id}>{item.short}</option>)}</select></label><label className="form-field"><span>{translate("Data do estudo")}</span><input type="date" value={date} onChange={event => setDate(event.target.value)} required /></label><label className="form-field"><span>{translate("Tempo efetivo (minutos)")}</span><input type="number" min="1" max="1440" value={minutes} onChange={event => setMinutes(event.target.value)} required /></label><label className="form-field"><span>{translate("Questões resolvidas")}</span><input type="number" min="0" max="10000" value={questions} onChange={event => setQuestions(event.target.value)} placeholder={translate("Ex.: 20")} /></label><label className="form-field"><span>{translate("Acertos")}</span><input type="number" min="0" max="10000" value={correct} onChange={event => setCorrect(event.target.value)} placeholder={translate("Ex.: 14")} /></label><label className="form-field form-field-wide"><span>{translate("Observação / assunto estudado")}</span><textarea value={note} onChange={event => setNote(event.target.value)} placeholder={translate("Ex.: interpretação de texto — errei inferências e conectivos")} rows="3" /></label></div>{error && <div className="form-error"><CircleAlert size={15} />{error}</div>}<div className="modal-footer"><span><LockKeyhole size={14} /> {storageLabel || 'Salvo neste navegador'}</span><div><button type="button" className="button button-secondary" onClick={onClose}>{translate("Cancelar")}</button><button type="submit" className="button button-primary"><Check size={16} /> {translate("Salvar sessão")}</button></div></div></form></section></div>;
}

export default App;
