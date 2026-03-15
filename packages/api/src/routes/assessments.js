const express = require('express');
const pool = require('../db/pool');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { DOMAINS, DOMAIN_ORDER, STATUS_TRANSITIONS } = require('../constants/domains');
const { calculateDomainScore, calculateAssessmentScore } = require('../services/scoring');
const emailService = require('../services/email');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const TOKEN_EXPIRY_DAYS = parseInt(process.env.RESPONDENT_TOKEN_EXPIRY_DAYS || '30');

// POST /api/assessments — Create a new assessment
router.post('/', authenticateJWT, requireRole('coordinator'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { organisation, coordinator_name, coordinator_email, coordinator_job_title, deadline } = req.body;

    if (!organisation?.name || !organisation?.sector || !organisation?.size_band || !organisation?.region) {
      return res.status(400).json({ success: false, error: { message: 'Organisation name, sector, size_band, and region are required' } });
    }

    await client.query('BEGIN');

    // Create organisation
    const { rows: [org] } = await client.query(
      `INSERT INTO organisations (name, sector, size_band, region) VALUES ($1, $2, $3, $4) RETURNING id`,
      [organisation.name, organisation.sector, organisation.size_band, organisation.region]
    );

    // Create assessment
    const { rows: [assessment] } = await client.query(
      `INSERT INTO assessments (organisation_id, coordinator_id, status, deadline) VALUES ($1, $2, 'DRAFT', $3) RETURNING *`,
      [org.id, req.user.userId, deadline || null]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: { assessment_id: assessment.id, organisation_id: org.id, status: assessment.status },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create assessment error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  } finally {
    client.release();
  }
});

// GET /api/assessments/:id — Get assessment details
router.get('/:id', authenticateJWT, requireRole('coordinator', 'consultant'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, o.name as org_name, o.sector, o.size_band, o.region,
              u.name as coordinator_name, u.email as coordinator_email, u.job_title as coordinator_job_title
       FROM assessments a
       JOIN organisations o ON a.organisation_id = o.id
       JOIN users u ON a.coordinator_id = u.id
       WHERE a.id = $1 AND a.deleted_at IS NULL`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Assessment not found' } });
    }

    // Verify coordinator owns this assessment (unless consultant)
    const assessment = rows[0];
    if (req.user.role === 'coordinator' && assessment.coordinator_id !== req.user.userId) {
      return res.status(403).json({ success: false, error: { message: 'Insufficient permissions' } });
    }

    res.json({ success: true, data: assessment });
  } catch (err) {
    console.error('Get assessment error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

// PATCH /api/assessments/:id — Update assessment status or consultant fields
router.patch('/:id', authenticateJWT, requireRole('coordinator', 'consultant'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { status, executive_summary, domain_observations, cross_domain_analysis, report_file_path } = req.body;

    const { rows: [assessment] } = await client.query(
      `SELECT a.*, o.name as org_name FROM assessments a JOIN organisations o ON a.organisation_id = o.id WHERE a.id = $1 AND a.deleted_at IS NULL`,
      [req.params.id]
    );

    if (!assessment) {
      return res.status(404).json({ success: false, error: { message: 'Assessment not found' } });
    }

    // Status transition validation
    if (status) {
      const validTransitions = STATUS_TRANSITIONS[assessment.status] || [];
      if (!validTransitions.includes(status)) {
        return res.status(400).json({
          success: false,
          error: { message: `Cannot transition from ${assessment.status} to ${status}` },
        });
      }

      await client.query('BEGIN');
      const updates = ['status = $1', 'updated_at = NOW()'];
      const params = [status];
      let paramIdx = 2;

      if (status === 'COMPLETE') {
        updates.push(`completed_at = NOW()`);
      }

      await client.query(
        `UPDATE assessments SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
        [...params, req.params.id]
      );

      // Send notifications based on status
      if (status === 'UNDER_REVIEW') {
        const { rows: [coordinator] } = await client.query('SELECT * FROM users WHERE id = $1', [assessment.coordinator_id]);
        await emailService.sendAssessmentCompleteNotification(assessment.id, coordinator, assessment.org_name);
        await emailService.sendConsultantNotification(assessment.id, assessment.org_name);
        // Lock all domain assignments
        await client.query(
          `UPDATE domain_assignments SET status = 'LOCKED', updated_at = NOW() WHERE assessment_id = $1`,
          [assessment.id]
        );
      }

      if (status === 'REPORT_READY') {
        const { rows: [coordinator] } = await client.query('SELECT * FROM users WHERE id = $1', [assessment.coordinator_id]);
        await emailService.sendReportReadyNotification(assessment.id, coordinator, assessment.org_name);
      }

      await client.query('COMMIT');
    }

    // Consultant narrative fields
    if (executive_summary !== undefined || domain_observations !== undefined || cross_domain_analysis !== undefined || report_file_path !== undefined) {
      const setClauses = [];
      const params = [];
      let idx = 1;

      if (executive_summary !== undefined) { setClauses.push(`executive_summary = $${idx++}`); params.push(executive_summary); }
      if (domain_observations !== undefined) { setClauses.push(`domain_observations = $${idx++}`); params.push(JSON.stringify(domain_observations)); }
      if (cross_domain_analysis !== undefined) { setClauses.push(`cross_domain_analysis = $${idx++}`); params.push(cross_domain_analysis); }
      if (report_file_path !== undefined) { setClauses.push(`report_file_path = $${idx++}`); params.push(report_file_path); }

      setClauses.push('updated_at = NOW()');
      params.push(req.params.id);

      await pool.query(`UPDATE assessments SET ${setClauses.join(', ')} WHERE id = $${idx}`, params);
    }

    const { rows: [updated] } = await pool.query('SELECT * FROM assessments WHERE id = $1', [req.params.id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Update assessment error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  } finally {
    client.release();
  }
});

