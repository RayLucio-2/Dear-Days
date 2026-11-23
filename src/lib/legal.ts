/**
 * Textos de Termos de uso e Política de privacidade.
 * RASCUNHO para revisão: troque os campos entre colchetes e ajuste o que precisar.
 */
export const RESPONSAVEL = {
  nome: '[SEU NOME COMPLETO OU RAZÃO SOCIAL]',
  doc: '[CPF OU CNPJ]',
  email: '[E-MAIL DE CONTATO]',
  cidade: 'Goiânia/GO',
  atualizado: '12 de novembro de 2026',
};

export type Secao = { t: string; p: string[] };
const R = RESPONSAVEL;

export const TERMOS: Secao[] = [
  { t: '1. Quem somos', p: [
    `O Dear Days é um planner digital oferecido por ${R.nome}, inscrito(a) sob o nº ${R.doc}, com contato pelo e-mail ${R.email} (“Dear Days”, “nós”).`,
    'Ao criar uma conta ou usar o Dear Days, você concorda com estes Termos e com a Política de privacidade. Se não concordar, não use o serviço.',
  ] },
  { t: '2. O serviço', p: [
    'O Dear Days é uma ferramenta de organização pessoal: tarefas, hábitos, metas, registros de humor, finanças pessoais e anotações. Funciona no navegador e pode ser instalado na tela inicial do celular.',
    'O Dear Days não é serviço de saúde, terapia, diagnóstico ou orientação financeira profissional. Os conteúdos e lembretes têm caráter apenas organizacional.',
  ] },
  { t: '3. Conta', p: [
    'Para usar, você precisa ter pelo menos 18 anos, ou a autorização de um responsável legal, e informar um e-mail válido.',
    'Você é responsável por manter sua senha em segredo e por tudo o que for feito na sua conta. Avise-nos se suspeitar de uso indevido.',
  ] },
  { t: '4. Teste grátis, planos e pagamento', p: [
    'Toda conta nova tem 7 dias de teste grátis, sem precisar informar forma de pagamento.',
    'Depois do teste, o uso depende de uma assinatura mensal ou anual, nos valores mostrados na tela Assinatura no momento da contratação. A cobrança é feita pelo Asaas (Asaas Gestão Financeira Instituição de Pagamento S.A.), por Pix ou cartão de crédito. O Dear Days não recebe nem guarda os dados do seu cartão.',
    'A assinatura se renova automaticamente ao fim de cada período. No Pix, uma nova cobrança é enviada a cada renovação; no cartão, o valor é cobrado automaticamente.',
    'Se um pagamento atrasar, o acesso continua por até 3 dias. Depois disso, o planner fica bloqueado até a regularização, mas seus dados continuam guardados.',
    'Podemos alterar os preços com aviso prévio de pelo menos 30 dias. O novo valor só vale a partir da renovação seguinte ao aviso.',
  ] },
  { t: '5. Cancelamento e direito de arrependimento', p: [
    'Você pode cancelar quando quiser em Conta > Assinatura. O acesso continua até o fim do período já pago, e não há novas cobranças.',
    'Nos termos do art. 49 do Código de Defesa do Consumidor, você pode desistir da contratação em até 7 dias após o primeiro pagamento, com devolução integral do valor pago. Para isso, escreva para ' + R.email + '.',
    'Fora desse prazo, os valores de períodos já iniciados não são devolvidos, salvo falha do serviço atribuível a nós.',
  ] },
  { t: '6. Seus dados e seu conteúdo', p: [
    'Tudo o que você escreve no Dear Days é seu. Usamos esse conteúdo apenas para fazer o serviço funcionar (guardar, sincronizar entre aparelhos, enviar os lembretes e o resumo semanal que você ativar).',
    'Você pode baixar uma cópia de tudo em Conta > Baixar cópia e excluir sua conta a qualquer momento em Conta > Excluir minha conta.',
  ] },
  { t: '7. Uso adequado', p: [
    'Não é permitido usar o Dear Days para atividades ilegais, tentar acessar contas de outras pessoas, sobrecarregar ou atacar o serviço, ou copiar e revender o software.',
    'Podemos suspender contas que violem estes Termos, avisando por e-mail sempre que possível.',
  ] },
  { t: '8. Disponibilidade e responsabilidade', p: [
    'Trabalhamos para manter o Dear Days no ar e seus dados seguros, com cópias de segurança feitas pelo nosso provedor. Mesmo assim, o serviço pode ter interrupções para manutenção ou por falhas de terceiros (internet, provedores).',
    'Recomendamos baixar cópias periódicas dos seus dados. Na máxima extensão permitida em lei, nossa responsabilidade fica limitada ao valor pago por você nos 12 meses anteriores ao fato.',
  ] },
  { t: '9. Mudanças nestes Termos', p: [
    'Podemos atualizar estes Termos. Mudanças importantes serão avisadas por e-mail ou dentro do app com antecedência razoável.',
  ] },
  { t: '10. Lei e foro', p: [
    `Estes Termos seguem as leis brasileiras. Fica eleito o foro do domicílio do consumidor; não sendo o caso de relação de consumo, o foro de ${R.cidade}.`,
  ] },
];

