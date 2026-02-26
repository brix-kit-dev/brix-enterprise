/**
 * @file OAuth2 回调页面
 * @description 处理 OAuth2 授权回调
 * @module identity-ui-web/pages/OAuth2Callback
 * @version 3.2.0
 * 
 * 【架构红线合规 - v3.2】
 * - R3: 使用 HttpCapability 替代 fetch，符合 §7.1 HTTP 客户端规范
 * - R4: 使用 PluginStateCapability 替代 localStorage，符合 §7.2 状态存储规范
 * 
 * 【流程说明】
 * 1. Google 授权成功后重定向到此页面
 * 2. URL 参数包含 access_token 或 code
 * 3. 解析 Token 并通过 PluginStateCapability 存储
 * 4. 通过 NavigationCapability 重定向到目标页面
 */

import React, { useEffect, useState, useRef } from 'react';
import type { HttpCapability, PluginStateCapability, NavigationCapability } from '@brix/runtime-sdk-api-web';

// ==================== 能力管理 ====================

/**
 * 能力实例（由外部注入）
 */
let httpCapability: HttpCapability | null = null;
let stateCapability: PluginStateCapability | null = null;
let navigationCapability: NavigationCapability | null = null;

/**
 * 注入 HTTP 能力
 * @param capability - Shell 层提供的 HttpCapability 实现
 */
export function setHttpCapability(capability: HttpCapability): void {
  httpCapability = capability;
}

/**
 * 注入状态存储能力
 * @param capability - Shell 层提供的 PluginStateCapability 实现
 */
export function setStateCapability(capability: PluginStateCapability): void {
  stateCapability = capability;
}

/**
 * 注入导航能力
 * @param capability - Shell 层提供的 NavigationCapability 实现
 */
export function setNavigationCapability(capability: NavigationCapability): void {
  navigationCapability = capability;
}

// ==================== 类型定义 ====================

/**
 * OAuth2 回调结果
 */
interface CallbackResult {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    newUser: boolean;
  };
}

/**
 * Token 交换 API 响应
 */
interface TokenExchangeResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  newUser: boolean;
}

// ==================== 状态存储键常量 ====================

/**
 * 认证相关的状态存储键
 * 【命名规范】使用模块前缀 + 功能名，避免跨插件冲突
 */
const AUTH_STATE_KEYS = {
  ACCESS_TOKEN: 'identity:auth:access_token',
  REFRESH_TOKEN: 'identity:auth:refresh_token',
  TOKEN_EXPIRES_AT: 'identity:auth:token_expires_at',
} as const;

// ==================== 组件实现 ====================

/**
 * OAuth2 回调页面
 * 
 * 【职责】
 * 1. 解析 URL 中的 OAuth2 回调参数
 * 2. 处理隐式授权模式（access_token 在 URL 中）
 * 3. 处理授权码模式（code 在 URL 中，需要交换 Token）
 * 4. 将 Token 存储到 PluginStateCapability
 * 5. 重定向到首页
 */
