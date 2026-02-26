/**
 * @file Pact Consumer 契约测试 - 预约 API
 * @description 前端声明期望的 API 响应格式，生成 Pact 契约文件
 * @module @shinwa/booking-shared
 * @version 3.0.4
 *
 * 【Phase 5.3-1】Consumer-Driven Contract Testing
 *
 * 【设计说明】
 * 本文件定义前端（Consumer）对后端（Provider）API 的期望：
 * 1. 声明请求的端点、方法、参数
 * 2. 声明期望的响应结构和状态码
 * 3. 生成 Pact 契约文件供后端验证
 *
 * 【契约测试工作流】
 * 1. 前端运行 pnpm test:pact → 生成 pacts/*.json
 * 2. 后端运行 PactVerifier → 验证是否满足契约
 * 3. CI 中两端都通过才允许合并
 *
 * 【运行命令】
 * pnpm test:pact
 *
 * @see https://docs.pact.io/implementation_guides/javascript
 */

import { PactV4, MatchersV3 } from '@pact-foundation/pact';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';

// ============================================================================
// Pact Provider 配置
// ============================================================================

const provider = new PactV4({
  consumer: 'booking-ui-web',
  provider: 'booking-server',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'info',
});

// ============================================================================
// 匹配器（用于灵活匹配响应结构）
// ============================================================================
const { like, eachLike, datetime, integer, string } = MatchersV3;

/**
 * 预约 DTO 匹配器
 *
 * 定义前端期望的预约数据结构
 */
const bookingDtoMatcher = {
  id: integer(1),
  bookingNo: string('BK20240101001'),
  status: string('CONFIRMED'),
  resourceId: integer(1),
  resourceName: string('Dr. Wang'),
  resourceType: string('DOCTOR'),
  reservedDate: string('2024-01-15'),
  startTime: string('09:00'),
  endTime: string('09:30'),
  clientName: string('张三'),
  clientPhone: string('13800138000'),
  notes: string(''),
  createdAt: datetime("yyyy-MM-dd'T'HH:mm:ss"),
  updatedAt: datetime("yyyy-MM-dd'T'HH:mm:ss"),
};

/**
 * 可预约资源 DTO 匹配器
 */
const bookableResourceDtoMatcher = {
  id: integer(1),
  name: string('Dr. Wang'),
  type: string('DOCTOR'),
  status: string('ACTIVE'),
  description: string('专业医生'),
  workingHours: string('09:00-18:00'),
  slotDuration: integer(30),
};

// ============================================================================
// Consumer 契约测试
// ============================================================================

