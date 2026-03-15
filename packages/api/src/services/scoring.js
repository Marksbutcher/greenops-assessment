const pool = require('../db/pool');
const { OPTION_SCORES, getMaturityLevel } = require('../constants/domains');

/**
 * Scoring engine for the GreenOps Organisational Assessment.
 *
 * Key rules:
 * - Option scores: A=0, B=2, C=4, D=6, E=10
 * - If option_e is null for a question, D=6 is the maximum
 * - Domain score = SUM of question scores within that domain
 * - Overall score % = total_raw / total_max * 100 (NOT average of domain %)
 * - Domain is complete only when ALL questions have non-null selected_option
 */

// Map selected option letter to numeric score
function optionToScore(option, maxScore) {
  if (!option) return 0;
  const score = OPTION_SCORES[option];
  if (score === undefined) return 0;
  // If question max is 6 (no E option), cap at 6
  if (maxScore === 6 && score > 6) return 6;
  return score;
}

// Calculate domain score for a specific assessment + domain
async function calculateDomainScore(assessmentId, domainId, client) {
  const db = client || pool;

  // Get all questions for this domain with their max_score
  const { rows: questions } = await db.query(
    'SELECT id, max_score FROM questions WHERE domain_id = $1 ORDER BY display_order',
    [domainId]
  );

  // Get all responses for this assessment + domain
  const { rows: responses } = await db.query(
    'SELECT question_id, selected_option, score FROM responses WHERE assessment_id = $1 AND domain_id = $2',
    [assessmentId, domainId]
  );

  const responseMap = new Map(responses.map(r => [r.question_id, r]));

  let rawScore = 0;
  let maxPossible = 0;
  let answeredCount = 0;

  for (const question of questions) {
    maxPossible += question.max_score;
    const response = responseMap.get(question.id);
    if (response && response.selected_option) {
      rawScore += response.score;
      answeredCount++;
    }
  }

  const totalQuestions = questions.length;
  const isComplete = answeredCount === totalQuestions;
  const percentage = maxPossible > 0 ? parseFloat(((rawScore / maxPossible) * 100).toFixed(1)) : 0;
  const maturity = getMaturityLevel(percentage);

  // Upsert domain score
  await db.query(
    `INSERT INTO domain_scores (assessment_id, domain_id, raw_score, max_possible, percentage, maturity_level, calculated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (assessment_id, domain_id)
     DO UPDATE SET raw_score = $3, max_possible = $4, percentage = $5, maturity_level = $6, calculated_at = NOW()`,
    [assessmentId, domainId, rawScore, maxPossible, percentage, maturity.level]
  );

  return {
    domainId,
    rawScore,
    maxPossible,
    percentage,
    maturityLevel: maturity.level,
    maturityName: maturity.name,
    answeredCount,
    totalQuestions,
    isComplete,
  };
}

// Calculate overall assessment score from all domain scores
async function calculateAssessmentScore(assessmentId, client) {
  const db = client || pool;

  // Get all domain scores
  const { rows: domainScores } = await db.query(
    'SELECT domain_id, raw_score, max_possible FROM domain_scores WHERE assessment_id = $1',
    [assessmentId]
  );

  const totalRaw = domainScores.reduce((sum, ds) => sum + ds.raw_score, 0);
  const totalMax = domainScores.reduce((sum, ds) => sum + ds.max_possible, 0);
  const percentage = totalMax > 0 ? parseFloat(((totalRaw / totalMax) * 100).toFixed(1)) : 0;
  const maturity = getMaturityLevel(percentage);

  // Upsert assessment score
  await db.query(
    `INSERT INTO assessment_scores (assessment_id, total_raw, total_max, percentage, maturity_level, calculated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (assessment_id)
     DO UPDATE SET total_raw = $2, total_max = $3, percentage = $4, maturity_level = $5, calculated_at = NOW()`,
    [assessmentId, totalRaw, totalMax, percentage, maturity.level]
  );

  return {
    totalRaw,
    totalMax,
    percentage,
    maturityLevel: maturity.level,
    maturityName: maturity.name,
  };
}

// Check if a domain is complete (all questions answered)
async function isDomainComplete(assessmentId, domainId, client) {
  const db = client || pool;

  const { rows: [{ total }] } = await db.query(
    'SELECT COUNT(*) as total FROM questions WHERE domain_id = $1',
    [domainId]
  );

  const { rows: [{ answered }] } = await db.query(
    'SELECT COUNT(*) as answered FROM responses WHERE assessment_id = $1 AND domain_id = $2 AND selected_option IS NOT NULL',
    [assessmentId, domainId]
  );

  return parseInt(answered) === parseInt(total);
}

// Check if entire assessment is complete (all domains complete)
async function isAssessmentComplete(assessmentId, client) {
  const db = client || pool;

  const { rows } = await db.query(
    `SELECT da.domain_id,
       (SELECT COUNT(*) FROM questions q WHERE q.domain_id = da.domain_id) as total_questions,
       (SELECT COUNT(*) FROM responses r WHERE r.assessment_id = da.assessment_id AND r.domain_id = da.domain_id AND r.selected_option IS NOT NULL) as answered_questions
     FROM domain_assignments da
     WHERE da.assessment_id = $1`,
    [assessmentId]
  );

  return rows.every(r => parseInt(r.answered_questions) === parseInt(r.total_questions));
}

// Recalculate scores after a response is saved
async function recalculateAfterResponse(assessmentId, domainId, client) {
  const domainScore = await calculateDomainScore(assessmentId, domainId, client);
  const assessmentScore = await calculateAssessmentScore(assessmentId, client);

  // Check if domain is now complete and update assignment status
  if (domainScore.isComplete) {
    await (client || pool).query(
      `UPDATE domain_assignments SET status = 'COMPLETE', updated_at = NOW()
       WHERE assessment_id = $1 AND domain_id = $2 AND status != 'LOCKED'`,
      [assessmentId, domainId]
    );
  }

  return { domainScore, assessmentScore };
}

module.exports = {
  optionToScore,
  calculateDomainScore,
  calculateAssessmentScore,
  isDomainComplete,
  isAssessmentComplete,
  recalculateAfterResponse,
};
