import { createSign, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  APPOINTMENTS_COLLECTION,
  BLOCKED_PERIODS_COLLECTION,
  CANCELED_SERVICES_COLLECTION,
  CLIENT_PROFILES_COLLECTION,
  CLIENT_SUBSCRIPTIONS_COLLECTION,
  CLIENT_WHATSAPP_NOTIFICATIONS_COLLECTION,
  COMPLETED_PLANS_COLLECTION,
  FINISHED_SERVICES_COLLECTION,
  PLANS_COLLECTION,
  PUSH_SUBSCRIPTIONS_COLLECTION,
} from './constants.js';

const SUBSCRIPTION_TTL_MS = 1000 * 60 * 60 * 24 * 15;
const FALLBACK_SERVICE_ACCOUNT_PATH = '../../barbergs-bcd60-firebase-adminsdk-fbsvc-230c24b3dd.json';

let cachedAccessToken = '';
let cachedAccessTokenExpiration = 0;
let cachedServiceAccount = undefined;

function getBundledServiceAccount() {
  if (cachedServiceAccount !== undefined) {
    return cachedServiceAccount;
  }

  try {
    const rawValue = readFileSync(new URL(FALLBACK_SERVICE_ACCOUNT_PATH, import.meta.url), 'utf8');
    cachedServiceAccount = JSON.parse(rawValue);
  } catch {
    cachedServiceAccount = null;
  }

  return cachedServiceAccount;
}

function getRequiredEnv(name) {
  const value = process.env[name];

  if (value) {
    return value;
  }

  const serviceAccount = getBundledServiceAccount();
  const fallbackByName = {
    FIREBASE_PROJECT_ID: serviceAccount?.project_id,
    FIREBASE_CLIENT_EMAIL: serviceAccount?.client_email,
    FIREBASE_PRIVATE_KEY: serviceAccount?.private_key,
  };
  const fallback = fallbackByName[name];

  if (!fallback) {
    throw new Error(`Variável ${name} não configurada.`);
  }

  return fallback;
}

function stripWrappingQuotes(value = '') {
  const trimmed = value.trim();
  const first = trimmed.at(0);
  const last = trimmed.at(-1);

  if ((first === '"' || first === "'") && first === last) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function getPrivateKey() {
  const rawValue = stripWrappingQuotes(getRequiredEnv('FIREBASE_PRIVATE_KEY'));
  let privateKey = rawValue;

  if (rawValue.startsWith('{')) {
    try {
      const serviceAccount = JSON.parse(rawValue);
      privateKey = serviceAccount.private_key || privateKey;
    } catch {
      privateKey = rawValue;
    }
  }

  return stripWrappingQuotes(privateKey)
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .trim();
}

function getProjectId() {
  return getRequiredEnv('FIREBASE_PROJECT_ID');
}

function getClientEmail() {
  return getRequiredEnv('FIREBASE_CLIENT_EMAIL');
}

function encodeBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

async function getAccessToken() {
  if (cachedAccessToken && cachedAccessTokenExpiration > Date.now() + 60_000) {
    return cachedAccessToken;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claimSet = encodeBase64Url(
    JSON.stringify({
      iss: getClientEmail(),
      sub: getClientEmail(),
      aud: 'https://oauth2.googleapis.com/token',
      scope: 'https://www.googleapis.com/auth/datastore',
      iat: nowInSeconds,
      exp: nowInSeconds + 3600,
    }),
  );

  const unsignedToken = `${header}.${claimSet}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsignedToken);
  signer.end();
  const signature = signer.sign(getPrivateKey()).toString('base64url');
  const assertion = `${unsignedToken}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error('Não foi possível autenticar com o Firebase.');
  }

  cachedAccessToken = data.access_token;
  cachedAccessTokenExpiration = Date.now() + Number(data.expires_in || 3600) * 1000;
  return cachedAccessToken;
}

function getBaseUrl() {
  return `https://firestore.googleapis.com/v1/projects/${getProjectId()}/databases/(default)/documents`;
}

function toFirestoreFields(data) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (typeof value === 'boolean') {
        return [key, { booleanValue: value }];
      }

      if (typeof value === 'number') {
        return [key, { integerValue: String(value) }];
      }

      return [key, { stringValue: value ?? '' }];
    }),
  );
}

