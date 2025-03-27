'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  color?: 'red' | 'green' | 'blue' | 'default';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value,
      max = 100,
      color = 'default',
      size = 'md',
      showValue = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-secondary',
          {
            'h-2': size === 'sm',
            'h-4': size === 'md',
            'h-6': size === 'lg'
          },
          className
        )}
        {...props}
      >
        <div
          className={cn('h-full w-full flex-1 transition-all', {
            'bg-red-500': color === 'red',
            'bg-green-500': color === 'green',
            'bg-blue-500': color === 'blue',
            'bg-primary': color === 'default'
          })}
          style={{ width: `${percentage}%` }}
        />
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };
