import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const DOMAIN_NAMES = {
  strategy: 'Strategy',
  governance: 'Governance & Management',
  financial: 'Financial & Service Management',
  supply_chain: 'Supply Chain',
  data_centre: 'Data Centre',
  core_infrastructure: 'Core Infrastructure',
  ai_compute: 'AI & Advanced Compute',
  cloud_ops: 'Cloud Operations',
  software_dev: 'Software Development',
  end_user: 'End User Services',
};

function getMaturityLevel(pct) {
  if (pct <= 20) return { name: 'Initial', css: 'maturity-1' };
  if (pct <= 40) return { name: 'Emerging', css: 'maturity-2' };
  if (pct <= 60) return { name: 'Established', css: 'maturity-3' };
  if (pct <= 80) return { name: 'Optimised', css: 'maturity-4' };
  return { name: 'Leading', css: 'maturity-5' };
}

function statusBadgeClass(status) {
  switch (status) {
    case 'DRAFT': return 'status-badge status-badge--not-started';
    case 'ACTIVE':
    case 'IN_PROGRESS': return 'status-badge status-badge--in-progress';
    case 'UNDER_REVIEW': return 'status-badge status-badge--under-review';
    case 'REPORT_READY': return 'status-badge status-badge--report-ready';
    case 'COMPLETE': return 'status-badge status-badge--complete';
    default: return 'status-badge status-badge--not-started';
  }
}

export default function ConsultantView() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [responses, setResponses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const token = localStorage.getItem('coordinator_token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadAssessments();
  }, []);

  async function loadAssessments() {
    try {
      const res = await api.get('/consultant/assessments');
      setAssessments(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function selectAssessment(id) {
    setSelected(id);
    setDetailLoading(true);
    setActiveTab('overview');
    try {
      const [detailRes, responsesRes] = await Promise.all([
        api.get(`/consultant/assessments/${id}`),
        api.get(`/consultant/assessments/${id}/responses`),
      ]);
      setDetail(detailRes.data);
      setResponses(responsesRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('coordinator_token');
    localStorage.removeItem('coordinator_user');
    navigate('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-content-bg flex items-center justify-center">
        <p className="text-muted-text">Loading assessments...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-content-bg">
      {/* Header */}
      <div className="bg-navy text-white px-6 py-4 flex items-center justify-between">
        <h1 className="font-georgia text-xl">GreenOps Assessment — Consultant View</h1>
        <button onClick={handleLogout} className="text-sm text-orange hover:text-orange-light">
          Sign Out
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6">
        {/* Sidebar — Assessment list */}
        <div className="w-80 flex-shrink-0">
          <h2 className="font-georgia text-lg text-navy mb-4">Assessments</h2>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <div className="space-y-2">
            {assessments.map((a) => (
              <button
                key={a.id}
                onClick={() => selectAssessment(a.id)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selected === a.id
                    ? 'bg-teal-light border-teal'
                    : 'bg-white border-card-border hover:border-teal'
                }`}
              >
                <div className="font-bold text-navy text-sm">{a.organisationName}</div>
                <div className="text-xs text-muted-text mt-1">{a.sector}</div>
                <div className="mt-2">
                  <span className={statusBadgeClass(a.status)}>{(a.status || '').replace('_', ' ')}</span>
                </div>
              </button>
            ))}
            {assessments.length === 0 && (
              <p className="text-muted-text text-sm">No assessments found.</p>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {!selected && (
            <div className="bg-white rounded-lg border border-card-border p-12 text-center">
              <p className="text-muted-text">Select an assessment from the left to view details.</p>
            </div>
          )}

          {selected && detailLoading && (
            <div className="bg-white rounded-lg border border-card-border p-12 text-center">
              <p className="text-muted-text">Loading assessment details...</p>
            </div>
          )}

          {selected && !detailLoading && detail && (
            <div>
              {/* Assessment header */}
              <div className="bg-white rounded-lg border border-card-border p-6 mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-georgia text-2xl text-navy">{detail.organisation.name}</h2>
                    <p className="text-muted-text mt-1">
                      {detail.organisation.sector} · {detail.organisation.sizeBand}
                    </p>
                    <p className="text-muted-text text-sm mt-1">
                      Coordinator: {detail.coordinator.name} ({detail.coordinator.email})
                    </p>
                  </div>
                  <span className={statusBadgeClass(detail.status)}>{(detail.status || '').replace('_', ' ')}</span>
                </div>

                {detail.overallScore && (
                  <div className="mt-4 pt-4 border-t border-card-border flex items-center gap-6">
                    <div>
                      <span className="text-3xl font-bold text-teal">
                        {Math.round(detail.overallScore.percentage)}%
                      </span>
                      <span className="text-muted-text ml-2 text-sm">
                        ({detail.overallScore.totalRaw} / {detail.overallScore.totalMax})
                      </span>
                    </div>
                    <div className={`px-3 py-1 rounded text-sm font-bold ${getMaturityLevel(detail.overallScore.percentage).css}`}>
                      {getMaturityLevel(detail.overallScore.percentage).name}
                    </div>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-4">
                {['overview', 'responses'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-t-lg text-sm font-bold capitalize transition-colors ${
                      activeTab === tab
                        ? 'bg-white text-navy border border-b-0 border-card-border'
                        : 'text-muted-text hover:text-navy'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Overview tab */}
              {activeTab === 'overview' && (
                <div className="bg-white rounded-lg border border-card-border p-6">
                  <h3 className="font-georgia text-lg text-navy mb-4">Domain Scores</h3>
                  <div className="space-y-3">
                    {detail.domains.map((d) => (
                      <div key={d.domainId} className={`p-4 rounded-lg border border-card-border ${d.maturityLevel ? getMaturityLevel(d.percentage).css : ''}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-navy">{d.domainName}</span>
                            <span className="text-muted-text text-sm ml-2">
                              {d.respondentName || 'Unassigned'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-text">{d.rawScore}/{d.maxScore}</span>
                            <span className="font-bold text-navy">{Math.round(d.percentage)}%</span>
                            {d.maturityLevel && (
                              <span className="text-xs font-bold text-muted-text">{d.maturityLevel.name}</span>
                            )}
                          </div>
                        </div>
                        <div className="progress-bar mt-2">
                          <div className="progress-bar__fill" style={{ width: `${d.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Responses tab */}
              {activeTab === 'responses' && responses && (
                <div className="bg-white rounded-lg border border-card-border p-6">
                  <h3 className="font-georgia text-lg text-navy mb-4">All Responses</h3>
                  {responses.length === 0 && (
                    <p className="text-muted-text">No responses recorded yet.</p>
                  )}
                  {responses.map((domain) => (
                    <div key={domain.domainId} className="mb-6 last:mb-0">
                      <h4 className="font-bold text-navy mb-3 pb-2 border-b border-card-border">
                        {domain.domainName}
                      </h4>
                      <div className="space-y-2">
                        {domain.responses.map((r) => (
                          <div key={r.questionId} className="flex items-start gap-3 py-2 text-sm">
                            <span className="text-muted-text font-mono w-12 flex-shrink-0">{r.displayId}</span>
                            <span className="flex-1 text-body-text">{r.questionText}</span>
                            <span className="letter-chip text-xs w-8 h-8 min-w-[2rem]">{r.selectedOption}</span>
                            <span className="text-muted-text w-12 text-right">{r.score}/{r.maxScore}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
