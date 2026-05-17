/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * Commercial use requires a valid Brix Enterprise license.
 */
/**
 * @file Chinese (Simplified) translations for app-carousel plugin
 * @module carousel-ui-web/i18n/zh-CN
 * @version 3.3.0
 */

const zhCN: Record<string, string> = {
  // ── Common ────────────────────────────────────────────────────────────
  'common.loading': '加载中...',
  'common.unknownError': '未知错误',
  'common.save': '保存',
  'common.cancel': '取消',
  'common.confirm': '确定',
  'common.add': '添加',
  'common.edit': '编辑',
  'common.delete': '删除',
  'common.back': '返回',
  'common.reset': '重置',
  'common.yes': '是',
  'common.no': '否',
  'common.confirmDelete': '确认删除',
  'common.sort': '排序',
  'common.views': '展示',
  'common.clicks': '点击',

  // ── Status Labels ─────────────────────────────────────────────────────
  'status.enabled': '启用',
  'status.disabled': '禁用',
  'status.ENABLED': '已启用',
  'status.DISABLED': '已禁用',
  'status.DRAFT': '草稿',
  'status.EXPIRED': '已过期',

  // ── Operation Messages ────────────────────────────────────────────────
  'message.addSuccess': '添加成功',
  'message.addFailed': '添加失败',
  'message.createSuccess': '创建成功',
  'message.createFailed': '创建失败',
  'message.updateSuccess': '更新成功',
  'message.updateFailed': '更新失败',
  'message.deleteSuccess': '删除成功',
  'message.deleteFailed': '删除失败',
  'message.operationSuccess': '操作成功',
  'message.operationFailed': '操作失败',

  // ── List Page ─────────────────────────────────────────────────────────
  'list.title': '轮播位管理',
  'list.create': '新建轮播位',
  'list.refreshTooltip': '刷新列表',
  'list.empty': '暂无轮播位，点击"新建轮播位"创建',
  'list.loadFailed': '加载轮播位列表失败',
  'list.col.code': '编码',
  'list.col.name': '名称',
  'list.col.size': '尺寸',
  'list.col.bannerCount': 'Banner数量',
  'list.col.autoPlay': '自动播放',
  'list.col.status': '状态',
  'list.col.actions': '操作',
  'list.action.viewBanners': '查看Banner',
  'list.deleteConfirm': '确定要删除轮播位 {name} 吗？此操作将同时删除该轮播位下的所有Banner，且不可恢复。',
  'list.deleting': '删除中...',

  // ── Detail Page ───────────────────────────────────────────────────────
  'detail.editTitle': '编辑轮播位',
  'detail.createTitle': '新建轮播位',
  'detail.section.basic': '基本信息',
  'detail.section.size': '尺寸设置',
  'detail.section.playback': '播放设置',
  'detail.field.code': '轮播位编码',
  'detail.field.code.helper': '唯一标识，创建后不可修改',
  'detail.field.name': '轮播位名称',
  'detail.field.description': '描述',
  'detail.field.width': '宽度 (px)',
  'detail.field.height': '高度 (px)',
  'detail.field.maxBannerCount': '最大Banner数量',
  'detail.field.autoPlay': '自动播放',
  'detail.field.interval': '播放间隔 (ms)',
  'detail.field.showIndicator': '显示指示器',
  'detail.field.showArrow': '显示箭头',
  'detail.saving': '保存中...',
  'detail.creating': '创建中...',
  'detail.saveChanges': '保存修改',
  'detail.createCarousel': '创建轮播位',

  // ── Banner Management ─────────────────────────────────────────────────
  'banner.title': '{name} - Banner管理',
  'banner.add': '添加Banner',
  'banner.editDialog': '编辑Banner',
  'banner.addDialog': '添加Banner',
  'banner.empty': '暂无Banner，点击"添加Banner"创建',
  'banner.loadFailed': '加载Banner数据失败',
  'banner.field.title': '标题',
  'banner.field.subtitle': '副标题',
  'banner.field.imageUrlPc': '图片URL (PC端)',
  'banner.field.imageUrlMobile': '图片URL (移动端)',
  'banner.field.platform': '目标平台',
  'banner.field.actionType': '点击动作',
  'banner.field.actionValueWeb': '动作值 (Web端)',
  'banner.field.actionValueApp': '动作值 (App端)',
  'banner.field.sortOrder': '排序',
  'banner.field.startTime': '生效开始时间',
  'banner.field.endTime': '生效结束时间',
  'banner.sortLabel': '排序: {order}',
  'banner.statsLabel': '展示: {views} | 点击: {clicks}',
  'banner.enableTooltip': '启用',
  'banner.disableTooltip': '禁用',
  'banner.deleteConfirm': '确定要删除Banner "{title}" 吗？此操作不可恢复。',

  // ── Platform Labels ───────────────────────────────────────────────────
  'platform.ALL': '全平台',
  'platform.WEB': 'Web端',
  'platform.H5': 'H5',
  'platform.IOS': 'iOS',
  'platform.ANDROID': 'Android',
  'platform.MINI_PROGRAM': '小程序',

  // ── Action Type Labels ────────────────────────────────────────────────
  'actionType.NONE': '无',
  'actionType.LINK': '打开链接',
  'actionType.ROUTE': '跳转路由',
  'actionType.POPUP': '弹窗',
  'actionType.DEEP_LINK': 'Deep Link',
};

export default zhCN;
