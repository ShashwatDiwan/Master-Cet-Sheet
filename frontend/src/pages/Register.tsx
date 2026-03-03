import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Register = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
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
      await register({ email, username, password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data || err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full bg-card border border-border p-8 rounded-xl shadow-sm animate-fade-in-up">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground font-poppins">Create Account</h2>
            <p className="text-sm text-muted-foreground">Join EbookStore's Master CET Sheet</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-destructive text-sm">{typeof error === 'string' ? error : 'Registration failed'}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); if (error) setError(null); }}
              placeholder="you@example.com"
              required
              className="w-full bg-background border border-input text-foreground px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition placeholder:text-muted-foreground"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); if (error) setError(null); }}
              placeholder="Choose a username"
              className="w-full bg-background border border-input text-foreground px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition placeholder:text-muted-foreground"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); if (error) setError(null); }}
              placeholder="Create a password"
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
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-muted-foreground text-sm">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-primary hover:text-primary/80 font-semibold transition"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
