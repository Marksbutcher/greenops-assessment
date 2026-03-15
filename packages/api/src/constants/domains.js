// Canonical domain configuration
// Source of truth for domain IDs, display names, and descriptions

const DOMAINS = {
  strategy: {
    id: 'strategy',
    name: 'Strategy',
    questionCount: 24,
    maxScore: 240,
    description: 'Examines how sustainability is reflected in corporate and IT strategy, including net-zero targets, roadmaps, budgets, and organisational alignment.',
  },
  governance: {
    id: 'governance',
    name: 'Governance & Management',
    questionCount: 21,
    maxScore: 210,
    description: 'Assesses governance structures, accountability, policies, risk management, and continuous improvement processes for IT sustainability.',
  },
  financial: {
    id: 'financial',
    name: 'Financial & Service Management',
    questionCount: 15,
    maxScore: 150,
    description: 'Evaluates IT cost allocation models, budgeting, forecasting, sustainability metrics integration, and cross-functional collaboration.',
  },
  supply_chain: {
    id: 'supply_chain',
    name: 'Supply Chain',
    questionCount: 15,
    maxScore: 150,
    description: 'Reviews procurement practices, supplier sustainability engagement, lifecycle assessment, circularity criteria, and regulatory alignment.',
  },
  data_centre: {
    id: 'data_centre',
    name: 'Data Centre',
    questionCount: 17,
    maxScore: 170,
    description: 'Covers data centre sustainability strategy, energy monitoring, GHG emissions calculation, compliance, benchmarking, and team training.',
  },
  core_infrastructure: {
    id: 'core_infrastructure',
    name: 'Core Infrastructure',
    questionCount: 14,
    maxScore: 140,
    description: 'Assesses hardware infrastructure sustainability practices including energy monitoring, efficiency benchmarking, scope 3 awareness, and lifecycle management.',
  },
  ai_compute: {
    id: 'ai_compute',
    name: 'AI & Advanced Compute',
    questionCount: 9,
    maxScore: 90,
    description: 'Evaluates AI workload emissions measurement, model efficiency, hardware lifecycle management, workload placement, and governance alignment.',
  },
  cloud_ops: {
    id: 'cloud_ops',
    name: 'Cloud Operations',
    questionCount: 14,
    maxScore: 140,
    description: 'Reviews cloud sustainability practices including FinOps maturity, emissions tracking, provider benchmarking, and team capabilities.',
  },
  software_dev: {
    id: 'software_dev',
    name: 'Software Development',
    questionCount: 12,
    maxScore: 120,
    description: 'Covers sustainable software development practices including design principles, energy monitoring, scope 3 awareness, and code quality benchmarking.',
  },
  end_user: {
    id: 'end_user',
    name: 'End User Services',
    questionCount: 16,
    maxScore: 160,
    description: 'Assesses end user device lifecycle management, refresh cycles, circular procurement, print services, energy tracking, and regulatory alignment.',
  },
};

// Domain display order
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

// Scoring constants
const OPTION_SCORES = { A: 0, B: 2, C: 4, D: 6, E: 10 };

const MATURITY_LEVELS = [
  { level: 1, name: 'Initial', minPercent: 0, maxPercent: 20 },
  { level: 2, name: 'Emerging', minPercent: 21, maxPercent: 40 },
  { level: 3, name: 'Established', minPercent: 41, maxPercent: 60 },
  { level: 4, name: 'Optimised', minPercent: 61, maxPercent: 80 },
  { level: 5, name: 'Leading', minPercent: 81, maxPercent: 100 },
];

const TOTAL_MAX_SCORE = 1570;

// Industry sectors for C1 form
const INDUSTRY_SECTORS = [
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

// Organisation size bands
const SIZE_BANDS = [
  'Under 100',
  '100–500',
  '500–2,000',
  '2,000–10,000',
  'Over 10,000',
];

// Assessment status transitions (valid next states)
const STATUS_TRANSITIONS = {
  DRAFT: ['ACTIVE'],
  ACTIVE: ['IN_PROGRESS'],
  IN_PROGRESS: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['REPORT_READY', 'IN_PROGRESS'],
  REPORT_READY: ['COMPLETE'],
  COMPLETE: [],
};

function getMaturityLevel(percentage) {
  if (percentage <= 20) return { level: 1, name: 'Initial' };
  if (percentage <= 40) return { level: 2, name: 'Emerging' };
  if (percentage <= 60) return { level: 3, name: 'Established' };
  if (percentage <= 80) return { level: 4, name: 'Optimised' };
  return { level: 5, name: 'Leading' };
}

module.exports = {
  DOMAINS,
  DOMAIN_ORDER,
  OPTION_SCORES,
  MATURITY_LEVELS,
  TOTAL_MAX_SCORE,
  INDUSTRY_SECTORS,
  SIZE_BANDS,
  STATUS_TRANSITIONS,
  getMaturityLevel,
};
