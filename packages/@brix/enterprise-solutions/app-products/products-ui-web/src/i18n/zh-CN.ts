/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * Commercial use requires a valid Brix Enterprise license.
 */
/**
 * @file Chinese (Simplified) translations for app-products plugin
 * @module products-ui-web/i18n/zh-CN
 * @version 3.3.0
 */

const zhCN: Record<string, string> = {
  // Product types
  'productType.CHECKUP': '体检套餐',
  'productType.TREATMENT': '治疗套餐',
  'productType.TRANSLATION': '翻译套餐',
  'productType.TRANSPORT': '交通套餐',
  'productType.ACCOMMODATION': '住宿套餐',
  'productType.COMPOSITE': '综合套餐',
  'productType.fallback': '其他',

  // Theme product types (alternate labels)
  'themeType.CHECKUP': '精密体检',
  'themeType.TREATMENT': '诊疗服务',
  'themeType.TRANSLATION': '翻译服务',
  'themeType.TRANSPORT': '交通接送',
  'themeType.ACCOMMODATION': '住宿服务',
  'themeType.COMPOSITE': '综合套餐',

  // Product status
  'status.DRAFT': '草稿',
  'status.PENDING_REVIEW': '待审核',
  'status.ACTIVE': '上架',
  'status.INACTIVE': '下架',
  'status.ARCHIVED': '归档',
  'status.fallback': '未知',

  // Theme status labels (variant)
  'themeStatus.ACTIVE': '上架中',
  'themeStatus.INACTIVE': '已下架',
  'themeStatus.ARCHIVED': '已归档',

  // Edit page status labels
  'editStatus.DRAFT': '草稿',
  'editStatus.PENDING_REVIEW': '待审核',
  'editStatus.ACTIVE': '已上架',
  'editStatus.INACTIVE': '已下架',
  'editStatus.ARCHIVED': '已归档',

  // Medical categories
  'medicalCategory.ONCOLOGY': '肿瘤科',
  'medicalCategory.COSMETIC': '整形外科',
  'medicalCategory.FERTILITY': '生殖医学',
  'medicalCategory.REHAB': '康复医学',
  'medicalCategory.GENERAL': '综合',
  'medicalCategory.fallback': '综合',

  // Service item categories
  'itemCategory.EXAMINATION': '检查项目',
  'itemCategory.TREATMENT': '治疗项目',
  'itemCategory.MEDICATION': '用药项目',
  'itemCategory.SERVICE': '服务项目',
  'itemCategory.ACCOMMODATION': '住宿项目',
  'itemCategory.TRANSPORT': '交通项目',
  'itemCategory.OTHER': '其他项目',

  // Partner types
  'partnerType.hospital': '医院',
  'partnerType.clinic': '诊所',
  'partnerType.lab': '检验机构',
  'partnerType.pharmacy': '药房',
  'partnerType.insurance': '保险',
  'partnerType.other': '其他',

  // Currency labels
  'currency.CNY': '人民币 (CNY)',
  'currency.JPY': '日元 (JPY)',
  'currency.USD': '美元 (USD)',
  'currency.EUR': '欧元 (EUR)',

  // Price
  'price.negotiable': '价格面议',
  'price.tenThousandUnit': '万',
  'price.from': '起',
  'price.max': '最高',
  'price.fixedMode': '固定价格',
  'price.rangeMode': '价格区间',
  'price.placeholder': '请输入价格',
  'price.minPlaceholder': '最低价',
  'price.maxPlaceholder': '最高价',
  'price.preview': '预览:',
  'price.label': '价格',

  // List page
  'list.title': '产品管理',
  'list.createBtn': '新建产品',
  'list.searchPlaceholder': '搜索产品名称...',
  'list.typeFilter': '产品类型',
  'list.statusFilter': '状态',
  'list.allFilter': '全部',
  'list.noImage': '暂无图片',
  'list.noDescription': '暂无描述',
  'list.durationPrefix': '服务时长:',
  'list.viewDetail': '查看详情',
  'list.edit': '编辑',
  'list.submitReview': '提交审核',
  'list.approve': '审核通过',
  'list.reject': '驳回',
  'list.deactivate': '下架',
  'list.reactivate': '重新上架',
  'list.archive': '归档',
  'list.delete': '删除',
  'list.confirmDeleteTitle': '确认删除',
  'list.confirmDeleteContent': '确定要删除产品「{{name}}」吗？此操作不可撤销。',
  'list.cancel': '取消',
  'list.rejectTitle': '驳回产品',
  'list.rejectReasonLabel': '驳回原因',
  'list.confirmReject': '确认驳回',

  // List page V2
  'listV2.allTab': '全部',
  'listV2.noMatch': '暂无匹配套餐',
  'listV2.searchPlaceholder': '搜索套餐名称、医院...',
  'listV2.createBtn': '新增套餐',

  // Detail page
  'detail.notFound': '产品不存在',
  'detail.back': '返回',
  'detail.backToList': '返回列表',
  'detail.editProduct': '编辑产品',
  'detail.codePrefix': '产品编码:',
  'detail.descriptionTitle': '产品描述',
  'detail.noDescription': '暂无描述',
  'detail.serviceItemsTitle': '服务项目',
  'detail.remarkTitle': '备注信息',
  'detail.priceTitle': '价格信息',
  'detail.durationPrefix': '服务时长:',
  'detail.associationTitle': '关联信息',
  'detail.partnerLabel': '合作方',
  'detail.categoryLabel': '分类',
  'detail.statsTitle': '统计数据',
  'detail.viewCount': '浏览量',
  'detail.salesCount': '销量',
  'detail.tagsTitle': '标签',
  'detail.timeTitle': '时间信息',
  'detail.createdAtPrefix': '创建时间:',
  'detail.updatedAtPrefix': '更新时间:',
  'detail.createdByPrefix': '创建人:',

  // Detail dialog
  'detailDialog.startPrice': '起始报价',
  'detailDialog.maxPrice': '最高报价',
  'detailDialog.durationDays': '预计天数',
  'detailDialog.partnerLabel': '合作医院/机构',
  'detailDialog.descriptionTitle': '套餐说明',
  'detailDialog.noDescription': '暂无说明',
  'detailDialog.includedItems': '包含项目',
  'detailDialog.bindToCase': '绑定至 Case',
  'detailDialog.editProduct': '编辑套餐',

  // Create page
  'create.title': '创建产品套餐',
  'create.subtitle': '配置新的产品或服务套餐信息',
  'create.stepBasicInfo': '基本信息',
  'create.stepBasicInfoDesc': '填写产品的基本信息',
  'create.stepServiceItems': '服务项目',
  'create.stepServiceItemsDesc': '配置产品包含的服务项目',
  'create.stepConfirm': '确认提交',
  'create.stepConfirmDesc': '检查并提交',
  'create.serviceItemsConfig': '服务项目配置',
  'create.confirmInfo': '确认产品信息',
  'create.nameLabel': '产品名称',
  'create.typeLabel': '产品类型',
  'create.partnerLabel': '关联合作方',
  'create.priceLabel': '价格',
  'create.descriptionLabel': '产品描述',
  'create.noDescription': '暂无描述',
  'create.itemCountLabel': '服务项目数',
  'create.itemCountUnit': '项',
  'create.prevStep': '上一步',
  'create.nextStep': '下一步',
  'create.confirmCreate': '确认创建',
  'create.cancel': '取消',

  // Edit page
  'edit.title': '编辑产品:',
  'edit.unsavedChanges': '有未保存的更改',
  'edit.codePrefix': '产品编码:',
  'edit.codeNotSet': '未设置',
  'edit.createdAtPrefix': '创建时间:',
  'edit.tabBasicInfo': '基本信息',
  'edit.tabServiceItems': '服务项目',
  'edit.tabAdvanced': '高级设置',
  'edit.serviceItemsHelp': '配置此产品包含的服务项目。您可以添加、编辑、删除和排序服务项目。',
  'edit.statsTitle': '产品统计',
  'edit.salesCount': '销量',
  'edit.viewCount': '浏览量',
  'edit.sortWeight': '排序权重',
  'edit.dangerZone': '危险操作',
  'edit.deleteWarning': '删除产品后将无法恢复，请谨慎操作。',
  'edit.deleteBtn': '删除产品',
  'edit.cancel': '取消',
  'edit.saveChanges': '保存更改',
  'edit.confirmDeleteTitle': '确认删除',
  'edit.confirmDeleteCancel': '取消',
  'edit.confirmDeleteOk': '确认删除',
  'edit.confirmDeleteContent': '确定要删除产品 "{{name}}" 吗？此操作无法撤销。',
  'edit.updated': '产品信息已更新',
  'edit.deleted': '产品已删除',
  'edit.leaveConfirm': '您有未保存的更改，确定要离开吗？',
  'edit.invalidId': '产品ID无效，请检查访问路径',
  'edit.notFound': '未找到该产品，可能已被删除或不存在',
  'edit.backToList': '返回产品列表',

  // Form fields
  'form.productName': '产品名称',
  'form.productNamePlaceholder': '请输入产品名称',
  'form.productCode': '产品编码',
  'form.productCodePlaceholder': '自动生成或手动输入',
  'form.productType': '产品类型',
  'form.productTypePlaceholder': '请选择产品类型',
  'form.partner': '合作方',
  'form.description': '产品描述',
  'form.descriptionPlaceholder': '请输入产品描述',
  'form.priceRange': '价格区间',
  'form.duration': '服务时长',
  'form.durationPlaceholder': '例如：3天2夜',
  'form.coverImage': '封面图片',
  'form.coverImagePlaceholder': '请输入图片URL',
  'form.tags': '标签',
  'form.tagsPlaceholder': '用逗号分隔多个标签',
  'form.sortWeight': '排序权重',
  'form.remark': '备注',
  'form.remarkPlaceholder': '请输入备注信息',

  // Service item editor
  'itemEditor.count': '共 {{count}} 个服务项目',
  'itemEditor.addItem': '添加项目',
  'itemEditor.maxReached': '已达到最大项目数量 ({{max}})',
  'itemEditor.empty': '暂无服务项目，点击"添加项目"开始配置',
  'itemEditor.optional': '可选',
  'itemEditor.quantity': '数量:',
  'itemEditor.unitPrice': '单价:',
  'itemEditor.editTitle': '编辑服务项目',
  'itemEditor.addTitle': '添加服务项目',
  'itemEditor.cancel': '取消',
  'itemEditor.save': '保存',
  'itemEditor.itemName': '项目名称',
  'itemEditor.itemNamePlaceholder': '请输入项目名称',
  'itemEditor.itemCategory': '项目分类',
  'itemEditor.itemDescription': '描述',
  'itemEditor.itemDescPlaceholder': '请输入项目描述',
  'itemEditor.itemQuantity': '数量',
  'itemEditor.itemUnit': '单位',
  'itemEditor.itemUnitPlaceholder': '次、天、人',
  'itemEditor.itemPrice': '单价 (可选)',
  'itemEditor.itemPricePlaceholder': '请输入单价',

  // Product card
  'card.noDescription': '暂无描述',
  'card.negotiable': '价格面议',

  // Partner selector
  'partnerSelector.placeholder': '搜索合作方...',
  'partnerSelector.noMatchKeyword': '未找到匹配的合作方',
  'partnerSelector.noMatchEmpty': '请输入关键词搜索',

  // Add product dialog
  'addDialog.title': '新增套餐产品',
  'addDialog.nameCn': '套餐名称（中文）',
  'addDialog.namePlaceholder': '请输入套餐名称',
  'addDialog.productType': '套餐类型',
  'addDialog.priceMin': '最低报价',
  'addDialog.priceMax': '最高报价',
  'addDialog.durationDays': '天数',
  'addDialog.durationPlaceholder': '天',
  'addDialog.cancel': '取消',
  'addDialog.save': '保存套餐',

  // Validation
  'validation.nameRequired': '产品名称不能为空',
  'validation.typeRequired': '请选择产品类型',
  'validation.partnerRequired': '请选择关联合作方',
  'validation.itemNameRequired': '请输入项目名称',
  'validation.nameRequired2': '请输入套餐名称',
  'validation.typeRequired2': '请选择套餐类型',
  'validation.invalidNumber': '请输入有效数字',
  'validation.priceMaxGreater': '最高报价应大于最低报价',
  'validation.invalidDays': '请输入有效的天数',
};

export default zhCN;
