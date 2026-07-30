async function initializeDefaultShareScope(): Promise<void> {
  if (typeof __webpack_init_sharing__ === 'function') {
    await __webpack_init_sharing__('default');
  }
}

function renderStartupError(): void {
  const root = document.getElementById('root');
  if (!root) {
    return;
  }

  const shell = document.createElement('main');
  shell.style.boxSizing = 'border-box';
  shell.style.display = 'grid';
  shell.style.minHeight = '100%';
  shell.style.placeItems = 'center';
  shell.style.padding = '24px';

  const panel = document.createElement('section');
  panel.setAttribute('role', 'alert');
  panel.style.background = '#ffffff';
  panel.style.border = '1px solid #d1d5db';
  panel.style.borderRadius = '8px';
  panel.style.boxShadow = '0 1px 3px rgb(17 24 39 / 0.08)';
  panel.style.padding = '20px';
  panel.style.width = 'min(420px, 100%)';

  const title = document.createElement('h1');
  title.textContent = 'Application startup failed';
  title.style.color = '#991b1b';
  title.style.fontSize = '18px';
  title.style.fontWeight = '700';
  title.style.letterSpacing = '0';
  title.style.margin = '0 0 8px';

  const message = document.createElement('p');
  message.textContent = 'Refresh the page. If the problem persists, contact technical support.';
  message.style.color = '#4b5563';
  message.style.fontSize = '14px';
  message.style.letterSpacing = '0';
  message.style.lineHeight = '1.5';
  message.style.margin = '0';

  panel.append(title, message);
  shell.append(panel);
  root.replaceChildren(shell);
}

initializeDefaultShareScope()
  .then(() => import('./bootstrap'))
  .then(({ bootstrap }) => bootstrap())
  .catch(() => {
    renderStartupError();
  });
