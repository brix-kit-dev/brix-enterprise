/**
 * useBookingCreate Hook - ViewModel Layer for Booking Creation
 * 
 * This hook manages the state and business logic for creating a new booking.
 * It handles form state, validation, and submission.
 * 
 * @module @shinwa/booking-ui-mobile/hooks
 * @since 3.1.0
 */

import { useState, useCallback, useMemo } from 'react';
import { useHttpCapability, useEventBus } from '@brix/runtime-sdk-react';
import type { Booking, BookingCreateRequest } from '@shinwa/booking-shared';
import { createBookingRepository, type BookingRepository } from '../repositories';

/**
 * Booking create state interface
 * 
 * 创建预约状态接口
 */
export interface BookingCreateState {
  /** Form data */
  formData: Partial<BookingCreateRequest>;
  /** Submitting state */
  submitting: boolean;
  /** Error message if any */
  error: string | null;
  /** Validation errors by field */
  fieldErrors: Record<string, string>;
  /** Created booking (after successful submission) */
  createdBooking: Booking | null;
}

/**
 * Booking create actions interface
 * 
 * 创建预约操作接口
 */
export interface BookingCreateActions {
  /** Update a form field */
  setField: <K extends keyof BookingCreateRequest>(field: K, value: BookingCreateRequest[K]) => void;
  /** Reset the form */
  reset: () => void;
  /** Validate the form */
  validate: () => boolean;
  /** Submit the form */
  submit: () => Promise<boolean>;
}

/**
 * Hook return type combining state and actions
 */
export type UseBookingCreateReturn = BookingCreateState & BookingCreateActions;

/**
 * Default form data
 */
const DEFAULT_FORM_DATA: Partial<BookingCreateRequest> = {
  title: '',
  description: '',
  scheduledDate: '',
  scheduledTime: '',
  duration: 60,
  resourceId: '',
  notes: ''
};

/**
 * useBookingCreate Hook
 * 
 * Provides state management and business logic for creating bookings.
 * Handles form state, validation, and API submission.
 * 
 * 提供创建预约的状态管理和业务逻辑
 * 处理表单状态、验证和 API 提交
 * 
 * @param initialData - Optional initial form data
 * @returns Combined state and actions object
 * 
 * @example
 * ```typescript
 * const { formData, setField, submit, submitting, error } = useBookingCreate();
 * 
 * return (
 *   <BookingForm
 *     data={formData}
 *     onChange={(field, value) => setField(field, value)}
 *     onSubmit={submit}
 *     loading={submitting}
 *     error={error}
 *   />
 * );
 * ```
 */
export function useBookingCreate(
  initialData?: Partial<BookingCreateRequest>
): UseBookingCreateReturn {
  const httpCapability = useHttpCapability();
  const eventBus = useEventBus();

  // State / 状态
  const [formData, setFormData] = useState<Partial<BookingCreateRequest>>(
    initialData ?? DEFAULT_FORM_DATA
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  // Repository instance / 仓库实例
  const repository: BookingRepository = useMemo(
    () => createBookingRepository(httpCapability),
    [httpCapability]
  );

  // Actions / 操作方法
  const setField = useCallback(<K extends keyof BookingCreateRequest>(
    field: K,
    value: BookingCreateRequest[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user modifies the field
    // 当用户修改字段时清除字段错误
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setFormData(initialData ?? DEFAULT_FORM_DATA);
    setError(null);
    setFieldErrors({});
    setCreatedBooking(null);
  }, [initialData]);

  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    // Required field validation / 必填字段验证
    if (!formData.title?.trim()) {
      errors.title = 'Title is required';
    }
    if (!formData.scheduledDate) {
      errors.scheduledDate = 'Date is required';
    }
    if (!formData.scheduledTime) {
      errors.scheduledTime = 'Time is required';
    }
    if (!formData.resourceId) {
      errors.resourceId = 'Resource is required';
    }

    // Duration validation / 时长验证
    if (formData.duration !== undefined && formData.duration < 15) {
      errors.duration = 'Duration must be at least 15 minutes';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const submit = useCallback(async (): Promise<boolean> => {
    // Validate before submission / 提交前验证
    if (!validate()) {
      return false;
    }

    try {
      setSubmitting(true);
      setError(null);

      const request = formData as BookingCreateRequest;
      const booking = await repository.createBooking(request);

      setCreatedBooking(booking);
      eventBus.emit('booking.created', { bookingId: booking.id });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create booking';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [formData, validate, repository, eventBus]);

  return {
    formData,
    submitting,
    error,
    fieldErrors,
    createdBooking,
    setField,
    reset,
    validate,
    submit
  };
}
