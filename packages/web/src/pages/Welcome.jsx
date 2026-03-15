import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '../context/AssessmentContext';
import { INDUSTRY_SECTORS, SIZE_BANDS } from '../data/domains';

export default function Welcome() {
  const { organisation, setOrganisation } = useAssessment();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [sizeBand, setSizeBand] = useState('');
  const [region, setRegion] = useState('');
  const [respondentName, setRespondentName] = useState('');

  // Pre-fill if organisation is already set (returning user)
  useEffect(() => {
    if (organisation) {
      setName(organisation.name || '');
      setSector(organisation.sector || '');
      setSizeBand(organisation.sizeBand || '');
      setRegion(organisation.region || '');
      setRespondentName(organisation.respondentName || '');
    }
  }, [organisation]);

  function handleSubmit(e) {
    e.preventDefault();
    setOrganisation({ name, sector, sizeBand, region, respondentName });
    navigate('/assess');
  }

  return (
    <div className="min-h-screen bg-content-bg">
      {/* Hero section */}
      <div className="relative overflow-hidden">
        {/* Navy background with subtle gradient */}
        <div className="absolute inset-0 bg-navy" />
        {/* Decorative teal accent — angled stripe */}
        <div className="absolute -right-20 top-0 w-[600px] h-full bg-teal/[0.06] -skew-x-12 origin-top-right" />
        <div className="absolute -right-40 top-0 w-[300px] h-full bg-teal/[0.04] -skew-x-12 origin-top-right" />

        <div className="relative max-w-4xl mx-auto px-6 pt-12 pb-16 text-center">
          {/* TBM Council branding */}
          <p className="text-teal-light text-xs font-bold tracking-[0.25em] uppercase mb-6">
            TBM Council &nbsp;|&nbsp; GreenOps Practice
          </p>

          {/* Title lockup */}
          <div className="mb-8">
            <h1 className="font-georgia text-white text-4xl sm:text-5xl md:text-6xl leading-[1.1] mb-3">
              <span className="text-teal">GreenOps</span> Maturity
            </h1>
            <h1 className="font-georgia text-white text-4xl sm:text-5xl md:text-6xl leading-[1.1]">
              Assessment
            </h1>
            {/* Teal accent underline */}
            <div className="mt-4 mx-auto w-24 h-1 rounded-full bg-teal" />
          </div>

          {/* Tagline */}
          <p className="font-georgia text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-8 italic">
            Digital sustainability maturity varies widely. Most organisations overestimate where they are.
          </p>

          {/* Body copy */}
          <p className="text-gray-400 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed mb-5">
            Strategy commitments rarely survive contact with operational reality. Digital
            sustainability spans every layer of how you run IT — from governance, procurement,
            infrastructure, cloud, AI, software, and end-user services — with gaps in any one
            area creating cost, compliance risk, and reputational exposure.
          </p>

          <p className="text-gray-400 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed mb-10">
            This diagnostic assesses your organisation across ten operational
            domains, from board-level strategy to device end-of-life. The output is not a score — it
            is a structured evidence base for prioritising action and making the case for investment.
          </p>

          {/* Time estimate + domain count badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
            <div className="inline-flex items-center gap-2 bg-teal/15 border border-teal/30 rounded-full px-5 py-2.5">
              <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-white text-sm font-bold">10 Domains &middot; 184 Questions</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-5 py-2.5">
              <svg className="w-5 h-5 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white text-sm font-bold">~2–4 hours across your team</span>
            </div>
          </div>
        </div>

        {/* Bottom teal accent bar */}
        <div className="relative h-1 bg-gradient-to-r from-teal/60 via-teal to-teal/60" />
      </div>

      {/* What you get section */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Card 1 */}
          <div className="bg-white rounded-lg border border-card-border p-6">
            <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-georgia text-navy font-bold text-base mb-2">
              10 Domains, 184 Questions
            </h3>
            <p className="text-sm text-muted-text leading-relaxed">
              From strategy and governance to data centres, cloud, AI, software
              development, and end-user services.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-lg border border-card-border p-6">
            <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-georgia text-navy font-bold text-base mb-2">
              Designed for Teams
            </h3>
            <p className="text-sm text-muted-text leading-relaxed">
              Each person answers the areas they know best — so the picture is
              organisationally valid, not one person's best guess.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-lg border border-card-border p-6">
            <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-georgia text-navy font-bold text-base mb-2">
              Actionable Results
            </h3>
            <p className="text-sm text-muted-text leading-relaxed">
              Domain-by-domain scoring, maturity profiling, gap analysis, and structured
              commentary — downloadable as a PDF report.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-lg border border-card-border p-8 mb-12">
          <h2 className="font-georgia text-xl text-navy mb-6 text-center">How It Works</h2>
          <div className="grid sm:grid-cols-4 gap-6 text-center">
            <div>
              <div className="w-8 h-8 rounded-full bg-navy text-white font-bold text-sm flex items-center justify-center mx-auto mb-3">1</div>
              <p className="text-sm text-body-text font-bold mb-1">Register</p>
              <p className="text-xs text-muted-text">Enter your organisation details below</p>
            </div>
            <div>
              <div className="w-8 h-8 rounded-full bg-navy text-white font-bold text-sm flex items-center justify-center mx-auto mb-3">2</div>
              <p className="text-sm text-body-text font-bold mb-1">Assess</p>
              <p className="text-xs text-muted-text">Answer questions across 10 sustainability domains</p>
            </div>
            <div>
              <div className="w-8 h-8 rounded-full bg-navy text-white font-bold text-sm flex items-center justify-center mx-auto mb-3">3</div>
              <p className="text-sm text-body-text font-bold mb-1">Review</p>
              <p className="text-xs text-muted-text">See your scores, maturity levels, and radar profile</p>
            </div>
            <div>
              <div className="w-8 h-8 rounded-full bg-teal text-white font-bold text-sm flex items-center justify-center mx-auto mb-3">4</div>
              <p className="text-sm text-body-text font-bold mb-1">Export</p>
              <p className="text-xs text-muted-text">Download your full report as PDF, CSV, or JSON</p>
            </div>
          </div>
        </div>

        {/* Registration form — always visible */}
        <div className="max-w-2xl mx-auto mb-12" id="registration-form">
          <div className="bg-white rounded-lg border border-card-border p-8">
            <h2 className="font-georgia text-xl text-navy mb-1">Organisation Details</h2>
            <p className="text-sm text-muted-text mb-6">
              Tell us about your organisation to get started.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Organisation Name */}
                <div>
                  <label htmlFor="orgName" className="section-label block mb-1">
                    Organisation Name
                  </label>
                  <input
                    id="orgName"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-card-border rounded px-3 py-2.5 font-lato text-sm text-body-text focus:outline-none focus:ring-2 focus:ring-teal"
                    placeholder="e.g. Acme Corporation"
                  />
                </div>

                {/* Sector */}
                <div>
                  <label htmlFor="sector" className="section-label block mb-1">
                    Sector
                  </label>
                  <select
                    id="sector"
                    required
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full border border-card-border rounded px-3 py-2.5 font-lato text-sm text-body-text focus:outline-none focus:ring-2 focus:ring-teal bg-white"
                  >
                    <option value="">Select a sector...</option>
                    {INDUSTRY_SECTORS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Size Band */}
                <div>
                  <label htmlFor="sizeBand" className="section-label block mb-1">
                    Size Band
                  </label>
                  <select
                    id="sizeBand"
                    required
                    value={sizeBand}
                    onChange={(e) => setSizeBand(e.target.value)}
                    className="w-full border border-card-border rounded px-3 py-2.5 font-lato text-sm text-body-text focus:outline-none focus:ring-2 focus:ring-teal bg-white"
                  >
                    <option value="">Select organisation size...</option>
                    {SIZE_BANDS.map((sb) => (
                      <option key={sb} value={sb}>{sb}</option>
                    ))}
                  </select>
                </div>

                {/* Region */}
                <div>
                  <label htmlFor="region" className="section-label block mb-1">
                    Region
                  </label>
                  <input
                    id="region"
                    type="text"
                    required
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full border border-card-border rounded px-3 py-2.5 font-lato text-sm text-body-text focus:outline-none focus:ring-2 focus:ring-teal"
                    placeholder="e.g. UK, North America"
                  />
                </div>

                {/* Respondent Name */}
                <div>
                  <label htmlFor="respondentName" className="section-label block mb-1">
                    Respondent Name
                  </label>
                  <input
                    id="respondentName"
                    type="text"
                    required
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    className="w-full border border-card-border rounded px-3 py-2.5 font-lato text-sm text-body-text focus:outline-none focus:ring-2 focus:ring-teal"
                    placeholder="Your full name"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full bg-teal hover:bg-teal-dark text-white font-bold font-lato py-3 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2"
                >
                  Begin Assessment
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </form>
            </div>
        </div>

        {/* Footer disclaimer */}
        <div className="text-center pb-8">
          <p className="text-xs text-muted-text italic leading-relaxed max-w-xl mx-auto">
            A diagnostic service from the TBM Council GreenOps Practice.
            Your responses are confidential and will be used to generate your
            organisation's maturity assessment report.
          </p>
        </div>
      </div>
    </div>
  );
}
