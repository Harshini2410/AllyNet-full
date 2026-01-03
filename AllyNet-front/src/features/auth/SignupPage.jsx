import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, User } from 'lucide-react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../api/auth';

const SignupPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.signup(email, password, name);
      
      // Extract user and tokens from nested response structure
      // Backend returns: { success: true, data: { user, tokens: { accessToken, refreshToken } } }
      const accessToken = response?.data?.tokens?.accessToken;
      const refreshToken = response?.data?.tokens?.refreshToken;
      const user = response?.data?.user;
      
      // Only auto-login if backend returns tokens
      if (accessToken && user) {
        login(accessToken, refreshToken || null, user);
        navigate('/', { replace: true });
      } else {
        // If no tokens, redirect to login
        setError('Account created successfully. Please sign in.');
        setTimeout(() => navigate('/auth/login'), 2000);
      }
    } catch (err) {
      const errorMessage = err.message || 'Signup failed. Please try again.';
      if (errorMessage.includes('already exists') || errorMessage.includes('Account already exists')) {
        setError('Account already exists. Please sign in.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand-100 dark:bg-charcoal-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-sage-500 rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-6">
            <Shield size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-charcoal-500 dark:text-sand-50 mb-2">
            Join AllyNet
          </h1>
          <p className="text-charcoal-300 dark:text-sand-400">
            Create your account to get started
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 rounded-2xl text-sm text-coral-600 dark:text-coral-400">
                {error}
                {error.includes('already exists') && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => navigate('/auth/login')}
                      className="text-coral-700 dark:text-coral-300 font-bold hover:underline"
                    >
                      Sign in instead →
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-sage-600 dark:text-sage-400 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-300 dark:text-sand-500" size={18} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-charcoal-800 border border-sand-200 dark:border-charcoal-700 rounded-2xl text-charcoal-500 dark:text-sand-50 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                  placeholder="Jane Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-sage-600 dark:text-sage-400 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-300 dark:text-sand-500" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-charcoal-800 border border-sand-200 dark:border-charcoal-700 rounded-2xl text-charcoal-500 dark:text-sand-50 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-sage-600 dark:text-sage-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-300 dark:text-sand-500" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-charcoal-800 border border-sand-200 dark:border-charcoal-700 rounded-2xl text-charcoal-500 dark:text-sand-50 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-4 text-lg"
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-charcoal-300 dark:text-sand-400">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/auth/login')}
                className="text-sage-600 dark:text-sage-400 font-bold hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default SignupPage;

