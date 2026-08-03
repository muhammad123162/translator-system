/**
 * history.js — powers the Translation History page: debounced search,
 * a favorites-only filter, pagination, per-row delete (with a confirm
 * modal), favoriting, and "clear all".
 */

const PAGE_SIZE = 10;
let currentPage = 1;
let pendingDeleteId = null;
let searchDebounceTimer = null;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function truncate(str, max = 80) {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

async function loadHistory(page = 1) {
  currentPage = page;
  const tbody = document.getElementById('historyTableBody');
  const q = document.getElementById('searchInput').value.trim();
  const favoritesOnly = document.getElementById('favoritesOnly').checked;

  tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted-soft py-4">Loading...</td></tr>`;

  try {
    const { data } = await apiRequest('/translations/history', {
      params: { page, limit: PAGE_SIZE, q: q || undefined, favorites: favoritesOnly || undefined },
    });

    document.getElementById('resultsCount').textContent = `${data.total} result${data.total === 1 ? '' : 's'}`;

    if (!data.rows.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted-soft py-4">No translations found.</td></tr>`;
      renderPagination(0, page);
      return;
    }

    tbody.innerHTML = data.rows
      .map(
        (row) => `
      <tr>
        <td style="max-width: 260px;">${escapeHtml(truncate(row.original_text))}</td>
        <td style="max-width: 260px;">${escapeHtml(truncate(row.translated_text))}</td>
        <td><span class="badge badge-role-user">${row.source_language || 'auto'} → ${row.target_language}</span></td>
        <td class="small text-muted-soft">${new Date(row.created_at).toLocaleDateString()}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-link p-1 favorite-toggle" data-id="${row.id}" title="Toggle favorite">
            <i class="fa-${row.is_favorite ? 'solid' : 'regular'} fa-star" style="color: var(--nsuk-gold-400);"></i>
          </button>
          <button class="btn btn-sm btn-link p-1 text-danger delete-row" data-id="${row.id}" title="Delete">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>`
      )
      .join('');

    renderPagination(data.total, page);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">${err.message}</td></tr>`;
  }
}

function renderPagination(total, page) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pagination = document.getElementById('pagination');
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<li class="page-item ${i === page ? 'active' : ''}">
      <button class="page-link" data-page="${i}">${i}</button></li>`;
  }
  pagination.innerHTML = html;

  pagination.querySelectorAll('.page-link').forEach((btn) => {
    btn.addEventListener('click', () => loadHistory(Number(btn.dataset.page)));
  });
}

async function toggleFavorite(id) {
  try {
    await apiRequest(`/translations/history/${id}/favorite`, { method: 'PATCH' });
    loadHistory(currentPage);
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function confirmDelete() {
  if (!pendingDeleteId) return;
  try {
    await apiRequest(`/translations/history/${pendingDeleteId}`, { method: 'DELETE' });
    showToast('Translation deleted.', 'success');
    bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
    loadHistory(currentPage);
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function clearAllHistory() {
  if (!confirm('This will permanently delete your ENTIRE translation history. Continue?')) return;
  try {
    await apiRequest('/translations/history', { method: 'DELETE' });
    showToast('History cleared.', 'success');
    loadHistory(1);
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuthOrRedirect();
  if (!user) return;

  loadHistory(1);

  document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => loadHistory(1), 400);
  });
  document.getElementById('favoritesOnly').addEventListener('change', () => loadHistory(1));
  document.getElementById('clearAllBtn').addEventListener('click', clearAllHistory);

  document.getElementById('historyTableBody').addEventListener('click', (e) => {
    const favBtn = e.target.closest('.favorite-toggle');
    const delBtn = e.target.closest('.delete-row');
    if (favBtn) toggleFavorite(favBtn.dataset.id);
    if (delBtn) {
      pendingDeleteId = delBtn.dataset.id;
      new bootstrap.Modal(document.getElementById('deleteModal')).show();
    }
  });

  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
});
