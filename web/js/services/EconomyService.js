/**
 * EconomyService — Shop economy operations.
 * Single Responsibility: Coin balance, streak freeze purchases, screen-time passes.
 */
class EconomyService {
  /** @type {number} Cost of a single streak freeze. */
  static FREEZE_COST = 50;
  /** @type {number} Cost of the 3-pack bundle. */
  static BUNDLE_COST = 120;
  /** @type {number} Freezes in the bundle. */
  static BUNDLE_QUANTITY = 3;

  /**
   * @param {AuthService} authService
   * @param {UserStateRepository} stateRepo
   */
  constructor(authService, stateRepo) {
    this._auth = authService;
    this._stateRepo = stateRepo;
  }

  /**
   * Get the economy data for the current user.
   * @returns {Promise<Object>} { currency_balance, streak_freezes_available, total_screen_time_earned_mins }
   */
  async getBalance() {
    const user = await this._auth.getCurrentUser();
    const state = this._stateRepo.load(user.id);
    return state.economy;
  }

  /**
   * Purchase a single streak freeze.
   * @returns {Promise<Object>} updated economy
   * @throws {Error} if insufficient coins
   */
  async buyStreakFreeze() {
    const { state, user } = await this._loadState();
    this._requireCoins(state, EconomyService.FREEZE_COST);

    state.economy.currency_balance -= EconomyService.FREEZE_COST;
    state.economy.streak_freezes_available += 1;

    this._stateRepo.save(user.id, state);
    return state.economy;
  }

  /**
   * Purchase the 3-pack streak freeze bundle.
   * @returns {Promise<Object>} updated economy
   * @throws {Error} if insufficient coins
   */
  async buyBundle() {
    const { state, user } = await this._loadState();
    this._requireCoins(state, EconomyService.BUNDLE_COST);

    state.economy.currency_balance -= EconomyService.BUNDLE_COST;
    state.economy.streak_freezes_available += EconomyService.BUNDLE_QUANTITY;

    this._stateRepo.save(user.id, state);
    return state.economy;
  }

  /**
   * Redeem a screen-time pass.
   * @param {number} mins — screen-time minutes to award
   * @param {number} coinPrice — cost in coins
   * @returns {Promise<Object>} updated economy
   * @throws {Error} if insufficient coins
   */
  async redeemPass(mins, coinPrice) {
    const { state, user } = await this._loadState();
    this._requireCoins(state, coinPrice);

    state.economy.currency_balance -= coinPrice;
    state.economy.total_screen_time_earned_mins += mins;

    this._stateRepo.save(user.id, state);
    return state.economy;
  }

  /**
   * Load current user and their state.
   * @returns {Promise<{user: Object, state: Object}>}
   * @private
   */
  async _loadState() {
    const user = await this._auth.getCurrentUser();
    const state = this._stateRepo.load(user.id);
    return { user, state };
  }

  /**
   * Throw if the user doesn't have enough coins.
   * @param {Object} state
   * @param {number} required
   * @private
   */
  _requireCoins(state, required) {
    if (state.economy.currency_balance < required) {
      throw new Error(`Insufficient Habit Coins (${required} needed)`);
    }
  }
}

window.EconomyService = EconomyService;
