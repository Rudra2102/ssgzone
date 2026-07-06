const { Pool } = require('pg');
const https = require('https');

const pemsDb = new Pool({
  host: 'localhost', port: 5432,
  database: 'PEMSpg', user: 'postgres', password: 'academy'
});

const ssgzoneDb = new Pool({
  host: 'localhost', port: 5432,
  database: 'ssgzone_mail', user: 'postgres', password: 'academy'
});

const TENANT_ID = '8b8d6a45-af65-4047-8952-ba1fd6eb546e';
const COMPANY_SLUG = 'lincpay';
const API_KEY = 'ssg_live_pems_12345';

function apiPost(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost', port: 4000, path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = require('http').request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  const employees = await pemsDb.query(`
    SELECT e.id, u.name FROM employee e
    JOIN "user" u ON e.user_id = u.id
    WHERE e.company_id = '322c4350-6fe0-417d-a4bd-39e7f9e94e4e'
    AND (e.professional_email IS NULL OR e.professional_email = '')
  `);

  console.log(`Processing ${employees.rows.length} employees...`);

  for (const emp of employees.rows) {
    const parts = emp.name.trim().split(' ');
    const firstName = parts[0].toLowerCase().replace(/[^a-z]/g, '');
    const lastName = (parts[1] || 'user').toLowerCase().replace(/[^a-z]/g, '');
    const username = `${firstName}.${lastName}`;
    const email = `${username}@${COMPANY_SLUG}.pems.ssgzone.in`;

    try {
      // Check if user already exists in SSGzone
      const existing = await ssgzoneDb.query(
        'SELECT id FROM tenant_users WHERE email = $1 AND tenant_id = $2',
        [email, TENANT_ID]
      );

      if (existing.rows.length === 0) {
        const result = await apiPost('/api/v1/saas/users/provision', {
          tenant_id: TENANT_ID,
          username, email,
          first_name: parts[0],
          last_name: parts[1] || 'User',
          role: 'user'
        });

        if (result.success) {
          await pemsDb.query(
            'UPDATE employee SET professional_email = $1 WHERE id = $2',
            [email, emp.id]
          );
          console.log(`✅ ${emp.name} -> ${email}`);
        } else {
          // Username conflict - try with employee id suffix
          const username2 = `${firstName}.${lastName}${Math.floor(Math.random()*99)}`;
          const email2 = `${username2}@${COMPANY_SLUG}.pems.ssgzone.in`;
          const result2 = await apiPost('/api/v1/saas/users/provision', {
            tenant_id: TENANT_ID,
            username: username2, email: email2,
            first_name: parts[0],
            last_name: parts[1] || 'User',
            role: 'user'
          });
          if (result2.success) {
            await pemsDb.query(
              'UPDATE employee SET professional_email = $1 WHERE id = $2',
              [email2, emp.id]
            );
            console.log(`✅ ${emp.name} -> ${email2}`);
          } else {
            console.log(`❌ ${emp.name}: ${result2.error}`);
          }
        }
      } else {
        // Already exists - just update PEMS
        await pemsDb.query(
          'UPDATE employee SET professional_email = $1 WHERE id = $2',
          [email, emp.id]
        );
        console.log(`⚡ ${emp.name} -> ${email} (already existed)`);
      }
    } catch (e) {
      console.log(`❌ ${emp.name}: ${e.message}`);
    }
  }

  console.log('\nDone!');
  await pemsDb.end();
  await ssgzoneDb.end();
}

run().catch(console.error);
