const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { generateJWT } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: { message: 'Email and password are required' } });
    }
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND role IN ('coordinator', 'consultant') AND deleted_at IS NULL",
      [email.toLowerCase().trim()]
    );
    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: { message: 'Invalid email or password' } });
    }
    const user = rows[0];
    if (!user.password_hash) {
      return res.status(401).json({ success: false, error: { message: 'Account not set up' } });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: { message: 'Invalid email or password' } });
    }
    const token = generateJWT(user);
    res.json({ success: true, data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, job_title } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: { message: 'Name, email, and password are required' } });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows: existing } = await pool.query('SELECT id, role FROM users WHERE email = $1', [normalizedEmail]);
    let user;
    if (existing.length > 0) {
      const { rows } = await pool.query(
        `UPDATE users SET name = $1, password_hash = $2, role = 'coordinator', job_title = $3, updated_at = NOW()
         WHERE email = $4 RETURNING id, name, email, role`,
        [name, passwordHash, job_title, normalizedEmail]
      );
      user = rows[0];
    } else {
      const { rows } = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, job_title) VALUES ($1, $2, $3, 'coordinator', $4) RETURNING id, name, email, role`,
        [name, normalizedEmail, passwordHash, job_title]
      );
      user = rows[0];
    }
    const token = generateJWT(user);
    res.status(201).json({ success: true, data: { token, user } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

// POST /api/auth/token — Validate respondent access token
router.post('/token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: { message: 'Token is required' } });
    }
    const { rows } = await pool.query(
      `SELECT da.*, a.id as assessment_id, a.status as assessment_status,
              o.name as organisation_name, u.id as user_id, u.name as user_name, u.email as user_email
       FROM domain_assignments da
       JOIN assessments a ON da.assessment_id = a.id
       JOIN organisations o ON a.organisation_id = o.id
       JOIN users u ON da.primary_respondent_id = u.id
       WHERE da.access_token = $1`, [token]
    );
    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: { message: 'Invalid access token' } });
    }
    const assignment = rows[0];
    if (assignment.token_expires_at && new Date(assignment.token_expires_at) < new Date()) {
      return res.status(401).json({ success: false, error: { message: 'Access token has expired' } });
    }
    const { rows: allAssignments } = await pool.query(
      `SELECT da.domain_id, da.status FROM domain_assignments da
       WHERE da.assessment_id = $1 AND da.primary_respondent_id = $2`,
      [assignment.assessment_id, assignment.user_id]
    );
    res.json({
      success: true,
      data: {
        valid: true,
        respondent: { id: assignment.user_id, name: assignment.user_name, email: assignment.user_email },
        assessment: { id: assignment.assessment_id, status: assignment.assessment_status, organisationName: assignment.organisation_name },
        assignedDomains: allAssignments.map(a => ({ domainId: a.domain_id, status: a.status })),
      },
    });
  } catch (err) {
    console.error('Token validation error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

module.exports = router;
