/**
 * profile.js — loads the current user into the profile form, and
 * handles profile-info updates and password changes.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuthOrRedirect();
  if (!user) return;

  document.getElementById('name').value = user.name;
  document.getElementById('email').value = user.email;
  document.getElementById('role').value = user.role === 'admin' ? 'Administrator' : 'Standard User';
  document.getElementById('profileName').textContent = user.name;
  document.getElementById('profileEmail').textContent = user.email;
  document.getElementById('profileAvatar').textContent = user.name.charAt(0).toUpperCase();
  document.getElementById('profileRoleBadge').textContent = user.role === 'admin' ? 'Administrator' : 'User';
  document.getElementById('profileRoleBadge').className = user.role === 'admin' ? 'badge badge-role-admin' : 'badge badge-role-user';

  try {
    const { data } = await apiRequest('/translations/stats');
    document.getElementById('profileTotal').textContent = data.totalTranslations || 0;
    document.getElementById('profileLanguages').textContent = data.languagesUsed || 0;
  } catch (err) {
    /* non-critical — leave placeholders */
  }

  document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();
    try {
      await apiRequest('/users/profile', {
        method: 'PUT',
        body: {
          name: document.getElementById('name').value.trim(),
          email: document.getElementById('email').value.trim(),
        },
      });
      showToast('Profile updated successfully.', 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      hideLoading();
    }
  });

  document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();
    try {
      await apiRequest('/users/profile/password', {
        method: 'PUT',
        body: {
          currentPassword: document.getElementById('currentPassword').value,
          newPassword: document.getElementById('newPassword').value,
        },
      });
      showToast('Password updated successfully.', 'success');
      document.getElementById('passwordForm').reset();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      hideLoading();
    }
  });
});
