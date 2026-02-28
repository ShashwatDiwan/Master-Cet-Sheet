import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // if already logged in, send to dashboard
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;

      let errorMessage = 'Login failed';

      if (status === 403 || status === 401) {
        errorMessage = 'Invalid email or password. Please check and try again.';
      } else if (status === 404) {
        errorMessage = 'Account not found. Please register to create an account.';
      } else if (status === 400) {
        errorMessage = 'Email and password are required.';
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (data?.message) {
        errorMessage = data.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = () => {
    // Clear error when user starts typing
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <div className="max-w-md w-full bg-gradient-to-br from-[#0f1724] to-[#1a2332] p-8 rounded-xl border border-zinc-700/50 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">ES</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Sign in to your account</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
            {(error.includes('not found') || error.includes('register')) && (
              <p className="text-red-400/80 text-xs mt-2">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="underline font-semibold hover:text-red-300 transition"
                >
                  Register here
                </button>
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                handleInputChange();
              }}
              placeholder="you@example.com"
              required
              className="w-full bg-zinc-800/50 border border-zinc-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-zinc-800 transition"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                handleInputChange();
              }}
              placeholder="••••••••"
              required
              className="w-full bg-zinc-800/50 border border-zinc-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-zinc-800 transition"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-700/50 text-center">
          <p className="text-zinc-400 text-sm">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-blue-400 hover:text-blue-300 font-semibold transition"
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
