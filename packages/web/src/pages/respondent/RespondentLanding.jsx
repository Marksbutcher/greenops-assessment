import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

function statusBadgeClass(status) {
  const s = (status || '').toUpperCase();
  if (s === 'COMPLETE' || s === 'LOCKED') return 'status-badge status-badge--complete';
  if (s === 'ACTIVE' || s === 'IN_PROGRESS') return 'status-badge status-badge--in-progress';
  return 'status-badge status-badge--not-started';
}

function statusLabel(status) {
  const s = (status || '').toUpperCase();
  if (s === 'COMPLETE') return 'Complete';
  if (s === 'LOCKED') return 'Locked';
  if (s === 'ACTIVE' || s === 'IN_PROGRESS') return 'In Progress';
  if (s === 'INVITED') return 'Invited';
  return 'Not Started';
}

function accentClass(status, answeredQuestions) {
  const s = (status || '').toUpperCase();
  if (s === 'COMPLETE' || s === 'LOCKED') return 'card-accent card-accent--teal';
  return 'card-accent';
}

function buttonLabel(answeredQuestions) {
  return answeredQuestions > 0 ? 'Continue' : 'Start';
}

export default function RespondentLanding() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [respondent, setRespondent] = useState(null);
  const [assessmentId, setAssessmentId] = useState(null);
  const [organisationName, setOrganisationName] = useState('');
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDomains() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/respondent/domains', {
          headers: { 'x-access-token': token },
        });
        const data = res.data || res;
        setRespondent(data.respondent || {});
        setAssessmentId(data.assessmentId);
        setOrganisationName(data.organisationName || '');
        setDomains(data.domains || []);
      } catch (err) {
        setError(err.message || 'Invalid or expired access token');
      } finally {
        setLoading(false);
      }
    }
    loadDomains();
  }, [token]);

  const handleStartDomain = (domainId) => {
    navigate(`/respond/${token}/domain/${domainId}`);
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen bg-content-bg flex items-center justify-center">
        <p className="text-muted-text font-lato text-lg">Loading your assessment...</p>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="min-h-screen bg-content-bg flex items-center justify-center">
        <div className="bg-white rounded-lg border border-card-border p-10 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="font-georgia text-xl text-navy mb-2">Access Error</h2>
          <p className="text-muted-text font-lato">
            Invalid or expired access token. Please check the link in your invitation email or
            contact your coordinator.
          </p>
        </div>
      </div>
    );
  }

  // ── Main content ──
  return (
    <div className="min-h-screen bg-content-bg">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Welcome header */}
        <h1 className="font-georgia text-3xl text-navy mb-2">
          Welcome, {respondent?.name || respondent?.email || 'Respondent'}
        </h1>
        <p className="text-muted-text font-lato text-base mb-8">
          You have been invited to complete the GreenOps Organisational Assessment
          {organisationName ? ` for ${organisationName}` : ''}
        </p>

        {/* Section label */}
        <p className="section-label text-xs mb-4">Your Domains</p>

        {/* Domain cards */}
        <div className="grid gap-4 mb-10">
          {domains.map((domain) => {
            const s = (domain.status || '').toUpperCase();
            const isFinished = s === 'COMPLETE' || s === 'LOCKED';
            const percentage =
              domain.totalQuestions > 0
                ? Math.round((domain.answeredQuestions / domain.totalQuestions) * 100)
                : 0;

            return (
              <div
                key={domain.domainId}
                className={`${accentClass(domain.status, domain.answeredQuestions)} bg-white rounded-lg border border-card-border p-5`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h3 className="font-georgia font-bold text-navy text-lg mb-1">
                      {domain.domainName}
                    </h3>
                    {domain.description && (
                      <p className="text-muted-text font-lato text-sm mb-2">
                        {domain.description}
                      </p>
                    )}
                  </div>
                  <span className={statusBadgeClass(domain.status)}>
                    {statusLabel(domain.status)}
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm font-lato text-muted-text mb-1">
                    <span>
                      {domain.answeredQuestions} of {domain.totalQuestions} questions answered
                    </span>
                    {domain.estimatedMinutes != null && (
                      <span>~{domain.estimatedMinutes} minutes</span>
                    )}
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar__fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Action button */}
                {!isFinished && (
                  <button
                    onClick={() => handleStartDomain(domain.domainId)}
                    className="bg-teal text-white font-lato font-bold py-2 px-6 rounded hover:bg-teal-dark transition-colors text-sm"
                  >
                    {buttonLabel(domain.answeredQuestions)}
                  </button>
                )}

                {isFinished && (
                  <p className="text-teal-dark font-lato text-sm font-bold flex items-center gap-1">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Completed
                  </p>
                )}
              </div>
            );
          })}

          {domains.length === 0 && (
            <div className="bg-white rounded-lg border border-card-border p-8 text-center">
              <p className="text-muted-text font-lato">
                No domains have been assigned to you yet. Please check back later or contact your
                coordinator.
              </p>
            </div>
          )}
        </div>

        {/* Save & Exit info note */}
        <div className="bg-teal-light rounded-lg border border-teal p-4">
          <p className="text-body-text font-lato text-sm">
            <span className="font-bold">Save &amp; Exit:</span> Your progress is saved
            automatically. You can close this page and return at any time using the link in your
            invitation email.
          </p>
        </div>
      </div>
    </div>
  );
}
