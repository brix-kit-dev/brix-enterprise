/**
 * @file Parameters Hook
 * @description ViewModel layer for case parameter operations
 * @module @shinwa/case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 blueprint MVVM architecture.
 * This hook manages case parameters (key-value pairs).
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp } from '@brix/runtime-sdk-react';
import type { CaseParameterDTO, SetParameterRequest } from '@shinwa/case-shared';
import { createParameterRepository } from '../repositories';

// ============================================================================
// Hook Result Types
// ============================================================================

/**
 * Parameters Hook Result Type
 */
export interface UseParametersResult {
  /** Case parameters */
  parameters: CaseParameterDTO[];
  /** Loading state */
  isLoading: boolean;
  /** Error object */
  error: Error | null;
  /** Saving state (for individual parameter operations) */
  isSaving: boolean;
  /** Refresh parameters */
  refresh: () => Promise<void>;
  /** Set a parameter value (create or update) */
  setParameter: (key: string, value: string, description?: string) => Promise<CaseParameterDTO>;
  /** Update a parameter */
  updateParameter: (key: string, value: string) => Promise<CaseParameterDTO>;
  /** Get parameter by key */
  getParameterValue: (key: string) => string | undefined;
  /** Check if parameter exists */
  hasParameter: (key: string) => boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Parameters Hook
 *
 * Encapsulates parameter data retrieval and manipulation logic.
 *
 * @param caseId - Case ID to load parameters for
 * @returns Parameters state and operation methods
 *
 * @example
 * ```tsx
 * const { 
 *   parameters, 
 *   isLoading, 
 *   setParameter, 
 *   getParameterValue 
 * } = useParameters(caseId);
 * 
 * // Get a specific value
 * const budget = getParameterValue('budget');
 * 
 * // Set a value
 * await setParameter('budget', '50000', 'Customer budget');
 * ```
 */
export function useParameters(caseId: number | string): UseParametersResult {
  const http = useHttp();
  const numericCaseId = typeof caseId === 'string' ? Number(caseId) : caseId;

  // State
  const [parameters, setParameters] = useState<CaseParameterDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Create Repository instance
  const repository = useMemo(
    () => createParameterRepository(http),
    [http]
  );

  /**
   * Load all parameters for the case
   */
  const loadParameters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await repository.getAll(numericCaseId);
      setParameters(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [repository, numericCaseId]);

  // Load on mount and caseId change
  useEffect(() => {
    if (numericCaseId) {
      loadParameters();
    }
  }, [numericCaseId]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Set a parameter value (creates if not exists, updates if exists)
   */
  const setParameterValue = useCallback(async (
    key: string,
    value: string,
    description?: string
  ): Promise<CaseParameterDTO> => {
    try {
      setIsSaving(true);
      setError(null);

      const request: SetParameterRequest = { key, value, description };
      const result = await repository.set(numericCaseId, request);

      // Update local state
      setParameters(prev => {
        const exists = prev.find(p => p.key === key);
        if (exists) {
          return prev.map(p => p.key === key ? result : p);
        }
        return [...prev, result];
      });

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [repository, numericCaseId]);

  /**
   * Update a parameter
   */
  const updateParameter = useCallback(async (
    key: string,
    value: string
  ): Promise<CaseParameterDTO> => {
    try {
      setIsSaving(true);
      setError(null);

      const result = await repository.update(numericCaseId, key, value);

      // Update local state
      setParameters(prev => prev.map(p => p.key === key ? result : p));

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [repository, numericCaseId]);

  /**
   * Get parameter value by key
   */
  const getParameterValue = useCallback((key: string): string | undefined => {
    const param = parameters.find(p => p.key === key);
    return param?.value;
  }, [parameters]);

  /**
   * Check if parameter exists
   */
  const hasParameter = useCallback((key: string): boolean => {
    return parameters.some(p => p.key === key);
  }, [parameters]);

  return {
    parameters,
    isLoading,
    error,
    isSaving,
    refresh: loadParameters,
    setParameter: setParameterValue,
    updateParameter,
    getParameterValue,
    hasParameter,
  };
}

export default useParameters;
