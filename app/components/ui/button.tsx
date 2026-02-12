import * as React from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, focusStyle } from '~/lib/utils';

// Define the button variants using cva (class-variance-authority)
const buttonVariants = cva(
  'relative flex h-fit items-center justify-center gap-2 whitespace-nowrap rounded-md border p-0 font-bold uppercase transition-all overflow-hidden group/btn reflect-none isolate disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'text-white border-dark',
        action: 'text-white border-primary', // Orange base
        secondary: 'text-dark border-dark hover:text-light',
        darkSecondary: 'text-light border-light hover:text-dark',
        destructive: 'text-red-600 border-red-600 bg-transparent',
        ghost: 'border-transparent bg-transparent text-dark hover:bg-dark/5',
      },
      size: {
        default: 'px-3 py-1.5 text-sm',
        sm: 'px-4 py-1.5',
        lg: 'px-8 py-4',
        icon: 'px-2 py-2',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  icon?: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
  focusTheme?: 'action' | 'dark' | 'light' | 'muted';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      icon,
      children,
      disabled,
      selected = false,
      focusTheme,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    // Determine focus theme based on variant if not provided
    const theme = focusTheme || (variant === 'primary' || variant === 'action' ? 'action' : variant === 'darkSecondary' ? 'light' : 'dark');

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          focusStyle({ theme }),
          {
            'opacity-50 pointer-events-none': disabled,
            'cursor-default': selected,
            'hover:border-primary': !selected && variant === 'primary',
            'hover:border-dark': !selected && (variant === 'action' || variant === 'secondary'),
          }
        )}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        <Slottable>{children}</Slottable>
        {icon && <span className="relative z-10 w-4 h-4 flex items-center justify-center">{icon}</span>}

        {/* Base Background Span */}
        <span
          className={cn('absolute inset-0 -z-20 transition-colors duration-300', {
            'bg-dark': variant === 'primary' || variant === 'darkSecondary',
            'bg-primary': variant === 'action',
            'bg-light': variant === 'secondary',
            'bg-transparent': variant === 'ghost' || variant === 'destructive',
          })}
        />

        {/* Hover Animation Background Span */}
        {!selected && variant !== 'ghost' && (
          <span
            className={cn(
              'absolute inset-0 -z-10 transform scale-y-0 transition-all duration-300 ease-out origin-bottom group-hover/btn:scale-y-100',
              {
                'bg-primary': variant === 'primary' && !disabled,
                'bg-dark': (variant === 'action' || variant === 'secondary') && !disabled,
                'bg-light': variant === 'darkSecondary' && !disabled,
                'bg-red-600': variant === 'destructive' && !disabled,
              }
            )}
          />
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };



