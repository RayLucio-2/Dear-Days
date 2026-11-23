-- Dear Days: lembretes no site (push) e resumo semanal por e-mail.
-- Antes de rodar: troque TROQUE_PELO_CRON_SECRET (2 vezes) pela mesma senha do segredo CRON_SECRET.
-- Depois cole tudo no Supabase em SQL Editor > New query > Run.

-- 1) Aparelhos/navegadores que aceitaram receber lembretes
create table if not exists public.push_subs (
  endpoint   text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  sub        jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.push_subs enable row level security;
drop policy if exists "meus avisos ver" on public.push_subs;
drop policy if exists "meus avisos criar" on public.push_subs;
drop policy if exists "meus avisos editar" on public.push_subs;
drop policy if exists "meus avisos apagar" on public.push_subs;
create policy "meus avisos ver"    on public.push_subs for select using (auth.uid() = user_id);
create policy "meus avisos criar"  on public.push_subs for insert with check (auth.uid() = user_id);
create policy "meus avisos editar" on public.push_subs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "meus avisos apagar" on public.push_subs for delete using (auth.uid() = user_id);

-- 2) O que já foi enviado (para não repetir). Só o servidor mexe.
create table if not exists public.push_sent (
  id      text primary key,
  sent_at timestamptz not null default now()
);
alter table public.push_sent enable row level security;

-- 3) Agendamentos (precisa das extensões pg_cron e pg_net: Database > Extensions)
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobid) from cron.job where jobname in ('dd-lembretes', 'dd-resumo-semanal');

-- a cada 5 minutos: lembretes de tarefas, água e compras
select cron.schedule('dd-lembretes', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://fjpqwwqkewkqlhxwbeau.supabase.co/functions/v1/lembretes',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron', 'TROQUE_PELO_CRON_SECRET'),
    body := '{}'::jsonb
  );
$$);

-- domingo 19h de Brasília (22h UTC): resumo da semana
select cron.schedule('dd-resumo-semanal', '0 22 * * 0', $$
  select net.http_post(
    url := 'https://fjpqwwqkewkqlhxwbeau.supabase.co/functions/v1/resumo-semanal',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron', 'TROQUE_PELO_CRON_SECRET'),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$$);
