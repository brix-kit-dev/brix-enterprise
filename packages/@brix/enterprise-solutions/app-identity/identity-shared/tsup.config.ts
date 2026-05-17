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
import { defineConfig } from 'tsup';

/**
 * tsup 构建配置
 * 
 * @description identity-shared 多端共享模块的构建配置
 * @version 3.0.0
 */
export default defineConfig({
  entry: [
    'src/index.ts',
    'src/types/index.ts',
    'src/events/index.ts',
    'src/constants/index.ts',
    'src/generated/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
