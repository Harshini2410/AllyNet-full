import { motion } from 'framer-motion';
import { cn } from '../utils';

const Button = ({ 
  children, 
  variant = 'primary', 
  className, 
  isLoading, 
  ...props 
}) => {
  const variants = {
    primary: 'bg-sage-500 text-white hover:bg-sage-600 shadow-sm',
    secondary: 'bg-sand-200 text-charcoal-500 hover:bg-sand-300',
    alert: 'bg-coral-500 text-white hover:bg-coral-600 shadow-md',
    outline: 'border-2 border-sage-500 text-sage-500 hover:bg-sage-50',
    ghost: 'bg-transparent text-charcoal-500 hover:bg-sand-200',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={cn(
        'px-6 py-3 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        children
      )}
    </motion.button>
  );
};

export default Button;


