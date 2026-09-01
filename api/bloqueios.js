import { verifyAuthorizationHeader } from '../server/lib/auth.js';
import { deleteBlockedPeriod, listBlockedPeriods, upsertBlockedPeriod } from '../server/lib/firestore.js';
import { methodNotAllowed, sendJson } from '../server/lib/response.js';
import {
  buildBlockedPeriodId,
  getBlockedPeriodKind,
  validateBlockedPeriodPayload,
} from '../server/lib/validation.js';

function getQueryValue(request, key) {
  const value = request.query?.[key];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function isAuthorized(request) {
  return verifyAuthorizationHeader(request.headers.authorization || '');
}

async function listAdminBlockedPeriods(response) {
  try {
    const blockedPeriods = await listBlockedPeriods();
    blockedPeriods.sort((first, second) =>
      `${first.date} ${first.time}`.localeCompare(`${second.date} ${second.time}`),
    );

    return sendJson(response, 200, {
      blockedPeriods,
    });
  } catch (error) {
    return sendJson(response, 500, {
      message: error.message || 'Nao foi possivel carregar os bloqueios.',
    });
  }
}

async function createAdminBlockedPeriod(request, response) {
  const validationError = validateBlockedPeriodPayload(request.body);

  if (validationError) {
    return sendJson(response, 400, {
      message: validationError,
    });
  }

  const date = String(request.body.date || '').trim();
  const time = String(request.body.time || '').trim();
  const blockedPeriod = {
    id: buildBlockedPeriodId(date, time),
    date,
    time,
    kind: getBlockedPeriodKind(time),
    createdAt: new Date().toISOString(),
  };

  try {
    await upsertBlockedPeriod(blockedPeriod);

    return sendJson(response, 200, {
      blockedPeriod,
      message: time
        ? 'Horario bloqueado com sucesso.'
        : 'Data fechada com sucesso.',
    });
  } catch (error) {
    return sendJson(response, 500, {
      message: error.message || 'Nao foi possivel salvar o bloqueio.',
    });
  }
}

async function deleteAdminBlockedPeriod(response, id) {
  if (!id) {
    return sendJson(response, 400, {
      message: 'Identificador do bloqueio nao informado.',
    });
  }

  try {
    await deleteBlockedPeriod(id);
    return sendJson(response, 200, {
      message: 'Data ou horario reativado com sucesso.',
    });
  } catch (error) {
    return sendJson(response, 500, {
      message: error.message || 'Nao foi possivel remover o bloqueio.',
    });
  }
}

export default async function handler(request, response) {
  if (!isAuthorized(request)) {
    return sendJson(response, 401, {
      message: 'Sua sessão administrativa expirou. Entre novamente para continuar.',
    });
  }

  const id = getQueryValue(request, 'id');

  if (id) {
    if (request.method !== 'DELETE') {
      return methodNotAllowed(response);
    }

    return deleteAdminBlockedPeriod(response, id);
  }

  if (request.method === 'GET') {
    return listAdminBlockedPeriods(response);
  }

  if (request.method === 'POST') {
    return createAdminBlockedPeriod(request, response);
  }

  return methodNotAllowed(response);
}
