// Suggested Healthy Replacement Catalog Page Controller

import { store } from "../state.js";
import { showToast } from "../toast.js";

export function initCatalogPage() {
  renderCatalog();
}

export function renderCatalog() {
  const grid = document.getElementById("catalog-grid");
  if (!grid) return;
  grid.innerHTML = "";

  const suggestions = store.getState().suggestions;
  suggestions.forEach(s => {
    const card = document.createElement("div");
    card.className = "habit-card";
    card.innerHTML = `
      <div class="habit-header">
        <div class="bad-habit-title">${escapeHtml(s.title)}</div>
        <span class="freq-tag">${escapeHtml(s.category)}</span>
      </div>
      <p style="font-size:0.88rem;color:var(--text-secondary)">${escapeHtml(s.description)}</p>
      <button class="btn-secondary" style="margin-top:auto" data-title="${escapeHtml(s.title)}">Use as Replacement Routine</button>
    `;

    card.querySelector("button").addEventListener("click", () => {
      const title = s.title;
      const inputRepl = document.getElementById("input-replacement");
      if (inputRepl) inputRepl.value = title;

      const createTabBtn = document.querySelector('[data-tab="create"]');
      if (createTabBtn) createTabBtn.click();

      showToast(`Selected '${title}' for habit creation!`, "info");
    });

    grid.appendChild(card);
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
