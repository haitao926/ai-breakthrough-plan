const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const { createAuthHelpers } = require('./auth-helpers');

test('auth helpers normalize email, hash/verify passwords, and validate tokens', () => {
  const users = new Map([
    [7, { id: 7, name: 'Teacher', email: 'teacher@example.com', role: 'teacher', avatar_url: '' }]
  ]);
  const helpers = createAuthHelpers({
    crypto,
    authSecret: 'test-secret',
    authTokenTtlHours: 2,
    getUserById: (id) => users.get(Number(id)) || null
  });

  assert.equal(helpers.normalizeEmail('  Demo@Example.COM '), 'demo@example.com');

  const passwordHash = helpers.hashPassword('secret123');
  assert.equal(helpers.verifyPassword('secret123', passwordHash), true);
  assert.equal(helpers.verifyPassword('wrong', passwordHash), false);

  const { token } = helpers.createToken({ sub: 7, role: 'teacher' });
  const payload = helpers.verifyToken(token);
  assert.equal(payload.sub, 7);
  assert.equal(helpers.getUserFromToken(token).email, 'teacher@example.com');

  const request = { headers: { authorization: `Bearer ${token}` } };
  assert.equal(helpers.getAuthToken(request), token);
});

test('auth helpers enforce auth and role guards', () => {
  const helpers = createAuthHelpers({
    crypto,
    authSecret: 'test-secret',
    authTokenTtlHours: 2,
    getUserById: () => null
  });

  const reply = {
    statusCode: 200,
    payload: null,
    code(value) {
      this.statusCode = value;
      return this;
    },
    send(value) {
      this.payload = value;
      return this;
    }
  };

  assert.equal(helpers.requireAuth({ user: null }, reply), false);
  assert.equal(reply.statusCode, 401);

  const forbiddenReply = {
    statusCode: 200,
    payload: null,
    code(value) {
      this.statusCode = value;
      return this;
    },
    send(value) {
      this.payload = value;
      return this;
    }
  };
  assert.equal(helpers.requireRole({ user: { role: 'student' } }, forbiddenReply, ['teacher']), false);
  assert.equal(forbiddenReply.statusCode, 403);
  assert.equal(helpers.requireRole({ user: { role: 'teacher' } }, forbiddenReply, ['teacher']), true);
});
