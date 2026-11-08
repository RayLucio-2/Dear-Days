-- Meu Planner: cole tudo no Supabase em SQL Editor > New query > Run.
-- Uma linha por página do planner (dia, mês, finanças...), só a dona enxerga.

create table if not exists public.docs (
  user_id    uuid not null references auth.users(id) on delete cascade,
  doc_id     text not null check (doc_id ~ '^[dmfwyt]-[A-Za-z0-9-]{1,40}$'),
  data       jsonb not null default '{}'::jsonb check (pg_column_size(data) < 200000),
  updated_at timestamptz not null default now(),
  primary key (user_id, doc_id)
);

alter table public.docs enable row level security;

drop policy if exists "ver os meus" on public.docs;
drop policy if exists "criar os meus" on public.docs;
drop policy if exists "editar os meus" on public.docs;
drop policy if exists "apagar os meus" on public.docs;

create policy "ver os meus"    on public.docs for select using (auth.uid() = user_id);
create policy "criar os meus"  on public.docs for insert with check (auth.uid() = user_id);
create policy "editar os meus" on public.docs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "apagar os meus" on public.docs for delete using (auth.uid() = user_id);

-- Atualização ao vivo entre o site e o celular.
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;
