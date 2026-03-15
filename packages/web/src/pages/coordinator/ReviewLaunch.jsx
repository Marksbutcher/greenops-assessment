import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const DOMAINS = [
  { id: 'strategy', name: 'Strategy' },
  { id: 'governance', name: 'Governance & Management' },
  { id: 'financial', name: 'Financial & Service Management' },
  { id: 'supply_chain', name: 'Supply Chain' },
  { id: 'data_centre', name: 'Data Centre' },
  { id: 'core_infrastructure', name: 'Core Infrastructure' },
  { id: 'ai_compute', name: 'AI & Advanced Compute' },
  { id: 'cloud_ops', name: 'Cloud Operations' },
  { id: 'software_dev', name: 'Software Development' },
  { id: 'end_user', name: 'End User Services' },
];

export default function ReviewLaunch() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assessmentData, progressData] = await Promise.all([
          api.get(`/assessments/${id}`),
          api.get(`/assessments/${id}/progress`),
        ]);
        setAssessment(assessmentData.data || assessmentData);
        setProgress(progressData.data || progressData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const getAssignment = (domainId) => {
    if (!progress) return null;
    const domains = progress.domains || progress;
    if (Array.isArray(domains)) {
      return domains.find((d) => d.domain_id === domainId || d.domainId === domainId);
    }
    return null;
  };

  const unassignedCount = DOMAINS.filter((d) => {
    const assignment = getAssignment(d.id);
    return !assignment || !assignment.respondent_email;
  }).length;

  const handleLaunch = async () => {
    setLaunchError('');
    setLaunching(true);
    try {
      await api.post(`/assessments/${id}/launch`);
      navigate(`/assessment/${id}/dashboard`);
    } catch (err) {
      setLaunchError(err.message);
      setShowConfirm(false);
    } finally {
      setLaunching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-content-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-text font-lato">Loading assessment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-content-bg flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-card-border p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">!</div>
          <h2 className="text-xl font-georgia font-bold text-navy mb-2">Failed to Load Assessment</h2>
          <p className="text-muted-text font-lato mb-6">{error}</p>
          <button
            onClick={() => navigate(`/assessment/${id}/assign`)}
            className="text-teal hover:text-teal-dark font-lato font-medium"
          >
            Go Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  const org = assessment?.organisation || assessment?.organization || assessment || {};

  return (
    <div className="min-h-screen bg-content-bg">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Step label */}
        <p className="section-label text-sm mb-3">STEP 3 OF 3</p>

        {/* Page title */}
        <h1 className="text-3xl font-georgia font-bold text-navy mb-8">Review &amp; Launch</h1>

        {/* Organisation summary card */}
        <div className="bg-white rounded-lg shadow-sm border border-card-border p-6 mb-8">
          <h2 className="text-lg font-georgia font-bold text-navy mb-4">Organisation Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-lato font-bold text-muted-text uppercase tracking-wide mb-1">Name</p>
              <p className="text-body-text font-lato font-medium">
                {org.name || assessment?.name || '-'}
              </p>
            </div>
            <div>
              <p className="text-xs font-lato font-bold text-muted-text uppercase tracking-wide mb-1">Sector</p>
              <p className="text-body-text font-lato font-medium">
                {org.sector || assessment?.sector || '-'}
              </p>
            </div>
            <div>
              <p className="text-xs font-lato font-bold text-muted-text uppercase tracking-wide mb-1">Size Band</p>
              <p className="text-body-text font-lato font-medium">
                {org.size_band || org.sizeBand || assessment?.size_band || '-'}
              </p>
            </div>
            <div>
              <p className="text-xs font-lato font-bold text-muted-text uppercase tracking-wide mb-1">Region</p>
              <p className="text-body-text font-lato font-medium">
                {org.region || assessment?.region || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Unassigned warning */}
        {unassignedCount > 0 && (
          <div className="bg-orange-light border border-orange rounded-lg px-5 py-4 mb-6 flex items-start gap-3">
            <span className="text-orange text-xl leading-none mt-0.5">&#9888;</span>
            <div>
              <p className="text-body-text font-lato font-bold text-sm">
                {unassignedCount} domain{unassignedCount !== 1 ? 's' : ''} not assigned
              </p>
              <p className="text-muted-text font-lato text-sm mt-1">
                All 10 domains must have a respondent assigned before the assessment can be launched.
              </p>
            </div>
          </div>
        )}

        {/* Domain assignments table */}
        <div className="bg-white rounded-lg shadow-sm border border-card-border mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-card-border">
            <h2 className="text-lg font-georgia font-bold text-navy">Domain Assignments</h2>
          </div>

          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-content-bg border-b border-card-border">
            <div className="col-span-4">
              <p className="text-xs font-lato font-bold text-muted-text uppercase tracking-wide">Domain</p>
            </div>
            <div className="col-span-3">
              <p className="text-xs font-lato font-bold text-muted-text uppercase tracking-wide">Respondent</p>
            </div>
            <div className="col-span-3">
              <p className="text-xs font-lato font-bold text-muted-text uppercase tracking-wide">Email</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-lato font-bold text-muted-text uppercase tracking-wide">Status</p>
            </div>
          </div>

          {/* Domain rows */}
          {DOMAINS.map((domain, index) => {
            const assignment = getAssignment(domain.id);
            const isAssigned = assignment && assignment.respondent_email;

            return (
              <div
                key={domain.id}
                className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 ${
                  index < DOMAINS.length - 1 ? 'border-b border-card-border' : ''
                } ${!isAssigned ? 'bg-orange-light bg-opacity-30' : ''}`}
              >
                <div className="col-span-1 md:col-span-4">
                  <p className="text-xs font-bold text-muted-text uppercase tracking-wide md:hidden mb-1">Domain</p>
                  <p className="text-body-text font-lato font-medium">{domain.name}</p>
                </div>
                <div className="col-span-1 md:col-span-3">
                  <p className="text-xs font-bold text-muted-text uppercase tracking-wide md:hidden mb-1">Respondent</p>
                  <p className={`font-lato ${isAssigned ? 'text-body-text' : 'text-muted-text italic'}`}>
                    {isAssigned ? (assignment.respondent_name || assignment.respondentName || '-') : 'Not Assigned'}
                  </p>
                </div>
                <div className="col-span-1 md:col-span-3">
                  <p className="text-xs font-bold text-muted-text uppercase tracking-wide md:hidden mb-1">Email</p>
                  <p className={`font-lato text-sm ${isAssigned ? 'text-body-text' : 'text-muted-text italic'}`}>
                    {isAssigned ? assignment.respondent_email : '-'}
                  </p>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <p className="text-xs font-bold text-muted-text uppercase tracking-wide md:hidden mb-1">Status</p>
                  {isAssigned ? (
                    <span className="status-badge status-badge--complete">Assigned</span>
                  ) : (
                    <span className="status-badge status-badge--not-started">Not Assigned</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Launch error */}
        {launchError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-lg mb-6 text-sm font-lato">
            <p className="font-bold mb-1">Launch failed</p>
            <p>{launchError}</p>
          </div>
        )}

        {/* Confirmation dialog */}
        {showConfirm && (
          <div className="bg-teal-light border border-teal rounded-lg px-6 py-5 mb-6">
            <h3 className="text-body-text font-georgia font-bold mb-2">Confirm Launch</h3>
            <p className="text-body-text font-lato text-sm mb-4">
              Launching this assessment will send invitation emails to all assigned respondents.
              Each respondent will receive a unique link to complete their assigned domain questions.
              This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLaunch}
                disabled={launching}
                className="px-6 py-2 bg-teal text-white font-lato font-bold rounded-md hover:bg-teal-dark transition-colors disabled:opacity-50"
              >
                {launching ? 'Launching...' : 'Confirm & Send Invitations'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={launching}
                className="px-4 py-2 text-muted-text font-lato font-medium hover:text-body-text transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/assessment/${id}/assign`)}
            className="px-5 py-2.5 border border-card-border text-body-text font-lato font-medium rounded-md hover:bg-white transition-colors"
          >
            Back
          </button>

          {!showConfirm && (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={unassignedCount > 0}
              className="px-8 py-3 bg-teal text-white text-lg font-lato font-bold rounded-md hover:bg-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Launch Assessment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
