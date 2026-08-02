// About & FAQ Page Controller (Marketing Hero, Quotes, Pricing, Accordions)

import { store } from "../state.js";
import { showToast } from "../toast.js";

export function initAboutPage() {
  setupFaqAccordion();
  setupPricingUpgradeBtn();
}

function setupFaqAccordion() {
  const faqHeaders = document.querySelectorAll(".faq-header");
  faqHeaders.forEach(header => {
    header.addEventListener("click", () => {
      const card = header.closest(".faq-card");
      if (card) card.classList.toggle("open");
    });
  });
}

function setupPricingUpgradeBtn() {
  const btn = document.getElementById("btn-pricing-upgrade");
  if (btn) {
    btn.addEventListener("click", () => {
      store.setUserTier("premium");
      showToast("Upgraded to Premium Tier! Unlimited habit creation unlocked.", "success");
    });
  }
}
