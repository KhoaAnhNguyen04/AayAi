// static/pages/sourcesPage.js
import { fetchSources, saveSources } from "../api.js";
import { renderTable, initFiltersUI } from "../ui/sourcesUi.js";
import { DeleteModal, EditModal, StopSyncModal } from "../modal.js";

let tableData = [];
let refreshIcons = () => {};

export async function initSourcesPage(options = {}) {
  refreshIcons = options.refreshIcons || refreshIcons;

  tableData = await fetchSources();

  initFiltersUI(tableData);
  bindSourceEvents();
  exposeSourceActions();
  updateView();
}

function bindSourceEvents() {
  document.getElementById("searchInput")?.addEventListener("input", updateView);
  document
    .getElementById("filterSource")
    ?.addEventListener("change", updateView);
  document
    .getElementById("filterStatus")
    ?.addEventListener("change", updateView);
  document
    .getElementById("filterResult")
    ?.addEventListener("change", updateView);
}

function updateView() {
  const searchVal = getInputValue("searchInput").toLowerCase();
  const sourceVal = getInputValue("filterSource");
  const statusVal = getInputValue("filterStatus");
  const resultVal = getInputValue("filterResult");

  const processedData = tableData
    .filter((item) => {
      const folder = String(item.folder || "").toLowerCase();

      const matchSearch = folder.includes(searchVal);
      const matchSource = !sourceVal || item.source === sourceVal;
      const matchStatus = !statusVal || item.status === statusVal;
      const matchResult = !resultVal || item.last_result === resultVal;

      return matchSearch && matchSource && matchStatus && matchResult;
    })
    .sort((a, b) => {
      const sourceCompare = String(a.source || "").localeCompare(
        String(b.source || ""),
      );

      if (sourceCompare !== 0) return sourceCompare;

      return String(a.folder || "").localeCompare(String(b.folder || ""));
    });

  renderTable(processedData);
  refreshIcons();
}

function getInputValue(id) {
  return document.getElementById(id)?.value || "";
}

function normalizeUrl(url) {
  let normalizedUrl = String(url || "")
    .trim()
    .toLowerCase();

  if (normalizedUrl.endsWith("/")) {
    normalizedUrl = normalizedUrl.slice(0, -1);
  }

  return normalizedUrl;
}

function parseKnowledgeSourceUrl(urlStr) {
  const lower = urlStr.toLowerCase();

  if (lower.includes("drive.google.com")) {
    const match = urlStr.match(/folders\/([a-zA-Z0-9-_]+)/);

    return {
      source: "Google Drive",
      folder: match?.[1]
        ? `GDrive_${match[1].substring(0, 8)}`
        : "Google Drive Folder",
      icon: "googledrive",
    };
  }

  if (lower.includes("atlassian.net/wiki") || lower.includes("confluence")) {
    const match = urlStr.match(/spaces\/([a-zA-Z0-9-_%]+)/);

    return {
      source: "Confluence",
      folder: match?.[1] ? decodeURIComponent(match[1]) : "Confluence Space",
      icon: "confluence",
    };
  }

  if (lower.includes("sharepoint.com")) {
    const match = urlStr.match(/sites\/([a-zA-Z0-9-_%]+)/);

    return {
      source: "SharePoint",
      folder: match?.[1]
        ? `${decodeURIComponent(match[1])} Docs`
        : "SharePoint Site",
      icon: "microsoftsharepoint",
    };
  }

  if (lower.includes("github.com")) {
    const parts = lower.split("/").filter(Boolean);

    return {
      source: "GitHub",
      folder: parts.length > 2 ? parts[parts.length - 1] : "GitHub Repo",
      icon: "github",
    };
  }

  return null;
}

function showInlineAddError(message) {
  const errorContainer = document.getElementById("inlineAddError");
  const errorText = document.getElementById("inlineErrorText");

  if (errorText) errorText.textContent = message;
  if (errorContainer) errorContainer.classList.remove("hidden");
}

function hideInlineAddError() {
  document.getElementById("inlineAddError")?.classList.add("hidden");
}

async function persistSources() {
  await saveSources(tableData);
  initFiltersUI(tableData);
  updateView();
}

