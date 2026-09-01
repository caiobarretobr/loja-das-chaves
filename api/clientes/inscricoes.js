import { createHash } from 'node:crypto';
import { verifyAuthorizationHeader } from '../../server/lib/auth.js';
import { listClientSubscriptions, upsertClientSubscription } from '../../server/lib/firestore.js';
import { validatePushSubscription } from '../../server/lib/push.js';
import { methodNotAllowed, sendJson } from '../../server/lib/response.js';

function createClientSubscriptionId(payload) {
  const rawValue = [
    payload.appointmentId || '',
    payload.nome || '',
    payload.servico || '',
    payload.data || '',
    payload.horario || '',
    payload.subscription?.endpoint || '',
  ].join('|');

  return createHash('sha256').update(rawValue).digest('hex');
}

function validatePayload(payload) {
  if (!payload?.appointmentId || !payload?.nome || !payload?.servico || !payload?.data || !payload?.horario) {
    return 'Dados do lembrete incompletos.';
  }

  if (payload.subscription && !validatePushSubscription(payload.subscription)) {
    return 'Inscrição de notificação inválida.';
  }

  return '';
}

export default async function handler(request, response) {
  if (request.method === 'GET') {
    if (!verifyAuthorizationHeader(request.headers.authorization || '')) {
      return sendJson(response, 401, {
        message: 'Sua sessão administrativa expirou. Entre novamente para continuar.',
      });
    }

    try {
      const subscriptions = await listClientSubscriptions();
      subscriptions.sort((first, second) =>
        `${first.data} ${first.horario}`.localeCompare(`${second.data} ${second.horario}`),
      );

      return sendJson(response, 200, {
        clients: subscriptions,
      });
    } catch (error) {
      return sendJson(response, 500, {
        message: error.message || 'Não foi possível carregar a lista de clientes.',
      });
    }
  }

  if (request.method === 'POST') {
    const payload = request.body || {};
    const validationError = validatePayload(payload);

    if (validationError) {
      return sendJson(response, 400, {
        message: validationError,
      });
    }

    try {
      const id = createClientSubscriptionId(payload);
      await upsertClientSubscription(id, {
        appointmentId: String(payload.appointmentId || ''),
        nome: String(payload.nome || '').trim(),
        servico: String(payload.servico || '').trim(),
        data: String(payload.data || '').trim(),
        horario: String(payload.horario || '').trim(),
        subscription: payload.subscription || {},
      });

      return sendJson(response, 201, {
        id,
        message: 'Lembrete do cliente registrado.',
      });
    } catch (error) {
      return sendJson(response, 500, {
        message: error.message || 'Não foi possível registrar o lembrete do cliente.',
      });
    }
  }

  return methodNotAllowed(response);
}
