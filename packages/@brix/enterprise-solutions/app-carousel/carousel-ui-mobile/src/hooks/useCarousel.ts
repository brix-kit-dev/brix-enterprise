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
 * 轮播 Hook
 *
 * 【三层分离架构说明】
 * - 此 Hook 位于业务逻辑层，封装轮播数据的获取和状态管理
 * - 通过 carouselApi/bannerApi 调用后端（内部使用 HttpCapability）
 * - UI层（components/CarouselView）只需调用此 Hook，无需关心数据获取细节
 *
 * @author Brix Team
 * @since 3.0.0
 * @version 3.2.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { carouselApi, bannerApi } from '../api';
import type { CarouselDTO, BannerDTO, Platform as PlatformType } from '../types';

/**
 * useCarousel 参数选项
 */
export interface UseCarouselOptions {
  /** 是否自动加载 */
  autoFetch?: boolean;
  /** 平台（默认根据当前环境） */
  platform?: PlatformType;
}

/**
 * useCarousel 返回值
 */
export interface UseCarouselReturn {
  /** 轮播位信息 */
  carousel: CarouselDTO | null;
  /** Banner列表 */
  banners: BannerDTO[];
  /** 是否加载中 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 当前索引 */
  currentIndex: number;
  /** 设置当前索引 */
  setCurrentIndex: (index: number) => void;
  /** 刷新数据 */
  refresh: () => Promise<void>;
  /** 记录点击 */
  recordClick: (bannerId: number) => Promise<void>;
  /** 开始自动播放 */
  startAutoPlay: () => void;
  /** 停止自动播放 */
  stopAutoPlay: () => void;
}

/**
 * 轮播 Hook
 *
 * @param code 轮播位编码
 * @param options 配置选项
 * @returns 轮播状态和操作方法
 *
 * @example
 * ```tsx
 * function CarouselScreen() {
 *   const {
 *     carousel,
 *     banners,
 *     loading,
 *     currentIndex,
 *     setCurrentIndex,
 *     recordClick,
 *   } = useCarousel('HOME_BANNER');
 *
 *   return (
 *     <ScrollView horizontal>
 *       {banners.map((banner, index) => (
 *         <BannerItem
 *           key={banner.id}
 *           banner={banner}
 *           onPress={() => recordClick(banner.id!)}
 *         />
 *       ))}
 *     </ScrollView>
 *   );
 * }
 * ```
 */
export function useCarousel(
  code: string,
  options: UseCarouselOptions = {}
): UseCarouselReturn {
  const {
    autoFetch = true,
    platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
  } = options;

  // 状态
  const [carousel, setCarousel] = useState<CarouselDTO | null>(null);
  const [banners, setBanners] = useState<BannerDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // 自动播放定时器
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * 获取轮播数据
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const carouselData = await carouselApi.getByCode(code);
      setCarousel(carouselData);

      const bannersData = await carouselApi.getActiveBanners(code, platform);
      setBanners(bannersData);

      // 记录展示
      if (bannersData.length > 0) {
        const bannerIds = bannersData.map((b) => b.id!).filter(Boolean);
        if (bannerIds.length > 0) {
          bannerApi.recordViews(bannerIds);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载轮播数据失败');
    } finally {
      setLoading(false);
    }
  }, [code, platform]);

  /**
   * 刷新数据
   */
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  /**
   * 记录点击
   */
  const recordClick = useCallback(async (bannerId: number) => {
    try {
      await bannerApi.recordClick(bannerId);
    } catch (err) {
    }
  }, []);

  /**
   * 开始自动播放
   */
  const startAutoPlay = useCallback(() => {
    if (autoPlayTimer.current) {
      clearInterval(autoPlayTimer.current);
    }

    const interval = carousel?.settings?.interval || 5000;
    autoPlayTimer.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, interval);
  }, [carousel, banners.length]);

  /**
   * 停止自动播放
   */
  const stopAutoPlay = useCallback(() => {
    if (autoPlayTimer.current) {
      clearInterval(autoPlayTimer.current);
      autoPlayTimer.current = null;
    }
  }, []);

  // 自动加载
  useEffect(() => {
    if (autoFetch && code) {
      fetchData();
    }

    return () => {
      if (autoPlayTimer.current) {
        clearInterval(autoPlayTimer.current);
      }
    };
  }, [autoFetch, code]);

  // 启动自动播放
  useEffect(() => {
    if (carousel?.settings?.autoPlay && banners.length > 1) {
      startAutoPlay();
    }
    return () => {
      stopAutoPlay();
    };
  }, [carousel, banners.length]);

  return {
    carousel,
    banners,
    loading,
    error,
    currentIndex,
    setCurrentIndex,
    refresh,
    recordClick,
    startAutoPlay,
    stopAutoPlay,
  };
}
