import { timingSafeEqual } from 'node:crypto';
import {
  listAppointments,
  listCanceledServices,
  listClientSubscriptions,
  listClientWhatsAppNotifications,
  listPlans,
  createCanceledService,
  deleteAppointment,
  updateAppointmentReminderSent,
  updateClientReminderSent,
  updateClientWhatsAppNotificationStatus,
  updatePlanAttendanceReminderSent,
} from '../../server/lib/firestore.js';
import { notifyClientDevice } from '../../server/lib/push.js';
import { getCurrentReportMonthKey } from '../../server/lib/reports.js';
import { methodNotAllowed, sendJson } from '../../server/lib/response.js';
import {
  sendBarberReminderWhatsAppNotification,
  sendClientReminderWhatsAppNotification,
} from '../../server/lib/whatsapp.js';

const DEFAULT_REMINDER_MINUTES_MIN = 0;
const DEFAULT_REMINDER_MINUTES_MAX = 65;
const DEFAULT_BUSINESS_TIME_ZONE = 'America/Recife';
const STALE_APPOINTMENT_AFTER_MS = 1000 * 60 * 60 * 24 * 7;

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
      uid: appointment.uid,
      telefone: appointment.telefone,
      nome: appointment.nome,
      servico: appointment.servico,
      data: appointment.data,
      horario: appointment.horario,
      reminderSentAt: appointment.lembreteEnviadoEm,
      clienteLembreteCanal: appointment.clienteLembreteCanal,
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
          uid: plan.uid,
          telefone: plan.telefone,
          nome: plan.nome,
          servico: `${plan.plano} - ${plan.servico}`,
          data: item.date,
          horario: item.time,
          reminderSentAt: item.reminderSentAt || '',
          clienteLembreteCanal: item.clienteLembreteCanal || '',
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
  return `Seu atendimento na Loja das Chaves será às ${item.horario}. Lembre-se de chegar 5 minutos antes.`;
}

async function markScheduleReminderSent(item, reminderSentAt, metadata = {}) {
  if (item.kind === 'appointment') {
    await updateAppointmentReminderSent(item.id, reminderSentAt, metadata);
    return;
  }

  if (item.kind === 'plan-attendance') {
    await updatePlanAttendanceReminderSent(item.planId, item.attendanceId, reminderSentAt, metadata);
    return;
  }

  if (item.kind === 'client-subscription') {
    await updateClientReminderSent(item.clientSubscriptionId);
  }
}

function getEnabledWhatsAppRecord(item, recordsByUid, records) {
  if (item.uid && recordsByUid.has(item.uid)) {
    return recordsByUid.get(item.uid);
  }

  if (!item.telefone) {
    return null;
  }

  const phone = String(item.telefone || '').replace(/\D/g, '');
  const matches = records.filter((record) => {
    const recordPhone = String(record.phone || '').replace(/\D/g, '');
    return recordPhone === phone || recordPhone.endsWith(phone) || phone.endsWith(recordPhone);
  });

  return matches.length === 1 ? matches[0] : null;
}

async function notifyClient(schedule, whatsappRecord) {
  if (whatsappRecord?.enabled && whatsappRecord.phone && whatsappRecord.apikey) {
    try {
      const delivery = await sendClientReminderWhatsAppNotification(schedule, whatsappRecord);
      await updateClientWhatsAppNotificationStatus(whatsappRecord.uid, {
        ultimoEnvioEm: new Date().toISOString(),
        ultimoErro: '',
      });
      return {
        channel: 'whatsapp',
        sent: delivery.sent ? 1 : 0,
        skipped: !delivery.sent,
        reason: delivery.sent ? '' : 'client-whatsapp-not-sent',
      };
    } catch (error) {
      await updateClientWhatsAppNotificationStatus(whatsappRecord.uid, {
        ultimoErro: 'client-whatsapp-failed',
      });
      throw error;
    }
  }

  const pushDelivery = await notifyClientIfAvailable(schedule);
  return {
    channel: pushDelivery.sent > 0 ? 'push' : 'none',
    sent: pushDelivery.sent,
    skipped: pushDelivery.skipped,
    reason: pushDelivery.reason || (pushDelivery.skipped ? 'no-push-endpoint' : ''),
  };
}

