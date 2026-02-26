/**
 * useDeepLinking Hook - Deep Link Handling
 * 
 * @module @shinwa/shinwa-platform-shell-mobile/hooks
 * @since 3.1.0
 */

import { useEffect, useCallback, useRef } from 'react';
import { Linking } from 'react-native';
import { useNavigation } from '../navigation/hooks';
import type { DeepLinkConfig } from '../navigation/types';

/**
 * useDeepLinking Options
 */
export interface UseDeepLinkingOptions {
  /** Deep link configuration */
  config: DeepLinkConfig;
  /** Whether to handle initial URL on mount */
  handleInitialUrl?: boolean;
  /** Callback when deep link is handled */
  onDeepLink?: (url: string, route: string, params: Record<string, string>) => void;
  /** Callback when deep link parsing fails */
  onError?: (error: Error) => void;
}

/**
 * useDeepLinking Hook
 * 
 * Handles deep linking for the mobile application. Parses incoming
 * URLs and navigates to the appropriate screens.
 * 
 * 处理移动应用程序的深层链接。解析传入的 URL 并导航到相应的屏幕
 * 
 * @param options - Deep linking options
 * @returns Deep linking utilities
 * 
 * @example
 * ```tsx
 * useDeepLinking({
 *   config: {
 *     prefix: 'shinwa://',
 *     routes: {
 *       'booking/:id': 'BookingDetails',
 *       'profile': 'Profile'
 *     }
 *   },
 *   onDeepLink: (url, route, params) => {
 *     console.log('Deep link handled:', route, params);
 *   }
 * });
 * ```
 */
export function useDeepLinking({
  config,
  handleInitialUrl = true,
  onDeepLink,
  onError
}: UseDeepLinkingOptions): void {
  const { navigate } = useNavigation();
  const handledUrls = useRef(new Set<string>());

  // Parse deep link URL
  // 解析深层链接 URL
  const parseUrl = useCallback(
    (url: string): { route: string; params: Record<string, string> } | null => {
      if (!url.startsWith(config.prefix)) {
        return null;
      }

      const path = url.slice(config.prefix.length);

      for (const [pattern, route] of Object.entries(config.routes)) {
        const match = matchPattern(pattern, path);
        if (match) {
          return { route, params: match };
        }
      }

      return null;
    },
    [config]
  );

  // Handle deep link URL
  // 处理深层链接 URL
  const handleUrl = useCallback(
    (url: string) => {
      // Prevent duplicate handling
      // 防止重复处理
      if (handledUrls.current.has(url)) {
        return;
      }

      try {
        const parsed = parseUrl(url);
        if (parsed) {
          handledUrls.current.add(url);
          navigate(parsed.route, parsed.params);
          onDeepLink?.(url, parsed.route, parsed.params);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Deep link parsing failed');
        onError?.(err);
      }
    },
    [parseUrl, navigate, onDeepLink, onError]
  );

  // Listen for incoming URLs
  // 监听传入的 URL
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleUrl]);

  // Handle initial URL
  // 处理初始 URL
  useEffect(() => {
    if (handleInitialUrl) {
      Linking.getInitialURL().then((url) => {
        if (url) {
          handleUrl(url);
        }
      });
    }
  }, [handleInitialUrl, handleUrl]);
}

/**
 * Match URL path against pattern
 * 将 URL 路径与模式匹配
 */
function matchPattern(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(':')) {
      // Parameter placeholder
      // 参数占位符
      const paramName = patternPart.slice(1);
      params[paramName] = pathPart;
    } else if (patternPart !== pathPart) {
      // Literal mismatch
      // 字面量不匹配
      return null;
    }
  }

  return params;
}
