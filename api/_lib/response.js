export function sendJson(response, status, payload) {
  response.status(status).json(payload);
}

export function methodNotAllowed(response) {
  return sendJson(response, 405, {
    message: 'Método não permitido para este endpoint.',
  });
}
