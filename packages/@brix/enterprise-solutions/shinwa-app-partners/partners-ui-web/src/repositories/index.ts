/**
 * @file Repository 层统一入口
 * @description 导出所有 Repository 函数
 * @module partners-ui-web/repositories
 * @version 3.2.0
 * 
 * 【v3.2 前后端分离架构】
 * Repository 层负责 API 抽象，所有对后端的请求都通过 Repository 层进行。
 * Repository 层接收 HttpCapability 作为参数，确保与 Shell 层解耦。
 * 
 * @see v3.2-详细改造方案.md Phase 5: 前后端分离重构
 */

export { createPartnerRepository } from './PartnerRepository';
export type { PartnerRepository } from './PartnerRepository';
