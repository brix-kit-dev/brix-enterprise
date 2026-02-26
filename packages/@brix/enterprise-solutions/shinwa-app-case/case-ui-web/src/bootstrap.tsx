/**
 * Case 模块 UI 模块 - 应用入口
 * 
 * Module Federation 要求异步加载入口，避免共享依赖加载问题
 * 
 * @author Shinwa Team
 * @date 2026-02-23
 */
import('./App').then(({ default: App }) => {
  import('react-dom/client').then(({ createRoot }) => {
    const container = document.getElementById('root');
    if (container) {
      const root = createRoot(container);
      root.render(<App />);
    }
  });
});
