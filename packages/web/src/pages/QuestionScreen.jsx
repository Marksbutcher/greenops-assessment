import { useAssessment } from '../context/AssessmentContext';
import { DOMAINS } from '../data/domains';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

export default function QuestionScreen() {
  const { domainId, questionIndex } = useParams();
  const navigate = useNavigate();
  const { organisation, getQuestionsForDomain, getDomainProgress, responses, saveResponse } = useAssessment();

  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState(null);

  // Redirect to home if no organisation set
  useEffect(() => {
    if (!organisation) {
      navigate('/');
    }
  }, [organisation, navigate]);

  // Get domain metadata
  const domain = DOMAINS.find((d) => d.id === domainId);

  // Get questions for this domain
  const questions = getQuestionsForDomain(domainId);

  // Parse question index from URL param
  const qIndex = parseInt(questionIndex, 10);

  // Current question
  const question = questions[qIndex] || null;

  // Total and position
  const totalQuestions = questions.length;
  const questionNumber = qIndex + 1;
  const isFirst = qIndex === 0;
  const isLast = qIndex === totalQuestions - 1;

  // Current selected option for this question
  const currentResponse = question ? responses[question.id] : null;
  const selectedOption = currentResponse?.option || null;

  // Build the list of available options for the current question
  const availableOptions = question
    ? OPTION_LETTERS.filter((letter) => {
        if (letter === 'E' && question.optionE === null) return false;
        return true;
      })
    : [];

  // Get option text by letter
  const getOptionText = useCallback(
    (letter) => {
      if (!question) return '';
      switch (letter) {
        case 'A': return question.optionA;
        case 'B': return question.optionB;
        case 'C': return question.optionC;
        case 'D': return question.optionD;
        case 'E': return question.optionE;
        default: return '';
      }
    },
    [question],
  );

  // Clear auto-advance timer on unmount or question change
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer) {
        clearTimeout(autoAdvanceTimer);
      }
    };
  }, [autoAdvanceTimer]);

  // Navigation helpers
  const goToQuestion = useCallback(
    (index) => {
      if (index >= 0 && index < totalQuestions) {
        navigate(`/assess/${domainId}/${index}`);
      }
    },
    [domainId, totalQuestions, navigate],
  );

  const goNext = useCallback(() => {
    if (isLast) {
      navigate('/assess');
    } else {
      goToQuestion(qIndex + 1);
    }
  }, [isLast, qIndex, goToQuestion, navigate]);

  const goPrevious = useCallback(() => {
    if (!isFirst) {
      goToQuestion(qIndex - 1);
    }
  }, [isFirst, qIndex, goToQuestion]);

  const goSaveExit = useCallback(() => {
    navigate('/assess');
  }, [navigate]);

  // Handle answer card click
  const handleSelectOption = useCallback(
    (letter) => {
      if (!question) return;

      const hadPreviousAnswer = !!responses[question.id];

      // Save the response immediately
      saveResponse(question.id, letter, question.maxScore);

      // Auto-advance only on NEW answers (not when changing an existing one)
      if (!hadPreviousAnswer && !isLast) {
        // Clear any existing timer
        if (autoAdvanceTimer) {
          clearTimeout(autoAdvanceTimer);
        }
        const timer = setTimeout(() => {
          goToQuestion(qIndex + 1);
        }, 400);
        setAutoAdvanceTimer(timer);
      }
    },
    [question, responses, saveResponse, isLast, qIndex, goToQuestion, autoAdvanceTimer],
  );

  // Keyboard navigation: left/right arrow keys
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrevious]);

  // Guard: no organisation
  if (!organisation) {
    return null;
  }

  // Guard: invalid domain
  if (!domain) {
    return (
      <div className="min-h-screen bg-content-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-navy font-georgia mb-2">Domain not found</h2>
          <button
            onClick={() => navigate('/assess')}
            className="text-teal hover:text-teal-dark underline"
          >
            Back to Domains
          </button>
        </div>
      </div>
    );
  }

  // Guard: invalid question index
  if (!question || qIndex < 0 || qIndex >= totalQuestions) {
    return (
      <div className="min-h-screen bg-content-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-navy font-georgia mb-2">Question not found</h2>
          <button
            onClick={() => navigate(`/assess/${domainId}/0`)}
            className="text-teal hover:text-teal-dark underline"
          >
            Go to first question
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = totalQuestions > 0 ? (questionNumber / totalQuestions) * 100 : 0;

  // Check if the entire domain is now complete (all questions answered)
  const domainProgress = getDomainProgress(domainId);
  const isDomainComplete = domainProgress.answered === domainProgress.total;
  // Show completion banner on last question when the last answer has been given
  const showCompletionBanner = isLast && selectedOption !== null;

  return (
    <div className="min-h-screen bg-content-bg flex flex-col">
      {/* Progress bar — full width at top */}
      <div className="progress-bar rounded-none">
        <div
          className="progress-bar__fill rounded-none"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="max-w-3xl w-full mx-auto px-4 py-8 flex-1 flex flex-col">
          {/* Question X of Y label */}
          <div className="mb-1">
            <span className="section-label text-sm">
              Question {questionNumber} of {totalQuestions}
            </span>
          </div>

          {/* Domain name */}
          <p className="text-sm text-muted-text mb-4">
            {domain.name}
          </p>

          {/* Question text */}
          <h2 className="text-2xl font-bold text-navy font-georgia leading-snug mb-6">
            {question.text}
          </h2>

          {/* Answer cards */}
          <div className="space-y-3 mb-8">
            {availableOptions.map((letter) => {
              const isSelected = selectedOption === letter;
              const optionText = getOptionText(letter);

              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => handleSelectOption(letter)}
                  className={`answer-card w-full text-left ${isSelected ? 'answer-card--selected' : ''}`}
                >
                  <span className="letter-chip flex-shrink-0">
                    {letter}
                  </span>
                  <span className={`answer-card__text text-sm leading-relaxed ${isSelected ? 'text-white font-bold' : 'text-body-text'}`}>
                    {optionText}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Domain complete banner */}
          {showCompletionBanner && (
            <div className="bg-teal/5 border-2 border-teal rounded-lg p-6 text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg className="w-6 h-6 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-georgia text-lg text-navy font-bold">
                  {domain.name} — Complete
                </h3>
              </div>
              <p className="text-sm text-muted-text mb-4">
                You've answered all {totalQuestions} questions in this domain.
              </p>
              <button
                type="button"
                onClick={() => navigate('/assess')}
                className="inline-flex items-center gap-2 bg-teal hover:bg-teal-dark text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Continue to Other Domains
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Bottom navigation bar */}
        <div className="border-t border-card-border bg-white">
          <div className="max-w-3xl w-full mx-auto px-4 py-4 flex items-center justify-between gap-3">
            {/* Previous button */}
            <button
              type="button"
              onClick={goPrevious}
              disabled={isFirst}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border font-semibold text-sm transition-colors ${
                isFirst
                  ? 'border-card-border text-muted-text cursor-not-allowed opacity-50'
                  : 'border-card-border text-navy hover:border-navy hover:bg-navy hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            {/* Save & Exit button */}
            <button
              type="button"
              onClick={goSaveExit}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-muted-text hover:text-navy transition-colors"
            >
              Save &amp; Exit
            </button>

            {/* Next / Back to Domains button */}
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal hover:bg-teal-dark text-white font-semibold text-sm transition-colors"
            >
              {isLast ? 'Back to Domains' : 'Next'}
              {!isLast && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
