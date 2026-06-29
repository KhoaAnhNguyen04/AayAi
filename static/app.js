// static/app.js
import { initSourcesPage } from "./pages/sourcesPage.js";

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (document.getElementById("tableBody")) {
    await initSourcesPage({ refreshIcons });
  }

  refreshIcons();
});
