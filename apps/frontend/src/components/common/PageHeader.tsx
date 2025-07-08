import React from 'react';
import { motion, Transition, Target, VariantLabels, AnimationControls } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  className?: string;
  animationProps?: {
    initial?: Target | VariantLabels | boolean;
    animate?: Target | VariantLabels | AnimationControls | boolean;
    transition?: Transition;
  };
}

const Header: React.FC<HeaderProps> = ({  
  title,
  subtitle,
  icon: Icon,
  iconClassName = '',
  className = '',
  animationProps = {},
}) => {
  return (
    <div className={`w-full ${className}`.trim()}>
      <motion.div
        initial={animationProps.initial ?? { opacity: 0, y: 20 }}
        animate={animationProps.animate ?? { opacity: 1, y: 0 }}
        transition={animationProps.transition ?? { duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4  items-center"
        role="banner"
        aria-label={title}
      >
        <div className="grid grid-cols-[auto_1fr] items-center gap-4">
          {Icon && (
            <motion.div
              whileHover={{ scale: 1.05, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl shadow-xl"
              aria-hidden="true"
            >
              <Icon className={`h-8 w-8 drop-shadow-xl text-white ${iconClassName}`.trim()} />
            </motion.div>
          )}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800" tabIndex={0}>{title}</h2>
            {subtitle && (
              <p className="text-sm text-purple-600 font-medium" tabIndex={0}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-1 bg-gradient-to-r mt-2 from-purple-400 via-purple-500 to-purple-400 rounded-full origin-left col-span-full"
          aria-hidden="true"
        />
      </motion.div>
    </div>
  );
};

export default Header; 