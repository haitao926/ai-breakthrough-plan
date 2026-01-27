const crypto = require('crypto');
const path = require('path');
const { createDatabase } = require('./apps/api/db.js');

const DB_PATH = 'storage/db/db.sqlite';

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

async function test() {
  const db = await createDatabase(DB_PATH);
  const identifier = 'test01';
  const password = 'hvb9v7';

  console.log(`Testing login for: ${identifier} / ${password}`);

  const user = db.get(
    'SELECT id, name, email, role, avatar_url, password_hash FROM users WHERE email = ? OR name = ?',
    [identifier, identifier]
  );

  if (!user) {
    console.error('❌ User not found in DB!');
    const allUsers = db.all('SELECT name, email FROM users LIMIT 5');
    console.log('Available users:', allUsers);
    return;
  }

  console.log(`✅ User found: ${user.name} (${user.email})`);
  console.log(`Stored Hash: ${user.password_hash}`);

  const isValid = verifyPassword(password, user.password_hash);
  if (isValid) {
    console.log('✅ Password verification SUCCESS!');
  } else {
    console.error('❌ Password verification FAILED!');
    
    // Debug Hash
    const parts = user.password_hash.split('$');
    const salt = parts[1];
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    console.log(`Derived Hash: ${derived}`);
    console.log(`Expected Hash: ${parts[2]}`);
  }
}

test();
