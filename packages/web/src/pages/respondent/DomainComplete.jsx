import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';

export default function DomainComplete() {
  const { token, domainId } = useParams();

  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDomains() {
      try {
        setLoading(true);
        const res = await api.get('/respondent/domains', {
          headers: { 'x-access-token': token },
        });
        setDomains(res.data.domains || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDomains();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-content-bg flex items-center justify-center">
        <p className="text-muted-text font-lato text-lg">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-content-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-lato mb-4">{error}</p>
          <Link
            to={`/respond/${token}`}
            className="text-teal hover:text-teal-dark underline font-lato"
          >
            Back to Domains
          </Link>
        </div>
      </div>
    );
  }

  const currentDomain = domains.find((d) => String(d.domainId) === String(domainId));
  const isComplete =
    currentDomain && currentDomain.answeredQuestions === currentDomain.totalQuestions;

  const incompleteDomains = domains.filter(
    (d) => d.answeredQuestions < d.totalQuestions && String(d.domainId) !== String(domainId)
  );
  const allDomainsComplete = incompleteDomains.length === 0;
  const nextDomain = incompleteDomains.length > 0 ? incompleteDomains[0] : null;

  return (
    <div className="min-h-screen bg-content-bg">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Success Checkmark */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-teal-light flex items-center justify-center">
            <svg
              className="w-14 h-14 text-teal"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className="font-georgia text-3xl text-navy text-center mb-2">Domain Complete!</h1>

        {/* Domain Name */}
        {currentDomain && (
          <p className="text-center text-teal font-lato font-bold text-lg mb-6">
            {currentDomain.domainName}
          </p>
        )}

        {/* Score Summary */}
        {currentDomain && (
          <div className="bg-white rounded-lg border border-card-border p-6 mb-8 text-center">
            <p className="text-body-text font-lato text-base">
              <span className="font-georgia text-2xl text-teal">
                {currentDomain.answeredQuestions}
              </span>{' '}
              <span className="text-muted-text">of</span>{' '}
              <span className="font-georgia text-2xl text-navy">
                {currentDomain.totalQuestions}
              </span>{' '}
              <span className="text-muted-text">questions answered</span>
            </p>
            {isComplete && (
              <span className="status-badge--complete inline-block mt-3 bg-teal-light text-teal text-xs font-lato font-bold uppercase tracking-wide px-3 py-1 rounded-full">
                Complete
              </span>
            )}
          </div>
        )}

        {/* All Domains Complete */}
        {allDomainsComplete && (
          <div className="bg-white rounded-lg border border-card-border p-8 mb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-orange-light flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-orange"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>
            <h2 className="font-georgia text-2xl text-navy mb-3">All Domains Complete!</h2>
            <p className="text-body-text font-lato text-base leading-relaxed mb-6">
              Thank you for completing the assessment. Your coordinator has been notified.
            </p>
            <Link
              to={`/respond/${token}`}
              className="inline-block bg-teal text-white font-lato font-bold py-3 px-8 rounded-lg hover:bg-teal-dark transition-colors text-lg"
            >
              Return to Dashboard
            </Link>
          </div>
        )}

        {/* Next Domain / Remaining Domains */}
        {!allDomainsComplete && (
          <>
            {/* Continue Button */}
            {nextDomain && (
              <div className="text-center mb-8">
                <Link
                  to={`/respond/${token}/domain/${nextDomain.domainId}`}
                  className="inline-block bg-teal text-white font-lato font-bold py-3 px-8 rounded-lg hover:bg-teal-dark transition-colors text-lg"
                >
                  Continue to Next Domain
                </Link>
              </div>
            )}

            {/* Remaining Domains Summary */}
            <div className="bg-white rounded-lg border border-card-border p-6 mb-8">
              <h2 className="section-label text-navy font-lato font-bold text-sm uppercase tracking-wide mb-4">
                Remaining Domains
              </h2>
              <ul className="space-y-3">
                {incompleteDomains.map((d) => (
                  <li
                    key={d.domainId}
                    className="flex items-center justify-between border-b border-card-border pb-3 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <Link
                        to={`/respond/${token}/domain/${d.domainId}`}
                        className="text-navy font-lato font-bold hover:text-teal transition-colors"
                      >
                        {d.domainName}
                      </Link>
                      <p className="text-muted-text font-lato text-sm">
                        {d.answeredQuestions} of {d.totalQuestions} questions answered
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className="text-muted-text font-lato text-xs">
                        ~{d.estimatedMinutes} min
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Back to Domains Link */}
        <div className="text-center">
          <Link
            to={`/respond/${token}`}
            className="text-muted-text hover:text-teal font-lato text-sm underline"
          >
            Back to Domains
          </Link>
        </div>
      </div>
    </div>
  );
}
