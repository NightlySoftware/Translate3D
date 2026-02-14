import * as React from 'react';
import {cn, focusStyle} from '~/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({className, type = 'text', ...props}, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-dark bg-white px-3 py-1.5 text-sm font-medium text-dark placeholder:font-bold placeholder:uppercase placeholder:text-dark/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          focusStyle({theme: 'action'}),
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export {Input};

