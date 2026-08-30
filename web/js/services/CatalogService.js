/**
 * CatalogService — Catalog Client for Go Habit-Service.
 * Single Responsibility: Retrieve evidence-based routine substitution suggestions from Go backend.
 */
class CatalogService {
  constructor() {
    this._baseUrl = window.location.origin.includes(':8000') ? '' : 'http://localhost:8000';
  }

  async getAll() {
    try {
      const res = await fetch(`${this._baseUrl}/api/v1/habits/suggestions`);
      if (res.ok) {
        const body = await res.json();
        return body.data || body || [];
      }
    } catch (err) {
      console.warn('Backend habit-service unreachable, loading static defaults:', err);
    }

    return CatalogService._defaults();
  }

  static _defaults() {
    return [
      { id: 'cat_01', category: 'Health', title: '5-Minute Box Breathing', description: 'Deep cyclic box breathing to reset cortisol and curb sudden anxiety or smoking urges.', icon: 'sparkles' },
      { id: 'cat_02', category: 'Health', title: 'Glass of Cold Water with Lemon', description: 'Immediate sensory replacement to interrupt mindless eating, snacking, and soda triggers.', icon: 'water' },
      { id: 'cat_03', category: 'Focus', title: '2-Minute Desk Stretch & Walk', description: 'Brief physical movement break to relieve mental fatigue and resist social media scrolling.', icon: 'run' },
      { id: 'cat_04', category: 'Focus', title: 'Write 3 Gratitude Notes', description: 'Dopamine-replacing journaling exercise when feeling overwhelmed, cynical, or unmotivated.', icon: 'pencil' },
      { id: 'cat_05', category: 'Mindset', title: '10 Pushups or Air Squats', description: 'High-intensity physical exertion burst to burn off acute frustration and restless agitation.', icon: 'zap' },
      { id: 'cat_06', category: 'Mindset', title: 'Read 2 Pages of a Non-Fiction Book', description: 'Productive mental stimulation routine to replace late-night doom-scrolling before sleep.', icon: 'book' }
    ];
  }
}

window.CatalogService = CatalogService;
