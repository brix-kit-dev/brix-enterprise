/**
 * @file Carousel module constant definitions
 * @description Status enums, permission codes, and other constants
 * @module @shinwa/carousel-shared/constants
 * @version 3.0.0
 */

// ============================================================================
// Banner Status Constants
// ============================================================================

/**
 * Banner Status Mapping
 * 
 * Provides display names, i18n keys, and colors for statuses.
 */
export const BANNER_STATUS = {
  DRAFT: {
    value: 'DRAFT',
    label: '草稿',
    labelKey: 'carousel.bannerStatus.draft',
    color: 'default',
  },
  ENABLED: {
    value: 'ENABLED',
    label: '已启用',
    labelKey: 'carousel.bannerStatus.enabled',
    color: 'success',
  },
  DISABLED: {
    value: 'DISABLED',
    label: '已禁用',
    labelKey: 'carousel.bannerStatus.disabled',
    color: 'error',
  },
  EXPIRED: {
    value: 'EXPIRED',
    label: '已过期',
    labelKey: 'carousel.bannerStatus.expired',
    color: 'warning',
  },
} as const;

/**
 * Banner Action Type Mapping
 */
export const BANNER_ACTION_TYPE = {
  NONE: {
    value: 'NONE',
    label: '无动作',
    labelKey: 'carousel.actionType.none',
    icon: 'block',
  },
  LINK: {
    value: 'LINK',
    label: '外部链接',
    labelKey: 'carousel.actionType.link',
    icon: 'link',
  },
  ROUTE: {
    value: 'ROUTE',
    label: '内部路由',
    labelKey: 'carousel.actionType.route',
    icon: 'navigation',
  },
  POPUP: {
    value: 'POPUP',
    label: '弹窗',
    labelKey: 'carousel.actionType.popup',
    icon: 'open_in_new',
  },
  DEEP_LINK: {
    value: 'DEEP_LINK',
    label: '深度链接',
    labelKey: 'carousel.actionType.deepLink',
    icon: 'launch',
  },
} as const;

/**
 * Platform Type Mapping
 */
export const PLATFORM_TYPE = {
  ALL: {
    value: 'ALL',
    label: '全平台',
    labelKey: 'carousel.platform.all',
    icon: 'devices',
  },
  WEB: {
    value: 'WEB',
    label: 'Web',
    labelKey: 'carousel.platform.web',
    icon: 'computer',
  },
  H5: {
    value: 'H5',
    label: 'H5',
    labelKey: 'carousel.platform.h5',
    icon: 'smartphone',
  },
  IOS: {
    value: 'IOS',
    label: 'iOS',
    labelKey: 'carousel.platform.ios',
    icon: 'phone_iphone',
  },
  ANDROID: {
    value: 'ANDROID',
    label: 'Android',
    labelKey: 'carousel.platform.android',
    icon: 'phone_android',
  },
  MINI_PROGRAM: {
    value: 'MINI_PROGRAM',
    label: '小程序',
    labelKey: 'carousel.platform.miniProgram',
    icon: 'apps',
  },
} as const;

// ============================================================================
// Permission Constants
// ============================================================================

/**
 * Carousel module permission codes
 * 
 * Consistent with permissions in ui-manifest.yaml.
 */
export const CAROUSEL_PERMISSIONS = {
  /** View carousel */
  READ: 'carousel:read',
  /** Create carousel */
  CREATE: 'carousel:create',
  /** Edit carousel */
  UPDATE: 'carousel:update',
  /** Delete carousel */
  DELETE: 'carousel:delete',
  /** Manage banners */
  MANAGE_BANNER: 'carousel:manage_banner',
  /** View statistics */
  VIEW_STATS: 'carousel:view_stats',
} as const;

/**
 * Permission code type
 */
export type CarouselPermission = typeof CAROUSEL_PERMISSIONS[keyof typeof CAROUSEL_PERMISSIONS];

// ============================================================================
// Page ID Constants
// ============================================================================

/**
 * Carousel module page IDs
 * 
 * Consistent with pages declaration in ui-manifest.yaml.
 * Format: <plugin>:<pageName>
 */
export const CAROUSEL_PAGE_IDS = {
  /** Carousel list */
  LIST: 'carousel:list',
  /** Carousel detail */
  DETAIL: 'carousel:detail',
  /** Create carousel */
  CREATE: 'carousel:create',
  /** Edit carousel */
  EDIT: 'carousel:edit',
  /** Banner management */
  BANNERS: 'carousel:banners',
} as const;

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Carousel default settings
 */
export const DEFAULT_CAROUSEL_SETTINGS = {
  autoPlay: true,
  autoPlayInterval: 3000,
  showIndicator: true,
  showArrow: true,
  maxBannerCount: 10,
} as const;
