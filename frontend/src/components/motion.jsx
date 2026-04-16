import React from 'react';
import { motion } from 'framer-motion';

export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -10 },
};
export const pageTransition = { duration: 0.3, ease: 'easeOut' };

export const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
export const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/** Wrap any page with this for smooth enter transitions */
export const PageWrapper = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={pageTransition}
  >
    {children}
  </motion.div>
);

/** Stagger-animate a list of items */
export const StaggerList = ({ children, className = '' }) => (
  <motion.div
    className={className}
    variants={containerVariants}
    initial="hidden"
    animate="show"
  >
    {React.Children.map(children, (child) =>
      child ? (
        <motion.div variants={itemVariants}>{child}</motion.div>
      ) : null
    )}
  </motion.div>
);
