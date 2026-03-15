import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', job_title: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister ? form : { email: form.email, password: form.password };
      const { data } = await api.post(endpoint, payload);

      localStorage.setItem('coordinator_token', data.token);
      localStorage.setItem('coordinator_user', JSON.stringify(data.user));

      if (data.user.role === 'consultant') {
        navigate('/consultant');
      } else {
        navigate('/assessment/new');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen flex items-center justify-center bg-content-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-navy">GreenOps Assessment</h1>
          <p className="text-muted-text mt-2">TBM Council Organisational Maturity Assessment</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-card-border p-8">
          <h2 className="text-xl font-bold text-navy mb-6">
            {isRegister ? 'Create Account' : 'Sign In'}
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-medium text-body-text mb-1">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={update('name')}
                    required
                    className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-body-text mb-1">Job Title</label>
                  <input
                    type="text"
                    value={form.job_title}
                    onChange={update('job_title')}
                    className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-body-text mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                required
                className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-body-text mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={update('password')}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-teal text-white font-bold rounded-md hover:bg-teal-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-sm text-teal hover:text-teal-dark"
            >
              {isRegister ? 'Already have an account? Sign in' : 'Need an account? Register'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
