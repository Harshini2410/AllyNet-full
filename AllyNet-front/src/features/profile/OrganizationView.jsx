import React from 'react';
import Card from '../../components/Card';
import { 
  Users, 
  ShieldAlert, 
  BarChart3, 
  CreditCard, 
  ChevronRight,
  MapPin,
  Clock
} from 'lucide-react';
import Button from '../../components/Button';

const OrganizationView = () => {
  const stats = [
    { label: 'Total Members', value: '1,240', icon: Users, color: 'text-sage-600' },
    { label: 'Active Alerts', value: '0', icon: ShieldAlert, color: 'text-coral-500' },
    { label: 'Help Requests', value: '12', icon: BarChart3, color: 'text-amber-500' },
  ];

  const members = [
    { name: 'Alex Rivera', role: 'Security Lead', status: 'Online', id: 'm1' },
    { name: 'Sarah Jenkins', role: 'Safety Officer', status: 'Offline', id: 'm2' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display text-charcoal-500">Org Dashboard</h2>
          <p className="text-xs text-charcoal-300">Oakridge Apartment Complex</p>
        </div>
        <div className="px-3 py-1 bg-sage-50 text-sage-600 text-[10px] font-bold rounded-full uppercase">Premium Plan</div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, i) => (
          <Card key={i} className="p-3 flex flex-col items-center text-center">
            <stat.icon size={18} className={stat.color} />
            <p className="text-[10px] font-bold text-charcoal-200 mt-2 uppercase">{stat.label}</p>
            <p className="text-lg font-bold text-charcoal-500">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Subscription Card */}
      <Card className="bg-sand-200 border-0 flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl text-charcoal-500">
            <CreditCard size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-charcoal-500">Subscription Status</p>
            <p className="text-[10px] text-charcoal-300">Next renewal: Jan 12, 2026</p>
          </div>
        </div>
        <Button variant="ghost" className="text-xs p-2">Manage</Button>
      </Card>

      {/* Emergency Overview */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal-200">Recent Emergencies</h3>
        <Card className="p-4 flex gap-4 items-center border-l-4 border-l-coral-500">
          <div className="p-3 bg-coral-50 text-coral-500 rounded-2xl">
            <ShieldAlert size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-charcoal-500">Medical - Unit 402</h4>
            <p className="text-xs text-charcoal-300">Resolved by First Aid Team</p>
          </div>
          <span className="text-[10px] text-charcoal-200">2h ago</span>
        </Card>
      </section>

      {/* Members List */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal-200">Safety Team</h3>
          <button className="text-sage-600 text-xs font-bold">Add Member</button>
        </div>
        <div className="space-y-2">
          {members.map(member => (
            <div key={member.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-sand-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sand-100 flex items-center justify-center text-xs font-bold text-charcoal-300">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-bold text-charcoal-500">{member.name}</p>
                  <p className="text-[10px] text-charcoal-300">{member.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${member.status === 'Online' ? 'bg-sage-500' : 'bg-sand-300'}`} />
                <span className="text-[10px] font-bold text-charcoal-200">{member.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default OrganizationView;


