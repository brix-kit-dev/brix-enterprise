# Google OAuth 登录集成指南

## 概述

本文档介绍如何在 Shinwa Platform 中集成 Google 账号登录功能。实现参考了以下大厂最佳实践：

- **Google**: Authorization Code Flow with PKCE
- **Auth0**: Secure token handling, state parameter
- **Firebase**: ID Token verification, nonce
- **Microsoft**: Multi-tenant support, token refresh

## 安全特性

### 1. Authorization Code Flow with PKCE

PKCE (Proof Key for Code Exchange) 是 OAuth 2.0 的安全扩展，防止授权码拦截攻击。

```
┌─────────┐                              ┌─────────────┐
│  前端   │                              │   Google    │
└────┬────┘                              └──────┬──────┘
     │                                          │
     │ 1. 生成 code_verifier (随机字符串)        │
     │    生成 code_challenge = SHA256(verifier) │
     │                                          │
     │ 2. 授权请求 (带 code_challenge)           │
     │──────────────────────────────────────────>│
     │                                          │
     │ 3. 用户授权                               │
     │<─────── 返回 authorization_code ─────────│
     │                                          │
     │ 4. Token 交换 (带 code_verifier)          │
     │──────────────────────────────────────────>│
     │                                          │
     │ 5. Google 验证:                          │
     │    SHA256(code_verifier) == code_challenge│
     │<─────── 返回 access_token + id_token ────│
     │                                          │
```

### 2. State 参数

防止 CSRF (跨站请求伪造) 攻击。每次授权请求生成唯一的 state 值，回调时验证。

### 3. Nonce 参数

防止重放攻击。嵌入到 ID Token 中，验证时检查。

### 4. 后端 Token 交换

**重要**：Token 交换必须在后端进行，原因：
1. 保护 `client_secret` 不被泄露到前端
2. 后端可以安全地验证 ID Token 签名
3. 后端可以创建/更新用户并生成平台 Token

## 前端使用

### 1. 基本使用

```tsx
import { useGoogleAuth, GoogleSignInButton } from '@shinwa/shinwa-platform-shell-web/oauth/google';

function LoginPage() {
  const { signIn, isLoading, error } = useGoogleAuth({
    clientId: 'your-client-id.apps.googleusercontent.com',
    redirectUri: 'http://localhost:3000/auth/callback/google',
    tokenEndpoint: '/api/auth/google/token', // 后端代理端点
  });

  return (
    <div>
      <GoogleSignInButton
        onClick={() => signIn()}
        loading={isLoading}
        theme="outline"
        size="large"
      />
      {error && <div className="error">{error.message}</div>}
    </div>
  );
}
```

### 2. 配置回调页面

```tsx
import { createGoogleCallbackPage } from '@shinwa/shinwa-platform-shell-web/oauth/google';
import { useNavigate } from 'react-router-dom';

// 创建回调页面组件
const GoogleCallbackPage = createGoogleCallbackPage({
  googleConfig: {
    clientId: 'your-client-id.apps.googleusercontent.com',
    tokenEndpoint: '/api/auth/google/token',
  },
  onSuccess: async (result) => {
    // 保存用户信息和 Token
    localStorage.setItem('user', JSON.stringify(result.user));
  },
  onError: (error) => {
    console.error('Google login failed:', error);
  },
  navigate: useNavigate(),
});

// 路由配置
<Route path="/auth/callback/google" element={<GoogleCallbackPage />} />
```

### 3. 高级配置

```tsx
const { signIn } = useGoogleAuth({
  clientId: 'your-client-id.apps.googleusercontent.com',
  
  // 授权范围
  scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar.readonly'],
  
  // 每次都选择账号
  prompt: 'select_account',
  
  // 获取 refresh_token
  accessType: 'offline',
  
  // 限制登录域名（Google Workspace）
  hostedDomain: 'company.com',
  
  // 使用弹窗模式
  usePopup: true,
  
  // 回调
  onSuccess: (result) => {
    console.log('登录成功', result.user);
  },
  onError: (error) => {
    console.error('登录失败', error);
  },
});
```

## 后端实现

### 1. 添加依赖

```xml
<dependency>
    <groupId>com.google.api-client</groupId>
    <artifactId>google-api-client</artifactId>
    <version>2.2.0</version>
</dependency>
```

### 2. 配置

```yaml
# application.yml
google:
  oauth:
    client-id: your-client-id.apps.googleusercontent.com
    client-secret: your-client-secret
```

### 3. 实现端点

参考 `docs/backend-google-oauth-example.java` 中的完整示例。

关键步骤：
1. 接收前端发来的授权码
2. 与 Google 交换 Token（带 PKCE code_verifier）
3. 验证 ID Token 签名和声明
4. 检查邮箱是否已验证
5. 创建或更新平台用户
6. 生成平台 Token 返回前端

## Google Cloud Console 配置

### 1. 创建 OAuth 客户端

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目或选择已有项目
3. 导航到 **APIs & Services > Credentials**
4. 点击 **Create Credentials > OAuth client ID**
5. 选择 **Web application**
6. 配置授权的 JavaScript 来源和重定向 URI

### 2. 配置 OAuth 同意屏幕

1. 导航到 **APIs & Services > OAuth consent screen**
2. 选择用户类型（内部/外部）
3. 填写应用信息
4. 添加授权范围（openid, email, profile）

### 3. 授权的重定向 URI

添加所有环境的回调 URI：
- 开发环境: `http://localhost:3000/auth/callback/google`
- 测试环境: `https://test.example.com/auth/callback/google`
- 生产环境: `https://www.example.com/auth/callback/google`

## 错误处理

| 错误代码 | 说明 | 处理建议 |
|---------|------|---------|
| `access_denied` | 用户拒绝授权 | 显示友好提示，提供其他登录方式 |
| `invalid_state` | State 验证失败 | 可能是 CSRF 攻击，重新发起登录 |
| `popup_blocked` | 弹窗被拦截 | 提示用户允许弹窗或使用重定向模式 |
| `token_exchange_failed` | Token 交换失败 | 检查后端配置和网络连接 |
| `email_not_verified` | 邮箱未验证 | 提示用户先验证 Google 邮箱 |

## 安全检查清单

- [ ] `client_secret` 只存储在后端环境变量中
- [ ] 启用 PKCE 保护
- [ ] 验证 state 参数防止 CSRF
- [ ] 后端验证 ID Token 签名
- [ ] 检查 `email_verified` 声明
- [ ] 实现 Token 刷新机制
- [ ] 配置适当的 CORS 策略
- [ ] 使用 HTTPS
- [ ] 实现速率限制
- [ ] 记录审计日志

## 最佳实践

1. **始终使用 PKCE**：即使是后端应用也建议使用 PKCE 增强安全性
2. **最小授权范围**：只请求必要的权限范围
3. **Token 存储**：使用 httpOnly cookie 存储敏感 Token
4. **静默刷新**：在 Token 过期前自动刷新，提升用户体验
5. **优雅降级**：Google 登录失败时提供备用登录方式

## 参考资料

- [Google Identity - OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In Branding Guidelines](https://developers.google.com/identity/branding-guidelines)
- [OAuth 2.0 PKCE (RFC 7636)](https://datatracker.ietf.org/doc/html/rfc7636)
- [OpenID Connect](https://openid.net/connect/)
