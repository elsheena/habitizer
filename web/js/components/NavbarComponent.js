/**
 * NavbarComponent — Responsive Navigation Header & Theme Switcher Component.
 * Single Responsibility: Build top header navigation, delegate mobile menu, and attach theme toggle.
 */
class NavbarComponent extends UIComponent {
  constructor(themeManager) {
    super();
    this.themeManager = themeManager || (window.ThemeManager ? new window.ThemeManager() : null);
    this.mobileMenu = new NavbarMobileMenuComponent();
  }

  async render(activePageId) {
    const container = document.getElementById('navbar-container') || document.getElementById('sidebar-container');
    if (!container) return;

    let user = { full_name: "Alex Doe", email: "alex.doe@habitizer.io", tier: "free" };
    if (window.API && typeof window.API.getCurrentUser === 'function') {
      user = await window.API.getCurrentUser();
    }

    const firstName = (user.full_name || 'Alex').split(' ')[0];
    const isAuthPage = activePageId === 'login' || activePageId === 'register';
    const isLoggedIn = window.API && typeof window.API.isAuthenticated === 'function' ? window.API.isAuthenticated() : false;

    const navItems = (isAuthPage || !isLoggedIn)
      ? [{ id: 'about', label: 'About Us', icon: 'faq', href: '/about' }]
      : [
          { id: 'calendar', label: 'Calendar', icon: 'calendar', href: '/calendar' },
          { id: 'shop', label: 'Shop', icon: 'economy', href: '/shop' },
          { id: 'about', label: 'About Us', icon: 'faq', href: '/about' }
        ];

    // 1. Far Left Brand Element
    const brandLogo = this.createElement('div', { className: 'brand-logo-icon', children: [this.createElement('span', { attrs: { 'data-icon': 'logo', 'data-size': '20' } })] });
    const brandText = this.createElement('div', { className: 'brand-text-group', children: [this.createElement('span', { className: 'brand-title', text: 'Habitizer' }), this.createElement('span', { className: 'brand-tagline', text: 'Habit Substitution' })] });
    const brandOuter = this.createElement('a', { className: 'nav-brand-outer', attrs: { href: '/', title: 'Home' }, children: [brandLogo, brandText] });

    // 2. Grid Navigation
    const navLeft = this.createElement('div', { className: 'nav-left' });
    if (isLoggedIn) {
      const avatarCircle = this.createElement('div', { className: 'user-avatar-circle', text: firstName.charAt(0).toUpperCase() });
      const nameLabel = this.createElement('span', { className: 'user-name-label', text: firstName });
      const profilePill = this.createElement('a', { id: 'nav-profile', className: ['user-nav-pill', activePageId === 'profile' ? 'active' : ''], attrs: { href: '/profile', title: 'Profile' }, children: [avatarCircle, nameLabel] });
      navLeft.appendChild(profilePill);
    }

    const navCenter = this.createElement('nav', { id: 'top-nav-menu', className: 'nav-center' });
    this.mobileMenu.buildMobileNav(navCenter, user, isLoggedIn, activePageId, navItems);

    const navRight = this.createElement('div', { className: 'nav-right' });
    if (isLoggedIn) {
      const addHabitBtn = this.createElement('a', { className: 'btn-add-habit-nav', attrs: { href: '/create', title: 'New Habit' }, children: [this.createElement('span', { attrs: { 'data-icon': 'plus', 'data-size': '16' } }), this.createElement('span', { text: 'New Habit' })] });
      navRight.appendChild(addHabitBtn);
    }

    const mobileToggleBtn = this.createElement('button', { id: 'mobile-nav-toggle', className: 'mobile-menu-btn', attrs: { 'data-icon': 'menu', 'data-size': '20', 'aria-label': 'Toggle Navigation' }, events: { click: () => navCenter.classList.toggle('open') } });
    navRight.appendChild(mobileToggleBtn);

    const navContainer = this.createElement('div', { className: 'nav-container', children: [navLeft, navCenter, navRight] });

    // 3. Far Right Desktop Actions
    const navActionsOuter = this.createElement('div', { className: 'nav-actions-outer' });
    if (isAuthPage) {
      const isLogin = activePageId === 'login';
      navActionsOuter.appendChild(this.createElement('a', { className: ['btn', 'btn-primary', 'btn-sm'], attrs: { href: isLogin ? '/register' : '/login' }, text: isLogin ? 'Register' : 'Log In' }));
    } else if (isLoggedIn) {
      const logoutBtn = this.createElement('a', { id: 'btn-nav-logout', className: 'btn-logout-nav', attrs: { href: '/login', title: 'Log Out' }, children: [this.createElement('span', { attrs: { 'data-icon': 'exit', 'data-size': '16' } }), this.createElement('span', { text: 'Log Out' })], events: { click: (e) => { e.preventDefault(); if (window.Toast) window.Toast.show('Logged out', 'info'); setTimeout(() => { if (window.API) window.API.logout(); }, 300); } } });
      navActionsOuter.appendChild(logoutBtn);
    } else {
      navActionsOuter.appendChild(this.createElement('a', { className: ['btn', 'btn-primary', 'btn-sm'], attrs: { href: '/login', title: 'Log In' }, text: 'Log In' }));
    }

    container.innerHTML = '';
    container.appendChild(this.createElement('header', { className: 'top-navbar', children: [brandOuter, navContainer, navActionsOuter] }));

    // Floating Theme Switcher
    if (!document.getElementById('floating-theme-toggle')) {
      document.body.appendChild(this.createElement('button', { id: 'floating-theme-toggle', className: 'floating-theme-toggle', attrs: { 'aria-label': 'Toggle Theme', title: 'Toggle Theme' }, children: [this.createElement('span', { attrs: { 'data-icon': 'moon', 'data-size': '20' } })], events: { click: () => { if (this.themeManager) this.themeManager.toggle(); else if (window.ThemeManager) new window.ThemeManager().toggle(); } } }));
    }

    if (window.Icons) window.Icons.renderAll();
  }
}

window.NavbarComponent = NavbarComponent;
window.Navbar = new NavbarComponent();
