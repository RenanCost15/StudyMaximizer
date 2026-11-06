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

const STORAGE_KEY = 'studymaximizer-react-v2';
const CLOUD_MIGRATION_OWNER_KEY = 'studymaximizer-cloud-migration-owner-v1';
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
  version: 2,
  theme: 'light',
  completedTasks: {},
  topicDone: {},
  topicStatus: {},
  sessions: [],
  targetHours: PLANNED_HOURS_PER_WEEK,
};

function normalizeAppState(value) {
  const input = value && typeof value === 'object' ? value : {};
  return {
    ...emptyState,
    ...input,
    version: 2,
    theme: input.theme === 'dark' ? 'dark' : 'light',
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
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw);
    if (parsed.version >= 2 && parsed.sessions && parsed.completedTasks) {
      return { ...emptyState, ...parsed, topicDone: parsed.topicDone && typeof parsed.topicDone === 'object' ? parsed.topicDone : {}, topicStatus: parsed.topicStatus && typeof parsed.topicStatus === 'object' ? parsed.topicStatus : {}, sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [] };
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
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
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
function formatDate(value, options = { day: '2-digit', month: 'short' }) {
  return new Intl.DateTimeFormat('pt-BR', options).format(value);
}
function formatLongDate(value) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(value);
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
    if (!supabaseConfigured) {
      setAuthLoading(false);
      setCloudReady(true);
      setCloudStatus('local');
      return undefined;
    }
    let alive = true;
    supabase.auth.getSession().then(({ data: result, error }) => {
      if (!alive) return;
      if (error) setCloudError(error.message || 'Não foi possível consultar a sessão.');
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
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!alive) return;
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
        setCloudError(`Não foi possível carregar seus dados: ${error.message}`);
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
        setCloudError(`Não foi possível iniciar seu espaço na nuvem: ${saveError.message}`);
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
        setCloudError(`Não foi possível sincronizar: ${error.message}`);
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
          setCloudError('A conexão de atualização em tempo real caiu. Os salvamentos automáticos continuam tentando funcionar.');
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, cloudReady]);
  useEffect(() => {
    document.documentElement.dataset.theme = data.theme;
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.content = data.theme === 'dark' ? '#111520' : '#f6f7fb';
  }, [data.theme]);
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

  const notify = message => setToast(message);
  const updateData = fn => setData(previous => typeof fn === 'function' ? fn(previous) : ({ ...previous, ...fn }));
  const handleSignOut = async () => {
    if (!supabaseConfigured) return;
    if (cloudStatus === 'saving') {
      notify('Aguarde a sincronização terminar antes de sair.');
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) setCloudError(`Não foi possível sair da conta: ${error.message}`);
  };
  const retryCloudSync = () => {
    setCloudError('');
    setCloudPushRetry(value => value + 1);
  };
  const toggleTheme = () => updateData(previous => ({ ...previous, theme: previous.theme === 'dark' ? 'light' : 'dark' }));
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
        version: 2,
        completedTasks: parsed.completedTasks || {},
        topicDone: parsed.topicDone || {},
        topicStatus: parsed.topicStatus || {},
        sessions: parsed.sessions,
        targetHours: Math.max(1, Number(parsed.targetHours) || PLANNED_HOURS_PER_WEEK),
        theme: parsed.theme === 'dark' ? 'dark' : 'light',
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
    { id: 'overview', label: 'Visão geral', Icon: LayoutDashboard },
    { id: 'schedule', label: 'Cronograma semanal', Icon: CalendarDays },
    { id: 'syllabus', label: 'Conteúdo programático', Icon: BookOpenText, pill: `${totalContentProgress.done}/${totalContentProgress.total}` },
    { id: 'tracks', label: 'Progresso por cargo', Icon: Building2 },
    { id: 'performance', label: 'Desempenho', Icon: BarChart3 },
  ];
  const pageTitles = {
    overview: ['Visão geral', 'Uma visão clara do que você fez, do que falta e do que merece atenção.'],
    schedule: ['Cronograma semanal', 'Organize sua semana, conclua tarefas e registre cada sessão.'],
    syllabus: ['Conteúdo programático', 'Assuntos e subassuntos detalhados para acompanhar sua evolução por tópico.'],
    tracks: ['Progresso por cargo', 'Compare sua preparação para cada caminho e descubra onde concentrar esforço.'],
    performance: ['Desempenho e curva de aprendizagem', 'Acompanhe horas, questões, acertos e evolução ao longo das semanas.'],
    settings: ['Configurações e fontes', 'Personalize metas, proteja seus registros e consulte os editais de referência.'],
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
      onSignOut={handleSignOut} onRetrySync={retryCloudSync}
    />;
    return <OverviewPage
      data={data} stats={getWeekStats(data, startOfWeek(new Date()))} gamification={gamification} trend={trend}
      subjectProgressList={subjectProgressList} trackProgress={trackProgress} totalContentProgress={totalContentProgress}
      todayKey={todayKey} today={today} toggleTask={toggleTask} openLog={openLogForTask}
      openSchedule={() => setView('schedule')} openContent={() => setView('syllabus')} openPerformance={() => setView('performance')} openTracks={() => setView('tracks')}
    />;
  };

  if (supabaseConfigured && authLoading) {
    return <CloudStartupScreen title="Conferindo sua sessão" text="Conectando o StudyMaximizer à sua conta com segurança." />;
  }
  if (supabaseConfigured && !session) {
    return <AuthScreen />;
  }
  if (supabaseConfigured && session && !cloudReady) {
    return <CloudStartupScreen
      title={cloudStatus === 'error' ? 'Não foi possível carregar seus dados' : 'Sincronizando seus dados'}
      text={cloudStatus === 'error' ? (cloudError || 'Confira se executou o arquivo supabase/schema.sql no SQL Editor do Supabase.') : 'Estamos carregando seu progresso salvo na nuvem.'}
      error={cloudStatus === 'error'} onRetry={() => setCloudRetry(value => value + 1)}
      onSignOut={handleSignOut}
    />;
  }

  const cloudStatusText = ({
    local: 'Salvo neste navegador', connecting: 'Conectando à nuvem…', loading: 'Carregando nuvem…',
    saving: 'Sincronizando…', synced: 'Sincronizado na nuvem', error: 'Falha na sincronização',
    'signed-out': 'Sessão encerrada',
  })[cloudStatus] || 'Sincronização automática';

  return (
    <div className="app-shell" data-theme={data.theme}>
      {mobileMenuOpen && <button className="mobile-scrim" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} />}
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><GraduationCap size={25} strokeWidth={2.2} /></div>
          <div className="brand-name-wrap"><span className="brand-name">StudyMaximizer</span><span className="brand-caption">STUDY WITH PURPOSE</span></div>
          <button className="icon-button sidebar-close" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)}><X size={18} /></button>
        </div>
        <div className="sidebar-profile">
          <div className="profile-avatar"><BookOpen size={20} /></div>
          <div className="profile-copy"><strong>{session?.user?.email || 'Minha preparação'}</strong><span>{supabaseConfigured ? 'Conta sincronizada' : 'Concursos 2027 · ciclo-base'}</span></div>
          <span className={`profile-dot ${cloudStatus === 'error' ? 'profile-dot-error' : ''}`} title={cloudStatusText} />
        </div>
        <div className="nav-label">ACOMPANHAMENTO</div>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => { setView(item.id); setMobileMenuOpen(false); }}>
              <item.Icon size={19} strokeWidth={1.8} /><span>{item.label}</span>
              {item.pill && <small className="nav-pill">{item.pill}</small>}
              {view === item.id && <span className="nav-active-edge" />}
            </button>
          ))}
        </nav>
        <div className="nav-label nav-label-spaced">SISTEMA</div>
        <nav className="sidebar-nav" aria-label="Ferramentas">
          <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => { setView('settings'); setMobileMenuOpen(false); }}>
            <Settings2 size={19} strokeWidth={1.8} /><span>Configurações e fontes</span>{view === 'settings' && <span className="nav-active-edge" />}
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-goal">
            <div className="goal-icon"><Target size={18} /></div>
            <div><strong>Meta semanal</strong><span>{data.targetHours || 15} horas de estudo</span></div>
            <button aria-label="Editar meta" className="tiny-icon-button" onClick={() => setView('settings')}><Settings2 size={14} /></button>
          </div>
          <div className="sidebar-note"><LockKeyhole size={14} /><span>{supabaseConfigured ? 'Seus registros sincronizam com a nuvem.' : 'Seus registros ficam neste navegador.'}</span></div>
          <div className="sidebar-footer">STUDYMAXIMIZER <span>·</span> V2.0</div>
        </div>
      </aside>

      <main className="main-area">
        <div className="mobile-topbar">
          <button className="icon-button" aria-label="Abrir menu" onClick={() => setMobileMenuOpen(true)}><Menu size={21} /></button>
          <div className="mobile-brand"><div className="brand-mark small"><GraduationCap size={19} /></div><span>StudyMaximizer</span></div>
          <button className="icon-button" aria-label={data.theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} onClick={toggleTheme}>{data.theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button>
        </div>
        <header className="topbar">
          <div className="breadcrumbs"><span>StudyMaximizer</span><ChevronRight size={14} /><strong>{pageTitles[view]?.[0] || 'Visão geral'}</strong></div>
          <div className="topbar-actions">
            <span className={`save-indicator ${cloudStatus === 'error' ? 'save-indicator-error' : ''}`} title={cloudError || cloudStatusText}><span className={`save-dot ${cloudStatus === 'error' ? 'save-dot-error' : ''}`} />{cloudStatusText}</span>
            <button className="icon-button theme-button" aria-label={data.theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} title={data.theme === 'dark' ? 'Tema claro' : 'Tema escuro'} onClick={toggleTheme}>{data.theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button>
            <button className="button button-primary top-log-button" onClick={() => setSessionModal({ date: todayKey, subjectId: 'portugues', track: 'all', minutes: 45, note: '' })}><Plus size={17} /> Registrar estudo</button>
          </div>
        </header>
        <div className="page-content">
          <section className="page-heading">
            <div><p className="eyebrow">{formatLongDate(today).toLocaleUpperCase('pt-BR')}</p><h1>{pageTitles[view]?.[0] || 'Visão geral'}</h1><p className="page-subtitle">{pageTitles[view]?.[1]}</p></div>
            {view === 'overview' && <div className="heading-badge"><span className="badge-pulse" /><span>Seu ciclo de preparação</span></div>}
          </section>
          {renderContent()}
          <footer className="page-footer"><span>StudyMaximizer</span><span>Feito para estudar com intenção, método e constância.</span><button onClick={() => setView('settings')}>Fontes e dados <ArrowRight size={13} /></button></footer>
        </div>
      </main>

      {sessionModal && <SessionModal initial={sessionModal} onClose={() => setSessionModal(null)} onSave={saveSession} storageLabel={supabaseConfigured && session ? 'Sincronização automática com a nuvem' : 'Salvo neste navegador'} />}
      <input ref={importInputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={importBackup} />
      {toast && <div className="toast" role="status"><CheckCircle2 size={18} />{toast}</div>}
    </div>
  );
}

function CloudStartupScreen({ title, text, error = false, onRetry, onSignOut }) {
  return <main className="cloud-startup-screen">
    <section className="cloud-startup-card">
      <div className={`auth-logo-mark ${error ? 'auth-logo-error' : ''}`}><GraduationCap size={28} /></div>
      <span className="auth-eyebrow">STUDYMAXIMIZER · SINCRONIZAÇÃO</span>
      <h1>{title}</h1>
      <p>{text}</p>
      {!error && <div className="loading-pulse"><span /><span /><span /></div>}
      {error && <div className="auth-action-row"><button className="button button-primary" onClick={onRetry}><RefreshCw size={16} /> Tentar novamente</button>{onSignOut && <button className="button button-secondary" onClick={onSignOut}>Sair da conta</button>}</div>}
      <small>Se o problema continuar, confira se o script <code>supabase/schema.sql</code> foi executado no SQL Editor do projeto.</small>
    </section>
  </main>;
}

function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (mode === 'signup') {
        const { data: result, error: requestError } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: window.location.href },
        });
        if (requestError) throw requestError;
        if (result?.session) {
          setMessage('Conta criada. Abrindo seu espaço de estudos…');
        } else {
          setMessage('Conta criada. Confira sua caixa de entrada e confirme o e-mail antes de entrar.');
        }
      } else {
        const { error: requestError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (requestError) throw requestError;
        setMessage('Login confirmado. Carregando seu progresso…');
      }
    } catch (requestError) {
      const raw = requestError?.message || 'Não foi possível concluir a solicitação.';
      const lower = raw.toLowerCase();
      if (lower.includes('invalid login credentials')) setError('E-mail ou senha incorretos. Confira os dados e tente novamente.');
      else if (lower.includes('email not confirmed')) setError('Seu e-mail ainda não foi confirmado. Abra a mensagem enviada pelo Supabase e confirme a conta.');
      else if (lower.includes('user already registered')) setError('Já existe uma conta com esse e-mail. Entre em vez de criar outra.');
      else if (lower.includes('password should be at least')) setError('A senha precisa ter pelo menos 6 caracteres.');
      else setError(raw);
    } finally {
      setBusy(false);
    }
  };

  return <main className="auth-screen">
    <section className="auth-card">
      <div className="auth-brand"><div className="auth-logo-mark"><GraduationCap size={29} /></div><div><strong>StudyMaximizer</strong><span>STUDY WITH PURPOSE</span></div></div>
      <div className="auth-intro"><span className="auth-eyebrow">SUA PREPARAÇÃO, EM QUALQUER LUGAR</span><h1>{mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}</h1><p>{mode === 'login' ? 'Acesse seu cronograma, progresso e histórico sincronizados.' : 'Crie sua conta para manter seus estudos sincronizados entre dispositivos.'}</p></div>
      <form className="auth-form" onSubmit={submit}>
        <label className="auth-field"><span>E-mail</span><div><Mail size={18} /><input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="voce@exemplo.com" /></div></label>
        <label className="auth-field"><span>Senha</span><div><LockKeyhole size={18} /><input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} required value={password} onChange={event => setPassword(event.target.value)} placeholder="Pelo menos 6 caracteres" /></div></label>
        {error && <div className="auth-feedback auth-feedback-error"><CircleAlert size={17} /><span>{error}</span></div>}
        {message && <div className="auth-feedback auth-feedback-success"><CheckCircle2 size={17} /><span>{message}</span></div>}
        <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? <RefreshCw size={17} className="auth-spinner" /> : <ArrowRight size={17} />}{busy ? 'Processando…' : mode === 'login' ? 'Entrar e sincronizar' : 'Criar conta'}</button>
      </form>
      <div className="auth-switch"><span>{mode === 'login' ? 'Ainda não tem conta?' : 'Já tem uma conta?'}</span><button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }}>{mode === 'login' ? 'Criar conta' : 'Fazer login'}</button></div>
      <div className="auth-security-note"><ShieldCheck size={17} /><span>Seus registros são privados. O banco aplica regras para que cada conta acesse apenas os próprios dados.</span></div>
    </section>
  </main>;
}

