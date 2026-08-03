/**
 * translator.js — powers the Translator page: language dropdowns,
 * auto-detect, swap, translate, character counter, copy/download,
 * favoriting the current result, and a "recent translations" list.
 */

let lastTranslationId = null;
let isFavorited = false;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function populateLanguages() {
  const sourceSelect = document.getElementById('sourceLanguage');
  const targetSelect = document.getElementById('targetLanguage');

  try {
    const { data } = await apiRequest('/translations/languages');
    data.languages.forEach((lang) => {
      const opt1 = document.createElement('option');
      opt1.value = lang.language_code;
      opt1.textContent = lang.language_name;
      sourceSelect.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = lang.language_code;
      opt2.textContent = lang.language_name;
      targetSelect.appendChild(opt2);
    });
    // Sensible default target language: user preference (Settings page) or Hausa.
    const preferred = localStorage.getItem('defaultTargetLanguage');
    const defaultOption = [...targetSelect.options].find((o) => o.value === (preferred || 'ha')) || targetSelect.options[0];
    if (defaultOption) targetSelect.value = defaultOption.value;
  } catch (err) {
    showToast('Could not load the language list.', 'danger');
  }
}

function updateCharCount() {
  const text = document.getElementById('sourceText').value;
  document.getElementById('charCount').textContent = text.length;
}

function resetResultState() {
  lastTranslationId = null;
  isFavorited = false;
  const favBtn = document.getElementById('favoriteBtn');
  favBtn.disabled = true;
  favBtn.innerHTML = '<i class="fa-regular fa-star me-1"></i>Favorite';
  document.getElementById('detectedLanguageLabel').textContent = '';
}

async function handleTranslate() {
  const text = document.getElementById('sourceText').value.trim();
  const sourceLanguage = document.getElementById('sourceLanguage').value;
  const targetLanguage = document.getElementById('targetLanguage').value;
  const translateBtn = document.getElementById('translateBtn');
  const outputBox = document.getElementById('translatedText');

  if (!text) {
    showToast('Please enter some text to translate.', 'warning');
    return;
  }

  translateBtn.disabled = true;
  translateBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Translating...';

  try {
    const { data } = await apiRequest('/translations', {
      method: 'POST',
      body: { text, sourceLanguage, targetLanguage },
    });

    outputBox.value = data.translation.translated_text;
    lastTranslationId = data.translation.id;
    isFavorited = !!data.translation.is_favorite;

    const favBtn = document.getElementById('favoriteBtn');
    favBtn.disabled = false;
    favBtn.innerHTML = isFavorited
      ? '<i class="fa-solid fa-star me-1"></i>Favorited'
      : '<i class="fa-regular fa-star me-1"></i>Favorite';

    if (sourceLanguage === 'auto' && data.detectedSourceLanguage) {
      document.getElementById('detectedLanguageLabel').textContent =
        `Detected language: ${data.detectedSourceLanguage.toUpperCase()}`;
    } else {
      document.getElementById('detectedLanguageLabel').textContent = '';
    }

    loadRecentSidebarHistory();
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    translateBtn.disabled = false;
    translateBtn.innerHTML = '<i class="fa-solid fa-language me-2"></i>Translate';
  }
}

function handleSwap() {
  const sourceSelect = document.getElementById('sourceLanguage');
  const targetSelect = document.getElementById('targetLanguage');
  const sourceText = document.getElementById('sourceText');
  const translatedText = document.getElementById('translatedText');

  if (sourceSelect.value === 'auto') {
    showToast('Cannot swap while source is set to Auto-Detect.', 'warning');
    return;
  }

  const tempLang = sourceSelect.value;
  sourceSelect.value = targetSelect.value;
  targetSelect.value = tempLang;

  const tempText = sourceText.value;
  sourceText.value = translatedText.value;
  translatedText.value = tempText;

  updateCharCount();
  resetResultState();
}

function handleClear() {
  document.getElementById('sourceText').value = '';
  document.getElementById('translatedText').value = '';
  updateCharCount();
  resetResultState();
}

function handleCopy() {
  const text = document.getElementById('translatedText').value;
  if (!text) {
    showToast('Nothing to copy yet.', 'warning');
    return;
  }
  navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard.', 'success'));
}

function handleDownload() {
  const text = document.getElementById('translatedText').value;
  if (!text) {
    showToast('Nothing to download yet.', 'warning');
    return;
  }
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `translation-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

async function handleToggleFavorite() {
  if (!lastTranslationId) return;
  try {
    const { data } = await apiRequest(`/translations/history/${lastTranslationId}/favorite`, { method: 'PATCH' });
    isFavorited = !!data.translation.is_favorite;
    const favBtn = document.getElementById('favoriteBtn');
    favBtn.innerHTML = isFavorited
      ? '<i class="fa-solid fa-star me-1"></i>Favorited'
      : '<i class="fa-regular fa-star me-1"></i>Favorite';
    showToast(isFavorited ? 'Added to favorites.' : 'Removed from favorites.', 'success');
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function loadRecentSidebarHistory() {
  const container = document.getElementById('sidebarHistoryList');
  try {
    const { data } = await apiRequest('/translations/history', { params: { page: 1, limit: 5 } });
    if (!data.rows.length) {
      container.innerHTML = '<div class="text-center text-muted-soft py-3">No translations yet.</div>';
      return;
    }
    container.innerHTML = data.rows
      .map(
        (row) => `
      <div class="list-group-item px-0">
        <div class="d-flex justify-content-between">
          <small class="text-muted-soft">${row.source_language || 'auto'} → ${row.target_language}</small>
          <small class="text-muted-soft">${new Date(row.created_at).toLocaleDateString()}</small>
        </div>
        <div class="small">${escapeHtml(row.original_text.slice(0, 70))}${row.original_text.length > 70 ? '…' : ''}</div>
      </div>`
      )
      .join('');
  } catch (err) {
    container.innerHTML = '<div class="text-center text-danger py-3">Could not load history.</div>';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuthOrRedirect();
  if (!user) return;

  await populateLanguages();
  loadRecentSidebarHistory();

  document.getElementById('sourceText').addEventListener('input', updateCharCount);
  document.getElementById('translateBtn').addEventListener('click', handleTranslate);
  document.getElementById('swapBtn').addEventListener('click', handleSwap);
  document.getElementById('clearBtn').addEventListener('click', handleClear);
  document.getElementById('copyBtn').addEventListener('click', handleCopy);
  document.getElementById('downloadBtn').addEventListener('click', handleDownload);
  document.getElementById('favoriteBtn').addEventListener('click', handleToggleFavorite);
});
