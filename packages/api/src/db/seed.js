require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Domain key mapping: JSON display names → canonical domain IDs
const DOMAIN_KEY_MAP = {
  'Strategy': 'strategy',
  'Governance & Management': 'governance',
  'Financial & Service Management': 'financial',
  'Supply Chain': 'supply_chain',
  'Data Centre': 'data_centre',
  'Core Infrastructure': 'core_infrastructure',
  'AI & Advanced Compute': 'ai_compute',
  'Cloud Ops': 'cloud_ops',
  'Software Development': 'software_dev',
  'End User Services': 'end_user',
};

async function seed() {
  const client = await pool.connect();

  try {
    // Load question data
    const dataPath = path.join(__dirname, '../../seeds/question_seed_data.json');
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Check if questions already exist
    const { rows: existing } = await client.query('SELECT COUNT(*) as count FROM questions');
    if (parseInt(existing[0].count) > 0) {
      console.log(`Questions table already has ${existing[0].count} rows. Skipping seed.`);
      return;
    }

    let totalInserted = 0;

    await client.query('BEGIN');

    for (const [displayName, questions] of Object.entries(rawData)) {
      const canonicalDomainId = DOMAIN_KEY_MAP[displayName];
      if (!canonicalDomainId) {
        console.warn(`Unknown domain display name: "${displayName}". Skipping.`);
        continue;
      }

      for (const q of questions) {
        // Treat dash-only option_e as null
        const optionE = q.option_e && q.option_e.trim().length > 1 ? q.option_e : null;

        await client.query(
          `INSERT INTO questions (id, domain_id, display_id, question_text, option_a, option_b, option_c, option_d, option_e, max_score, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            q.id,
            canonicalDomainId,
            q.display_id,
            q.text,
            q.option_a,
            q.option_b,
            q.option_c,
            q.option_d,
            optionE,
            q.max_score,
            q.display_order,
          ]
        );
        totalInserted++;
      }

      console.log(`  Seeded ${questions.length} questions for ${displayName} (${canonicalDomainId})`);
    }

    await client.query('COMMIT');
    console.log(`\nTotal questions seeded: ${totalInserted}`);

    // Verify counts per domain
    const { rows: counts } = await client.query(
      'SELECT domain_id, COUNT(*) as count, SUM(max_score) as max_score FROM questions GROUP BY domain_id ORDER BY domain_id'
    );
    console.log('\nVerification:');
    let totalQuestions = 0;
    let totalMax = 0;
    for (const row of counts) {
      console.log(`  ${row.domain_id}: ${row.count} questions, max ${row.max_score}`);
      totalQuestions += parseInt(row.count);
      totalMax += parseInt(row.max_score);
    }
    console.log(`  TOTAL: ${totalQuestions} questions, max ${totalMax}`);

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
