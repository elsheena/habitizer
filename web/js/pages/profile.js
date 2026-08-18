// Profile Analytics Page Controller

import { store } from "../state.js";
import { showToast } from "../toast.js";

export function initProfilePage() {
  setupProfileActions();
}

function setupProfileActions() {
  const upgradeBtn = document.getElementById("btn-profile-upgrade");
  if (upgradeBtn) {
    upgradeBtn.addEventListener("click", () => {
      store.setUserTier("premium");
      showToast("Upgraded to Premium Tier! Unlimited habit creation unlocked.", "success");
    });
  }
}
