/**
 * Habitizer Dashboard Controller
 * Single Responsibility: Coordinate dashboard habits rendering using HabitCardComponent.
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (window.Navbar) {
    window.Navbar.render('index');
  }

  const isLoggedIn = window.API && typeof window.API.isAuthenticated === 'function' && window.API.isAuthenticated();
  const habitsSection = document.getElementById('auth-habits-section');
  const container = document.getElementById('habits-list-container');

  if (!isLoggedIn) {
    if (habitsSection) habitsSection.classList.add('hidden-section');
    return;
  }

  if (habitsSection) habitsSection.classList.remove('hidden-section');

  try {
    const habits = await window.API.getHabits();
    renderHabits(habits);
  } catch (err) {
    console.error("Dashboard error:", err);
  }

  function renderHabits(habits) {
    if (!container) return;
    container.innerHTML = '';

    if (!habits || habits.length === 0) {
      const h3 = document.createElement('h3');
      h3.textContent = 'No Active Habits Yet';

      const p = document.createElement('p');
      p.className = 'dashboard-empty-desc';
      p.textContent = 'Start your habit substitution journey by adding your first loop.';

      const btn = document.createElement('a');
      btn.href = '/create';
      btn.className = 'btn btn-primary';
      btn.textContent = 'Create First Habit Loop';

      const emptyCard = document.createElement('div');
      emptyCard.className = 'card-static card-padded dashboard-empty-card';
      emptyCard.appendChild(h3);
      emptyCard.appendChild(p);
      emptyCard.appendChild(btn);

      container.appendChild(emptyCard);
      return;
    }

    habits.forEach(h => {
      const cardComp = new HabitCardComponent(h, {
        onDelete: async (id) => {
          await window.API.deleteHabit(id);
          const updated = await window.API.getHabits();
          renderHabits(updated);
          if (window.Toast) window.Toast.show('Habit loop removed', 'info');
        }
      });
      container.appendChild(cardComp.element);
    });

    if (window.Icons) window.Icons.renderAll();
  }
});
