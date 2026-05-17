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
 * Product List Component
 *
 * [Three-Layer Separation Architecture]
 * - UI layer (this file): Responsible for rendering and user interaction
 * - Hook layer (hooks/useProductList): Encapsulates business logic and state management
 * - Data layer (api/): Communicates with backend through HttpCapability
 *
 * v3.0 Product Package Module - Mobile UI Product List
 *
 * @author Brix Platform Team
 * @since 3.0.0
 * @version 3.2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Searchbar,
  ActivityIndicator,
  Text,
  Surface,
  SegmentedButtons,
} from 'react-native-paper';
import { useProductList } from '../hooks';
import type { Product, ProductType } from '../types';
import { ProductTypeConfig, ProductStatusConfig } from '../types';

/**
 * Product list component props
 */
interface ProductListProps {
  onProductPress?: (product: Product) => void;
}

/**
 * Product list component
 */
export const ProductList: React.FC<ProductListProps> = ({ onProductPress }) => {
  // Use Hook to get product list (three-layer separation architecture)
  const {
    products,
    loading,
    refreshing,
    error,
    searchKeyword,
    setSearchKeyword,
    filterType,
    setFilterType,
    refresh,
    search,
  } = useProductList({ activeOnly: true });

  // Refresh handler
  const handleRefresh = async () => {
    await refresh();
  };

  // Search handler
  const handleSearch = () => {
    search();
  };

  // Format price
  const formatPrice = (product: Product) => {
    if (product.price) {
      const currency = product.currency === 'JPY' ? '¥' : product.currency;
      return `${currency}${product.price.toLocaleString()}`;
    }
    if (product.priceRange) {
      return product.priceRange;
    }
    return '价格面议';
  };

  // Render product card
  const renderProductCard = ({ item }: { item: Product }) => (
    <Card
      style={styles.card}
      onPress={() => onProductPress?.(item)}
    >
      {item.coverImage ? (
        <Card.Cover source={{ uri: item.coverImage }} style={styles.cardCover} />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>暂无图片</Text>
        </View>
      )}
      <Card.Content style={styles.cardContent}>
        <Title numberOfLines={1} style={styles.cardTitle}>
          {item.name}
        </Title>
        <View style={styles.chipContainer}>
          <Chip
            mode="flat"
            style={[styles.chip, { backgroundColor: ProductTypeConfig[item.type]?.color || '#9E9E9E' }]}
            textStyle={styles.chipText}
          >
            {ProductTypeConfig[item.type]?.label || item.type}
          </Chip>
        </View>
        <Paragraph numberOfLines={2} style={styles.description}>
          {item.description || '暂无描述'}
        </Paragraph>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(item)}</Text>
          {item.duration && (
            <Text style={styles.duration}>{item.duration}</Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  // Type filter options
  const typeButtons = [
    { value: 'ALL', label: '全部' },
    { value: 'CHECKUP', label: '体检' },
    { value: 'TREATMENT', label: '治疗' },
    { value: 'TRANSLATION', label: '翻译' },
    { value: 'TRANSPORT', label: '交通' },
  ];

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Surface style={styles.searchContainer}>
        <Searchbar
          placeholder="搜索产品名称..."
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          onSubmitEditing={handleSearch}
          style={styles.searchbar}
        />
      </Surface>

      {/* Type Filter */}
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={filterType}
          onValueChange={(value) => setFilterType(value as ProductType | 'ALL')}
          buttons={typeButtons}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Product List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无产品</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 12,
    elevation: 2,
  },
  searchbar: {
    elevation: 0,
  },
  filterContainer: {
    padding: 12,
    backgroundColor: '#fff',
  },
  segmentedButtons: {
    // 自适应
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  listContent: {
    padding: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: 12,
    elevation: 2,
  },
  cardCover: {
    height: 120,
  },
  placeholderImage: {
    height: 120,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#9e9e9e',
  },
  cardContent: {
    paddingTop: 8,
  },
  cardTitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  chipContainer: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  chip: {
    height: 24,
  },
  chipText: {
    color: '#fff',
    fontSize: 10,
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f44336',
  },
  duration: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});

export default ProductList;
