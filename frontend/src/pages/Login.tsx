import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    if (error) setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full bg-card border border-border p-8 rounded-xl shadow-sm animate-fade-in-up">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground font-poppins">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to your account</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
            {(error.includes('not found') || error.includes('register')) && (
              <p className="text-destructive/80 text-xs mt-2">
                {"Don't have an account? "}
                <button
                  onClick={() => navigate('/register')}
                  className="underline font-semibold hover:text-destructive transition"
                >
                  Register here
                </button>
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                handleInputChange();
              }}
              placeholder="you@example.com"
              required
              className="w-full bg-background border border-input text-foreground px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition placeholder:text-muted-foreground"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                handleInputChange();
              }}
              placeholder="Enter your password"
              required
              className="w-full bg-background border border-input text-foreground px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition placeholder:text-muted-foreground"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-muted-foreground text-sm">
            {"Don't have an account? "}
            <button
              onClick={() => navigate('/register')}
              className="text-primary hover:text-primary/80 font-semibold transition"
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
