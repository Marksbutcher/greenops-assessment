import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const DOMAINS = [
  {
    id: 'strategy',
    name: 'Strategy',
    description:
      'Examines how sustainability is reflected in corporate and IT strategy, including net-zero targets, roadmaps, budgets, and organisational alignment.',
  },
  {
    id: 'governance',
    name: 'Governance & Management',
    description:
      'Assesses governance structures, accountability, policies, risk management, and continuous improvement processes for IT sustainability.',
  },
  {
    id: 'financial',
    name: 'Financial & Service Management',
    description:
      'Evaluates IT cost allocation models, budgeting, forecasting, sustainability metrics integration, and cross-functional collaboration.',
  },
  {
    id: 'supply_chain',
    name: 'Supply Chain',
    description:
      'Reviews procurement practices, supplier sustainability engagement, lifecycle assessment, circularity criteria, and regulatory alignment.',
  },
  {
    id: 'data_centre',
    name: 'Data Centre',
    description:
      'Covers data centre sustainability strategy, energy monitoring, GHG emissions calculation, compliance, benchmarking, and team training.',
  },
  {
    id: 'core_infrastructure',
    name: 'Core Infrastructure',
    description:
      'Assesses hardware infrastructure sustainability practices including energy monitoring, efficiency benchmarking, scope 3 awareness, and lifecycle management.',
  },
  {
    id: 'ai_compute',
    name: 'AI & Advanced Compute',
    description:
      'Evaluates AI workload emissions measurement, model efficiency, hardware lifecycle management, workload placement, and governance alignment.',
  },
  {
    id: 'cloud_ops',
    name: 'Cloud Operations',
    description:
      'Reviews cloud sustainability practices including FinOps maturity, emissions tracking, provider benchmarking, and team capabilities.',
  },
  {
    id: 'software_dev',
    name: 'Software Development',
    description:
      'Covers sustainable software development practices including design principles, energy monitoring, scope 3 awareness, and code quality benchmarking.',
  },
  {
    id: 'end_user',
    name: 'End User Services',
    description:
      'Assesses end user device lifecycle management, refresh cycles, circular procurement, print services, energy tracking, and regulatory alignment.',
  },
];

function buildInitialState() {
  const state = {};
  DOMAINS.forEach((d) => {
    state[d.id] = { respondent_name: '', respondent_email: '' };
  });
  return state;
}

export default function DomainAssignment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState(buildInitialState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (domainId, field, value) => {
    setAssignments((prev) => ({
      ...prev,
      [domainId]: { ...prev[domainId], [field]: value },
    }));
  };

  const allComplete = DOMAINS.every((d) => {
    const a = assignments[d.id];
    return a.respondent_name.trim() !== '' && a.respondent_email.trim() !== '';
  });

  const handleSave = async () => {
    if (!allComplete) return;

    setSaving(true);
    setError(null);

    try {
      const payload = DOMAINS.map((d) => ({
        domain_id: d.id,
        respondent_name: assignments[d.id].respondent_name.trim(),
        respondent_email: assignments[d.id].respondent_email.trim(),
      }));

      await api.post(`/assessments/${id}/domain-assignments`, {
        assignments: payload,
      });

      navigate(`/assessment/${id}/review`);
    } catch (err) {
      setError(err.message || 'Failed to save assignments. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Step label */}
        <p className="section-label text-sm mb-4">STEP 2 OF 3</p>

        {/* Page title */}
        <h1 className="font-georgia text-3xl text-navy font-bold mb-2">
          Assign Respondents
        </h1>

        <p className="text-muted-text font-lato mb-8">
          Assign a primary respondent to each assessment domain. They will
          receive an email invitation to complete their section of the
          assessment.
        </p>

        {/* Helper note */}
        <div className="bg-orange-light border border-orange/30 rounded-lg px-4 py-3 mb-8">
          <p className="text-sm text-body-text font-lato">
            <span className="font-bold">Note:</span> One respondent can be
            assigned to multiple domains. Simply enter the same name and email
            where applicable.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Domain cards */}
        <div className="space-y-5">
          {DOMAINS.map((domain, index) => (
            <div
              key={domain.id}
              className="card-accent bg-white border border-card-border rounded-lg p-6 shadow-sm"
            >
              <h2 className="font-georgia text-lg text-navy font-bold mb-1">
                {index + 1}. {domain.name}
              </h2>
              <p className="text-sm text-muted-text font-lato mb-4">
                {domain.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor={`${domain.id}-name`}
                    className="block text-sm font-bold text-body-text font-lato mb-1"
                  >
                    Respondent Name
                  </label>
                  <input
                    id={`${domain.id}-name`}
                    type="text"
                    placeholder="e.g. Jane Smith"
                    value={assignments[domain.id].respondent_name}
                    onChange={(e) =>
                      handleChange(domain.id, 'respondent_name', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-card-border rounded-md text-sm font-lato text-body-text placeholder:text-muted-text/60 focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`${domain.id}-email`}
                    className="block text-sm font-bold text-body-text font-lato mb-1"
                  >
                    Respondent Email
                  </label>
                  <input
                    id={`${domain.id}-email`}
                    type="email"
                    placeholder="e.g. jane.smith@company.com"
                    value={assignments[domain.id].respondent_email}
                    onChange={(e) =>
                      handleChange(
                        domain.id,
                        'respondent_email',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-card-border rounded-md text-sm font-lato text-body-text placeholder:text-muted-text/60 focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-card-border">
          <button
            type="button"
            onClick={() => navigate('/assessment/new')}
            className="px-6 py-2.5 text-sm font-bold font-lato text-muted-text border border-card-border rounded-lg hover:bg-content-bg transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!allComplete || saving}
            className="px-6 py-2.5 text-sm font-bold font-lato text-white bg-teal rounded-lg hover:bg-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
