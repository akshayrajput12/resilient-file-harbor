
/**
 * Simple animation utility functions using CSS transitions
 * This replaces the need for framer-motion
 */

export type AnimationProps = {
  duration?: number;
  delay?: number;
  ease?: string;
};

/**
 * Creates CSS transition properties for animations
 */
export const createTransition = (
  properties: string[] = ['all'],
  options: AnimationProps = {}
): string => {
  const { duration = 300, delay = 0, ease = 'ease-in-out' } = options;
  
  return properties
    .map((property) => `${property} ${duration}ms ${ease} ${delay}ms`)
    .join(', ');
};

/**
 * Common animation variants that can be used with CSS classes
 */
export const fadeIn = {
  hidden: 'opacity-0',
  visible: 'opacity-100 transition-opacity duration-300',
};

export const slideUp = {
  hidden: 'opacity-0 translate-y-4',
  visible: 'opacity-100 translate-y-0 transition-all duration-300',
};

export const slideDown = {
  hidden: 'opacity-0 -translate-y-4',
  visible: 'opacity-100 translate-y-0 transition-all duration-300',
};

export const slideInLeft = {
  hidden: 'opacity-0 -translate-x-4',
  visible: 'opacity-100 translate-x-0 transition-all duration-300',
};

export const slideInRight = {
  hidden: 'opacity-0 translate-x-4',
  visible: 'opacity-100 translate-x-0 transition-all duration-300',
};

export const scale = {
  hidden: 'opacity-0 scale-95',
  visible: 'opacity-100 scale-100 transition-all duration-300',
};
