export const APPOINTMENTS_COLLECTION = 'agendamentos';
export const PLANS_COLLECTION = 'planos_mensais';
export const BLOCKED_PERIODS_COLLECTION = 'agenda_bloqueios';
export const PUSH_SUBSCRIPTIONS_COLLECTION = 'push_inscricoes';
export const CLIENT_SUBSCRIPTIONS_COLLECTION = 'cliente_inscricoes';
export const CLIENT_PROFILES_COLLECTION = 'clientes';
export const FINISHED_SERVICES_COLLECTION = 'atendimentos_finalizados';
export const CANCELED_SERVICES_COLLECTION = 'atendimentos_cancelados';
export const COMPLETED_PLANS_COLLECTION = 'planos_concluidos';
export const AVAILABILITY_WINDOW_DAYS = 31;
export const BLOCK_KIND_DATE = 'date';
export const BLOCK_KIND_SLOT = 'slot';
export const WEEKDAY_TIME_SLOTS = [
  '09:00',
  '09:45',
  '10:30',
  '11:15',
  '13:00',
  '13:45',
  '14:30',
  '15:15',
  '16:00',
  '16:45',
  '17:30',
  '18:15',
];

export const EXTENDED_WEEKDAY_TIME_SLOTS = [
  ...WEEKDAY_TIME_SLOTS,
  '19:30',
];

export const SUNDAY_TIME_SLOTS = [
  '09:00',
  '09:45',
  '10:30',
  '11:15',
  '12:00',
  '12:45',
];

export const TIME_SLOTS = [
  ...new Set([...EXTENDED_WEEKDAY_TIME_SLOTS, ...WEEKDAY_TIME_SLOTS, ...SUNDAY_TIME_SLOTS]),
];

export function getTimeSlotsForDate(date = '') {
  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return EXTENDED_WEEKDAY_TIME_SLOTS;
  }

  const day = parsedDate.getDay();

  if (day === 0) {
    return SUNDAY_TIME_SLOTS;
  }

  if ([1, 2, 3, 5, 6].includes(day)) {
    return EXTENDED_WEEKDAY_TIME_SLOTS;
  }

  return WEEKDAY_TIME_SLOTS;
}

export const SERVICES = {
  cabelo: { id: 'cabelo', nome: 'Cabelo', preco: 28 },
  sobrancelhas: { id: 'sobrancelhas', nome: 'Sobrancelhas', preco: 13 },
  platinado: { id: 'platinado', nome: 'Platinado', preco: 55 },
  acabamento: { id: 'acabamento', nome: 'Acabamento', preco: 13 },
  pigmentacao: { id: 'pigmentacao', nome: 'Pigmentação', preco: 25 },
  luzes: { id: 'luzes', nome: 'Luzes', preco: 45 },
  'barba-simples': { id: 'barba-simples', nome: 'Barba simples', preco: 20 },
  barboterapia: { id: 'barboterapia', nome: 'Barboterapia', preco: 30 },
  'cabelo-sobrancelhas': { id: 'cabelo-sobrancelhas', nome: 'Cabelo + sobrancelhas', preco: 36 },
  'cabelo-luzes': { id: 'cabelo-luzes', nome: 'Cabelo + luzes', preco: 65 },
  'cabelo-pigmentacao': { id: 'cabelo-pigmentacao', nome: 'Cabelo + pigmentação', preco: 47 },
  'cabelo-platinado': { id: 'cabelo-platinado', nome: 'Cabelo + platinado', preco: 74 },
  'cabelo-barba-simples': { id: 'cabelo-barba-simples', nome: 'Cabelo + barba simples', preco: 43 },
  'cabelo-barboterapia': { id: 'cabelo-barboterapia', nome: 'Cabelo + barboterapia', preco: 50 },
  'cabelo-sobrancelhas-luzes': { id: 'cabelo-sobrancelhas-luzes', nome: 'Cabelo + sobrancelhas + luzes', preco: 77 },
  'cabelo-sobrancelhas-platinado': { id: 'cabelo-sobrancelhas-platinado', nome: 'Cabelo + sobrancelhas + platinado', preco: 86 },
  'cabelo-sobrancelhas-pigmentacao': { id: 'cabelo-sobrancelhas-pigmentacao', nome: 'Cabelo + sobrancelhas + pigmentação', preco: 59 },
  'cabelo-sobrancelhas-barba-simples': { id: 'cabelo-sobrancelhas-barba-simples', nome: 'Cabelo + sobrancelhas + barba simples', preco: 54 },
  'cabelo-sobrancelhas-barboterapia': { id: 'cabelo-sobrancelhas-barboterapia', nome: 'Cabelo + sobrancelhas + barboterapia', preco: 60 },
  'sobrancelhas-barba-simples': { id: 'sobrancelhas-barba-simples', nome: 'Sobrancelhas + barba simples', preco: 29 },
  'sobrancelhas-barboterapia': { id: 'sobrancelhas-barboterapia', nome: 'Sobrancelhas + barboterapia', preco: 38 },
  'sobrancelhas-acabamento': { id: 'sobrancelhas-acabamento', nome: 'Sobrancelhas + acabamento', preco: 23 },
  'sobrancelhas-acabamento-barba-simples': { id: 'sobrancelhas-acabamento-barba-simples', nome: 'Sobrancelhas + acabamento + barba simples', preco: 41 },
  'sobrancelhas-acabamento-barboterapia': { id: 'sobrancelhas-acabamento-barboterapia', nome: 'Sobrancelhas + acabamento + barboterapia', preco: 50 },
};

