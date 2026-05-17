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
 * @file Partner Selector Component
 * @description Autocomplete component for selecting partners (UIAdapter pattern)
 * @module products-ui-web/components/PartnerSelector
 * @version 3.2.0
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useUI } from '@brix-sdk/runtime-sdk-react';

// ============================================================================
// Type Definitions
// ============================================================================

export interface PartnerInfo {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'lab' | 'pharmacy' | 'insurance' | 'other';
  code?: string;
  status?: 'active' | 'inactive';
  location?: string;
  categoryId?: string;
}

export interface PartnerSelectorProps {
  value?: string;
  onChange: (partnerId: string | null, partner: PartnerInfo | null) => void;
  partners?: PartnerInfo[];
  onSearch?: (keyword: string) => Promise<PartnerInfo[]>;
  partnerType?: PartnerInfo['type'] | 'all';
  disabled?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  allowClear?: boolean;
  showType?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const PARTNER_TYPE_ICONS: Record<string, string> = {
  hospital: 'local_hospital',
  clinic: 'medical_services',
  lab: 'science',
  pharmacy: 'medication',
  insurance: 'verified_user',
  other: 'business',
};

const PARTNER_TYPE_LABELS: Record<string, string> = {
  hospital: '医院',
  clinic: '诊所',
  lab: '检验机构',
  pharmacy: '药房',
  insurance: '保险',
  other: '其他',
};

const PARTNER_TYPE_COLORS: Record<string, string> = {
  hospital: '#1976D2',
  clinic: '#388E3C',
  lab: '#7B1FA2',
  pharmacy: '#F57C00',
  insurance: '#0288D1',
  other: '#616161',
};

// ============================================================================
// Helper Functions
// ============================================================================

const filterPartners = (
  partners: PartnerInfo[],
  keyword: string,
  partnerType: PartnerInfo['type'] | 'all' = 'all'
): PartnerInfo[] => {
  const loweredKeyword = keyword.toLowerCase();
  
  return partners.filter(partner => {
    // Type filter
    if (partnerType !== 'all' && partner.type !== partnerType) {
      return false;
    }
    
    // Keyword filter
    if (keyword) {
      const searchFields = [
        partner.name,
        partner.code,
        partner.location,
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (!searchFields.includes(loweredKeyword)) {
        return false;
      }
    }
    
    return true;
  });
};

// ============================================================================
// Component Implementation
// ============================================================================

export const PartnerSelector: React.FC<PartnerSelectorProps> = ({
  value,
  onChange,
  partners = [],
  onSearch,
  partnerType = 'all',
  disabled = false,
  error,
  label,
  placeholder = '搜索合作方...',
  helperText,
  allowClear = true,
  showType = true,
}) => {
  const { Box, Typography, Input, Icon, Spin } = useUI();
  
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredPartners, setFilteredPartners] = useState<PartnerInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Selected partner info
  const selectedPartner = useMemo(() => {
    return partners.find(p => p.id === value);
  }, [partners, value]);
  
  // Update input when value changes externally
  useEffect(() => {
    if (selectedPartner) {
      setInputValue(selectedPartner.name);
    } else if (!value) {
      setInputValue('');
    }
  }, [selectedPartner, value]);
  
  // Filter partners on input change
  useEffect(() => {
    const handleFilter = async () => {
      if (onSearch && inputValue.length >= 2) {
        setLoading(true);
        try {
          const results = await onSearch(inputValue);
          setFilteredPartners(filterPartners(results, '', partnerType));
        } catch (err) {
          setFilteredPartners([]);
        } finally {
          setLoading(false);
        }
      } else {
        setFilteredPartners(filterPartners(partners, inputValue, partnerType));
      }
    };
    
    const debounceTimer = setTimeout(handleFilter, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, partners, partnerType, onSearch]);
  
  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handlers
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    setHoveredIndex(-1);
  }, []);
  
  const handleSelect = useCallback((partner: PartnerInfo) => {
    onChange(partner.id, partner);
    setInputValue(partner.name);
    setIsOpen(false);
  }, [onChange]);
  
