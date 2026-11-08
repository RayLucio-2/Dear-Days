/**
 * Google Agenda sem login: abre a tela "novo evento" do Google Agenda já preenchida
 * (a pessoa só confirma em Salvar) e gera arquivo .ics para levar vários eventos de uma vez.
 * Funciona com Google Agenda, Agenda do iPhone e Outlook.
 */
import { Linking, Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { addDays, fromKey, key, minutes, pad } from './dates';

export type CalEvent = { title: string; day: string; start?: string; end?: string; details?: string; weekdays?: number[] };

const TZ = 'America/Sao_Paulo';
const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const ymd = (k: string) => k.replace(/-/g, '');
const hm = (t: string) => { const m = minutes(t)!; return `${pad(Math.floor(m / 60))}${pad(m % 60)}00`; };

/** Início e fim no formato do Google (dia inteiro quando não tem horário; 1 hora quando não tem fim). */
function range(e: CalEvent): [string, string, boolean] {
  if (!e.start || minutes(e.start) == null) {
    return [ymd(e.day), ymd(key(addDays(fromKey(e.day), 1))), true];
  }
  const s = minutes(e.start)!;
  let f = e.end && minutes(e.end) != null ? minutes(e.end)! : s + 60;
  if (f <= s) f = s + 30;
  const endDay = f >= 1440 ? key(addDays(fromKey(e.day), 1)) : e.day;
  const fm = f % 1440;
  return [`${ymd(e.day)}T${hm(e.start)}`, `${ymd(endDay)}T${pad(Math.floor(fm / 60))}${pad(fm % 60)}00`, false];
}

const rrule = (wd?: number[]) => (wd && wd.length ? `RRULE:FREQ=WEEKLY;BYDAY=${[...wd].sort().map((d) => BYDAY[d]).join(',')}` : '');

/** Link do Google Agenda com o evento preenchido. */
export function gcalUrl(e: CalEvent) {
  const [a, b] = range(e);
  const p = new URLSearchParams({ action: 'TEMPLATE', text: e.title, dates: `${a}/${b}`, ctz: TZ, details: (e.details ? e.details + '\n\n' : '') + 'Criado pelo Dear Days' });
  const r = rrule(e.weekdays);
  if (r) p.set('recur', r);
  return 'https://calendar.google.com/calendar/render?' + p.toString();
}

export function openGcal(e: CalEvent) {
  const url = gcalUrl(e);
  if (Platform.OS === 'web') window.open(url, '_blank', 'noopener');
  else Linking.openURL(url);
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Arquivo .ics com vários eventos (abre em qualquer agenda). */
export function icsOf(events: CalEvent[]) {
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Dear Days//PT-BR', 'CALSCALE:GREGORIAN'];
  // Fuso de Brasília (sem horário de verão desde 2019), para agendas que exigem a definição do fuso
  lines.push('BEGIN:VTIMEZONE', `TZID:${TZ}`, 'BEGIN:STANDARD', 'DTSTART:19700101T000000', 'TZOFFSETFROM:-0300', 'TZOFFSETTO:-0300', 'TZNAME:-03', 'END:STANDARD', 'END:VTIMEZONE');
  events.forEach((e, i) => {
    const [a, b, allDay] = range(e);
    lines.push('BEGIN:VEVENT', `UID:${ymd(e.day)}-${i}-${Math.random().toString(36).slice(2, 8)}@deardays`, `DTSTAMP:${now}`);
    if (allDay) lines.push(`DTSTART;VALUE=DATE:${a}`, `DTEND;VALUE=DATE:${b}`);
    else lines.push(`DTSTART;TZID=${TZ}:${a}`, `DTEND;TZID=${TZ}:${b}`);
    lines.push(`SUMMARY:${esc(e.title)}`);
    if (e.details) lines.push(`DESCRIPTION:${esc(e.details)}`);
    const r = rrule(e.weekdays);
    if (r) lines.push(r);
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export async function downloadIcs(events: CalEvent[], name: string) {
  const text = icsOf(events);
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return;
  }
  const f = new File(Paths.cache, name);
  try { f.create({ overwrite: true } as any); } catch {}
  await f.write(text);
  await Sharing.shareAsync(f.uri, { mimeType: 'text/calendar', dialogTitle: 'Adicionar à agenda' });
}
