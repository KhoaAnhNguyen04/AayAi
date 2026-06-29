// static/pages/duplicatesPage.js
import { fetchDuplicateGroups, saveDuplicateGroups } from "../api.js";
import {
  initDuplicateFiltersUI,
  renderDuplicateStats,
  renderDuplicateTable,
} from "../ui.js";

let duplicateGroups = [];
let expandedDuplicateGroups = new Set();
let refreshIcons = () => {};

export async function initDuplicatesPage(options = {}) {
  refreshIcons = options.refreshIcons || refreshIcons;

  duplicateGroups = await fetchDuplicateGroups();
  initDuplicateFiltersUI(duplicateGroups);
  bindDuplicateEvents();
  exposeDuplicateActions();
  updateDuplicateView();
}

function bindDuplicateEvents() {
  document
    .getElementById("duplicateSearchInput")
    ?.addEventListener("input", updateDuplicateView);

  document
    .getElementById("duplicateFilterSource")
    ?.addEventListener("change", updateDuplicateView);

  document
    .getElementById("duplicateFilterStatus")
    ?.addEventListener("change", updateDuplicateView);
}

function updateDuplicateView() {
  const searchVal = normalizeText(
    document.getElementById("duplicateSearchInput")?.value,
  );

  const sourceVal =
    document.getElementById("duplicateFilterSource")?.value || "";

  const statusVal =
    document.getElementById("duplicateFilterStatus")?.value || "";

  const processedGroups = duplicateGroups
    .filter((group) => {
      const documents = getGroupDocuments(group);

      const matchSearch =
        !searchVal ||
        normalizeText(group.group_name).includes(searchVal) ||
        normalizeText(group.document_fingerprint).includes(searchVal) ||
        documents.some((doc) => {
          return [
            doc.file_name,
            doc.file_path,
            doc.location_name,
            doc.repository,
            doc.branch,
            doc.source,
          ]
            .map(normalizeText)
            .some((text) => text.includes(searchVal));
        });

      const matchSource =
        !sourceVal || documents.some((doc) => doc.source === sourceVal);

      const matchStatus = !statusVal || group.status === statusVal;

      return matchSearch && matchSource && matchStatus;
    })
    .sort((a, b) => {
      const activeA = countActiveDuplicates(a);
      const activeB = countActiveDuplicates(b);

      if (activeA !== activeB) return activeB - activeA;

      return String(a.group_name || "").localeCompare(
        String(b.group_name || ""),
      );
    });

  renderDuplicateStats(processedGroups);
  renderDuplicateTable(processedGroups, expandedDuplicateGroups);
  refreshIcons();
}

function normalizeText(value) {
  return String(value || "").toLowerCase();
}

function getGroupDocuments(group) {
  return Array.isArray(group.documents) ? group.documents : [];
}

function getCurrentDocument(group) {
  const documents = getGroupDocuments(group);

  return (
    documents.find((doc) => doc.is_current) ||
    documents.find((doc) => doc.is_duplicate === false) ||
    documents[0] ||
    null
  );
}

function countActiveDuplicates(group) {
  return getGroupDocuments(group).filter((doc) => {
    return !doc.is_current && doc.cleanup_status !== "ARCHIVED";
  }).length;
}

function refreshDuplicateGroup(group) {
  const documents = getGroupDocuments(group);
  const currentDoc = getCurrentDocument(group);
  const activeDuplicateCount = countActiveDuplicates(group);

  group.current_file_name = currentDoc ? currentDoc.file_name : "-";
  group.duplicate_count = documents.filter((doc) => !doc.is_current).length;

  if (activeDuplicateCount === 0) {
    group.status = "Resolved";
  } else if (documents.some((doc) => doc.metadata_match === false)) {
    group.status = "Versioned";
  } else {
    group.status = "Duplicate";
  }
}

async function persistDuplicateGroups() {
  duplicateGroups.forEach(refreshDuplicateGroup);

  await saveDuplicateGroups(duplicateGroups);
  initDuplicateFiltersUI(duplicateGroups);
  updateDuplicateView();
}

function exposeDuplicateActions() {
  window.duplicateApp = {
    toggleGroup(groupId) {
      if (expandedDuplicateGroups.has(groupId)) {
        expandedDuplicateGroups.delete(groupId);
      } else {
        expandedDuplicateGroups.add(groupId);
      }

      updateDuplicateView();
    },

    async markAsCurrent(groupId, documentId) {
      const group = duplicateGroups.find((item) => item.group_id === groupId);
      if (!group) return;

      getGroupDocuments(group).forEach((doc) => {
        const isTarget = Number(doc.document_id) === Number(documentId);

        doc.is_current = isTarget;
        doc.is_duplicate = !isTarget;

        if (isTarget) {
          doc.cleanup_status = "ACTIVE";
        }
      });

      await persistDuplicateGroups();
    },

    async archiveDocument(groupId, documentId) {
      const group = duplicateGroups.find((item) => item.group_id === groupId);
      if (!group) return;

      const doc = getGroupDocuments(group).find(
        (item) => Number(item.document_id) === Number(documentId),
      );

      if (!doc) return;

      if (doc.is_current) {
        alert("Không thể archive file đang được giữ.");
        return;
      }

      if (doc.is_protected) {
        alert("File này đang được bảo vệ nên không thể archive.");
        return;
      }

      doc.cleanup_status = "ARCHIVED";

      await persistDuplicateGroups();
    },

    async restoreDocument(groupId, documentId) {
      const group = duplicateGroups.find((item) => item.group_id === groupId);
      if (!group) return;

      const doc = getGroupDocuments(group).find(
        (item) => Number(item.document_id) === Number(documentId),
      );

      if (!doc) return;

      doc.cleanup_status = "ACTIVE";

      await persistDuplicateGroups();
    },
  };
}