  const handleClear = useCallback(() => {
    onChange(null, null);
    setInputValue('');
    setIsOpen(false);
  }, [onChange]);
  
  const handleFocus = useCallback(() => {
    setIsOpen(true);
  }, []);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHoveredIndex(prev => 
          prev < filteredPartners.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHoveredIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (hoveredIndex >= 0 && filteredPartners[hoveredIndex]) {
          handleSelect(filteredPartners[hoveredIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  }, [isOpen, filteredPartners, hoveredIndex, handleSelect]);
  
  // Render item
  const renderPartnerItem = (partner: PartnerInfo, index: number) => {
    const isHovered = index === hoveredIndex;
    const isSelected = partner.id === value;
    
    return (
      <div
        key={partner.id}
        onClick={() => handleSelect(partner)}
        onMouseEnter={() => setHoveredIndex(index)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 12px',
          cursor: 'pointer',
          backgroundColor: isHovered ? '#F3F4F6' : isSelected ? '#EBF5FF' : 'transparent',
          borderLeft: isSelected ? '3px solid #1976D2' : '3px solid transparent',
        }}
      >
        {/* Type Icon */}
        {showType && (
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: PARTNER_TYPE_COLORS[partner.type] + '20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon
              name={PARTNER_TYPE_ICONS[partner.type]}
              style={{
                fontSize: 18,
                color: PARTNER_TYPE_COLORS[partner.type],
              }}
            />
          </Box>
        )}
        
        {/* Partner Info */}
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Typography
            style={{
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {partner.name}
          </Typography>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            {partner.code && (
              <Typography style={{ fontSize: 12, color: '#6B7280' }}>
                {partner.code}
              </Typography>
            )}
            {showType && (
              <Typography
                style={{
                  fontSize: 11,
                  color: PARTNER_TYPE_COLORS[partner.type],
                  backgroundColor: PARTNER_TYPE_COLORS[partner.type] + '15',
                  padding: '1px 6px',
                  borderRadius: 4,
                }}
              >
                {PARTNER_TYPE_LABELS[partner.type]}
              </Typography>
            )}
            {partner.location && (
              <Typography style={{ fontSize: 12, color: '#9CA3AF' }}>
                {partner.location}
              </Typography>
            )}
          </Box>
        </Box>
        
        {/* Selected Indicator */}
        {isSelected && (
          <Icon name="check" style={{ fontSize: 18, color: '#1976D2' }} />
        )}
      </div>
    );
  };
  
  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Label */}
      {label && (
        <Typography
          style={{
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 6,
            color: disabled ? '#9CA3AF' : '#374151',
          }}
        >
          {label}
        </Typography>
      )}
      
      {/* Input Container */}
      <Box style={{ position: 'relative' }}>
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          error={!!error}
          style={{ width: '100%', paddingRight: allowClear && value ? 64 : 32 }}
        />
        
        {/* Icons */}
        <Box
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {loading && <Spin size="small" />}
          
          {allowClear && value && !disabled && (
            <Box
              onClick={handleClear}
              style={{
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Icon name="close" style={{ fontSize: 16, color: '#9CA3AF' }} />
            </Box>
          )}
          
          <Icon
            name={isOpen ? 'expand_less' : 'expand_more'}
            style={{ fontSize: 20, color: '#6B7280' }}
          />
        </Box>
      </Box>
      
      {/* Dropdown */}
      {isOpen && !disabled && (
        <Box
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            backgroundColor: 'white',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {filteredPartners.length > 0 ? (
            filteredPartners.map((partner, index) => 
              renderPartnerItem(partner, index)
            )
          ) : (
            <Box style={{ padding: 16, textAlign: 'center' }}>
              <Typography style={{ color: '#9CA3AF' }}>
                {inputValue ? '未找到匹配的合作方' : '请输入关键词搜索'}
              </Typography>
            </Box>
          )}
        </Box>
      )}
      
      {/* Error */}
      {error && (
        <Typography style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
          {error}
        </Typography>
      )}
      
      {/* Helper Text */}
      {helperText && !error && (
        <Typography style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
          {helperText}
        </Typography>
      )}
    </div>
  );
};
