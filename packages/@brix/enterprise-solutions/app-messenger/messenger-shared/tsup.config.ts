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
 * @fileoverview tsup 构建配置
 * @description 消息模块共享包的构建配置，支持多入口点和多格式输出
 * @version 3.0.0
 */

import { defineConfig } from 'tsup';

export default defineConfig({
  // 多入口点配置
  entry: {
    index: 'src/index.ts',
    'types/index': 'src/types/index.ts',
    'events/index': 'src/events/index.ts',
    'constants/index': 'src/constants/index.ts',
    'generated/index': 'src/generated/index.ts',
  },
  // 输出格式：CommonJS 和 ESModule
  format: ['cjs', 'esm'],
  // 生成类型声明文件
  dts: true,
  // 生成 sourcemap
  sourcemap: true,
  // 清理输出目录
  clean: true,
  // 代码分割
  splitting: false,
  // 压缩
  minify: false,
  // 目标环境
  target: 'es2020',
  // 外部依赖（不打包）
  external: [],
});