function StatCard({ label, value, suffix, foot, Icon: CardIcon, tone = 'blue', meter }) {
  return <article className={`stat-card stat-${tone}`}>
    <div className="stat-top"><span>{label}</span><span className="stat-icon"><CardIcon size={20} strokeWidth={1.8} /></span></div>
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
        <div className="hero-overline"><span className="hero-overline-dot" />SEU PLANO, SUA EVOLUÇÃO</div>
        <h2>Consistência hoje.<br /><em>Confiança no dia da prova.</em></h2>
        <p>Pequenos blocos bem feitos, revisões frequentes e acompanhamento honesto do progresso.</p>
        <div className="hero-actions"><button className="button button-light" onClick={openSchedule}>Ver meu cronograma <ArrowRight size={16} /></button><button className="button button-hero-ghost" onClick={openContent}>Explorar conteúdos <BookOpen size={16} /></button></div>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-glow" /><div className="hero-emblem"><GraduationCap size={52} strokeWidth={1.35} /></div><div className="hero-float-card float-one"><Target size={16} /><span>15h semanais</span></div><div className="hero-float-card float-two"><TrendingUp size={16} /><span>Progresso real</span></div><span className="hero-star star-one">✦</span><span className="hero-star star-two">✧</span></div>
    </section>

    <section className="stat-grid" aria-label="Resumo de desempenho semanal">
      <StatCard label="Horas registradas" value={stats.hours.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} suffix="h" foot={`Meta: ${data.targetHours || 15}h por semana`} Icon={Clock3} tone="blue" meter={weekHoursPct} />
      <StatCard label="Tarefas concluídas" value={stats.tasksDone} suffix={`/${stats.tasksTotal}`} foot={`${stats.taskPercent}% do cronograma semanal`} Icon={CheckCheck} tone="green" meter={stats.taskPercent} />
      <StatCard label="Questões resolvidas" value={stats.questions} foot={stats.questions ? `${stats.accuracy}% de acertos nesta semana` : 'Registre questões nas sessões'} Icon={ListChecks} tone="violet" meter={stats.accuracy} />
      <StatCard label="Frequência semanal" value={stats.activeCount} suffix="/6 dias" foot="Dias com sessão ou tarefa concluída" Icon={CalendarCheck} tone="amber" meter={stats.activeCount / 6 * 100} />
    </section>

    <div className="dashboard-main-grid">
      <section className="panel today-panel">
        <div className="panel-heading"><div><span className="section-kicker">EXECUÇÃO</span><h3>Plano de hoje</h3><p>{formatLongDate(today)}</p></div><button className="text-button" onClick={openSchedule}>Semana completa <ArrowRight size={15} /></button></div>
        {todayActivities.length ? <>
          <div className="day-progress-row"><span>{todayDone} de {todayActivities.length} atividades concluídas</span><span>{safePercent(todayDone / todayActivities.length * 100)}%</span></div><ProgressBar value={todayDone / todayActivities.length * 100} color="blue" />
          <div className="today-task-list">{todayActivities.map(task => <TaskRow key={task.id} task={task} date={todayKey} done={isTaskDone(data, todayKey, task.id)} toggleTask={toggleTask} openLog={openLog} compact />)}</div>
        </> : <div className="rest-day"><div className="rest-icon"><Leaf size={25} /></div><div><strong>Domingo de recuperação</strong><p>Descanse sem culpa. Uma rotina sustentável também inclui pausa.</p></div></div>}
        <button className="panel-bottom-link" onClick={openSchedule}>Abrir cronograma detalhado <ArrowRight size={15} /></button>
      </section>

      <section className="panel level-panel">
        <div className="panel-heading"><div><span className="section-kicker">GAMIFICAÇÃO</span><h3>Sua jornada</h3><p>O nível reflete suas atividades registradas.</p></div><div className="level-medal"><Trophy size={20} /></div></div>
        <div className="level-current"><div className="level-illustration"><CurrentLevelIcon size={30} strokeWidth={1.6} /></div><div className="level-current-copy"><span>NÍVEL {gamification.currentIndex + 1} DE {LEVELS.length}</span><strong>{gamification.current.name}</strong><small>{gamification.current.subtitle}</small></div></div>
        <div className="xp-metrics"><div><strong>{gamification.xp.toLocaleString('pt-BR')}</strong><span>XP acumulados</span></div><div className="xp-next">{gamification.next ? <><strong>{xpToNext.toLocaleString('pt-BR')} XP</strong><span>para o próximo nível</span></> : <><strong>Nível máximo</strong><span>Você chegou ao topo</span></>}</div></div>
        <ProgressBar value={gamification.progress} color="violet" height={9} />
        <div className="level-progress-caption"><span>{gamification.current.name}</span><span>{gamification.next ? gamification.next.name : 'Elite'}</span></div>
        <div className="gamification-note"><Zap size={15} /><span>XP por tempo estudado, tarefas, frequência, questões e evolução nos acertos.</span></div>
        <button className="panel-bottom-link" onClick={openPerformance}>Ver desempenho e curva de aprendizagem <ArrowRight size={15} /></button>
      </section>
    </div>

    <div className="dashboard-bottom-grid">
      <section className="panel chart-panel">
        <div className="panel-heading"><div><span className="section-kicker">RESULTADO</span><h3>Curva de aprendizagem</h3><p>Percentual de acertos por semana, a partir dos seus registros.</p></div><button className="icon-button subtle" aria-label="Abrir desempenho" onClick={openPerformance}><ArrowRight size={17} /></button></div>
        <AccuracyChart trend={trend} compact />
        <div className="chart-legend"><span><i className="legend-dot" />Taxa de acertos</span><span><i className="legend-line" />Meta de referência: 80%</span></div>
      </section>
      <section className="panel focus-panel">
        <div className="panel-heading"><div><span className="section-kicker">PRÓXIMO PASSO</span><h3>Conteúdos em acompanhamento</h3><p>Confira o avanço dos principais blocos de estudo.</p></div><button className="text-button" onClick={openContent}>Ver tudo <ArrowRight size={15} /></button></div>
        <div className="focus-subject-list">{prioritySubjects.map(({ subject, done, total, percent }) => <div className="focus-subject" key={subject.id}><div className={`focus-icon icon-${subject.color}`}><Icon name={subject.icon} size={17} /></div><div className="focus-subject-info"><div className="focus-subject-name"><strong>{subject.title}</strong><span>{done}/{total}</span></div><ProgressBar value={percent} color={subject.color} height={5} /></div></div>)}</div>
        <div className="content-total-row"><span><BookOpenText size={15} /> Conteúdo total mapeado</span><strong>{totalContentProgress.done} de {totalContentProgress.total} subtópicos</strong></div>
      </section>
    </div>

    <WeeklyPacePanel data={data} stats={stats} todayKey={todayKey} />

    <section className="panel tracks-overview-panel">
      <div className="panel-heading"><div><span className="section-kicker">ROTAS DE PREPARAÇÃO</span><h3>Progresso por cargo</h3><p>As matérias compartilhadas ajudam em mais de um caminho, mas os conteúdos específicos permanecem separados.</p></div><button className="text-button" onClick={() => openTracks()}>Detalhar cargos <ArrowRight size={15} /></button></div>
      <div className="track-mini-grid">{trackProgress.map(({ track, done, total, percent }) => { const TrackIcon = ICONS[track.icon] || Building2; return <div className="track-mini-card" key={track.id}><div className={`track-mini-icon track-${track.color}`}><TrackIcon size={19} /></div><div className="track-mini-main"><strong>{track.short}</strong><span>{track.institution}</span><ProgressBar value={percent} color={track.color} height={5} /><small>{done} de {total} subtópicos concluídos</small></div><strong className="track-mini-percent">{percent}%</strong></div>; })}</div>
    </section>
    <section className="panel level-ladder-panel"><div className="panel-heading"><div><span className="section-kicker">SUA JORNADA</span><h3>Os cinco níveis StudyMaximizer</h3><p>A evolução considera o esforço registrado, a regularidade e a melhora de desempenho — não apenas cliques em tarefas.</p></div></div><div className="level-ladder">{LEVELS.map((level, index) => { const LevelIcon = level.Icon; const active = level.name === gamification.current.name; const passed = gamification.xp >= level.threshold; return <div className={`ladder-item ${active ? 'ladder-active' : ''} ${passed ? 'ladder-passed' : ''}`} key={level.name}><div className="ladder-icon"><LevelIcon size={21} /></div><strong>{level.name}</strong><span>{level.threshold.toLocaleString('pt-BR')} XP</span>{active && <small>NÍVEL ATUAL</small>}</div>; })}</div></section>
  </div>;
}


