import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import api from '../../services/api';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const DOMAIN_ORDER = [
  'strategy',
  'governance',
  'financial',
  'supply_chain',
  'data_centre',
  'core_infrastructure',
  'ai_compute',
  'cloud_ops',
  'software_dev',
  'end_user',
];

const MATURITY_LEVELS = [
  { level: 1, name: 'Initial', minPercent: 0, maxPercent: 20 },
  { level: 2, name: 'Emerging', minPercent: 21, maxPercent: 40 },
  { level: 3, name: 'Established', minPercent: 41, maxPercent: 60 },
  { level: 4, name: 'Optimised', minPercent: 61, maxPercent: 80 },
  { level: 5, name: 'Leading', minPercent: 81, maxPercent: 100 },
];

function getMaturityLevel(percentage) {
  if (percentage <= 20) return { level: 1, name: 'Initial' };
  if (percentage <= 40) return { level: 2, name: 'Emerging' };
  if (percentage <= 60) return { level: 3, name: 'Established' };
  if (percentage <= 80) return { level: 4, name: 'Optimised' };
  return { level: 5, name: 'Leading' };
}

function getMaturityBadgeClasses(level) {
  switch (level) {
    case 1:
      return 'bg-gray-200 text-gray-700';
    case 2:
      return 'bg-blue-100 text-blue-700';
    case 3:
      return 'bg-orange-light text-orange';
    case 4:
      return 'bg-teal-light text-teal-dark';
    case 5:
      return 'bg-navy text-white';
    default:
      return 'bg-gray-200 text-gray-700';
  }
}

