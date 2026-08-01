/**
 * AboutPageController — Controller for the About Us / FAQ view.
 * Single Responsibility: Mount navigation and initialize interactive FAQ elements.
 */
document.addEventListener('DOMContentLoaded', () => {
  if (window.Navbar) {
    window.Navbar.render('about');
  }
});
