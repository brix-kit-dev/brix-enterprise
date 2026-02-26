/**
 * @file Carousel Form ViewModel Hook
 * @description Manages the state and business logic for the carousel create/edit page
 * @module carousel-ui-web/hooks/useCarouselForm
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture - ViewModel Layer:
 * This Hook is the ViewModel layer implementation, responsible for:
 * 1. Managing carousel form state
 * 2. Encapsulating business logic for creating/updating carousels
 * 3. Publishing carousel change events
 * 4. Shielding the View layer from direct Repository layer access
 * 
 * @author Brix Team
 * @since 3.0.0
 */

import { useState, useCallback, useEffect } from 'react';
import { useHttp, useEventBus, useNavigation } from '@brix/runtime-sdk-react';
import { createCarouselRepository, type CarouselRepository } from '../repositories';
import type { CarouselDTO, CarouselSettings } from '@shinwa/carousel-shared';
import { CAROUSEL_EVENTS } from '@shinwa/carousel-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Carousel form data
 */
export interface CarouselFormData {
  /** Carousel code */
  code: string;
  /** Carousel name */
  name: string;
  /** Description */
  description: string;
  /** Width */
  width: number;
  /** Height */
  height: number;
  /** Whether to auto-play */
  autoPlay: boolean;
  /** Auto-play interval (ms) */
  autoPlayInterval: number;
  /** Whether to show indicator */
  showIndicator: boolean;
  /** Whether to show arrows */
  showArrow: boolean;
  /** Maximum banner count */
  maxBannerCount: number;
}

/**
 * Carousel form state
 */
export interface CarouselFormState {
  /** Form data */
  formData: CarouselFormData;
  /** Original carousel data (edit mode) */
  carousel: CarouselDTO | null;
  /** Whether loading */
  loading: boolean;
  /** Whether submitting */
  submitting: boolean;
  /** Error message */
  error: Error | null;
  /** Whether in edit mode */
  isEditMode: boolean;
  /** Whether form has changes */
  isDirty: boolean;
}

/**
 * Carousel form actions
 */
export interface CarouselFormActions {
  /** Update form field */
  updateField: <K extends keyof CarouselFormData>(field: K, value: CarouselFormData[K]) => void;
  /** Update multiple fields */
  updateFields: (fields: Partial<CarouselFormData>) => void;
  /** Submit form */
  submit: () => Promise<boolean>;
  /** Reset form */
  reset: () => void;
  /** Navigate to list page */
  navigateToList: () => void;
}

/**
 * useCarouselForm return type
 */
export type UseCarouselFormReturn = CarouselFormState & CarouselFormActions;

// ============================================================================
// Constants
// ============================================================================

/**
 * Default form data
 */
