import { useState } from 'react';

const VALID_PASSWORD = 'Posetiv';

export default function PasswordGate({ children }) {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem('greenops-auth') === 'true'
  );
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (password === VALID_PASSWORD) {
      sessionStorage.setItem('greenops-auth', 'true');
      setAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect access code. Please try again.');
      setPassword('');
    }
  }

  if (authenticated) {
    return children;
  }

  return (
    <div className="min-h-screen bg-navy relative overflow-hidden flex items-center justify-center px-6">
      {/* Decorative teal accent — angled stripes (matching Welcome hero) */}
      <div className="absolute -right-20 top-0 w-[600px] h-full bg-teal/[0.06] -skew-x-12 origin-top-right" />
      <div className="absolute -right-40 top-0 w-[300px] h-full bg-teal/[0.04] -skew-x-12 origin-top-right" />
      {/* Left-side subtle accent */}
      <div className="absolute -left-32 bottom-0 w-[400px] h-full bg-teal/[0.03] skew-x-12 origin-bottom-left" />

      {/* Top teal gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal/60 via-teal to-teal/60" />

      <div className="relative w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-10">
          <p className="text-teal-light text-xs font-bold tracking-[0.25em] uppercase mb-6">
            TBM Council &nbsp;|&nbsp; GreenOps Practice
          </p>

          {/* Title lockup — matching Welcome hero style */}
          <div className="mb-4">
            <h1 className="font-georgia text-white text-3xl sm:text-4xl md:text-5xl leading-[1.1] mb-2">
              <span className="text-teal">GreenOps</span> Maturity
            </h1>
            <h1 className="font-georgia text-white text-3xl sm:text-4xl md:text-5xl leading-[1.1]">
              Assessment
            </h1>
            {/* Teal accent underline */}
            <div className="mt-4 mx-auto w-20 h-1 rounded-full bg-teal" />
          </div>

          <p className="text-gray-400 text-sm mt-6">
            Enter the access code to continue
          </p>
        </div>

        {/* Password form */}
        <form onSubmit={handleSubmit} className="bg-white/[0.07] backdrop-blur rounded-xl p-8 border border-white/10 shadow-2xl">
          <div className="mb-5">
            <label htmlFor="accessCode" className="block text-gray-300 text-sm font-bold mb-2 tracking-wide">
              Access Code
            </label>
            <input
              id="accessCode"
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent transition-all duration-150"
              placeholder="Enter access code"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-teal hover:bg-teal-dark text-white font-bold font-lato py-3 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2"
          >
            Continue
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </form>

        {/* Badge — preview status */}
        <div className="flex justify-center mt-8">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-5 py-2.5">
            <svg className="w-4 h-4 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-gray-300 text-xs font-bold">Preview Access Only</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6 italic leading-relaxed">
          This assessment is currently in preview.<br />
          Contact the TBM Council GreenOps Practice for access.
        </p>
      </div>

      {/* Bottom teal gradient bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal/60 via-teal to-teal/60" />
    </div>
  );
}
