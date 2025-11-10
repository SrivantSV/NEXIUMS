'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, content, side = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  const tooltipClasses = cn(
    'absolute z-50 px-3 py-1.5 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-md shadow-lg pointer-events-none whitespace-nowrap',
    {
      'bottom-full left-1/2 -translate-x-1/2 -translate-y-2': side === 'top',
      'top-full left-1/2 -translate-x-1/2 translate-y-2': side === 'bottom',
      'right-full top-1/2 -translate-y-1/2 -translate-x-2': side === 'left',
      'left-full top-1/2 -translate-y-1/2 translate-x-2': side === 'right',
    }
  );

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={tooltipClasses}>
          {content}
          <div
            className={cn(
              'absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45',
              {
                'bottom-0 left-1/2 -translate-x-1/2 translate-y-1': side === 'top',
                'top-0 left-1/2 -translate-x-1/2 -translate-y-1': side === 'bottom',
                'right-0 top-1/2 -translate-y-1/2 translate-x-1': side === 'left',
                'left-0 top-1/2 -translate-y-1/2 -translate-x-1': side === 'right',
              }
            )}
          />
        </div>
      )}
    </div>
  );
}