export const PLAN_OPTIONS = {
  'semanal-cabelo': { id: 'semanal-cabelo', plano: 'Plano semanal', servico: 'Cabelo', preco: 89, limite: 4 },
  'semanal-sobrancelhas': { id: 'semanal-sobrancelhas', plano: 'Plano semanal', servico: 'Sobrancelhas', preco: 41, limite: 4 },
  'semanal-barba-simples': { id: 'semanal-barba-simples', plano: 'Plano semanal', servico: 'Barba simples', preco: 64, limite: 4 },
  'semanal-barboterapia': { id: 'semanal-barboterapia', plano: 'Plano semanal', servico: 'Barboterapia', preco: 96, limite: 4 },
  'semanal-cabelo-sobrancelhas': { id: 'semanal-cabelo-sobrancelhas', plano: 'Plano semanal', servico: 'Cabelo + sobrancelhas', preco: 131, limite: 4 },
  'semanal-cabelo-barba-simples': { id: 'semanal-cabelo-barba-simples', plano: 'Plano semanal', servico: 'Cabelo + barba simples', preco: 153, limite: 4 },
  'semanal-cabelo-barboterapia': { id: 'semanal-cabelo-barboterapia', plano: 'Plano semanal', servico: 'Cabelo + barboterapia', preco: 185, limite: 4 },
  'semanal-sobrancelhas-barba-simples': { id: 'semanal-sobrancelhas-barba-simples', plano: 'Plano semanal', servico: 'Sobrancelhas + barba simples', preco: 105, limite: 4 },
  'semanal-sobrancelhas-barboterapia': { id: 'semanal-sobrancelhas-barboterapia', plano: 'Plano semanal', servico: 'Sobrancelhas + barboterapia', preco: 137, limite: 4 },
  'semanal-cabelo-barba-sobrancelhas': { id: 'semanal-cabelo-barba-sobrancelhas', plano: 'Plano semanal', servico: 'Cabelo + barba + sobrancelhas', preco: 195, limite: 4 },
  'semanal-premium': { id: 'semanal-premium', plano: 'Plano semanal', servico: 'Premium', preco: 227, limite: 4 },
  'economico-cabelo': { id: 'economico-cabelo', plano: 'Plano econômico', servico: 'Cabelo', preco: 45, limite: 2 },
  'economico-sobrancelhas': { id: 'economico-sobrancelhas', plano: 'Plano econômico', servico: 'Sobrancelhas', preco: 21, limite: 2 },
  'economico-barba-simples': { id: 'economico-barba-simples', plano: 'Plano econômico', servico: 'Barba simples', preco: 32, limite: 2 },
  'economico-barboterapia': { id: 'economico-barboterapia', plano: 'Plano econômico', servico: 'Barboterapia', preco: 48, limite: 2 },
  'economico-cabelo-barba': { id: 'economico-cabelo-barba', plano: 'Plano econômico', servico: 'Cabelo + barba', preco: 76, limite: 2 },
  'economico-cabelo-barboterapia': { id: 'economico-cabelo-barboterapia', plano: 'Plano econômico', servico: 'Cabelo + barboterapia', preco: 92, limite: 2 },
  'economico-cabelo-sobrancelhas': { id: 'economico-cabelo-sobrancelhas', plano: 'Plano econômico', servico: 'Cabelo + sobrancelhas', preco: 65, limite: 2 },
  'economico-sobrancelhas-barba-simples': { id: 'economico-sobrancelhas-barba-simples', plano: 'Plano econômico', servico: 'Sobrancelhas + barba simples', preco: 52, limite: 2 },
  'economico-sobrancelhas-barboterapia': { id: 'economico-sobrancelhas-barboterapia', plano: 'Plano econômico', servico: 'Sobrancelhas + barboterapia', preco: 68, limite: 2 },
  'economico-cabelo-barba-sobrancelhas': { id: 'economico-cabelo-barba-sobrancelhas', plano: 'Plano econômico', servico: 'Cabelo + barba + sobrancelhas', preco: 97, limite: 2 },
  'economico-premium': { id: 'economico-premium', plano: 'Plano econômico', servico: 'Premium', preco: 113, limite: 2 },
};
