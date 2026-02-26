/**
 * @file Shell Router Hooks
 * @description Wraps react-router-dom hooks for easier future implementation switching
 * @module @shinwa/shinwa-platform-shell-web/router/hooks
 * @version 3.2.0
 *
 * [Design Notes]
 * Shell layer needs router functionality but does not import react-router-dom directly in each component.
 * Through this file, centralized encapsulation makes it easier to:
 * 1. Unified management of router dependencies
 * 2. Switch to other router implementations in the future
 * 3. Add additional functionality (e.g., logging, monitoring)
 */

import { useNavigate as useRouterNavigate, useLocation as useRouterLocation } from 'react-router-dom';

/**
 * Current path information
 */
export interface CurrentLocation {
  pathname: string;
  search: string;
  hash: string;
}

/**
 * Get current route location
 */
export function useCurrentLocation(): CurrentLocation {
  const location = useRouterLocation();
  return {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
  };
}

/**
 * Get current path
 */
export function useCurrentPath(): string {
  const location = useRouterLocation();
  return location.pathname;
}

/**
 * Shell navigation methods
 */
export interface ShellNavigationResult {
  navigateTo: (path: string, replace?: boolean) => void;
  goBack: () => void;
}

/**
 * Shell layer navigation Hook
 */
export function useShellNavigation(): ShellNavigationResult {
  const navigate = useRouterNavigate();

  return {
    navigateTo: (path: string, replace?: boolean) => {
      navigate(path, { replace });
    },
    goBack: () => {
      navigate(-1);
    },
  };
}
