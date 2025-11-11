import * as React from 'react';
import { cn, getInitials } from '@/lib/utils';
import { User } from '@/types/chat';

interface AvatarProps {
  user: Partial<User>;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showStatus?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

const statusSizeClasses = {
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5',
  xl: 'w-4 h-4',
};

export function Avatar({ user, size = 'md', className, showStatus = false }: AvatarProps) {
  const initials = getInitials(user.displayName || user.email || 'Unknown');

  return (
    <div className={cn('relative inline-block', className)}>
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.displayName || user.email}
          className={cn(
            'rounded-full object-cover',
            sizeClasses[size]
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium',
            sizeClasses[size]
          )}
        >
          {initials}
        </div>
      )}
      {showStatus && user.status && (
        <div
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-900',
            statusSizeClasses[size],
            {
              'bg-green-500': user.status === 'online',
              'bg-yellow-500': user.status === 'away',
              'bg-gray-400': user.status === 'offline',
            }
          )}
        />
      )}
    </div>
  );
}
