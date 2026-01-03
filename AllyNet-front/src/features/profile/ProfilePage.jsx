import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Settings, 
  LogOut, 
  BadgeCheck, 
  HelpCircle, 
  History,
  ArrowRight
} from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import TrustScoreRing from './TrustScoreRing';
import ThemeToggle from '../../components/ThemeToggle';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../api/auth';
import { cn } from '../../utils';

const ProfilePage = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState({
    trustScore: 0,
    helped: { general: 0, emergency: 0, total: 0 },
    requested: { general: 0, emergency: 0, total: 0 },
    reports: 0
  });
  const [showBreakdown, setShowBreakdown] = useState(null); // 'helped' | 'requested' | null
  const [loading, setLoading] = useState(true);

  // Derive name from user profile
  const firstName = user?.profile?.firstName || '';
  const lastName = user?.profile?.lastName || '';
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || user?.email?.split('@')[0] || 'User';
  const initials = firstName && lastName 
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : firstName 
      ? firstName[0].toUpperCase() 
      : lastName 
        ? lastName[0].toUpperCase()
        : user?.email?.[0]?.toUpperCase() || 'U';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.getUserStats();
        if (response?.success && response?.data) {
          setStats({
            trustScore: response.data.trustScore || 0,
            helped: response.data.helped || { general: 0, emergency: 0, total: 0 },
            requested: response.data.requested || { general: 0, emergency: 0, total: 0 },
            reports: response.data.reports || 0
          });
        } else {
          // If response doesn't have expected structure, use defaults
          console.warn('Unexpected stats response format:', response);
        }
      } catch (err) {
        console.error('Error fetching user stats:', err);
        // Keep default stats on error
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const statsDisplay = [
    { 
      label: 'Helped', 
      value: stats.helped?.total?.toString() || '0', 
      color: 'text-sage-500',
      clickable: true,
      type: 'helped'
    },
    { 
      label: 'Requested', 
      value: stats.requested?.total?.toString() || '0', 
      color: 'text-amber-500',
      clickable: true,
      type: 'requested'
    },
    { 
      label: 'Reports', 
      value: stats.reports.toString(), 
      color: 'text-red-500',
      clickable: false
    },
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Profile Section */}
      <section className="flex flex-col items-center pt-8">
        <div className="relative group">
          <div className="w-24 h-24 rounded-[2.5rem] bg-sage-200 dark:bg-charcoal-700 border-4 border-white dark:border-charcoal-800 shadow-xl flex items-center justify-center text-3xl font-bold text-sage-700 dark:text-sage-400">
            {initials}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-charcoal-800 p-1.5 rounded-xl shadow-lg border border-sand-100 dark:border-charcoal-700 text-sage-600">
            <BadgeCheck size={18} />
          </div>
        </div>
        <h2 className="mt-4 text-2xl font-display font-semibold text-charcoal-500 dark:text-sand-50">{fullName}</h2>
        <p className="text-sm text-charcoal-300 dark:text-sand-400">
          {user?.email || 'Ally since Dec 2024'}
        </p>
      </section>

      {/* Trust Dashboard */}
      <Card className="flex flex-col items-center py-10 dark:bg-charcoal-800 dark:border-charcoal-700">
        <TrustScoreRing score={stats.trustScore} />
        <div className="mt-6 grid grid-cols-3 gap-4 w-full max-w-md">
          {statsDisplay.map((stat, i) => (
            <div 
              key={i} 
              className={cn(
                "text-center",
                stat.clickable && "cursor-pointer hover:opacity-80 transition-opacity"
              )}
              onClick={() => stat.clickable && setShowBreakdown(stat.type)}
            >
              <span className={cn("block text-xl font-bold", stat.color)}>{loading ? '...' : stat.value}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal-200 dark:text-sand-400">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Breakdown Modal */}
      <AnimatePresence>
        {showBreakdown && (
          <BreakdownModal
            type={showBreakdown}
            stats={stats}
            onClose={() => setShowBreakdown(null)}
          />
        )}
      </AnimatePresence>

      {/* Settings List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal-200 dark:text-sand-500 ml-4 mb-2">Preferences</h3>
        
        <SettingsItem 
          icon={MoonIcon} 
          label="Dark Mode" 
          action={<ThemeToggle />} 
        />
        
        <SettingsItem 
          icon={History} 
          label="Emergency History" 
          action={<ArrowRight size={18} className="text-charcoal-200" />}
          onClick={() => navigate('/emergency-history')}
        />
        
        <SettingsItem 
          icon={Settings} 
          label="Safety Settings" 
          action={<ArrowRight size={18} className="text-charcoal-200" />}
          onClick={() => navigate('/safety-settings')}
        />
        
        <SettingsItem 
          icon={HelpCircle} 
          label="Help Center" 
          action={<ArrowRight size={18} className="text-charcoal-200" />}
          onClick={() => navigate('/help-center')}
        />
      </div>

      {/* Logout */}
      <Button 
        variant="ghost" 
        className="w-full mt-4 text-coral-500 hover:bg-coral-50 dark:hover:bg-coral-900/10"
        onClick={handleLogout}
      >
        <LogOut size={18} className="mr-2" />
        Logout
      </Button>
    </div>
  );
};

const SettingsItem = ({ icon: Icon, label, action, onClick }) => (
  <Card 
    className={cn(
      "flex items-center justify-between p-4 dark:bg-charcoal-800 dark:border-charcoal-700 border-transparent bg-white shadow-sm",
      onClick && "cursor-pointer hover:bg-sand-50 dark:hover:bg-charcoal-700 transition-colors"
    )}
    onClick={onClick}
  >
    <div className="flex items-center gap-4">
      <div className="p-2 bg-sand-100 dark:bg-charcoal-700 text-charcoal-300 dark:text-sand-400 rounded-xl">
        <Icon size={20} />
      </div>
      <span className="text-sm font-medium text-charcoal-500 dark:text-sand-50">{label}</span>
    </div>
    {action}
  </Card>
);

const MoonIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const BreakdownModal = ({ type, stats, onClose }) => {
  const breakdown = type === 'helped' ? stats.helped : stats.requested;
  const title = type === 'helped' ? 'Helped Breakdown' : 'Requested Breakdown';
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display text-charcoal-500 dark:text-sand-50">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-sand-100 dark:hover:bg-charcoal-700 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-sage-50 dark:bg-sage-900/20 rounded-xl">
            <span className="text-sm font-medium text-charcoal-600 dark:text-sand-300">General</span>
            <span className="text-xl font-bold text-sage-600 dark:text-sage-400">
              {breakdown?.general || 0}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-coral-50 dark:bg-coral-900/20 rounded-xl">
            <span className="text-sm font-medium text-charcoal-600 dark:text-sand-300">Emergency</span>
            <span className="text-xl font-bold text-coral-600 dark:text-coral-400">
              {breakdown?.emergency || 0}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-charcoal-100 dark:bg-charcoal-700 rounded-xl border-2 border-charcoal-200 dark:border-charcoal-600">
            <span className="text-sm font-bold text-charcoal-700 dark:text-sand-200">Total</span>
            <span className="text-xl font-bold text-charcoal-700 dark:text-sand-200">
              {breakdown?.total || 0}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;


