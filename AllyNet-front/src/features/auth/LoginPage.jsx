import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, User } from 'lucide-react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../api/auth';

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.login(email, password);
      
      // Extract user and tokens from nested response structure
      // Backend returns: { success: true, data: { user, tokens: { accessToken, refreshToken } } }
      const accessToken = response?.data?.tokens?.accessToken;
      const refreshToken = response?.data?.tokens?.refreshToken;
      const user = response?.data?.user;
      
      // Validate response structure
      if (!accessToken || !user) {
        throw new Error('Invalid response from server');
      }
      
      // Update Zustand auth store with user and tokens FIRST
      login(accessToken, refreshToken || null, user);
      
      // Navigate to home page after successful login
      navigate('/', { replace: true });
    } catch (err) {
      // Handle error response from API
      if (err.message) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
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
            Welcome Back
          </h1>
          <p className="text-charcoal-300 dark:text-sand-400">
            Sign in to access your safety network
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 rounded-2xl text-sm text-coral-600 dark:text-coral-400">
                {error}
              </div>
            )}

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
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-charcoal-300 dark:text-sand-400">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/auth/signup')}
                className="text-sage-600 dark:text-sage-400 font-bold hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;

