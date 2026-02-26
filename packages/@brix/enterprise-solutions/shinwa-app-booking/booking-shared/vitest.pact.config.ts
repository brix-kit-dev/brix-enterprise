/**
 * @file Vitest Pact 配置文件
 * @description Consumer-Driven Contract Testing 配置
 * @module @shinwa/booking-shared
 * @version 3.0.4
 *
 * 【Phase 5.3-1】
 * Pact Consumer 测试配置，用于生成前端期望的 API 契约文件
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    /**
     * 仅运行 Pact 测试文件
     */
    include: ['src/**/*.pact.test.ts'],

    /**
     * Pact 测试需要较长的超时时间
     * （需要启动 Mock Server）
     */
    testTimeout: 30000,

    /**
     * 禁用并发执行
     * Pact tests must run sequentially
     */
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },

    /**
     * Pact 环境变量
     */
    env: {
      NODE_ENV: 'test',
      PACT_LOG_LEVEL: 'info',
    },

    /**
     * 报告配置
     */
    reporters: ['default', 'json'],
    outputFile: {
      json: './test-results/pact-results.json',
    },
  },
});
