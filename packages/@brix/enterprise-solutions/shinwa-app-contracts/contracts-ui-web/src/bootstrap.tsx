/**
 * @file Contracts Module UI Entry Point
 * @description Module Federation requires async entry loading to avoid shared dependency conflicts
 * @module @shinwa/contracts-ui-web
 * @version 3.0.0
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
