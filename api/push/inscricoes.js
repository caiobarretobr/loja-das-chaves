import { verifyAuthorizationHeader } from '../_lib/auth.js';
import { upsertPushSubscription } from '../_lib/firestore.js';
import { createSubscriptionId, validatePushSubscription } from '../_lib/push.js';
import { methodNotAllowed, sendJson } from '../_lib/response.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return methodNotAllowed(response);
  }

  if (!verifyAuthorizationHeader(request.headers.authorization || '')) {
    return sendJson(response, 401, {
      message: 'Sua sessão administrativa expirou. Entre novamente para continuar.',
    });
  }

  const { subscription } = request.body || {};

  if (!validatePushSubscription(subscription)) {
    return sendJson(response, 400, {
      message: 'Inscrição de notificação inválida.',
    });
  }

  try {
    const id = createSubscriptionId(subscription);
    await upsertPushSubscription(id, subscription);

    return sendJson(response, 201, {
      id,
      message: 'Dispositivo adicionado à lista do barbeiro.',
    });
  } catch (error) {
    return sendJson(response, 500, {
      message: error.message || 'Não foi possível ativar as notificações.',
    });
  }
}
