# Dear Days (app e site em Expo)

Dear Days para Android, iPhone e navegador, feito em React Native com Expo.

**Nome:** use **Dear Days** do mesmo jeito em todo lugar: app, site, Play Store, App Store e Instagram.
Usa o mesmo formato de dados do planner web, então a cópia baixada lá entra aqui direto.

## Um projeto, três lugares

O mesmo código vira **o site** (navegador do computador ou do celular), **o app Android** e **o app iPhone**.
Todos entram com a mesma conta e leem a mesma tabela `docs` no Supabase. Mexeu no site, o celular atualiza na hora, e o contrário também.

| Onde | Como abre | Como atualiza |
|---|---|---|
| Site | endereço da Netlify | `npm run web:build` e publicar a pasta `dist` |
| Android | APK de teste ou Play Store | `eas build -p android` |
| iPhone | TestFlight ou App Store | `eas build -p ios` |

No computador (tela larga) o site mostra o menu na lateral e as páginas em duas colunas. No celular, as abas ficam embaixo e o resto fica em **Mais**.

## O que tem

| Página | O que tem |
|---|---|
| Início | resumo de hoje, contagem até a próxima tarefa, caixa de entrada, revisão da semana, metas e saldo |
| Dia | Dia completo ou Modo foco, prioridades, rotinas, tarefas com subtarefas, hábitos, humor, água, sono, exercício, alimentação, horários, gastos e "uma coisa boa" |
| Semana | compromissos de cada dia, prioridades, a fazer e humor da semana |
| Mês | calendário, 3 metas, prioridades e notas |
| Hábitos | marcar os dias, porcentagem e sequência com folga |
| Finanças | entradas, fixas, variáveis, parcelas, outras despesas, esperar 24h e meta de economia |
| Emoções | calendário das emoções e flor do sentir |
| Gráficos | dinheiro, saldo mês a mês, humor, tarefas, água, hábitos e categorias |
| Plano do ano | palavra do ano, 10 áreas com nota, meta e passo, metas de cada mês |
| Tarefas fixas | criar, escolher dias e cor |
| Ferramentas | Prefácio, Pilares, Roda da vida, Metas para 5 anos, Plano de vida, Do sentir à ação, Hobbies, Top 3 de sonhos, Diário de leituras, Memórias, Reflexão semestral, Carta para o eu do futuro, Notas rápidas, Escrita terapêutica |
| Personalizar (em Mais) | cor do planner, abas e ordem, blocos do Início, atalhos e a tela que abre primeiro (Início, Dia ou Modo foco). Fica em `t-cfg` e vale no site e no app |
| Google Agenda | botão em cada tarefa (abre o evento já preenchido), tarefas fixas entram como evento que se repete, e "Agenda" no Dia baixa um arquivo .ics com o dia inteiro (Google, iPhone ou Outlook) |
| Conta | senha, avisos, baixar e importar cópia, sair |

Tudo salva sozinho: primeiro no aparelho (funciona sem internet) e depois no Supabase.

## 1. Instalar no computador

