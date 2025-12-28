import React from 'react';
import Card from '../../components/Card';
import { useHelpStore } from '../../store/useHelpStore';
import { Clock, MapPin, CircleDollarSign, ChevronRight } from 'lucide-react';
import { cn } from '../../utils';

const HelpFeed = () => {
  const requests = useHelpStore((state) => state.requests);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-display text-charcoal-500">Nearby Help Requests</h2>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-sage-100 text-sage-600 text-[10px] font-bold rounded-full uppercase">All</span>
          <span className="px-3 py-1 bg-white text-charcoal-300 text-[10px] font-bold rounded-full uppercase">Urgent</span>
        </div>
      </div>

      {requests.map((request) => (
        <HelpRequestCard key={request.id} request={request} />
      ))}
    </div>
  );
};

const HelpRequestCard = ({ request }) => {
  const priorityColors = {
    high: 'text-coral-500 bg-coral-50',
    medium: 'text-amber-500 bg-amber-50',
    low: 'text-sage-500 bg-sage-50',
  };

  return (
    <Card className="group hover:border-sage-200 transition-all cursor-pointer">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sand-200 flex items-center justify-center text-[10px] font-bold text-charcoal-500">
            {request.user.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="text-sm font-bold text-charcoal-500">{request.user}</p>
            <div className="flex items-center gap-1 text-[10px] text-charcoal-200">
              <Clock size={10} />
              <span>Just now</span>
            </div>
          </div>
        </div>
        <span className={cn('px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider', priorityColors[request.priority])}>
          {request.priority}
        </span>
      </div>

      <h3 className="text-md font-semibold text-charcoal-500 mb-2">{request.title}</h3>
      
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-sand-100">
        <div className="flex items-center gap-1.5 text-charcoal-300">
          <MapPin size={14} className="text-sage-500" />
          <span className="text-xs font-medium">{request.location}</span>
        </div>
        {request.budget && (
          <div className="flex items-center gap-1.5 text-charcoal-300">
            <CircleDollarSign size={14} className="text-amber-500" />
            <span className="text-xs font-medium">${request.budget}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="px-3 py-1 bg-sand-100 rounded-lg">
          <span className="text-[10px] font-bold text-charcoal-300 uppercase">{request.category}</span>
        </div>
        <button className="flex items-center gap-1 text-sage-600 text-sm font-bold group-hover:gap-2 transition-all">
          I can help
          <ChevronRight size={16} />
        </button>
      </div>
    </Card>
  );
};

export default HelpFeed;


