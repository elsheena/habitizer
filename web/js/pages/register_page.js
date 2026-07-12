/**
 * RegisterPageController — Controller for the Registration view.
 * Single Responsibility: Handle user registration, validation, and onboarding redirection.
 */
document.addEventListener('DOMContentLoaded', () => {
  if (window.Navbar) {
    window.Navbar.render('register');
  }

  const form = document.getElementById('register-form');
  const submitBtn = document.getElementById('btn-register-submit');
  const nameInput = document.getElementById('reg-name');
  const emailInput = document.getElementById('reg-email');
  const passwordInput = document.getElementById('reg-password');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Creating account...';
        }

        const res = await window.API.register(fullName, email, password);
        if (window.Toast) {
          window.Toast.show(`Welcome to Habitizer, ${res.user.full_name}! (2 Free Freezes awarded)`, 'success');
        }

        setTimeout(() => {
          window.location.href = '/';
        }, 350);
      } catch (err) {
        if (window.Toast) {
          window.Toast.show(err.message, 'error');
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Get Started Free';
        }
      }
    });
  }
});
