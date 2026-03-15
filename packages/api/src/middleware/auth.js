const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Middleware: authenticate coordinator/consultant via JWT
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'AUTH_REQUIRED' },
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired token', code: 'INVALID_TOKEN' },
    });
  }
}

// Middleware: require specific role(s)
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions', code: 'FORBIDDEN' },
      });
    }
    next();
  };
}

// Middleware: authenticate respondent via access token (query param or header)
async function authenticateRespondent(req, res, next) {
  const token = req.query.token || req.headers['x-access-token'];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access token required', code: 'TOKEN_REQUIRED' },
    });
  }

  try {
    // Look up domain assignment by access token
    const { rows } = await pool.query(
      `SELECT da.*, a.status as assessment_status, a.id as assessment_id,
              u.id as user_id, u.name as user_name, u.email as user_email
       FROM domain_assignments da
       JOIN assessments a ON da.assessment_id = a.id
       JOIN users u ON da.primary_respondent_id = u.id
       WHERE da.access_token = $1`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid access token', code: 'INVALID_TOKEN' },
      });
    }

    const assignment = rows[0];

    // Check token expiry
    if (assignment.token_expires_at && new Date(assignment.token_expires_at) < new Date()) {
      return res.status(401).json({
        success: false,
        error: { message: 'Access token has expired. Contact your coordinator for a new invitation.', code: 'TOKEN_EXPIRED' },
      });
    }

    // Get all assignments for this respondent in this assessment
    const { rows: allAssignments } = await pool.query(
      `SELECT da.domain_id, da.status, da.id as assignment_id
       FROM domain_assignments da
       WHERE da.assessment_id = $1
         AND da.primary_respondent_id = $2`,
      [assignment.assessment_id, assignment.user_id]
    );

    req.respondent = {
      userId: assignment.user_id,
      userName: assignment.user_name,
      userEmail: assignment.user_email,
      assessmentId: assignment.assessment_id,
      assessmentStatus: assignment.assessment_status,
      assignedDomains: allAssignments.map(a => a.domain_id),
      assignments: allAssignments,
      currentToken: token,
    };

    next();
  } catch (err) {
    console.error('Respondent auth error:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Authentication error', code: 'AUTH_ERROR' },
    });
  }
}

// Middleware: verify respondent has access to the requested domain
function requireDomainAccess(req, res, next) {
  const domainId = req.params.domainId || req.body.domain_id;
  if (!domainId) {
    return next(); // No domain context required
  }

  if (!req.respondent.assignedDomains.includes(domainId)) {
    return res.status(403).json({
      success: false,
      error: { message: 'You do not have access to this domain', code: 'DOMAIN_FORBIDDEN' },
    });
  }
  next();
}

// Generate JWT for coordinator/consultant
function generateJWT(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '24h' }
  );
}

module.exports = {
  authenticateJWT,
  requireRole,
  authenticateRespondent,
  requireDomainAccess,
  generateJWT,
};
