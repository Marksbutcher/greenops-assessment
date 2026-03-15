import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

const POLL_INTERVAL = 30_000;

function statusBadgeClass(status) {
  const s = (status || '').toUpperCase();
  if (s === 'COMPLETE' || s === 'LOCKED') return 'status-badge status-badge--complete';
  if (s === 'ACTIVE' || s === 'IN_PROGRESS') return 'status-badge status-badge--in-progress';
  if (s === 'UNDER_REVIEW') return 'status-badge status-badge--under-review';
  if (s === 'REPORT_READY') return 'status-badge status-badge--report-ready';
  return 'status-badge status-badge--not-started';
}

function statusLabel(status) {
  const s = (status || '').toUpperCase();
  if (s === 'COMPLETE') return 'Complete';
  if (s === 'LOCKED') return 'Locked';
  if (s === 'ACTIVE' || s === 'IN_PROGRESS') return 'In Progress';
  if (s === 'UNDER_REVIEW') return 'Under Review';
  if (s === 'REPORT_READY') return 'Report Ready';
  if (s === 'INVITED') return 'Invited';
  return status || 'Not Started';
}

function formatTimestamp(ts) {
  if (!ts) return null;
  const date = new Date(ts);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CoordinatorDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(null);
  const [reminderSent, setReminderSent] = useState({});

  const fetchProgress = useCallback(async () => {
    try {
      const res = await api.get(`/assessments/${id}/progress`);
      setProgress(res.data);
    } catch (err) {
      console.error('Failed to fetch progress:', err.message);
    }
  }, [id]);

  const fetchAssessment = useCallback(async () => {
    try {
      const res = await api.get(`/assessments/${id}`);
      setAssessment(res.data || res);
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([fetchAssessment(), fetchProgress()]);
      setLoading(false);
    }
    loadData();
  }, [fetchAssessment, fetchProgress]);

  // Polling every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchProgress();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchProgress]);

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    try {
      await api.patch(`/assessments/${id}`, { status: 'UNDER_REVIEW' });
      await fetchAssessment();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReminder = async (domain) => {
    // Find domain_assignment_id from assessment data if available
    const assignments = assessment?.domain_assignments || assessment?.domainAssignments || [];
    const assignment = assignments.find(
      (a) => a.domain_id === domain.domainId || a.domainId === domain.domainId
    );
    if (!assignment) return;

    const assignmentId = assignment.id || assignment.domain_assignment_id;
    setSendingReminder(domain.domainId);
    try {
      await api.post(`/assessments/${id}/reminders`, {
        domain_assignment_id: assignmentId,
      });
      setReminderSent((prev) => ({ ...prev, [domain.domainId]: true }));
    } catch (err) {
      console.error('Failed to send reminder:', err.message);
    } finally {
      setSendingReminder(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-content-bg flex items-center justify-center">
        <p className="text-muted-text font-lato text-lg">Loading dashboard...</p>
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="min-h-screen bg-content-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-lato mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="text-teal hover:text-teal-dark underline font-lato"
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  const overall = progress?.overall || {
    totalAnswered: 0,
    totalQuestions: 0,
    percentage: 0,
    domainsComplete: 0,
  };
  const domains = progress?.domains || [];
  const assessmentStatus = (assessment?.status || '').toUpperCase();
  const allDomainsComplete = overall.domainsComplete >= 10;
  const canSubmitForReview =
    allDomainsComplete &&
    assessmentStatus !== 'UNDER_REVIEW' &&
    assessmentStatus !== 'REPORT_READY' &&
    assessmentStatus !== 'COMPLETE';
  const showReportLink =
    assessmentStatus === 'REPORT_READY' || assessmentStatus === 'COMPLETE';

  return (
    <div className="min-h-screen bg-content-bg">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Page Title */}
        <h1 className="font-georgia text-3xl text-navy mb-8">Assessment Dashboard</h1>

        {/* Top Summary Section */}
        <div className="bg-white rounded-lg border border-card-border p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h2 className="font-georgia text-xl text-navy mb-1">
                {assessment?.organisation_name || assessment?.organisationName || 'Assessment'}
              </h2>
              <p className="text-muted-text font-lato text-sm">
                {overall.domainsComplete} of 10 domains complete
              </p>
            </div>
            <span className={statusBadgeClass(assessmentStatus)}>
              {statusLabel(assessmentStatus)}
            </span>
          </div>

          {/* Overall Progress Bar */}
          <div className="progress-bar bg-gray-200 rounded-full h-4 w-full overflow-hidden">
            <div
              className="progress-bar__fill bg-orange h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(overall.percentage, 100)}%` }}
            />
          </div>
          <p className="text-sm text-muted-text font-lato mt-2">
            {overall.totalAnswered} of {overall.totalQuestions} questions answered ({Math.round(overall.percentage)}%)
          </p>

          {/* Report Link */}
          {showReportLink && (
            <div className="mt-4">
              <Link
                to={`/assessment/${id}/report`}
                className="inline-block bg-teal text-white font-lato font-bold py-2 px-6 rounded hover:bg-teal-dark transition-colors"
              >
                View Report
              </Link>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 font-lato text-sm">{error}</p>
          </div>
        )}

        {/* Submit for Review */}
        {canSubmitForReview && (
          <div className="bg-teal-light border border-teal rounded-lg p-6 mb-8 text-center">
            <p className="font-georgia text-lg text-navy mb-3">
              All domains are complete. Ready to submit for review.
            </p>
            <button
              onClick={handleSubmitForReview}
              disabled={submitting}
              className="bg-teal text-white font-lato font-bold py-3 px-8 rounded-lg hover:bg-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        )}

        {/* Domain Progress Cards */}
        <h2 className="font-georgia text-xl text-navy mb-4">Domain Progress</h2>
        <div className="grid gap-4">
          {domains.map((domain) => {
            const domainStatus = (domain.status || '').toUpperCase();
            const isComplete = domainStatus === 'COMPLETE' || domainStatus === 'LOCKED';
            const domainPercentage =
              domain.totalQuestions > 0
                ? Math.round((domain.answeredQuestions / domain.totalQuestions) * 100)
                : 0;
            const canSendReminder = !isComplete && domainStatus !== 'COMPLETE';
            const assignments = assessment?.domain_assignments || assessment?.domainAssignments || [];
            const hasAssignment = assignments.some(
              (a) => a.domain_id === domain.domainId || a.domainId === domain.domainId
            );

            return (
              <div
                key={domain.domainId}
                className={`card-accent ${isComplete ? 'card-accent--teal' : ''} bg-white rounded-lg border border-card-border p-5`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h3 className="font-lato font-bold text-navy text-base mb-1">
                      {domain.domainName}
                    </h3>
                    <p className="text-muted-text text-sm font-lato">
                      {domain.respondentName || 'Unassigned'}
                      {domain.respondentEmail && (
                        <span className="ml-1">({domain.respondentEmail})</span>
                      )}
                    </p>
                  </div>
                  <span className={statusBadgeClass(domain.status)}>
                    {statusLabel(domain.status)}
                  </span>
                </div>

                {/* Domain Progress Bar */}
                <div className="progress-bar bg-gray-200 rounded-full h-2.5 w-full overflow-hidden mb-2">
                  <div
                    className="progress-bar__fill bg-orange h-full rounded-full transition-all duration-500"
                    style={{ width: `${domainPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-text font-lato">
                    {domain.answeredQuestions} / {domain.totalQuestions} questions
                  </p>

                  {domain.lastActivity && (
                    <p className="text-xs text-muted-text font-lato">
                      Last activity: {formatTimestamp(domain.lastActivity)}
                    </p>
                  )}
                </div>

                {/* Send Reminder Button */}
                {canSendReminder && hasAssignment && (
                  <div className="mt-3">
                    <button
                      onClick={() => handleSendReminder(domain)}
                      disabled={sendingReminder === domain.domainId || reminderSent[domain.domainId]}
                      className="border border-teal text-teal font-lato text-sm py-1.5 px-4 rounded hover:bg-teal-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {reminderSent[domain.domainId]
                        ? 'Reminder Sent'
                        : sendingReminder === domain.domainId
                          ? 'Sending...'
                          : 'Send Reminder'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {domains.length === 0 && (
            <div className="bg-white rounded-lg border border-card-border p-8 text-center">
              <p className="text-muted-text font-lato">No domain progress data available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
