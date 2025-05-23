import crypto from 'crypto';

interface JwtHeader {
  alg: 'HS256';
  typ: 'JWT';
}

interface JwtPayload {
  iat: number;
  exp: number;
  [key: string]: any;
}

// === Base64URL utils ===

function base64urlEncode(data: string | Buffer): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

// === JWT sign ===

export function signJwt(
  payload: Record<string, any>,
  secret: string,
  options?: { expiresIn?: number }
): string {
  const header: JwtHeader = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const iat = Math.floor(Date.now() / 1000);  // Issued at time seconds
  const exp = iat + (options?.expiresIn || 3600); // Expiration in seconds. Default is 1 hour TTL.

  const fullPayload: JwtPayload = {
    ...payload,
    iat,
    exp,
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(fullPayload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// === JWT decode (no verify) ===

// export function decodeJwt(token: string): {
//   header: JwtHeader;
//   payload: Record<string, any>;
// } {
//   const [headerB64, payloadB64] = token.split('.');

//   if (!headerB64 || !payloadB64) {
//     throw new Error('Invalid token format');
//   }

//   const header = JSON.parse(base64urlDecode(headerB64));
//   const payload = JSON.parse(base64urlDecode(payloadB64));

//   return { header, payload };
// }

// === JWT verify ===

export function verifyJwt(token: string, secret: string): Record<string, any> {
  const [headerB64, payloadB64, signature] = token.split('.');

  if (!headerB64 || !payloadB64 || !signature) {
    throw new Error('Invalid token format');
  }

  const signatureInput = `${headerB64}.${payloadB64}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  );

  if (!isValid) {
    throw new Error('Invalid signature');
  }

  const payload: JwtPayload = JSON.parse(base64urlDecode(payloadB64));
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && now > payload.exp) {
    throw new Error('Token expired');
  }

  return payload;
}
