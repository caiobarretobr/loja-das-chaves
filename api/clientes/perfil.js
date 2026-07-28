import { verifyFirebaseAuthorizationHeader } from '../_lib/auth.js';
import { getClientProfile, upsertClientProfile } from '../_lib/firestore.js';
import { methodNotAllowed, sendJson } from '../_lib/response.js';
import { isValidPhone, normalizePhone } from '../_lib/validation.js';

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
