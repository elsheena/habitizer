/**
 * Habitizer Replacement Catalog Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (window.Sidebar) {
    Sidebar.render('catalog');
  }

  const grid = document.getElementById('catalog-grid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  let fullCatalog = [];
  let activeCategory = 'all';

  try {
    fullCatalog = await window.API.getCatalog();
    renderCatalog();
  } catch (err) {
    console.error("Error loading catalog:", err);
  }

  function renderCatalog() {
    if (!grid) return;
    const filtered = activeCategory === 'all' 
      ? fullCatalog 
      : fullCatalog.filter(item => item.category.toLowerCase() === activeCategory.toLowerCase());

    grid.innerHTML = filtered.map(item => `
      <div class="catalog-card card-interactive">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div class="catalog-card-icon">
            <span data-icon="${item.icon || 'sparkles'}" data-size="22"></span>
          </div>
          <span class="habit-category-tag">${item.category}</span>
        </div>
        <div class="catalog-card-title">${item.title}</div>
        <div class="catalog-card-desc">${item.description}</div>
        <div style="margin-top: auto; padding-top: 0.75rem;">
          <button class="btn btn-secondary btn-sm btn-adopt-routine" data-title="${item.title}" style="width: 100%;">
            <span data-icon="plus" data-size="14"></span> Adopt as Routine
          </button>
        </div>
      </div>
    `).join('');

    if (window.Icons) Icons.renderAll();

    document.querySelectorAll('.btn-adopt-routine').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const title = e.currentTarget.getAttribute('data-title');
        if (window.Toast) Toast.show(`Selected "${title}". Redirecting to Habit Builder...`, 'success');
        setTimeout(() => {
          window.location.href = `/create`;
        }, 600);
      });
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-cat');
      renderCatalog();
    });
  });
});
