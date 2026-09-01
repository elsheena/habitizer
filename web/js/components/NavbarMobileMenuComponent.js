/**
 * NavbarMobileMenuComponent — Mobile Drawer Navigation Component.
 * Single Responsibility: Build mobile-only dropdown menu links, user avatar badge, and auth actions.
 */
class NavbarMobileMenuComponent extends UIComponent {
  /**
   * @param {Object} [callbacks]
   */
  constructor(callbacks = {}) {
    super();
    this.callbacks = callbacks;
  }

  buildMobileNav(navCenter, user, isLoggedIn, activePageId, navItems) {
    const firstName = (user.full_name || 'Alex').split(' ')[0];

    // Mobile Top Profile Row
    if (isLoggedIn) {
      const mobileAvatar = this.createElement('div', { className: 'user-avatar-circle', text: firstName.charAt(0).toUpperCase() });
      const mobileName = this.createElement('span', { text: user.full_name || 'Alex' });
      const mobileProfileLink = this.createElement('a', {
        className: ['nav-link', 'mobile-only-link', activePageId === 'profile' ? 'active' : ''],
        attrs: { href: '/profile' },
        children: [mobileAvatar, mobileName]
      });
      navCenter.appendChild(mobileProfileLink);
    }

    // Standard Nav Items
    navItems.forEach(item => {
      const iconSpan = this.createElement('span', { attrs: { 'data-icon': item.icon, 'data-size': '16' } });
      const labelSpan = this.createElement('span', { text: item.label });
      const link = this.createElement('a', {
        id: `nav-${item.id}`,
        className: ['nav-link', activePageId === item.id ? 'active' : ''],
        attrs: { href: item.href },
        children: [iconSpan, labelSpan]
      });
      navCenter.appendChild(link);
    });

    // Mobile Auth Actions
    if (!isLoggedIn) {
      const loginLink = this.createElement('a', {
        id: 'mobile-nav-login',
        className: ['nav-link', 'mobile-only-link', activePageId === 'login' ? 'active' : ''],
        attrs: { href: '/login' },
        children: [this.createElement('span', { attrs: { 'data-icon': 'user', 'data-size': '16' } }), this.createElement('span', { text: 'Log In' })]
      });
      const regLink = this.createElement('a', {
        id: 'mobile-nav-register',
        className: ['nav-link', 'mobile-only-link', activePageId === 'register' ? 'active' : ''],
        attrs: { href: '/register' },
        children: [this.createElement('span', { attrs: { 'data-icon': 'sparkles', 'data-size': '16' } }), this.createElement('span', { text: 'Register' })]
      });
      navCenter.appendChild(loginLink);
      navCenter.appendChild(regLink);
    } else {
      const logoutLink = this.createElement('a', {
        id: 'mobile-nav-logout',
        className: ['nav-link', 'mobile-only-link', 'mobile-logout-link'],
        attrs: { href: '/login' },
        children: [this.createElement('span', { attrs: { 'data-icon': 'exit', 'data-size': '16' } }), this.createElement('span', { text: 'Log Out' })],
        events: {
          click: (e) => {
            e.preventDefault();
            if (window.Toast) window.Toast.show('Logged out', 'info');
            setTimeout(() => { if (window.API) window.API.logout(); }, 300);
          }
        }
      });
      navCenter.appendChild(logoutLink);
    }
  }
}

window.NavbarMobileMenuComponent = NavbarMobileMenuComponent;
