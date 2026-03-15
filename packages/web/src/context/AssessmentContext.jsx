import { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import rawQuestions from '../data/questions.json';
import { DOMAINS, OPTION_SCORES, getMaturityLevel } from '../data/domains';

// --- localStorage persistence ---
const STORAGE_KEY = 'greenops-assessment';

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      // Basic validation
      if (data && typeof data === 'object' && data.version === 1) {
        return data;
      }
    }
  } catch (e) { /* ignore corrupted data */ }
  return null;
}

function saveToStorage(organisation, responses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      organisation,
      responses,
      savedAt: new Date().toISOString(),
    }));
  } catch (e) { /* ignore storage full */ }
}

function clearStorage() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
}

// --- Question loading ---
function loadQuestions() {
  const byDomain = {};
  for (const domain of DOMAINS) {
    const questions = rawQuestions[domain.jsonKey] || [];
    byDomain[domain.id] = questions.map((q) => ({
      id: q.id,
      domainId: q.domain_id || domain.id,
      displayId: q.display_id,
      text: q.text,
      optionA: q.option_a,
      optionB: q.option_b,
      optionC: q.option_c,
      optionD: q.option_d,
      optionE: q.option_e && q.option_e.trim().length > 1 ? q.option_e : null,
      maxScore: q.max_score,
      displayOrder: q.display_order,
    }));
  }
  return byDomain;
}

const questionsByDomain = loadQuestions();

const AssessmentContext = createContext(null);

export function AssessmentProvider({ children }) {
  // Initialise state from localStorage if available
  const saved = useMemo(() => loadFromStorage(), []);

  const [organisation, setOrganisationRaw] = useState(saved?.organisation || null);
  const [responses, setResponsesRaw] = useState(saved?.responses || {});
  const [isComplete, setIsComplete] = useState(false);

  // Wrapped setters that also persist to localStorage
  const setOrganisation = useCallback((org) => {
    setOrganisationRaw(org);
  }, []);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (organisation) {
      saveToStorage(organisation, responses);
    }
  }, [organisation, responses]);

  function saveResponse(questionId, option, maxScore) {
    const score = OPTION_SCORES[option] || 0;
    setResponsesRaw((prev) => ({ ...prev, [questionId]: { option, score } }));
  }

  function getQuestionsForDomain(domainId) {
    return questionsByDomain[domainId] || [];
  }

  function getDomainProgress(domainId) {
    const questions = getQuestionsForDomain(domainId);
    const answered = questions.filter((q) => responses[q.id]).length;
    return { answered, total: questions.length };
  }

  function getDomainScore(domainId) {
    const questions = getQuestionsForDomain(domainId);
    let rawScore = 0;
    let maxPossible = 0;
    let answeredCount = 0;

    for (const q of questions) {
      maxPossible += q.maxScore;
      const resp = responses[q.id];
      if (resp) {
        rawScore += resp.score;
        answeredCount++;
      }
    }

    const percentage = maxPossible > 0 ? (rawScore / maxPossible) * 100 : 0;
    return {
      domainId,
      rawScore,
      maxPossible,
      percentage: Math.round(percentage * 10) / 10,
      maturity: getMaturityLevel(percentage),
      answered: answeredCount,
      total: questions.length,
      isComplete: answeredCount === questions.length,
    };
  }

  function getOverallScore() {
    let totalRaw = 0;
    let totalMax = 0;

    for (const domain of DOMAINS) {
      const score = getDomainScore(domain.id);
      totalRaw += score.rawScore;
      totalMax += score.maxPossible;
    }

    const percentage = totalMax > 0 ? (totalRaw / totalMax) * 100 : 0;
    return {
      totalRaw,
      totalMax,
      percentage: Math.round(percentage * 10) / 10,
      maturity: getMaturityLevel(percentage),
    };
  }

  function getAllDomainScores() {
    return DOMAINS.map((d) => getDomainScore(d.id));
  }

  function isAssessmentComplete() {
    return DOMAINS.every((d) => getDomainScore(d.id).isComplete);
  }

  function resetAssessment() {
    setOrganisationRaw(null);
    setResponsesRaw({});
    setIsComplete(false);
    clearStorage();
  }

  function getExportData() {
    const domainScores = getAllDomainScores();
    const overall = getOverallScore();
    const allResponses = [];

    for (const domain of DOMAINS) {
      const questions = getQuestionsForDomain(domain.id);
      for (const q of questions) {
        const resp = responses[q.id];
        // Map option letter to full answer text
        const optionTextMap = { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD, E: q.optionE };
        const selectedOptionText = resp?.option ? (optionTextMap[resp.option] || resp.option) : '';
        allResponses.push({
          domain: domain.name,
          questionId: q.displayId,
          question: q.text,
          selectedOption: resp?.option || '',
          selectedOptionText,
          score: resp?.score ?? '',
          maxScore: q.maxScore,
        });
      }
    }

    return { organisation, domainScores, overall, responses: allResponses };
  }

  const value = useMemo(() => ({
    organisation, setOrganisation,
    responses, saveResponse,
    getQuestionsForDomain, getDomainProgress, getDomainScore,
    getOverallScore, getAllDomainScores, isAssessmentComplete,
    resetAssessment, getExportData,
    isComplete, setIsComplete,
  }), [organisation, responses, isComplete, setOrganisation]);

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessment must be used within AssessmentProvider');
  return ctx;
}
