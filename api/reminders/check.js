import { timingSafeEqual } from 'node:crypto';
import {
  listAppointments,
  listClientSubscriptions,
  listPlans,
  updateAppointmentReminderSent,
  updateClientReminderSent,
  updatePlanAttendanceReminderSent,
} from '../_lib/firestore.js';
import { notifyClientDevice } from '../_lib/push.js';
import { methodNotAllowed, sendJson } from '../_lib/response.js';
import { sendBarberReminderWhatsAppNotification } from '../_lib/whatsapp.js';

const DEFAULT_REMINDER_MINUTES_MIN = 0;
const DEFAULT_REMINDER_MINUTES_MAX = 65;
const DEFAULT_BUSINESS_TIME_ZONE = 'America/Recife';

function getCheckSecret() {
  return String(process.env.BARBERGS_CHECK_SECRET || '').trim();
}

function isAuthorized(request) {
  const expected = getCheckSecret();
  const received = String(
    request.headers['x-barbergs-check-secret'] ||
      request.headers['X-Barbergs-Check-Secret'] ||
      '',
  ).trim();

  if (!expected || !received) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

function getReminderWindow() {
  const minMinutes = Number(
    process.env.BARBERGS_REMINDER_MINUTES_MIN || DEFAULT_REMINDER_MINUTES_MIN,
  );
  const maxMinutes = Number(
    process.env.BARBERGS_REMINDER_MINUTES_MAX || DEFAULT_REMINDER_MINUTES_MAX,
  );

  if (
    !Number.isFinite(minMinutes) ||
    !Number.isFinite(maxMinutes) ||
    minMinutes > maxMinutes
  ) {
    throw new Error('Janela de lembrete inválida.');
  }

  return {
    minMinutes,
    maxMinutes,
  };
}

function getBusinessTimeZone() {
  return String(process.env.BARBERGS_TIME_ZONE || DEFAULT_BUSINESS_TIME_ZONE).trim();
}

function getZonedDateParts(date, timeZone) {
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

function getTimeZoneOffsetMs(date, timeZone) {
  const parts = getZonedDateParts(date, timeZone);
  const zonedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return zonedAsUtc - date.getTime();
}

function zonedScheduleToUtc({ year, month, day, hour, minute }, timeZone) {
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const firstOffset = getTimeZoneOffsetMs(new Date(localAsUtc), timeZone);
  let utcDate = new Date(localAsUtc - firstOffset);
  const secondOffset = getTimeZoneOffsetMs(utcDate, timeZone);

  if (secondOffset !== firstOffset) {
    utcDate = new Date(localAsUtc - secondOffset);
  }

  return utcDate;
}

function parseScheduleDate(item) {
  const dateMatch = String(item.data || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = String(item.horario || '').match(/^(\d{2}):(\d{2})$/);

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const [, year, month, day] = dateMatch;
  const [, hour, minute] = timeMatch;
  const parsed = zonedScheduleToUtc({
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  }, getBusinessTimeZone());

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isInsideReminderWindow(item, now, windowConfig) {
  const scheduleDate = parseScheduleDate(item);

  if (!scheduleDate || item.reminderSentAt) {
    return false;
  }

  const minutesUntilSchedule = (scheduleDate.getTime() - now.getTime()) / 60_000;
  return (
    minutesUntilSchedule >= windowConfig.minMinutes &&
    minutesUntilSchedule <= windowConfig.maxMinutes
  );
}

function getClientSubscriptionByAppointmentId(subscriptions = []) {
  return subscriptions.reduce((accumulator, subscription) => {
    if (subscription.appointmentId) {
      accumulator.set(subscription.appointmentId, subscription);
    }

    return accumulator;
  }, new Map());
}

function normalizeAppointments(appointments = [], subscriptionsByAppointmentId) {
  return appointments.map((appointment) => {
    const clientSubscription = subscriptionsByAppointmentId.get(appointment.id);

    return {
      id: appointment.id,
      reminderKey: `appointment:${appointment.id}`,
      kind: 'appointment',
      nome: appointment.nome,
      servico: appointment.servico,
      data: appointment.data,
      horario: appointment.horario,
      reminderSentAt: appointment.lembreteEnviadoEm,
      clientSubscriptionId: clientSubscription?.id || '',
      clientReminderSentAt: clientSubscription?.lembreteEnviadoEm || '',
    };
  });
}

function normalizePlanAttendances(plans = [], subscriptionsByAppointmentId) {
  return plans.flatMap((plan) =>
    plan.checklist
      .filter((item) => item.date && item.time && !item.done)
      .map((item) => {
        const appointmentId = `${plan.id}:${item.id}`;
        const clientSubscription = subscriptionsByAppointmentId.get(appointmentId);

        return {
          id: appointmentId,
          reminderKey: `plan-attendance:${appointmentId}`,
          kind: 'plan-attendance',
          planId: plan.id,
          attendanceId: item.id,
          nome: plan.nome,
          servico: `${plan.plano} - ${plan.servico}`,
          data: item.date,
          horario: item.time,
          reminderSentAt: item.reminderSentAt || '',
          clientSubscriptionId: clientSubscription?.id || '',
          clientReminderSentAt: clientSubscription?.lembreteEnviadoEm || '',
        };
      }),
  );
}

function normalizeLegacyClientSubscriptions(subscriptions = [], knownScheduleIds = new Set()) {
  return subscriptions
    .filter((subscription) => subscription.appointmentId && !knownScheduleIds.has(subscription.appointmentId))
    .map((subscription) => ({
      id: subscription.id,
      reminderKey: `client-subscription:${subscription.id}`,
      kind: 'client-subscription',
      nome: subscription.nome,
      servico: subscription.servico,
      data: subscription.data,
      horario: subscription.horario,
      reminderSentAt: subscription.lembreteEnviadoEm,
      clientSubscriptionId: subscription.id,
      clientReminderSentAt: subscription.lembreteEnviadoEm,
    }));
}

function buildClientReminderMessage(item) {
  return `Corte agendado para daqui a 1 hora ou menos! O atendimento foi marcado para ${item.horario}, lembre-se de chegar na barbearia 5 minutos antes.`;
}

async function markScheduleReminderSent(item, reminderSentAt) {
  if (item.kind === 'appointment') {
    await updateAppointmentReminderSent(item.id, reminderSentAt);
    return;
  }

  if (item.kind === 'plan-attendance') {
    await updatePlanAttendanceReminderSent(item.planId, item.attendanceId, reminderSentAt);
    return;
  }

  if (item.kind === 'client-subscription') {
    await updateClientReminderSent(item.clientSubscriptionId);
  }
}

async function notifyClientIfAvailable(item) {
  if (!item.clientSubscriptionId) {
    return {
      sent: 0,
      skipped: true,
      reason: 'no-client-subscription',
    };
  }

  if (item.clientReminderSentAt) {
    return {
      sent: 0,
      skipped: true,
      reason: 'client-already-reminded',
    };
  }

  return notifyClientDevice(item.clientSubscriptionId, {
    title: 'Barber GS',
    body: buildClientReminderMessage(item),
    tag: `lembrete-cliente-1h-${item.reminderKey}`,
    url: '/',
  });
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return methodNotAllowed(response);
  }

  if (!isAuthorized(request)) {
    return sendJson(response, 401, {
      message: 'Verificação de lembretes não autorizada.',
    });
  }

  try {
    const now = request.body?.now ? new Date(request.body.now) : new Date();

    if (Number.isNaN(now.getTime())) {
      return sendJson(response, 400, {
        message: 'Data de verificação inválida.',
      });
    }

    const windowConfig = getReminderWindow();
    const [appointments, plans, clientSubscriptions] = await Promise.all([
      listAppointments(),
      listPlans(),
      listClientSubscriptions(),
    ]);
    const subscriptionsByAppointmentId = getClientSubscriptionByAppointmentId(clientSubscriptions);
    const normalizedAppointments = normalizeAppointments(appointments, subscriptionsByAppointmentId);
    const normalizedPlanAttendances = normalizePlanAttendances(plans, subscriptionsByAppointmentId);
    const knownScheduleIds = new Set([
      ...normalizedAppointments.map((item) => item.id),
      ...normalizedPlanAttendances.map((item) => item.id),
    ]);
    const legacyClientSubscriptions = normalizeLegacyClientSubscriptions(
      clientSubscriptions,
      knownScheduleIds,
    );
    const schedules = [
      ...normalizedAppointments,
      ...normalizedPlanAttendances,
      ...legacyClientSubscriptions,
    ];
    const dueSchedules = schedules.filter((item) => isInsideReminderWindow(item, now, windowConfig));
    const results = [];
    let barberWhatsAppSent = 0;
    let clientPushSent = 0;
    let skipped = 0;
    let failed = 0;

    for (const schedule of dueSchedules) {
      const result = {
        id: schedule.id,
        kind: schedule.kind,
        barberWhatsAppSent: false,
        clientPushSent: 0,
        skipped: false,
      };

      try {
        const whatsapp = await sendBarberReminderWhatsAppNotification(schedule);
        const reminderSentAt = new Date().toISOString();

        if (whatsapp.sent) {
          barberWhatsAppSent += 1;
          result.barberWhatsAppSent = true;
        }

        await markScheduleReminderSent(schedule, reminderSentAt);

        try {
          const clientDelivery = await notifyClientIfAvailable(schedule);

          if (clientDelivery.sent > 0) {
            clientPushSent += 1;
            result.clientPushSent = clientDelivery.sent;
          } else {
            skipped += 1;
            result.skipped = true;
            result.skipReason = clientDelivery.reason || (clientDelivery.skipped ? 'no-push-endpoint' : '');
          }
        } catch (pushError) {
          failed += 1;
          result.clientPushError = pushError.message || 'Falha ao enviar push do cliente.';
        }
      } catch (whatsappError) {
        failed += 1;
        result.error = whatsappError.message || 'Falha ao enviar WhatsApp do barbeiro.';
      }

      results.push(result);
    }

    return sendJson(response, 200, {
      checked: schedules.length,
      appointmentsChecked: normalizedAppointments.length,
      planAttendancesChecked: normalizedPlanAttendances.length,
      legacyClientSubscriptionsChecked: legacyClientSubscriptions.length,
      eligible: dueSchedules.length,
      barberWhatsAppSent,
      clientPushSent,
      skipped,
      failed,
      reminderWindowMinutes: windowConfig,
      timeZone: getBusinessTimeZone(),
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Failed to check reminders:', error);
    return sendJson(response, 500, {
      message: 'Não foi possível verificar lembretes.',
    });
  }
}
