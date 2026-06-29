// static/app.js
import { initSourcesPage } from "./pages/sourcesPage.js";
import { initDuplicatesPage } from "./pages/duplicatesPage.js";

function refreshIcons() {
  setTimeout(() => {
    if (window.lucide) window.lucide.createIcons();
  }, 0);
}

async function initApp() {
  if (document.getElementById("duplicateTableBody")) {
    await initDuplicatesPage({ refreshIcons });
    return;
  }

  if (document.getElementById("tableBody")) {
    await initSourcesPage({ refreshIcons });
  }
}

document.addEventListener("DOMContentLoaded", initApp);
