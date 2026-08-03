/**
 * dashboard.js — populates the personal dashboard: stat cards and a
 * short list of the user's most recent translations.
 */

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function truncate(str, max = 60) {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

async function loadStats() {
  try {
    const { data } = await apiRequest('/translations/stats');
    document.getElementById('statTotal').textContent = data.totalTranslations || 0;
    document.getElementById('statLanguages').textContent = data.languagesUsed || 0;
    document.getElementById('statCharacters').textContent = (data.totalCharacters || 0).toLocaleString();
  } catch (err) {
    showToast('Could not load your stats.', 'danger');
  }
}

async function loadRecentTranslations() {
  const tbody = document.getElementById('recentTranslationsBody');
  try {
    const { data } = await apiRequest('/translations/history', { params: { page: 1, limit: 5 } });

    if (!data.rows.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted-soft py-4">
        No translations yet. <a href="/translator">Start translating</a>.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.rows
      .map(
        (row) => `
      <tr>
        <td>${escapeHtml(truncate(row.original_text))}</td>
        <td>${escapeHtml(truncate(row.translated_text))}</td>
        <td><span class="badge badge-role-user">${row.source_language || 'auto'} → ${row.target_language}</span></td>
        <td class="text-muted-soft small">${formatDate(row.created_at)}</td>
      </tr>`
      )
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-4">Could not load recent translations.</td></tr>`;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuthOrRedirect();
  if (!user) return;

  document.getElementById('welcomeName').textContent = user.name.split(' ')[0];
  loadStats();
  loadRecentTranslations();
});