const DEFAULT_FORM_DATA: CarouselFormData = {
  code: '',
  name: '',
  description: '',
  width: 1200,
  height: 400,
  autoPlay: true,
  autoPlayInterval: 3000,
  showIndicator: true,
  showArrow: true,
  maxBannerCount: 10,
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Carousel Form Hook
 * 
 * @param options - Configuration options
 * @param options.id - Carousel ID (edit mode)
 * @param options.code - Carousel code (edit mode)
 * @returns Form state and action methods
 * 
 * @example
 * ```tsx
 * // Create mode
 * const { formData, updateField, submit } = useCarouselForm();
 * 
 * // Edit mode
 * const { formData, loading, submit } = useCarouselForm({ id: 1 });
 * ```
 */
export function useCarouselForm(options?: {
  id?: number;
  code?: string;
}): UseCarouselFormReturn {
  const httpCapability = useHttp();
  const eventBus = useEventBus();
  const navigation = useNavigation();

  // Create Repository instance
  const repository: CarouselRepository = createCarouselRepository(httpCapability);

  // ─────────────────────────────────────────────────────────
  // State management
  // ─────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<CarouselFormData>(DEFAULT_FORM_DATA);
  const [carousel, setCarousel] = useState<CarouselDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const isEditMode = Boolean(options?.id || options?.code);

  // ─────────────────────────────────────────────────────────
  // Load carousel data (edit mode)
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEditMode) return;

    const loadCarousel = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let data: CarouselDTO | null = null;
        
        if (options?.id) {
          data = await repository.getById(options.id);
        } else if (options?.code) {
          data = await repository.getByCode(options.code);
        }
        
        if (data) {
          setCarousel(data);
          setFormData({
            code: data.code,
            name: data.name,
            description: data.description || '',
            width: data.settings?.width || 1200,
            height: data.settings?.height || 400,
            autoPlay: data.settings?.autoPlay ?? true,
            autoPlayInterval: data.settings?.autoPlayInterval || 3000,
            showIndicator: data.settings?.showIndicator ?? true,
            showArrow: data.settings?.showArrow ?? true,
            maxBannerCount: data.settings?.maxBannerCount || 10,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load carousel'));
      } finally {
        setLoading(false);
      }
    };

    loadCarousel();
  }, [options?.id, options?.code, isEditMode]);

  // ─────────────────────────────────────────────────────────
  // Form operations
  // ─────────────────────────────────────────────────────────

  /**
   * Update single form field
   */
  const updateField = useCallback(<K extends keyof CarouselFormData>(
    field: K,
    value: CarouselFormData[K]
  ) => {
    setFormData((prev: CarouselFormData) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  /**
   * Update multiple form fields
   */
  const updateFields = useCallback((fields: Partial<CarouselFormData>) => {
    setFormData((prev: CarouselFormData) => ({ ...prev, ...fields }));
    setIsDirty(true);
  }, []);

  /**
   * Submit form
   */
  const submit = useCallback(async (): Promise<boolean> => {
    setSubmitting(true);
    setError(null);

    try {
      const dto: Partial<CarouselDTO> = {
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        settings: {
          width: formData.width,
          height: formData.height,
          autoPlay: formData.autoPlay,
          autoPlayInterval: formData.autoPlayInterval,
          showIndicator: formData.showIndicator,
          showArrow: formData.showArrow,
          maxBannerCount: formData.maxBannerCount,
        } as CarouselSettings,
        enabled: true,
      };

      let result: CarouselDTO;

      if (isEditMode && carousel?.id) {
        // Update existing carousel
        result = await repository.update(carousel.id, dto);
        
        // Publish update event
        eventBus.publish(CAROUSEL_EVENTS.CAROUSEL_UPDATED, {
          carouselId: result.id,
          carousel: result,
          timestamp: Date.now(),
        });
      } else {
        // Create new carousel
        result = await repository.create(dto);
        
        // Publish create event
        eventBus.publish(CAROUSEL_EVENTS.CAROUSEL_CREATED, {
          carouselId: result.id,
          carousel: result,
          timestamp: Date.now(),
        });
      }

      setCarousel(result);
      setIsDirty(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save carousel'));
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [formData, isEditMode, carousel, repository, eventBus]);

  /**
   * Reset form
   */
  const reset = useCallback(() => {
    if (carousel) {
      // Edit mode: reset to original data
      setFormData({
        code: carousel.code,
        name: carousel.name,
        description: carousel.description || '',
        width: carousel.settings?.width || 1200,
        height: carousel.settings?.height || 400,
        autoPlay: carousel.settings?.autoPlay ?? true,
        autoPlayInterval: carousel.settings?.autoPlayInterval || 3000,
        showIndicator: carousel.settings?.showIndicator ?? true,
        showArrow: carousel.settings?.showArrow ?? true,
        maxBannerCount: carousel.settings?.maxBannerCount || 10,
      });
    } else {
      // Create mode: reset to default values
      setFormData(DEFAULT_FORM_DATA);
    }
    setIsDirty(false);
    setError(null);
  }, [carousel]);

  /**
   * Navigate to list page
   */
  const navigateToList = useCallback(() => {
    navigation.navigate('carousel:list');
  }, [navigation]);

  // ─────────────────────────────────────────────────────────
  // Return value
  // ─────────────────────────────────────────────────────────
  return {
    // State
    formData,
    carousel,
    loading,
    submitting,
    error,
    isEditMode,
    isDirty,
    // Actions
    updateField,
    updateFields,
    submit,
    reset,
    navigateToList,
  };
}
