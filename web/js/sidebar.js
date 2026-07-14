/**
 * Habitizer Navbar & Sidebar Compatibility Facade
 * Single Responsibility: Expose window.Navbar and window.Sidebar delegating to NavbarComponent.
 */
(() => {
  function initNavbar() {
    if (window.NavbarComponent) {
      window.Navbar = new window.NavbarComponent();
      window.Sidebar = window.Navbar;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
  } else {
    initNavbar();
  }
})();
