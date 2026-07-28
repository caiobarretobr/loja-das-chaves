#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const DEFAULT_BASE_URL = 'https://barbergs.vercel.app';
const DEFAULT_STATE_PATH = path.join(PROJECT_ROOT, '.barbergscheck', 'state.json');
const DEFAULT_OPERATION_LOG_PATH = path.join(PROJECT_ROOT, '.barbergscheck', 'check.log');
const NEW_APPOINTMENT_MESSAGE = 'Novo agendamento confirmado!';
const DEFAULT_REMINDER_MINUTES_MIN = 0;
const DEFAULT_REMINDER_MINUTES_MAX = 65;

function getConfig() {
  return {
    baseUrl: (process.env.BARBERGS_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    password: process.env.BARBERGS_ADMIN_PASSWORD || '',
    statePath: process.env.BARBERGS_STATE_PATH || DEFAULT_STATE_PATH,
    operationLogPath: process.env.BARBERGS_OPERATION_LOG_PATH || DEFAULT_OPERATION_LOG_PATH,
    notificationLogPath: process.env.BARBERGS_NOTIFICATION_LOG_PATH || '',
    appointmentsJson: process.env.BARBERGS_APPOINTMENTS_JSON || '',
    clientsJson: process.env.BARBERGS_CLIENTS_JSON || '',
    reminderMinMinutes: Number(process.env.BARBERGS_REMINDER_MINUTES_MIN || DEFAULT_REMINDER_MINUTES_MIN),
    reminderMaxMinutes: Number(process.env.BARBERGS_REMINDER_MINUTES_MAX || DEFAULT_REMINDER_MINUTES_MAX),
    now: process.env.BARBERGS_NOW ? new Date(process.env.BARBERGS_NOW) : new Date(),
  };
}

function validateConfig(config) {
  if (Number.isNaN(config.now.getTime())) {
    throw new Error('BARBERGS_NOW inválido.');
  }

  if (!Number.isFinite(config.reminderMinMinutes) || !Number.isFinite(config.reminderMaxMinutes)) {
    throw new Error('Janela de lembrete inválida.');
  }

  if (config.reminderMinMinutes > config.reminderMaxMinutes) {
    throw new Error('BARBERGS_REMINDER_MINUTES_MIN maior que BARBERGS_REMINDER_MINUTES_MAX.');
  }
}

async function appendLine(filePath, message) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${message}\n`, { flag: 'a' });
}

async function logOperation(config, message) {
  await appendLine(config.operationLogPath, `${new Date().toISOString()} ${message}`);
}

async function readJsonFile(filePath, fallback) {
  try {
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return fallback;
    }

    throw error;
  }
}

function normalizeState(rawState) {
  return {
    seenAppointments: Array.isArray(rawState.seenAppointments) ? rawState.seenAppointments : [],
    remindedAppointments: Array.isArray(rawState.remindedAppointments)
      ? rawState.remindedAppointments
      : [],
    remindedClients: Array.isArray(rawState.remindedClients) ? rawState.remindedClients : [],
    lastSuccessAt: rawState.lastSuccessAt || '',
  };
}

async function readState(statePath) {
  return normalizeState(await readJsonFile(statePath, {}));
}

async function writeState(statePath, state) {
  await mkdir(path.dirname(statePath), { recursive: true });
  const tempPath = `${statePath}.${process.pid}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(state, null, 2)}\n`);
  await rename(tempPath, statePath);
}

async function login(config) {
  if (config.appointmentsJson && config.clientsJson && config.notificationLogPath) {
    return '';
  }

  if (!config.password) {
    throw new Error('BARBERGS_ADMIN_PASSWORD não configurada.');
  }

  const response = await fetch(`${config.baseUrl}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: config.password }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.token) {
    throw new Error(data.message || 'Não foi possível autenticar no painel do barbeiro.');
  }

  return data.token;
}

async function fetchAppointmentsFromApi(config, token) {
  const response = await fetch(`${config.baseUrl}/api/agendamentos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !Array.isArray(data.appointments)) {
    throw new Error(data.message || 'Não foi possível carregar os agendamentos.');
  }

  return data.appointments;
}

function readAppointmentsFromEnv(config) {
  const parsed = JSON.parse(config.appointmentsJson);
  return Array.isArray(parsed) ? parsed : parsed.appointments || [];
}

function readClientsFromEnv(config) {
  const parsed = JSON.parse(config.clientsJson);
  return Array.isArray(parsed) ? parsed : parsed.clients || [];
}

async function getAppointments(config, token) {
  if (config.appointmentsJson) {
    return readAppointmentsFromEnv(config);
  }

  return fetchAppointmentsFromApi(config, token);
}

async function fetchClientsFromApi(config, token) {
  const response = await fetch(`${config.baseUrl}/api/clientes/inscricoes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !Array.isArray(data.clients)) {
    throw new Error(data.message || 'Não foi possível carregar a lista de clientes.');
  }

  return data.clients;
}

