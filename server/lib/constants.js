export const APPOINTMENTS_COLLECTION = 'agendamentos';
export const PLANS_COLLECTION = 'planos_mensais';
export const BLOCKED_PERIODS_COLLECTION = 'agenda_bloqueios';
export const PUSH_SUBSCRIPTIONS_COLLECTION = 'push_inscricoes';
export const CLIENT_SUBSCRIPTIONS_COLLECTION = 'cliente_inscricoes';
export const CLIENT_WHATSAPP_NOTIFICATIONS_COLLECTION = 'cliente_whatsapp_notificacoes';
export const CLIENT_PROFILES_COLLECTION = 'clientes';
export const FINISHED_SERVICES_COLLECTION = 'atendimentos_finalizados';
export const CANCELED_SERVICES_COLLECTION = 'atendimentos_cancelados';
export const COMPLETED_PLANS_COLLECTION = 'planos_concluidos';
export const AVAILABILITY_WINDOW_DAYS = 31;
export const BLOCK_KIND_DATE = 'date';
export const BLOCK_KIND_SLOT = 'slot';

export const TIME_SLOTS = ['08:00', '10:00'];
export const WEEKDAY_TIME_SLOTS = TIME_SLOTS;
export const EXTENDED_WEEKDAY_TIME_SLOTS = TIME_SLOTS;
export const SUNDAY_TIME_SLOTS = [];

export function getTimeSlotsForDate(date = '') {
  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return TIME_SLOTS;
  }

  return [2, 3, 4].includes(parsedDate.getDay()) ? TIME_SLOTS : [];
}

const services = [
  ['alicate', 'Alicate', 'Amolação de ferramentas', 12],
  ['tesoura', 'Tesoura', 'Amolação de ferramentas', 15],
  ['faca', 'Faca', 'Amolação de ferramentas', 10],
  ['confeccao-chave-simples', 'Confecção de chave simples', 'Chaves de carro', 45],
  ['confeccao-chave-canivete', 'Confecção de chave canivete', 'Chaves de carro', 130],
  ['limpeza-de-chaves', 'Limpeza de chaves', 'Chaves de carro', 25],
  ['programacao-de-chip', 'Programação de chip', 'Chaves de carro', 180],
  ['confeccao-chave-telecomando', 'Confecção de chave com telecomando', 'Chaves de carro', 250],
  ['troca-de-pilha', 'Troca de pilha', 'Chaves de carro', 20],
  ['troca-de-botao', 'Troca de botão', 'Chaves de carro', 35],
  ['troca-de-segredo-auto', 'Troca de segredo', 'Chaves de carro', 150],
  ['troca-carcaca-canivete', 'Troca de carcaça canivete', 'Chaves de carro', 75],
  ['capa-silicone-auto', 'Capa de silicone', 'Chaves de carro', 20],
  ['corte-de-laminas', 'Corte de lâminas', 'Chaves de carro', 45],
  ['alarme-simples', 'Alarme simples', 'Chaves de carro', 180],
  ['copias-auto', 'Cópias', 'Chaves de carro', 50],
  ['codificacao-auto', 'Codificação', 'Chaves de carro', 200],
  ['alarmes-auto', 'Alarmes', 'Chaves de carro', 220],
  ['troca-de-carcaca-auto', 'Troca de carcaça', 'Chaves de carro', 65],
  ['capas-de-silicone-auto', 'Capas de silicone', 'Chaves de carro', 20],
  ['carimbo-madeira-logo', 'Carimbos de madeira para logo', 'Carimbos', 45],
  ['linha-trodat', 'Linha Trodat', 'Carimbos', 75],
  ['linha-nykon', 'Linha Nykon', 'Carimbos', 65],
  ['abertura-de-cofres', 'Abertura de cofres', 'Fechaduras em geral', 180],
  ['abertura-gaveta-caixa', 'Abertura de gaveta de caixa', 'Fechaduras em geral', 80],
  ['abertura-de-cadeados', 'Abertura de cadeados', 'Fechaduras em geral', 35],
  ['unificacao-de-segredo', 'Unificação de segredo', 'Fechaduras em geral', 120],
  ['manutencao-de-fechadura', 'Manutenção de fechadura', 'Fechaduras em geral', 70],
  ['instalacao-de-fechadura', 'Instalação de fechadura', 'Fechaduras em geral', 120],
  ['controle-portao-eletronico', 'Controle para portão eletrônico', 'Portões', 55],
];

export const SERVICES = Object.fromEntries(
  services.map(([id, nome, categoria, preco]) => [
    id,
    {
      id,
      nome,
      categoria,
      preco,
    },
  ]),
);

export const PLAN_OPTIONS = {};
