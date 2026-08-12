/**
 * CatalogCardComponent — UI Component for suggested habit routine cards.
 * Single Responsibility: Build catalog routine cards with category badges and adoption trigger.
 */
class CatalogCardComponent extends UIComponent {
  /**
   * @param {Object} item - Catalog routine entity
   * @param {Object} [callbacks]
   * @param {Function} [callbacks.onAdopt]
   */
  constructor(item, callbacks = {}) {
    super();
    this.item = item;
    this.callbacks = callbacks;
    this.element = this._build();
  }

  _build() {
    const item = this.item;

    const iconSpan = this.createElement('span', {
      attrs: { 'data-icon': item.icon || 'sparkles', 'data-size': '20' }
    });
    const iconDiv = this.createElement('div', {
      className: 'catalog-card-icon',
      children: [iconSpan]
    });

    const catTag = this.createElement('span', {
      className: 'habit-category-tag',
      text: item.category
    });

    const topHeader = this.createElement('div', {
      className: 'catalog-card-header-row',
      children: [iconDiv, catTag]
    });

    const titleEl = this.createElement('div', {
      className: 'catalog-card-title',
      text: item.title
    });

    const descEl = this.createElement('div', {
      className: 'catalog-card-desc',
      text: item.description
    });

    const plusIcon = this.createElement('span', {
      attrs: { 'data-icon': 'plus', 'data-size': '14' }
    });
    const adoptBtn = this.createElement('button', {
      className: ['btn', 'btn-secondary', 'btn-sm', 'btn-adopt-routine'],
      attrs: { 'data-title': item.title },
      children: [plusIcon, document.createTextNode(' Adopt as Routine')],
      events: {
        click: () => {
          if (this.callbacks.onAdopt) {
            this.callbacks.onAdopt(item);
          } else {
            if (window.Toast) window.Toast.show(`Selected "${item.title}". Opening Habit Builder...`, 'success');
            setTimeout(() => {
              window.location.href = '/create';
            }, 500);
          }
        }
      }
    });

    const actionWrapper = this.createElement('div', {
      className: 'catalog-card-action-wrapper',
      children: [adoptBtn]
    });

    return this.createElement('div', {
      className: ['catalog-card', 'card-interactive'],
      children: [topHeader, titleEl, descEl, actionWrapper]
    });
  }
}

window.CatalogCardComponent = CatalogCardComponent;