async function getClients(config, token) {
  if (config.clientsJson) {
    return readClientsFromEnv(config);
  }

  return fetchClientsFromApi(config, token);
}

function appointmentFingerprint(appointment) {
  if (appointment.id) {
    return String(appointment.id);
  }

  const rawFingerprint = [
    appointment.data || '',
    appointment.horario || '',
    appointment.nome || '',
    appointment.servico || '',
  ].join('|');

  return createHash('sha256').update(rawFingerprint).digest('hex');
}

function parseAppointmentDate(appointment) {
  const dateMatch = String(appointment.data || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = String(appointment.horario || '').match(/^(\d{2}):(\d{2})$/);

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const [, year, month, day] = dateMatch;
  const [, hour, minute] = timeMatch;
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0,
    0,
  );

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isInsideReminderWindow(appointment, config) {
  const appointmentDate = parseAppointmentDate(appointment);

  if (!appointmentDate) {
    return false;
  }

  const minutesUntilAppointment = (appointmentDate.getTime() - config.now.getTime()) / 60_000;
  return (
    minutesUntilAppointment >= config.reminderMinMinutes &&
    minutesUntilAppointment <= config.reminderMaxMinutes
  );
}

async function notifyBarberDevices(config, token, message, tag) {
  if (config.notificationLogPath) {
    await appendLine(config.notificationLogPath, message);
    return;
  }

  const response = await fetch(`${config.baseUrl}/api/push/notificar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, tag }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Não foi possível enviar a notificação.');
  }
}

async function notifyClientAndBarberDevices(config, token, clientSubscriptionId, message, tag) {
  if (config.notificationLogPath) {
    await appendLine(config.notificationLogPath, message);
    return;
  }

  const response = await fetch(`${config.baseUrl}/api/push/notificar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, tag, clientSubscriptionId }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Não foi possível enviar a notificação.');
  }
}

async function run() {
  const config = getConfig();
  validateConfig(config);

  const token = await login(config);
  const state = await readState(config.statePath);
  const seenAppointments = new Set(state.seenAppointments);
  const remindedClients = new Set(state.remindedClients);
  const appointments = await getAppointments(config, token);
  const clients = await getClients(config, token);
  const nextSeenAppointments = [...seenAppointments];
  const nextRemindedClients = [...remindedClients];

  for (const appointment of appointments) {
    const fingerprint = appointmentFingerprint(appointment);

    if (!seenAppointments.has(fingerprint)) {
      await notifyBarberDevices(
        config,
        token,
        NEW_APPOINTMENT_MESSAGE,
        `novo-agendamento-${fingerprint}`,
      );
      seenAppointments.add(fingerprint);
      nextSeenAppointments.push(fingerprint);
    }
  }

  for (const client of clients) {
    const fingerprint = client.id || appointmentFingerprint(client);
    const message = `Corte agendado para daqui a 1 hora ou menos! O atendimento foi marcado para ${client.horario}, lembre-se de chegar na barbearia 5 minutos antes.`;

    if (isInsideReminderWindow(client, config) && !remindedClients.has(fingerprint)) {
      await notifyClientAndBarberDevices(
        config,
        token,
        client.id,
        message,
        `lembrete-cliente-1h-${fingerprint}`,
      );
      remindedClients.add(fingerprint);
      nextRemindedClients.push(fingerprint);
    }
  }

  await writeState(config.statePath, {
    seenAppointments: nextSeenAppointments,
    remindedAppointments: state.remindedAppointments,
    remindedClients: nextRemindedClients,
    lastSuccessAt: config.now.toISOString(),
  });
  await logOperation(config, `Verificação concluída: ${appointments.length} agendamentos e ${clients.length} clientes.`);
}

run().catch(async (error) => {
  const config = getConfig();
  const message = error instanceof Error ? error.message : 'Erro desconhecido.';

  await logOperation(config, `Falha ao verificar agendamentos: ${message}`);
  process.exitCode = 1;
});
