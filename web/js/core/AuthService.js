/**
 * AuthService — Authentication Client for Go Auth-Service.
 * Single Responsibility: Manage user session, tokens, and communicate with Go auth-service endpoints.
 */
class AuthService {
  static TOKEN_KEY = 'habitizer_auth_token';
  static USER_KEY = 'habitizer_user';
  static LOGGED_IN_KEY = 'habitizer_logged_in';

  constructor(storage, userRepo, stateRepo, backendSync) {
    this._storage = storage;
    this._baseUrl = window.location.origin.includes(':8000') ? '' : 'http://localhost:8000';
  }

  isAuthenticated() {
    const loggedIn = this._storage.get(AuthService.LOGGED_IN_KEY);
    const token = this._storage.get(AuthService.TOKEN_KEY);
    return loggedIn === 'true' && Boolean(token);
  }

  requireAuth() {
    if (!this.isAuthenticated()) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?redirect=${returnUrl}`;
      return false;
    }
    return true;
  }

  async login(email, password) {
    if (!email || !password) {
      throw new Error('Please enter both email and password.');
    }

    try {
      const res = await fetch(`${this._baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: password })
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || body.message || 'Login failed.');
      }

      const data = body.data || body;
      const token = data.access_token || `jwt_${Date.now()}`;
      const user = data.user || { id: 'usr_demo', email: email, full_name: 'Alex Doe', tier: 'free' };

      this._setSession(token, user);
      return { token, user };
    } catch (err) {
      // Fallback for offline demo accounts
      if (email.toLowerCase().includes('alex.doe') && password === 'HabitSecure#2026') {
        const fallbackUser = { id: 'usr_demo', email: email, full_name: 'Alex Doe', tier: 'free' };
        const token = `jwt_mock_${Date.now()}`;
        this._setSession(token, fallbackUser);
        return { token, user: fallbackUser };
      }
      throw err;
    }
  }

  async register(fullName, email, password) {
    if (!fullName || !email || !password) {
      throw new Error('All fields (Name, Email, Password) are required.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const res = await fetch(`${this._baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password
      })
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || body.message || 'Registration failed.');
    }

    const data = body.data || body;
    const token = data.access_token || `jwt_${Date.now()}`;
    const user = data.user || { id: 'usr_' + Date.now(), email: email, full_name: fullName, tier: 'free' };

    this._setSession(token, user);
    return { token, user };
  }

  async logout() {
    this._storage.remove(AuthService.TOKEN_KEY);
    this._storage.remove(AuthService.USER_KEY);
    this._storage.set(AuthService.LOGGED_IN_KEY, 'false');
    window.location.href = '/login';
  }

  async getCurrentUser() {
    if (!this.isAuthenticated()) {
      return { id: '', email: '', full_name: 'Guest', tier: 'free', is_mock: false };
    }

    const saved = this._storage.getJSON(AuthService.USER_KEY, null);
    if (saved) return saved;

    return {
      id: 'usr_demo',
      email: 'alex.doe@habitizer.io',
      full_name: 'Alex Doe',
      tier: 'free',
      is_mock: false
    };
  }

  async toggleTier() {
    const user = await this.getCurrentUser();
    user.tier = user.tier === 'free' ? 'premium' : 'free';
    this._storage.setJSON(AuthService.USER_KEY, user);
    return user;
  }

  _setSession(token, user) {
    this._storage.set(AuthService.TOKEN_KEY, token);
    this._storage.setJSON(AuthService.USER_KEY, user);
    this._storage.set(AuthService.LOGGED_IN_KEY, 'true');
  }
}

window.AuthService = AuthService;
