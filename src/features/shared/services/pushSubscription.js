import { apiRequest } from './apiClient';

function stripWrappingQuotes(value) {
  const trimmed = String(value || '').trim().replace(/\s/g, '');
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];

  if ((first === '"' || first === "'") && first === last) {
    return trimmed.slice(1, -1).trim().replace(/\s/g, '');
  }

  return trimmed;
}

function urlBase64ToUint8Array(value) {
  const normalized = stripWrappingQuotes(value);
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  const base64 = `${normalized}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function isSameApplicationServerKey(firstKey, secondKey) {
  if (!firstKey || !secondKey || firstKey.byteLength !== secondKey.byteLength) {
    return false;
  }

  const first = new Uint8Array(firstKey);
  const second = new Uint8Array(secondKey);

  return first.every((byte, index) => byte === second[index]);
}

function toArrayBuffer(value) {
  return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
}

function getPushRegistrationError(error) {
  const message = String(error?.message || '');
  const details = [error?.name, message].filter(Boolean).join(': ');

  if (message.toLowerCase().includes('push service')) {
    return `Falha ao registrar no serviço de push. Use Chrome/Edge em HTTPS, desative bloqueadores para este site e tente novamente. Detalhe técnico: ${details || 'push service recusou a inscrição'}.`;
  }

  if (error?.name === 'InvalidCharacterError') {
    return 'Chave pública VAPID inválida. Confira a variável VAPID_PUBLIC_KEY no Vercel.';
  }

  return details || 'Não foi possível ativar notificações.';
}

const SERVICE_WORKER_VERSION = '2026-07-29-01';

async function getCleanServiceWorkerRegistration() {
  const registrations = await navigator.serviceWorker.getRegistrations();

  await Promise.all(
    registrations
      .filter((registration) => !registration.active?.scriptURL.endsWith('/sw.js'))
      .map((registration) => registration.unregister()),
  );

  const registration = await navigator.serviceWorker.register(`/sw.js?v=${SERVICE_WORKER_VERSION}`, {
    scope: '/',
    updateViaCache: 'none',
  });

  await registration.update().catch(() => {});

  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  return navigator.serviceWorker.ready;
}

async function removeExistingSubscription(registration) {
  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription) {
    await existingSubscription.unsubscribe();
  }
}

async function subscribeWithKey(registration, applicationServerKey) {
  const existingSubscription = await registration.pushManager.getSubscription();

  if (
    existingSubscription &&
    isSameApplicationServerKey(
      existingSubscription.options?.applicationServerKey,
      applicationServerKey,
    )
  ) {
    return existingSubscription;
  }

  if (existingSubscription) {
    await existingSubscription.unsubscribe();
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: toArrayBuffer(applicationServerKey),
  });
}

export async function createBrowserPushSubscription() {
  if (!window.isSecureContext) {
    throw new Error('Notificações push exigem HTTPS.');
  }

  if (!('Notification' in window)) {
    throw new Error('Este navegador não suporta notificações.');
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Este navegador não suporta notificações push.');
  }

  const permission = await window.Notification.requestPermission();

  if (permission !== 'granted') {
    throw new Error('Permissão de notificação não autorizada.');
  }

  const { publicKey } = await apiRequest('/api/push/status');

  if (!publicKey) {
    throw new Error('Chave pública de notificação não configurada.');
  }

  const applicationServerKey = urlBase64ToUint8Array(publicKey);

  if (applicationServerKey.byteLength !== 65 || applicationServerKey[0] !== 4) {
    throw new Error('Chave pública VAPID inválida. Confira a variável VAPID_PUBLIC_KEY no Vercel.');
  }

  try {
    const registration = await getCleanServiceWorkerRegistration();
    return await subscribeWithKey(registration, applicationServerKey);
  } catch {
    try {
      const registration = await getCleanServiceWorkerRegistration();
      await removeExistingSubscription(registration);
      return await subscribeWithKey(registration, applicationServerKey);
    } catch (retryError) {
      throw new Error(getPushRegistrationError(retryError));
    }
  }
}
