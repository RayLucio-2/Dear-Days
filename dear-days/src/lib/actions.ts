import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useStore } from './store';
import { Task, uid } from './planner';
import { addDays, fromKey, key } from './dates';

/* ---------- vibração leve (não faz nada no navegador) ---------- */
export function tap() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
export function success() {
  if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/* ---------- mover tarefas entre dias ---------- */
export function moveTask(fromDay: string, i: number, toDay: string) {
  const { get, push, remove } = useStore.getState();
  const tl: Task[] = get('d-' + fromDay, 'tl') || [];
  const t = tl[i];
  if (!t) return;
  push('d-' + toDay, 'tl', { ...t, ok: false });
  remove('d-' + fromDay, 'tl', i);
}
export const tomorrowOf = (dayKey: string) => key(addDays(fromKey(dayKey), 1));

/** Índices das tarefas com nome que não foram feitas. */
export function pendingIdx(dayKey: string): number[] {
  const tl: Task[] = useStore.getState().get('d-' + dayKey, 'tl') || [];
  return tl.map((t, i) => (t && String(t.t || '').trim() && !t.ok ? i : -1)).filter((i) => i >= 0);
}
/** Move várias tarefas de uma vez (do fim para o começo, para os índices não mudarem). */
export function moveAll(fromDay: string, idx: number[], toDay: string) {
  [...idx].sort((a, b) => b - a).forEach((i) => moveTask(fromDay, i, toDay));
}

/* ---------- caixa de entrada ---------- */
export type InboxItem = { id: string; t: string; at: string };
export function capture(text: string) {
  const v = text.trim();
  if (!v) return;
  useStore.getState().push('t-inbox', 'l', { id: uid('i'), t: v, at: new Date().toISOString() });
}
export function inboxTo(i: number, dayKey: string) {
  const { get, push, remove } = useStore.getState();
  const it: InboxItem | undefined = (get('t-inbox', 'l') || [])[i];
  if (!it) return;
  push('d-' + dayKey, 'tl', { time: '', end: '', t: it.t, desc: '', cat: 0, ok: false, sub: [] });
  remove('t-inbox', 'l', i);
}
