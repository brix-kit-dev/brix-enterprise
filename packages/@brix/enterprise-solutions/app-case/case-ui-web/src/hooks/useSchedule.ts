/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * This software is proprietary to Brix Platform and is protected by
 * copyright laws and international treaty provisions. Unauthorized
 * reproduction or distribution of this software, or any portion of it,
 * may result in severe civil and criminal penalties.
 *
 * Commercial use requires a valid Brix Enterprise license.
 * See LICENSE-ENTERPRISE for terms and conditions.
 */
/**
 * @file Schedule Hook
 * @description ViewModel layer for case schedule operations
 * @module @brix-sdk/enterprise-case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 blueprint MVVM architecture.
 * This hook manages schedule days and items within a case.
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp } from '@brix-sdk/runtime-sdk-react';
import type { 
  ScheduleDayDTO,
  ScheduleItemDTO,
  CreateScheduleDayRequest,
  UpdateScheduleDayRequest,
  CreateScheduleItemRequest,
  UpdateScheduleItemRequest,
} from '@brix-sdk/enterprise-case-shared';
import { createScheduleRepository } from '../repositories';

// ============================================================================
// Hook Result Types
// ============================================================================

/**
 * Schedule Hook Result Type
 */
export interface UseScheduleResult {
  /** Schedule days */
  days: ScheduleDayDTO[];
  /** Loading state */
  isLoading: boolean;
  /** Error object */
  error: Error | null;
  /** Currently selected day */
  selectedDay: ScheduleDayDTO | null;
  /** Refresh schedule */
  refresh: () => Promise<void>;
  /** Select a day */
  selectDay: (day: ScheduleDayDTO | null) => void;
  /** Create a new day */
  createDay: (request: CreateScheduleDayRequest) => Promise<ScheduleDayDTO>;
  /** Update a day */
  updateDay: (dayId: number, request: UpdateScheduleDayRequest) => Promise<ScheduleDayDTO>;
  /** Delete a day */
  deleteDay: (dayId: number) => Promise<void>;
  /** Add item to day */
  addItem: (dayId: number, request: CreateScheduleItemRequest) => Promise<ScheduleItemDTO>;
  /** Update an item */
  updateItem: (dayId: number, itemId: number, request: UpdateScheduleItemRequest) => Promise<ScheduleItemDTO>;
  /** Delete an item */
  deleteItem: (dayId: number, itemId: number) => Promise<void>;
  /** Reorder items within a day */
  reorderItems: (dayId: number, itemIds: number[]) => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Schedule Hook
 *
 * Encapsulates schedule data retrieval and manipulation logic.
 *
 * @param caseId - Case ID to load schedule for
 * @returns Schedule state and operation methods
 *
 * @example
 * ```tsx
 * const { 
 *   days, 
 *   isLoading, 
 *   selectedDay,
 *   selectDay,
 *   createDay, 
 *   addItem 
 * } = useSchedule(caseId);
 * ```
 */
export function useSchedule(caseId: number | string): UseScheduleResult {
  const http = useHttp();
  const numericCaseId = typeof caseId === 'string' ? Number(caseId) : caseId;

  // State
  const [days, setDays] = useState<ScheduleDayDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedDay, setSelectedDay] = useState<ScheduleDayDTO | null>(null);

  // Create Repository instance
  const repository = useMemo(
    () => createScheduleRepository(http),
    [http]
  );

  /**
   * Load all schedule days for the case
   */
  const loadDays = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await repository.getDays(numericCaseId);
      setDays(data);

