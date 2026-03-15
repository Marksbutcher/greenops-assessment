const express = require('express');
const pool = require('../db/pool');
const { authenticateRespondent, requireDomainAccess } = require('../middleware/auth');
const { DOMAINS } = require('../constants/domains');
const { OPTION_SCORES } = require('../constants/domains');
const { recalculateAfterResponse, isDomainComplete } = require('../services/scoring');
const emailService = require('../services/email');

const router = express.Router();

// All respondent routes require token auth
router.use(authenticateRespondent);

// GET /api/respondent/domains — Get assigned domains with progress
router.get('/domains', async (req, res) => {
  try {
    const { assignedDomains, assessmentId, userId } = req.respondent;

    const domains = [];
    for (const domainId of assignedDomains) {
      const domain = DOMAINS[domainId];
      if (!domain) continue;

      const { rows: [progress] } = await pool.query(
        `SELECT
           (SELECT COUNT(*) FROM questions WHERE domain_id = $1) as total_questions,
           (SELECT COUNT(*) FROM responses WHERE assessment_id = $2 AND domain_id = $1 AND selected_option IS NOT NULL) as answered_questions`,
        [domainId, assessmentId]
      );

      const assignment = req.respondent.assignments.find(a => a.domain_id === domainId);

      domains.push({
        domainId,
        domainName: domain.name,
        description: domain.description,
        totalQuestions: parseInt(progress.total_questions),
        answeredQuestions: parseInt(progress.answered_questions),
        status: assignment?.status || 'INVITED',
        estimatedMinutes: Math.ceil(parseInt(progress.total_questions) * 1.5),
      });
    }

    res.json({
      success: true,
      data: {
        respondent: { name: req.respondent.userName, email: req.respondent.userEmail },
        assessmentId,
        domains,
      },
    });
  } catch (err) {
    console.error('Get domains error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

// GET /api/respondent/domains/:domainId/questions — Get all questions for a domain
router.get('/domains/:domainId/questions', requireDomainAccess, async (req, res) => {
  try {
    const { domainId } = req.params;
    const { assessmentId } = req.respondent;

    const { rows: questions } = await pool.query(
      `SELECT q.*, r.selected_option, r.score
       FROM questions q
       LEFT JOIN responses r ON r.question_id = q.id AND r.assessment_id = $1
       WHERE q.domain_id = $2
       ORDER BY q.display_order`,
      [assessmentId, domainId]
    );

    const domain = DOMAINS[domainId];

    res.json({
      success: true,
      data: {
        domain: {
          id: domainId,
          name: domain?.name || domainId,
          description: domain?.description || '',
        },
        questions: questions.map(q => ({
          id: q.id,
          displayId: q.display_id,
          text: q.question_text,
          optionA: q.option_a,
          optionB: q.option_b,
          optionC: q.option_c,
          optionD: q.option_d,
          optionE: q.option_e,
          maxScore: q.max_score,
          displayOrder: q.display_order,
          selectedOption: q.selected_option || null,
          score: q.score || null,
        })),
      },
    });
  } catch (err) {
    console.error('Get questions error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

// POST /api/respondent/responses — Save a response
router.post('/responses', async (req, res) => {
  const client = await pool.connect();
  try {
    const { question_id, selected_option, domain_id } = req.body;
    const { assessmentId, userId } = req.respondent;

    if (!question_id || !selected_option || !domain_id) {
      return res.status(400).json({ success: false, error: { message: 'question_id, selected_option, and domain_id are required' } });
    }

    // Verify domain access
    if (!req.respondent.assignedDomains.includes(domain_id)) {
      return res.status(403).json({ success: false, error: { message: 'You do not have access to this domain' } });
    }

    // Verify domain is not locked
    const assignment = req.respondent.assignments.find(a => a.domain_id === domain_id);
    if (assignment && assignment.status === 'LOCKED') {
      return res.status(403).json({ success: false, error: { message: 'This domain is locked and cannot be edited' } });
    }

    // Validate option
    if (!['A', 'B', 'C', 'D', 'E'].includes(selected_option)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid option. Must be A, B, C, D, or E' } });
    }

    // Get question to calculate score
    const { rows: [question] } = await client.query(
      'SELECT * FROM questions WHERE id = $1 AND domain_id = $2',
      [question_id, domain_id]
    );

    if (!question) {
      return res.status(404).json({ success: false, error: { message: 'Question not found in this domain' } });
    }

    // Validate E option availability
    if (selected_option === 'E' && !question.option_e) {
      return res.status(400).json({ success: false, error: { message: 'Option E is not available for this question' } });
    }

    const score = OPTION_SCORES[selected_option] || 0;

    await client.query('BEGIN');

    // Upsert response
    await client.query(
      `INSERT INTO responses (assessment_id, domain_id, question_id, respondent_id, selected_option, score, answered_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (assessment_id, question_id)
       DO UPDATE SET selected_option = $5, score = $6, respondent_id = $4, answered_at = NOW(), updated_at = NOW()`,
      [assessmentId, domain_id, question_id, userId, selected_option, score]
    );

    // Update assignment status to ACTIVE if still INVITED
    await client.query(
      `UPDATE domain_assignments SET status = 'ACTIVE', updated_at = NOW()
       WHERE assessment_id = $1 AND domain_id = $2 AND status = 'INVITED'`,
      [assessmentId, domain_id]
    );

    // Auto-transition assessment from ACTIVE to IN_PROGRESS
    await client.query(
      `UPDATE assessments SET status = 'IN_PROGRESS', updated_at = NOW()
       WHERE id = $1 AND status = 'ACTIVE'`,
      [assessmentId]
    );

    // Recalculate scores
    const scores = await recalculateAfterResponse(assessmentId, domain_id, client);

    // If domain just completed, send notification
    if (scores.domainScore.isComplete) {
      const { rows: [assessment] } = await client.query(
        `SELECT a.*, u.id as coord_id, u.name as coord_name, u.email as coord_email
         FROM assessments a JOIN users u ON a.coordinator_id = u.id WHERE a.id = $1`,
        [assessmentId]
      );
      const coordinator = { id: assessment.coord_id, name: assessment.coord_name, email: assessment.coord_email };
      const domainName = DOMAINS[domain_id]?.name || domain_id;
      await emailService.sendDomainCompleteNotification(assessmentId, coordinator, domainName, req.respondent.userName);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        question_id,
        selected_option,
        score,
        domainScore: scores.domainScore,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Save response error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  } finally {
    client.release();
  }
});

// GET /api/respondent/responses/:domainId — Get all responses for a domain
router.get('/responses/:domainId', requireDomainAccess, async (req, res) => {
  try {
    const { domainId } = req.params;
    const { assessmentId } = req.respondent;

    const { rows } = await pool.query(
      `SELECT r.question_id, r.selected_option, r.score, r.answered_at
       FROM responses r WHERE r.assessment_id = $1 AND r.domain_id = $2
       ORDER BY (SELECT display_order FROM questions WHERE id = r.question_id)`,
      [assessmentId, domainId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Get responses error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

module.exports = router;
