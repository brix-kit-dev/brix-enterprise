/**
 * @file Partner Selector Component
 * @description Reusable component for selecting a partner from available partners list
 * @module products-ui-web/components/PartnerSelector
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This component is a pure View layer implementation:
 * - Receives partner options from parent
 * - Manages local search/filter state
 * - Does not make any direct API calls
 * 
 * Data Loading Pattern:
 * The parent component should use a ViewModel hook (e.g., usePartnerOptions)
 * to load partners and pass them as props to this component.
 * 
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Chip,
  Typography,
  Avatar,
  CircularProgress,
  InputAdornment,
  Stack,
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocalHospital as HospitalIcon,
  Hotel as HotelIcon,
  DirectionsCar as TransportIcon,
  Translate as TranslationIcon,
  Category as OtherIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Partner type (should match backend PartnerType)
 */
export type PartnerType = 'HOSPITAL' | 'HOTEL' | 'TRANSPORT' | 'TRANSLATION' | 'OTHER';

/**
 * Partner option for selector
 */
export interface PartnerOption {
  /** Partner ID */
  id: number;
  /** Partner code */
  code: string;
  /** Partner name */
  name: string;
  /** Partner short name */
  shortName?: string;
  /** Partner type */
  type: PartnerType;
  /** Contact name */
  contactName?: string;
  /** Service area */
  serviceArea?: string;
}

/**
 * PartnerSelector component props
 */
export interface PartnerSelectorProps {
  /** Currently selected partner ID */
  value?: number;
  /** Callback when selection changes */
  onChange: (partnerId: number | undefined, partner: PartnerOption | null) => void;
  /** Available partner options */
  partners: PartnerOption[];
  /** Whether partners are loading */
  loading?: boolean;
  /** Error message when loading fails */
  error?: string;
  /** Whether component is disabled */
  disabled?: boolean;
  /** Input label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Helper text */
  helperText?: string;
  /** Validation error message */
  validationError?: string;
  /** Whether field is required */
  required?: boolean;
  /** Filter partners by type */
  filterByType?: PartnerType[];
  /** Show partner type badge */
  showTypeBadge?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Partner type display configuration
 */
const PARTNER_TYPE_CONFIG: Record<PartnerType, { label: string; color: string; icon: React.ElementType }> = {
  HOSPITAL: { label: '医院', color: '#4CAF50', icon: HospitalIcon },
  HOTEL: { label: '酒店', color: '#2196F3', icon: HotelIcon },
  TRANSPORT: { label: '交通', color: '#FF9800', icon: TransportIcon },
  TRANSLATION: { label: '翻译', color: '#9C27B0', icon: TranslationIcon },
  OTHER: { label: '其他', color: '#607D8B', icon: OtherIcon },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get icon component for partner type
 */
const getPartnerTypeIcon = (type: PartnerType): React.ReactNode => {
  const config = PARTNER_TYPE_CONFIG[type];
  const Icon = config?.icon || BusinessIcon;
  return <Icon sx={{ color: config?.color || 'inherit' }} />;
};

/**
 * Get label for partner type
 */
const getPartnerTypeLabel = (type: PartnerType): string => {
  return PARTNER_TYPE_CONFIG[type]?.label || type;
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Partner Selector Component
 * 
 * An autocomplete component for selecting partners with search and filtering.
 * Displays partner information including name, type, and service area.
 * 
 * Features:
 * - Autocomplete with search functionality
 * - Partner type icons and badges
 * - Loading and error states
 * - Type-based filtering
 * 
 * Usage Example:
 * ```tsx
 * const { partners, loading } = usePartnerOptions();
 * 
 * <PartnerSelector
 *   value={selectedPartnerId}
 *   onChange={(id, partner) => setSelectedPartnerId(id)}
 *   partners={partners}
 *   loading={loading}
 *   filterByType={['HOSPITAL']}
 * />
 * ```
 */
export const PartnerSelector: React.FC<PartnerSelectorProps> = ({
  value,
  onChange,
  partners,
  loading = false,
  error,
  disabled = false,
  label = '合作方',
  placeholder = '搜索并选择合作方...',
  helperText,
  validationError,
  required = false,
  filterByType,
  showTypeBadge = true,
}) => {
  // ========================================================================
  // Local State
  // ========================================================================
  
  const [inputValue, setInputValue] = useState('');
  
  // ========================================================================
  // Derived State
  // ========================================================================
  
  /**
   * Filter partners based on type filter
   */
  const filteredPartners = useMemo(() => {
    if (!filterByType || filterByType.length === 0) {
      return partners;
    }
    return partners.filter(p => filterByType.includes(p.type));
  }, [partners, filterByType]);
  
  /**
   * Get selected partner object from ID
   */
  const selectedPartner = useMemo(() => {
    if (value === undefined) return null;
    return partners.find(p => p.id === value) || null;
  }, [value, partners]);
  
  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  /**
   * Handle selection change
   */
  const handleChange = useCallback((
    _event: React.SyntheticEvent,
    newValue: PartnerOption | null
  ) => {
    onChange(newValue?.id, newValue);
  }, [onChange]);
  
  /**
   * Handle input value change
   */
  const handleInputChange = useCallback((
    _event: React.SyntheticEvent,
    newInputValue: string
  ) => {
    setInputValue(newInputValue);
  }, []);
  
  // ========================================================================
  // Custom Filter Function
  // ========================================================================
  
  /**
   * Filter options based on input value
   * Searches by name, short name, and code
   */
  const filterOptions = useCallback((
    options: PartnerOption[],
    state: { inputValue: string }
  ): PartnerOption[] => {
    const searchValue = state.inputValue.toLowerCase().trim();
    if (!searchValue) return options;
    
    return options.filter(option => 
      option.name.toLowerCase().includes(searchValue) ||
      option.shortName?.toLowerCase().includes(searchValue) ||
      option.code.toLowerCase().includes(searchValue) ||
      option.contactName?.toLowerCase().includes(searchValue) ||
      option.serviceArea?.toLowerCase().includes(searchValue)
    );
  }, []);
  
  // ========================================================================
  // Render
  // ========================================================================
  
  const hasError = !!validationError || !!error;
  
  return (
    <Autocomplete
      value={selectedPartner}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      options={filteredPartners}
      filterOptions={filterOptions}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      disabled={disabled}
      loading={loading}
      noOptionsText={error || '没有找到匹配的合作方'}
      loadingText="加载中..."
      fullWidth
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={hasError}
          helperText={validationError || error || helperText}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                {selectedPartner ? (
                  getPartnerTypeIcon(selectedPartner.type)
                ) : (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                )}
                {params.InputProps.startAdornment}
              </>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.id}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
            {/* Partner Type Avatar */}
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: PARTNER_TYPE_CONFIG[option.type]?.color || 'grey.500',
              }}
            >
              {getPartnerTypeIcon(option.type)}
            </Avatar>
            
            {/* Partner Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body1" noWrap>
                  {option.name}
                </Typography>
                {showTypeBadge && (
                  <Chip
                    label={getPartnerTypeLabel(option.type)}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      bgcolor: PARTNER_TYPE_CONFIG[option.type]?.color || 'grey.500',
                      color: 'white',
                    }}
                  />
                )}
              </Stack>
              <Stack direction="row" spacing={2}>
                <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                  {option.code}
                </Typography>
                {option.serviceArea && (
                  <Typography variant="caption" color="text.secondary">
                    {option.serviceArea}
                  </Typography>
                )}
              </Stack>
            </Box>
          </Stack>
        </Box>
      )}
    />
  );
};
