const pool = require('../db/pool');

const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const isDev = process.env.NODE_ENV !== 'production';

// In production, use SendGrid. In dev, log to console.
let sendEmail;

if (!isDev && process.env.SENDGRID_API_KEY) {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  sendEmail = async (to, subject, html) => {
    const msg = {
      to,
      from: 'noreply@tbmcouncil.org',
      subject,
      html,
    };
    const [response] = await sgMail.send(msg);
    return response.headers['x-message-id'] || null;
  };
} else if (!isDev && process.env.SMTP_HOST) {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });
  sendEmail = async (to, subject, html) => {
    const info = await transporter.sendMail({
      from: 'noreply@tbmcouncil.org',
      to,
      subject,
      html,
    });
    return info.messageId;
  };
} else {
  // Development: log emails to console
  sendEmail = async (to, subject, html) => {
    console.log('\n========== EMAIL (DEV MODE) ==========');
    console.log(`TO:      ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY:    ${html.replace(/<[^>]*>/g, ' ').substring(0, 300)}...`);
    console.log('=======================================\n');
    return `dev-${Date.now()}`;
  };
}

// Log email to database
async function logEmail(assessmentId, recipientId, emailType, status, externalMessageId) {
  await pool.query(
    `INSERT INTO email_logs (assessment_id, recipient_id, email_type, status, external_message_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [assessmentId, recipientId, emailType, status, externalMessageId]
  );
}

// HTML email wrapper
function emailWrapper(content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Calibri, 'Lato', sans-serif; color: #1C2B3A; margin: 0; padding: 0; background: #F7F8FA; }
        .container { max-width: 600px; margin: 0 auto; padding: 24px; }
        .header { background: #0F1F2E; padding: 24px; text-align: center; }
        .header h1 { color: #F3A261; font-family: Georgia, serif; font-size: 20px; margin: 0; letter-spacing: 4px; text-transform: uppercase; }
        .header p { color: rgba(255,255,255,0.6); font-size: 12px; margin: 8px 0 0; }
        .content { background: #FFFFFF; padding: 32px; border-left: 6px solid #F3A261; }
        .btn { display: inline-block; background: #F3A261; color: #FFFFFF; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 16px; margin: 24px 0; }
        .footer { padding: 24px; text-align: center; color: #5A6A7A; font-size: 12px; }
        .teal { color: #00A996; }
        .muted { color: #5A6A7A; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>GreenOps Assessment</h1>
          <p>TBM Council</p>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>TBM Council | GreenOps Practice</p>
          <p>This is an automated message. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 1. Invitation email
async function sendInvitation(assessmentId, respondent, domains, accessToken) {
  const domainList = domains.map(d => `<li><strong>${d.name}</strong> (${d.questionCount} questions)</li>`).join('');
  const link = `${APP_URL}/respond/${accessToken}`;

  const html = emailWrapper(`
    <h2 style="font-family: Georgia, serif; color: #0F1F2E;">You've been invited to contribute</h2>
    <p>Hello ${respondent.name},</p>
    <p>You have been invited to participate in a <strong>GreenOps Organisational Assessment</strong>. Your expertise is needed for the following domain${domains.length > 1 ? 's' : ''}:</p>
    <ul>${domainList}</ul>
    <p class="muted">This assessment evaluates your organisation's digital sustainability maturity across key operational areas. Please answer based on your organisation's current practices — not aspirations.</p>
    <a href="${link}" class="btn">Begin Assessment</a>
    <p class="muted">Your progress is saved automatically. You can leave and return at any time using this link. This link expires in ${process.env.RESPONDENT_TOKEN_EXPIRY_DAYS || 30} days.</p>
  `);

  try {
    const messageId = await sendEmail(respondent.email, 'GreenOps Assessment — Your Contribution is Needed', html);
    await logEmail(assessmentId, respondent.id, 'invitation', 'sent', messageId);
    return true;
  } catch (err) {
    console.error('Failed to send invitation email:', err);
    await logEmail(assessmentId, respondent.id, 'invitation', 'failed', null);
    return false;
  }
}

// 2. Reminder email
async function sendReminder(assessmentId, respondent, domains, accessToken, questionsRemaining) {
  const link = `${APP_URL}/respond/${accessToken}`;

  const html = emailWrapper(`
    <h2 style="font-family: Georgia, serif; color: #0F1F2E;">Reminder: Your input is still needed</h2>
    <p>Hello ${respondent.name},</p>
    <p>This is a reminder that your contribution to the GreenOps Organisational Assessment is still outstanding.</p>
    <p>You have <strong>${questionsRemaining} question${questionsRemaining > 1 ? 's' : ''}</strong> remaining.</p>
    <a href="${link}" class="btn">Continue Assessment</a>
    <p class="muted">Your previous answers are saved. Pick up where you left off.</p>
  `);

  try {
    const messageId = await sendEmail(respondent.email, 'GreenOps Assessment — Reminder', html);
    await logEmail(assessmentId, respondent.id, 'reminder', 'sent', messageId);
    return true;
  } catch (err) {
    console.error('Failed to send reminder email:', err);
    await logEmail(assessmentId, respondent.id, 'reminder', 'failed', null);
    return false;
  }
}

// 3. Domain complete notification (to coordinator)
async function sendDomainCompleteNotification(assessmentId, coordinator, domainName, respondentName) {
  const link = `${APP_URL}/assessment/${assessmentId}/dashboard`;

  const html = emailWrapper(`
    <h2 style="font-family: Georgia, serif; color: #0F1F2E;">Domain Completed</h2>
    <p>Hello ${coordinator.name},</p>
    <p><strong>${respondentName}</strong> has completed all questions in the <span class="teal"><strong>${domainName}</strong></span> domain.</p>
    <a href="${link}" class="btn">View Dashboard</a>
  `);

  try {
    const messageId = await sendEmail(coordinator.email, `GreenOps Assessment — ${domainName} Complete`, html);
    await logEmail(assessmentId, coordinator.id, 'domain_complete', 'sent', messageId);
    return true;
  } catch (err) {
    console.error('Failed to send domain complete email:', err);
    await logEmail(assessmentId, coordinator.id, 'domain_complete', 'failed', null);
    return false;
  }
}

// 4. Assessment complete notification (to coordinator)
async function sendAssessmentCompleteNotification(assessmentId, coordinator, organisationName) {
  const link = `${APP_URL}/assessment/${assessmentId}/dashboard`;

  const html = emailWrapper(`
    <h2 style="font-family: Georgia, serif; color: #0F1F2E;">All Domains Complete</h2>
    <p>Hello ${coordinator.name},</p>
    <p>All 10 domains of the <strong>${organisationName}</strong> GreenOps Assessment have been completed by their assigned respondents.</p>
    <p>You can now review the responses and submit the assessment for consultant review.</p>
    <a href="${link}" class="btn">Review & Submit</a>
  `);

  try {
    const messageId = await sendEmail(coordinator.email, 'GreenOps Assessment — All Domains Complete', html);
    await logEmail(assessmentId, coordinator.id, 'assessment_complete', 'sent', messageId);
    return true;
  } catch (err) {
    console.error('Failed to send assessment complete email:', err);
    await logEmail(assessmentId, coordinator.id, 'assessment_complete', 'failed', null);
    return false;
  }
}

// 5. Consultant notification (assessment ready for review)
async function sendConsultantNotification(assessmentId, organisationName) {
  // Send to all consultant users
  const { rows: consultants } = await pool.query(
    "SELECT id, name, email FROM users WHERE role = 'consultant'"
  );

  for (const consultant of consultants) {
    const html = emailWrapper(`
      <h2 style="font-family: Georgia, serif; color: #0F1F2E;">New Assessment Ready for Review</h2>
      <p>Hello ${consultant.name},</p>
      <p>The GreenOps Organisational Assessment for <strong>${organisationName}</strong> has been submitted for review.</p>
      <p>Please log in to the consultant portal to review responses and approve the assessment.</p>
      <a href="${APP_URL}/consultant" class="btn">Review Assessment</a>
    `);

    try {
      const messageId = await sendEmail(consultant.email, `GreenOps Assessment — ${organisationName} Ready for Review`, html);
      await logEmail(assessmentId, consultant.id, 'consultant_notification', 'sent', messageId);
    } catch (err) {
      console.error('Failed to send consultant notification:', err);
      await logEmail(assessmentId, consultant.id, 'consultant_notification', 'failed', null);
    }
  }
}

// 6. Report ready notification (to coordinator)
async function sendReportReadyNotification(assessmentId, coordinator, organisationName) {
  const link = `${APP_URL}/assessment/${assessmentId}/report`;

  const html = emailWrapper(`
    <h2 style="font-family: Georgia, serif; color: #0F1F2E;">Your Report is Ready</h2>
    <p>Hello ${coordinator.name},</p>
    <p>The GreenOps Organisational Assessment report for <strong>${organisationName}</strong> is now ready for download.</p>
    <a href="${link}" class="btn">View & Download Report</a>
    <p class="muted">The report includes your overall maturity score, domain-by-domain analysis, and recommended next steps.</p>
  `);

  try {
    const messageId = await sendEmail(coordinator.email, `GreenOps Assessment Report Ready — ${organisationName}`, html);
    await logEmail(assessmentId, coordinator.id, 'report_ready', 'sent', messageId);
    return true;
  } catch (err) {
    console.error('Failed to send report ready email:', err);
    await logEmail(assessmentId, coordinator.id, 'report_ready', 'failed', null);
    return false;
  }
}

module.exports = {
  sendInvitation,
  sendReminder,
  sendDomainCompleteNotification,
  sendAssessmentCompleteNotification,
  sendConsultantNotification,
  sendReportReadyNotification,
};
