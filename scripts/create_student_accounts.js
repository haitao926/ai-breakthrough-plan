const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { createDatabase } = require('../apps/api/db.js');

const DB_PATH = path.join(__dirname, '../storage/db/db.sqlite');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hashed = crypto.scryptSync(String(password || ''), salt, 64).toString('hex');
  return `scrypt$${salt}$${hashed}`;
}

function generatePassword(length = 8) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // No confusable chars
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

async function main() {
  const args = process.argv.slice(2);
  const prefix = args[0] || 'student';
  const count = parseInt(args[1] || '10', 10);
  const className = args[2] || 'Class 1';

  console.log(`Generating ${count} accounts for class "${className}" with prefix "${prefix}"...`);

  const db = await createDatabase(DB_PATH);
  const users = [];

  // Use a transaction
  db.transaction((tx) => {
    for (let i = 1; i <= count; i++) {
      const num = String(i).padStart(2, '0');
      const username = `${prefix}${num}`;
      const email = `${username}@school.local`; // Dummy email
      const password = generatePassword(6);
      const passwordHash = hashPassword(password);
      const role = 'student';
      const createdAt = new Date().toISOString();

      // Check if exists
      const existing = tx.get('SELECT id FROM users WHERE email = ?', [email]);
      if (existing) {
        console.log(`Skipping ${email} (already exists)`);
        continue;
      }

      tx.run(
        'INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
        [username, email, passwordHash, role, createdAt]
      );
      
      users.push({ username, password, email, className });
    }
  });

  if (users.length > 0) {
    const csvContent = ['Username,Password,Email,Class'].join(',') + '\n' +
      users.map(u => `${u.username},${u.password},${u.email},${u.className}`).join('\n');
    
    const outFile = path.join(__dirname, `accounts_${prefix}_${Date.now()}.csv`);
    fs.writeFileSync(outFile, csvContent);
    console.log(`✅ Successfully generated ${users.length} accounts.`);
    console.log(`📄 Saved to: ${outFile}`);
  } else {
    console.log('⚠️ No new accounts generated.');
  }
}

main().catch(console.error);
