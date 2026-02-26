/**
 * @file Google 登录按钮组件
 * @description 实现 Google OAuth2 登录按钮
 * @module identity-ui-web/components/GoogleLoginButton
 * @version 3.2.0
 * 
 * 【架构红线合规 - v3.2】
 * - R3: 使用 HttpCapability 替代 fetch，符合 §7.1 HTTP 客户端规范
 * - R4: 使用 PluginStateCapability 替代 sessionStorage，符合 §7.2 状态存储规范
 * 
 * 【设计参考】
 * - Google Identity Services: https://developers.google.com/identity/gsi/web
 * - OAuth 2.0 Authorization Code Flow with PKCE
 * 
 * 【使用示例】
 * ```tsx
 * // 在插件激活时注入能力
 * import { setHttpCapability, setStateCapability } from './components/GoogleLoginButton';
 * setHttpCapability(http);
 * setStateCapability(state);
 * 
 * // 使用组件
 * <GoogleLoginButton 
 *   onSuccess={(result) => console.log('Login success:', result)}
 *   onError={(error) => console.error('Login failed:', error)}
 * />
 * ```
 */

import React, { useCallback, useState } from 'react';
import type { HttpCapability, PluginStateCapability } from '@brix/runtime-sdk-api-web';

// ==================== 能力管理 ====================

/**
 * 能力实例（由外部注入）
 */
let httpCapability: HttpCapability | null = null;
let stateCapability: PluginStateCapability | null = null;

/**
 * 注入 HTTP 能力
 * 
 * @param capability - Shell 层提供的 HttpCapability 实现
 */
export function setHttpCapability(capability: HttpCapability): void {
  httpCapability = capability;
}

/**
 * 注入状态存储能力
 * 
 * @param capability - Shell 层提供的 PluginStateCapability 实现
 */
export function setStateCapability(capability: PluginStateCapability): void {
  stateCapability = capability;
}

// ==================== 状态键常量 ====================

/**
 * OAuth2 相关的状态存储键
 * 【命名规范】使用模块前缀 + 功能名，避免跨插件冲突
 */
const OAUTH_STATE_KEYS = {
  /** OAuth2 state 参数（用于 CSRF 防护） */
  OAUTH2_STATE: 'identity:oauth:state',
} as const;

// ==================== 类型定义 ====================

/**
 * Google 登录按钮属性
 */
export interface GoogleLoginButtonProps {
  /** 登录成功回调 */
  onSuccess?: (result: OAuth2AuthResult) => void;
  /** 登录失败回调 */
  onError?: (error: Error) => void;
  /** 按钮文本 */
  text?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

/**
 * OAuth2 认证结果
 */
export interface OAuth2AuthResult {
  newUser: boolean;
  userId: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * 授权 URL 响应
 */
interface AuthorizationUrlResponse {
  authorizationUrl: string;
  state: string;
}

// ==================== 组件实现 ====================

/**
 * Google 登录按钮组件
 * 
 * 【OAuth 2.0 Authorization Code Flow 实现】
 * 1. 点击按钮 -> 通过 HttpCapability 获取授权 URL
 * 2. 通过 PluginStateCapability 存储 state（CSRF 防护）
 * 3. 重定向到 Google 授权页面
 * 4. 用户授权后，Google 重定向回 callback 页面
 * 
 * 【架构说明】
 * - 不直接使用 fetch，通过 HttpCapability 发起请求
 * - 不直接使用 sessionStorage，通过 PluginStateCapability 存储临时状态
 */
export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  text = '使用 Google 账号登录',
  disabled = false,
  style,
  className,
}) => {
  const [loading, setLoading] = useState(false);

  /**
   * 处理 Google 登录点击
   * 
   * 【流程】
   * 1. 调用后端 API 获取 Google 授权 URL
   * 2. 存储 state 参数用于后续验证
   * 3. 重定向到 Google 授权页面
   */
  const handleGoogleLogin = useCallback(async () => {
    if (loading || disabled) return;

    // 检查 HTTP 能力是否已注入
    if (!httpCapability) {
      const error = new Error(
        '[GoogleLoginButton] HttpCapability 未初始化，' +
        '请确保在插件激活时调用 setHttpCapability(capability)'
      );
      console.error(error.message);
      onError?.(error);
      return;
    }

    setLoading(true);
    try {
      // 1. 通过 HttpCapability 获取 Google 授权 URL
      const data = await httpCapability.get<AuthorizationUrlResponse>(
        '/api/v1/oauth2/google/authorize'
      );

      const { authorizationUrl, state } = data;

      // 2. 通过 PluginStateCapability 存储 state 用于验证（防止 CSRF）
      if (stateCapability) {
        stateCapability.setState(OAUTH_STATE_KEYS.OAUTH2_STATE, state);
      } else {
        // 降级警告：如果能力未注入，记录警告但不阻断流程
        console.warn(
          '[GoogleLoginButton] PluginStateCapability 未初始化，' +
          'OAuth2 state 参数将无法验证，可能存在 CSRF 风险'
        );
      }

      // 3. 重定向到 Google 授权页面
      window.location.href = authorizationUrl;

    } catch (error) {
      console.error('[GoogleLoginButton] 获取授权 URL 失败:', error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
      setLoading(false);
    }
  }, [loading, disabled, onError]);

  // ==================== 样式定义 ====================

  // Google 品牌色
  const googleBlue = '#4285F4';
  const googleRed = '#EA4335';
  const googleYellow = '#FBBC05';
  const googleGreen = '#34A853';

  const defaultStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '12px 24px',
    backgroundColor: '#ffffff',
    border: '1px solid #dadce0',
    borderRadius: '4px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.7 : 1,
    fontSize: '14px',
    fontWeight: 500,
    color: '#3c4043',
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    transition: 'background-color 0.2s, box-shadow 0.2s',
    minWidth: '200px',
    ...style,
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={disabled || loading}
      className={className}
      style={defaultStyle}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.backgroundColor = '#f8f9fa';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#ffffff';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Google Logo SVG */}
      <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
          fill={googleBlue}
        />
        <path
          d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.26c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z"
          fill={googleGreen}
        />
        <path
          d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z"
          fill={googleYellow}
        />
        <path
          d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
          fill={googleRed}
        />
      </svg>
      <span>{loading ? '登录中...' : text}</span>
    </button>
  );
};

export default GoogleLoginButton;
