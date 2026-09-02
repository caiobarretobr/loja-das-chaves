import { SERVICE_CATEGORIES } from '../../src/features/shared/constants/schedule.js';

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

const services = SERVICE_CATEGORIES.flatMap((category) =>
  category.services.map((service) => [
    service.id,
    service.name,
    category.name,
    service.price,
  ]),
);

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
