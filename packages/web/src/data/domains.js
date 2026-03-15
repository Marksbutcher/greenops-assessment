// Domain configuration — source of truth for the frontend
export const DOMAINS = [
  { id: 'strategy', name: 'Strategy', jsonKey: 'Strategy', description: 'Examines how sustainability is reflected in corporate and IT strategy, including net-zero targets, roadmaps, budgets, and organisational alignment.' },
  { id: 'governance', name: 'Governance & Management', jsonKey: 'Governance & Management', description: 'Assesses governance structures, accountability, policies, risk management, and continuous improvement processes for IT sustainability.' },
  { id: 'financial', name: 'Financial & Service Management', jsonKey: 'Financial & Service Management', description: 'Evaluates IT cost allocation models, budgeting, forecasting, sustainability metrics integration, and cross-functional collaboration.' },
  { id: 'supply_chain', name: 'Supply Chain', jsonKey: 'Supply Chain', description: 'Reviews procurement practices, supplier sustainability engagement, lifecycle assessment, circularity criteria, and regulatory alignment.' },
  { id: 'data_centre', name: 'Data Centre', jsonKey: 'Data Centre', description: 'Covers data centre sustainability strategy, energy monitoring, GHG emissions calculation, compliance, benchmarking, and team training.' },
  { id: 'core_infrastructure', name: 'Core Infrastructure', jsonKey: 'Core Infrastructure', description: 'Assesses hardware infrastructure sustainability practices including energy monitoring, efficiency benchmarking, scope 3 awareness, and lifecycle management.' },
  { id: 'ai_compute', name: 'AI & Advanced Compute', jsonKey: 'AI & Advanced Compute', description: 'Evaluates AI workload emissions measurement, model efficiency, hardware lifecycle management, workload placement, and governance alignment.' },
  { id: 'cloud_ops', name: 'Cloud Ops', jsonKey: 'Cloud Ops', description: 'Reviews cloud sustainability practices including FinOps maturity, emissions tracking, provider benchmarking, and team capabilities.' },
  { id: 'software_dev', name: 'Software Development', jsonKey: 'Software Development', description: 'Covers sustainable software development practices including design principles, energy monitoring, scope 3 awareness, and code quality benchmarking.' },
  { id: 'end_user', name: 'End User Services', jsonKey: 'End User Services', description: 'Assesses end user device lifecycle management, refresh cycles, circular procurement, print services, energy tracking, and regulatory alignment.' },
];

export const OPTION_SCORES = { A: 0, B: 2, C: 4, D: 6, E: 10 };

export const MATURITY_LEVELS = [
  { level: 1, name: 'Initial', min: 0, max: 20, color: '#9CA3AF' },
  { level: 2, name: 'Emerging', min: 21, max: 40, color: '#60A5FA' },
  { level: 3, name: 'Established', min: 41, max: 60, color: '#F3A261' },
  { level: 4, name: 'Optimised', min: 61, max: 80, color: '#00A996' },
  { level: 5, name: 'Leading', min: 81, max: 100, color: '#0F1F2E' },
];

export function getMaturityLevel(percentage) {
  if (percentage <= 20) return MATURITY_LEVELS[0];
  if (percentage <= 40) return MATURITY_LEVELS[1];
  if (percentage <= 60) return MATURITY_LEVELS[2];
  if (percentage <= 80) return MATURITY_LEVELS[3];
  return MATURITY_LEVELS[4];
}

export const INDUSTRY_SECTORS = [
  'Financial Services', 'Government & Public Sector', 'Healthcare',
  'Manufacturing', 'Retail & Consumer', 'Technology & Telecoms',
  'Energy & Utilities', 'Transport & Logistics', 'Education', 'Other',
];

export const SIZE_BANDS = [
  'Under 100', '100–500', '500–2,000', '2,000–10,000', 'Over 10,000',
];

// Overall maturity level characteristics (cross-cutting, not domain-specific)
export const OVERALL_MATURITY_CHARACTERISTICS = {
  Initial:
    'No consistent digital sustainability practices. IT decisions taken with little or no consideration of carbon, energy, or resource impact. No measurement of digital emissions, fragmented accountability, and low awareness across teams.',
  Emerging:
    'Early awareness of digital sustainability issues. Ad-hoc pilots (e.g. device recycling, data centre optimisation). Initial conversations about responsibility, but no structured programme, consistent measurement, or cross-functional alignment.',
  Established:
    'Policies and guidance defined (e.g. sustainable procurement criteria, cloud sustainability guardrails). Some processes standardised, such as tracking end-user device lifecycles or reporting data centre PUE. Data beginning to be used in IT financial or architectural decisions.',
  Optimised:
    'Digital sustainability embedded in governance and operations. GreenOps metrics (energy, carbon, water) integrated into TBM/FinOps tooling. Measurable impact across cloud, data centres, and devices. Regular reporting to leadership, with clear targets for energy and emissions reduction.',
  Leading:
    'Industry-leading GreenOps practices. Full lifecycle approach across cloud, AI, data centres, software, and devices. Proactive influence on suppliers and ecosystems. Continuous optimisation through automation and behavioural enablement. Externally validated reporting aligned with CSRD/EED/ISO standards, with sustainability outcomes tied to business performance.',
};
