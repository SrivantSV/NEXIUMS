'use client';

import { Progress } from '@/components/ui/progress';
import {
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
} from '@/lib/auth/password';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  strength: number;
  score: number;
  errors?: string[];
}

export function PasswordStrength({
  strength,
  score,
  errors = [],
}: PasswordStrengthProps) {
  const label = getPasswordStrengthLabel(strength);
  const colorClass = getPasswordStrengthColor(strength);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Password strength:</span>
        <span className={cn('font-medium', colorClass)}>{label}</span>
      </div>

      <Progress value={score} className="h-2" />

      {errors.length > 0 && (
        <ul className="space-y-1 text-xs text-red-500">
          {errors.map((error, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-1">•</span>
              <span>{error}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
