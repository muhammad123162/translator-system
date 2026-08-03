/**
 * admin.js — powers the Admin Dashboard: tab switching, Chart.js
 * visualizations, user management (list/delete/activate-deactivate),
 * translation log viewing, and language activation toggles.
 */

let volumeChartInstance = null;
let languageChartInstance = null;
let pendingDeleteUserId = null;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- Tabs ---
function initTabs() {
  document.querySelectorAll('#adminTabs .nav-link').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#adminTabs .nav-link').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.admin-tab-pane').forEach((pane) => pane.classList.add('d-none'));
      document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('d-none');
    });
  });
}

// --- Overview ---
async function loadOverview() {
  try {
    const { data } = await apiRequest('/admin/dashboard');

    document.getElementById('adminTotalUsers').textContent = data.totalUsers;
    document.getElementById('adminTotalTranslations').textContent = data.totalTranslations;
    document.getElementById('adminApiErrors').textContent = data.apiErrors;

    renderVolumeChart(data.dailyVolume);
    renderLanguageChart(data.topLanguages);
  } catch (err) {
    showToast('Could not load dashboard stats.', 'danger');
  }
}

function renderVolumeChart(dailyVolume) {
  const ctx = document.getElementById('volumeChart');
  const labels = dailyVolume.map((d) => new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
  const counts = dailyVolume.map((d) => d.count);

  if (volumeChartInstance) volumeChartInstance.destroy();
  volumeChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Translations',
        data: counts,
        borderColor: '#145c34',
        backgroundColor: 'rgba(20,92,52,0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#d4af37',
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });
}

function renderLanguageChart(topLanguages) {
  const ctx = document.getElementById('languageChart');
  const labels = topLanguages.map((l) => l.target_language.toUpperCase());
  const counts = topLanguages.map((l) => l.count);

  if (languageChartInstance) languageChartInstance.destroy();
  languageChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: ['#145c34', '#d4af37', '#1b7a44', '#b9922c'],
        borderWidth: 0,
      }],
    },
    options: { plugins: { legend: { position: 'bottom' } } },
  });
}

// --- Users ---
async function loadUsers() {
  const tbody = document.getElementById('usersTableBody');
  try {
    const { data } = await apiRequest('/admin/users', { params: { page: 1, limit: 50 } });

    if (!data.rows.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted-soft py-4">No users found.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.rows
      .map(
        (u) => `
      <tr>
        <td>${escapeHtml(u.name)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td><span class="badge ${u.role === 'admin' ? 'badge-role-admin' : 'badge-role-user'}">${u.role}</span></td>
        <td>
          <div class="form-check form-switch mb-0">
            <input class="form-check-input active-toggle" type="checkbox" data-id="${u.id}" ${u.is_active ? 'checked' : ''}>
          </div>
        </td>
        <td class="small text-muted-soft">${new Date(u.created_at).toLocaleDateString()}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-link p-1 text-danger delete-user" data-id="${u.id}" title="Delete user">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>`
      )
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">${err.message}</td></tr>`;
  }
}

async function toggleUserActive(id, isActive) {
  try {
    await apiRequest(`/admin/users/${id}/active`, { method: 'PATCH', body: { isActive } });
    showToast(`User ${isActive ? 'activated' : 'deactivated'}.`, 'success');
  } catch (err) {
    showToast(err.message, 'danger');
    loadUsers();
  }
}

async function confirmDeleteUser() {
  if (!pendingDeleteUserId) return;
  try {
    await apiRequest(`/admin/users/${pendingDeleteUserId}`, { method: 'DELETE' });
    showToast('User deleted.', 'success');
    bootstrap.Modal.getInstance(document.getElementById('deleteUserModal')).hide();
    loadUsers();
    loadOverview();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// --- Translation Logs ---
async function loadLogs() {
  const tbody = document.getElementById('logsTableBody');
  try {
    const { data } = await apiRequest('/admin/translation-logs', { params: { page: 1, limit: 30 } });

    if (!data.rows.length) {
      tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted-soft py-4">No translation logs yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.rows
      .map(
        (log) => `
      <tr>
        <td>${escapeHtml(log.userName)} <span class="text-muted-soft small">(${escapeHtml(log.userEmail)})</span></td>
        <td><span class="badge badge-role-user">${log.source_language || 'auto'} → ${log.target_language}</span></td>
        <td class="small text-muted-soft">${new Date(log.created_at).toLocaleString()}</td>
      </tr>`
      )
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger py-4">${err.message}</td></tr>`;
  }
}

// --- Languages ---
async function loadLanguages() {
  const tbody = document.getElementById('languagesTableBody');
  try {
    const { data } = await apiRequest('/admin/languages');

    tbody.innerHTML = data.languages
      .map(
        (lang) => `
      <tr>
        <td>${escapeHtml(lang.language_name)}</td>
        <td><code>${lang.language_code}</code></td>
        <td>
          <div class="form-check form-switch mb-0">
            <input class="form-check-input lang-active-toggle" type="checkbox" data-id="${lang.id}" ${lang.is_active ? 'checked' : ''}>
          </div>
        </td>
        <td class="text-end small text-muted-soft">${lang.is_active ? 'Visible in Translator' : 'Hidden'}</td>
      </tr>`
      )
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-4">${err.message}</td></tr>`;
  }
}

async function toggleLanguageActive(id, isActive) {
  try {
    await apiRequest(`/admin/languages/${id}/active`, { method: 'PATCH', body: { isActive } });
    showToast('Language updated.', 'success');
    loadLanguages();
  } catch (err) {
    showToast(err.message, 'danger');
    loadLanguages();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuthOrRedirect('admin');
  if (!user) return;

  initTabs();
  loadOverview();
  loadUsers();
  loadLogs();
  loadLanguages();

  document.getElementById('usersTableBody').addEventListener('change', (e) => {
    if (e.target.classList.contains('active-toggle')) {
      toggleUserActive(e.target.dataset.id, e.target.checked);
    }
  });

  document.getElementById('usersTableBody').addEventListener('click', (e) => {
    const delBtn = e.target.closest('.delete-user');
    if (delBtn) {
      pendingDeleteUserId = delBtn.dataset.id;
      new bootstrap.Modal(document.getElementById('deleteUserModal')).show();
    }
  });

  document.getElementById('confirmDeleteUserBtn').addEventListener('click', confirmDeleteUser);

  document.getElementById('languagesTableBody').addEventListener('change', (e) => {
    if (e.target.classList.contains('lang-active-toggle')) {
      toggleLanguageActive(e.target.dataset.id, e.target.checked);
    }
  });
});
