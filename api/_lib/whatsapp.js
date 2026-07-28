const CALLMEBOT_BASE_URL =
  'https://api.callmebot.com/whatsapp.php?phone=558193796278&text=';
const CALLMEBOT_API_KEY_PARAM = '&apikey=7205669';

async function fetchWithTimeout(url, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'text/plain, */*',
        'User-Agent': 'BarberGS-Scheduler/1.0',
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function assertCallMeBotResponse(responseText) {
  const normalized = responseText.toLowerCase();

  if (
    normalized.includes('error') ||
    normalized.includes('not authorized') ||
    normalized.includes('invalid') ||
    normalized.includes('apikey')
  ) {
    throw new Error(`CallMeBot recusou o envio: ${responseText}`);
  }
}

export function getWhatsAppEnvironmentStatus() {
  return {
    callMeBotConfigured: true,
    mode: 'fixed-callmebot-url',
  };
}

function buildCallMeBotUrl(text) {
  return `${CALLMEBOT_BASE_URL}${encodeURIComponent(text)}${CALLMEBOT_API_KEY_PARAM}`;
}

function buildAppointmentMessage(appointment = {}) {
  return [
    'Novo agendamento confirmado!',
    `Nome: ${appointment.nome || '-'}`,
    `Telefone: ${appointment.telefone || '-'}`,
    `Serviço: ${appointment.servico || appointment.plano || '-'}`,
    appointment.data && appointment.horario
      ? `Data: ${appointment.data} às ${appointment.horario}`
      : '',
  ].filter(Boolean).join('\n');
}

function buildPlanDatesMessage({ name, plan, dates }) {
  const dateLines = dates
    .map((item, index) => {
      const label = item.label || `${index + 1}º atendimento`;
      const date = item.date || item.data || '';
      const time = item.time || item.horario || '';

      if (!date) {
        return '';
      }

      return `${label}: ${date}${time ? ` às ${time}` : ''}`;
    })
    .filter(Boolean)
    .join('\n');

  return `Novas datas confirmadas para o plano ${plan} de ${name}:\n${dateLines}`;
}

function buildReminderMessage(schedule = {}) {
  return [
    'Lembrete de atendimento!',
    `Cliente: ${schedule.nome || '-'}`,
    `Serviço: ${schedule.servico || schedule.plano || '-'}`,
    `Horário: ${schedule.horario || '-'}`,
  ].filter(Boolean).join('\n');
}

export async function sendBarberWhatsAppNotification(appointment = {}) {
  const response = await fetchWithTimeout(buildCallMeBotUrl(buildAppointmentMessage(appointment)));
  const responseText = await response.text().catch(() => '');

  if (!response.ok) {
    throw new Error(
      `Nao foi possivel enviar a notificacao do WhatsApp. HTTP ${response.status}: ${responseText}`,
    );
  }

  assertCallMeBotResponse(responseText);

  return {
    sent: true,
    provider: 'callmebot',
    mode: 'fixed-callmebot-url-appointment',
    httpStatus: response.status,
    response: responseText.slice(0, 240),
  };
}

export async function sendBarberReminderWhatsAppNotification(schedule = {}) {
  const response = await fetchWithTimeout(buildCallMeBotUrl(buildReminderMessage(schedule)));
  const responseText = await response.text().catch(() => '');

  if (!response.ok) {
    throw new Error(
      `Nao foi possivel enviar o lembrete do WhatsApp. HTTP ${response.status}: ${responseText}`,
    );
  }

  assertCallMeBotResponse(responseText);

  return {
    sent: true,
    provider: 'callmebot',
    mode: 'fixed-callmebot-url-reminder',
    httpStatus: response.status,
    response: responseText.slice(0, 240),
  };
}

export async function sendPlanDatesWhatsAppNotification({ name, plan, dates = [] }) {
  const confirmedDates = dates.filter((item) => item?.date || item?.data);

  if (confirmedDates.length === 0) {
    return {
      sent: false,
      skipped: true,
      reason: 'no-dates',
    };
  }

  const response = await fetchWithTimeout(
    buildCallMeBotUrl(
      buildPlanDatesMessage({
        name,
        plan,
        dates: confirmedDates,
      }),
    ),
  );
  const responseText = await response.text().catch(() => '');

  if (!response.ok) {
    throw new Error(
      `Nao foi possivel enviar a notificacao do WhatsApp. HTTP ${response.status}: ${responseText}`,
    );
  }

  assertCallMeBotResponse(responseText);

  return {
    sent: true,
    provider: 'callmebot',
    mode: 'fixed-callmebot-url-plan-dates',
    httpStatus: response.status,
    response: responseText.slice(0, 240),
  };
}
