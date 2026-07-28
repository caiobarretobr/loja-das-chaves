import { createSessionToken, verifyPassword } from './_lib/auth.js';
import { methodNotAllowed, sendJson } from './_lib/response.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return methodNotAllowed(response);
  }

  const { password = '' } = request.body || {};

  if (!verifyPassword(password)) {
    return sendJson(response, 401, {
      message: 'Senha inválida. Verifique e tente novamente.',
    });
  }

  return sendJson(response, 200, {
    token: createSessionToken(),
  });
}
