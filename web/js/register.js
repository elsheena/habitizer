/**
 * RegisterPageController — Controller for the Register / Sign Up view.
 * Single Responsibility: Handle user registration, password confirmation validation, and account creation.
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
  const confirmInput = document.getElementById('reg-confirm-password');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      const confirm = confirmInput ? confirmInput.value : '';

      if (password !== confirm) {
        if (window.Toast) {
          window.Toast.show('Passwords do not match.', 'error');
        }
        return;
      }

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Creating account...';
        }

        const res = await window.API.register(name, email, password);
        if (window.Toast) {
          window.Toast.show(`Account created! Welcome, ${res.user.full_name}!`, 'success');
        }

        setTimeout(() => {
          window.location.href = '/';
        }, 400);
      } catch (err) {
        if (window.Toast) {
          window.Toast.show(err.message, 'error');
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Free Account';
        }
      }
    });
  }
});
