/**
 * @file Product Item Editor Component
 * @description Reusable component for editing product service items (checkup items, treatments, etc.)
 * @module products-ui-web/components/ProductItemEditor
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This component is a pure View layer implementation:
 * - Manages local state for service item list editing
 * - Delegates data persistence to parent via callbacks
 * - Does not make any direct API calls
 * 
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Chip,
  Tooltip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  type SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  ArrowUpward as MoveUpIcon,
  ArrowDownward as MoveDownIcon,
} from '@mui/icons-material';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Service item category
 */
export type ServiceItemCategory = 
  | 'EXAMINATION'   // 检查项目
  | 'TREATMENT'     // 治疗项目
  | 'MEDICATION'    // 用药项目
  | 'SERVICE'       // 服务项目
  | 'ACCOMMODATION' // 住宿项目
  | 'TRANSPORT'     // 交通项目
  | 'OTHER';        // 其他项目

/**
 * Service item data structure
 */
export interface ServiceItem {
  /** Unique identifier */
  id: string;
  /** Item name */
  name: string;
  /** Item description */
  description?: string;
  /** Item category */
  category: ServiceItemCategory;
  /** Unit (e.g., 次, 天, 人) */
  unit?: string;
  /** Quantity */
  quantity?: number;
  /** Unit price (optional, for cost breakdown) */
  unitPrice?: number;
  /** Currency */
  currency?: string;
  /** Whether this item is optional */
  optional?: boolean;
  /** Sort order */
  sortOrder: number;
}

/**
 * ProductItemEditor component props
 */
export interface ProductItemEditorProps {
  /** Current service items list */
  items: ServiceItem[];
  /** Callback when items are updated */
  onChange: (items: ServiceItem[]) => void;
  /** Whether component is in read-only mode */
  readOnly?: boolean;
  /** Whether component is in loading state */
  disabled?: boolean;
  /** Maximum number of items allowed */
  maxItems?: number;
  /** Default currency for unit prices */
  defaultCurrency?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Service item category options
 */
const CATEGORY_OPTIONS: { value: ServiceItemCategory; label: string }[] = [
  { value: 'EXAMINATION', label: '检查项目' },
  { value: 'TREATMENT', label: '治疗项目' },
  { value: 'MEDICATION', label: '用药项目' },
  { value: 'SERVICE', label: '服务项目' },
  { value: 'ACCOMMODATION', label: '住宿项目' },
  { value: 'TRANSPORT', label: '交通项目' },
  { value: 'OTHER', label: '其他项目' },
];

/**
 * Category color mapping
 */
const CATEGORY_COLORS: Record<ServiceItemCategory, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
  EXAMINATION: 'info',
  TREATMENT: 'primary',
  MEDICATION: 'secondary',
  SERVICE: 'success',
  ACCOMMODATION: 'warning',
  TRANSPORT: 'default',
  OTHER: 'default',
};

/**
 * Initial form data for new service item
 */
