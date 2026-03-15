import { useEffect, useMemo } from 'react';
import { useAssessment } from '../context/AssessmentContext';
import { DOMAINS } from '../data/domains';
import { useNavigate } from 'react-router-dom';

export default function DomainList() {
  const { organisation, getDomainProgress, getDomainScore, isAssessmentComplete } = useAssessment();
  const navigate = useNavigate();

  useEffect(() => {
    if (!organisation) {
      navigate('/');
    }
  }, [organisation, navigate]);

  const totalAnswered = useMemo(() => {
    return DOMAINS.reduce((sum, domain) => {
      const progress = getDomainProgress(domain.id);
      return sum + progress.answered;
    }, 0);
  }, [getDomainProgress]);

  const totalQuestions = 184;
  const allComplete = isAssessmentComplete();

  if (!organisation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-content-bg py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-navy font-georgia mb-1">
            {organisation.name}
          </h1>
          <p className="text-lg text-muted-text">
            GreenOps Organisational Assessment
          </p>
        </div>

        {/* Overall Progress */}
        <div className="mb-8 bg-white rounded-lg border border-card-border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="section-label text-navy font-semibold">Overall Progress</span>
            <span className="text-sm text-muted-text">
              {totalAnswered} of {totalQuestions} questions answered
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar__fill"
              style={{ width: `${totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Complete banner with View Results button */}
        {allComplete && (
          <div className="mb-8 bg-teal-light border border-teal rounded-lg p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <svg className="w-6 h-6 text-teal-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-lg font-bold text-teal-dark font-georgia">
                Assessment Complete
              </span>
            </div>
            <p className="text-sm text-teal-dark mb-4">
              You have answered all {totalQuestions} questions across every domain.
            </p>
            <button
              onClick={() => navigate('/results')}
              className="inline-block bg-teal hover:bg-teal-dark text-white font-bold py-3 px-10 rounded-lg text-lg transition-colors"
            >
              View Results
            </button>
          </div>
        )}

        {/* Domain Cards */}
        <div className="space-y-4">
          {DOMAINS.map((domain, index) => {
            const progress = getDomainProgress(domain.id);
            const score = getDomainScore(domain.id);
            const isComplete = score.isComplete;
            const isInProgress = progress.answered > 0 && !isComplete;
            const isNotStarted = progress.answered === 0;
            const progressPercent = progress.total > 0 ? (progress.answered / progress.total) * 100 : 0;

            return (
              <div
                key={domain.id}
                onClick={() => navigate(`/assess/${domain.id}/0`)}
                className="relative flex bg-white rounded-lg border border-card-border overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                {/* Left accent strip */}
                <div className={`card-accent ${isComplete ? 'card-accent--teal' : ''}`} />

                {/* Card content */}
                <div className="flex-1 p-5 pl-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Domain number and name */}
                      <h2 className="text-lg font-bold text-navy font-georgia">
                        <span className="text-muted-text font-normal mr-2">{index + 1}.</span>
                        {domain.name}
                      </h2>

                      {/* Description */}
                      <p className="text-sm text-muted-text mt-1 leading-relaxed">
                        {domain.description}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="progress-bar">
                          <div
                            className="progress-bar__fill"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-text mt-1 inline-block">
                          {progress.answered} of {progress.total} questions
                        </span>
                      </div>
                    </div>

                    {/* Right side: status and action */}
                    <div className="flex flex-col items-end gap-3 flex-shrink-0 pt-1">
                      {/* Status badge */}
                      {isNotStarted && (
                        <span className="status-badge status-badge--not-started">
                          Not Started
                        </span>
                      )}
                      {isInProgress && (
                        <span className="status-badge status-badge--in-progress">
                          In Progress
                        </span>
                      )}
                      {isComplete && (
                        <span className="status-badge status-badge--complete flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Complete
                        </span>
                      )}

                      {/* Action button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/assess/${domain.id}/0`);
                        }}
                        className={`text-sm font-semibold px-4 py-1.5 rounded transition-colors ${
                          isComplete
                            ? 'bg-teal-light text-teal-dark hover:bg-teal hover:text-white'
                            : 'bg-orange-light text-orange hover:bg-orange hover:text-white'
                        }`}
                      >
                        {isNotStarted ? 'Start' : isInProgress ? 'Continue' : 'Review'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom View Results link (shown even if not all complete) */}
        {!allComplete && totalAnswered > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/results')}
              className="text-teal hover:text-teal-dark underline text-sm font-medium transition-colors"
            >
              View Results
            </button>
            <p className="text-xs text-muted-text mt-1">
              Results will be partial until all domains are complete.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
