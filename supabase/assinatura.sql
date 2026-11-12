-- Dear Days: assinaturas (Asaas). Cole no Supabase em SQL Editor > New query > Run,
-- depois de já ter rodado o schema.sql.

-- 1) Situação da assinatura de cada pessoa. Só as funções do servidor escrevem aqui.
create table if not exists public.subscriptions (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  status                text not null default 'trial'
                        check (status in ('trial', 'active', 'past_due', 'canceled')),
  plan                  text check (plan in ('mensal', 'anual')),
  billing_type          text check (billing_type in ('PIX', 'CREDIT_CARD')),
  trial_ends_at         timestamptz not null default (now() + interval '7 days'),
  current_period_end    timestamptz,               -- pago até
  asaas_customer_id     text,
  asaas_subscription_id text unique,
  updated_at            timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- A pessoa só LÊ a própria linha. Nenhuma política de escrita: o app não consegue se dar acesso.
drop policy if exists "ver a minha assinatura" on public.subscriptions;
create policy "ver a minha assinatura" on public.subscriptions for select using (auth.uid() = user_id);

-- 2) Avisos recebidos do Asaas (para não processar o mesmo aviso duas vezes).
create table if not exists public.asaas_events (
  id          text primary key,      -- evt_... do Asaas
  event       text not null,
  payload     jsonb not null,
  received_at timestamptz not null default now()
);
alter table public.asaas_events enable row level security;  -- sem políticas: só o servidor acessa

-- 3) Toda conta nova ganha 7 dias grátis.
create or replace function public.criar_teste_gratis()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists ao_criar_conta_teste on auth.users;
create trigger ao_criar_conta_teste after insert on auth.users
  for each row execute function public.criar_teste_gratis();

-- Contas que já existiam antes deste arquivo também ganham os 7 dias.
insert into public.subscriptions (user_id)
select id from auth.users on conflict (user_id) do nothing;

-- 4) Quem tem acesso agora: no teste, pagando, ou cancelou mas ainda está no período pago.
create or replace function public.tem_acesso(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = uid and (
      (s.status = 'trial' and s.trial_ends_at > now())
      or (s.status in ('active', 'past_due', 'canceled') and s.current_period_end > now())
      or (s.status = 'past_due' and s.current_period_end > now() - interval '3 days')  -- 3 dias de tolerância
    )
  );
$$;

-- 5) OPCIONAL, quando for vender de verdade: só grava no planner quem tem acesso.
--    (Sem isso, o bloqueio é só na tela do app.) Para ligar, tire os "--" das linhas abaixo e rode.
-- drop policy if exists "criar os meus" on public.docs;
-- drop policy if exists "editar os meus" on public.docs;
-- create policy "criar os meus" on public.docs for insert
--   with check (auth.uid() = user_id and public.tem_acesso(auth.uid()));
-- create policy "editar os meus" on public.docs for update
--   using (auth.uid() = user_id) with check (auth.uid() = user_id and public.tem_acesso(auth.uid()));

-- Atualização ao vivo da assinatura no app (quando o pagamento é confirmado).
do $$ begin
  alter publication supabase_realtime add table public.subscriptions;
exception when duplicate_object then null; end $$;