function fromFirestoreDocument(document) {
  const fields = document.fields || {};

  return {
    id: document.name.split('/').pop(),
    uid: fields.uid?.stringValue || '',
    clientEmail: fields.clientEmail?.stringValue || '',
    nome: fields.nome?.stringValue || '',
    telefone: fields.telefone?.stringValue || '',
    servico: fields.servico?.stringValue || '',
    data: fields.data?.stringValue || '',
    horario: fields.horario?.stringValue || '',
    observacao: fields.observacao?.stringValue || '',
    preco: Number(fields.preco?.integerValue || 0),
    criadoEm: fields.criadoEm?.stringValue || '',
    lembreteEnviadoEm: fields.lembreteEnviadoEm?.stringValue || '',
    clienteLembreteCanal: fields.clienteLembreteCanal?.stringValue || '',
    ultimoErroLembrete: fields.ultimoErroLembrete?.stringValue || '',
  };
}

function parseSubscription(value = '') {
  try {
    return JSON.parse(value || '{}');
  } catch {
    return {};
  }
}

function fromPushSubscriptionDocument(document) {
  const fields = document.fields || {};

  return {
    id: document.name.split('/').pop(),
    subscription: parseSubscription(fields.subscription?.stringValue || ''),
    criadoEm: fields.criadoEm?.stringValue || '',
    atualizadoEm: fields.atualizadoEm?.stringValue || '',
    expiraEm: fields.expiraEm?.stringValue || '',
  };
}

function fromClientSubscriptionDocument(document) {
  const fields = document.fields || {};

  return {
    id: document.name.split('/').pop(),
    appointmentId: fields.appointmentId?.stringValue || '',
    nome: fields.nome?.stringValue || '',
    servico: fields.servico?.stringValue || '',
    data: fields.data?.stringValue || '',
    horario: fields.horario?.stringValue || '',
    subscription: parseSubscription(fields.subscription?.stringValue || ''),
    lembreteEnviadoEm: fields.lembreteEnviadoEm?.stringValue || '',
    criadoEm: fields.criadoEm?.stringValue || '',
    atualizadoEm: fields.atualizadoEm?.stringValue || '',
    expiraEm: fields.expiraEm?.stringValue || '',
  };
}

function fromClientProfileDocument(document) {
  const fields = document.fields || {};

  return {
    id: document.name.split('/').pop(),
    uid: fields.uid?.stringValue || '',
    fullName: fields.fullName?.stringValue || '',
    phone: fields.phone?.stringValue || '',
    email: fields.email?.stringValue || '',
    authProvider: fields.authProvider?.stringValue || '',
    photoURL: fields.photoURL?.stringValue || '',
    createdAt: fields.createdAt?.stringValue || '',
    updatedAt: fields.updatedAt?.stringValue || '',
    lastLoginAt: fields.lastLoginAt?.stringValue || '',
  };
}

function fromFinishedServiceDocument(document) {
  const fields = document.fields || {};

  return {
    id: document.name.split('/').pop(),
    appointmentId: fields.appointmentId?.stringValue || '',
    nome: fields.nome?.stringValue || '',
    servico: fields.servico?.stringValue || '',
    data: fields.data?.stringValue || '',
    horario: fields.horario?.stringValue || '',
    preco: Number(fields.preco?.integerValue || 0),
    finalizadoEm: fields.finalizadoEm?.stringValue || '',
    reportMonth: fields.reportMonth?.stringValue || '',
  };
}

function fromClientWhatsAppNotificationDocument(document) {
  const fields = document.fields || {};

  return {
    id: document.name.split('/').pop(),
    uid: fields.uid?.stringValue || '',
    email: fields.email?.stringValue || '',
    phone: fields.phone?.stringValue || '',
    apikey: fields.apikey?.stringValue || '',
    provider: fields.provider?.stringValue || '',
    status: fields.status?.stringValue || '',
    enabled: fields.enabled?.booleanValue ?? fields.enabled?.stringValue === 'true',
    criadoEm: fields.criadoEm?.stringValue || '',
    atualizadoEm: fields.atualizadoEm?.stringValue || '',
    ultimoEnvioEm: fields.ultimoEnvioEm?.stringValue || '',
    ultimoErro: fields.ultimoErro?.stringValue || '',
  };
}

