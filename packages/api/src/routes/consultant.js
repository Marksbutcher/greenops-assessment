const express = require('express');
const pool = require('../db/pool');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { DOMAINS, DOMAIN_ORDER, getMaturityLevel } = require('../constants/domains');
const { calculateAssessmentScore } = require('../services/scoring');
const emailService = require('../services/email');

const router = express.Router();

// All consultant routes require JWT auth + consultant role
router.use(authenticateJWT);
router.use(requireRole('consultant'));

// GET /api/consultant/assessments — List all assessments (read-only)
router.get('/assessments', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.status, a.created_at, a.updated_at,
              o.name as organisation_name, o.sector, o.size_band,
              u.name as coordinator_name, u.email as coordinator_email,
              (SELECT COUNT(DISTINCT da.domain_id) FROM domain_assignments da WHERE da.assessment_id = a.id) as assigned_domains
       FROM assessments a
       JOIN organisations o ON a.organisation_id = o.id
       JOIN users u ON a.coordinator_id = u.id
       ORDER BY a.created_at DESC`
    );

    res.json({
      success: true,
      data: rows.map(r => ({
        id: r.id,
        status: r.status,
        organisationName: r.organisation_name,
        sector: r.sector,
        sizeBand: r.size_band,
        coordinatorName: r.coordinator_name,
        coordinatorEmail: r.coordinator_email,
        assignedDomains: parseInt(r.assigned_domains),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    });
  } catch (err) {
    console.error('Consultant list assessments error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

// GET /api/consultant/assessments/:id — Get assessment detail with scores
router.get('/assessments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { rows: [assessment] } = await pool.query(
      `SELECT a.*, o.name as organisation_name, o.sector, o.size_band, o.contact_name, o.contact_email,
              u.name as coordinator_name, u.email as coordinator_email
       FROM assessments a
       JOIN organisations o ON a.organisation_id = o.id
       JOIN users u ON a.coordinator_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (!assessment) {
      return res.status(404).json({ success: false, error: { message: 'Assessment not found' } });
    }

    // Get domain assignments with respondent info
    const { rows: assignments } = await pool.query(
      `SELECT da.id, da.domain_id, da.status,
              u.name as respondent_name, u.email as respondent_email
       FROM domain_assignments da
       JOIN users u ON da.primary_respondent_id = u.id
       WHERE da.assessment_id = $1
       ORDER BY da.domain_id`,
      [id]
    );

    // Get domain scores
    const { rows: domainScores } = await pool.query(
      `SELECT ds.domain_id, ds.raw_score, ds.max_possible, ds.percentage
       FROM domain_scores ds WHERE ds.assessment_id = $1`,
      [id]
    );

    // Get overall score
    const { rows: [overallScore] } = await pool.query(
      `SELECT total_raw, total_max, percentage, maturity_level
       FROM assessment_scores WHERE assessment_id = $1`,
      [id]
    );

    // Build domain details
    const domains = DOMAIN_ORDER.map(domainId => {
      const domain = DOMAINS[domainId];
      const assignment = assignments.find(a => a.domain_id === domainId);
      const score = domainScores.find(s => s.domain_id === domainId);

      return {
        domainId,
        domainName: domain.name,
        status: assignment?.status || 'UNASSIGNED',
        respondentName: assignment?.respondent_name || null,
        respondentEmail: assignment?.respondent_email || null,
        rawScore: score ? parseInt(score.raw_score) : 0,
        maxScore: score ? parseInt(score.max_possible) : domain.maxScore,
        percentage: score ? parseFloat(score.percentage) : 0,
        maturityLevel: score ? getMaturityLevel(parseFloat(score.percentage)) : null,
      };
    });

    res.json({
      success: true,
      data: {
        id: assessment.id,
        status: assessment.status,
        organisation: {
          name: assessment.organisation_name,
          sector: assessment.sector,
          sizeBand: assessment.size_band,
          contactName: assessment.contact_name,
          contactEmail: assessment.contact_email,
        },
        coordinator: {
          name: assessment.coordinator_name,
          email: assessment.coordinator_email,
        },
        domains,
        overallScore: overallScore ? {
          totalRaw: parseInt(overallScore.total_raw),
          totalMax: parseInt(overallScore.total_max),
          percentage: parseFloat(overallScore.percentage),
          maturityLevel: getMaturityLevel(parseFloat(overallScore.percentage)),
        } : null,
        createdAt: assessment.created_at,
        updatedAt: assessment.updated_at,
      },
    });
  } catch (err) {
    console.error('Consultant get assessment error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

// GET /api/consultant/assessments/:id/responses — Get all responses for an assessment
router.get('/assessments/:id/responses', async (req, res) => {
  try {
    const { id } = req.params;
    const { domain_id } = req.query;

    // Verify assessment exists
    const { rows: [assessment] } = await pool.query(
      'SELECT id FROM assessments WHERE id = $1', [id]
    );
    if (!assessment) {
      return res.status(404).json({ success: false, error: { message: 'Assessment not found' } });
    }

    let query = `
      SELECT r.question_id, r.domain_id, r.selected_option, r.score, r.answered_at,
             q.display_id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.option_e, q.max_score, q.display_order
      FROM responses r
      JOIN questions q ON r.question_id = q.id
      WHERE r.assessment_id = $1`;
    const params = [id];

    if (domain_id) {
      query += ' AND r.domain_id = $2';
      params.push(domain_id);
    }

    query += ' ORDER BY r.domain_id, q.display_order';

    const { rows } = await pool.query(query, params);

    // Group by domain
    const byDomain = {};
    for (const row of rows) {
      if (!byDomain[row.domain_id]) {
        const domain = DOMAINS[row.domain_id];
        byDomain[row.domain_id] = {
          domainId: row.domain_id,
          domainName: domain?.name || row.domain_id,
          responses: [],
        };
      }
      byDomain[row.domain_id].responses.push({
        questionId: row.question_id,
        displayId: row.display_id,
        questionText: row.question_text,
        optionA: row.option_a,
        optionB: row.option_b,
        optionC: row.option_c,
        optionD: row.option_d,
        optionE: row.option_e,
        maxScore: row.max_score,
        selectedOption: row.selected_option,
        score: row.score,
        answeredAt: row.answered_at,
      });
    }

    res.json({
      success: true,
      data: DOMAIN_ORDER.filter(d => byDomain[d]).map(d => byDomain[d]),
    });
  } catch (err) {
    console.error('Consultant get responses error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

// POST /api/consultant/assessments/:id/report/upload — Upload report PDF
router.post('/assessments/:id/report/upload', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { file_data, filename } = req.body;

    if (!file_data) {
      return res.status(400).json({ success: false, error: { message: 'file_data (base64) is required' } });
    }

    const { rows: [assessment] } = await client.query(
      `SELECT a.*, u.name as coord_name, u.email as coord_email
       FROM assessments a JOIN users u ON a.coordinator_id = u.id WHERE a.id = $1`,
      [id]
    );
    if (!assessment) {
      return res.status(404).json({ success: false, error: { message: 'Assessment not found' } });
    }

    if (assessment.status !== 'UNDER_REVIEW') {
      return res.status(400).json({ success: false, error: { message: 'Assessment must be in UNDER_REVIEW status to upload a report' } });
    }

    // Save file to local storage
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../../../uploads/reports');
    fs.mkdirSync(uploadsDir, { recursive: true });

    const safeFilename = filename || `report-${id}.pdf`;
    const filePath = path.join(uploadsDir, `${id}-${safeFilename}`);
    const buffer = Buffer.from(file_data, 'base64');
    fs.writeFileSync(filePath, buffer);

    await client.query('BEGIN');

    // Update assessment with report path and transition to REPORT_READY
    await client.query(
      `UPDATE assessments SET report_file_path = $1, status = 'REPORT_READY', updated_at = NOW() WHERE id = $2`,
      [filePath, id]
    );

    await client.query('COMMIT');

    // Notify coordinator
    const coordinator = { id: assessment.coordinator_id, name: assessment.coord_name, email: assessment.coord_email };
    await emailService.sendReportReadyNotification(id, coordinator);

    res.json({
      success: true,
      data: { message: 'Report uploaded successfully', status: 'REPORT_READY' },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Consultant upload report error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  } finally {
    client.release();
  }
});

module.exports = router;
