import { verifyAuthorizationHeader } from '../../server/lib/auth.js';
import { getPublicVapidKey, getPushEnvironmentStatus } from '../../server/lib/push.js';
import { methodNotAllowed, sendJson } from '../../server/lib/response.js';
import {
  getWhatsAppEnvironmentStatus,
  sendBarberWhatsAppNotification,
} from '../../server/lib/whatsapp.js';

async function sendWhatsAppTest(response) {
  try {
    const delivery = await sendBarberWhatsAppNotification({
      id: 'diagnostico',
      nome: 'Teste Loja das Chaves',
      telefone: 'Nao informado',
      servico: 'diagnostico',
      data: new Date().toISOString().slice(0, 10),
      horario: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Recife',
      }),
      observacao: 'Mensagem de teste enviada pelo painel administrativo.',
    });

    return sendJson(response, 200, {
      whatsapp: getWhatsAppEnvironmentStatus(),
      delivery,
    });
  } catch (error) {
    return sendJson(response, 500, {
      whatsapp: getWhatsAppEnvironmentStatus(),
      message: error.message || 'Não foi possível enviar o teste de WhatsApp.',
    });
  }
}

export default async function handler(request, response) {
  if (!['GET', 'POST'].includes(request.method)) {
    return methodNotAllowed(response);
  }

  const authorizationHeader = request.headers.authorization || '';

  if (request.method === 'GET' && !authorizationHeader) {
    try {
      return sendJson(response, 200, {
        publicKey: getPublicVapidKey(),
      });
    } catch (error) {
      return sendJson(response, 500, {
        message: error.message || 'Não foi possível carregar a chave de notificação.',
      });
    }
  }

  if (!verifyAuthorizationHeader(authorizationHeader)) {
    return sendJson(response, 401, {
      message: 'Sua sessão administrativa expirou. Entre novamente para continuar.',
    });
  }

  if (request.method === 'POST') {
    return sendWhatsAppTest(response);
  }

  try {
    return sendJson(response, 200, {
      status: getPushEnvironmentStatus(),
      whatsapp: getWhatsAppEnvironmentStatus(),
    });
  } catch (error) {
    return sendJson(response, 500, {
      message: error.message || 'Não foi possível verificar as notificações.',
    });
  }
}
