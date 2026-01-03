import { cn } from '../utils';

const Card = ({ children, className, ...props }) => {
  return (
    <div 
      className={cn(
        'bg-white dark:bg-charcoal-800 rounded-3xl p-6 shadow-sm border border-sand-200/50 dark:border-charcoal-700/50 backdrop-blur-sm transition-colors duration-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

