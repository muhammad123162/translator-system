/**
 * auth.js — handles the Login and Registration forms.
 * Client-side validation gives instant feedback; the server remains
 * the source of truth (see server/middleware/validators.js), so
 * nothing here is trusted for security purposes.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Show/hide password toggle (shared by both forms)
  document.getElementById('togglePassword')?.addEventListener('click', function () {
    const input = document.getElementById('password');
    const icon = this.querySelector('i');
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
  });

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!loginForm.checkValidity()) {
        loginForm.classList.add('was-validated');
        return;
      }

      const submitBtn = document.getElementById('loginSubmitBtn');
      submitBtn.disabled = true;
      showLoading();

      try {
        const { data } = await apiRequest('/auth/login', {
          method: 'POST',
          body: {
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value,
          },
        });
        if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
        showToast(`Welcome back, ${data.user.name.split(' ')[0]}!`, 'success');
        setTimeout(() => (window.location.href = '/dashboard'), 600);
      } catch (err) {
        showToast(err.message, 'danger');
      } finally {
        submitBtn.disabled = false;
        hideLoading();
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const confirmInput = document.getElementById('confirmPassword');

      confirmInput.setCustomValidity(password !== confirmPassword ? 'Passwords do not match.' : '');

      if (!registerForm.checkValidity()) {
        registerForm.classList.add('was-validated');
        return;
      }

      const submitBtn = document.getElementById('registerSubmitBtn');
      submitBtn.disabled = true;
      showLoading();

      try {
        const { data } = await apiRequest('/auth/register', {
          method: 'POST',
          body: {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            password,
          },
        });
        if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
        showToast('Account created! Redirecting to your dashboard...', 'success');
        setTimeout(() => (window.location.href = '/dashboard'), 700);
      } catch (err) {
        showToast(err.message, 'danger');
        if (err.errors?.length) {
          err.errors.forEach((fieldErr) => showToast(fieldErr.message, 'warning'));
        }
      } finally {
        submitBtn.disabled = false;
        hideLoading();
      }
    });
  }
});