describe('Booking API Contract Tests', () => {
  /**
   * 测试：获取预约列表
   *
   * GET /api/v1/bookings
   */
  describe('GET /api/v1/bookings', () => {
    it('应返回预约列表', async () => {
      await provider
        .addInteraction()
        .given('存在预约数据')
        .uponReceiving('获取预约列表请求')
        .withRequest('GET', '/api/v1/bookings', (builder) => {
          builder.headers({
            Accept: 'application/json',
            Authorization: like('Bearer token123'),
          });
        })
        .willRespondWith(200, (builder) => {
          builder
            .headers({ 'Content-Type': 'application/json' })
            .jsonBody(eachLike(bookingDtoMatcher));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/v1/bookings`, {
            headers: {
              Accept: 'application/json',
              Authorization: 'Bearer token123',
            },
          });

          expect(response.status).toBe(200);
          const data = await response.json();
          expect(Array.isArray(data)).toBe(true);

          if (data.length > 0) {
            expect(data[0]).toHaveProperty('id');
            expect(data[0]).toHaveProperty('bookingNo');
            expect(data[0]).toHaveProperty('status');
          }
        });
    });
  });

  /**
   * 测试：获取单个预约
   *
   * GET /api/v1/bookings/{id}
   */
  describe('GET /api/v1/bookings/{id}', () => {
    it('应返回指定预约详情', async () => {
      const bookingId = 1;

      await provider
        .addInteraction()
        .given('存在 ID 为 1 的预约')
        .uponReceiving('获取预约详情请求')
        .withRequest('GET', `/api/v1/bookings/${bookingId}`, (builder) => {
          builder.headers({
            Accept: 'application/json',
            Authorization: like('Bearer token123'),
          });
        })
        .willRespondWith(200, (builder) => {
          builder
            .headers({ 'Content-Type': 'application/json' })
            .jsonBody(like(bookingDtoMatcher));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(
            `${mockServer.url}/api/v1/bookings/${bookingId}`,
            {
              headers: {
                Accept: 'application/json',
                Authorization: 'Bearer token123',
              },
            }
          );

          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data).toHaveProperty('id');
          expect(data).toHaveProperty('bookingNo');
        });
    });

    it('预约不存在时应返回 404', async () => {
      const nonExistentId = 99999;

      await provider
        .addInteraction()
        .given('不存在 ID 为 99999 的预约')
        .uponReceiving('获取不存在的预约请求')
        .withRequest('GET', `/api/v1/bookings/${nonExistentId}`, (builder) => {
          builder.headers({
            Accept: 'application/json',
            Authorization: like('Bearer token123'),
          });
        })
        .willRespondWith(404, (builder) => {
          builder
            .headers({ 'Content-Type': 'application/json' })
            .jsonBody({
              error: string('Not Found'),
              message: string('Booking not found'),
              status: integer(404),
            });
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(
            `${mockServer.url}/api/v1/bookings/${nonExistentId}`,
            {
              headers: {
                Accept: 'application/json',
                Authorization: 'Bearer token123',
              },
            }
          );

          expect(response.status).toBe(404);
        });
    });
  });

  /**
   * 测试：创建预约
   *
   * POST /api/v1/bookings
   */
  describe('POST /api/v1/bookings', () => {
    it('应成功创建预约', async () => {
      const createRequest = {
        resourceId: 1,
        reservedDate: '2024-01-20',
        startTime: '10:00',
        endTime: '10:30',
        clientName: '李四',
        clientPhone: '13900139000',
        notes: '首次预约',
      };

      await provider
        .addInteraction()
        .given('资源 1 在 2024-01-20 10:00-10:30 可用')
        .uponReceiving('创建预约请求')
        .withRequest('POST', '/api/v1/bookings', (builder) => {
          builder
            .headers({
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: like('Bearer token123'),
            })
            .jsonBody(like(createRequest));
        })
        .willRespondWith(201, (builder) => {
          builder
            .headers({ 'Content-Type': 'application/json' })
            .jsonBody(like(bookingDtoMatcher));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/v1/bookings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: 'Bearer token123',
            },
            body: JSON.stringify(createRequest),
          });

          expect(response.status).toBe(201);
          const data = await response.json();
          expect(data).toHaveProperty('id');
          expect(data).toHaveProperty('bookingNo');
        });
    });

    it('时间冲突时应返回 409', async () => {
      const conflictRequest = {
        resourceId: 1,
        reservedDate: '2024-01-15',
        startTime: '09:00',
        endTime: '09:30',
        clientName: '王五',
        clientPhone: '13700137000',
      };

      await provider
        .addInteraction()
        .given('资源 1 在 2024-01-15 09:00-09:30 已被预约')
        .uponReceiving('创建预约请求（时间冲突）')
        .withRequest('POST', '/api/v1/bookings', (builder) => {
          builder
            .headers({
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: like('Bearer token123'),
            })
            .jsonBody(like(conflictRequest));
        })
        .willRespondWith(409, (builder) => {
          builder
            .headers({ 'Content-Type': 'application/json' })
            .jsonBody({
              error: string('Conflict'),
              message: string('Time slot already booked'),
              status: integer(409),
            });
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/v1/bookings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: 'Bearer token123',
            },
            body: JSON.stringify(conflictRequest),
          });

          expect(response.status).toBe(409);
        });
    });
  });

  /**
   * 测试：取消预约
   *
   * PUT /api/v1/bookings/{id}/cancel
   */
  describe('PUT /api/v1/bookings/{id}/cancel', () => {
    it('应成功取消预约', async () => {
      const bookingId = 1;

      await provider
        .addInteraction()
        .given('存在 ID 为 1 的已确认预约')
        .uponReceiving('取消预约请求')
        .withRequest('PUT', `/api/v1/bookings/${bookingId}/cancel`, (builder) => {
          builder.headers({
            Accept: 'application/json',
            Authorization: like('Bearer token123'),
          });
        })
        .willRespondWith(200, (builder) => {
          builder
            .headers({ 'Content-Type': 'application/json' })
            .jsonBody({
              ...bookingDtoMatcher,
              status: string('CANCELLED'),
            });
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(
            `${mockServer.url}/api/v1/bookings/${bookingId}/cancel`,
            {
              method: 'PUT',
              headers: {
                Accept: 'application/json',
                Authorization: 'Bearer token123',
              },
            }
          );

          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data.status).toBe('CANCELLED');
        });
    });
  });

  /**
   * 测试：获取可预约资源
   *
   * GET /api/v1/bookings/resources
   */
  describe('GET /api/v1/bookings/resources', () => {
    it('应返回可预约资源列表', async () => {
      await provider
        .addInteraction()
        .given('存在可预约资源')
        .uponReceiving('获取可预约资源列表请求')
        .withRequest('GET', '/api/v1/bookings/resources', (builder) => {
          builder.headers({
            Accept: 'application/json',
            Authorization: like('Bearer token123'),
          });
        })
        .willRespondWith(200, (builder) => {
          builder
            .headers({ 'Content-Type': 'application/json' })
            .jsonBody(eachLike(bookableResourceDtoMatcher));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(
            `${mockServer.url}/api/v1/bookings/resources`,
            {
              headers: {
                Accept: 'application/json',
                Authorization: 'Bearer token123',
              },
            }
          );

          expect(response.status).toBe(200);
          const data = await response.json();
          expect(Array.isArray(data)).toBe(true);
        });
    });
  });
});
