import React, { useState } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { 
  ShieldCheck, 
  Award, 
  History, 
  Settings, 
  ChevronRight,
  TrendingUp,
  Heart,
  MessageSquare,
  Building2,
  CreditCard,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OrganizationView from './OrganizationView';
import PaymentsView from './PaymentsView';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils';

const ProfileView = () => {
  const [subView, setSubView] = useState(null); // null, 'org', 'payments'
  const authUser = useAuthStore((state) => state.user);

  // Derive name from user profile
  const firstName = authUser?.profile?.firstName || '';
  const lastName = authUser?.profile?.lastName || '';
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || authUser?.email?.split('@')[0] || 'User';
  const initials = firstName && lastName 
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : firstName 
      ? firstName[0].toUpperCase() 
      : lastName 
        ? lastName[0].toUpperCase()
        : authUser?.email?.[0]?.toUpperCase() || 'U';

  const user = {
    name: fullName,
    trustScore: authUser?.trustScore || 0,
    contributions: 42, // TODO: Get from actual user data
    emergenciesResolved: 3, // TODO: Get from actual user data
    kycStatus: authUser?.verification?.status === 'verified' ? 'Verified' : 'Unverified',
  };

  if (subView) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSubView(null)}
          className="flex items-center gap-2 text-charcoal-300 hover:text-charcoal-500 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-bold">Back to Profile</span>
        </button>
        {subView === 'org' && <OrganizationView />}
        {subView === 'payments' && <PaymentsView />}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Profile Header */}
      <div className="flex flex-col items-center py-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-[2rem] bg-sage-200 border-4 border-white shadow-xl flex items-center justify-center text-3xl font-bold text-sage-700">
            {initials}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-sand-100 text-sage-600">
            <ShieldCheck size={20} />
          </div>
        </div>
        <h2 className="mt-4 text-2xl font-display text-charcoal-500">{user.name}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-sage-600 bg-sage-50 px-3 py-1 rounded-full">
            {user.kycStatus} Member
          </span>
        </div>
      </div>

      {/* Trust Score Card */}
      <Card className="bg-gradient-to-br from-charcoal-500 to-charcoal-800 text-white border-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Community Trust Score</p>
            <Award className="text-amber-400" size={24} />
          </div>
          
          <div className="flex items-end gap-2 mb-4">
            <span className="text-5xl font-display font-bold leading-none">{user.trustScore}</span>
            <span className="text-white/40 text-sm mb-1">/ 1000</span>
          </div>

          <div className="w-full h-2 bg-white/10 rounded-full mb-4 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(user.trustScore / 1000) * 100}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-400 to-sage-400"
            />
          </div>

          <p className="text-xs text-white/60">You are in the top 5% of trusted helpers in your area.</p>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          icon={Heart} 
          label="Helped" 
          value={user.contributions} 
          color="text-rose-500" 
          bg="bg-rose-50" 
        />
        <StatCard 
          icon={TrendingUp} 
          label="Impact" 
          value="High" 
          color="text-sage-600" 
          bg="bg-sage-50" 
        />
      </div>

      {/* Action List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal-200 mt-4 mb-2">Activities & Settings</h3>
        <ProfileActionItem icon={History} label="Emergency History" count={3} />
        <ProfileActionItem icon={Building2} label="Organization Dashboard" onClick={() => setSubView('org')} />
        <ProfileActionItem icon={CreditCard} label="Payments & Plans" onClick={() => setSubView('payments')} />
        <ProfileActionItem icon={Settings} label="Safety Settings" />
      </div>

      <Button variant="outline" className="w-full py-4 text-charcoal-300 border-sand-200 hover:bg-sand-50">
        Log Out
      </Button>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <Card className="flex items-center gap-4 p-4">
    <div className={cn('p-3 rounded-2xl', bg, color)}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal-200">{label}</p>
      <p className="text-lg font-bold text-charcoal-500 leading-tight">{value}</p>
    </div>
  </Card>
);

const ProfileActionItem = ({ icon: Icon, label, count, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-5 bg-white rounded-3xl border border-sand-200 hover:border-sage-200 transition-all group"
  >
    <div className="flex items-center gap-4">
      <div className="p-2 bg-sand-100 rounded-xl text-charcoal-300 group-hover:bg-sage-50 group-hover:text-sage-600 transition-colors">
        <Icon size={20} />
      </div>
      <span className="text-sm font-semibold text-charcoal-500">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {count && <span className="text-xs font-bold text-charcoal-200">{count}</span>}
      <ChevronRight size={18} className="text-charcoal-200" />
    </div>
  </button>
);

export default ProfileView;
