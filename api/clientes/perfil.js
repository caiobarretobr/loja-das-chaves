import { verifyFirebaseAuthorizationHeader } from '../../server/lib/auth.js';
import {
  getClientProfile,
  getClientWhatsAppNotification,
  upsertClientProfile,
  upsertClientWhatsAppNotification,
} from '../../server/lib/firestore.js';
import { methodNotAllowed, sendJson } from '../../server/lib/response.js';
import { isValidPhone, normalizePhone } from '../../server/lib/validation.js';
import { parseClientCallMeBotActivation } from '../../server/lib/whatsapp.js';

function getProviderName(firebase = {}) {
  const identities = firebase.identities || {};

  if (Array.isArray(identities['google.com']) && identities['google.com'].length > 0) {
    return 'google';
  }

  if (Array.isArray(identities.email) && identities.email.length > 0) {
    return 'password';
  }

  return firebase.sign_in_provider || 'firebase';
}

function publicProfile(profile) {
  if (!profile) {
    return null;
  }

  return {
    uid: profile.uid,
    fullName: profile.fullName,
    phone: profile.phone,
    email: profile.email,
    authProvider: profile.authProvider,
    photoURL: profile.photoURL,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    lastLoginAt: profile.lastLoginAt,
  };
}

function publicWhatsAppStatus(record) {
  return {
    enabled: Boolean(record?.enabled && record?.status !== 'disabled'),
    phone: record?.phone ? `*****${record.phone.slice(-4)}` : '',
    provider: record?.provider || 'callmebot',
    atualizadoEm: record?.atualizadoEm || '',
  };
}

function getQueryValue(request, key) {
  const value = request.query?.[key];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

export default async function handler(request, response) {
  if (!['GET', 'POST', 'PATCH'].includes(request.method)) {
    return methodNotAllowed(response);
  }

  const user = await verifyFirebaseAuthorizationHeader(request.headers.authorization || '');

  if (!user) {
    return sendJson(response, 401, {
      message: 'Entre na sua conta para continuar.',
    });
  }

  try {
    if (getQueryValue(request, 'resource') === 'whatsapp') {
      if (request.method === 'PATCH') {
        return methodNotAllowed(response);
      }

      if (request.method === 'GET') {
        const record = await getClientWhatsAppNotification(user.uid);

        return sendJson(response, 200, {
          whatsapp: publicWhatsAppStatus(record),
        });
      }

      const activation = parseClientCallMeBotActivation(
        request.body?.message || request.body?.url || '',
      );

      if (!activation) {
        return sendJson(response, 400, {
          message: 'Não foi possível encontrar um link válido do CallMeBot. Confira a mensagem e tente novamente.',
        });
      }

      const record = await upsertClientWhatsAppNotification(user.uid, {
        email: user.email,
        phone: activation.phone,
        apikey: activation.apikey,
      });

      return sendJson(response, 200, {
        whatsapp: publicWhatsAppStatus(record),
        message: 'Notificações via WhatsApp ativadas com sucesso.',
      });
    }

    if (request.method === 'GET') {
      const profile = await getClientProfile(user.uid);

      return sendJson(response, 200, {
        profile: publicProfile(profile),
      });
    }

    const fullName = String(request.body?.fullName || user.name || '').trim();
    const phone = normalizePhone(String(request.body?.phone || ''));

    if (fullName.length < 3) {
      return sendJson(response, 400, {
        message: 'Informe seu nome completo.',
      });
    }

    if (!isValidPhone(phone)) {
      return sendJson(response, 400, {
        message: 'Informe um telefone válido com DDD ou deixe o campo em branco.',
      });
    }

    const profile = await upsertClientProfile(user.uid, {
      fullName,
      phone,
      email: user.email || String(request.body?.email || ''),
      authProvider: getProviderName(user.firebase),
      photoURL: user.picture || String(request.body?.photoURL || ''),
    });

    return sendJson(response, 200, {
      profile: publicProfile(profile),
      message: 'Conta do usuário salva com sucesso.',
    });
  } catch (error) {
    return sendJson(response, 500, {
      message: error.message || 'Não foi possível salvar sua conta.',
    });
  }
}