// POST /api/assessments/:id/domain-assignments — Assign respondents to domains
router.post('/:id/domain-assignments', authenticateJWT, requireRole('coordinator'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { assignments } = req.body; // Array of { domain_id, respondent_name, respondent_email, secondary_name?, secondary_email? }

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'Assignments array is required' } });
    }

    const { rows: [assessment] } = await client.query(
      `SELECT a.*, o.name as org_name FROM assessments a JOIN organisations o ON a.organisation_id = o.id WHERE a.id = $1 AND a.coordinator_id = $2`,
      [req.params.id, req.user.userId]
    );

    if (!assessment) {
      return res.status(404).json({ success: false, error: { message: 'Assessment not found' } });
    }

    await client.query('BEGIN');

    // Clear existing assignments if assessment is DRAFT
    if (assessment.status === 'DRAFT') {
      await client.query('DELETE FROM domain_assignments WHERE assessment_id = $1', [assessment.id]);
    }

    const results = [];
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + TOKEN_EXPIRY_DAYS);

    for (const a of assignments) {
      if (!a.domain_id || !a.respondent_name || !a.respondent_email) continue;
      if (!DOMAINS[a.domain_id]) continue;

      const normalizedEmail = a.respondent_email.toLowerCase().trim();

      // Upsert user
      let respondentId;
      const { rows: existingUsers } = await client.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
      if (existingUsers.length > 0) {
        respondentId = existingUsers[0].id;
        await client.query('UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2', [a.respondent_name, respondentId]);
      } else {
        const { rows: [newUser] } = await client.query(
          `INSERT INTO users (name, email, role) VALUES ($1, $2, 'respondent') RETURNING id`,
          [a.respondent_name, normalizedEmail]
        );
        respondentId = newUser.id;
      }

      // Handle secondary respondent
      let secondaryId = null;
      if (a.secondary_name && a.secondary_email) {
        const secEmail = a.secondary_email.toLowerCase().trim();
        const { rows: existingSec } = await client.query('SELECT id FROM users WHERE email = $1', [secEmail]);
        if (existingSec.length > 0) {
          secondaryId = existingSec[0].id;
        } else {
          const { rows: [newSec] } = await client.query(
            `INSERT INTO users (name, email, role) VALUES ($1, $2, 'respondent') RETURNING id`,
            [a.secondary_name, secEmail]
          );
          secondaryId = newSec.id;
        }
      }

      // Create domain assignment
      const { rows: [da] } = await client.query(
        `INSERT INTO domain_assignments (assessment_id, domain_id, primary_respondent_id, secondary_respondent_id, status, token_expires_at, expected_completion_date)
         VALUES ($1, $2, $3, $4, 'UNASSIGNED', $5, $6)
         ON CONFLICT (assessment_id, domain_id) DO UPDATE SET
           primary_respondent_id = $3, secondary_respondent_id = $4, updated_at = NOW()
         RETURNING *`,
        [assessment.id, a.domain_id, respondentId, secondaryId, tokenExpiry, a.expected_completion_date || null]
      );

      results.push(da);
    }

    await client.query('COMMIT');

    res.status(201).json({ success: true, data: { assignments: results } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Domain assignment error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  } finally {
    client.release();
  }
});

