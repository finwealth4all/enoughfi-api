// ===================================================
// MAKE USER ADMIN — setup-admin.js
// Run: node setup-admin.js your@email.com
// ===================================================
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function makeAdmin() {
    const email = process.argv[2];
    if (!email) {
        console.log('Usage: node setup-admin.js your@email.com');
        process.exit(1);
    }

    const result = await pool.query(
        'UPDATE users SET is_admin = true WHERE email = $1 RETURNING user_id, email, name',
        [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
        console.log(`❌ User not found: ${email}`);
        console.log('Register first at the app, then run this script.');
    } else {
        console.log(`✅ ${result.rows[0].name} (${result.rows[0].email}) is now an admin!`);
    }

    await pool.end();
}

makeAdmin().catch(err => { console.error(err); process.exit(1); });
