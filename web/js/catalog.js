/**
 * Habitizer Replacement Catalog Controller
 * Single Responsibility: Manage catalog routine filtering and render CatalogCardComponents using DOM APIs.
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (window.Navbar) {
    window.Navbar.render('catalog');
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
    grid.textContent = '';

    const filtered = activeCategory === 'all'
      ? fullCatalog
      : fullCatalog.filter(item => item.category.toLowerCase() === activeCategory.toLowerCase());

    filtered.forEach(item => {
      const cardComp = new CatalogCardComponent(item, {
        onAdopt: (selectedItem) => {
          if (window.Toast) {
            window.Toast.show(`Selected "${selectedItem.title}". Redirecting to Habit Builder...`, 'success');
          }
          setTimeout(() => {
            window.location.href = '/create';
          }, 500);
        }
      });
      grid.appendChild(cardComp.element);
    });

    if (window.Icons) window.Icons.renderAll();
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