export default function ReportDelivery() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  useEffect(() => {
    async function fetchScores() {
      try {
        setLoading(true);
        setError(null);
        const result = await api.get(`/assessments/${id}/scores`);
        setScores(result.data);
      } catch (err) {
        setError(err.message || 'Failed to load assessment scores.');
      } finally {
        setLoading(false);
      }
    }

    fetchScores();
  }, [id]);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);

    try {
      const response = await fetch(`/api/assessments/${id}/report/download`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('coordinator_token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message =
          errorData?.error?.message || 'Report is not yet available. Please check back later.';
        setDownloadError(message);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'GreenOps_Assessment_Report.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError('Failed to download report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Sort domains in canonical order
  const orderedDomains = scores
    ? DOMAIN_ORDER.map((domainId) =>
        scores.domains.find((d) => d.domain_id === domainId)
      ).filter(Boolean)
    : [];

  // Radar chart data
  const radarData = {
    labels: orderedDomains.map((d) => d.domainName),
    datasets: [
      {
        label: 'Domain Score (%)',
        data: orderedDomains.map((d) => d.percentage),
        backgroundColor: 'rgba(0, 169, 150, 0.2)',
        borderColor: '#00A996',
        borderWidth: 2,
        pointBackgroundColor: '#00A996',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 4,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          font: { family: 'Lato, Calibri, sans-serif', size: 11 },
          backdropColor: 'transparent',
        },
        pointLabels: {
          font: { family: 'Lato, Calibri, sans-serif', size: 12 },
          color: '#1C2B3A',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.08)',
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.08)',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.r}%`,
        },
      },
    },
  };

  // Overall maturity
  const overallMaturity = scores
    ? getMaturityLevel(scores.overall.percentage)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-content-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-text font-lato">Loading assessment scores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-content-bg flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700 font-lato mb-4">{error}</p>
            <button
              onClick={() => navigate(`/assessment/${id}/dashboard`)}
              className="px-5 py-2 text-sm font-medium text-white bg-teal rounded-md hover:bg-teal-dark transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-content-bg">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Page title */}
        <h1 className="font-georgia text-3xl text-navy font-bold mb-8">
          Assessment Report
        </h1>

        {/* Overall Score Section */}
        <div className="bg-white rounded-lg border border-card-border shadow-sm p-8 mb-8">
          <h2 className="font-georgia text-xl text-navy mb-6">Overall Score</h2>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            {/* Large percentage display */}
            <div className="text-center">
              <div className="text-6xl font-bold text-navy font-georgia">
                {Math.round(scores.overall.percentage)}%
              </div>
              <p className="text-muted-text font-lato text-sm mt-2">
                {scores.overall.totalRaw || scores.overall.total_raw} / {scores.overall.totalMax || scores.overall.total_max}
              </p>
            </div>

            {/* Maturity level badge */}
            <div className="flex flex-col items-center sm:items-start gap-3">
              <span className="text-sm text-muted-text font-lato uppercase tracking-wide">
                Maturity Level
              </span>
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold font-lato uppercase tracking-wider ${getMaturityBadgeClasses(overallMaturity.level)}`}
              >
                Level {overallMaturity.level} &mdash; {overallMaturity.name}
              </span>
              <p className="text-sm text-muted-text font-lato mt-1">
                {MATURITY_LEVELS.map(
                  (m) => `${m.name} (${m.minPercent}–${m.maxPercent}%)`
                ).join('  |  ')}
              </p>
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-lg border border-card-border shadow-sm p-8 mb-8">
          <h2 className="font-georgia text-xl text-navy mb-6">
            Domain Performance
          </h2>

          <div className="max-w-2xl mx-auto">
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>

        {/* Domain Scores Table */}
        <div className="bg-white rounded-lg border border-card-border shadow-sm overflow-hidden mb-8">
          <div className="px-8 py-6 border-b border-card-border">
            <h2 className="font-georgia text-xl text-navy">
              Domain Scores
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-content-bg border-b border-card-border">
                  <th className="text-left px-6 py-3 text-xs font-bold font-lato text-muted-text uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold font-lato text-muted-text uppercase tracking-wider">
                    Raw Score
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold font-lato text-muted-text uppercase tracking-wider">
                    Max Score
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold font-lato text-muted-text uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold font-lato text-muted-text uppercase tracking-wider">
                    Maturity Level
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderedDomains.map((domain) => {
                  const maturity = getMaturityLevel(domain.percentage);
                  return (
                    <tr
                      key={domain.domain_id}
                      className={`maturity-${maturity.level} border-b border-card-border last:border-b-0`}
                    >
                      <td className="px-6 py-4 text-sm font-bold font-lato">
                        {domain.domainName}
                      </td>
                      <td className="text-center px-4 py-4 text-sm font-lato">
                        {domain.raw_score}
                      </td>
                      <td className="text-center px-4 py-4 text-sm font-lato">
                        {domain.max_possible || domain.max_score}
                      </td>
                      <td className="text-center px-4 py-4 text-sm font-bold font-lato">
                        {domain.percentage}%
                      </td>
                      <td className="text-center px-4 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold font-lato ${getMaturityBadgeClasses(maturity.level)}`}
                        >
                          {maturity.name}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Download Section */}
        <div className="bg-white rounded-lg border border-card-border shadow-sm p-8 mb-8">
          <h2 className="font-georgia text-xl text-navy mb-4">
            Download Report
          </h2>
          <p className="text-muted-text font-lato text-sm mb-6">
            Download the full assessment report as a PDF document, including
            detailed analysis and recommendations from your consultant.
          </p>

          {downloadError && (
            <div className="bg-orange-light border border-orange/30 rounded-lg px-4 py-3 mb-4">
              <p className="text-sm text-body-text font-lato">{downloadError}</p>
            </div>
          )}

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-8 py-3 text-base font-bold font-lato text-white bg-teal rounded-lg hover:bg-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? 'Downloading...' : 'Download Report'}
          </button>
        </div>

        {/* Back to Dashboard */}
        <div className="pt-4">
          <Link
            to={`/assessment/${id}/dashboard`}
            className="text-teal hover:text-teal-dark font-lato text-sm font-medium transition-colors"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
