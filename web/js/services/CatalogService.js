/**
 * CatalogService — Suggested habit catalog data.
 * Single Responsibility: Provide and filter the replacement routine catalog.
 */
class CatalogService {
  constructor() {
    this._catalog = [
      { id: 'cat_01', category: 'Mindfulness', title: '5-Minute Deep Breathing', description: 'Take 10 slow, diaphragmatic breaths to downregulate cortisol and craving triggers.', icon: 'sparkles' },
      { id: 'cat_02', category: 'Hydration', title: 'Drink a Large Glass of Cold Water', description: 'Cravings often disguise physiological thirst. Drink 350ml slowly.', icon: 'check' },
      { id: 'cat_03', category: 'Physical Action', title: 'Do 10 Push-ups or Wall Squats', description: 'Channel nervous or agitated dopamine cravings into muscle contraction.', icon: 'fire' },
      { id: 'cat_04', category: 'Focus & Learning', title: 'Read 5 Pages of a Book', description: 'Divert mental processing power to engaging literature or articles.', icon: 'catalog' },
      { id: 'cat_05', category: 'Relaxation', title: 'Listen to a Calming Song', description: 'Recharge sensory input with 3 minutes of lo-fi or acoustic audio.', icon: 'clock' },
      { id: 'cat_06', category: 'Mindfulness', title: 'Write 3 Gratitude Bullets', description: 'Jot down 3 quick positive thoughts in your notes to shift mood state.', icon: 'sparkles' }
    ];
  }

  /**
   * Get the full catalog.
   * @returns {Promise<Array<Object>>}
   */
  async getAll() {
    return this._catalog;
  }

  /**
   * Get catalog items filtered by category.
   * @param {string} category — category name or 'all'
   * @returns {Promise<Array<Object>>}
   */
  async getByCategory(category) {
    if (!category || category === 'all') return this._catalog;
    return this._catalog.filter(
      item => item.category.toLowerCase() === category.toLowerCase()
    );
  }
}

window.CatalogService = CatalogService;
