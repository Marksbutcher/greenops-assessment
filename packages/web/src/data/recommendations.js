// Next-steps recommendations by current maturity level
// These are cross-cutting actions relevant regardless of domain
export const NEXT_STEPS = {
  Initial: {
    target: 'Emerging',
    summary: 'Focus on establishing baseline visibility and initial accountability.',
    actions: [
      'Assign a named owner for digital sustainability across IT and facilities',
      'Begin measuring energy consumption for your largest digital estate components',
      'Conduct an initial inventory of hardware assets, cloud accounts, and software services',
      'Include digital sustainability as a standing agenda item in at least one senior governance forum',
      'Engage procurement to request basic sustainability data from your top 10 suppliers',
    ],
  },
  Emerging: {
    target: 'Established',
    summary: 'Formalise policies, standardise measurement, and establish regular reporting.',
    actions: [
      'Define and publish digital sustainability policies covering procurement, cloud, and end-user services',
      'Standardise metrics and reporting cadences across all operational domains',
      'Embed sustainability criteria in procurement processes and supplier contracts',
      'Establish cross-functional working groups spanning IT, finance, procurement, and facilities',
      'Begin tracking Scope 2 and Scope 3 emissions for major IT service categories',
    ],
  },
  Established: {
    target: 'Optimised',
    summary: 'Integrate sustainability data with financial and operational systems to drive decisions.',
    actions: [
      'Integrate GreenOps metrics into TBM/FinOps tooling and dashboards',
      'Automate data collection and reporting to reduce manual effort and improve accuracy',
      'Use sustainability data to inform investment prioritisation and architecture decisions',
      'Set domain-specific targets and track progress against them in governance forums',
      'Reconcile sustainability data with financial and service management reporting',
    ],
  },
  Optimised: {
    target: 'Leading',
    summary: 'Pursue external validation, drive supply chain influence, and embed continuous improvement.',
    actions: [
      'Seek independent assurance of sustainability reporting aligned with CSRD/EED/ISO standards',
      'Extend sustainability requirements through the supply chain with collaborative improvement programmes',
      'Embed sustainability outcomes in incentive structures and business performance frameworks',
      'Contribute to industry standards, benchmarking initiatives, and peer collaboration',
      'Drive behavioural change through awareness campaigns and sustainability champions across teams',
    ],
  },
  Leading: {
    target: null,
    summary: 'Maintain leadership through continuous innovation and external influence.',
    actions: [
      'Drive industry-wide standards and share best practices through benchmarking and peer forums',
      'Expand scope to include full Scope 3 emissions across the digital value chain',
      'Invest in next-generation sustainable technologies and practices',
      'Use your position to influence regulation, policy, and market expectations',
      'Pursue carbon-neutral or net-positive digital operations as a strategic differentiator',
    ],
  },
};

// Strategic insight patterns detected from domain scores
// Each function takes the domain scores array and returns an insight object or null
export const STRATEGIC_PATTERNS = [
  {
    id: 'foundation-gap',
    label: 'Foundation Gap',
    icon: 'warning',
    test: (scores) => {
      const strategy = scores.find((s) => s.domainId === 'strategy');
      const governance = scores.find((s) => s.domainId === 'governance');
      if (!strategy || !governance) return null;
      if (strategy.answered === 0 && governance.answered === 0) return null;
      const avg = (strategy.percentage + governance.percentage) / 2;
      if (avg <= 30) return {
        severity: 'high',
        message: 'Your foundational domains — Strategy and Governance — are underdeveloped. Without clear strategic direction and governance structures, operational sustainability improvements are difficult to sustain and scale. Prioritise establishing accountability, targets, and reporting foundations before investing heavily in operational domains.',
      };
      return null;
    },
  },
  {
    id: 'implementation-gap',
    label: 'Implementation Gap',
    icon: 'warning',
    test: (scores) => {
      const strategy = scores.find((s) => s.domainId === 'strategy');
      if (!strategy || strategy.answered === 0) return null;
      const operational = scores.filter((s) =>
        ['data_centre', 'core_infrastructure', 'cloud_ops', 'software_dev', 'end_user', 'ai_compute'].includes(s.domainId) && s.answered > 0
      );
      if (operational.length === 0) return null;
      const opAvg = operational.reduce((sum, s) => sum + s.percentage, 0) / operational.length;
      if (strategy.percentage > 40 && opAvg < strategy.percentage - 20) return {
        severity: 'medium',
        message: `Strategic intent (${Math.round(strategy.percentage)}%) is running ahead of operational execution (${Math.round(opAvg)}% average). This plan-do gap is common — strategy commitments rarely survive contact with operational reality without dedicated programme management, cross-functional governance, and investment in tooling and capability.`,
      };
      return null;
    },
  },
  {
    id: 'regulatory-exposure',
    label: 'Regulatory Exposure',
    icon: 'alert',
    test: (scores) => {
      const regulatory = scores.filter((s) =>
        ['data_centre', 'supply_chain', 'cloud_ops'].includes(s.domainId) && s.answered > 0
      );
      if (regulatory.length === 0) return null;
      const avg = regulatory.reduce((sum, s) => sum + s.percentage, 0) / regulatory.length;
      if (avg <= 30) return {
        severity: 'high',
        message: 'Low maturity in Data Centre, Supply Chain, and Cloud Ops creates regulatory and compliance risk. The EU Energy Efficiency Directive (EED), Corporate Sustainability Reporting Directive (CSRD), and emerging national standards increasingly require organisations to measure and report on digital infrastructure emissions. Addressing these domains should be treated as a compliance priority.',
      };
      return null;
    },
  },
  {
    id: 'siloed-progress',
    label: 'Uneven Maturity',
    icon: 'info',
    test: (scores) => {
      const answered = scores.filter((s) => s.answered > 0);
      if (answered.length < 4) return null;
      const max = Math.max(...answered.map((s) => s.percentage));
      const min = Math.min(...answered.map((s) => s.percentage));
      if (max - min > 40) return {
        severity: 'medium',
        message: `Your maturity varies significantly across domains (${Math.round(min)}% to ${Math.round(max)}%). This spread typically indicates siloed rather than coordinated GreenOps efforts. Consider establishing a cross-functional programme to align progress across domains, using your strongest areas as reference models for weaker ones.`,
      };
      return null;
    },
  },
  {
    id: 'strong-foundation',
    label: 'Strong Foundation',
    icon: 'positive',
    test: (scores) => {
      const strategy = scores.find((s) => s.domainId === 'strategy');
      const governance = scores.find((s) => s.domainId === 'governance');
      if (!strategy || !governance) return null;
      if (strategy.answered === 0 || governance.answered === 0) return null;
      if (strategy.percentage > 50 && governance.percentage > 50) return {
        severity: 'positive',
        message: 'Your Strategy and Governance scores indicate solid foundations are in place. This positions you well to accelerate progress in operational domains. Focus investment on areas with the largest gap between current maturity and your target state, using governance structures to maintain momentum and accountability.',
      };
      return null;
    },
  },
  {
    id: 'financial-alignment',
    label: 'Financial Integration',
    icon: 'info',
    test: (scores) => {
      const financial = scores.find((s) => s.domainId === 'financial');
      if (!financial || financial.answered === 0) return null;
      if (financial.percentage <= 30) return {
        severity: 'medium',
        message: 'Financial and Service Management maturity is low. Without integrating sustainability into cost models and TBM/FinOps processes, it is difficult to build the business case for investment, allocate costs accurately, or demonstrate return. This domain often unlocks progress across all others.',
      };
      return null;
    },
  },
];