async function cleanupStaleAppointments(appointments = [], now = new Date()) {
  const canceledServices = await listCanceledServices();
  const alreadyCanceledIds = new Set(
    canceledServices.flatMap((item) => [item.id, item.appointmentId]).filter(Boolean),
  );
  let canceled = 0;
  let failed = 0;

  for (const appointment of appointments) {
    const scheduleDate = parseScheduleDate(appointment);

    if (!scheduleDate || now.getTime() - scheduleDate.getTime() < STALE_APPOINTMENT_AFTER_MS) {
      continue;
    }

    try {
      if (!alreadyCanceledIds.has(appointment.id)) {
        await createCanceledService({
          id: appointment.id,
          appointmentId: appointment.id,
          nome: appointment.nome,
          servico: appointment.servico,
          data: appointment.data,
          horario: appointment.horario,
          preco: appointment.preco,
          canceladoEm: now.toISOString(),
          reportMonth: getCurrentReportMonthKey(now),
          motivoCancelamento: 'auto-expired-after-7-days',
        });
        alreadyCanceledIds.add(appointment.id);
      }

      await deleteAppointment(appointment.id);
      canceled += 1;
    } catch (error) {
      failed += 1;
      console.error('Failed to auto-cancel stale appointment:', {
        appointmentId: appointment.id,
        message: error.message || 'unknown-error',
      });
    }
  }

  return { canceled, failed };
}

async function notifyClientIfAvailable(item) {
  if (!item.clientSubscriptionId) {
    return {
      sent: 0,
      skipped: true,
      reason: 'no-client-subscription',
    };
  }

  if (item.clientReminderSentAt && item.reminderSentAt) {
    return {
      sent: 0,
      skipped: true,
      reason: 'client-already-reminded',
    };
  }

  return notifyClientDevice(item.clientSubscriptionId, {
    title: 'Loja das Chaves',
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
    const [appointments, plans, clientSubscriptions, clientWhatsAppRecords] = await Promise.all([
      listAppointments(),
      listPlans(),
      listClientSubscriptions(),
      listClientWhatsAppNotifications(),
    ]);
    const cleanup = await cleanupStaleAppointments(appointments, now);
    const subscriptionsByAppointmentId = getClientSubscriptionByAppointmentId(clientSubscriptions);
    const enabledWhatsAppRecords = clientWhatsAppRecords.filter((record) =>
      record.enabled && record.status !== 'disabled' && record.phone && record.apikey,
    );
    const whatsappRecordsByUid = new Map(enabledWhatsAppRecords.map((record) => [record.uid, record]));
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
    let clientWhatsAppSent = 0;
    let clientPushSent = 0;
    let skipped = 0;
    let failed = cleanup.failed;

    for (const schedule of dueSchedules) {
      const result = {
        id: schedule.id,
        kind: schedule.kind,
        barberWhatsAppSent: false,
        clientWhatsAppSent: 0,
        clientPushSent: 0,
        skipped: false,
      };
      let clientChannel = 'none';
      let clientError = '';

      try {
        const barberWhatsapp = await sendBarberReminderWhatsAppNotification(schedule);
        const reminderSentAt = new Date().toISOString();

        if (barberWhatsapp.sent) {
          barberWhatsAppSent += 1;
          result.barberWhatsAppSent = true;
        }

        try {
          const whatsappRecord = getEnabledWhatsAppRecord(
            schedule,
            whatsappRecordsByUid,
            enabledWhatsAppRecords,
          );
          const clientDelivery = await notifyClient(schedule, whatsappRecord);

          clientChannel = clientDelivery.channel;

          if (clientDelivery.channel === 'whatsapp' && clientDelivery.sent > 0) {
            clientWhatsAppSent += 1;
            result.clientWhatsAppSent = clientDelivery.sent;
          } else if (clientDelivery.channel === 'push' && clientDelivery.sent > 0) {
            clientPushSent += 1;
            result.clientPushSent = clientDelivery.sent;
          } else {
            skipped += 1;
            result.skipped = true;
            result.skipReason = clientDelivery.reason || 'no-client-channel';
          }
        } catch {
          failed += 1;
          clientError = 'client-reminder-failed';
          result.clientReminderError = 'Falha ao enviar lembrete do cliente.';
        }

        await markScheduleReminderSent(schedule, reminderSentAt, {
          clienteLembreteCanal: clientChannel,
          ultimoErroLembrete: clientError,
        });
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
      clientWhatsAppSent,
      clientPushSent,
      staleAppointmentsCanceled: cleanup.canceled,
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
