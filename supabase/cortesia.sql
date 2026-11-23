-- Dear Days: acesso gratuito para sempre (cortesia) para e-mails escolhidos.
-- Funciona para conta que já existe e para conta criada depois.
-- Troque o e-mail no fim do arquivo e rode no SQL Editor. Para dar cortesia a outra pessoa,
-- rode só o bloco do fim com o e-mail dela.

create table if not exists public.cortesias (
  email      text primary key,
  criado_em  timestamptz not null default now()
);
alter table public.cortesias enable row level security; -- ninguém lê pelo app

-- Conta nova: se o e-mail estiver na lista de cortesia, já nasce liberada
create or replace function public.criar_teste_gratis()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.cortesias c where lower(c.email) = lower(new.email)) then
    insert into public.subscriptions (user_id, status, current_period_end)
    values (new.id, 'active', '2099-12-31')
    on conflict (user_id) do update set status = 'active', current_period_end = '2099-12-31', updated_at = now();
  else
    insert into public.subscriptions (user_id) values (new.id) on conflict (user_id) do nothing;
  end if;
  return new;
end $$;

-- ===== Dar cortesia (troque o e-mail) =====
insert into public.cortesias (email) values (lower('EMAIL@EXEMPLO.COM')) on conflict do nothing;

insert into public.subscriptions (user_id, status, current_period_end)
select u.id, 'active', '2099-12-31' from auth.users u where lower(u.email) = lower('EMAIL@EXEMPLO.COM')
on conflict (user_id) do update set status = 'active', current_period_end = '2099-12-31', updated_at = now();
