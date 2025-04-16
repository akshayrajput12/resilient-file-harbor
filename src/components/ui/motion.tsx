
import React from 'react';

interface MotionProps {
  children: React.ReactNode;
  initial?: Record<string, any>;
  animate?: Record<string, any>;
  transition?: Record<string, any>;
  exit?: Record<string, any>;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const createMotionComponent = (Component: string) => {
  return ({
    children,
    initial,
    animate,
    transition,
    exit,
    className = '',
    style = {},
    ...props
  }: MotionProps) => {
    const [isClient, setIsClient] = React.useState(false);
    
    React.useEffect(() => {
      setIsClient(true);
      
      // Apply animations
      if (isClient && animate) {
        const animateDelay = transition?.delay || 0;
        const animateDuration = transition?.duration || 0.3;
        
        setTimeout(() => {
          setStyles({
            ...style,
            ...animate,
            transition: `all ${animateDuration}s ${transition?.ease || 'ease'}`
          });
        }, animateDelay * 1000);
      }
    }, [isClient]);
    
    const [styles, setStyles] = React.useState<React.CSSProperties>({
      ...style,
      ...initial,
    });
    
    return React.createElement(
      Component,
      {
        className,
        style: styles,
        ...props
      },
      children
    );
  };
};

// Export motion components
export const motion = {
  div: createMotionComponent('div'),
  tr: createMotionComponent('tr')
};
