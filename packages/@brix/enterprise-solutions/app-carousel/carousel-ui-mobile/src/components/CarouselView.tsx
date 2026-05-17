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
 * 轮播组件
 *
 * 【三层分离架构说明】
 * - UI层（本组件）：负责轮播展示和用户交互
 * - Hook层（useCarousel）：封装轮播数据获取、点击记录、自动播放逻辑
 * - 数据层（api/）：通过 HttpCapability 与后端通信
 *
 * 本组件遵循三层分离原则，不直接导入 API，而是通过 useCarousel Hook 获取数据
 *
 * @author Brix Team
 * @since 3.0.0
 * @version 3.2.0
 */
import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Image,
  ScrollView,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Linking,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useCarousel } from '../hooks';
import type { BannerDTO } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CarouselProps {
  /** 轮播位编码 */
  code: string;
  /** 高度 */
  height?: number;
  /** 自定义点击处理 */
  onBannerPress?: (banner: BannerDTO) => void;
  /** 自定义渲染Banner */
  renderBanner?: (banner: BannerDTO, index: number) => React.ReactNode;
}

/**
 * 轮播组件
 */
export const CarouselView: React.FC<CarouselProps> = ({
  code,
  height = 200,
  onBannerPress,
  renderBanner,
}) => {
  // 使用 useCarousel Hook 获取数据和操作方法（三层分离）
  const {
    carousel,
    banners,
    loading,
    error,
    currentIndex,
    setCurrentIndex,
    recordClick,
  } = useCarousel(code);

  const scrollViewRef = useRef<ScrollView>(null);

  // 当 currentIndex 变化时滚动到对应位置
  useEffect(() => {
    if (scrollViewRef.current && banners.length > 0) {
      scrollViewRef.current.scrollTo({
        x: currentIndex * SCREEN_WIDTH,
        animated: true,
      });
    }
  }, [currentIndex, banners.length]);

  /**
   * 处理滚动事件，同步 currentIndex
   */
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SCREEN_WIDTH);
      if (index !== currentIndex && index >= 0 && index < banners.length) {
        setCurrentIndex(index);
      }
    },
    [currentIndex, banners.length, setCurrentIndex]
  );

  /**
   * 处理 Banner 点击
   */
  const handleBannerPress = useCallback(
    async (banner: BannerDTO) => {
      // 通过 Hook 记录点击（三层分离）
      if (banner.id) {
        await recordClick(banner.id);
      }

      // 自定义处理
      if (onBannerPress) {
        onBannerPress(banner);
        return;
      }

      // 默认处理
      const actionValue = banner.actionValueApp || banner.actionValue;
      if (!actionValue) return;

      switch (banner.actionType) {
        case 'LINK':
        case 'DEEP_LINK':
          try {
            const canOpen = await Linking.canOpenURL(actionValue);
            if (canOpen) {
              await Linking.openURL(actionValue);
            }
          } catch (err) {
          }
          break;
        case 'ROUTE':
          // 路由跳转需要导航器支持，这里暂不处理
          break;
        default:
          break;
      }
    },
    [onBannerPress, recordClick]
  );

  if (loading) {
    return (
      <View style={[styles.container, { height }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { height }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {banners.map((banner, index) => (
          <TouchableOpacity
            key={banner.id || index}
            activeOpacity={0.9}
            onPress={() => handleBannerPress(banner)}
            style={[styles.bannerContainer, { width: SCREEN_WIDTH, height }]}
          >
            {renderBanner ? (
              renderBanner(banner, index)
            ) : (
              <Image
                source={{ uri: banner.imageUrlMobile || banner.imageUrl }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 指示器 */}
      {carousel?.settings?.showIndicator && banners.length > 1 && (
        <View style={styles.indicatorContainer}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  bannerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#fff',
    width: 16,
  },
  errorText: {
    color: '#999',
  },
});

export default CarouselView;