// POST /api/assessments/:id/launch — Launch the assessment
router.post('/:id/launch', authenticateJWT, requireRole('coordinator'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows: [assessment] } = await client.query(
      `SELECT a.*, o.name as org_name FROM assessments a JOIN organisations o ON a.organisation_id = o.id WHERE a.id = $1 AND a.coordinator_id = $2`,
      [req.params.id, req.user.userId]
    );

    if (!assessment) {
      return res.status(404).json({ success: false, error: { message: 'Assessment not found' } });
    }

    if (assessment.status !== 'DRAFT') {
      return res.status(400).json({ success: false, error: { message: 'Assessment can only be launched from DRAFT status' } });
    }

    // Verify all 10 domains have assignments
    const { rows: das } = await client.query(
      `SELECT da.*, u.name as respondent_name, u.email as respondent_email, u.id as respondent_user_id
       FROM domain_assignments da JOIN users u ON da.primary_respondent_id = u.id
       WHERE da.assessment_id = $1`, [assessment.id]
    );

    if (das.length < 10) {
      return res.status(400).json({ success: false, error: { message: `Only ${das.length}/10 domains assigned. All 10 domains must have a primary respondent.` } });
    }

    await client.query('BEGIN');

    // Update assessment status to ACTIVE
    await client.query(`UPDATE assessments SET status = 'ACTIVE', updated_at = NOW() WHERE id = $1`, [assessment.id]);

    // Update all assignments to INVITED
    await client.query(`UPDATE domain_assignments SET status = 'INVITED', updated_at = NOW() WHERE assessment_id = $1`, [assessment.id]);

    // Group assignments by respondent email (one person may have multiple domains)
    const byRespondent = new Map();
    for (const da of das) {
      const key = da.respondent_email;
      if (!byRespondent.has(key)) {
        byRespondent.set(key, {
          respondent: { id: da.respondent_user_id, name: da.respondent_name, email: da.respondent_email },
          domains: [],
          accessToken: da.access_token,
        });
      }
      const domain = DOMAINS[da.domain_id];
      byRespondent.get(key).domains.push(domain);
    }

    // Send invitation emails (one per respondent, listing all their domains)
    for (const [, entry] of byRespondent) {
      await emailService.sendInvitation(assessment.id, entry.respondent, entry.domains, entry.accessToken);
    }

    await client.query('COMMIT');

    res.json({ success: true, data: { status: 'ACTIVE', invitations_sent: byRespondent.size } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Launch error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  } finally {
    client.release();
  }
});

