export const SLOT_DURATION_MINUTES = 45;

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

export const SERVICES = [
  {
    id: 'cabelo',
    name: 'Cabelo',
    description: 'Corte completo com acabamento.',
    price: 28,
    duration: 45,
  },
  {
    id: 'sobrancelhas',
    name: 'Sobrancelhas',
    description: 'Design e alinhamento das sobrancelhas.',
    price: 13,
    duration: 20,
  },
  {
    id: 'platinado',
    name: 'Platinado',
    description: 'Descoloração e tonalização para visual platinado.',
    price: 55,
    duration: 90,
  },
  {
    id: 'acabamento',
    name: 'Acabamento',
    description: 'Limpeza dos contornos para manter a régua em dia.',
    price: 13,
    duration: 20,
  },
  {
    id: 'pigmentacao',
    name: 'Pigmentação',
    description: 'Aplicação de pigmento para acabamento mais marcado.',
    price: 25,
    duration: 45,
  },
  {
    id: 'luzes',
    name: 'Luzes',
    description: 'Mechas e iluminação no cabelo.',
    price: 45,
    duration: 75,
  },
  {
    id: 'barba-simples',
    name: 'Barba simples',
    description: 'Alinhamento e desenho da barba.',
    price: 20,
    duration: 30,
    durationLabel: '25-30 min',
  },
  {
    id: 'barboterapia',
    name: 'Barboterapia',
    description: 'Barba com toalha quente e finalização premium.',
    price: 30,
    duration: 35,
  },
];

export const COMBOS = [
  {
    id: 'cabelo-sobrancelhas',
    name: 'Cabelo + sobrancelhas',
    description: 'Corte completo com sobrancelhas alinhadas.',
    price: 36,
    duration: 60,
  },
  {
    id: 'cabelo-luzes',
    name: 'Cabelo + luzes',
    description: 'Corte completo com luzes.',
    price: 65,
    duration: 105,
  },
  {
    id: 'cabelo-pigmentacao',
    name: 'Cabelo + pigmentação',
    description: 'Corte completo com pigmentação.',
    price: 47,
    duration: 75,
  },
  {
    id: 'cabelo-platinado',
    name: 'Cabelo + platinado',
    description: 'Corte completo com platinado.',
    price: 74,
    duration: 120,
  },
  {
    id: 'cabelo-barba-simples',
    name: 'Cabelo + barba simples',
    description: 'Corte completo com barba simples.',
    price: 43,
    duration: 80,
    durationLabel: '1h20',
  },
  {
    id: 'cabelo-barboterapia',
    name: 'Cabelo + barboterapia',
    description: 'Corte completo com barboterapia.',
    price: 50,
    duration: 90,
  },
  {
    id: 'cabelo-sobrancelhas-luzes',
    name: 'Cabelo + sobrancelhas + luzes',
    description: 'Pacote com corte, sobrancelhas e luzes.',
    price: 77,
    duration: 120,
  },
  {
    id: 'cabelo-sobrancelhas-platinado',
    name: 'Cabelo + sobrancelhas + platinado',
    description: 'Pacote com corte, sobrancelhas e platinado.',
    price: 86,
    duration: 135,
  },
  {
    id: 'cabelo-sobrancelhas-pigmentacao',
    name: 'Cabelo + sobrancelhas + pigmentação',
    description: 'Pacote com corte, sobrancelhas e pigmentação.',
    price: 59,
    duration: 90,
  },
  {
    id: 'cabelo-sobrancelhas-barba-simples',
    name: 'Cabelo + sobrancelhas + barba simples',
    description: 'Pacote com corte, sobrancelhas e barba simples.',
    price: 54,
    duration: 90,
  },
  {
    id: 'cabelo-sobrancelhas-barboterapia',
    name: 'Cabelo + sobrancelhas + barboterapia',
    description: 'Pacote com corte, sobrancelhas e barboterapia.',
    price: 60,
    duration: 105,
  },
  {
    id: 'sobrancelhas-barba-simples',
    name: 'Sobrancelhas + barba simples',
    description: 'Sobrancelhas alinhadas com barba simples.',
    price: 29,
    duration: 45,
  },
  {
    id: 'sobrancelhas-barboterapia',
    name: 'Sobrancelhas + barboterapia',
    description: 'Sobrancelhas alinhadas com barboterapia.',
    price: 38,
    duration: 60,
  },
  {
    id: 'sobrancelhas-acabamento',
    name: 'Sobrancelhas + acabamento',
    description: 'Sobrancelhas com acabamento dos contornos.',
    price: 23,
    duration: 40,
  },
  {
    id: 'sobrancelhas-acabamento-barba-simples',
    name: 'Sobrancelhas + acabamento + barba simples',
    description: 'Sobrancelhas, acabamento e barba simples.',
    price: 41,
    duration: 65,
  },
  {
    id: 'sobrancelhas-acabamento-barboterapia',
    name: 'Sobrancelhas + acabamento + barboterapia',
    description: 'Sobrancelhas, acabamento e barboterapia.',
    price: 50,
    duration: 80,
  },
];

