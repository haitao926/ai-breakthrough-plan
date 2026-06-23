function createAuthHelpers(options) {
  const {
    crypto,
    authSecret,
    authTokenTtlHours,
    getUserById
  } = options;

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  function toBase64Url(buffer) {
    return Buffer.from(buffer)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  function fromBase64Url(text) {
    const normalized = String(text || '').replace(/-/g, '+').replace(/_/g, '/');
    const padLength = normalized.length % 4 === 0 ? 0 : 4 - (normalized.length % 4);
    return Buffer.from(`${normalized}${'='.repeat(padLength)}`, 'base64');
  }

  function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hashed = crypto.scryptSync(String(password || ''), salt, 64).toString('hex');
    return `scrypt$${salt}$${hashed}`;
  }

  function verifyPassword(password, storedHash) {
    const parts = String(storedHash || '').split('$');
    if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
    const [, salt, hash] = parts;
    const derived = crypto.scryptSync(String(password || ''), salt, 64).toString('hex');
    const hashBuffer = Buffer.from(hash, 'hex');
    const derivedBuffer = Buffer.from(derived, 'hex');
    if (hashBuffer.length !== derivedBuffer.length) return false;
    return crypto.timingSafeEqual(hashBuffer, derivedBuffer);
  }

  function createToken(payload) {
    const issuedAt = Math.floor(Date.now() / 1000);
    const exp = issuedAt + Math.max(1, authTokenTtlHours) * 3600;
    const header = { alg: 'HS256', typ: 'JWT' };
    const body = { ...payload, iat: issuedAt, exp };
    const data = `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(body))}`;
    const signature = toBase64Url(
      crypto.createHmac('sha256', authSecret).update(data).digest()
    );
    return { token: `${data}.${signature}`, exp };
  }

  function verifyToken(token) {
    const value = String(token || '').trim();
    if (!value) return null;
    const parts = value.split('.');
    if (parts.length !== 3) return null;
    const [headerPart, payloadPart, signature] = parts;
    const data = `${headerPart}.${payloadPart}`;
    const expected = toBase64Url(
      crypto.createHmac('sha256', authSecret).update(data).digest()
    );
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (signatureBuffer.length !== expectedBuffer.length) return null;
    if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;
    let payload;
    try {
      payload = JSON.parse(fromBase64Url(payloadPart).toString('utf8'));
    } catch (err) {
      return null;
    }
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  }

  function getAuthToken(request) {
    const authHeader = request.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    const legacyToken = request.headers['x-auth-token'];
    if (legacyToken) return String(legacyToken);
    return null;
  }

  function getUserFromToken(token) {
    const payload = verifyToken(token);
    if (!payload || !payload.sub) return null;
    return getUserById(payload.sub) || null;
  }

  function requireAuth(request, reply) {
    if (request.user) return true;
    reply.code(401);
    reply.send({ error: '未登录' });
    return false;
  }

  function requireRole(request, reply, roles) {
    if (!requireAuth(request, reply)) return false;
    if (request.user.role === 'admin') return true;
    if (!roles.includes(request.user.role)) {
      reply.code(403);
      reply.send({ error: '权限不足' });
      return false;
    }
    return true;
  }

  return {
    createToken,
    getAuthToken,
    getUserFromToken,
    hashPassword,
    normalizeEmail,
    requireAuth,
    requireRole,
    verifyPassword,
    verifyToken
  };
}

module.exports = {
  createAuthHelpers
};