export const OAuth2Callback: React.FC = () => {
  const [result, setResult] = useState<CallbackResult | null>(null);
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    handleCallback();
    
    // 清理定时器
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  /**
   * 处理 OAuth2 回调
   */
  const handleCallback = async () => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');

    // 处理错误情况
    if (error) {
      setResult({
        success: false,
        message: `登录失败: ${error}`,
      });
      return;
    }

    // 隐式授权模式：Token 直接在 URL 参数中
    const accessToken = params.get('access_token');
    if (accessToken) {
      await handleImplicitGrant(params);
      return;
    }

    // 授权码模式：需要用 code 交换 Token
    const code = params.get('code');
    if (code) {
      await handleAuthorizationCodeGrant(code);
      return;
    }

    // 无效参数
    setResult({
      success: false,
      message: '无效的回调参数',
    });
  };

  /**
   * 处理隐式授权模式
   * 
   * @param params - URL 查询参数
   */
  const handleImplicitGrant = async (params: URLSearchParams) => {
    const accessToken = params.get('access_token')!;
    const refreshToken = params.get('refresh_token');
    const expiresIn = params.get('expires_in');
    const newUser = params.get('new_user');

    // 通过能力契约存储 Token
    await storeTokens(accessToken, refreshToken, expiresIn);

    setResult({
      success: true,
      message: newUser === 'true' ? '注册成功！' : '登录成功！',
      data: {
        accessToken,
        refreshToken: refreshToken || '',
        expiresIn: parseInt(expiresIn || '3600'),
        newUser: newUser === 'true',
      },
    });

    startCountdownAndRedirect();
  };

  /**
   * 处理授权码模式：通过 API 交换授权码获取 Token
   * 
   * 【架构说明】使用 HttpCapability 发起请求，不直接调用 fetch
   * 
   * @param code - OAuth2 授权码
   */
  const handleAuthorizationCodeGrant = async (code: string) => {
    // 检查能力是否已注入
    if (!httpCapability) {
      console.error('[OAuth2Callback] HttpCapability 未初始化');
      setResult({
        success: false,
        message: '系统初始化异常，请刷新页面重试',
      });
      return;
    }

    try {
      // 通过 HttpCapability 调用 Token 交换 API
      const data = await httpCapability.post<TokenExchangeResponse>(
        '/api/v1/oauth2/google/callback',
        {
          code,
          redirectUri: window.location.origin + '/oauth2/callback',
        }
      );

      // 存储 Token
      await storeTokens(
        data.accessToken, 
        data.refreshToken, 
        String(data.expiresIn)
      );

      setResult({
        success: true,
        message: data.newUser ? '注册成功！' : '登录成功！',
        data: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
          newUser: data.newUser,
        },
      });

      startCountdownAndRedirect();

    } catch (error) {
      console.error('[OAuth2Callback] 授权码交换失败:', error);
      setResult({
        success: false,
        message: '登录失败，请重试',
      });
    }
  };

  /**
   * 存储认证 Token
   * 
   * 【架构说明】
   * 使用 PluginStateCapability 存储 Token，而非直接操作 localStorage。
   * 这允许 Host 层灵活选择存储实现（localStorage、sessionStorage、IndexedDB 等）。
   * 
   * @param accessToken - 访问令牌
   * @param refreshToken - 刷新令牌（可选）
   * @param expiresIn - 过期时间（秒）
   */
  const storeTokens = async (
    accessToken: string, 
    refreshToken: string | null, 
    expiresIn: string | null
  ) => {
    if (!stateCapability) {
      // 降级处理：如果状态能力未注入，使用 console.warn 记录但不阻断流程
      console.warn(
        '[OAuth2Callback] PluginStateCapability 未初始化，' +
        'Token 将无法持久化存储'
      );
      return;
    }

    // 存储访问令牌
    stateCapability.setState(AUTH_STATE_KEYS.ACCESS_TOKEN, accessToken);

    // 存储刷新令牌
    if (refreshToken) {
      stateCapability.setState(AUTH_STATE_KEYS.REFRESH_TOKEN, refreshToken);
    }

    // 计算并存储过期时间戳
    if (expiresIn) {
      const expiresAt = Date.now() + parseInt(expiresIn) * 1000;
      stateCapability.setState(AUTH_STATE_KEYS.TOKEN_EXPIRES_AT, expiresAt);
    }
  };

  /**
   * 开始倒计时并重定向
   */
  const startCountdownAndRedirect = () => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          navigateToHome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /**
   * 导航到首页
   * 
   * 【架构说明】
   * 优先使用 NavigationCapability 进行导航，保持与 Shell 路由系统的集成。
   * 如果能力未注入，降级为 window.location.href。
   */
  const navigateToHome = () => {
    if (navigationCapability) {
      navigationCapability.navigate('/');
    } else {
      // 降级处理
      window.location.href = '/';
    }
  };

  // ==================== 渲染逻辑 ====================

  // 加载中状态
  if (!result) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner} />
          <h2 style={styles.title}>正在处理登录...</h2>
          <p style={styles.message}>请稍候</p>
        </div>
      </div>
    );
  }

  // 结果状态
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {result.success ? (
          <>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.title}>{result.message}</h2>
            <p style={styles.message}>
              {countdown > 0 
                ? `${countdown} 秒后自动跳转到首页...` 
                : '正在跳转...'
              }
            </p>
            <button
              style={styles.button}
              onClick={navigateToHome}
            >
              立即跳转
            </button>
          </>
        ) : (
          <>
            <div style={styles.errorIcon}>✕</div>
            <h2 style={styles.title}>{result.message}</h2>
            <button
              style={styles.button}
              onClick={() => {
                if (navigationCapability) {
                  navigationCapability.navigate('/login');
                } else {
                  window.location.href = '/login';
                }
              }}
            >
              返回登录
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ==================== 样式定义 ====================

/**
 * 样式定义
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%',
  },
  title: {
    fontSize: '24px',
    fontWeight: 500,
    color: '#202124',
    marginBottom: '16px',
  },
  message: {
    fontSize: '14px',
    color: '#5f6368',
    marginBottom: '24px',
  },
  successIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#34A853',
    color: '#ffffff',
    fontSize: '32px',
    lineHeight: '64px',
    margin: '0 auto 24px',
  },
  errorIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#EA4335',
    color: '#ffffff',
    fontSize: '32px',
    lineHeight: '64px',
    margin: '0 auto 24px',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #4285F4',
    borderRadius: '50%',
    margin: '0 auto 24px',
    animation: 'spin 1s linear infinite',
  },
  button: {
    backgroundColor: '#4285F4',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
};

// 添加旋转动画（仅在浏览器环境）
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default OAuth2Callback;
