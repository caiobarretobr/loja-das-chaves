import { verifyAuthorizationHeader } from '../../server/lib/auth.js';
import { notifyBarberDevices, notifyClientAndBarberDevices } from '../../server/lib/push.js';
import { methodNotAllowed, sendJson } from '../../server/lib/response.js';

const ALLOWED_MESSAGES = new Set([
  'Novo agendamento confirmado!',
  'Serviço a ser feito daqui a 1 hora!',
]);

function isAllowedMessage(message = '') {
  return (
    ALLOWED_MESSAGES.has(message) ||
    /^Seu atendimento na Loja das Chaves será às .+\. Lembre-se de chegar 5 minutos antes\.$/.test(message)
  );
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return methodNotAllowed(response);
  }

  if (!verifyAuthorizationHeader(request.headers.authorization || '')) {
    return sendJson(response, 401, {
      message: 'Sua sessão administrativa expirou. Entre novamente para continuar.',
    });
  }

  const { message = '', tag = '', clientSubscriptionId = '' } = request.body || {};

  if (!isAllowedMessage(message)) {
    return sendJson(response, 400, {
      message: 'Mensagem de notificação inválida.',
    });
  }

  try {
    const payload = {
      title: 'Loja das Chaves',
      body: message,
      tag: tag || 'loja-chaves-agendamento',
      url: '/',
    };
    const delivery = clientSubscriptionId
      ? await notifyClientAndBarberDevices(clientSubscriptionId, payload)
      : await notifyBarberDevices(payload);

    return sendJson(response, 200, {
      message: 'Notificação enviada para a lista da loja.',
      delivery,
    });
  } catch (error) {
    return sendJson(response, 500, {
      message: error.message || 'Não foi possível enviar a notificação.',
    });
  }
}
