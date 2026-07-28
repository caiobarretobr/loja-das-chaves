import { createECDH, createHash } from 'node:crypto';
import webpush from 'web-push';
import {
  deleteClientSubscription,
  deletePushSubscription,
  listClientSubscriptions,
  listPushSubscriptions,
  updateClientReminderSent,
} from './firestore.js';

function getVapidPublicKey() {
  return stripWrappingQuotes(process.env.VAPID_PUBLIC_KEY || '');
}

function getVapidPrivateKey() {
  return stripWrappingQuotes(process.env.VAPID_PRIVATE_KEY || '');
}

function getVapidSubject() {
  return stripWrappingQuotes(process.env.VAPID_SUBJECT || 'mailto:barbergs@localhost');
}

function stripWrappingQuotes(value) {
  const trimmed = String(value || '').trim().replace(/\s/g, '');
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];

  if ((first === '"' || first === "'") && first === last) {
    return trimmed.slice(1, -1).trim().replace(/\s/g, '');
  }

  return trimmed;
}

function decodePublicKey(publicKey) {
  return Buffer.from(
    `${publicKey}${'='.repeat((4 - (publicKey.length % 4)) % 4)}`
      .replace(/-/g, '+')
      .replace(/_/g, '/'),
    'base64',
  );
}

function isValidP256PublicKey(decodedKey) {
  try {
    const ecdh = createECDH('prime256v1');
    ecdh.setPublicKey(decodedKey);
    return true;
  } catch {
    return false;
  }
}

export function getPublicVapidKey() {
  const publicKey = getVapidPublicKey();

  if (!publicKey) {
    throw new Error('VAPID_PUBLIC_KEY não configurada.');
  }

  const decodedKey = decodePublicKey(publicKey);

  if (decodedKey.length !== 65 || decodedKey[0] !== 4 || !isValidP256PublicKey(decodedKey)) {
    throw new Error('VAPID_PUBLIC_KEY inválida.');
  }

  return publicKey;
}

export function getPushEnvironmentStatus() {
  const publicKey = getVapidPublicKey();
  const privateKey = getVapidPrivateKey();
  const subject = getVapidSubject();
  let publicKeyValid = false;
  let publicKeyBytes = 0;

  if (publicKey) {
    const decodedKey = decodePublicKey(publicKey);

    publicKeyBytes = decodedKey.length;
    publicKeyValid =
      decodedKey.length === 65 &&
      decodedKey[0] === 4 &&
      isValidP256PublicKey(decodedKey);
  }

  return {
    publicKeyConfigured: Boolean(publicKey),
    publicKeyValid,
    publicKeyBytes,
    publicKeyFingerprint: publicKey
      ? createHash('sha256').update(publicKey).digest('hex').slice(0, 12)
      : '',
    privateKeyConfigured: Boolean(privateKey),
    privateKeyLength: privateKey.length,
    subjectConfigured: Boolean(subject),
    subject,
  };
}

function configureWebPush() {
  const publicKey = getPublicVapidKey();
  const privateKey = getVapidPrivateKey();

  if (!privateKey) {
    throw new Error('VAPID_PRIVATE_KEY não configurada.');
  }

  webpush.setVapidDetails(getVapidSubject(), publicKey, privateKey);
}

export function createSubscriptionId(subscription) {
  const endpoint = subscription?.endpoint || '';

  if (!endpoint) {
    throw new Error('Inscrição de notificação inválida.');
  }

  return createHash('sha256').update(endpoint).digest('hex');
}

export function validatePushSubscription(subscription) {
  return Boolean(
    subscription &&
      typeof subscription.endpoint === 'string' &&
      subscription.keys &&
      typeof subscription.keys.p256dh === 'string' &&
      typeof subscription.keys.auth === 'string',
  );
}

async function notifySubscriptions(subscriptions, payload, removeInvalidSubscription) {
  const body = JSON.stringify({
    title: payload.title || 'Barber GS',
    body: payload.body || '',
    tag: payload.tag || 'barbergs-alerta',
    url: payload.url || '/',
  });
  const results = await Promise.allSettled(
    subscriptions.map(async (item) => {
      try {
        await webpush.sendNotification(item.subscription, body);
        return { id: item.id, sent: true };
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await removeInvalidSubscription(item.id);
          return { id: item.id, sent: false, removed: true };
        }

        throw error;
      }
    }),
  );

  const sent = results.filter((result) => result.status === 'fulfilled' && result.value.sent).length;
  const removed = results.filter(
    (result) => result.status === 'fulfilled' && result.value.removed,
  ).length;
  const failed = results.filter((result) => result.status === 'rejected').length;

  return {
    total: subscriptions.length,
    sent,
    removed,
    failed,
  };
}

export async function notifyBarberDevices(payload) {
  configureWebPush();

  return notifySubscriptions(
    await listPushSubscriptions(),
    payload,
    deletePushSubscription,
  );
}

export async function notifyClientAndBarberDevices(clientSubscriptionId, payload) {
  configureWebPush();

  const clientSubscriptions = await listClientSubscriptions();
  const clientSubscription = clientSubscriptions.find((item) => item.id === clientSubscriptionId);
  const [clientDelivery, barberDelivery] = await Promise.all([
    clientSubscription?.subscription?.endpoint
      ? notifySubscriptions([clientSubscription], payload, deleteClientSubscription)
      : Promise.resolve({ total: 0, sent: 0, removed: 0, failed: 0 }),
    notifySubscriptions(await listPushSubscriptions(), payload, deletePushSubscription),
  ]);

  if (clientSubscription) {
    await updateClientReminderSent(clientSubscription.id);
  }

  return {
    client: clientDelivery,
    barber: barberDelivery,
  };
}

export async function notifyClientDevice(clientSubscriptionId, payload) {
  configureWebPush();

  const clientSubscriptions = await listClientSubscriptions();
  const clientSubscription = clientSubscriptions.find((item) => item.id === clientSubscriptionId);

  if (!clientSubscription) {
    return { total: 0, sent: 0, removed: 0, failed: 0, missing: true };
  }

  if (!clientSubscription.subscription?.endpoint) {
    await updateClientReminderSent(clientSubscription.id);
    return { total: 0, sent: 0, removed: 0, failed: 0, skipped: true };
  }

  const delivery = await notifySubscriptions([clientSubscription], payload, deleteClientSubscription);

  if (delivery.sent > 0 || delivery.removed > 0) {
    await updateClientReminderSent(clientSubscription.id);
  }

  return delivery;
}
