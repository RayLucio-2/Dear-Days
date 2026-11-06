/**
 * Cronômetro do "só 5 minutos" e da estimativa da tarefa.
 * Fica fora das telas para continuar contando quando você troca de aba.
 */
import { create } from 'zustand';
import { useStore } from './store';
import { cancelTimerAlert, scheduleTimerAlert } from './notify';

export type Running = { label: string; day: string; i: number | null; startAt: number; dur: number };

type TimerState = {
  run: Running | null;
  start: (r: Omit<Running, 'startAt'>) => void;
  more: (min: number) => void;
  /** Para e, se for uma tarefa, soma os minutos em "quanto levou". */
  stop: () => void;
};

export const useTimer = create<TimerState>((set, get) => ({
  run: null,
  start(r) {
    const run = { ...r, startAt: Date.now() };
    set({ run });
    scheduleTimerAlert(run.label, run.dur);
  },
  more(min) {
    const r = get().run;
    if (!r) return;
    const dur = Date.now() - r.startAt + min * 60000;
    set({ run: { ...r, dur } });
    scheduleTimerAlert(r.label, dur - (Date.now() - r.startAt));
  },
  stop() {
    const r = get().run;
    if (!r) return;
    cancelTimerAlert();
    if (r.i != null) {
      const mins = Math.max(1, Math.round((Date.now() - r.startAt) / 60000));
      const { get: g, set: s } = useStore.getState();
      const id = 'd-' + r.day;
      if (g(id, `tl.${r.i}`)) s(id, `tl.${r.i}.real`, Number(g(id, `tl.${r.i}.real`) || 0) + mins);
    }
    set({ run: null });
  },
}));
