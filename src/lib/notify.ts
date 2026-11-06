/**
 * Avisos no celular, poucos e gentis. Tudo é agendado no próprio aparelho
 * (não precisa de servidor). No navegador nada acontece.
 *
 * Ajustes em t-cfg.app.avisos: { tarefas, agua, compras } (desligados até a pessoa ligar).
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Docs, rulesFor, Task } from './planner';
import { addDays, key, minutes, today } from './dates';

const ON = Platform.OS !== 'web';
const CH = 'lembretes';
const MAX_TAREFAS_DIA = 8; // aviso demais vira ruído
const AGUA = [10, 13, 16, 19];

export type Avisos = { tarefas?: boolean; agua?: boolean; compras?: boolean };
export const avisosOf = (docs: Docs): Avisos => docs['t-cfg']?.app?.avisos || {};

let ready = false;
export async function initNotifications() {
  if (!ON || ready) return;
  ready = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CH, {
      name: 'Lembretes do planner',
      importance: AndroidImportance.DEFAULT,
      vibrationPattern: [0, 120],
    }).catch(() => {});
  }
}

export async function askPermission(): Promise<boolean> {
  if (!ON) return false;
  await initNotifications();
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const r = await Notifications.requestPermissionsAsync();
  return r.granted;
}

async function at(identifier: string, title: string, body: string, date: Date) {
  if (date.getTime() <= Date.now() + 30000) return;
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CH },
  }).catch(() => {});
}

const withTime = (d: Date, hhmm: string) => {
  const m = minutes(hhmm);
  return m == null ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(m / 60), m % 60);
};

/** Refaz os avisos de hoje e amanhã a partir dos dados. Os do cronômetro ficam de fora. */
export async function syncNotifications(docs: Docs) {
  if (!ON) return;
  const av = avisosOf(docs);
  const perm = await Notifications.getPermissionsAsync().catch(() => null);
  const old = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(old.filter((n) => n.identifier.startsWith('plan-')).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})));
  if (!perm?.granted || (!av.tarefas && !av.agua && !av.compras)) return;
  await initNotifications();

  for (const d of [today(), addDays(today(), 1)]) {
    const k = key(d);
    const doc = docs['d-' + k] || {};
    if (av.tarefas) {
      const list: { t: string; time: string; first?: string; id: string }[] = [];
      (Array.isArray(doc.tl) ? doc.tl : []).forEach((t: Task, i: number) => {
        if (t?.t && t.time && !t.ok) list.push({ t: t.t, time: t.time, first: t.first, id: `t${i}` });
      });
      rulesFor(docs, d).forEach((r) => {
        if (r.time && !doc.rd?.[r.id] && !doc.rs?.[r.id]) list.push({ t: r.t, time: r.time, id: 'r' + r.id });
      });
      list.sort((a, b) => a.time.localeCompare(b.time)).slice(0, MAX_TAREFAS_DIA).forEach((x) => {
        const when = withTime(d, x.time);
        if (when) at(`plan-${k}-${x.id}`, x.t, x.first ? `Comece por: ${x.first}` : 'Está na hora. Um passo de cada vez.', when);
      });
    }
    if (av.agua) {
      const w = Number(doc.water || 0);
      AGUA.forEach((h, j) => {
        if (k === key(today()) && w >= (j + 1) * 2) return; // já bebeu o bastante até aqui
        at(`plan-${k}-agua${h}`, 'Um copo de água?', 'Pausa rápida para se hidratar.', new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, 0));
      });
    }
  }

  if (av.compras) {
    const l = docs['t-wish']?.l;
    (Array.isArray(l) ? l : []).forEach((x: any) => {
      if (!x?.id || !x.at) return;
      at(`plan-wish-${x.id}`, 'Ainda quer comprar?', `${x.t}: já passaram 24 horas. Decida com calma.`, new Date(new Date(x.at).getTime() + 864e5));
    });
  }
}

/* ---------- cronômetro ---------- */
export function scheduleTimerAlert(label: string, ms: number) {
  if (!ON) return;
  Notifications.cancelScheduledNotificationAsync('timer').catch(() => {});
  Notifications.getPermissionsAsync().then((p) => {
    if (!p.granted) return;
    at('timer', 'Tempo! ' + label, 'Quer continuar mais um pouco ou parar aqui?', new Date(Date.now() + ms));
  }).catch(() => {});
}
export function cancelTimerAlert() {
  if (!ON) return;
  Notifications.cancelScheduledNotificationAsync('timer').catch(() => {});
}
