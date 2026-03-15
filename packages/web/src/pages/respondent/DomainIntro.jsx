import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

export default function DomainIntro() {
  const { token, domainId } = useParams();
  const navigate = useNavigate();

  const [domain, setDomain] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDomainData() {
      try {
        setLoading(true);
        const res = await api.get(`/respondent/domains/${domainId}/questions`, {
          headers: { 'x-access-token': token },
        });
        setDomain(res.data.domain);
        setQuestions(res.data.questions || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDomainData();
  }, [token, domainId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-content-bg flex items-center justify-center">
        <p className="text-muted-text font-lato text-lg">Loading domain...</p>
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

  const totalQuestions = questions.length;
  const answeredCount = questions.filter((q) => q.selectedOption !== null).length;
  const remaining = totalQuestions - answeredCount;
  const estimatedMinutes = remaining * 1.5;
  const hasStarted = answeredCount > 0;

  const handleBegin = () => {
    let targetIndex = 0;
    if (hasStarted) {
      const firstUnanswered = questions.findIndex((q) => q.selectedOption === null);
      targetIndex = firstUnanswered !== -1 ? firstUnanswered : 0;
    }
    navigate(`/respond/${token}/domain/${domainId}/question/${targetIndex}`);
  };

  return (
    <div className="min-h-screen bg-content-bg">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Domain Heading */}
        <h1 className="font-georgia text-3xl text-navy mb-4">{domain?.name}</h1>

        {/* Domain Description */}
        <p className="text-body-text font-lato text-base leading-relaxed mb-8">
          {domain?.description}
        </p>

        {/* Quick Stats Card */}
        <div className="card-accent bg-white rounded-lg border border-card-border p-6 mb-8">
          <h2 className="section-label text-navy font-lato font-bold text-sm uppercase tracking-wide mb-4">
            Quick Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="font-georgia text-2xl text-navy">{totalQuestions}</p>
              <p className="text-muted-text font-lato text-sm">Total Questions</p>
            </div>
            <div className="text-center">
              <p className="font-georgia text-2xl text-teal">{answeredCount}</p>
              <p className="text-muted-text font-lato text-sm">Already Answered</p>
            </div>
            <div className="text-center">
              <p className="font-georgia text-2xl text-orange">
                {estimatedMinutes % 1 === 0
                  ? estimatedMinutes
                  : estimatedMinutes.toFixed(1)}{' '}
                min
              </p>
              <p className="text-muted-text font-lato text-sm">Estimated Time Remaining</p>
            </div>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="bg-white rounded-lg border border-card-border p-6 mb-8">
          <h2 className="section-label text-navy font-lato font-bold text-sm uppercase tracking-wide mb-4">
            Instructions
          </h2>
          <ul className="space-y-3 text-body-text font-lato text-sm leading-relaxed">
            <li className="flex items-start gap-3">
              <span className="text-teal mt-0.5 flex-shrink-0">&#x2022;</span>
              <span>
                Read each question carefully and select the option that best describes your
                organisation&#39;s current practice.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-teal mt-0.5 flex-shrink-0">&#x2022;</span>
              <span>
                You can navigate between questions and change your answers at any time.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-teal mt-0.5 flex-shrink-0">&#x2022;</span>
              <span>
                Your progress is saved automatically when you select an answer.
              </span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleBegin}
            className="w-full sm:w-auto bg-teal text-white font-lato font-bold py-3 px-8 rounded-lg hover:bg-teal-dark transition-colors text-lg"
          >
            {hasStarted ? 'Continue Assessment' : 'Begin Assessment'}
          </button>
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
