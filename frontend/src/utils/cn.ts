/**
 * Merges class names, filtering out falsy values.
 * Lightweight alternative to clsx for Tailwind usage.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
