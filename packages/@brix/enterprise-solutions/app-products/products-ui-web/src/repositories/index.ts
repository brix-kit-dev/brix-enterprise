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
 * @file Repository 层入口
 * @description 导出所有 Repository 工厂函数和类型
 * @module products-ui-web/repositories
 * @version 3.2.0
 */

export {
  createProductRepository,
  type ProductRepository,
} from './ProductRepository';

export {
  createPartnerOptionRepository,
  type PartnerOptionRepository,
  type PartnerOptionDTO,
  type PartnerOptionQueryParams,
} from './PartnerOptionRepository';
