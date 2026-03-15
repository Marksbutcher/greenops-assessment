import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const SECTORS = [
  'Financial Services',
  'Government & Public Sector',
  'Healthcare',
  'Manufacturing',
  'Retail & Consumer',
  'Technology & Telecoms',
  'Energy & Utilities',
  'Transport & Logistics',
  'Education',
  'Other',
];

const SIZE_BANDS = [
  'Under 100',
  '100–500',
  '500–2,000',
  '2,000–10,000',
  'Over 10,000',
];

export default function AssessmentCreate() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    sector: '',
    size_band: '',
    region: '',
    deadline: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  function validate() {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Organisation name is required.';
    if (!form.sector) newErrors.sector = 'Please select a sector.';
    if (!form.size_band) newErrors.size_band = 'Please select a size band.';
    if (!form.region.trim()) newErrors.region = 'Region is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        organisation: {
          name: form.name.trim(),
          sector: form.sector,
          size_band: form.size_band,
          region: form.region.trim(),
        },
      };
      if (form.deadline) {
        payload.deadline = form.deadline;
      }

      const result = await api.post('/assessments', payload);
      const { assessment_id } = result.data;
      navigate(`/assessment/${assessment_id}/assign`);
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-content-bg py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <p className="section-label mb-2">Step 1 of 3</p>

        <h1 className="font-georgia text-3xl text-navy mb-8">
          Create New Assessment
        </h1>

        <div className="bg-white rounded-lg border border-card-border shadow-sm p-8">
          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Organisation Details */}
            <fieldset className="mb-8">
              <legend className="font-georgia text-xl text-navy mb-4">
                Organisation Details
              </legend>

              {/* Name */}
              <div className="mb-5">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-body-text mb-1"
                >
                  Organisation Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className={`w-full border rounded-md px-3 py-2 text-sm font-lato focus:outline-none focus:ring-2 focus:ring-teal ${
                    errors.name ? 'border-red-400' : 'border-card-border'
                  }`}
                  placeholder="e.g. Acme Corporation"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Sector */}
              <div className="mb-5">
                <label
                  htmlFor="sector"
                  className="block text-sm font-medium text-body-text mb-1"
                >
                  Sector <span className="text-red-500">*</span>
                </label>
                <select
                  id="sector"
                  name="sector"
                  value={form.sector}
                  onChange={handleChange}
                  className={`w-full border rounded-md px-3 py-2 text-sm font-lato focus:outline-none focus:ring-2 focus:ring-teal ${
                    errors.sector ? 'border-red-400' : 'border-card-border'
                  }`}
                >
                  <option value="">Select a sector...</option>
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.sector && (
                  <p className="mt-1 text-sm text-red-600">{errors.sector}</p>
                )}
              </div>

              {/* Size Band */}
              <div className="mb-5">
                <label
                  htmlFor="size_band"
                  className="block text-sm font-medium text-body-text mb-1"
                >
                  Size Band <span className="text-red-500">*</span>
                </label>
                <select
                  id="size_band"
                  name="size_band"
                  value={form.size_band}
                  onChange={handleChange}
                  className={`w-full border rounded-md px-3 py-2 text-sm font-lato focus:outline-none focus:ring-2 focus:ring-teal ${
                    errors.size_band ? 'border-red-400' : 'border-card-border'
                  }`}
                >
                  <option value="">Select a size band...</option>
                  {SIZE_BANDS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.size_band && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.size_band}
                  </p>
                )}
              </div>

              {/* Region */}
              <div className="mb-5">
                <label
                  htmlFor="region"
                  className="block text-sm font-medium text-body-text mb-1"
                >
                  Region <span className="text-red-500">*</span>
                </label>
                <input
                  id="region"
                  name="region"
                  type="text"
                  value={form.region}
                  onChange={handleChange}
                  className={`w-full border rounded-md px-3 py-2 text-sm font-lato focus:outline-none focus:ring-2 focus:ring-teal ${
                    errors.region ? 'border-red-400' : 'border-card-border'
                  }`}
                  placeholder="e.g. UK, North America, EMEA"
                />
                {errors.region && (
                  <p className="mt-1 text-sm text-red-600">{errors.region}</p>
                )}
              </div>
            </fieldset>

            {/* Deadline */}
            <fieldset className="mb-8">
              <legend className="font-georgia text-xl text-navy mb-4">
                Deadline
              </legend>

              <div>
                <label
                  htmlFor="deadline"
                  className="block text-sm font-medium text-body-text mb-1"
                >
                  Completion Deadline{' '}
                  <span className="text-muted-text">(optional)</span>
                </label>
                <input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={form.deadline}
                  onChange={handleChange}
                  className="w-full border border-card-border rounded-md px-3 py-2 text-sm font-lato focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>
            </fieldset>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-card-border">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-5 py-2 text-sm font-medium text-body-text border border-card-border rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 text-sm font-medium text-white bg-teal rounded-md hover:bg-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
