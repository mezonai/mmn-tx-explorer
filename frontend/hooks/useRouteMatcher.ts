'use client';
import { usePathname } from 'next/navigation';

/**
 * Check if current route match the given href
 */
export function useRouteMatcher(href: string): boolean {
  const pathname = usePathname();
  const isActive = href === '/' ? pathname === href : pathname.startsWith(href);
  return isActive;
}
