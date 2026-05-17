/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * Commercial use requires a valid Brix Enterprise license.
 */
/**
 * @file Chinese (Simplified) translations for app-partners plugin
 * @module partners-ui-web/i18n/zh-CN
 * @version 3.3.0
 */

const zhCN: Record<string, string> = {
  // Partner types (types/index.ts)
  'type.HOSPITAL': '医院',
  'type.HOTEL': '酒店',
  'type.TRANSPORT': '交通',
  'type.TRANSLATION': '翻译',
  'type.OTHER': '其他',

  // Partner types (constants)
  'typeConst.HOSPITAL': '医院',
  'typeConst.CLINIC': '诊所',
  'typeConst.AGENCY': '中介机构',
  'typeConst.TRANSLATOR': '翻译服务',
  'typeConst.TRANSPORT': '交通服务',
  'typeConst.HOTEL': '酒店住宿',

  // Partner types (theme display)
  'themeType.HOSPITAL': '医疗机构',
  'themeType.HOTEL': '住宿酒店',
  'themeType.TRANSPORT': '交通接送',
  'themeType.TRANSLATION': '翻译机构',
  'themeType.OTHER': '其他',

  // Partner status (types/index.ts)
  'statusType.DRAFT': '草稿',
  'statusType.ACTIVE': '启用',
  'statusType.SUSPENDED': '暂停',
  'statusType.TERMINATED': '终止',

  // Partner status (constants, with descriptions)
  'status.PENDING': '待审核',
  'status.PENDING.desc': '合作申请已提交，等待审核',
  'status.ACTIVE': '已激活',
  'status.ACTIVE.desc': '合作关系正常有效',
  'status.SUSPENDED': '已暂停',
  'status.SUSPENDED.desc': '合作关系暂时中止',
  'status.TERMINATED': '已终止',
  'status.TERMINATED.desc': '合作关系已永久终止',

  // Partner status (theme display)
  'themeStatus.DRAFT': '草稿',
  'themeStatus.ACTIVE': '合作中',
  'themeStatus.SUSPENDED': '已暂停',
  'themeStatus.TERMINATED': '已终止',

  // Cooperation levels
  'level.1': '普通合作',
  'level.2': '银牌合作',
  'level.3': '金牌合作',
  'level.4': '白金合作',
  'level.5': '战略合作',

  // Credit ratings
  'rating.excellent': '优秀',
  'rating.good': '良好',
  'rating.normal': '一般',
  'rating.poor': '较差',

  // Certification types
  'cert.BUSINESS_LICENSE': '营业执照',
  'cert.MEDICAL_LICENSE': '医疗机构执业许可证',
  'cert.HEALTH_CERTIFICATE': '卫生许可证',
  'cert.PROFESSIONAL_CERT': '专业资质证书',
  'cert.ISO_CERT': 'ISO认证',
  'cert.INSURANCE_CERT': '保险资质证明',
  'cert.OTHER': '其他证明',

  // Certification uploader
  'certUploader.uploadFailed': '上传失败',
  'certUploader.expired': '已过期',
  'certUploader.expiringSoon': '即将过期',
  'certUploader.issuedBy': '发证机构: ',
  'certUploader.expiryDate': '有效期至: ',
  'certUploader.noCerts': '暂无证书文件',
  'certUploader.uploadHint': '点击下方按钮上传合作方资质证书',
  'certUploader.addCert': '添加证书',
  'certUploader.dialogTitle': '添加证书信息',
  'certUploader.cancel': '取消',
  'certUploader.confirmAdd': '确认添加',
  'certUploader.typePlaceholder': '请选择证书类型 *',
  'certUploader.namePlaceholder': '证书名称 *（例如：营业执照副本）',
  'certUploader.issuerPlaceholder': '发证机构（例如：市场监督管理局）',
  'certUploader.issueDate': '发证日期',
  'certUploader.expiryDateLabel': '有效期至',
  'certUploader.deleteCertConfirm': '确定要删除这个证书吗？',
  'certUploader.unsupportedType': '不支持的文件类型。支持的类型：{{types}}',
  'certUploader.fileSizeLimit': '文件大小超过限制（最大 {{max}} MB）',
  'certUploader.maxCountLimit': '最多只能上传 {{max}} 个证书文件',
  'certUploader.requiredFields': '请填写必填字段',

  // List page
  'list.title': '合作伙伴管理',
  'list.createBtn': '新建合作伙伴',
  'list.searchPlaceholder': '搜索名称或编码...',
  'list.typeFilter': '类型',
  'list.statusFilter': '状态',
  'list.allFilter': '全部',
  'list.refresh': '刷新',
  'list.colCode': '编码',
  'list.colName': '名称',
  'list.colType': '类型',
  'list.colStatus': '状态',
  'list.colContact': '联系人',
  'list.colServiceArea': '服务区域',
  'list.colCreatedAt': '创建时间',
  'list.colActions': '操作',
  'list.noData': '暂无数据',
  'list.viewDetail': '查看详情',
  'list.edit': '编辑',
  'list.activate': '激活',
  'list.suspend': '暂停',
  'list.resume': '恢复',
  'list.terminate': '终止',
  'list.delete': '删除',

  // List page - delete dialog
  'list.deleteTitle': '确认删除',
  'list.deleteContent': '确定要删除合作伙伴「{{name}}」吗？此操作不可撤销。',
  'list.deleteCancel': '取消',
  'list.deleteConfirm': '删除',

  // List page - status action dialog
  'list.activateTitle': '激活合作伙伴',
  'list.suspendTitle': '暂停合作伙伴',
  'list.resumeTitle': '恢复合作伙伴',
  'list.terminateTitle': '终止合作伙伴',
  'list.actionConfirmPrefix': '确定要',
  'list.actionActivate': '激活',
  'list.actionSuspend': '暂停',
  'list.actionResume': '恢复',
  'list.actionTerminate': '终止',
  'list.actionConfirmSuffix': '合作伙伴「{{name}}」吗？',
  'list.reasonLabel': '原因',
  'list.actionCancel': '取消',
  'list.actionConfirm': '确认',

  // List page V2
  'listV2.title': '合作方目录',
  'listV2.subtitle': '管理医院、酒店、交通、翻译等合作机构',
  'listV2.refresh': '刷新',
  'listV2.createBtn': '新增合作方',
  'listV2.searchPlaceholder': '搜索合作方名称、地区...',
  'listV2.allTab': '全部',
  'listV2.allTypes': '全部类型',
  'listV2.hospitalTab': '医院',
  'listV2.hotelTab': '酒店',
  'listV2.transportTab': '交通',
  'listV2.translationTab': '翻译',
  'listV2.otherTab': '其他',
  'listV2.noData': '暂无合作方数据',
  'listV2.noSearchResults': '未找到匹配的合作方，请尝试其他搜索词',
  'listV2.noDataHint': '点击"添加合作方"开始添加',

  // Detail page
  'detail.backToList': '返回列表',
  'detail.notFound': '合作伙伴不存在',
  'detail.editBtn': '编辑',
  'detail.basicInfoTitle': '基本信息',
  'detail.partnerType': '合作伙伴类型',
  'detail.shortName': '简称',
  'detail.serviceArea': '服务区域',
  'detail.createdAt': '创建时间',
  'detail.description': '简介',
  'detail.contactTitle': '联系信息',
  'detail.noContact': '暂无联系信息',
  'detail.qualificationTitle': '资质信息',

  // Detail dialog
  'detailDialog.bindToPackage': '绑定至套餐',
  'detailDialog.editInfo': '编辑信息',
  'detailDialog.basicInfoTitle': '基本信息',
  'detailDialog.address': '地址',
  'detailDialog.certTitle': '资质认证',
  'detailDialog.descTitle': '机构简介',
  'detailDialog.codePrefix': '编码：',
  'detailDialog.createdPrefix': '创建：',

  // Create page
  'create.title': '新建合作方',
  'create.subtitle': '填写合作方基本信息和资质证书',
  'create.backToList': '返回列表',
  'create.cancel': '取消',
  'create.saving': '保存中...',
  'create.save': '保存',
  'create.basicInfoTitle': '基本信息',
  'create.certTitle': '资质证书',
  'create.certSubtitle': '上传合作方的营业执照、医疗许可证等资质证明文件',
  'create.success': '合作方创建成功！正在跳转到详情页...',

  // Edit page
  'edit.title': '编辑合作方',
  'edit.backToDetail': '返回详情',
  'edit.backToList': '返回列表',
  'edit.refresh': '刷新',
  'edit.cancel': '取消',
  'edit.saving': '保存中...',
  'edit.save': '保存',
  'edit.basicInfoTitle': '基本信息',
  'edit.certTitle': '资质证书',
  'edit.certSubtitle': '管理合作方的营业执照、医疗许可证等资质证明文件',
  'edit.notFound': '合作方不存在或已被删除',
  'edit.terminated': '该合作方已终止，无法编辑',
  'edit.leaveConfirm': '您有未保存的更改，确定要离开吗？',
  'edit.success': '合作方信息更新成功！',

  // Form fields
  'form.name': '合作方名称 *',
  'form.shortName': '简称',
  'form.type': '合作方类型 *',
  'form.contactName': '联系人',
  'form.contactPhone': '联系电话',
  'form.contactEmail': '联系邮箱',
  'form.serviceArea': '服务区域（例如：华东地区、全国）',
  'form.address': '详细地址',
  'form.description': '描述',

  // Validation
  'validation.nameRequired': '请输入合作方名称',
  'validation.nameMinLength': '合作方名称至少需要2个字符',
  'validation.typeRequired': '请选择合作方类型',
  'validation.emailInvalid': '请输入有效的邮箱地址',
  'validation.phoneInvalid': '请输入有效的手机号码',
  'validation.addressRequired': '请输入地址',

  // Add partner dialog
  'addDialog.title': '添加合作方',
  'addDialog.typeSection': '合作方类型',
  'addDialog.statusSection': '合作方状态',
  'addDialog.name': '合作方名称 *',
  'addDialog.shortName': '简称（可选）',
  'addDialog.address': '地址 *',
  'addDialog.serviceArea': '服务区域（例如：东京、大阪）',
  'addDialog.phone': '联系电话',
  'addDialog.email': '邮箱',
  'addDialog.website': '官方网站（https://）',
  'addDialog.certSection': '资质认证',
  'addDialog.certPlaceholder': '输入认证名称，按回车添加',
  'addDialog.certCount': '已添加 {{count}} 项认证',
  'addDialog.descPlaceholder': '机构简介',
  'addDialog.cancel': '取消',
  'addDialog.submitting': '提交中...',
  'addDialog.confirm': '确认添加',
};

export default zhCN;
