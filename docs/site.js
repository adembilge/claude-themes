(() => {
  const storageKey = 'claude-themes-site';
  const system = matchMedia('(prefers-color-scheme: dark)');
  const root = document.documentElement;
  const scheme = document.querySelector('meta[name="color-scheme"]');
  const properties = [
    '--background', '--panel', '--raised', '--line', '--text',
    '--muted', '--swatch', '--accent', '--on-accent', '--control',
  ];

  function readPreference() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      return {
        palette: sitePalettes.has(saved?.palette) ? saved.palette : 'Espresso',
        mode: ['system', 'light', 'dark'].includes(saved?.mode) ? saved.mode : 'dark',
      };
    } catch {
      return { palette: 'Espresso', mode: 'dark' };
    }
  }

  let preference = readPreference();
  function applyTheme() {
    const mode = preference.mode === 'system' ? (system.matches ? 'dark' : 'light') : preference.mode;
    scheme.content = preference.mode === 'system' ? 'light dark' : mode;
    root.style.colorScheme = scheme.content;
    const colors = sitePalettes.get(preference.palette)[mode];
    properties.forEach((property, index) => root.style.setProperty(property, colors[index]));
    const activeLook = document.querySelector('#active-look');
    if (activeLook) activeLook.textContent = preference.palette + ' · ' + (mode === 'dark' ? 'Dark' : 'Light');
  }

  applyTheme();
  system.addEventListener('change', applyTheme);

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    const header = document.querySelector('.site-header');
    if (window.ResizeObserver) {
      const measureHeader = () => root.style.setProperty('--header-h', header.offsetHeight + 'px');
      measureHeader();
      new ResizeObserver(measureHeader).observe(header);
    }

    const palette = document.querySelector('#palette');
    const mode = document.querySelector('#mode');
    for (const name of sitePalettes.keys()) {
      palette.add(new Option(name, name));
    }
    function updateControls() {
      palette.value = preference.palette;
      mode.value = preference.mode;
    }
    function saveTheme() {
      preference = { palette: palette.value, mode: mode.value };
      applyTheme();
      try {
        localStorage.setItem(storageKey, JSON.stringify(preference));
      } catch {
        // The selected palette still applies when storage is unavailable.
      }
    }
    updateControls();
    palette.addEventListener('change', saveTheme);
    mode.addEventListener('change', saveTheme);
    const picker = document.querySelector('#site-picker');
    const opener = document.querySelector('#themes-button');
    const nativePopover = typeof picker.showPopover === 'function';
    opener.hidden = false;
    if (nativePopover) {
      picker.hidden = false;
    } else {
      picker.dataset.fallback = '';
      const dismiss = (restoreFocus = false) => {
        picker.hidden = true;
        opener.setAttribute('aria-expanded', 'false');
        if (restoreFocus) opener.focus();
      };
      opener.setAttribute('aria-expanded', 'false');
      opener.addEventListener('click', () => {
        picker.hidden = !picker.hidden;
        opener.setAttribute('aria-expanded', String(!picker.hidden));
      });
      document.addEventListener('click', event => {
        if (!picker.hidden && !picker.contains(event.target) && !opener.contains(event.target)) dismiss();
      });
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !picker.hidden) dismiss(true);
      });
    }
    window.addEventListener('storage', event => {
      if (event.key !== null && event.key !== storageKey) return;
      preference = readPreference();
      updateControls();
      applyTheme();
    });

    let status = document.querySelector('#copy-status');
    if (!status) {
      status = document.createElement('p');
      status.className = 'visually-hidden';
      status.setAttribute('role', 'status');
      document.body.append(status);
    }
    if (!navigator.clipboard?.writeText) return;
    for (const button of document.querySelectorAll('.copy')) {
      const code = button.previousElementSibling;
      button.setAttribute('aria-label', 'Copy ' + code.textContent);
      button.hidden = false;
      let reset;
      button.addEventListener('click', async () => {
        clearTimeout(reset);
        try {
          await navigator.clipboard.writeText(code.textContent);
          button.textContent = 'Copied';
          status.textContent = 'Command copied.';
        } catch {
          const range = document.createRange();
          range.selectNodeContents(code);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          button.textContent = 'Selected';
          status.textContent = 'Command selected. Use your keyboard to copy it.';
        }
        reset = setTimeout(() => { button.textContent = 'Copy'; }, 2000);
      });
    }
  });
})();