// GET /api/assessments/:id/progress — Get completion progress
router.get('/:id/progress', authenticateJWT, requireRole('coordinator', 'consultant'), async (req, res) => {
  try {
    const { rows: das } = await pool.query(
      `SELECT da.domain_id, da.status, da.updated_at,
              u.name as respondent_name, u.email as respondent_email,
              (SELECT COUNT(*) FROM questions q WHERE q.domain_id = da.domain_id) as total_questions,
              (SELECT COUNT(*) FROM responses r WHERE r.assessment_id = da.assessment_id AND r.domain_id = da.domain_id AND r.selected_option IS NOT NULL) as answered_questions,
              (SELECT MAX(r.answered_at) FROM responses r WHERE r.assessment_id = da.assessment_id AND r.domain_id = da.domain_id) as last_activity
       FROM domain_assignments da
       JOIN users u ON da.primary_respondent_id = u.id
       WHERE da.assessment_id = $1
       ORDER BY da.domain_id`,
      [req.params.id]
    );

    const totalAnswered = das.reduce((sum, d) => sum + parseInt(d.answered_questions), 0);
    const totalQuestions = das.reduce((sum, d) => sum + parseInt(d.total_questions), 0);
    const domainsComplete = das.filter(d => parseInt(d.answered_questions) === parseInt(d.total_questions)).length;

    res.json({
      success: true,
      data: {
        overall: { totalAnswered, totalQuestions, percentage: totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0, domainsComplete },
        domains: das.map(d => ({
          domainId: d.domain_id,
          domainName: DOMAINS[d.domain_id]?.name || d.domain_id,
          status: d.status,
          respondentName: d.respondent_name,
          respondentEmail: d.respondent_email,
          answeredQuestions: parseInt(d.answered_questions),
          totalQuestions: parseInt(d.total_questions),
          lastActivity: d.last_activity,
        })),
      },
    });
  } catch (err) {
    console.error('Progress error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

// POST /api/assessments/:id/reminders — Send reminder to a respondent
router.post('/:id/reminders', authenticateJWT, requireRole('coordinator'), async (req, res) => {
  try {
    const { domain_assignment_id } = req.body;
    if (!domain_assignment_id) {
      return res.status(400).json({ success: false, error: { message: 'domain_assignment_id is required' } });
    }

    const { rows } = await pool.query(
      `SELECT da.*, u.name as respondent_name, u.email as respondent_email, u.id as respondent_user_id,
              (SELECT COUNT(*) FROM questions q WHERE q.domain_id = da.domain_id) -
              (SELECT COUNT(*) FROM responses r WHERE r.assessment_id = da.assessment_id AND r.domain_id = da.domain_id AND r.selected_option IS NOT NULL) as questions_remaining
       FROM domain_assignments da JOIN users u ON da.primary_respondent_id = u.id
       WHERE da.id = $1 AND da.assessment_id = $2`,
      [domain_assignment_id, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Domain assignment not found' } });
    }

    const da = rows[0];
    const respondent = { id: da.respondent_user_id, name: da.respondent_name, email: da.respondent_email };
    const domains = [DOMAINS[da.domain_id]];
    await emailService.sendReminder(req.params.id, respondent, domains, da.access_token, parseInt(da.questions_remaining));

    res.json({ success: true, data: { message: `Reminder sent to ${da.respondent_name}` } });
  } catch (err) {
    console.error('Reminder error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

// PATCH /api/assessments/:id/domain-assignments/:daId — Reopen a domain
router.patch('/:id/domain-assignments/:daId', authenticateJWT, requireRole('coordinator'), async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 'ACTIVE' && status !== 'IN_PROGRESS') {
      return res.status(400).json({ success: false, error: { message: 'Can only reopen to ACTIVE or IN_PROGRESS' } });
    }

    const { rows } = await pool.query(
      `UPDATE domain_assignments SET status = $1, updated_at = NOW()
       WHERE id = $2 AND assessment_id = $3 RETURNING *`,
      [status, req.params.daId, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Domain assignment not found' } });
    }

    // If assessment was UNDER_REVIEW, move back to IN_PROGRESS
    await pool.query(
      `UPDATE assessments SET status = 'IN_PROGRESS', updated_at = NOW()
       WHERE id = $1 AND status = 'UNDER_REVIEW'`,
      [req.params.id]
    );

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Reopen domain error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

// GET /api/assessments/:id/scores — Get all scores
router.get('/:id/scores', authenticateJWT, requireRole('coordinator', 'consultant'), async (req, res) => {
  try {
    // Recalculate all scores
    for (const domainId of DOMAIN_ORDER) {
      await calculateDomainScore(req.params.id, domainId);
    }
    const assessmentScore = await calculateAssessmentScore(req.params.id);

    const { rows: domainScores } = await pool.query(
      'SELECT * FROM domain_scores WHERE assessment_id = $1 ORDER BY domain_id',
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        overall: assessmentScore,
        domains: domainScores.map(ds => ({
          ...ds,
          domainName: DOMAINS[ds.domain_id]?.name || ds.domain_id,
        })),
      },
    });
  } catch (err) {
    console.error('Scores error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

// GET /api/assessments/:id/report/download — Download report PDF
router.get('/:id/report/download', authenticateJWT, requireRole('coordinator'), async (req, res) => {
  try {
    const { rows: [assessment] } = await pool.query(
      'SELECT * FROM assessments WHERE id = $1 AND coordinator_id = $2',
      [req.params.id, req.user.userId]
    );

    if (!assessment) {
      return res.status(404).json({ success: false, error: { message: 'Assessment not found' } });
    }

    if (!assessment.report_file_path) {
      return res.status(404).json({ success: false, error: { message: 'Report not yet available' } });
    }

    const filePath = path.resolve(assessment.report_file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: { message: 'Report file not found' } });
    }

    // Transition to COMPLETE if REPORT_READY
    if (assessment.status === 'REPORT_READY') {
      await pool.query(
        `UPDATE assessments SET status = 'COMPLETE', completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [assessment.id]
      );
    }

    res.download(filePath, 'GreenOps_Assessment_Report.pdf');
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

// POST /api/assessments/:id/report/upload — Upload report PDF (consultant)
router.post('/:id/report/upload', authenticateJWT, requireRole('consultant'), async (req, res) => {
  try {
    // Simple file upload handling — in Phase 1, store locally
    // In Phase 2, this would use S3
    const reportsDir = path.resolve(__dirname, '../../uploads/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // For Phase 1, expect base64-encoded PDF in body
    const { pdf_base64, filename } = req.body;
    if (!pdf_base64) {
      return res.status(400).json({ success: false, error: { message: 'pdf_base64 is required' } });
    }

    const safeName = `${req.params.id}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, safeName);
    fs.writeFileSync(filePath, Buffer.from(pdf_base64, 'base64'));

    await pool.query(
      `UPDATE assessments SET report_file_path = $1, updated_at = NOW() WHERE id = $2`,
      [filePath, req.params.id]
    );

    res.json({ success: true, data: { file_path: filePath } });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

// GET /api/assessments — List coordinator's assessments
router.get('/', authenticateJWT, requireRole('coordinator'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.status, a.deadline, a.created_at, o.name as org_name, o.sector
       FROM assessments a JOIN organisations o ON a.organisation_id = o.id
       WHERE a.coordinator_id = $1 AND a.deleted_at IS NULL
       ORDER BY a.created_at DESC`,
      [req.user.userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('List assessments error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

module.exports = router;
