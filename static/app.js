// static/app.js
import { initSourcesPage } from "./pages/sourcesPage.js";
import { initConfigurationPage } from "./pages/configurationsPage.js";
import { initDuplicatesPage } from "./pages/duplicatesPage.js";

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (document.getElementById("tableBody")) {
    await initSourcesPage({ refreshIcons });
  }

  if (document.getElementById("configurationTableBody")) {
    await initConfigurationPage({ refreshIcons });
  }

  if (document.getElementById("duplicateTableBody")) {
    await initDuplicatesPage({ refreshIcons });
  }

  refreshIcons();
});