function fromCanceledServiceDocument(document) {
  const fields = document.fields || {};

  return {
    id: document.name.split('/').pop(),
    appointmentId: fields.appointmentId?.stringValue || '',
    nome: fields.nome?.stringValue || '',
    servico: fields.servico?.stringValue || '',
    data: fields.data?.stringValue || '',
    horario: fields.horario?.stringValue || '',
    preco: Number(fields.preco?.integerValue || 0),
    canceladoEm: fields.canceladoEm?.stringValue || '',
    reportMonth: fields.reportMonth?.stringValue || '',
    motivoCancelamento: fields.motivoCancelamento?.stringValue || '',
  };
}

function fromCompletedPlanDocument(document) {
  const fields = document.fields || {};

  return {
    id: document.name.split('/').pop(),
    planId: fields.planId?.stringValue || '',
    nome: fields.nome?.stringValue || '',
    planoOpcao: fields.planoOpcao?.stringValue || '',
    plano: fields.plano?.stringValue || '',
    servico: fields.servico?.stringValue || '',
    preco: Number(fields.preco?.integerValue || 0),
    limite: Number(fields.limite?.integerValue || 0),
    atendimentosConcluidos: Number(fields.atendimentosConcluidos?.integerValue || 0),
    concluidoEm: fields.concluidoEm?.stringValue || '',
    criadoEm: fields.criadoEm?.stringValue || '',
    reportMonth: fields.reportMonth?.stringValue || '',
  };
}

function parseChecklist(value = '') {
  try {
    const items = JSON.parse(value || '[]');
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function fromPlanDocument(document) {
  const fields = document.fields || {};

  return {
    id: document.name.split('/').pop(),
    uid: fields.uid?.stringValue || '',
    clientEmail: fields.clientEmail?.stringValue || '',
    nome: fields.nome?.stringValue || '',
    telefone: fields.telefone?.stringValue || '',
    planoOpcao: fields.planoOpcao?.stringValue || '',
    plano: fields.plano?.stringValue || '',
    servico: fields.servico?.stringValue || '',
    preco: Number(fields.preco?.integerValue || 0),
    limite: Number(fields.limite?.integerValue || 0),
    assinaturaEm: fields.assinaturaEm?.stringValue || '',
    expiraEm: fields.expiraEm?.stringValue || '',
    observacao: fields.observacao?.stringValue || '',
    checklist: parseChecklist(fields.checklist?.stringValue || ''),
    status: fields.status?.stringValue || '',
    criadoEm: fields.criadoEm?.stringValue || '',
  };
}

export function getPlanAttendances(plans = []) {
  return plans.flatMap((plan) =>
    plan.checklist
      .filter((item) => item.date && item.time)
      .map((item) => ({
        id: `${plan.id}:${item.id}`,
        planId: plan.id,
        itemId: item.id,
        nome: plan.nome,
        uid: plan.uid,
        telefone: plan.telefone,
        servico: `${plan.plano} - ${plan.servico}`,
        data: item.date,
        horario: item.time,
        done: Boolean(item.done),
      })),
  );
}

function fromBlockedPeriodDocument(document) {
  const fields = document.fields || {};

  return {
    id: document.name.split('/').pop(),
    date: fields.date?.stringValue || '',
    time: fields.time?.stringValue || '',
    kind: fields.kind?.stringValue || '',
    createdAt: fields.createdAt?.stringValue || '',
  };
}

async function firestoreRequest(path, options = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${getBaseUrl()}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error?.message || `Erro ao acessar o Firestore. HTTP ${response.status}`);
    error.status = response.status;
    error.code = data.error?.status || '';
    throw error;
  }

  return data;
}

async function listCollection(collectionName, mapper) {
  const data = await firestoreRequest(`/${collectionName}?pageSize=200`);
  return (data.documents || []).map(mapper);
}

function isActiveUntil(expiraEm = '') {
  return !expiraEm || new Date(expiraEm).getTime() > Date.now();
}

export async function listAppointments() {
  return listCollection(APPOINTMENTS_COLLECTION, fromFirestoreDocument);
}

export async function createAppointment(documentData) {
  const id = randomUUID();

  await firestoreRequest(`/${APPOINTMENTS_COLLECTION}?documentId=${id}`, {
    method: 'POST',
    body: JSON.stringify({
      fields: toFirestoreFields(documentData),
    }),
  });

  return id;
}

