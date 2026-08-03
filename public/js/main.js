/**
 * main.js
 * Shared utilities loaded on every page: a small fetch wrapper for the
 * API, toast notifications, the global loading overlay, and the
 * auth-aware navbar/sidebar toggling (guest-only vs auth-only vs
 * admin-only elements).
 */

const API_BASE = '/api';

/**
 * Wraps fetch() with sane defaults: JSON body handling, credentials
 * (so the httpOnly auth cookie is sent), and consistent error
 * throwing so every caller can just try/catch one shape of error.
 */
async function apiRequest(path, { method = 'GET', body = null, params = null } = {}) {
  let url = `${API_BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const accessToken = localStorage.getItem('accessToken');

  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong.');
    error.status = response.status;
    error.errors = data.errors;
    throw error;
  }

  return data;
}

// --- Loading overlay ---
function showLoading() {
  document.getElementById('loadingOverlay')?.classList.add('active');
}
function hideLoading() {
  document.getElementById('loadingOverlay')?.classList.remove('active');
}

// --- Toasts ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: 'fa-circle-check', danger: 'fa-circle-exclamation', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const el = document.createElement('div');
  el.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type} border-0`;
  el.setAttribute('role', 'alert');
  el.innerHTML = `
    <div class="d-flex">
      <div class="toast-body"><i class="fa-solid ${icons[type] || icons.info} me-2"></i>${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`;
  container.appendChild(el);
  const toast = new bootstrap.Toast(el, { delay: 4000 });
  toast.show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}

// --- Auth state (nav toggling) ---
async function refreshAuthUI() {
  const guestEls = document.querySelectorAll('.guest-only');
  const authEls = document.querySelectorAll('.auth-only');
  const adminEls = document.querySelectorAll('.admin-only');

  try {
    const { data } = await apiRequest('/auth/me');
    const user = data.user;

    guestEls.forEach((el) => (el.style.display = 'none'));
    authEls.forEach((el) => (el.style.display = ''));
    if (user.role === 'admin') adminEls.forEach((el) => (el.style.display = ''));

    const nameLabel = document.getElementById('userNameLabel');
    const initialBadge = document.getElementById('userInitial');
    if (nameLabel) nameLabel.textContent = user.name.split(' ')[0];
    if (initialBadge) initialBadge.textContent = user.name.charAt(0).toUpperCase();

    return user;
  } catch (err) {
    guestEls.forEach((el) => (el.style.display = ''));
    authEls.forEach((el) => (el.style.display = 'none'));
    adminEls.forEach((el) => (el.style.display = 'none'));
    return null;
  }
}

/**
 * Protects app pages (dashboard, translator, history, profile,
 * settings, admin): if the user isn't authenticated, bounce to
 * /login. Called explicitly by each protected page's own script.
 */
async function requireAuthOrRedirect(requiredRole = null) {
  const user = await refreshAuthUI();
  if (!user) {
    window.location.href = '/login';
    return null;
  }
  if (requiredRole && user.role !== requiredRole) {
    window.location.href = '/dashboard';
    return null;
  }
  return user;
}

function logout() {
  apiRequest('/auth/logout', { method: 'POST' })
    .catch(() => {})
    .finally(() => {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    });
}

document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme preference (app shell pages only).
  if (document.body.classList.contains('app-page')) {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') document.body.setAttribute('data-theme', 'dark');
  }

  refreshAuthUI();
  document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });

  // Mobile sidebar toggle (app shell pages)
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('appSidebar')?.classList.toggle('d-none');
  });
});
