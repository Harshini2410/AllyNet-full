import React from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Check, CreditCard, History, ArrowUpRight } from 'lucide-react';

const PaymentsView = () => {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      features: ['Emergency SOS', 'Nearby Help Feed', 'Basic Profile'],
      isCurrent: true
    },
    {
      name: 'Safety+',
      price: '$9.99',
      features: ['Priority Assistance', 'Safe Route Mapping', 'Identity Protection', 'Family Link'],
      isCurrent: false,
      popular: true
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display text-charcoal-500">Payments & Subscription</h2>
        <p className="text-sm text-charcoal-300">Manage your membership and payment history</p>
      </div>

      {/* Pricing Cards */}
      <div className="space-y-4">
        {plans.map((plan, i) => (
          <Card 
            key={i} 
            className={`relative overflow-hidden ${plan.popular ? 'border-sage-500 border-2' : ''}`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-sage-500 text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl">
                MOST POPULAR
              </div>
            )}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-display text-charcoal-500">{plan.name}</h3>
                <p className="text-3xl font-bold text-charcoal-500 mt-2">{plan.price}<span className="text-sm font-normal text-charcoal-200">/mo</span></p>
              </div>
              {plan.isCurrent && (
                <span className="px-3 py-1 bg-sage-100 text-sage-600 text-[10px] font-bold rounded-full uppercase">Current Plan</span>
              )}
            </div>
            
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, j) => (
                <li key={j} className="flex items-center gap-3 text-sm text-charcoal-300">
                  <div className="p-1 bg-sage-50 text-sage-500 rounded-full">
                    <Check size={12} />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <Button 
              variant={plan.isCurrent ? 'outline' : 'primary'} 
              className="w-full"
              disabled={plan.isCurrent}
            >
              {plan.isCurrent ? 'Active' : 'Upgrade Now'}
            </Button>
          </Card>
        ))}
      </div>

      {/* Payment History */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <History size={18} className="text-charcoal-300" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal-200">Payment History</h3>
        </div>
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-sand-200">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-sand-100 rounded-xl text-charcoal-300">
                  <CreditCard size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-charcoal-500">Subscription - Safety+</p>
                  <p className="text-[10px] text-charcoal-200">Dec 12, 2025</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-charcoal-500">$9.99</p>
                <button className="text-[10px] font-bold text-sage-600 flex items-center gap-1 justify-end">
                  Receipt <ArrowUpRight size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PaymentsView;


