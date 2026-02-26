/**
 * @file Price Range Input Component
 * @description Reusable component for inputting price range (min-max) with currency selection
 * @module products-ui-web/components/PriceRangeInput
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This component is a pure View layer implementation:
 * - Manages controlled price input state
 * - Provides formatted display of price range
 * - Does not contain any business logic
 * 
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

import React, { useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Stack,
  InputAdornment,
  FormHelperText,
  type SelectChangeEvent,
} from '@mui/material';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Price range data structure
 */
export interface PriceRange {
  /** Minimum price */
  minPrice?: number;
  /** Maximum price */
  maxPrice?: number;
  /** Fixed price (when min = max or single price) */
  fixedPrice?: number;
  /** Currency code (ISO 4217) */
  currency: string;
  /** Price range display text (e.g., "¥10,000 - ¥50,000") */
  displayText?: string;
}

/**
 * PriceRangeInput component props
 */
export interface PriceRangeInputProps {
  /** Current price range value */
  value: PriceRange;
  /** Callback when price range changes */
  onChange: (value: PriceRange) => void;
  /** Input mode: 'fixed' for single price, 'range' for min-max */
  mode?: 'fixed' | 'range';
  /** Callback when mode changes */
  onModeChange?: (mode: 'fixed' | 'range') => void;
  /** Available currency options */
  currencies?: { code: string; symbol: string; label: string }[];
  /** Whether component is disabled */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Label for the component */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Minimum allowed price */
  minValue?: number;
  /** Maximum allowed price */
  maxValue?: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default currency options
 */
const DEFAULT_CURRENCIES = [
  { code: 'CNY', symbol: '¥', label: '人民币 (CNY)' },
  { code: 'JPY', symbol: '¥', label: '日元 (JPY)' },
  { code: 'USD', symbol: '$', label: '美元 (USD)' },
  { code: 'EUR', symbol: '€', label: '欧元 (EUR)' },
];

/**
 * Currency symbol mapping
 */
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

/**
 * Format price with currency symbol and thousand separators
 * 
 * @param price - Price value
 * @param currency - Currency code
 * @returns Formatted price string
 */
const formatPrice = (price: number | undefined, currency: string): string => {
  if (price === undefined || price === null) return '';
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol}${price.toLocaleString('zh-CN')}`;
};

/**
 * Generate display text for price range
 * 
 * @param range - Price range data
 * @returns Display text string
 */
const generateDisplayText = (range: PriceRange): string => {
  if (range.fixedPrice !== undefined) {
    return formatPrice(range.fixedPrice, range.currency);
  }
  if (range.minPrice !== undefined && range.maxPrice !== undefined) {
    if (range.minPrice === range.maxPrice) {
      return formatPrice(range.minPrice, range.currency);
    }
    return `${formatPrice(range.minPrice, range.currency)} - ${formatPrice(range.maxPrice, range.currency)}`;
  }
  if (range.minPrice !== undefined) {
    return `${formatPrice(range.minPrice, range.currency)} 起`;
  }
  if (range.maxPrice !== undefined) {
    return `最高 ${formatPrice(range.maxPrice, range.currency)}`;
  }
  return '';
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Price Range Input Component
 * 
 * A flexible component for inputting fixed prices or price ranges.
 * Supports multiple currencies and displays formatted price text.
 * 
 * Features:
 * - Fixed price or range (min-max) input modes
 * - Multi-currency support
 * - Automatic display text generation
 * - Input validation
 * 
 * Usage Example:
 * ```tsx
 * const [priceRange, setPriceRange] = useState<PriceRange>({
 *   minPrice: 10000,
 *   maxPrice: 50000,
 *   currency: 'CNY',
 * });
 * 
 * <PriceRangeInput
 *   value={priceRange}
 *   onChange={setPriceRange}
 *   mode="range"
 * />
 * ```
 */
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
  minValue = 0,
  maxValue = 99999999,
}) => {
  // ========================================================================
  // Derived State
  // ========================================================================
  
  /**
   * Get currency symbol for current currency
   */
  const currencySymbol = useMemo(() => {
    return CURRENCY_SYMBOLS[value.currency] || value.currency;
  }, [value.currency]);
  
  /**
   * Generated display text
   */
  const displayText = useMemo(() => {
    return generateDisplayText(value);
  }, [value]);
  
  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  /**
   * Handle fixed price change
   */
  const handleFixedPriceChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = event.target.value ? parseFloat(event.target.value) : undefined;
    const newValue: PriceRange = {
      ...value,
      fixedPrice: numValue,
      minPrice: numValue,
      maxPrice: numValue,
      displayText: generateDisplayText({ ...value, fixedPrice: numValue }),
    };
    onChange(newValue);
  }, [value, onChange]);
  
  /**
   * Handle min price change
   */
  const handleMinPriceChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = event.target.value ? parseFloat(event.target.value) : undefined;
    const newValue: PriceRange = {
      ...value,
      minPrice: numValue,
      fixedPrice: undefined,
      displayText: generateDisplayText({ ...value, minPrice: numValue, fixedPrice: undefined }),
    };
    onChange(newValue);
  }, [value, onChange]);
  
  /**
   * Handle max price change
   */
  const handleMaxPriceChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = event.target.value ? parseFloat(event.target.value) : undefined;
    const newValue: PriceRange = {
      ...value,
      maxPrice: numValue,
      fixedPrice: undefined,
      displayText: generateDisplayText({ ...value, maxPrice: numValue, fixedPrice: undefined }),
    };
    onChange(newValue);
  }, [value, onChange]);
  
  /**
   * Handle currency change
   */
  const handleCurrencyChange = useCallback((event: SelectChangeEvent<string>) => {
    const newCurrency = event.target.value;
    const newValue: PriceRange = {
      ...value,
      currency: newCurrency,
      displayText: generateDisplayText({ ...value, currency: newCurrency }),
    };
    onChange(newValue);
  }, [value, onChange]);
  
  /**
   * Handle mode change
   */
  const handleModeChange = useCallback((event: SelectChangeEvent<string>) => {
    const newMode = event.target.value as 'fixed' | 'range';
    onModeChange?.(newMode);
    
    // Reset values when switching modes
    if (newMode === 'fixed') {
      const fixedPrice = value.minPrice || value.maxPrice;
      onChange({
        ...value,
        fixedPrice,
        minPrice: fixedPrice,
        maxPrice: fixedPrice,
      });
    } else {
      onChange({
        ...value,
        fixedPrice: undefined,
      });
    }
  }, [value, onChange, onModeChange]);
  
  // ========================================================================
  // Render
  // ========================================================================
  
  return (
    <Box>
      {/* Label */}
      {label && (
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}
      
      <Stack spacing={2}>
        {/* Mode and Currency Selection Row */}
        <Stack direction="row" spacing={2}>
          {/* Price Mode Select */}
          {onModeChange && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>定价方式</InputLabel>
              <Select
                value={mode}
                onChange={handleModeChange}
                label="定价方式"
                disabled={disabled}
              >
                <MenuItem value="fixed">固定价格</MenuItem>
                <MenuItem value="range">价格区间</MenuItem>
              </Select>
            </FormControl>
          )}
          
          {/* Currency Select */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>货币</InputLabel>
            <Select
              value={value.currency}
              onChange={handleCurrencyChange}
              label="货币"
              disabled={disabled}
            >
              {currencies.map((curr) => (
                <MenuItem key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        
        {/* Price Input(s) */}
        {mode === 'fixed' ? (
          <TextField
            label="价格"
            type="number"
            value={value.fixedPrice ?? ''}
            onChange={handleFixedPriceChange}
            disabled={disabled}
            error={!!error}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">{currencySymbol}</InputAdornment>
              ),
            }}
            inputProps={{
              min: minValue,
              max: maxValue,
              step: 0.01,
            }}
            fullWidth
          />
        ) : (
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="最低价"
              type="number"
              value={value.minPrice ?? ''}
              onChange={handleMinPriceChange}
              disabled={disabled}
              error={!!error}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">{currencySymbol}</InputAdornment>
                ),
              }}
              inputProps={{
                min: minValue,
                max: value.maxPrice || maxValue,
                step: 0.01,
              }}
              sx={{ flex: 1 }}
            />
            <Typography color="text.secondary">—</Typography>
            <TextField
              label="最高价"
              type="number"
              value={value.maxPrice ?? ''}
              onChange={handleMaxPriceChange}
              disabled={disabled}
              error={!!error}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">{currencySymbol}</InputAdornment>
                ),
              }}
              inputProps={{
                min: value.minPrice || minValue,
                max: maxValue,
                step: 0.01,
              }}
              sx={{ flex: 1 }}
            />
          </Stack>
        )}
        
        {/* Display Text Preview */}
        {displayText && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              显示效果:
            </Typography>
            <Typography variant="body1" color="primary" fontWeight="medium">
              {displayText}
            </Typography>
          </Box>
        )}
        
        {/* Error Message */}
        {error && (
          <FormHelperText error>{error}</FormHelperText>
        )}
        
        {/* Helper Text */}
        {helperText && !error && (
          <FormHelperText>{helperText}</FormHelperText>
        )}
      </Stack>
    </Box>
  );
};