export async function deleteAppointment(id) {
  await firestoreRequest(`/${APPOINTMENTS_COLLECTION}/${id}`, {
    method: 'DELETE',
  });
}

export async function updateAppointment(id, documentData) {
  await firestoreRequest(`/${APPOINTMENTS_COLLECTION}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      fields: toFirestoreFields(documentData),
    }),
  });
}

export async function updateAppointmentReminderSent(
  id,
  reminderSentAt = new Date().toISOString(),
  metadata = {},
) {
  const appointments = await listAppointments();
  const appointment = appointments.find((item) => item.id === id);

  if (!appointment) {
    return false;
  }

  await updateAppointment(id, {
    uid: appointment.uid,
    clientEmail: appointment.clientEmail,
    nome: appointment.nome,
    telefone: appointment.telefone,
    servico: appointment.servico,
    data: appointment.data,
    horario: appointment.horario,
    observacao: appointment.observacao,
    preco: appointment.preco,
    criadoEm: appointment.criadoEm,
    lembreteEnviadoEm: reminderSentAt,
    clienteLembreteCanal: metadata.clienteLembreteCanal ?? appointment.clienteLembreteCanal,
    ultimoErroLembrete: metadata.ultimoErroLembrete ?? appointment.ultimoErroLembrete,
  });

  return true;
}

export async function listPlans() {
  return listCollection(PLANS_COLLECTION, fromPlanDocument);
}

export async function createPlan(documentData) {
  const id = randomUUID();

  await firestoreRequest(`/${PLANS_COLLECTION}?documentId=${id}`, {
    method: 'POST',
    body: JSON.stringify({
      fields: toFirestoreFields(documentData),
    }),
  });

  return id;
}

export async function updatePlan(id, documentData) {
  await firestoreRequest(`/${PLANS_COLLECTION}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      fields: toFirestoreFields(documentData),
    }),
  });
}

export async function updatePlanAttendanceReminderSent(
  planId,
  attendanceId,
  reminderSentAt = new Date().toISOString(),
  metadata = {},
) {
  const plans = await listPlans();
  const plan = plans.find((item) => item.id === planId);

  if (!plan) {
    return false;
  }

  const checklist = plan.checklist.map((item) =>
    item.id === attendanceId
      ? {
          ...item,
          reminderSentAt,
          clienteLembreteCanal: metadata.clienteLembreteCanal ?? item.clienteLembreteCanal ?? '',
          ultimoErroLembrete: metadata.ultimoErroLembrete ?? item.ultimoErroLembrete ?? '',
        }
      : item,
  );

  if (!checklist.some((item) => item.id === attendanceId)) {
    return false;
  }

  await updatePlan(planId, {
    uid: plan.uid,
    clientEmail: plan.clientEmail,
    nome: plan.nome,
    telefone: plan.telefone,
    planoOpcao: plan.planoOpcao,
    plano: plan.plano,
    servico: plan.servico,
    preco: plan.preco,
    limite: plan.limite,
    assinaturaEm: plan.assinaturaEm,
    expiraEm: plan.expiraEm,
    observacao: plan.observacao,
    checklist: JSON.stringify(checklist),
    status: plan.status || 'ativo',
    criadoEm: plan.criadoEm,
  });

  return true;
}

export async function deletePlan(id) {
  await firestoreRequest(`/${PLANS_COLLECTION}/${id}`, {
    method: 'DELETE',
  });
}

export async function listBlockedPeriods() {
  return listCollection(BLOCKED_PERIODS_COLLECTION, fromBlockedPeriodDocument);
}

