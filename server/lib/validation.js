import {
  BLOCK_KIND_DATE,
  BLOCK_KIND_SLOT,
  PLAN_OPTIONS,
  SERVICES,
  getTimeSlotsForDate,
} from './constants.js';

const DEFAULT_BUSINESS_TIME_ZONE = 'America/Recife';

function stripWrappingQuotes(value = '') {
  const trimmed = String(value || '').trim();
  const first = trimmed.at(0);
  const last = trimmed.at(-1);

  if ((first === '"' || first === "'") && first === last) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

export function normalizePhone(value = '') {
  return String(value).replace(/\D/g, '').slice(0, 11);
}

export function isValidPhone(value = '') {
  const digits = normalizePhone(value);
  return digits.length === 10 || digits.length === 11;
}

export function buildAvailableDates() {
  const dates = [];
  const current = new Date(`${getTodayInBusinessTimeZone()}T00:00:00`);
  const currentMonth = current.getMonth();

  while (current.getMonth() === currentMonth) {
    const date = current.toISOString().slice(0, 10);

    if (getTimeSlotsForDate(date).length > 0) {
      dates.push(date);
    }

    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function getBusinessTimeZone() {
  const timeZone = stripWrappingQuotes(process.env.BARBERGS_TIME_ZONE || DEFAULT_BUSINESS_TIME_ZONE);

  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return DEFAULT_BUSINESS_TIME_ZONE;
  }
}

export function getZonedDateParts(date = new Date(), timeZone = getBusinessTimeZone()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const values = Object.fromEntries(
    formatter.formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

export function getTodayInBusinessTimeZone(now = new Date()) {
  const parts = getZonedDateParts(now);
  return [
    parts.year,
    String(parts.month).padStart(2, '0'),
    String(parts.day).padStart(2, '0'),
  ].join('-');
}

export function isPastSameDaySlot(date = '', time = '', now = new Date()) {
  if (!isIsoDate(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return false;
  }

  if (date !== getTodayInBusinessTimeZone(now)) {
    return false;
  }

  const parts = getZonedDateParts(now);
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute <= parts.hour * 60 + parts.minute;
}

export function getAvailableTimeSlotsForDate(date = '', now = new Date()) {
  return getTimeSlotsForDate(date).filter((time) => !isPastSameDaySlot(date, time, now));
}

function isIsoDate(value = '') {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isFutureOrToday(value = '') {
  if (!isIsoDate(value)) {
    return false;
  }

  const current = new Date(`${getTodayInBusinessTimeZone()}T00:00:00`);
  const selected = new Date(`${value}T00:00:00`);
  return !Number.isNaN(selected.getTime()) && selected >= current;
}

export function buildBlockedPeriodId(date, time = '') {
  const normalizedTime = String(time || '').trim().replace(':', '-');
  return normalizedTime ? `${date}__${normalizedTime}` : `${date}__dia-todo`;
}

export function validateBlockedPeriodPayload(payload) {
  const date = String(payload?.date || '').trim();
  const time = String(payload?.time || '').trim();

  if (!isFutureOrToday(date)) {
    return 'Escolha uma data válida a partir de hoje.';
  }

  if (time && !getTimeSlotsForDate(date).includes(time)) {
    return 'Escolha um horário válido para bloquear.';
  }

  return null;
}

export function getBlockedPeriodKind(time = '') {
  return String(time || '').trim() ? BLOCK_KIND_SLOT : BLOCK_KIND_DATE;
}

export function validateAppointmentPayload(payload) {
  const nome = String(payload?.nome || '').trim();
  const telefone = String(payload?.telefone || '').trim();
  const servico = String(payload?.servico || '').trim();
  const data = String(payload?.data || '').trim();
  const horario = String(payload?.horario || '').trim();
  const observacao = String(payload?.observacao || '').trim();

  if (nome.length < 3) {
    return 'Informe um nome válido com pelo menos 3 caracteres.';
  }

  if (!SERVICES[servico]) {
    return 'Selecione um serviço válido.';
  }

  if (!buildAvailableDates().includes(data)) {
    return 'Escolha uma data válida dentro da janela disponível.';
  }

  if (!getAvailableTimeSlotsForDate(data).includes(horario)) {
    return 'Escolha um horário válido.';
  }

  if (!isValidPhone(telefone)) {
    return 'Informe um telefone válido com DDD.';
  }

  if (observacao.length > 200) {
    return 'A observação deve ter no máximo 200 caracteres.';
  }

  return null;
}

export function validatePlanPayload(payload) {
  const nome = String(payload?.nome || '').trim();
  const telefone = String(payload?.telefone || '').trim();
  const planoOpcao = String(payload?.planoOpcao || '').trim();
  const observacao = String(payload?.observacao || '').trim();

  if (nome.length < 3) {
    return 'Informe um nome válido com pelo menos 3 caracteres.';
  }

  if (!PLAN_OPTIONS[planoOpcao]) {
    return 'Selecione um plano válido.';
  }

  if (!isValidPhone(telefone)) {
    return 'Informe um telefone válido com DDD.';
  }

  if (observacao.length > 200) {
    return 'A observação deve ter no máximo 200 caracteres.';
  }

  const option = PLAN_OPTIONS[planoOpcao];
  const attendances = Array.isArray(payload?.atendimentos) ? payload.atendimentos : [];

  if (attendances.length < 1 || attendances.length > option.limite) {
    return `Escolha de 1 até ${option.limite} horários para este plano.`;
  }

  const uniqueSlots = new Set();
  const startDate = String(payload?.dataInicio || attendances[0]?.date || '').trim();

  if (!isFutureOrToday(startDate)) {
    return 'Escolha uma data inicial válida para o plano.';
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 30);

  for (const attendance of attendances) {
    const date = String(attendance?.date || '').trim();
    const time = String(attendance?.time || '').trim();
    const parsedDate = new Date(`${date}T00:00:00`);

    if (!isFutureOrToday(date) || parsedDate < start || parsedDate > end) {
      return 'Escolha datas do plano dentro do período de 30 dias.';
    }

    if (!getAvailableTimeSlotsForDate(date).includes(time)) {
      return 'Escolha horários válidos para todos os atendimentos do plano.';
    }

    if (option.plano === 'Plano econômico' && ![1, 2, 3].includes(parsedDate.getDay())) {
      return 'O Plano econômico só permite datas na segunda, terça ou quarta-feira.';
    }

    const slotKey = `${date} ${time}`;

    if (uniqueSlots.has(slotKey)) {
      return 'Escolha horários diferentes para cada atendimento do plano.';
    }

    uniqueSlots.add(slotKey);
  }

  return null;
}
