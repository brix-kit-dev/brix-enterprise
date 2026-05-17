/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * Commercial use requires a valid Brix Enterprise license.
 */
/**
 * @file Chinese (Simplified) translations for app-storage plugin
 * @module storage-ui-web/i18n/zh-CN
 * @version 3.3.0
 */

const zhCN: Record<string, string> = {
  // File status
  'fileStatus.active': '活跃',
  'fileStatus.uploading': '上传中',
  'fileStatus.uploaded': '已上传',
  'fileStatus.processing': '处理中',
  'fileStatus.ready': '就绪',
  'fileStatus.failed': '失败',
  'fileStatus.archived': '已归档',
  'fileStatus.deleted': '已删除',

  // File categories
  'category.document': '文档',
  'category.image': '图片',
  'category.video': '视频',
  'category.audio': '音频',
  'category.medical': '医疗资料',
  'category.contract': '合同',
  'category.idDocument': '身份证件',
  'category.certificate': '资质证书',
  'category.other': '其他',

  // Actions
  'action.preview': '预览',
  'action.download': '下载',
  'action.delete': '删除',
  'action.edit': '编辑',
  'action.back': '返回',
  'action.backToList': '返回文件列表',
  'action.saving': '保存中...',
  'action.save': '保存',
  'action.cancel': '取消',
  'action.upload': '上传文件',
  'action.clearList': '清空列表',
  'action.startUpload': '开始上传',
  'action.clearCompleted': '清除已完成',
  'action.selectFile': '选择文件',
  'action.editFileInfo': '编辑文件信息',

  // Form labels
  'form.displayName': '显示名称',
  'form.description': '描述',
  'form.category': '分类',
  'form.tags': '标签',
  'form.originalName': '原始名称',
  'form.fileType': '文件类型',
  'form.fileSize': '文件大小',
  'form.status': '状态',
  'form.fileId': '文件 ID',
  'form.uploadTime': '上传时间',
  'form.uploader': '上传者',
  'form.lastModified': '最后修改',
  'form.storagePath': '存储路径',
  'form.checksum': '校验值',

  // Page titles & tabs
  'page.fileCenter': '文件中心',
  'page.detail': '详细信息',
  'page.accessLog': '访问日志',
  'page.upload': '上传文件',
  'page.basicInfo': '基本信息',
  'page.systemInfo': '系统信息',

  // Preview
  'preview.loading': '加载中...',
  'preview.loadFailed': '预览加载失败',
  'preview.unsupported': '无法预览此文件类型',
  'preview.directDownload': '直接下载',
  'preview.downloadFile': '下载文件',
  'preview.close': '关闭 (Esc)',
  'preview.zoomOut': '缩小 (-)',
  'preview.zoomIn': '放大 (+)',
  'preview.reset': '重置 (0)',

  // Access log
  'accessLog.title': '访问日志',
  'accessLog.view': '查看',
  'accessLog.download': '下载',
  'accessLog.preview': '预览',
  'accessLog.share': '分享',
  'accessLog.delete': '删除',
  'accessLog.update': '更新',
  'accessLog.noRecords': '暂无访问记录',
  'accessLog.filterType': '筛选操作类型',
  'accessLog.allOperations': '全部操作',
  'accessLog.operation': '操作',
  'accessLog.user': '用户',
  'accessLog.time': '时间',
  'accessLog.address': '地址',
  'accessLog.detail': '详情',

  // Upload page
  'upload.pending': '等待中',
  'upload.uploading': '上传中',
  'upload.completed': '已完成',
  'upload.failed': '失败',
  'upload.noFiles': '暂无待上传文件',
  'upload.dragHint': '从上方拖拽文件或点击选择',
  'upload.tabPending': '待上传',
  'upload.tabUploading': '上传中',
  'upload.tabCompleted': '已完成',
  'upload.tabFailed': '失败',
  'upload.dropzone': '拖拽文件到此处上传',
  'upload.clickToSelect': '或点击选择文件',
  'upload.sizeExceeded': '文件大小超过限制',
  'upload.unsupportedType': '不支持的文件类型',

  // Confirm dialogs
  'confirm.deleteTitle': '确认删除',
  'confirm.deleteMessage': '确定要删除文件 {name} 吗？',
  'confirm.irreversible': '此操作无法撤销',
  'confirm.deleting': '删除中...',
  'confirm.confirm': '确认删除',

  // Placeholders
  'placeholder.search': '搜索文件...',
  'placeholder.description': '添加文件描述...',
  'placeholder.tags': '标签1, 标签2, ...',
  'placeholder.displayName': '文件显示名称',
  'placeholder.tagSeparator': '用逗号分隔',

  // View modes & pagination
  'view.grid': '网格视图',
  'view.list': '列表视图',
  'count.files': '{count} 个文件',
  'pagination.prev': '上一页',
  'pagination.next': '下一页',
  'empty.noFiles': '暂无文件',
  'empty.uploadToStart': '上传文件开始使用文件中心',
  'empty.noCategoryFiles': '当前分类下没有文件',
  'empty.noAccessLog': '该文件暂无访问记录',
  'message.notFound': '文件不存在',
};

export default zhCN;
