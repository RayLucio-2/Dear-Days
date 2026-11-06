/**
 * Guarda todos os docs do usuário na memória, salva uma cópia no aparelho
 * (funciona sem internet) e sincroniza com a tabela "docs" do Supabase.
 */
import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, supabaseReady } from './supabase';
import { Docs, getPath, setPath, setThemeOverride } from './planner';
import { themePair } from './prefs';
import { key, today } from './dates';

type Status = 'offline' | 'salvando' | 'salvo' | 'erro' | 'local';

type State = {
  docs: Docs;
  ready: boolean;
  status: Status;
  userId: string | null;
  cur: string; // data selecionada (AAAA-MM-DD)
  init: (uid: string) => Promise<void>;
  reset: () => void;
  setCur: (k: string) => void;
  get: (id: string, path?: string) => any;
  set: (id: string, path: string, val: any) => void;
  push: (id: string, path: string, item: any) => void;
  remove: (id: string, path: string, index: number) => void;
  importAll: (dados: Docs) => Promise<number>;
};

const LS: Storage | undefined = (globalThis as any).localStorage;
const read = (k: string) => { try { return JSON.parse(LS?.getItem(k) || 'null'); } catch { return null; } };
const write = (k: string, v: any) => { try { LS?.setItem(k, JSON.stringify(v)); } catch {} };

let dirty = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;
let channel: RealtimeChannel | null = null;

export const useStore = create<State>((setS, getS) => {
  const cacheKey = () => `planner-cache-${getS().userId}`;
  const dirtyKey = () => `planner-dirty-${getS().userId}`;

  async function flush() {
    timer = null;
    const { userId, docs } = getS();
    if (!userId || userId === 'local' || !dirty.size) return;
    const ids = [...dirty];
    setS({ status: 'salvando' });
    const rows = ids.map((doc_id) => ({ user_id: userId, doc_id, data: docs[doc_id] ?? {}, updated_at: new Date().toISOString() }));
    const { error } = await supabase.from('docs').upsert(rows, { onConflict: 'user_id,doc_id' });
    if (error) {
      setS({ status: 'erro' });
      timer = setTimeout(flush, 5000); // tenta de novo
      return;
    }
    ids.forEach((i) => dirty.delete(i));
    write(dirtyKey(), [...dirty]);
    setS({ status: dirty.size ? 'salvando' : 'salvo' });
  }

  function touch(id: string, data: any) {
    const docs = { ...getS().docs, [id]: data };
    setS({ docs });
    write(cacheKey(), docs);
    dirty.add(id);
    write(dirtyKey(), [...dirty]);
    if (getS().userId === 'local') return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, 700);
  }

  return {
    docs: {},
    ready: false,
    status: 'offline',
    userId: null,
    cur: key(today()),

    async init(uid) {
      if (getS().userId === uid && getS().ready) return;
      setS({ userId: uid, ready: false });
      const local: Docs = read(`planner-cache-${uid}`) || {};
      dirty = new Set(read(`planner-dirty-${uid}`) || []);
      setS({ docs: local });
      if (uid === 'local' || !supabaseReady) {
        setS({ ready: true, status: 'local' });
        return;
      }
      const { data, error } = await supabase.from('docs').select('doc_id,data');
      if (error) {
        setS({ ready: true, status: 'offline' });
      } else {
        const merged: Docs = { ...local };
        (data || []).forEach((r: any) => { if (!dirty.has(r.doc_id)) merged[r.doc_id] = r.data || {}; });
        setS({ docs: merged, ready: true, status: 'salvo' });
        write(`planner-cache-${uid}`, merged);
        if (dirty.size) flush();
      }
      // Atualiza ao vivo quando você mexe no site ou em outro aparelho.
      channel?.unsubscribe();
      channel = supabase
        .channel('docs-' + uid)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'docs', filter: `user_id=eq.${uid}` }, (p: any) => {
          const row = p.new && p.new.doc_id ? p.new : null;
          if (!row || dirty.has(row.doc_id)) return;
          const docs = { ...getS().docs, [row.doc_id]: row.data || {} };
          setS({ docs });
          write(`planner-cache-${uid}`, docs);
        })
        .subscribe();
    },

    reset() {
      channel?.unsubscribe();
      channel = null;
      dirty = new Set();
      setS({ docs: {}, ready: false, userId: null, status: 'offline' });
    },

    setCur: (k) => setS({ cur: k }),

    get: (id, path) => getPath(getS().docs[id], path || ''),

    set(id, path, val) {
      const doc = getS().docs[id] || {};
      touch(id, setPath(doc, path, val));
    },

    push(id, path, item) {
      const doc = getS().docs[id] || {};
      const arr = getPath(doc, path);
      touch(id, setPath(doc, path, [...(Array.isArray(arr) ? arr : []), item]));
    },

    remove(id, path, index) {
      const doc = getS().docs[id] || {};
      const arr = getPath(doc, path);
      if (!Array.isArray(arr)) return;
      touch(id, setPath(doc, path, arr.filter((_, i) => i !== index)));
    },

    async importAll(dados) {
      const ids = Object.keys(dados).filter((k) => /^[dmfwyt]-/.test(k));
      const docs = { ...getS().docs };
      ids.forEach((id) => { docs[id] = dados[id]; dirty.add(id); });
      setS({ docs });
      write(cacheKey(), docs);
      write(dirtyKey(), [...dirty]);
      await flush();
      return ids.length;
    },
  };
});

/** Atalho para ler um doc com re-render só quando ele muda. */
export const useDoc = (id: string) => useStore((s) => s.docs[id]) || {};

// Mantém a cor do tema em dia com t-cfg (vale no site e no app).
let lastCfg: any;
useStore.subscribe((st) => {
  const cfg = st.docs['t-cfg'];
  if (cfg === lastCfg) return;
  lastCfg = cfg;
  setThemeOverride(themePair(cfg));
});
