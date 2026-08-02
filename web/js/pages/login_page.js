/**
 * LoginPageController — Controller for the Login view.
 * Single Responsibility: Handle login form submission, input validation, and preset quick mock login.
 */
document.addEventListener('DOMContentLoaded', () => {
  if (window.Navbar) {
    window.Navbar.render('login');
  }

  const form = document.getElementById('login-form');
  const submitBtn = document.getElementById('btn-login-submit');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const mockBtn = document.getElementById('btn-preset-mock');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Signing in...';
        }

        const res = await window.API.login(email, password);
        if (window.Toast) {
          window.Toast.show(`Welcome back, ${res.user.full_name}!`, 'success');
        }

        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || '/';

        setTimeout(() => {
          window.location.href = redirect;
        }, 350);
      } catch (err) {
        if (window.Toast) {
          window.Toast.show(err.message, 'error');
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In to Habitizer';
        }
      }
    });
  }

  if (mockBtn) {
    mockBtn.addEventListener('click', () => {
      if (emailInput) emailInput.value = 'alex.doe@habitizer.io';
      if (passwordInput) passwordInput.value = 'HabitSecure#2026';
      if (window.Toast) {
        window.Toast.show('Mock account loaded! Click Sign In.', 'info');
      }
    });
  }
});
