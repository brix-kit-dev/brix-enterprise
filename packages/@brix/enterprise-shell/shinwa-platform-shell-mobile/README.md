# Shinwa Platform Shell Mobile

> **状态**: ✅ **可用** — 提供 React Native 导航壳、插件加载和上下文管理  
> **版本**: 3.1.0

Mobile 端运行壳基座包，对应 Web 端的 `shinwa-platform-shell-web`。

## 功能

- **ShellProvider**: 根上下文提供者，管理壳状态和配置
- **ShellNavigator**: 导航容器，支持 Tab/Drawer/Stack 导航
- **PluginLoader**: 插件生命周期管理，支持依赖排序
- **PluginRegistry**: 插件注册表，管理路由聚合
- **Layouts**: AppLayout、TabNavigator、DrawerNavigator
- **Screens**: HomeScreen、SettingsScreen

## 安装

```bash
pnpm add @shinwa/shinwa-platform-shell-mobile
```

## 使用示例

```tsx
import { 
  ShellProvider, 
  ShellNavigator, 
  PluginLoader 
} from '@shinwa/shinwa-platform-shell-mobile';
import BookingPlugin from '@shinwa/booking-ui-mobile';

function App() {
  return (
    <ShellProvider
      config={{
        appName: 'My App',
        version: '1.0.0',
        theme: 'light',
        plugins: [],
        navigation: { type: 'tab', initialRoute: 'Home' }
      }}
      onReady={() => console.log('Shell ready!')}
    >
      <PluginLoader plugins={[BookingPlugin]}>
        <ShellNavigator />
      </PluginLoader>
    </ShellProvider>
  );
}
```

## 与 Web 版的关系

| 特性 | Web (`shinwa-platform-shell-web`) | Mobile (本模块) |
|------|----------------------------------|-----------------|
| 布局 | ConsoleLayout / PortalLayout | RN NavigationContainer |
| 插件加载 | Module Federation / iframe | RN 动态模块 |
| 状态管理 | Zustand | Zustand (共享) |
| 上下文 | ShellContext | ShellContext (相同 API) |

## 导出

| 入口 | 描述 |
|------|------|
| `@shinwa/shinwa-platform-shell-mobile` | 主入口，所有导出 |
| `@shinwa/shinwa-platform-shell-mobile/screens` | 屏幕组件 |
| `@shinwa/shinwa-platform-shell-mobile/navigation` | 导航组件和 hooks |
| `@shinwa/shinwa-platform-shell-mobile/plugins` | 插件管理 |
| `@shinwa/shinwa-platform-shell-mobile/layouts` | 布局组件 |
| `@shinwa/shinwa-platform-shell-mobile/hooks` | React hooks |

## 依赖

- `@brix/platform-auth-mobile`
- `react` >= 18.0.0
- `react-native` >= 0.72.0
