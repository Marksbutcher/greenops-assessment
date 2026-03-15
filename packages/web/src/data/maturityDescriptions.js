export const MATURITY_DESCRIPTIONS = {
  strategy: {
    Initial:
      "In organisations at this level, digital sustainability is absent from enterprise strategy. IT is managed almost entirely on cost and service delivery, with no environmental lens applied. Responsibilities are fragmented, silos dominate, and leadership awareness is low.",
    Emerging:
      "Strategic intent begins to reference sustainability, often in response to regulatory or investor pressure. Language may appear in ESG statements or IT plans, but commitments lack clarity, funding, and ownership. Engagement across functions is minimal, and reporting is sporadic and incomplete.",
    Established:
      "Policies are documented and governance structures introduced. Cross-functional engagement is improving, though uneven across functions. Standardised metrics are referenced, and reporting is more consistent, but data quality and granularity are insufficient to inform major investment decisions.",
    Optimised:
      "Digital sustainability becomes integral to strategy execution. Metrics are accurate, granular, and reviewed at senior level alongside financial and operational performance. Cross-functional teams collaborate on a single roadmap, using insights to prioritise investments and deliver change.",
    Leading:
      "At this level, digital sustainability is fully embedded in enterprise strategy. Targets shape portfolio management, supplier relationships, and innovation agendas. Reporting is assured and trusted, and insights drive enterprise-wide transformation. Organisations are recognised externally for shaping standards and influencing regulation.",
  },
  governance: {
    Initial:
      "Responsibilities for digital sustainability are unclear. Governance forums rarely consider the issue, and decision-making is reactive. Reporting is minimal, fragmented, or siloed across teams, with no line of accountability.",
    Emerging:
      "Partial accountability is introduced, usually within ESG or IT functions. Governance forums occasionally include sustainability, but scope and coverage are inconsistent. Reporting is irregular, accuracy is questionable, and assurance is absent.",
    Established:
      "Governance processes now include sustainability checkpoints, with named roles for digital emissions. Reporting occurs periodically with clearer scope, though data quality and granularity vary. Engagement between IT, finance, and procurement is emerging but not yet consistent.",
    Optimised:
      "Governance and management processes are structured and outcome-focused. Metrics are reconciled with financial and operational data and reviewed in senior forums. Cross-functional teams work to a shared roadmap, and insights are used to prioritise programmes and allocate resources.",
    Leading:
      "Governance is comprehensive and transparent. Reporting is independently validated and embedded in risk and performance frameworks. Accountability for outcomes is distributed across the enterprise, and the organisation actively shapes external practice through credible disclosure and collaboration.",
  },
  financial: {
    Initial:
      "Cost management is largely reactive, focused on invoices and broad budget lines. There is little to no service-based costing or allocation to business units. Forecasting and budgeting are manual, often spreadsheet-based, and disconnected from operational data. Sustainability metrics are not part of cost models.",
    Emerging:
      "Basic cost allocation begins, usually by department or high-level service categories. Forecasting is ad hoc, often relying on historic run-rate. Sustainability is mentioned but not structured into reporting. Cross-functional engagement between IT and finance is limited, and reporting outputs are not trusted for decision-making.",
    Established:
      "A service-based cost model is defined and applied across much of the IT estate. Forecasting is more systematic and reviewed quarterly. Sustainability metrics are linked to cost centres in selected areas (e.g. cloud, data centre). Cross-functional analysis occurs, but methods are still inconsistent, and reporting outputs are more descriptive than decision-oriented.",
    Optimised:
      "Financial and sustainability data are reconciled and integrated into TBM and FinOps tooling. Forecasting and budgeting use automated data feeds with increasing accuracy. Cost allocation is granular, supporting cross-functional analysis across sourcing models, environments, and services. Reports are used in governance forums to prioritise investments, manage demand, and optimise portfolios.",
    Leading:
      "Financial and sustainability models are fully integrated into service management, TBM, and FinOps processes. Forecasting is dynamic, scenario-based, and automated. Allocation is accurate to workload and business-unit level, with sustainability impact reported alongside cost and performance. Governance decisions are driven by integrated data, and the organisation is externally recognised for advancing best practice in sustainable financial management.",
  },
  supply_chain: {
    Initial:
      "Supplier decisions are based on cost and service. Sustainability information is not requested, and lifecycle impacts of IT procurement are not understood.",
    Emerging:
      "Basic requests for sustainability statements or certifications are made to selected suppliers. Responses are inconsistent, unverified, and lack comparability, limiting usefulness.",
    Established:
      "Procurement policies embed sustainability criteria, and major suppliers are required to provide product carbon footprints or equivalent data. Reporting quality improves, but supplier performance management and escalation are inconsistent.",
    Optimised:
      "Supply chain governance integrates sustainability with cost, risk, and resilience. Data is collected to standard formats, reviewed in supplier forums, and backed by assurance. Targets and improvement plans are agreed, and performance informs category strategy.",
    Leading:
      "Supply chains are proactively shaped to meet sustainability outcomes. Suppliers are held to transparent requirements, collaborative improvement programmes are embedded, and results are assured. Organisations are recognised externally for advancing market standards and driving systemic change.",
  },
  data_centre: {
    Initial:
      "Data centre operations are managed primarily for cost and resilience. Energy, water, and emissions are not measured, and facilities, IT, and finance operate in silos. No baseline exists to support investment or risk decisions.",
    Emerging:
      "Organisations begin requesting basic metrics such as PUE from providers, often reactively. Reporting is patchy, lacks assurance, and offers little granularity. Facilities and IT interact occasionally, but engagement is limited and sustainability references in contracts carry no weight.",
    Established:
      "More systematic reporting emerges, often referencing standardised metrics such as those mandated by ISO 30134 or equivalent frameworks. Metrics like PUE, WUE, and CUE inform portfolio discussions, although reliance on vendor data is high. Engagement between functions improves, but application is inconsistent.",
    Optimised:
      "Data centre management is integrated across facilities, IT, and finance, with sustainability treated as a shared responsibility. Standardised metrics such as those mandated by ISO 30134 and equivalent frameworks are tracked with greater frequency and granularity. Reporting is automated and reconciled with cost and operational data. Cross-functional teams use insights to deliver optimisation programmes and apply sustainability criteria consistently in site selection and capacity planning.",
    Leading:
      "At this level, data centres are managed as strategic sustainability assets. Metrics are comprehensive, independently validated, and disclosed transparently. Continuous optimisation is embedded in day-to-day operations, with cross-functional teams working alongside providers to drive innovation. The organisation should typically be recognised externally as a benchmark for sustainable digital infrastructure and contributes to shaping industry standards.",
  },
  core_infrastructure: {
    Initial:
      "Infrastructure such as servers, storage, and networks is generally managed for cost and performance, with limited visibility of energy use or efficiency. Sustainability criteria are not applied, and data on utilisation is often incomplete or unavailable.",
    Emerging:
      "Early monitoring pilots begin, usually focused on energy use or utilisation within selected estates. Procurement discussions sometimes reference sustainability, but criteria are not applied consistently in refresh cycles or design decisions. Data sits in isolated tools and is rarely used in governance forums.",
    Established:
      "Efficiency and utilisation metrics are collected more systematically across much of the estate. Procurement increasingly references sustainability requirements, and initiatives such as consolidation and virtualisation deliver measurable reductions in waste. However, reporting quality and coverage still vary between platforms.",
    Optimised:
      "Infrastructure telemetry is automated and linked with CMDB, cost, and service data. Refresh cycles take both efficiency and embodied impact into account, and capacity planning balances performance, cost, and environmental objectives. Cross-functional governance helps align decisions across IT, finance, and architecture.",
    Leading:
      "Infrastructure operations are closely aligned with sustainability strategy. Lifecycle management and supplier engagement are mature, with advanced optimisation embedded in day-to-day operations. Reporting is granular, independently assured, and used externally to demonstrate leadership in sustainable infrastructure.",
  },
  ai_compute: {
    Initial:
      "AI and high-performance compute are deployed without sustainability guardrails. Energy and water use are not measured, demand is unmanaged, and functions operate in isolation.",
    Emerging:
      "Early exploration of dashboards and calculators takes place, but usage is inconsistent. Awareness of impact is growing, yet policies and controls are not defined. Reporting is limited, accuracy is low, and data cannot support confident decisions.",
    Established:
      "Governance begins to incorporate sustainability. Energy and emissions data are used in discussions on model choice and placement, and guardrails are documented, although application varies by team. Leadership is aware of risks but optimisation is not routine.",
    Optimised:
      "Advanced compute workloads are governed by defined policies. Monitoring is integrated with cost and performance data. Scheduling, model selection, and placement decisions balance efficiency with business requirements, and results are reviewed in senior forums.",
    Leading:
      "AI and HPC are managed through sustainability-first policies. Telemetry is real-time, procurement requires transparency, and emissions are attributed to business units. Insights inform incentives, portfolio strategy, and external commitments. Organisations are recognised for leadership in responsible and efficient AI.",
  },
  cloud_ops: {
    Initial:
      "Cloud adoption is primarily cost- and agility-driven. Sustainability considerations are absent from workload placement and architectural design. Tagging is incomplete, making it difficult to allocate usage or emissions to business units. Data on energy or emissions is not collected or reported.",
    Emerging:
      "Organisations begin experimenting with hyperscaler calculators and dashboards. Awareness of cloud emissions grows, but reporting is inconsistent, not reconciled with cost or performance data, and usually limited to pilot teams. Sustainability is discussed but not yet embedded in governance or cloud policies.",
    Established:
      "Cloud sustainability metrics are increasingly integrated into FinOps and operational dashboards. Standards for tagging, rightsizing, and workload optimisation are defined, though compliance is uneven across teams. Some workload placement decisions consider environmental impact, but adoption is inconsistent and driven by local champions rather than enterprise policy.",
    Optimised:
      "Sustainability becomes embedded in cloud operating models. Metrics are reconciled with cost and service data and are reviewed in senior governance forums. Workload placement follows structured principles for region, service type, and configuration. Optimisation routines are automated, and insights are actively used to manage demand and inform budget planning.",
    Leading:
      "Cloud operations are fully aligned with GreenOps practices. Decisions balance cost, performance, risk, and sustainability through automated optimisation. Procurement and architecture influence provider roadmaps and demand greater transparency. Reporting is independently assured and used to demonstrate leadership in sustainable cloud to regulators, investors, and peers.",
  },
  software_dev: {
    Initial:
      "Software delivery prioritises functionality and speed, with no consideration of sustainability. Development and test environments are oversized, unmanaged, and emissions are invisible.",
    Emerging:
      "Experiments in efficient coding or sustainable design appear in isolated teams. There is no standard, measurement framework, or cross-team sharing. Data, where it exists, is anecdotal and not actionable.",
    Established:
      "Coding standards begin to reference sustainability. Development and test environments measure energy or emissions in selected areas, and results influence design decisions in some teams. Reporting is still uneven and often siloed.",
    Optimised:
      "Sustainability is integrated into the software lifecycle. Measurement is consistent across phases, results are reviewed in governance gates, and release decisions balance environmental and business criteria. Teams are accountable for both efficiency and delivery outcomes.",
    Leading:
      "Sustainable software is part of organisational culture. Continuous measurement and improvement are applied across the lifecycle, linked to incentives and product outcomes. Organisations contribute to standards and open-source tooling, and are recognised externally for leadership.",
  },
  end_user: {
    Initial:
      "Device and service management is driven by fixed refresh cycles and cost. Embodied emissions, lifecycle impacts, and circularity are not tracked. Procurement is transactional and fragmented across teams.",
    Emerging:
      "Pilots in reuse, refurbishment, or recycling emerge. Procurement sometimes references ecolabels or certifications, but adoption is inconsistent and unaudited. Data is scattered across ITAM, service desks, and suppliers.",
    Established:
      "Procurement criteria increasingly include sustainability data. Refresh cycles are optimised in some areas, and lifecycle emissions are estimated with improving accuracy. Reporting is periodic but not reconciled with finance or HR systems.",
    Optimised:
      "Lifecycle management is embedded. Devices are redeployed, reused, or recycled as standard. Telemetry informs refresh and usage, and reporting is reconciled to asset and financial data. Cross-functional teams use insights to reduce demand and extend lifecycles.",
    Leading:
      "Full lifecycle traceability is achieved. Circular practices and supplier engagement are embedded, and results are externally validated. Insights shape user behaviour, procurement, and investment, and organisations are recognised for setting benchmarks in sustainable end-user services.",
  },
};
