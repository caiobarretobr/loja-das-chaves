import { createHmac, createVerify, timingSafeEqual } from 'node:crypto';

const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

function getSecret() {
  const secret = process.env.ADMIN_SECRET || '';

  if (!secret) {
    throw new Error('ADMIN_SECRET não configurado.');
  }

  return secret;
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function signPayload(encodedPayload) {
  return createHmac('sha256', getSecret()).update(encodedPayload).digest('base64url');
}

export function createSessionToken() {
  const payload = {
    role: 'admin',
    exp: Date.now() + SESSION_DURATION_MS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyPassword(password) {
  const expected = Buffer.from(process.env.ADMIN_PASSWORD || 'rafa123', 'utf8');
  const received = Buffer.from(password || '', 'utf8');

  if (!expected.length || expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

export function verifyAuthorizationHeader(authorizationHeader = '') {
  if (!authorizationHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authorizationHeader.slice(7);
  const [encodedPayload, receivedSignature] = token.split('.');

  if (!encodedPayload || !receivedSignature) {
    return false;
  }

  const expectedSignature = signPayload(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(receivedSignature);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  if (!timingSafeEqual(expectedBuffer, receivedBuffer)) {
    return false;
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  return payload.role === 'admin' && Number(payload.exp) > Date.now();
}

let cachedFirebaseCerts = null;
let cachedFirebaseCertsExpiration = 0;

function decodeBase64UrlJson(value = '') {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

async function getFirebaseCerts() {
  if (cachedFirebaseCerts && cachedFirebaseCertsExpiration > Date.now() + 60_000) {
    return cachedFirebaseCerts;
  }

  const response = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
  );
  const certs = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error('Não foi possível validar a sessão do usuário.');
  }

  const cacheControl = response.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;

  cachedFirebaseCerts = certs;
  cachedFirebaseCertsExpiration = Date.now() + maxAgeSeconds * 1000;
  return cachedFirebaseCerts;
}

export async function verifyFirebaseAuthorizationHeader(authorizationHeader = '') {
  if (!authorizationHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authorizationHeader.slice(7);
  const [encodedHeader, encodedPayload, receivedSignature] = token.split('.');

  if (!encodedHeader || !encodedPayload || !receivedSignature) {
    return null;
  }

  const header = decodeBase64UrlJson(encodedHeader);
  const payload = decodeBase64UrlJson(encodedPayload);
  const projectId = process.env.FIREBASE_PROJECT_ID || '';

  if (!projectId || header.alg !== 'RS256' || !header.kid) {
    return null;
  }

  const certs = await getFirebaseCerts();
  const cert = certs[header.kid];

  if (!cert) {
    return null;
  }

  const verifier = createVerify('RSA-SHA256');
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();

  const signatureValid = verifier.verify(cert, Buffer.from(receivedSignature, 'base64url'));

  if (!signatureValid) {
    return null;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;

  if (
    payload.aud !== projectId ||
    payload.iss !== expectedIssuer ||
    !payload.sub ||
    Number(payload.exp || 0) <= nowInSeconds ||
    Number(payload.iat || 0) > nowInSeconds + 300
  ) {
    return null;
  }

  return {
    uid: payload.sub,
    email: payload.email || '',
    name: payload.name || '',
    picture: payload.picture || '',
    firebase: payload.firebase || {},
  };
}
