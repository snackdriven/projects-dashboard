import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

/**
 * Simple Checkbox component for table row selection
 */
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={(node) => {
          if (node) {
            node.indeterminate = indeterminate ?? false;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }
        }}
        className={clsx(
          'w-4 h-4 rounded border border-border bg-background',
          'checked:bg-primary checked:border-primary',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'cursor-pointer transition-colors',
          className
        )}
        {...props}
      />
    );
  }
);

Checkbox.displayName = 'Checkbox';