      // Auto-select first day if none selected
      if (data.length > 0 && !selectedDay) {
        setSelectedDay(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [repository, numericCaseId, selectedDay]);

  // Load on mount and caseId change
  useEffect(() => {
    if (numericCaseId) {
      loadDays();
    }
  }, [numericCaseId]);

  /**
   * Select a day
   */
  const selectDay = useCallback((day: ScheduleDayDTO | null) => {
    setSelectedDay(day);
  }, []);

  /**
   * Create a new day
   */
  const createDay = useCallback(async (request: CreateScheduleDayRequest): Promise<ScheduleDayDTO> => {
    try {
      const created = await repository.createDay(numericCaseId, request);
      setDays((prev: ScheduleDayDTO[]) => [...prev, created].sort((a: ScheduleDayDTO, b: ScheduleDayDTO) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ));
      return created;
    } catch (err) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }, [repository, numericCaseId]);

  /**
   * Update a day
   */
  const updateDay = useCallback(async (
    dayId: number,
    request: UpdateScheduleDayRequest
  ): Promise<ScheduleDayDTO> => {
    try {
      const updated = await repository.updateDay(numericCaseId, dayId, request);
      setDays((prev: ScheduleDayDTO[]) => prev.map((d: ScheduleDayDTO) => d.id === dayId ? updated : d));
      if (selectedDay?.id === dayId) {
        setSelectedDay(updated);
      }
      return updated;
    } catch (err) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }, [repository, numericCaseId, selectedDay]);

  /**
   * Delete a day
   */
  const deleteDay = useCallback(async (dayId: number): Promise<void> => {
    try {
      await repository.deleteDay(numericCaseId, dayId);
      setDays((prev: ScheduleDayDTO[]) => prev.filter((d: ScheduleDayDTO) => d.id !== dayId));
      if (selectedDay?.id === dayId) {
        setSelectedDay(days.find((d: ScheduleDayDTO) => d.id !== dayId) ?? null);
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }, [repository, numericCaseId, selectedDay, days]);

  /**
   * Add item to a day
   */
  const addItem = useCallback(async (
    dayId: number,
    request: CreateScheduleItemRequest
  ): Promise<ScheduleItemDTO> => {
    try {
      const created = await repository.createItem(numericCaseId, dayId, request);
      setDays((prev: ScheduleDayDTO[]) => prev.map((d: ScheduleDayDTO) => {
        if (d.id === dayId) {
          return { ...d, items: [...d.items, created] };
        }
        return d;
      }));
      if (selectedDay?.id === dayId) {
        setSelectedDay((prev: ScheduleDayDTO | null) => prev ? { ...prev, items: [...prev.items, created] } : null);
      }
      return created;
    } catch (err) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }, [repository, numericCaseId, selectedDay]);

  /**
   * Update an item
   */
  const updateItem = useCallback(async (
    dayId: number,
    itemId: number,
    request: UpdateScheduleItemRequest
  ): Promise<ScheduleItemDTO> => {
    try {
      const updated = await repository.updateItem(numericCaseId, dayId, itemId, request);
      setDays((prev: ScheduleDayDTO[]) => prev.map((d: ScheduleDayDTO) => {
        if (d.id === dayId) {
          return { ...d, items: d.items.map((i: ScheduleItemDTO) => i.id === itemId ? updated : i) };
        }
        return d;
      }));
      if (selectedDay?.id === dayId) {
        setSelectedDay((prev: ScheduleDayDTO | null) => prev ? {
          ...prev,
          items: prev.items.map((i: ScheduleItemDTO) => i.id === itemId ? updated : i)
        } : null);
      }
      return updated;
    } catch (err) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }, [repository, numericCaseId, selectedDay]);

  /**
   * Delete an item
   */
  const deleteItem = useCallback(async (dayId: number, itemId: number): Promise<void> => {
    try {
      await repository.deleteItem(numericCaseId, dayId, itemId);
      setDays((prev: ScheduleDayDTO[]) => prev.map((d: ScheduleDayDTO) => {
        if (d.id === dayId) {
          return { ...d, items: d.items.filter((i: ScheduleItemDTO) => i.id !== itemId) };
        }
        return d;
      }));
      if (selectedDay?.id === dayId) {
        setSelectedDay((prev: ScheduleDayDTO | null) => prev ? {
          ...prev,
          items: prev.items.filter((i: ScheduleItemDTO) => i.id !== itemId)
        } : null);
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }, [repository, numericCaseId, selectedDay]);

  /**
   * Reorder items within a day
   */
  const reorderItems = useCallback(async (dayId: number, itemIds: number[]): Promise<void> => {
    try {
      await repository.reorderItems(numericCaseId, dayId, itemIds);
      // Reorder locally
      setDays((prev: ScheduleDayDTO[]) => prev.map((d: ScheduleDayDTO) => {
        if (d.id === dayId) {
          const orderedItems = itemIds.map(id => d.items.find((i: ScheduleItemDTO) => i.id === id)!).filter(Boolean);
          return { ...d, items: orderedItems };
        }
        return d;
      }));
      if (selectedDay?.id === dayId) {
        setSelectedDay((prev: ScheduleDayDTO | null) => {
          if (!prev) return null;
          const orderedItems = itemIds.map(id => prev.items.find((i: ScheduleItemDTO) => i.id === id)!).filter(Boolean);
          return { ...prev, items: orderedItems };
        });
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }, [repository, numericCaseId, selectedDay]);

  return {
    days,
    isLoading,
    error,
    selectedDay,
    refresh: loadDays,
    selectDay,
    createDay,
    updateDay,
    deleteDay,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
  };
}

export default useSchedule;
