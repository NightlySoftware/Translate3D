import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cva } from 'class-variance-authority';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Premium Global Focus Styles
 * Provides a consistent, high-visibility dashed outline for interactive elements.
 * Improved version of the previous implementation with better utility composition.
 */
export const focusStyle = cva(
  'outline-none focus-visible:outline-2 focus-visible:outline-dashed transition-none',
  {
    variants: {
      theme: {
        dark: 'focus-visible:outline-dark',
        light: 'focus-visible:outline-light',
        action: 'focus-visible:outline-primary',
        muted: 'focus-visible:outline-tgray',
      },
      focusType: {
        outer: 'focus-visible:outline-offset-2',
        inner: 'focus-visible:outline-offset-[-4px]',
      },
      width: {
        default: 'focus-visible:outline-2',
        thick: 'focus-visible:outline-4',
      }
    },
    defaultVariants: {
      theme: 'action',
      focusType: 'outer',
      width: 'default',
    },
  }
);

