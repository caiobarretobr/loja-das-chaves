import { apiRequest } from '../../shared/services/apiClient';
import { createBrowserPushSubscription } from '../../shared/services/pushSubscription';

export function fetchAvailability() {
  return apiRequest('/api/disponibilidade');
}

export function createAppointment(payload) {
  return apiRequest('/api/agendamentos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function prepareClientPushSubscription() {
  return createBrowserPushSubscription();
}

export async function registerClientReminder(payload, subscription = null) {
  const data = await apiRequest('/api/clientes/inscricoes', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      ...(subscription ? { subscription } : {}),
    }),
  });

  return {
    ...data,
    notificationActive: Boolean(subscription),
  };
}

export function createPlan(payload, idToken = '') {
  return apiRequest('/api/planos', {
    method: 'POST',
    headers: idToken ? {
      Authorization: `Bearer ${idToken}`,
    } : {},
    body: JSON.stringify(payload),
  });
}