export async function upsertBlockedPeriod(documentData) {
  await firestoreRequest(`/${BLOCKED_PERIODS_COLLECTION}/${documentData.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      fields: toFirestoreFields(documentData),
    }),
  });

  return documentData.id;
}

export async function deleteBlockedPeriod(id) {
  await firestoreRequest(`/${BLOCKED_PERIODS_COLLECTION}/${id}`, {
    method: 'DELETE',
  });
}

export async function listPushSubscriptions() {
  const subscriptions = await listCollection(PUSH_SUBSCRIPTIONS_COLLECTION, fromPushSubscriptionDocument);
  const expired = subscriptions.filter((item) => !isActiveUntil(item.expiraEm));

  await Promise.all(expired.map((item) => deletePushSubscription(item.id)));

  return subscriptions.filter((item) => isActiveUntil(item.expiraEm));
}

export async function upsertPushSubscription(id, subscription) {
  const now = new Date().toISOString();
  const expiraEm = new Date(Date.now() + SUBSCRIPTION_TTL_MS).toISOString();

  await firestoreRequest(`/${PUSH_SUBSCRIPTIONS_COLLECTION}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      fields: toFirestoreFields({
        subscription: JSON.stringify(subscription),
        atualizadoEm: now,
        criadoEm: now,
        expiraEm,
      }),
    }),
  });

  return id;
}

export async function deletePushSubscription(id) {
  await firestoreRequest(`/${PUSH_SUBSCRIPTIONS_COLLECTION}/${id}`, {
    method: 'DELETE',
  });
}

export async function listClientSubscriptions() {
  const subscriptions = await listCollection(
    CLIENT_SUBSCRIPTIONS_COLLECTION,
    fromClientSubscriptionDocument,
  );
  const expired = subscriptions.filter((item) => !isActiveUntil(item.expiraEm));

  await Promise.all(expired.map((item) => deleteClientSubscription(item.id)));

  return subscriptions.filter((item) => isActiveUntil(item.expiraEm));
}

export async function listClientWhatsAppNotifications() {
  return listCollection(
    CLIENT_WHATSAPP_NOTIFICATIONS_COLLECTION,
    fromClientWhatsAppNotificationDocument,
  );
}

export async function getClientWhatsAppNotification(uid) {
  if (!uid) {
    return null;
  }

  try {
    const data = await firestoreRequest(`/${CLIENT_WHATSAPP_NOTIFICATIONS_COLLECTION}/${uid}`);
    return fromClientWhatsAppNotificationDocument(data);
  } catch (error) {
    const message = String(error.message || '').toLowerCase();

    if (
      error.status === 404 ||
      error.code === 'NOT_FOUND' ||
      message.includes('not found')
    ) {
      return null;
    }

    throw error;
  }
}

export async function upsertClientWhatsAppNotification(uid, documentData) {
  const now = new Date().toISOString();
  const existing = await getClientWhatsAppNotification(uid);

  await firestoreRequest(`/${CLIENT_WHATSAPP_NOTIFICATIONS_COLLECTION}/${uid}`, {
    method: 'PATCH',
    body: JSON.stringify({
      fields: toFirestoreFields({
        uid,
        email: String(documentData.email || existing?.email || '').trim(),
        phone: String(documentData.phone || existing?.phone || '').trim(),
        apikey: String(documentData.apikey || existing?.apikey || '').trim(),
        provider: 'callmebot',
        status: 'enabled',
        enabled: true,
        criadoEm: existing?.criadoEm || now,
        atualizadoEm: now,
        ultimoEnvioEm: existing?.ultimoEnvioEm || '',
        ultimoErro: '',
      }),
    }),
  });

  return getClientWhatsAppNotification(uid);
}

export async function updateClientWhatsAppNotificationStatus(uid, documentData = {}) {
  const existing = await getClientWhatsAppNotification(uid);

  if (!existing) {
    return null;
  }

  await firestoreRequest(`/${CLIENT_WHATSAPP_NOTIFICATIONS_COLLECTION}/${uid}`, {
    method: 'PATCH',
    body: JSON.stringify({
      fields: toFirestoreFields({
        uid: existing.uid,
        email: existing.email,
        phone: existing.phone,
        apikey: existing.apikey,
        provider: existing.provider || 'callmebot',
        status: existing.status || 'enabled',
        enabled: existing.enabled,
        criadoEm: existing.criadoEm,
        atualizadoEm: new Date().toISOString(),
        ultimoEnvioEm: documentData.ultimoEnvioEm ?? existing.ultimoEnvioEm,
        ultimoErro: documentData.ultimoErro ?? existing.ultimoErro,
      }),
    }),
  });

  return getClientWhatsAppNotification(uid);
}

