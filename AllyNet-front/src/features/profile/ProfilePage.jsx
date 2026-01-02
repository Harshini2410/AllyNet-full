import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    helped: 0,
    requested: 0,
    sosAlerts: 0,
    reports: 0
  });
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
            helped: response.data.helped || 0,
            requested: response.data.requested || 0,
            sosAlerts: response.data.sosAlerts || 0,
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
    { label: 'Helped', value: stats.helped.toString(), color: 'text-sage-500' },
    { label: 'Requested', value: stats.requested.toString(), color: 'text-amber-500' },
    { label: 'SOS Alerts', value: stats.sosAlerts.toString(), color: 'text-coral-500' },
    { label: 'Reports', value: stats.reports.toString(), color: 'text-red-500' },
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
        <div className="mt-6 grid grid-cols-2 gap-6 w-full max-w-xs">
          {statsDisplay.map((stat, i) => (
            <div key={i} className="text-center">
              <span className={cn("block text-xl font-bold", stat.color)}>{loading ? '...' : stat.value}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal-200 dark:text-sand-400">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </Card>

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

export default ProfilePage;


