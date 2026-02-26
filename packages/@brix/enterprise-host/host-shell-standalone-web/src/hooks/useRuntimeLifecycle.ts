/**
 * @file useRuntimeLifecycle Hook
 * @description Host layer runtime lifecycle management - ultra-thin wrapper
 * @module host-standalone-web/hooks/useRuntimeLifecycle
 * @version 3.1.0
 *
 * [Ultra-thin Host Principle]
 * Host layer does not implement any business logic, only:
 * 1. Read Host-specific configuration
 * 2. Call SDK-provided Hooks
 * 3. Pass through return values
 *
 * All lifecycle logic has been moved down to the @brix/runtime-orchestrator-web SDK layer.
 *
 * @see @brix/runtime-orchestrator-web/useWebUIRuntime
 */

import {
  useWebUIRuntime,
  type UseWebUIRuntimeOptions,
  type UseWebUIRuntimeResult,
  type LifecyclePhase,
  type PluginLifecycleState,
  type RuntimeLifecycleState,
  type RuntimeTimeouts,
  type RuntimeLifecycleCallbacks,
} from '@brix/runtime-orchestrator-web';
import { hostConfig } from '../config/host.config';

// ============================================================================
// Type Re-exports (maintaining backward compatibility)
// ============================================================================

export type {
  LifecyclePhase,
  PluginLifecycleState,
  RuntimeLifecycleState,
  RuntimeTimeouts,
  RuntimeLifecycleCallbacks,
  UseWebUIRuntimeOptions as UseRuntimeLifecycleOptions,
  UseWebUIRuntimeResult as UseRuntimeLifecycleResult,
};

// ============================================================================
// Host Layer Thin Wrapper
// ============================================================================

/**
 * Runtime Lifecycle Management Hook (Host layer thin wrapper)
 *
 * This Hook follows the "ultra-thin Host" principle:
 * - Contains no business logic
 * - Only reads Host-specific configuration and passes to SDK
 * - All implementation details are in the SDK layer
 *
 * @param overrides Optional configuration overrides
 * @returns Runtime state and control methods
 *
 * @example
 * ```tsx
 * function App() {
 *   const { state, isLoading, isRunning, hasError } = useRuntimeLifecycle();
 *
 *   if (isLoading) return <Loading progress={state.progress} />;
 *   if (hasError) return <Error message={state.error} />;
 *   return <MainLayout />;
 * }
 * ```
 */
export function useRuntimeLifecycle(
  overrides: Partial<UseWebUIRuntimeOptions> = {}
): UseWebUIRuntimeResult {
  // Merge Host configuration with override parameters
  const options: UseWebUIRuntimeOptions = {
    appName: hostConfig.appName,
    debug: hostConfig.debug ?? false,
    autoStart: true,
    ...overrides,
  };

  // Call SDK layer Hook
  return useWebUIRuntime(options);
}

export default useRuntimeLifecycle;
