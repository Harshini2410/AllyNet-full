import React, { useState } from 'react';
import { useMarketplaceStore } from '../../store/useMarketplaceStore';
import Card from '../../components/Card';
import { Star, MapPin, BadgeCheck, Search, Filter } from 'lucide-react';
import { cn } from '../../utils';

const DiscoveryView = () => {
  const [activeType, setActiveType] = useState('skills'); // skills or businesses
  const { skills, businesses } = useMarketplaceStore();

  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-200" size={18} />
          <input 
            type="text" 
            placeholder="Search skills, businesses..."
            className="w-full bg-white border border-sand-200 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500/20"
          />
        </div>
        <button className="p-3 bg-white border border-sand-200 rounded-2xl text-charcoal-300">
          <Filter size={20} />
        </button>
      </div>

      {/* Type Toggle */}
      <div className="flex p-1 bg-sand-200 rounded-2xl w-fit">
        <button
          onClick={() => setActiveType('skills')}
          className={cn(
            'px-6 py-2 rounded-xl text-xs font-bold transition-all',
            activeType === 'skills' ? 'bg-white text-charcoal-500 shadow-sm' : 'text-charcoal-300'
          )}
        >
          Individuals
        </button>
        <button
          onClick={() => setActiveType('businesses')}
          className={cn(
            'px-6 py-2 rounded-xl text-xs font-bold transition-all',
            activeType === 'businesses' ? 'bg-white text-charcoal-500 shadow-sm' : 'text-charcoal-300'
          )}
        >
          Businesses
        </button>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 gap-4">
        {activeType === 'skills' ? (
          skills.map(skill => <SkillCard key={skill.id} skill={skill} />)
        ) : (
          businesses.map(biz => <BusinessCard key={biz.id} business={biz} />)
        )}
      </div>
    </div>
  );
};

const SkillCard = ({ skill }) => (
  <Card className="p-0 overflow-hidden flex flex-col sm:flex-row h-auto sm:h-48 group cursor-pointer hover:border-sage-200 transition-all">
    <div className="w-full sm:w-48 h-48 sm:h-full relative shrink-0">
      <img src={skill.image} alt={skill.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg flex items-center gap-1">
        <Star size={12} className="text-amber-500 fill-amber-500" />
        <span className="text-[10px] font-bold text-charcoal-500">{skill.rating}</span>
      </div>
    </div>
    <div className="p-5 flex flex-col justify-between flex-1">
      <div>
        <div className="flex justify-between items-start mb-1">
          <span className="text-[10px] font-bold text-sage-600 uppercase tracking-widest">{skill.category}</span>
          {skill.isVerified && <BadgeCheck size={16} className="text-sage-500" />}
        </div>
        <h3 className="text-lg font-display text-charcoal-500 mb-1">{skill.name}</h3>
        <p className="text-sm text-charcoal-300 mb-2">by {skill.provider}</p>
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-1.5 text-charcoal-200">
          <MapPin size={14} />
          <span className="text-xs">{skill.distance} away</span>
        </div>
        <span className="text-sm font-bold text-sage-600">{skill.price}</span>
      </div>
    </div>
  </Card>
);

const BusinessCard = ({ business }) => (
  <Card className="p-0 overflow-hidden flex flex-col h-auto group cursor-pointer hover:border-amber-200 transition-all">
    <div className="w-full h-40 relative">
      <img src={business.image} alt={business.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/60 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
        <div>
          <h3 className="text-white font-display text-xl">{business.name}</h3>
          <p className="text-white/80 text-xs">{business.category}</p>
        </div>
        <div className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full flex items-center gap-1">
          <Star size={12} className="text-amber-500 fill-amber-500" />
          <span className="text-[10px] font-bold text-charcoal-500">{business.rating}</span>
        </div>
      </div>
    </div>
    <div className="p-4 bg-amber-50/50">
      <div className="flex items-center gap-2 text-amber-700">
        <div className="p-1.5 bg-white rounded-lg">
          <BadgeCheck size={14} />
        </div>
        <p className="text-xs font-bold">{business.promotion}</p>
      </div>
    </div>
  </Card>
);

export default DiscoveryView;


