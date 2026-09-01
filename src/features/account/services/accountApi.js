import { apiRequest } from '../../shared/services/apiClient';

export function saveClientProfile(payload, idToken) {
  return apiRequest('/api/clientes/perfil', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export function fetchClientProfile(idToken) {
  return apiRequest('/api/clientes/perfil', {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
}

export function fetchClientPlans(idToken) {
  return apiRequest('/api/planos?mine=1', {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
}

export function updateClientPlanAttendances(planId, payload, idToken) {
  return apiRequest(`/api/planos?id=${encodeURIComponent(planId)}&mine=1`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export function fetchClientWhatsAppStatus(idToken) {
  return apiRequest('/api/clientes/perfil?resource=whatsapp', {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
}

export function saveClientWhatsAppActivation(payload, idToken) {
  return apiRequest('/api/clientes/perfil?resource=whatsapp', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });
}
