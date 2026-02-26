/**
 * @file 登录页面
 * @description 提供多种登录方式
 * @module identity-ui-web/pages/Login
 * @version 3.0.0
 */

import React, { useState } from 'react';
import { GoogleLoginButton } from '../../components/GoogleLoginButton';

/**
 * 登录页面
 */
export const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  // 检查 URL 参数中是否有错误
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="8" fill="#1677FF"/>
            <path d="M24 12L32 20H28V28H20V20H16L24 12Z" fill="white"/>
            <path d="M20 32H28V36H20V32Z" fill="white"/>
          </svg>
        </div>

        <h1 style={styles.title}>欢迎登录</h1>
        <p style={styles.subtitle}>Shinwa Platform</p>

        {/* 错误提示 */}
        {error && (
          <div style={styles.errorAlert}>
            {error}
          </div>
        )}

        {/* OAuth2 登录按钮 */}
        <div style={styles.oauthSection}>
          <GoogleLoginButton
            onSuccess={(result) => {
              console.log('Login success:', result);
              window.location.href = '/';
            }}
            onError={(err) => {
              console.error('Login error:', err);
              setError(err.message);
            }}
          />
        </div>

        {/* 分隔线 */}
        <div style={styles.divider}>
          <span style={styles.dividerText}>或</span>
        </div>

        {/* 传统登录表单 */}
        <form style={styles.form} onSubmit={(e) => e.preventDefault()}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>用户名 / 邮箱</label>
            <input
              type="text"
              style={styles.input}
              placeholder="请输入用户名或邮箱"
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>密码</label>
            <input
              type="password"
              style={styles.input}
              placeholder="请输入密码"
            />
          </div>
          <div style={styles.options}>
            <label style={styles.checkbox}>
              <input type="checkbox" />
              <span>记住我</span>
            </label>
            <a href="/forgot-password" style={styles.link}>忘记密码？</a>
          </div>
          <button type="submit" style={styles.submitButton}>
            登录
          </button>
        </form>

        {/* 注册链接 */}
        <p style={styles.registerHint}>
          还没有账号？<a href="/register" style={styles.link}>立即注册</a>
        </p>
      </div>

      {/* 页脚 */}
      <footer style={styles.footer}>
        <p>© 2026 Shinwa Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

/**
 * 样式定义
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    fontFamily: "'Inter', 'Helvetica', 'Arial', sans-serif",
    padding: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '420px',
  },
  logo: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 600,
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666666',
    textAlign: 'center',
    marginBottom: '32px',
  },
  errorAlert: {
    backgroundColor: '#fff2f0',
    border: '1px solid #ffccc7',
    borderRadius: '6px',
    padding: '12px 16px',
    marginBottom: '24px',
    color: '#ff4d4f',
    fontSize: '14px',
  },
  oauthSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
    gap: '16px',
  },
  dividerText: {
    flex: 1,
    textAlign: 'center',
    color: '#999999',
    fontSize: '13px',
    position: 'relative',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#333333',
  },
  input: {
    padding: '12px 14px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
  },
  options: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#666666',
    cursor: 'pointer',
  },
  link: {
    color: '#1677ff',
    textDecoration: 'none',
  },
  submitButton: {
    backgroundColor: '#1677ff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '12px',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '8px',
  },
  registerHint: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#666666',
    marginTop: '24px',
  },
  footer: {
    marginTop: '32px',
    color: '#999999',
    fontSize: '12px',
  },
};

export default LoginPage;