Precisa do [Node.js LTS](https://nodejs.org). Na pasta do projeto:

```bash
npm install
```

## 2. Testar sem Supabase (mais rápido)

```bash
npx expo start
```

- No celular, instale o app **Expo Go** e leia o QR code que aparece no terminal.
- Ou aperte `w` para abrir no navegador.

Sem o arquivo `.env`, a tela de login mostra **Testar sem conta**. Os dados ficam só naquele aparelho.

## 3. Ligar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (o plano grátis serve).
2. Vá em **SQL Editor > New query**, cole o arquivo `supabase/schema.sql` e clique em **Run**.
3. Em **Project Settings > API**, copie a **Project URL** e a **Publishable key**.
4. Copie `.env.example` para `.env` e cole os dois valores.
5. Rode `npx expo start` de novo (o `.env` só é lido ao iniciar).
6. Em **Authentication > URL Configuration**, coloque o endereço do seu site em Site URL
   (é para onde vai o link de confirmação de e-mail).

Use a mesma tabela no planner web e no app, assim os dois ficam sincronizados.

## 4. Trazer seus dados do planner antigo

1. No planner web: **Ajustes > Baixar cópia** (baixa um `.json`).
2. Mande o arquivo para o celular (e-mail, Drive, WhatsApp).
3. No app: toque no ícone de pessoa no Início, depois **Escolher arquivo de cópia**.

## 5. Gerar o APK para testar

```bash
npm install -g eas-cli
eas login
eas build:configure      # só na primeira vez
eas build -p android --profile preview
```

O perfil `preview` (em `eas.json`) gera um **.apk** que você instala direto no Android.
No fim aparece um link e um QR code para baixar.

Antes do primeiro build, troque `com.seunome.deardays` em `app.json` pelo seu nome
(ex.: `com.rayane.deardays`). Depois de publicar na loja, esse nome não muda mais.

As variáveis do `.env` não vão junto no build da nuvem. Cadastre as duas também no site
do Expo: **Project > Environment variables**, ambiente *preview* e *production*
(ou rode `eas env:create`).

Para a Play Store, use `eas build -p android --profile production` (gera .aab).

## 6. Publicar o site

O site é o mesmo app. As chaves do Supabase entram **na hora de gerar o site**, então gere com o `.env` preenchido.

**Jeito mais simples (arrastar e soltar):**
1. Rode `npm run web:build`. Isso cria a pasta `dist`.
2. Entre em app.netlify.com/drop e arraste a pasta `dist`.
3. A Netlify dá um endereço (ex.: `deardays.netlify.app`). Você pode trocar o nome em Site configuration.
4. Para atualizar depois, gere de novo e arraste em **Deploys > Drag and drop**.

**Jeito automático (pelo GitHub):**
1. Suba o projeto para um repositório no GitHub (o `.env` não vai junto, isso é bom).
2. Na Netlify: **Add new site > Import an existing project** e escolha o repositório. O `netlify.toml` já diz o comando e a pasta.
3. Em **Site configuration > Environment variables**, cadastre `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. A cada envio para o GitHub, o site se atualiza sozinho.

**Depois de publicar, no Supabase:**
1. **Authentication > URL Configuration > Site URL**: o endereço do site.
2. Em **Redirect URLs**, adicione o endereço do site com `/**` no fim (ex.: `https://deardays.netlify.app/**`) e também `deardays://**` (para o app).

Os links de confirmação de conta e de "esqueci a senha" voltam para o site. No "esqueci a senha", o site abre a Conta para você criar a senha nova.

O arquivo `public/_redirects` (e o `netlify.toml`) faz páginas como `/dia` e `/ferramenta?k=roda` abrirem direto, mesmo recarregando.

## 7. Sair do planner antigo do Claude

O planner que está no Claude não consegue falar com o Supabase, então ele não sincroniza com o app. O site novo substitui ele.
1. No planner antigo: **Ajustes > Baixar cópia**.
2. No site novo ou no app: **Conta > Escolher arquivo de cópia**.
3. Pronto: tudo aparece no site e no celular.

## 8. Assinatura (Asaas, Pix e cartão)

Cada pessoa nova ganha **7 dias grátis**. Depois disso, o app mostra a tela **Assinatura** e só libera de novo quando o pagamento é confirmado. Os dados nunca são apagados.

Preços: **R$ 14,90/mês** e **R$ 119,90/ano**. Para mudar, troque em dois lugares: `src/lib/assinatura.ts` (o que aparece no app) e os segredos `PRECO_MENSAL` / `PRECO_ANUAL` do Supabase (o que é cobrado).

Como funciona: o app chama uma função do Supabase, ela cria a assinatura no Asaas e abre a página de pagamento do próprio Asaas. Quando a pessoa paga, o Asaas avisa o Supabase (webhook) e o acesso libera sozinho. **A chave do Asaas fica só no Supabase**, nunca no app, no site ou no Git.

### 8.1 Criar as tabelas
Supabase > **SQL Editor** > New query > cole o conteúdo de `supabase/assinatura.sql` > **Run**.
Quem já tem conta ganha 7 dias de teste a partir de agora.

### 8.2 Instalar a ferramenta do Supabase e entrar
No terminal, dentro da pasta do projeto:
```
npx supabase login
npx supabase link --project-ref fjpqwwqkewkqlhxwbeau
```
(o `login` abre o navegador; o `link` pede a senha do banco, a mesma de quando você criou o projeto)

### 8.3 Guardar os segredos
Invente uma senha longa para o webhook (por exemplo 30 letras e números misturados). Depois rode, trocando os valores **no seu terminal** (não mande a chave para ninguém):
```
npx supabase secrets set ASAAS_ENV=sandbox ASAAS_API_KEY='COLE_A_CHAVE_DO_ASAAS' ASAAS_WEBHOOK_TOKEN='SUA_SENHA_DO_WEBHOOK'
```
Use aspas simples, porque a chave do Asaas começa com `$`.
Para mudar o preço (opcional): `npx supabase secrets set PRECO_MENSAL=14.90 PRECO_ANUAL=119.90`

### 8.4 Publicar as funções
```
npx supabase functions deploy assinar
npx supabase functions deploy cancelar
npx supabase functions deploy asaas-webhook --no-verify-jwt
```

### 8.5 Ligar o webhook no Asaas
Asaas > **Integrações > Webhooks** > Adicionar:
- **URL:** `https://fjpqwwqkewkqlhxwbeau.supabase.co/functions/v1/asaas-webhook`
- **Token de autenticação:** a mesma senha do `ASAAS_WEBHOOK_TOKEN`
- **Versão da API:** v3, **Tipo de envio:** sequencial, **Ativo:** sim
- **Eventos:** Cobrança confirmada, Cobrança recebida, Cobrança vencida, Cobrança estornada, Chargeback solicitado, Assinatura removida, Assinatura inativada
  (nomes técnicos: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `PAYMENT_CHARGEBACK_REQUESTED`, `SUBSCRIPTION_DELETED`, `SUBSCRIPTION_INACTIVATED`)

### 8.6 Testar no sandbox
1. Entre no site com uma conta de teste > **Conta > Assinatura > Ver planos e assinar**.
2. Use um CPF de teste válido (por exemplo um gerado em geradores de CPF) e escolha Pix ou cartão.
3. Na página do Asaas:
   - **Cartão:** número `4444 4444 4444 4444`, validade futura, CVV `123`.
   - **Pix:** no painel do sandbox, abra a cobrança e use **Confirmar pagamento** (no sandbox ninguém paga de verdade).
4. Volte ao Dear Days: em alguns segundos aparece **Assinatura ativa**. Se não aparecer, toque em **Já paguei, atualizar**.
5. Se der erro: Supabase > **Edge Functions > asaas-webhook > Logs**, e no Asaas a fila do webhook mostra o que foi enviado.

Para testar o bloqueio sem esperar 7 dias, no SQL Editor:
`update subscriptions set trial_ends_at = now() - interval '1 day' where status = 'trial';`

### 8.7 Quando for vender de verdade
1. Gere a chave de **produção** no Asaas (conta aprovada).
2. `npx supabase secrets set ASAAS_ENV=producao ASAAS_API_KEY='CHAVE_DE_PRODUCAO'`
3. Crie o mesmo webhook no Asaas de produção.
4. A chave de sandbox que você criou vence em **14/11/2026**. Se ainda for testar depois disso, gere outra e rode o `secrets set` de novo.

### 8.8 Bloqueio também no servidor (opcional)
O bloqueio é feito no app. Se quiser que o banco também recuse salvar para quem não assinou, rode as políticas comentadas no fim de `supabase/assinatura.sql`.

## Comandos úteis

| Comando | Para quê |
|---|---|
| `npx expo start` | rodar no Expo Go ou no navegador |
| `npm run typecheck` | conferir erros de TypeScript |
| `npx expo lint` | conferir o código |
| `npm run web:build` | gerar o site |
| `npx expo install nome-do-pacote` | instalar pacote na versão certa do Expo |

## Onde está cada coisa

```
src/app/              telas (cada arquivo é uma rota)
  _layout.tsx         fontes e login
  login.tsx           entrar, criar conta, esqueci a senha
  conta.tsx           importar cópia e sair
  (tabs)/             as abas de baixo
src/lib/
  planner.ts          regras do planner (tarefas fixas, hábitos, parcelas, somas)
  store.ts            dados na memória, cópia no aparelho e sincronização
  supabase.ts         conexão com o Supabase
  dates.ts, money.ts  datas, feriados e dinheiro em reais
  theme.ts            cores e fontes
src/components/       peças reaproveitadas (cartões, campos, carinhas, copos)
supabase/schema.sql   tabela e regras de segurança
```

## Pensado para TDAH

| Recurso | Onde fica | Onde guarda |
|---|---|---|
| Modo foco (uma tarefa por vez, Feito, Pular, Passar para amanhã) | Dia > Modo foco | `t-cfg.app.foco` |
| Escolher quais cartões aparecem | Dia > fim da tela > Escolher o que aparece | `t-cfg.app.ocultos` |
| Primeiro passo, estimativa de tempo, energia que a tarefa pede | Dia > tarefa > seta | `tl[i].first`, `est`, `real`, `en` |
| Energia do dia (com energia baixa, o foco guarda as tarefas pesadas) | Dia, no resumo do topo | `d-.energia` (0, 1, 2) |
| Só 5 minutos e timer visual (o tempo gasto vai para "levou X min") | Modo foco | `tl[i].real` |
| Linha do "agora" em Horários e contagem até a próxima tarefa | Dia e Início | |
| Botão + em todas as abas e caixa de entrada | botão roxo, Início | `t-inbox.l` |
| Trazer tarefas de ontem para hoje, sem bronca | topo do Dia | |
| Sequência de hábitos com 1 folga por semana | Hábitos | |
| Vibração leve e pulinho ao marcar, anel de progresso | todo o app | |
| Rotina da manhã e da noite em sequência | Dia > Agora | `t-rotinas`, `d-.rot` |
| Revisão da semana em 3 passos | Início (sexta a domingo) | `w-.rev`, `w-<próxima>.prios` |
| Esperar 24h antes de comprar | Finanças | `t-wish` |
| Avisos gentis (tarefas, água, compras) | Conta > Avisos | `t-cfg.app.avisos` |

**Avisos no celular:** os avisos são agendados no próprio aparelho, sem servidor. No Expo Go eles funcionam com limitações; para testar de verdade, gere o APK de teste (`eas build -p android --profile preview`). No navegador não há avisos.

## Modo foco, cartões e subtarefas

- O modo escolhido (Dia completo ou Modo foco) e quais cartões estão fechados ficam salvos em `t-cfg` (`app.foco` e `app.fechados`), então valem em todos os aparelhos.
- A fila do modo foco segue esta ordem: prioridades, depois tarefas e tarefas fixas pelo horário. "Depois" manda a tarefa para o fim da fila só enquanto a tela está aberta.
- Subtarefas ficam dentro da tarefa: `tl[i].sub = [{ t, ok }]`. Quando todas são marcadas, a tarefa também fica feita. O planner web ainda não mostra as subtarefas, mas guarda elas sem apagar.

## Formato dos dados

Uma tabela `docs` com uma linha por página: `d-2026-11-04` (dia), `m-2026-11` (mês),
`f-2026-11` (finanças), `w-...` (semana), `y-2026` (ano) e `t-...` (hábitos, tarefas fixas,
parcelas, ajustes e ferramentas). Cada linha guarda um JSON igual ao do planner web.
