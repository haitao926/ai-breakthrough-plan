const { createDatabase } = require('./db');
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hashed = crypto.scryptSync(String(password || ''), salt, 64).toString('hex');
  return `scrypt$${salt}$${hashed}`;
}

(async () => {
    try {
        const db = await createDatabase();
        console.log('Database connected.');

        // 1. Fix Project 1 Status
        db.run("UPDATE projects SET status = 'in_progress' WHERE id = 1");
        console.log('Force set Project 1 to "in_progress".');

        // 2. Create Users
        const passwordHash = hashPassword('123456');
        const createdAt = new Date().toISOString();

        for (let i = 1; i <= 19; i++) {
            const name = `Test Student ${i}`;
            const email = `test${i}@school.com`;
            
            const existing = db.get("SELECT id FROM users WHERE email = ?", [email]);
            let userId;

            if (existing) {
                console.log(`User ${email} already exists (ID: ${existing.id}).`);
                userId = existing.id;
            } else {
                const info = db.run(
                    'INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
                    [name, email, passwordHash, 'student', createdAt]
                );
                userId = info.lastInsertRowid;
                console.log(`Created user ${email} (ID: ${userId}).`);
            }

            // 3. Add to Project 1
            const member = db.get("SELECT id FROM project_members WHERE project_id = 1 AND user_id = ?", [userId]);
            if (!member) {
                db.run('INSERT INTO project_members (project_id, user_id, role, created_at) VALUES (1, ?, "member", ?)', [userId, createdAt]);
                console.log(`Added ${name} to Project 1.`);
            }
        }

        console.log('Done.');

    } catch (err) {
        console.error(err);
    }
})();
