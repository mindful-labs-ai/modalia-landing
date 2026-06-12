import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Locale-aware navigation API.
 * Using these Link/redirect/usePathname/useRouter helpers automatically
 * preserves the current locale prefix (e.g. `/blog` → `/en/blog`).
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