function isDisabledStatus(status) {
  const normalizedStatus = String(status || "").toLowerCase();
  return normalizedStatus === "disable" || normalizedStatus === "disabled";
}

function exposeSourceActions() {
  window.app = {
    toggleInlineAdd() {
      document.getElementById("inlineAddTriggerRow")?.classList.add("hidden");
      document.getElementById("inlineAddInputRow")?.classList.remove("hidden");
      document.getElementById("inlineUrlInput")?.focus();
      hideInlineAddError();
    },

    cancelInlineAdd() {
      document
        .getElementById("inlineAddTriggerRow")
        ?.classList.remove("hidden");
      document.getElementById("inlineAddInputRow")?.classList.add("hidden");

      const input = document.getElementById("inlineUrlInput");
      if (input) input.value = "";

      hideInlineAddError();
    },

    async confirmInlineAdd() {
      const urlInput =
        document.getElementById("inlineUrlInput")?.value.trim() || "";

      if (!urlInput) {
        showInlineAddError("Vui lòng nhập đường dẫn URL.");
        return;
      }

      const parsedData = parseKnowledgeSourceUrl(urlInput);

      if (!parsedData) {
        showInlineAddError(
          "URL không thuộc loại hệ thống hỗ trợ: Google Drive, Confluence, GitHub, SharePoint.",
        );
        return;
      }

      const newNorm = normalizeUrl(urlInput);

      for (const item of tableData) {
        if (!item.url) continue;

        const existingNorm = normalizeUrl(item.url);

        if (newNorm === existingNorm) {
          showInlineAddError("Đường dẫn URL này đã tồn tại trên hệ thống.");
          return;
        }

        if (newNorm.startsWith(existingNorm + "/")) {
          showInlineAddError(
            `URL này trùng chéo vì là thư mục con của nguồn: ${item.source} (${item.folder}).`,
          );
          return;
        }

        if (existingNorm.startsWith(newNorm + "/")) {
          showInlineAddError(
            `URL này trùng chéo vì là thư mục cha của nguồn đã tạo: ${item.source} (${item.folder}).`,
          );
          return;
        }
      }

      tableData.push({
        id: Date.now(),
        url: urlInput,
        source: parsedData.source,
        folder: parsedData.folder,
        icon: parsedData.icon,
        status: "Waiting",
        indexed: "0",
        last_sync: "-",
        last_result: "Pending",
      });

      await persistSources();
      this.cancelInlineAdd();
    },

    triggerEdit(id) {
      const item = tableData.find((i) => Number(i.id) === Number(id));
      if (item) EditModal.show(item);
    },

    hideEditModal() {
      EditModal.hide();
    },

    async confirmEdit() {
      const targetId = EditModal.getId();
      const newFolder = EditModal.getInputValue();

      if (targetId === null || !newFolder?.trim()) return;

      const item = tableData.find((i) => Number(i.id) === Number(targetId));
      if (!item) return;

      item.folder = newFolder.trim();

      await persistSources();
      EditModal.hide();
    },

    triggerStopSync(id) {
      const item = tableData.find((i) => Number(i.id) === Number(id));

      if (!item) return;

      if (isDisabledStatus(item.status)) {
        alert("Source này đã Disable rồi.");
        return;
      }

      StopSyncModal.show(item);
    },

    hideStopSyncModal() {
      StopSyncModal.hide();
    },

    async confirmStopSync() {
      const targetId = StopSyncModal.getId();
      if (targetId === null) return;

      const item = tableData.find((i) => Number(i.id) === Number(targetId));
      if (!item) return;

      item.status = "Disable";
      item.last_result = "Stopped";

      await persistSources();
      StopSyncModal.hide();
    },

    triggerDelete(id) {
      const item = tableData.find((i) => Number(i.id) === Number(id));

      if (item && !isDisabledStatus(item.status)) {
        alert("Chỉ có thể xoá source đang ở trạng thái Disable.");
        return;
      }

      DeleteModal.show(item);
    },

    hideDeleteModal() {
      DeleteModal.hide();
    },

    async confirmDelete() {
      const targetId = DeleteModal.getId();
      if (targetId === null) return;

      tableData = tableData.filter(
        (item) => Number(item.id) !== Number(targetId),
      );

      await persistSources();
      DeleteModal.hide();
    },
  };
}