export const PRIVACIDADE: Secao[] = [
  { t: '1. Quem cuida dos seus dados', p: [
    `O controlador dos dados é ${R.nome}, ${R.doc}. Encarregado(a) pelo tratamento de dados (DPO): ${R.nome}, pelo e-mail ${R.email}.`,
    'Esta política explica quais dados o Dear Days usa, para quê, com quem compartilha e quais são os seus direitos pela Lei Geral de Proteção de Dados (Lei nº 13.709/2018, LGPD).',
  ] },
  { t: '2. Quais dados usamos', p: [
    'Cadastro: e-mail e senha (a senha é guardada criptografada; ninguém consegue lê-la).',
    'Conteúdo do planner: tarefas, hábitos, metas, anotações, finanças pessoais e registros de humor e emoções que você escolher escrever.',
    'Pagamento: nome, CPF ou CNPJ, e-mail e, se informar, celular, para emitir as cobranças. Os dados do cartão são digitados diretamente na página do Asaas e não passam pelo Dear Days.',
    'Uso técnico: endereço IP, tipo de navegador e registros de acesso, guardados pelos nossos provedores por segurança.',
    'Opcionais: o endereço da sua agenda (se ligar o Google Agenda) e a autorização do navegador para receber lembretes.',
  ] },
  { t: '3. Para que usamos e com qual base legal', p: [
    'Prestar o serviço que você contratou: guardar e sincronizar o planner, enviar lembretes e o resumo semanal (execução de contrato, art. 7º, V).',
    'Cobrar a assinatura e emitir as cobranças (execução de contrato e cumprimento de obrigação legal, art. 7º, II e V).',
    'Segurança e prevenção de fraudes (legítimo interesse, art. 7º, IX).',
    'Registros de humor e emoções podem revelar informações sobre saúde. Eles são tratados apenas para mostrar a você seus próprios registros e gráficos, com base no seu consentimento ao escrevê-los (art. 11, I), que você pode retirar apagando os registros ou a conta.',
    'Não vendemos seus dados, não usamos seu conteúdo para publicidade e não treinamos inteligência artificial com ele.',
  ] },
  { t: '4. Com quem compartilhamos', p: [
    'Só com os prestadores necessários para o Dear Days funcionar, que tratam os dados conforme nossas instruções:',
    'Supabase (banco de dados, login e funções do servidor), Netlify (hospedagem do site), Asaas (cobranças), Resend (envio de e-mails) e, se você ligar, Google (leitura da sua agenda).',
    'Alguns desses provedores guardam dados fora do Brasil, como nos Estados Unidos. Nesses casos, a transferência segue o art. 33 da LGPD, com cláusulas contratuais e medidas de segurança do provedor.',
    'Também podemos fornecer dados por ordem judicial ou exigência legal.',
  ] },
  { t: '5. Por quanto tempo guardamos', p: [
    'Enquanto sua conta existir. Ao excluir a conta, apagamos o conteúdo do planner e o cadastro na hora; cópias de segurança do provedor são substituídas em até 30 dias.',
    'Dados de cobrança podem ser guardados pelo prazo exigido por lei (por exemplo, obrigações fiscais) mesmo após a exclusão.',
  ] },
  { t: '6. Seus direitos', p: [
    'Você pode, a qualquer momento: confirmar se tratamos seus dados, acessá-los, corrigi-los, pedir a portabilidade, pedir a exclusão, saber com quem compartilhamos e revogar consentimentos (art. 18 da LGPD).',
    'Quase tudo você faz sozinho(a) no app: Conta > Baixar cópia (acesso e portabilidade) e Conta > Excluir minha conta (exclusão). Para o resto, escreva para ' + R.email + '. Respondemos em até 15 dias.',
    'Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).',
  ] },
  { t: '7. Segurança', p: [
    'Os dados trafegam criptografados (HTTPS) e cada pessoa só consegue ler os próprios dados no banco (regras de acesso por usuário). As chaves de pagamento ficam apenas no servidor.',
    'Se acontecer um incidente de segurança que possa trazer risco a você, avisaremos você e a ANPD, como manda a lei.',
  ] },
  { t: '8. Cookies e armazenamento no aparelho', p: [
    'O Dear Days guarda no seu navegador ou celular uma cópia dos seus dados e a sua sessão, para funcionar sem internet e abrir mais rápido. Não usamos cookies de publicidade nem rastreadores de terceiros.',
  ] },
  { t: '9. Mudanças', p: [
    'Se esta política mudar de forma importante, avisaremos por e-mail ou dentro do app.',
  ] },
];