function WeeklyPacePanel({ data, stats, todayKey }) {
  const expectedHours = (Number(data.targetHours) || PLANNED_HOURS_PER_WEEK) / PLANNED_STUDY_DAYS * stats.elapsedStudyDays;
  const activePastDays = [...stats.activeDates].filter(date => date < todayKey).length;
  const hoursProgress = expectedHours > 0 ? safePercent(stats.hours / expectedHours * 100) : 0;
  const taskProgress = stats.dueTasks > 0 ? safePercent(stats.completedDueTasks / stats.dueTasks * 100) : 0;
  const frequencyProgress = stats.elapsedStudyDays > 0 ? safePercent(activePastDays / stats.elapsedStudyDays * 100) : 0;
  const dueHoursLabel = `${expectedHours.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}h`;
  return <section className="panel pace-panel">
    <div className="panel-heading"><div><span className="section-kicker">REALIZADO × ESPERADO</span><h3>Seu ritmo está acompanhando o plano?</h3><p>Compara o tempo, as tarefas vencidas e a frequência até o dia anterior, sem cobrar o dia atual antes de terminar.</p></div><div className={`pace-score ${stats.elapsedStudyDays ? '' : 'pace-waiting'}`}><strong>{stats.elapsedStudyDays ? `${stats.pace}%` : '—'}</strong><span>{stats.elapsedStudyDays ? 'ritmo acumulado' : 'semana começando'}</span></div></div>
    {stats.elapsedStudyDays ? <div className="pace-metrics-grid">
      <div className="pace-metric"><div><span>Tempo estudado</span><strong>{stats.hours.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}h <small>/ {dueHoursLabel} esperadas</small></strong></div><ProgressBar value={hoursProgress} color="blue" height={7} /><small>{hoursProgress >= 100 ? 'Meta temporal em dia' : `${safePercent(hoursProgress)}% do tempo esperado`}</small></div>
      <div className="pace-metric"><div><span>Tarefas vencidas</span><strong>{stats.completedDueTasks} <small>/ {stats.dueTasks} concluídas</small></strong></div><ProgressBar value={taskProgress} color="green" height={7} /><small>{taskProgress >= 100 ? 'Todas as tarefas vencidas concluídas' : `${taskProgress}% das tarefas esperadas`}</small></div>
      <div className="pace-metric"><div><span>Frequência até ontem</span><strong>{activePastDays} <small>/ {stats.elapsedStudyDays} dias ativos</small></strong></div><ProgressBar value={frequencyProgress} color="violet" height={7} /><small>{frequencyProgress >= 100 ? 'Boa regularidade até aqui' : 'Priorize retomar a rotina, sem tentar compensar tudo de uma vez'}</small></div>
    </div> : <div className="pace-start-note"><CalendarCheck size={20} /><div><strong>A semana ainda está começando.</strong><p>Esse indicador passa a comparar o esperado com o realizado após o primeiro dia planejado terminar.</p></div></div>}
    <div className="pace-footnote"><Zap size={14} /><span>O indicador combina horas (45%), tarefas vencidas (35%) e frequência (20%). O XP semanal só libera bônus de meta após o encerramento da semana.</span></div>
  </section>;
}