export async function upsertClientSubscription(id, documentData) {
  const now = new Date().toISOString();
  const expiraEm = new Date(Date.now() + SUBSCRIPTION_TTL_MS).toISOString();

  await firestoreRequest(`/${CLIENT_SUBSCRIPTIONS_COLLECTION}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      fields: toFirestoreFields({
        ...documentData,
        subscription: JSON.stringify(documentData.subscription || {}),
        atualizadoEm: now,
        criadoEm: documentData.criadoEm || now,
        expiraEm,
      }),
    }),
  });

  return id;
}

export async function updateClientReminderSent(id) {
  const subscriptions = await listCollection(
    CLIENT_SUBSCRIPTIONS_COLLECTION,
    fromClientSubscriptionDocument,
  );
  const subscription = subscriptions.find((item) => item.id === id);

  if (!subscription) {
    return;
  }

  await upsertClientSubscription(id, {
    ...subscription,
    lembreteEnviadoEm: new Date().toISOString(),
  });
}

export async function deleteClientSubscription(id) {
  await firestoreRequest(`/${CLIENT_SUBSCRIPTIONS_COLLECTION}/${id}`, {
    method: 'DELETE',
  });
}

export async function getClientProfile(uid) {
  try {
    const data = await firestoreRequest(`/${CLIENT_PROFILES_COLLECTION}/${uid}`);
    return fromClientProfileDocument(data);
  } catch (error) {
    const message = String(error.message || '').toLowerCase();

    if (
      error.status === 404 ||
      error.code === 'NOT_FOUND' ||
      message.includes('not found')
    ) {
      return null;
    }

    throw error;
  }
}

export async function upsertClientProfile(uid, documentData) {
  const now = new Date().toISOString();
  const existing = await getClientProfile(uid);

  await firestoreRequest(`/${CLIENT_PROFILES_COLLECTION}/${uid}`, {
    method: 'PATCH',
    body: JSON.stringify({
      fields: toFirestoreFields({
        uid,
        fullName: String(documentData.fullName || existing?.fullName || '').trim(),
        phone: String(documentData.phone || existing?.phone || '').trim(),
        email: String(documentData.email || existing?.email || '').trim(),
        authProvider: String(documentData.authProvider || existing?.authProvider || '').trim(),
        photoURL: String(documentData.photoURL || existing?.photoURL || '').trim(),
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        lastLoginAt: now,
      }),
    }),
  });

  return getClientProfile(uid);
}

export async function listFinishedServices() {
  return listCollection(FINISHED_SERVICES_COLLECTION, fromFinishedServiceDocument);
}

export async function createFinishedService(documentData) {
  const id = documentData.id || randomUUID();

  await firestoreRequest(`/${FINISHED_SERVICES_COLLECTION}?documentId=${id}`, {
    method: 'POST',
    body: JSON.stringify({
      fields: toFirestoreFields(documentData),
    }),
  });

  return id;
}

export async function deleteFinishedService(id) {
  await firestoreRequest(`/${FINISHED_SERVICES_COLLECTION}/${id}`, {
    method: 'DELETE',
  });
}

export async function listCanceledServices() {
  return listCollection(CANCELED_SERVICES_COLLECTION, fromCanceledServiceDocument);
}

export async function createCanceledService(documentData) {
  const id = documentData.id || randomUUID();

  await firestoreRequest(`/${CANCELED_SERVICES_COLLECTION}?documentId=${id}`, {
    method: 'POST',
    body: JSON.stringify({
      fields: toFirestoreFields(documentData),
    }),
  });

  return id;
}

export async function deleteCanceledService(id) {
  await firestoreRequest(`/${CANCELED_SERVICES_COLLECTION}/${id}`, {
    method: 'DELETE',
  });
}

export async function listCompletedPlans() {
  return listCollection(COMPLETED_PLANS_COLLECTION, fromCompletedPlanDocument);
}

export async function upsertCompletedPlan(documentData) {
  const id = documentData.id || documentData.planId || randomUUID();

  await firestoreRequest(`/${COMPLETED_PLANS_COLLECTION}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      fields: toFirestoreFields({
        ...documentData,
        id,
      }),
    }),
  });

  return id;
}

export async function deleteCompletedPlan(id) {
  await firestoreRequest(`/${COMPLETED_PLANS_COLLECTION}/${id}`, {
    method: 'DELETE',
  });
}