const INITIAL_ITEM_FORM = {
  name: '',
  description: '',
  category: 'EXAMINATION' as ServiceItemCategory,
  unit: '',
  quantity: 1,
  unitPrice: undefined as number | undefined,
  optional: false,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get category label by value
 */
const getCategoryLabel = (category: ServiceItemCategory): string => {
  return CATEGORY_OPTIONS.find(opt => opt.value === category)?.label || category;
};

/**
 * Generate unique ID for new service item
 */
const generateId = (): string => {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Product Item Editor Component
 * 
 * A comprehensive component for managing product service items.
 * Supports adding, editing, removing, and reordering service items.
 * 
 * Features:
 * - CRUD operations for service items
 * - Item categorization
 * - Quantity and pricing support
 * - Optional item marking
 * - Drag-to-reorder (via up/down buttons)
 * 
 * Usage Example:
 * ```tsx
 * const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
 * 
 * <ProductItemEditor
 *   items={serviceItems}
 *   onChange={setServiceItems}
 * />
 * ```
 */
export const ProductItemEditor: React.FC<ProductItemEditorProps> = ({
  items,
  onChange,
  readOnly = false,
  disabled = false,
  maxItems = 50,
  defaultCurrency = 'CNY',
}) => {
  // ========================================================================
  // Local State
  // ========================================================================
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [formData, setFormData] = useState(INITIAL_ITEM_FORM);
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});
  
  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  /**
   * Handle opening add dialog
   */
  const handleOpenAddDialog = useCallback(() => {
    setEditingItem(null);
    setFormData(INITIAL_ITEM_FORM);
    setFormErrors({});
    setDialogOpen(true);
  }, []);
  
  /**
   * Handle opening edit dialog
   */
  const handleOpenEditDialog = useCallback((item: ServiceItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category,
      unit: item.unit || '',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice,
      optional: item.optional || false,
    });
    setFormErrors({});
    setDialogOpen(true);
  }, []);
  
  /**
   * Handle dialog close
   */
  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData(INITIAL_ITEM_FORM);
    setFormErrors({});
  }, []);
  
  /**
   * Handle form field change
   */
  const handleFormChange = useCallback((
    field: keyof typeof INITIAL_ITEM_FORM,
    value: string | number | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'name') {
      setFormErrors(prev => ({ ...prev, name: undefined }));
    }
  }, []);
  
  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(() => {
    // Validate
    if (!formData.name.trim()) {
      setFormErrors({ name: '请输入项目名称' });
      return;
    }
    
    if (editingItem) {
      // Update existing item
      const updatedItems = items.map(item => 
        item.id === editingItem.id
          ? {
              ...item,
              name: formData.name.trim(),
              description: formData.description.trim() || undefined,
              category: formData.category,
              unit: formData.unit.trim() || undefined,
              quantity: formData.quantity || undefined,
              unitPrice: formData.unitPrice,
              optional: formData.optional,
            }
          : item
      );
      onChange(updatedItems);
    } else {
      // Add new item
      const newItem: ServiceItem = {
        id: generateId(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        unit: formData.unit.trim() || undefined,
        quantity: formData.quantity || undefined,
        unitPrice: formData.unitPrice,
        currency: defaultCurrency,
        optional: formData.optional,
        sortOrder: items.length,
      };
      onChange([...items, newItem]);
    }
    
    handleCloseDialog();
  }, [formData, editingItem, items, onChange, handleCloseDialog, defaultCurrency]);
  
  /**
   * Handle item deletion
   */
  const handleDelete = useCallback((itemId: string) => {
    if (window.confirm('确定要删除这个项目吗？')) {
      const updatedItems = items
        .filter(item => item.id !== itemId)
        .map((item, index) => ({ ...item, sortOrder: index }));
      onChange(updatedItems);
    }
  }, [items, onChange]);
  
  /**
   * Handle move item up
   */
  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onChange(newItems.map((item, i) => ({ ...item, sortOrder: i })));
  }, [items, onChange]);
  
  /**
   * Handle move item down
   */
  const handleMoveDown = useCallback((index: number) => {
    if (index >= items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    onChange(newItems.map((item, i) => ({ ...item, sortOrder: i })));
  }, [items, onChange]);
  
  // ========================================================================
  // Render
  // ========================================================================
  
  const isDisabled = readOnly || disabled;
  
  return (
    <Box>
      {/* Items List */}
      {items.length > 0 ? (
        <List sx={{ mb: 2 }}>
          {items.map((item, index) => (
            <ListItem
              key={item.id}
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 1,
                mb: 1,
                border: '1px solid',
                borderColor: 'divider',
                opacity: item.optional ? 0.8 : 1,
              }}
            >
              {/* Drag Handle (visual only for now) */}
              <DragIcon sx={{ color: 'text.disabled', mr: 1 }} />
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">{item.name}</Typography>
                    <Chip
                      label={getCategoryLabel(item.category)}
                      size="small"
                      color={CATEGORY_COLORS[item.category]}
                    />
                    {item.optional && (
                      <Chip label="可选" size="small" variant="outlined" />
                    )}
                  </Box>
                }
                secondary={
                  <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                    {item.description && (
                      <Typography variant="caption" color="text.secondary">
                        {item.description}
                      </Typography>
                    )}
                    {item.quantity && item.unit && (
                      <Typography variant="caption" color="text.secondary">
                        数量: {item.quantity} {item.unit}
                      </Typography>
                    )}
                    {item.unitPrice !== undefined && (
                      <Typography variant="caption" color="text.secondary">
                        单价: ¥{item.unitPrice.toFixed(2)}
                      </Typography>
                    )}
                  </Stack>
                }
              />
              
              {!isDisabled && (
                <ListItemSecondaryAction>
                  <Tooltip title="上移">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <MoveUpIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="下移">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === items.length - 1}
                      >
                        <MoveDownIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="编辑">
                    <IconButton size="small" onClick={() => handleOpenEditDialog(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="删除">
                    <IconButton size="small" onClick={() => handleDelete(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))}
        </List>
      ) : (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              暂无服务项目
            </Typography>
            <Typography variant="body2" color="text.secondary">
              点击下方按钮添加体检项目、治疗服务等
            </Typography>
          </CardContent>
        </Card>
      )}
      
      {/* Add Button */}
      {!isDisabled && items.length < maxItems && (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          添加服务项目
        </Button>
      )}
      
      {/* Max Items Warning */}
      {items.length >= maxItems && (
        <Alert severity="info" sx={{ mt: 1 }}>
          已达到最大项目数量限制 ({maxItems} 项)
        </Alert>
      )}
      
      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? '编辑服务项目' : '添加服务项目'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Category Select */}
            <FormControl fullWidth>
              <InputLabel>项目类型</InputLabel>
              <Select
                value={formData.category}
                onChange={(e: SelectChangeEvent<ServiceItemCategory>) => 
                  handleFormChange('category', e.target.value)
                }
                label="项目类型"
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Item Name */}
            <TextField
              label="项目名称"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              error={!!formErrors.name}
              helperText={formErrors.name}
              fullWidth
              required
              placeholder="例如：全身CT扫描"
            />
            
            {/* Description */}
            <TextField
              label="项目描述"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="项目详细说明（可选）"
            />
            
            <Divider />
            
            {/* Quantity and Unit */}
            <Stack direction="row" spacing={2}>
              <TextField
                label="数量"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleFormChange('quantity', parseInt(e.target.value) || 1)}
                inputProps={{ min: 1 }}
                sx={{ flex: 1 }}
              />
              <TextField
                label="单位"
                value={formData.unit}
                onChange={(e) => handleFormChange('unit', e.target.value)}
                placeholder="例如：次、天、人"
                sx={{ flex: 1 }}
              />
            </Stack>
            
            {/* Unit Price */}
            <TextField
              label="单价（可选）"
              type="number"
              value={formData.unitPrice ?? ''}
              onChange={(e) => handleFormChange('unitPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 0.5 }}>¥</Typography>,
              }}
              inputProps={{ min: 0, step: 0.01 }}
              placeholder="用于成本核算"
            />
            
            {/* Optional Checkbox (using TextField with select for simplicity) */}
            <FormControl fullWidth>
              <InputLabel>是否可选</InputLabel>
              <Select
                value={formData.optional ? 'true' : 'false'}
                onChange={(e) => handleFormChange('optional', e.target.value === 'true')}
                label="是否可选"
              >
                <MenuItem value="false">必选项目</MenuItem>
                <MenuItem value="true">可选项目</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.name.trim()}
          >
            {editingItem ? '保存' : '添加'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
