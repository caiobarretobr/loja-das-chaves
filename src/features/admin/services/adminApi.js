import { apiRequest } from '../../shared/services/apiClient';

const STORAGE_KEY = 'haircut-scheduler-admin-token';

export function getAdminToken() {
  return window.localStorage.getItem(STORAGE_KEY) || '';
}

export function setAdminToken(token) {
  window.localStorage.setItem(STORAGE_KEY, token);
}

export function clearAdminToken() {
  window.localStorage.removeItem(STORAGE_KEY);
}

function adminResourceWithId(resource, id, key = 'id') {
  return `/api/${resource}?${key}=${encodeURIComponent(id)}`;
}

export async function loginAdmin(password) {
  const data = await apiRequest('/api/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });

  if (data.token) {
    setAdminToken(data.token);
  }

  return data;
}

export function fetchAdminAppointments() {
  return apiRequest('/api/agendamentos', {
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
    },
  });
}

export function fetchAdminPlans() {
  return apiRequest('/api/planos', {
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
    },
  });
}

export function completeAppointment(appointmentId) {
  return apiRequest(adminResourceWithId('agendamentos', appointmentId), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
    },
  });
}

export function rescheduleAppointment(appointmentId, payload) {
  return apiRequest(adminResourceWithId('agendamentos', appointmentId), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
    },
    body: JSON.stringify({ action: 'reschedule', ...payload }),
  });
}

export function cancelAppointment(appointmentId) {
  return apiRequest(adminResourceWithId('agendamentos', appointmentId), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
    },
  });
}

export function fetchMonthlyReports() {
  return apiRequest('/api/relatorios', {
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
    },
  });
}

export function deleteMonthlyReport(monthKey) {
  return apiRequest(adminResourceWithId('relatorios', monthKey, 'month'), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
    },
  });
}

export function completePlanChecklistItem(planId, itemId) {
  return apiRequest(adminResourceWithId('planos', planId), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
    },
    body: JSON.stringify({ itemId }),
  });
}

export function reschedulePlanAttendance(planId, itemId, payload) {
  return apiRequest(adminResourceWithId('planos', planId), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
    },
    body: JSON.stringify({ action: 'rescheduleAttendance', itemId, ...payload }),
  });
}

export function removePlan(planId) {
  return apiRequest(adminResourceWithId('planos', planId), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
    },
  });
}

export function fetchBlockedPeriods() {
  return apiRequest('/api/bloqueios', {
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
    },
  });
}

export function createBlockedPeriod(payload) {
  return apiRequest('/api/bloqueios', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
    },
    body: JSON.stringify(payload),
  });
}

export function removeBlockedPeriod(blockedPeriodId) {
  return apiRequest(adminResourceWithId('bloqueios', blockedPeriodId), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
    },
  });
}
