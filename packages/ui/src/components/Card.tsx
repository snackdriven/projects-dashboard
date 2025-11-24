import { type HTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  gradient?: boolean;
}

export function Card({
  children,
  className,
  hover = false,
  gradient = false,
  ...props
}: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -4 } : undefined}
      className={clsx(
        'rounded-xl p-6 transition-all duration-300',
        gradient
          ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-gray-700/50'
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
        hover && 'hover:shadow-xl dark:hover:shadow-2xl',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
