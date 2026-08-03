/**
 * settings.js — client-side-only preferences (dark mode, default
 * target language) stored in localStorage. These are UI conveniences,
 * not security-relevant, so no backend endpoint is needed for them.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuthOrRedirect();
  if (!user) return;

  const darkToggle = document.getElementById('darkModeToggle');
  const targetSelect = document.getElementById('defaultTargetLanguage');

  darkToggle.checked = localStorage.getItem('theme') === 'dark';
  const savedLang = localStorage.getItem('defaultTargetLanguage');
  if (savedLang) targetSelect.value = savedLang;

  darkToggle.addEventListener('change', () => {
    if (darkToggle.checked) {
      document.body.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  });

  document.getElementById('savePrefsBtn').addEventListener('click', () => {
    localStorage.setItem('defaultTargetLanguage', targetSelect.value);
    showToast('Preferences saved.', 'success');
  });
});
