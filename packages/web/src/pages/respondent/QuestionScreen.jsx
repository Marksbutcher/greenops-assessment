import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];
const OPTION_KEYS = ['optionA', 'optionB', 'optionC', 'optionD', 'optionE'];
const AUTO_ADVANCE_DELAY = 500;

export default function QuestionScreen() {
  const { token, domainId, questionIndex: questionIndexParam } = useParams();
  const navigate = useNavigate();
  const questionIndex = parseInt(questionIndexParam, 10);

  const [domain, setDomain] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingQuestionId, setSavingQuestionId] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const autoAdvanceTimer = useRef(null);

  // Headers for respondent API calls
  const headers = { 'x-access-token': token };

  // Fetch all questions for this domain on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchQuestions() {
      setLoading(true);
      setError(null);
      try {
        const result = await api.get(`/respondent/domains/${domainId}/questions`, { headers });
        if (!cancelled) {
          setDomain(result.data.domain);
          setQuestions(result.data.questions);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load questions');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchQuestions();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainId, token]);

  // Clean up auto-advance timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIndex, questions.length]);

  // Current question
  const totalQuestions = questions.length;
  const currentQuestion = questions[questionIndex] || null;
  const isFirstQuestion = questionIndex === 0;
  const isLastQuestion = questionIndex === totalQuestions - 1;

  // Navigation helpers
  const goToPrevious = useCallback(() => {
    if (questionIndex > 0) {
      navigate(`/respond/${token}/domain/${domainId}/question/${questionIndex - 1}`);
    }
  }, [questionIndex, token, domainId, navigate]);

  const goToNext = useCallback(() => {
    if (questionIndex < totalQuestions - 1) {
      navigate(`/respond/${token}/domain/${domainId}/question/${questionIndex + 1}`);
    }
  }, [questionIndex, totalQuestions, token, domainId, navigate]);

  const goToCompleteDomain = useCallback(() => {
    navigate(`/respond/${token}/domain/${domainId}/complete`);
  }, [token, domainId, navigate]);

  const goToSaveAndExit = useCallback(() => {
    navigate(`/respond/${token}`);
  }, [token, navigate]);

  // Handle answer selection
  const handleSelectOption = useCallback(
    async (optionLetter) => {
      if (!currentQuestion || savingQuestionId) return;

      const previousOption = currentQuestion.selectedOption;
      const isChangingExisting = previousOption !== null && previousOption !== undefined;
      const isNewAnswer = !isChangingExisting;

      // Optimistic update
      setQuestions((prev) =>
        prev.map((q, idx) =>
          idx === questionIndex ? { ...q, selectedOption: optionLetter } : q
        )
      );

      // Clear any pending auto-advance
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = null;
      }

      setSavingQuestionId(currentQuestion.id);
      setSaveError(null);

      try {
        const result = await api.post(
          '/respondent/responses',
          {
            question_id: currentQuestion.id,
            selected_option: optionLetter,
            domain_id: domainId,
          },
          { headers }
        );

        // Update score from server response
        setQuestions((prev) =>
          prev.map((q, idx) =>
            idx === questionIndex
              ? { ...q, selectedOption: optionLetter, score: result.data.score }
              : q
          )
        );

        // Auto-advance only for new answers (not changing existing)
        if (isNewAnswer && !isLastQuestion) {
          autoAdvanceTimer.current = setTimeout(() => {
            goToNext();
          }, AUTO_ADVANCE_DELAY);
        }
      } catch (err) {
        // Revert on error
        setQuestions((prev) =>
          prev.map((q, idx) =>
            idx === questionIndex ? { ...q, selectedOption: previousOption } : q
          )
        );
        setSaveError(err.message || 'Failed to save answer');

        // Clear error after 3 seconds
        setTimeout(() => setSaveError(null), 3000);
      } finally {
        setSavingQuestionId(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentQuestion, questionIndex, savingQuestionId, domainId, isLastQuestion, goToNext, headers]
  );

  // Build the list of available options for the current question
  const getAvailableOptions = () => {
    if (!currentQuestion) return [];

    const options = [];
    for (let i = 0; i < OPTION_KEYS.length; i++) {
      const text = currentQuestion[OPTION_KEYS[i]];
      if (text !== null && text !== undefined && text !== '') {
        options.push({ letter: OPTION_LETTERS[i], text });
      }
    }
    return options;
  };

  // Progress percentage
  const progressPercent = totalQuestions > 0 ? ((questionIndex + 1) / totalQuestions) * 100 : 0;

  // --- RENDER ---

  if (loading) {
    return (
      <div className="min-h-screen bg-content-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-text font-lato">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-content-bg flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-sm border border-card-border p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-orange-light rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-georgia text-xl text-navy mb-2">Unable to Load Questions</h2>
          <p className="text-muted-text mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-teal text-white px-6 py-2 rounded-lg font-lato font-bold hover:bg-teal-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-content-bg flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-sm border border-card-border p-8 max-w-md w-full text-center">
          <h2 className="font-georgia text-xl text-navy mb-2">Question Not Found</h2>
          <p className="text-muted-text mb-6">
            Question {questionIndex + 1} does not exist in this domain.
          </p>
          <button
            onClick={goToSaveAndExit}
            className="bg-teal text-white px-6 py-2 rounded-lg font-lato font-bold hover:bg-teal-dark transition-colors"
          >
            Return to Overview
          </button>
        </div>
      </div>
    );
  }

  const availableOptions = getAvailableOptions();
  const isSaving = savingQuestionId === currentQuestion.id;

  return (
    <div className="min-h-screen bg-content-bg flex flex-col">
      {/* Progress bar — full width at top */}
      <div className="progress-bar w-full rounded-none">
        <div
          className="progress-bar__fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Question counter */}
        <div className="section-label text-sm mb-6">
          Question {questionIndex + 1} of {totalQuestions}
        </div>

        {/* Domain name */}
        <p className="text-muted-text font-lato text-sm mb-2">
          {domain?.name}
        </p>

        {/* Display ID */}
        <p className="text-muted-text font-lato text-xs mb-3 tracking-wide">
          {currentQuestion.displayId}
        </p>

        {/* Question text */}
        <h1 className="font-georgia text-2xl sm:text-3xl text-navy font-bold leading-relaxed mb-8">
          {currentQuestion.text}
        </h1>

        {/* Save error message */}
        {saveError && (
          <div className="bg-orange-light border border-orange rounded-lg px-4 py-3 mb-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-orange flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-body-text font-lato">{saveError}</p>
          </div>
        )}

        {/* Answer cards */}
        <div className="flex flex-col gap-3 mb-8">
          {availableOptions.map(({ letter, text }) => {
            const isSelected = currentQuestion.selectedOption === letter;
            const hasError = saveError && isSelected;

            let cardClass = 'answer-card';
            if (isSelected) cardClass += ' answer-card--selected';
            if (isSaving && !isSelected) cardClass += ' answer-card--disabled';
            if (hasError) cardClass += ' answer-card--error';

            return (
              <button
                key={letter}
                className={cardClass}
                onClick={() => handleSelectOption(letter)}
                disabled={isSaving}
                type="button"
              >
                <span className="letter-chip">{letter}</span>
                <span className="answer-card__text text-left font-lato text-sm sm:text-base leading-relaxed pt-1">
                  {text}
                </span>
              </button>
            );
          })}
        </div>

        {/* Spacer pushes nav to bottom */}
        <div className="flex-1" />
      </div>

      {/* Bottom navigation bar */}
      <div className="border-t border-card-border bg-white">
        <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          {/* Previous */}
          <button
            onClick={goToPrevious}
            disabled={isFirstQuestion}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-lato font-bold text-sm
              border border-card-border transition-colors
              ${isFirstQuestion
                ? 'text-muted-text cursor-not-allowed opacity-40'
                : 'text-body-text hover:bg-content-bg hover:border-muted-text'
              }
            `}
            type="button"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          {/* Save & Exit */}
          <button
            onClick={goToSaveAndExit}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-lato font-bold text-sm text-muted-text hover:text-body-text transition-colors"
            type="button"
          >
            Save & Exit
          </button>

          {/* Next / Complete Domain */}
          {isLastQuestion ? (
            <button
              onClick={goToCompleteDomain}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-lato font-bold text-sm bg-teal text-white hover:bg-teal-dark transition-colors"
              type="button"
            >
              Complete Domain
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={goToNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-lato font-bold text-sm bg-teal text-white hover:bg-teal-dark transition-colors"
              type="button"
            >
              Next
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
