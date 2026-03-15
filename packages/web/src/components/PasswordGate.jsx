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
    <div className="min-h-screen bg-navy flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-10">
          <p className="text-teal-light text-xs font-bold tracking-[0.25em] uppercase mb-6">
            TBM Council &nbsp;|&nbsp; GreenOps Practice
          </p>
          <h1 className="font-georgia text-white text-2xl sm:text-3xl leading-tight mb-3">
            GreenOps Maturity Assessment
          </h1>
          <p className="text-gray-400 text-sm">
            Enter the access code to continue
          </p>
        </div>

        {/* Password form */}
        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur rounded-xl p-8 border border-white/10">
          <div className="mb-5">
            <label htmlFor="accessCode" className="block text-gray-300 text-sm font-bold mb-2">
              Access Code
            </label>
            <input
              id="accessCode"
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
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
            className="w-full bg-teal hover:bg-teal-dark text-white font-bold font-lato py-3 rounded-lg transition-colors duration-150"
          >
            Continue
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-8 italic">
          This assessment is currently in preview. Contact the TBM Council GreenOps Practice for access.
        </p>
      </div>
    </div>
  );
}
