/**
 * Partner List Component
 * 
 * [Three-Layer Separation Architecture]
 * - UI layer (this file): Responsible for rendering and user interaction
 * - Hook layer (hooks/usePartnerList): Encapsulates business logic and state management
 * - Data layer (api/): Communicates with backend through HttpCapability
 * 
 * @description Displays partner list on mobile
 * @version 3.2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Searchbar,
  ActivityIndicator,
  Text,
  IconButton,
  Menu,
  Divider,
} from 'react-native-paper';
import { usePartnerList } from '../hooks';
import type { PartnerDTO, PartnerType } from '../types';
import { PARTNER_TYPES, PARTNER_STATUSES } from '../types';

interface PartnerListProps {
  /** Callback when partner is pressed */
  onPartnerPress?: (partner: PartnerDTO) => void;
  /** Filter type */
  filterType?: PartnerType;
  /** Show only available partners */
  availableOnly?: boolean;
}

/**
 * Partner list component
 */
export const PartnerList: React.FC<PartnerListProps> = ({
  onPartnerPress,
  filterType,
  availableOnly = false,
}) => {
  // Use Hook to get partner list (three-layer separation architecture)
  const {
    partners,
    loading,
    refreshing,
    error,
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    filteredPartners,
    refresh,
  } = usePartnerList({ filterType, availableOnly });

  const [typeMenuVisible, setTypeMenuVisible] = useState(false);

  /**
   * Pull to refresh
   */
  const onRefresh = () => {
    refresh();
  };

  return (
    <View style={styles.container}>
      {/* Search and Filter Bar */}
      <View style={styles.searchBar}>
        <Searchbar
          placeholder="搜索名称或编码"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
   */
  const renderPartnerCard = ({ item }: { item: PartnerDTO }) => {
    const typeConfig = PARTNER_TYPES[item.partnerType];
    const statusConfig = PARTNER_STATUSES[item.status];

    return (
      <TouchableOpacity
        onPress={() => onPartnerPress?.(item)}
        activeOpacity={0.7}
      >
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Title style={styles.name}>{item.name}</Title>
                {item.shortName && (
                  <Text style={styles.shortName}>{item.shortName}</Text>
                )}
              </View>
              <Chip
                style={[styles.statusChip, { backgroundColor: statusConfig.color + '20' }]}
                textStyle={{ color: statusConfig.color, fontSize: 12 }}
              >
                {statusConfig.label}
              </Chip>
            </View>
            
            <Text style={styles.code}>{item.partnerCode}</Text>
            
            <View style={styles.infoRow}>
              <Chip icon={typeConfig.icon} style={styles.typeChip}>
                {typeConfig.label}
              </Chip>
              {item.serviceArea && (
                <Text style={styles.serviceArea}>{item.serviceArea}</Text>
              )}
            </View>
            
            {item.contactName && (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>联系人：</Text>
                <Text style={styles.contactValue}>{item.contactName}</Text>
                {item.contactPhone && (
                  <Text style={styles.contactPhone}>{item.contactPhone}</Text>
                )}
              </View>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  /**
   * 渲染空状态
   */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>暂无合作伙伴</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 搜索和筛选栏 */}
      <View style={styles.searchBar}>
        <Searchbar
          placeholder="搜索名称或编码"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        <Menu
          visible={typeMenuVisible}
          onDismiss={() => setTypeMenuVisible(false)}
          anchor={
            <IconButton
              icon="filter-variant"
              onPress={() => setTypeMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            title="全部类型"
            onPress={() => {
              setSelectedType(undefined);
              setTypeMenuVisible(false);
            }}
          />
          <Divider />
          {Object.entries(PARTNER_TYPES).map(([key, config]) => (
            <Menu.Item
              key={key}
              title={config.label}
              leadingIcon={config.icon}
              onPress={() => {
                setSelectedType(key as PartnerType);
                setTypeMenuVisible(false);
              }}
            />
          ))}
        </Menu>
      </View>

      {/* Partner List */}
      <FlatList
        data={filteredPartners}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPartnerCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
  },
  listContent: {
    padding: 12,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  shortName: {
    fontSize: 12,
    color: '#666',
  },
  statusChip: {
    height: 24,
  },
  code: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#888',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeChip: {
    marginRight: 8,
    height: 28,
  },
  serviceArea: {
    fontSize: 12,
    color: '#666',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: 12,
    color: '#888',
  },
  contactValue: {
    fontSize: 12,
    marginRight: 8,
  },
  contactPhone: {
    fontSize: 12,
    color: '#1976d2',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
  },
});

export default PartnerList;
