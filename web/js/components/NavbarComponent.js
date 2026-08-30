/**
 * NavbarComponent — Responsive Top Navigation Bar & Floating Theme Switcher Component.
 * Single Responsibility: Build and render top navigation header and floating theme toggle using DOM APIs.
 */
class NavbarComponent extends UIComponent {
  /**
   * @param {ThemeManager} [themeManager]
   */
  constructor(themeManager) {
    super();
    this.themeManager = themeManager || (window.ThemeManager ? new window.ThemeManager() : null);
  }

  /**
   * Build and mount the navbar for a specific active page ID.
   * @param {string} activePageId
   */
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

    // Navigation Menu items definition
    let navItems;
    if (isAuthPage || !isLoggedIn) {
      navItems = [
        { id: 'about', label: 'About Us', icon: 'faq', href: '/about' }
      ];
    } else {
      navItems = [
        { id: 'calendar', label: 'Calendar', icon: 'calendar', href: '/calendar' },
        { id: 'shop', label: 'Shop', icon: 'economy', href: '/shop' },
        { id: 'about', label: 'About Us', icon: 'faq', href: '/about' }
      ];
    }

    // 1. Far Left Brand Element
    const logoIcon = this.createElement('span', { attrs: { 'data-icon': 'logo', 'data-size': '20' } });
    const brandLogoDiv = this.createElement('div', { className: 'brand-logo-icon', children: [logoIcon] });

    const brandTitle = this.createElement('span', { className: 'brand-title', text: 'Habitizer' });
    const brandTagline = this.createElement('span', { className: 'brand-tagline', text: 'Habit Substitution' });
    const brandTextGroup = this.createElement('div', { className: 'brand-text-group', children: [brandTitle, brandTagline] });

    const brandOuter = this.createElement('a', {
      className: 'nav-brand-outer',
      attrs: { href: '/', title: 'Return to Welcome Page' },
      children: [brandLogoDiv, brandTextGroup]
    });

    // 2. Grid Container
    // 2a. Nav Left (Profile Pill or Log In link)
    const navLeft = this.createElement('div', { className: 'nav-left' });
    if (isLoggedIn) {
      const avatarCircle = this.createElement('div', {
        className: 'user-avatar-circle',
        text: firstName.charAt(0).toUpperCase()
      });
      const nameLabel = this.createElement('span', {
        className: 'user-name-label',
        text: firstName
      });
      const profilePill = this.createElement('a', {
        id: 'nav-profile',
        className: ['user-nav-pill', activePageId === 'profile' ? 'active' : ''],
        attrs: { href: '/profile', title: 'View My Profile' },
        children: [avatarCircle, nameLabel]
      });
      navLeft.appendChild(profilePill);
    }

    // 2b. Nav Center (Menu Links + Mobile Extras)
    const navCenter = this.createElement('nav', {
      id: 'top-nav-menu',
      className: 'nav-center'
    });

    // Mobile Top Row in Dropdown
    if (isLoggedIn) {
      const mobileAvatar = this.createElement('div', {
        className: 'user-avatar-circle',
        text: firstName.charAt(0).toUpperCase()
      });
      const mobileName = this.createElement('span', {
        text: `${user.full_name || 'Alex'} (${user.tier === 'premium' ? 'Premium' : 'Free'})`
      });
      const mobileProfileLink = this.createElement('a', {
        className: ['nav-link', 'mobile-only-link', activePageId === 'profile' ? 'active' : ''],
        attrs: { href: '/profile' },
        children: [mobileAvatar, mobileName]
      });
      navCenter.appendChild(mobileProfileLink);
    }

    // Standard Nav Links
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

    // Mobile Auth Actions in Dropdown (Log In / Register or Log Out)
    if (isLoggedIn) {
      const mobileExitIcon = this.createElement('span', { attrs: { 'data-icon': 'exit', 'data-size': '16' } });
      const mobileLogoutText = this.createElement('span', { text: 'Log Out' });
      const mobileLogoutLink = this.createElement('a', {
        className: ['nav-link', 'mobile-only-link', 'mobile-logout-link'],
        attrs: { href: '/login' },
        children: [mobileExitIcon, mobileLogoutText],
        events: {
          click: (e) => {
            e.preventDefault();
            if (window.Toast) window.Toast.show('Logged out successfully', 'info');
            setTimeout(() => {
              if (window.API) window.API.logout();
            }, 400);
          }
        }
      });
      navCenter.appendChild(mobileLogoutLink);
    }