export const BOOKING_SERVICES = [...SERVICES, ...COMBOS];

export const PLAN_TYPES = [
  {
    id: 'semanal',
    name: 'Plano semanal',
    subtitle: 'Máx: 4x/mês',
    description: 'Dias para atendimento do plano semanal: Segunda à Domingo',
    limit: 4,
    validityDays: 30,
    services: [
      { id: 'semanal-cabelo', name: 'Cabelo', price: 89 },
      { id: 'semanal-sobrancelhas', name: 'Sobrancelhas', price: 41 },
      { id: 'semanal-barba-simples', name: 'Barba simples', price: 64 },
      { id: 'semanal-barboterapia', name: 'Barboterapia', price: 96 },
      { id: 'semanal-cabelo-sobrancelhas', name: 'Cabelo + sobrancelhas', price: 131 },
      { id: 'semanal-cabelo-barba-simples', name: 'Cabelo + barba simples', price: 153 },
      { id: 'semanal-cabelo-barboterapia', name: 'Cabelo + barboterapia', price: 185 },
      { id: 'semanal-sobrancelhas-barba-simples', name: 'Sobrancelhas + barba simples', price: 105 },
      { id: 'semanal-sobrancelhas-barboterapia', name: 'Sobrancelhas + barboterapia', price: 137 },
      { id: 'semanal-cabelo-barba-sobrancelhas', name: 'Cabelo + barba + sobrancelhas', price: 195 },
      { id: 'semanal-premium', name: 'Premium', price: 227 },
    ],
  },
  {
    id: 'economico',
    name: 'Plano econômico',
    subtitle: 'Máx: 2x/mês',
    description: 'Dias para atendimento do plano econômico: Segunda à Quarta',
    limit: 2,
    validityDays: 30,
    services: [
      { id: 'economico-cabelo', name: 'Cabelo', price: 45 },
      { id: 'economico-sobrancelhas', name: 'Sobrancelhas', price: 21 },
      { id: 'economico-barba-simples', name: 'Barba simples', price: 32 },
      { id: 'economico-barboterapia', name: 'Barboterapia', price: 48 },
      { id: 'economico-cabelo-barba', name: 'Cabelo + barba', price: 76 },
      { id: 'economico-cabelo-barboterapia', name: 'Cabelo + barboterapia', price: 92 },
      { id: 'economico-cabelo-sobrancelhas', name: 'Cabelo + sobrancelhas', price: 65 },
      { id: 'economico-sobrancelhas-barba-simples', name: 'Sobrancelhas + barba simples', price: 52 },
      { id: 'economico-sobrancelhas-barboterapia', name: 'Sobrancelhas + barboterapia', price: 68 },
      { id: 'economico-cabelo-barba-sobrancelhas', name: 'Cabelo + barba + sobrancelhas', price: 97 },
      { id: 'economico-premium', name: 'Premium', price: 113 },
    ],
    note: '5% de desconto no PIX ou dinheiro. Válido com agendamento prévio. Não cumulativo.',
  },
];

export const AVAILABILITY_WINDOW_DAYS = 31;