function TaskRow({ task, date, done, toggleTask, openLog, compact = false }) {
  const subject = subjectById(task.subjectId);
  return <div className={`task-row ${done ? 'task-done' : ''} ${compact ? 'task-row-compact' : ''}`}>
    <button className={`task-check ${done ? 'checked' : ''}`} aria-label={done ? 'Reabrir atividade' : 'Concluir atividade'} onClick={() => toggleTask(date, task.id)}>{done && <Check size={15} strokeWidth={2.5} />}</button>
    <div className="task-copy"><div className="task-title-row"><strong>{task.label}</strong>{done && <span className="completed-label">Concluída</span>}</div><span className="task-focus">{task.focus}</span><div className="task-meta"><span className={`subject-dot dot-${subject.color}`} />{subject.title}<span className="meta-separator">·</span><Clock3 size={13} />{formatDuration(task.minutes)}<span className="meta-separator">·</span>{task.type}</div></div>
    <button className="icon-button task-log-button" title="Registrar sessão desta atividade" aria-label="Registrar sessão" onClick={() => openLog(task, date)}><Plus size={17} /></button>
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
      <div className="schedule-week-card panel"><div className="week-picker"><button className="icon-button" aria-label="Semana anterior" onClick={() => changeWeek(-1)}><ChevronLeft size={20} /></button><div><span>SEMANA DE ESTUDOS</span><strong>{formatWeekRange(weekStart)}</strong><small>{weekIsCurrent ? 'Semana atual' : dateKey(weekStart) < dateKey(startOfWeek(new Date())) ? 'Semana anterior' : 'Planejamento futuro'}</small></div><button className="icon-button" aria-label="Próxima semana" onClick={() => changeWeek(1)}><ChevronRight size={20} /></button></div><div className="week-stats-strip"><div><strong>{formatDuration(selectedStats.sessionMinutes)}</strong><span>Tempo registrado</span></div><div><strong>{selectedStats.tasksDone}/{selectedStats.tasksTotal}</strong><span>Tarefas concluídas</span></div><div><strong>{selectedStats.questions}</strong><span>Questões</span></div></div></div>
      <div className="weekly-target-card"><div className="target-card-top"><div className="target-ring" style={{ '--ring': `${safePercent(selectedStats.hours / Math.max(totalTarget, 1) * 100)}%` }}><span>{safePercent(selectedStats.hours / Math.max(totalTarget, 1) * 100)}<small>%</small></span></div><div><span className="section-kicker">META DA SEMANA</span><strong>{selectedStats.hours.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}h <small>de {totalTarget}h</small></strong><p>Horas efetivamente registradas</p></div></div><ProgressBar value={selectedStats.hours / Math.max(totalTarget, 1) * 100} color="blue" height={7} /><button className="text-button" onClick={openGeneralLog}>Registrar sessão avulsa <ArrowRight size={14} /></button></div>
    </section>

    <section className="panel week-planner-panel">
      <div className="panel-heading"><div><span className="section-kicker">PLANEJAMENTO DIÁRIO</span><h3>Seu ciclo de segunda a sábado</h3><p>Cada dia contém 2h30 planejadas. Marque a tarefa após executá-la e use o botão + para registrar o tempo real.</p></div><div className="inline-legend"><span><i className="legend-status done" />Concluída</span><span><i className="legend-status pending" />Pendente</span></div></div>
      <div className="week-day-tabs">{weekDates.map((date, index) => { const day = WEEK_PLAN[index]; const completed = day.activities.filter(task => isTaskDone(data, dateKey(date), task.id)).length; const isToday = dateKey(date) === todayKey; return <button key={day.id} className={`week-day-tab ${selectedDay === index ? 'selected' : ''} ${isToday ? 'today' : ''}`} onClick={() => setSelectedDay(index)}><span>{day.short}</span><strong>{date.getDate()}</strong><small>{completed === day.activities.length ? 'Completo' : `${completed}/${day.activities.length} feitas`}</small><span className="day-tab-progress"><i style={{ width: `${completed / day.activities.length * 100}%` }} /></span></button>; })}</div>
      <div className="day-detail-heading"><div className="day-date-badge"><CalendarDays size={20} /></div><div><h4>{WEEK_PLAN[selectedDay].day}</h4><span>{formatLongDate(selectedDate)} · {formatDuration(dayTasks.reduce((sum, item) => sum + item.minutes, 0))} planejadas</span></div><div className="day-completion-pill"><CheckCircle2 size={15} />{dayDone}/{dayTasks.length} tarefas</div></div>
      <div className="day-task-stack">{dayTasks.map(task => <TaskRow key={task.id} task={task} date={selectedDateKey} done={isTaskDone(data, selectedDateKey, task.id)} toggleTask={toggleTask} openLog={openLog} />)}</div>
      <div className="day-footer-note"><CircleHelp size={17} /><span>Marcar tarefa como concluída atualiza a consistência. Para que horas, questões e curva de acertos sejam calculadas, registre também uma sessão com o tempo real estudado.</span></div>
    </section>
    <section className="schedule-guidelines-grid"><InfoCard Icon={Timer} title="Blocos de foco" text="Experimente 45–50 minutos de concentração, com pausas curtas entre blocos. O tempo de pausa não entra nas horas estudadas." /><InfoCard Icon={NotebookPen} title="Correção ativa" text="Não conte apenas questões respondidas. Registre os motivos dos erros e retorne a eles nas revisões." /><InfoCard Icon={Leaf} title="Rotina sustentável" text="Domingo é reservado para descanso e revisão do planejamento. Um dia sem estudo não apaga o progresso anterior." /></section>
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
    <section className="syllabus-hero panel"><div className="syllabus-hero-icon"><BookOpenText size={28} /></div><div className="syllabus-hero-main"><span className="section-kicker">MAPA DE CONTEÚDO</span><h3>Um assunto por vez. Cada avanço fica registrado.</h3><p>Marque os subassuntos após estudar e revisar. O percentual acompanha a quantidade de itens concluídos, não substitui uma avaliação de domínio por questões.</p></div><div className="syllabus-summary"><strong>{topicProgress(data, selectedTrack).done}<span>/{topicProgress(data, selectedTrack).total}</span></strong><small>subassuntos concluídos</small><ProgressBar value={topicProgress(data, selectedTrack).percent} color="blue" /></div></section>
    <section className="panel syllabus-filters"><div className="search-field"><Search size={18} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar disciplina, assunto ou subassunto..." aria-label="Buscar conteúdo programático" />{search && <button className="clear-search" onClick={() => setSearch('')} aria-label="Limpar busca"><X size={15} /></button>}</div><label className="select-field"><span>Trilha</span><select value={selectedTrack} onChange={event => setSelectedTrack(event.target.value)}><option value="all">Todas as trilhas</option>{TRACKS.map(track => <option value={track.id} key={track.id}>{track.short}</option>)}</select></label><label className="select-field status-filter"><span>Status</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="all">Todos os itens</option><option value="pending">Não iniciados</option><option value="doing">Em andamento</option><option value="done">Concluídos</option></select></label></section>
    {selectedTrackObject && <div className="track-context-note"><div className={`track-mini-icon track-${selectedTrackObject.color}`}><Icon name={selectedTrackObject.icon} size={18} /></div><div><strong>{selectedTrackObject.label}</strong><span>{selectedTrackObject.description}</span></div><button className="text-button" onClick={() => setSelectedTrack('all')}>Ver todas as trilhas <X size={14} /></button></div>}
    <div className="status-legend"><span><Circle size={13} /> Não iniciado</span><span><Clock3 size={13} /> Em andamento</span><span><CheckCircle2 size={13} /> Concluído</span><small>Clique no ícone ao lado de um subassunto para avançar seu status.</small></div>
    <div className="syllabus-results-heading"><span><strong>{filtered.length}</strong> disciplinas · <strong>{allVisibleCount}</strong> subassuntos exibidos</span><span><CheckCircle2 size={15} /> {topicProgress(data, selectedTrack).percent}% concluído nesta visão</span></div>
    {filtered.length ? <div className="syllabus-list">{filtered.map(({ subject, groups, done, doing, total, percent }) => {
      const isOpen = Boolean(expandedSubjects[subject.id]);
      const SubjectIcon = ICONS[subject.icon] || BookOpen;
      return <article className={`syllabus-subject-card ${isOpen ? 'subject-open' : ''}`} key={subject.id}>
        <button className="syllabus-subject-heading" onClick={() => setExpandedSubjects(previous => ({ ...previous, [subject.id]: !previous[subject.id] }))} aria-expanded={isOpen}>
          <div className={`subject-main-icon icon-${subject.color}`}><SubjectIcon size={21} strokeWidth={1.8} /></div>
          <div className="subject-heading-copy"><div className="subject-heading-title"><h3>{subject.title}</h3><span className="subject-category-tag">{subject.category}</span></div><p>{subject.description}</p><div className="subject-heading-meta"><span className={`priority-tag priority-${slug(subject.priority)}`}>Prioridade {subject.priority.toLowerCase()}</span><span>{subject.estimate}</span><span>{groups.length} blocos de assunto</span></div></div>
          <div className="subject-progress-block"><strong>{percent}%</strong><span>{done}/{total} concluídos{doing ? ` · ${doing} em andamento` : ''}</span><ProgressBar value={percent} color={subject.color} height={6} /></div>
          <div className="expand-icon">{isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
        </button>
        {isOpen && <div className="subject-groups">{groups.map(group => {
          const expandedKey = `${subject.id}|${group.topicId}`;
          const groupOpen = Boolean(expandedGroups[expandedKey]) || Boolean(search.trim());
          const doneCount = group.doneCount;
          return <section className="topic-group" key={group.topicId}><button className="topic-group-heading" onClick={() => setExpandedGroups(previous => ({ ...previous, [expandedKey]: !previous[expandedKey] }))} aria-expanded={groupOpen}><span className="topic-number">{group.title.split('·')[0].trim()}</span><span className="topic-group-title">{group.title.split('·').slice(1).join('·').trim()}</span><span className="topic-count">{doneCount}/{group.allCount}{group.doingCount ? ` · ${group.doingCount} em curso` : ''}</span><div className="topic-group-progress"><ProgressBar value={group.allCount ? doneCount / group.allCount * 100 : 0} color={subject.color} height={4} /></div>{groupOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</button>
            {groupOpen && <div className="subtopic-list">{group.items.map((item, itemIndex) => <div key={item.id} className={`subtopic-item subtopic-${item.status}`}><button type="button" className={`subtopic-state state-${item.status}`} title={item.status === 'not' ? 'Não iniciado — clique para marcar em andamento' : item.status === 'doing' ? 'Em andamento — clique para marcar como concluído' : 'Concluído — clique para reabrir'} aria-label={`${item.label}: ${item.status === 'not' ? 'não iniciado' : item.status === 'doing' ? 'em andamento' : 'concluído'}. Clique para avançar o status.`} aria-pressed={item.status === 'done'} onClick={() => toggleTopic(item.id)}>{item.status === 'done' ? <Check size={13} /> : item.status === 'doing' ? <Clock3 size={12} /> : <Circle size={12} />}</button><span className="subtopic-label">{item.label}</span><span className="subtopic-index">{String(itemIndex + 1).padStart(2, '0')}</span></div>)}</div>}
          </section>;
        })}{!groups.length && <div className="empty-state"><Search size={22} /><strong>Nenhum subassunto encontrado</strong><p>Altere a busca ou os filtros para ver outros itens.</p></div>}</div>}
      </article>;
    })}</div> : <div className="panel empty-state"><Search size={30} /><h3>Nenhum conteúdo encontrado</h3><p>Experimente limpar a busca ou mudar a trilha e o status.</p><button className="button button-secondary" onClick={() => { setSearch(''); setStatus('all'); setSelectedTrack('all'); }}>Limpar filtros</button></div>}
    <section className="content-notice"><CircleAlert size={19} /><div><strong>Matriz de preparação, não previsão de edital</strong><p>Os assuntos foram organizados a partir de programas e editais anteriores e ampliados para servir como trilha de estudo. Alguns tópicos são condicionais. Quando um edital for publicado, ajuste a matriz ao conteúdo oficial, aos pesos e aos critérios de eliminação.</p></div></section>
  </div>;
}

function TracksPage({ data, trackProgress, setSelectedTrack, setView }) {
  return <div className="page-stack">
    <section className="tracks-intro panel"><div className="tracks-intro-icon"><Building2 size={26} /></div><div><span className="section-kicker">VISÃO POR OBJETIVO</span><h3>Uma preparação, diferentes caminhos.</h3><p>Use a base comum para ganhar eficiência, mas avalie cada cargo com seu próprio conteúdo e desempenho. A porcentagem abaixo mede subtópicos marcados como estudados.</p></div></section>
    <div className="track-cards-grid">{trackProgress.map(({ track, total, done, percent }) => { const TrackIcon = ICONS[track.icon] || Building2; const related = SUBJECTS.filter(subject => subject.tracks.includes(track.id)); const common = related.filter(subject => subject.tracks.length > 1).length; return <article className={`track-detail-card track-card-${track.color}`} key={track.id}><div className="track-card-top"><div className={`track-card-icon track-${track.color}`}><TrackIcon size={24} /></div><span className="track-card-kicker">{track.institution}</span></div><h3>{track.label}</h3><p>{track.description}</p><div className="track-card-metrics"><div><strong>{percent}%</strong><span>conteúdo concluído</span></div><div><strong>{done}/{total}</strong><span>subtópicos marcados</span></div></div><ProgressBar value={percent} color={track.color} height={8} /><div className="track-card-footer"><span><BookOpenText size={15} />{related.length} disciplinas na trilha</span><span>{common} compartilhadas</span></div><button className="button button-secondary full-width" onClick={() => { setSelectedTrack(track.id); setView('syllabus'); }}>Abrir conteúdo desta trilha <ArrowRight size={15} /></button></article>; })}</div>
    <section className="panel shared-matters-panel"><div className="panel-heading"><div><span className="section-kicker">ESTRATÉGIA</span><h3>Como aproveitar as disciplinas compartilhadas</h3><p>Os nomes podem se repetir entre concursos, mas o peso e a abordagem não são necessariamente iguais.</p></div><div className="shared-icon"><Workflow size={21} /></div></div><div className="shared-matter-grid"><InfoCard Icon={BookOpenText} title="Português" text="Manter contato frequente e analisar erros de interpretação, sintaxe e reescrita. É a prioridade central da sua rotina." /><InfoCard Icon={Calculator} title="Matemática e lógica" text="Construir fundamentos antes de avançar para lógica formal, matemática financeira e estatística, conforme o edital." /><InfoCard Icon={Target} title="Conteúdos específicos" text="Separar TI, Administração Pública e Conhecimentos Bancários em trilhas próprias, sem presumir que todo assunto vale para todos os cargos." /></div></section>
  </div>;
}

function AccuracyChart({ trend, compact = false }) {
  if (!trend.length) return <div className={`chart-empty ${compact ? 'chart-empty-compact' : ''}`}><div className="chart-empty-icon"><BarChart3 size={24} /></div><strong>Sua curva começa no primeiro registro</strong><p>Registre sessões com questões respondidas e acertos para visualizar a evolução percentual por semana.</p></div>;
  const width = 680;
  const height = compact ? 210 : 270;
  const pad = { left: 38, right: 20, top: 18, bottom: 34 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const points = trend.map((item, index) => ({ ...item, x: pad.left + (trend.length === 1 ? plotW / 2 : index / (trend.length - 1) * plotW), y: pad.top + (100 - item.accuracy) / 100 * plotH }));
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const targetY = pad.top + (100 - 80) / 100 * plotH;
  return <div className="accuracy-chart-wrap"><svg className="accuracy-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfico da taxa de acertos por semana">
    {[0, 25, 50, 75, 100].map(tick => { const y = pad.top + (100 - tick) / 100 * plotH; return <g key={tick}><line x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="chart-grid-line" /><text x={pad.left - 9} y={y + 4} textAnchor="end" className="chart-axis-label">{tick}%</text></g>; })}
    <line x1={pad.left} x2={width - pad.right} y1={targetY} y2={targetY} className="chart-target-line" />
    <path d={path} className="chart-line" />
    {points.map(point => <g key={point.start}><circle cx={point.x} cy={point.y} r={4.5} className="chart-point" /><circle cx={point.x} cy={point.y} r={8} className="chart-point-halo" /><text x={point.x} y={height - 11} textAnchor="middle" className="chart-axis-label">{point.label}</text><title>{`${point.label}: ${point.accuracy}% em ${point.questions} questões`}</title></g>)}
  </svg>{!compact && <div className="chart-data-strip">{trend.slice(-4).map(item => <div key={item.start}><span>{item.label}</span><strong>{item.accuracy}%</strong><small>{item.questions} questões · {item.hours.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}h</small></div>)}</div>}</div>;
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
    <section className="performance-summary-grid"><div className="performance-highlight panel"><span className="section-kicker">VISÃO ACUMULADA</span><h3>Dados para decidir o que estudar a seguir.</h3><p>Use os registros para encontrar lacunas reais. Uma taxa de acertos só é comparável quando você pratica questões de dificuldade semelhante.</p><button className="button button-primary" onClick={openGeneralLog}><Plus size={16} /> Registrar sessão</button></div><div className="performance-kpis"><div className="mini-kpi"><Clock3 size={18} /><span>Tempo total</span><strong>{formatDuration(data.sessions.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0))}</strong></div><div className="mini-kpi"><ListChecks size={18} /><span>Questões</span><strong>{totalQuestions}</strong></div><div className="mini-kpi"><Target size={18} /><span>Taxa global de acertos</span><strong>{totalQuestions ? `${allAccuracy}%` : '—'}</strong></div><div className="mini-kpi"><CalendarCheck size={18} /><span>Sessões registradas</span><strong>{data.sessions.length}</strong></div></div></section>
    <section className="panel performance-chart-panel"><div className="panel-heading"><div><span className="section-kicker">TENDÊNCIA</span><h3>Curva de aprendizagem</h3><p>A linha representa a taxa de acertos calculada a partir dos registros de cada semana.</p></div><div className="chart-target-badge"><span className="target-line-preview" />80% · referência visual</div></div><AccuracyChart trend={trend} /><div className="chart-footnote"><CircleHelp size={15} /> Sem pelo menos uma questão registrada, uma semana não aparece na curva. O gráfico não atribui progresso fictício.</div></section>
    <section className="panel subject-performance-panel"><div className="panel-heading"><div><span className="section-kicker">DIAGNÓSTICO</span><h3>Desempenho por disciplina</h3><p>Identifique onde investir tempo de teoria e revisão.</p></div></div>{subjectStats.length ? <div className="subject-performance-list">{subjectStats.map(item => <div key={item.subject.id} className="subject-performance-row"><div className={`subject-mini-icon icon-${item.subject.color}`}><Icon name={item.subject.icon} size={17} /></div><div className="subject-performance-title"><strong>{item.subject.title}</strong><span>{item.sessions} sessões · {formatDuration(item.minutes)} · {item.questions} questões</span></div><div className="subject-performance-bar"><ProgressBar value={item.accuracy} color={item.subject.color} height={7} /><small>{item.questions ? `${item.accuracy}% de acertos` : 'Sem questões registradas'}</small></div><div className={`accuracy-number ${item.accuracy >= 80 && item.questions ? 'accuracy-good' : item.questions && item.accuracy < 60 ? 'accuracy-low' : ''}`}>{item.questions ? `${item.accuracy}%` : '—'}</div></div>)}</div> : <EmptyState Icon={BarChart3} title="Ainda não há dados por disciplina" text="Registre suas primeiras sessões com tempo e, quando possível, quantidade de questões e acertos." actionLabel="Registrar sessão" action={openGeneralLog} />}</section>
    <section className="panel sessions-panel"><div className="panel-heading"><div><span className="section-kicker">HISTÓRICO</span><h3>Sessões de estudo</h3><p>Os registros alimentam as horas, a frequência e a curva de aprendizagem.</p></div><label className="select-field session-filter"><span>Disciplina</span><select value={filterSubject} onChange={event => setFilterSubject(event.target.value)}><option value="all">Todas</option>{SUBJECTS.map(subject => <option key={subject.id} value={subject.id}>{subject.title}</option>)}</select></label></div>{filteredSessions.length ? <div className="sessions-table-wrap"><table className="sessions-table"><thead><tr><th>Data</th><th>Disciplina</th><th>Tempo</th><th>Questões</th><th>Acertos</th><th>Observação</th><th aria-label="Ações" /></tr></thead><tbody>{filteredSessions.slice(0, 40).map(session => <tr key={session.id}><td>{formatDate(parseDate(session.date), { day: '2-digit', month: 'short', year: 'numeric' })}</td><td><strong>{subjectById(session.subjectId).title}</strong></td><td>{formatDuration(session.minutes)}</td><td>{session.questions || '—'}</td><td>{session.questions ? `${safePercent(session.correct / session.questions * 100)}%` : '—'}</td><td className="session-note-cell">{session.note || '—'}</td><td><button className="icon-button delete-session" title="Excluir registro" aria-label="Excluir registro" onClick={() => deleteSession(session.id)}><X size={15} /></button></td></tr>)}</tbody></table></div> : <EmptyState Icon={NotebookPen} title="Seu histórico ainda está vazio" text="Registre as sessões para formar uma visão confiável de tempo, questões e acertos." actionLabel="Adicionar primeira sessão" action={openGeneralLog} />}</section>
    <section className="content-notice"><CircleAlert size={19} /><div><strong>Como interpretar sua evolução</strong><p>Uma semana pode ter menos acertos por conter questões mais difíceis. Combine taxa de acerto, volume de questões, tempo dedicado e revisão dos erros antes de mudar a estratégia.</p></div></section>
  </div>;
}

function EmptyState({ Icon: EmptyIcon, title, text, actionLabel, action }) {
  return <div className="empty-state"><div className="empty-icon"><EmptyIcon size={24} /></div><h3>{title}</h3><p>{text}</p>{action && <button className="button button-secondary" onClick={action}>{actionLabel || 'Continuar'} <ArrowRight size={15} /></button>}</div>;
}

function SettingsPage({ data, updateData, exportBackup, importBackup, supabaseConfigured, session, cloudStatus, cloudError, onSignOut, onRetrySync }) {
  const [hours, setHours] = useState(String(data.targetHours || PLANNED_HOURS_PER_WEEK));
  useEffect(() => setHours(String(data.targetHours || PLANNED_HOURS_PER_WEEK)), [data.targetHours]);
  const saveHours = () => {
    const parsed = Math.min(60, Math.max(1, Number(hours) || PLANNED_HOURS_PER_WEEK));
    updateData(previous => ({ ...previous, targetHours: parsed }));
  };
  return <div className="page-stack settings-stack">
    <section className="settings-card panel"><div className="settings-card-heading"><div className="settings-icon"><Database size={21} /></div><div><h3>Conta e sincronização</h3><p>{supabaseConfigured ? 'Sua preparação fica associada à sua conta e pode ser acessada em outros dispositivos.' : 'A conexão com o Supabase ainda não foi configurada nesta versão do site.'}</p></div></div>{supabaseConfigured ? <div className="cloud-account-panel"><div className="cloud-account-status"><span className={`cloud-status-indicator ${cloudStatus === 'error' ? 'error' : cloudStatus === 'synced' ? 'online' : ''}`} /><div><strong>{session?.user?.email || 'Conta autenticada'}</strong><span>{({ loading: 'Carregando seus dados…', saving: 'Salvando alterações na nuvem…', synced: 'Tudo sincronizado', error: 'Atenção: sincronização com erro', connecting: 'Conectando…' })[cloudStatus] || 'Conectado'}</span></div></div>{cloudError && <div className="cloud-inline-error"><CircleAlert size={16} />{cloudError}</div>}<div className="cloud-account-actions"><button className="button button-secondary" onClick={onRetrySync}><RefreshCw size={16} /> Tentar sincronizar</button><button className="button button-secondary" onClick={onSignOut}><LockKeyhole size={16} /> Sair da conta</button></div></div> : <div className="cloud-setup-instructions"><p>Para ativar a sincronização entre computadores:</p><ol><li>Execute <code>supabase/schema.sql</code> no SQL Editor do seu projeto Supabase.</li><li>Configure <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> como variáveis no GitHub Actions.</li><li>Publique novamente pelo workflow do GitHub Pages e crie sua conta no StudyMaximizer.</li></ol><p>Para testar localmente, copie <code>.env.example</code> para <code>.env.local</code> e informe os mesmos valores.</p></div>}</section>
    <section className="settings-card panel"><div className="settings-card-heading"><div className="settings-icon"><Target size={21} /></div><div><h3>Meta semanal de estudo</h3><p>O cronograma atual foi planejado para 15 horas. Altere a meta se sua disponibilidade mudar.</p></div></div><div className="settings-control-row"><label htmlFor="target-hours">Horas líquidas por semana</label><div className="hours-control"><input id="target-hours" type="number" min="1" max="60" step="0.5" value={hours} onChange={event => setHours(event.target.value)} /><span>horas</span><button className="button button-primary" onClick={saveHours}>Salvar meta</button></div></div><div className="setting-hint"><CircleHelp size={15} /> Alterar a meta ajusta os indicadores de desempenho; os blocos do cronograma somam 15 horas e podem ser reorganizados manualmente conforme sua rotina.</div></section>
    <section className="settings-card panel"><div className="settings-card-heading"><div className="settings-icon"><Moon size={21} /></div><div><h3>Aparência</h3><p>Escolha um tema confortável para estudar de dia ou à noite.</p></div></div><div className="theme-options"><button className={`theme-option ${data.theme === 'light' ? 'selected' : ''}`} onClick={() => updateData(previous => ({ ...previous, theme: 'light' }))}><div className="theme-preview theme-preview-light"><div /><span /></div><div><strong>Tema claro</strong><small>Leve e luminoso</small></div>{data.theme === 'light' && <CheckCircle2 size={19} />}</button><button className={`theme-option ${data.theme === 'dark' ? 'selected' : ''}`} onClick={() => updateData(previous => ({ ...previous, theme: 'dark' }))}><div className="theme-preview theme-preview-dark"><div /><span /></div><div><strong>Tema escuro</strong><small>Reduz a luminosidade</small></div>{data.theme === 'dark' && <CheckCircle2 size={19} />}</button></div></section>
    <section className="settings-card panel"><div className="settings-card-heading"><div className="settings-icon"><LockKeyhole size={21} /></div><div><h3>Dados e backup</h3><p>{supabaseConfigured ? 'O progresso é sincronizado com sua conta; o backup continua disponível como cópia de segurança.' : 'O progresso é salvo no armazenamento local deste navegador, não na nuvem.'}</p></div></div><div className="backup-actions"><div className="backup-action"><div className="backup-action-icon"><Download size={20} /></div><div><strong>Exportar backup</strong><p>Baixe um arquivo JSON com seus registros, atividades e conteúdos marcados.</p></div><button className="button button-secondary" onClick={exportBackup}><ArrowDownToLine size={16} /> Exportar</button></div><div className="backup-action"><div className="backup-action-icon"><Upload size={20} /></div><div><strong>Importar backup</strong><p>Restaure dados de um arquivo JSON previamente exportado do StudyMaximizer.</p></div><button className="button button-secondary" onClick={importBackup}><Upload size={16} /> Importar</button></div></div><div className="backup-warning"><CircleAlert size={16} /><span>Importar um backup substitui os dados atuais. Exporte uma cópia antes de restaurar outro arquivo.</span></div></section>
    <section className="settings-card panel sources-panel"><div className="settings-card-heading"><div className="settings-icon"><FileText size={21} /></div><div><h3>Editais e programas de referência</h3><p>O conteúdo é uma matriz de partida baseada em editais anteriores, não uma previsão dos próximos editais.</p></div></div><div className="source-list">{SOURCES.map((source, index) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url} className="source-item"><span className="source-index">{String(index + 1).padStart(2, '0')}</span><span className="source-copy"><strong>{source.name}</strong><small>{source.note}</small></span><ExternalLink size={17} /></a>)}</div><div className="source-note"><CircleHelp size={16} /><p>Ao sair edital novo, compare o conteúdo programático, os pesos, a banca, a redação e os critérios eliminatórios. Retire ou acrescente tópicos conforme a publicação oficial e suas retificações.</p></div></section>
    <section className="settings-card panel about-panel"><div className="settings-card-heading"><div className="settings-icon"><GraduationCap size={21} /></div><div><h3>Sobre o StudyMaximizer</h3><p>Uma ferramenta pessoal de planejamento, execução e revisão para concursos.</p></div></div><div className="about-feature-grid"><div><CheckCircle2 size={17} /><span>Progresso por disciplina, assunto e subassunto</span></div><div><CheckCircle2 size={17} /><span>Trilhas independentes por cargo</span></div><div><CheckCircle2 size={17} /><span>Gamificação com desenvolvimento e frequência</span></div><div><CheckCircle2 size={17} /><span>Curva de acertos baseada em registros reais</span></div><div><CheckCircle2 size={17} /><span>Backup JSON e sincronização na nuvem quando configurada</span></div><div><CheckCircle2 size={17} /><span>Compatível com publicação estática no GitHub Pages</span></div></div></section>
  </div>;
}

function SessionModal({ initial, onClose, onSave, storageLabel }) {
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
    if (!date || !Number.isFinite(minuteValue) || minuteValue < 1 || minuteValue > 1440) { setError('Informe uma data e um tempo válido entre 1 e 1.440 minutos.'); return; }
    if (correctValue > questionValue) { setError('A quantidade de acertos não pode ser maior que a quantidade de questões.'); return; }
    onSave({ id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`, date, subjectId, track, minutes: minuteValue, questions: questionValue, correct: correctValue, note: note.trim() });
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className="session-modal" role="dialog" aria-modal="true" aria-labelledby="session-modal-title"><div className="modal-heading"><div className="modal-title-icon"><NotebookPen size={21} /></div><div><span className="section-kicker">REGISTRO DE ATIVIDADE</span><h2 id="session-modal-title">Registrar sessão de estudo</h2><p>Registre o que aconteceu de fato. Esses dados alimentam seu histórico e a curva de acertos.</p></div><button className="icon-button" aria-label="Fechar" onClick={onClose}><X size={20} /></button></div><form onSubmit={submit} className="session-form"><div className="form-grid"><label className="form-field form-field-wide"><span>Disciplina</span><select value={subjectId} onChange={event => setSubjectId(event.target.value)}>{SUBJECTS.map(subject => <option key={subject.id} value={subject.id}>{subject.title}</option>)}</select></label><label className="form-field"><span>Trilha / cargo</span><select value={track} onChange={event => setTrack(event.target.value)}><option value="all">Base comum / avulsa</option>{TRACKS.map(item => <option key={item.id} value={item.id}>{item.short}</option>)}</select></label><label className="form-field"><span>Data do estudo</span><input type="date" value={date} onChange={event => setDate(event.target.value)} required /></label><label className="form-field"><span>Tempo efetivo (minutos)</span><input type="number" min="1" max="1440" value={minutes} onChange={event => setMinutes(event.target.value)} required /></label><label className="form-field"><span>Questões resolvidas</span><input type="number" min="0" max="10000" value={questions} onChange={event => setQuestions(event.target.value)} placeholder="Ex.: 20" /></label><label className="form-field"><span>Acertos</span><input type="number" min="0" max="10000" value={correct} onChange={event => setCorrect(event.target.value)} placeholder="Ex.: 14" /></label><label className="form-field form-field-wide"><span>Observação / assunto estudado</span><textarea value={note} onChange={event => setNote(event.target.value)} placeholder="Ex.: interpretação de texto — errei inferências e conectivos" rows="3" /></label></div>{error && <div className="form-error"><CircleAlert size={15} />{error}</div>}<div className="modal-footer"><span><LockKeyhole size={14} /> {storageLabel || 'Salvo neste navegador'}</span><div><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary"><Check size={16} /> Salvar sessão</button></div></div></form></section></div>;
}

export default App;