    // 2c. Nav Right (New Habit CTA or Login Button + Mobile Toggle)
    const navRight = this.createElement('div', { className: 'nav-right' });
    if (isLoggedIn) {
      const plusIcon = this.createElement('span', { attrs: { 'data-icon': 'plus', 'data-size': '16' } });
      const addText = this.createElement('span', { text: 'New Habit' });
      const addHabitBtn = this.createElement('a', {
        className: 'btn-add-habit-nav',
        attrs: { href: '/create', title: 'Create Habit Substitution Loop' },
        children: [plusIcon, addText]
      });
      navRight.appendChild(addHabitBtn);
    }

    const mobileToggleBtn = this.createElement('button', {
      id: 'mobile-nav-toggle',
      className: 'mobile-menu-btn',
      attrs: { 'data-icon': 'menu', 'data-size': '20', 'aria-label': 'Toggle Navigation' },
      events: {
        click: () => {
          navCenter.classList.toggle('open');
        }
      }
    });
    navRight.appendChild(mobileToggleBtn);

    const navContainer = this.createElement('div', {
      className: 'nav-container',
      children: [navLeft, navCenter, navRight]
    });

    // 3. Far Right Outer Actions (Desktop Only Log In / Log Out / Register)
    const navActionsOuter = this.createElement('div', { className: 'nav-actions-outer' });
    if (isAuthPage) {
      if (activePageId === 'login') {
        const regBtn = this.createElement('a', {
          className: ['btn', 'btn-primary', 'btn-sm'],
          attrs: { href: '/register' },
          text: 'Register'
        });
        navActionsOuter.appendChild(regBtn);
      } else {
        const loginBtn = this.createElement('a', {
          className: ['btn', 'btn-primary', 'btn-sm'],
          attrs: { href: '/login' },
          text: 'Log In'
        });
        navActionsOuter.appendChild(loginBtn);
      }
    } else if (isLoggedIn) {
      const exitIcon = this.createElement('span', { attrs: { 'data-icon': 'exit', 'data-size': '16' } });
      const logoutText = this.createElement('span', { text: 'Log Out' });
      const logoutBtn = this.createElement('a', {
        id: 'btn-nav-logout',
        className: 'btn-logout-nav',
        attrs: { href: '/login', title: 'Log Out of Habitizer' },
        children: [exitIcon, logoutText],
        events: {
          click: (e) => {
            e.preventDefault();
            if (window.Toast) window.Toast.show('Logged out successfully', 'info');
            setTimeout(() => {
              if (window.API) window.API.logout();
            }, 400);
          }
        }
      });
      navActionsOuter.appendChild(logoutBtn);
    } else {
      const loginBtn = this.createElement('a', {
        className: ['btn', 'btn-primary', 'btn-sm'],
        attrs: { href: '/login', title: 'Log in to Habitizer' },
        text: 'Log In'
      });
      navActionsOuter.appendChild(loginBtn);
    }

    // Assemble Top Navbar
    const navHeader = this.createElement('header', {
      className: 'top-navbar',
      children: [brandOuter, navContainer, navActionsOuter]
    });

    container.innerHTML = '';
    container.appendChild(navHeader);

    // Floating Theme Toggle Button
    if (!document.getElementById('floating-theme-toggle')) {
      const moonIcon = this.createElement('span', { attrs: { 'data-icon': 'moon', 'data-size': '20' } });
      const themeBtn = this.createElement('button', {
        id: 'floating-theme-toggle',
        className: 'floating-theme-toggle',
        attrs: { 'aria-label': 'Toggle Dark / Light Mode', title: 'Toggle Dark / Light Mode' },
        children: [moonIcon],
        events: {
          click: () => {
            if (this.themeManager) this.themeManager.toggle();
            else if (window.ThemeManager) {
              const tm = new window.ThemeManager();
              tm.toggle();
            }
          }
        }
      });
      document.body.appendChild(themeBtn);
    }

    if (window.Icons) {
      window.Icons.renderAll();
    }
  }
}

// Global Registration
window.NavbarComponent = NavbarComponent;
window.Navbar = new NavbarComponent();
