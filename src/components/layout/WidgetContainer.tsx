import { ReactNode } from 'react';
import { useWidgetStore } from '../../store/widgetStore';

interface WidgetContainerProps {
  children: ReactNode;
  className?: string;
}

export const WidgetContainer = ({ children, className = '' }: WidgetContainerProps) => {
  const { theme } = useWidgetStore();
  
  const themeClass = theme === 'glass' ? 'theme-glass' : 'theme-zen';
  
  return (
    <div className={`${themeClass} p-6 ${className}`}>
      {children}
    </div>
  );
};
