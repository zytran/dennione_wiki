function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';

  if (next === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }

  localStorage.setItem('theme', next);

  if (window.simplemde) {
    simplemde.codemirror.refresh();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.theme_toggle');
  if (toggle) {
    toggle.addEventListener('click', toggleTheme);
  }
});
