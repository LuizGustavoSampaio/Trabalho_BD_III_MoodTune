// Preferência visual: segue o sistema até o usuário escolher um tema.
(() => {
  const storageKey = 'moodtune-theme';
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = null;
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === 'dark' || stored === 'light') preference = stored;
  } catch {
    // A troca continua funcionando se o navegador bloquear o armazenamento.
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const button = document.getElementById('theme-toggle');
    if (button) button.setAttribute('aria-pressed', String(theme === 'dark'));
  }

  applyTheme(preference || (systemTheme.matches ? 'dark' : 'light'));

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    button.hidden = false;
    button.setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'dark'));
    button.addEventListener('click', () => {
      preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(preference);
      try {
        localStorage.setItem(storageKey, preference);
      } catch {
        // Sem armazenamento, mantém a escolha até a página ser recarregada.
      }
    });
  });

  systemTheme.addEventListener('change', (event) => {
    if (!preference) applyTheme(event.matches ? 'dark' : 'light');
  });
})();
