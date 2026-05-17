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
 * @file Price Range Input Component
 * @description Reusable component for inputting price range (UIAdapter pattern)
 * @module products-ui-web/components/PriceRangeInput
 * @version 3.2.0
 */

import React, { useCallback, useMemo } from 'react';
import { useUI } from '@brix-sdk/runtime-sdk-react';

// ============================================================================
// Type Definitions
// ============================================================================

export interface PriceRange {
  type?: 'fixed' | 'range';
  minValue?: number;
  maxValue?: number;
  fixedValue?: number;
  currency: string;
  displayText?: string;
}

export interface PriceRangeInputProps {
  value: PriceRange;
  onChange: (value: PriceRange) => void;
  mode?: 'fixed' | 'range';
  onModeChange?: (mode: 'fixed' | 'range') => void;
  currencies?: { code: string; symbol: string; label: string }[];
  disabled?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
  minValue?: number;
  maxValue?: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CURRENCIES = [
  { code: 'CNY', symbol: '¥', label: '人民币 (CNY)' },
  { code: 'JPY', symbol: '¥', label: '日元 (JPY)' },
  { code: 'USD', symbol: '$', label: '美元 (USD)' },
  { code: 'EUR', symbol: '€', label: '欧元 (EUR)' },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: '¥',
  JPY: '¥',
  USD: '$',
  EUR: '€',
  GBP: '£',
  KRW: '₩',
};

// ============================================================================
// Helper Functions
// ============================================================================

const formatPrice = (price: number | undefined, currency: string): string => {
  if (price === undefined || price === null) return '';
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol}${price.toLocaleString('zh-CN')}`;
};

const generateDisplayText = (range: PriceRange): string => {
  if (range.fixedValue !== undefined) {
    return formatPrice(range.fixedValue, range.currency);
  }
  if (range.minValue !== undefined && range.maxValue !== undefined) {
    if (range.minValue === range.maxValue) {
      return formatPrice(range.minValue, range.currency);
    }
    return `${formatPrice(range.minValue, range.currency)} - ${formatPrice(range.maxValue, range.currency)}`;
  }
  if (range.minValue !== undefined) {
    return `${formatPrice(range.minValue, range.currency)} 起`;
  }
  if (range.maxValue !== undefined) {
    return `最高 ${formatPrice(range.maxValue, range.currency)}`;
  }
  return '';
};

// ============================================================================
// Component Implementation
// ============================================================================

export const PriceRangeInput: React.FC<PriceRangeInputProps> = ({
  value,
  onChange,
  mode = 'range',
  onModeChange,
  currencies = DEFAULT_CURRENCIES,
  disabled = false,
  error,
  label = '价格',
  helperText,
}) => {
  const { Box, Typography, Input, Select, Button } = useUI();

  // Current mode
  const currentMode = value.type || mode;

  // Display text
  const displayText = useMemo(() => generateDisplayText(value), [value]);

  // Currency options
  const currencyOptions = currencies.map(c => ({
    value: c.code,
    label: c.label,
  }));

  // Handlers
  const handleModeChange = useCallback((newMode: 'fixed' | 'range') => {
    onModeChange?.(newMode);
    onChange({
      ...value,
      type: newMode,
      fixedValue: newMode === 'fixed' ? value.minValue || 0 : undefined,
      minValue: newMode === 'range' ? value.fixedValue || 0 : undefined,
      maxValue: newMode === 'range' ? value.fixedValue || 0 : undefined,
    });
  }, [value, onChange, onModeChange]);

  const handleFixedValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || undefined;
    onChange({
      ...value,
      fixedValue: val,
      displayText: val ? formatPrice(val, value.currency) : '',
    });
  }, [value, onChange]);

  const handleMinValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || undefined;
    const newValue = {
      ...value,
      minValue: val,
    };
    onChange({
      ...newValue,
      displayText: generateDisplayText(newValue),
    });
  }, [value, onChange]);

  const handleMaxValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || undefined;
    const newValue = {
      ...value,
      maxValue: val,
    };
    onChange({
      ...newValue,
      displayText: generateDisplayText(newValue),
    });
  }, [value, onChange]);

  const handleCurrencyChange = useCallback((currency: string | number | (string | number)[]) => {
    const newValue = {
      ...value,
      currency: String(currency),
    };
    onChange({
      ...newValue,
      displayText: generateDisplayText(newValue),
    });
  }, [value, onChange]);

  // Render
  return (
    <Box>
      {/* Mode Toggle */}
      <Box style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Button
          variant={currentMode === 'fixed' ? 'primary' : 'secondary'}
          onClick={() => handleModeChange('fixed')}
          disabled={disabled}
          style={{ flex: 1 }}
        >
          固定价格
        </Button>
        <Button
          variant={currentMode === 'range' ? 'primary' : 'secondary'}
          onClick={() => handleModeChange('range')}
          disabled={disabled}
          style={{ flex: 1 }}
        >
          价格区间
        </Button>
      </Box>

      {/* Currency Selection */}
      <Box style={{ marginBottom: 12 }}>
        <Select
          value={value.currency}
          onChange={handleCurrencyChange}
          options={currencyOptions}
          disabled={disabled}
          style={{ width: '100%' }}
        />
      </Box>

      {/* Price Inputs */}
      {currentMode === 'fixed' ? (
        <Box>
          <Input
            type="number"
            placeholder="请输入价格"
            value={value.fixedValue !== undefined ? String(value.fixedValue) : ''}
            onChange={handleFixedValueChange}
            disabled={disabled}
            error={!!error}
          />
        </Box>
      ) : (
        <Box style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
          <Input
            type="number"
            placeholder="最低价"
            value={value.minValue !== undefined ? String(value.minValue) : ''}
            onChange={handleMinValueChange}
            disabled={disabled}
          />
          <Typography style={{ color: '#6B7280' }}>-</Typography>
          <Input
            type="number"
            placeholder="最高价"
            value={value.maxValue !== undefined ? String(value.maxValue) : ''}
            onChange={handleMaxValueChange}
            disabled={disabled}
            error={!!error}
          />
        </Box>
      )}

      {/* Error Message */}
      {error && (
        <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
          {error}
        </Typography>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <Typography style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>
          {helperText}
        </Typography>
      )}

      {/* Display Text Preview */}
      {displayText && (
        <Box
          style={{
            marginTop: 12,
            padding: '8px 12px',
            backgroundColor: '#F3F4F6',
            borderRadius: 4,
          }}
        >
          <Typography style={{ fontSize: 12, color: '#6B7280' }}>预览:</Typography>
          <Typography style={{ fontWeight: 500 }}>{displayText}</Typography>
        </Box>
      )}
    </Box>
  );
};
