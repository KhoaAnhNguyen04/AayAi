// static/ui.js

export function getStatusBadge(status) {
  const safeStatus = String(status || "-");
  const s = safeStatus.toLowerCase();

  if (s === "active") {
    return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200"><span class="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>Active</span>`;
  }

  if (s === "syncing" || s === "waiting") {
    return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200"><svg class="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>${escapeHtml(safeStatus)}</span>`;
  }

  if (s === "error") {
    return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 border border-rose-200"><span class="w-1.5 h-1.5 bg-rose-500 rounded-full mr-1.5"></span>Error</span>`;
  }

  if (s === "disable") {
    return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200"><span class="w-1.5 h-1.5 bg-slate-400 rounded-full mr-1.5"></span>Disable</span>`;
  }

  return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">${escapeHtml(safeStatus)}</span>`;
}

export function renderTable(tableData) {
  normalizeIndexedColumnHeader();

  const tbody = document.getElementById("tableBody");
  if (!tbody) return;

  if (tableData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-slate-500">Không có dữ liệu</td></tr>`;
    return;
  }

  tbody.innerHTML = tableData.map(renderSourceRow).join("");
}

export function initFiltersUI(tableData) {
  const sources = getUniqueSortedValues(tableData, "source");
  const statuses = getUniqueSortedValues(tableData, "status");
  const results = getUniqueSortedValues(tableData, "last_result");

  fillSelect("filterSource", sources, "Tất cả Source");
  fillSelect("filterStatus", statuses, "Tất cả Status");
  fillSelect("filterResult", results, "Tất cả Result");
}

function renderSourceRow(item) {
  const actionButtons = renderSourceActionButtons(item);

  return `
    <tr class="hover:bg-slate-100/50 transition">
      <td class="px-6 py-4 flex items-center gap-3">
        <img src="https://cdn.simpleicons.org/${escapeHtml(item.icon || "code")}" onerror="this.src='https://cdn.simpleicons.org/code'" class="w-5 h-5 object-contain drop-shadow-sm" alt="${escapeHtml(item.source)}">
        <span class="font-medium text-slate-900">${escapeHtml(item.source)}</span>
      </td>
      <td class="px-6 py-4 text-slate-600">${escapeHtml(item.folder)}</td>
      <td class="px-6 py-4">${getStatusBadge(item.status)}</td>
      <td class="px-6 py-4 text-slate-600">${escapeHtml(item.indexed)}</td>
      <td class="px-6 py-4 text-slate-600">${escapeHtml(item.last_sync)}</td>
      <td class="px-6 py-4 text-slate-600">${escapeHtml(item.last_result)}</td>
      <td class="px-6 py-4 text-slate-400">${actionButtons}</td>
    </tr>
  `;
}

function renderSourceActionButtons(item) {
  let buttons = `<button onclick="window.app.triggerEdit(${Number(item.id)})" class="hover:text-blue-600 font-medium transition">Edit</button>`;
  const status = String(item.status || "").toLowerCase();

  if (status === "disable") {
    buttons += `
      <span class="mx-1 text-slate-300">·</span>
      <button onclick="window.app.triggerDelete(${Number(item.id)})" class="hover:text-red-500 font-medium transition">Delete</button>
    `;
  } else if (status === "syncing") {
    buttons += `
      <span class="mx-1 text-slate-300">·</span>
      <span class="text-amber-500 font-medium">Syncing...</span>
    `;
  } else if (["active", "waiting", "error"].includes(status)) {
    buttons += `
      <span class="mx-1 text-slate-300">·</span>
      <button onclick="window.app.triggerRunSync(${Number(item.id)})" class="hover:text-blue-600 font-medium transition">Run Sync</button>
      <span class="mx-1 text-slate-300">·</span>
      <button onclick="window.app.triggerStopSync(${Number(item.id)})" class="hover:text-amber-500 font-medium transition">Disable Sync</button>
    `;
  }

  return buttons;
}

function normalizeIndexedColumnHeader() {
  document.querySelectorAll("th").forEach((th) => {
    const text = th.textContent.trim().toLowerCase();

    if (["index docs", "indexed docs", "indexed documents"].includes(text)) {
      th.textContent = "Số tài liệu đã index";
    }
  });
}

export function renderDuplicateStats(groups) {
  const totalGroupsEl = document.getElementById("duplicateTotalGroups");
  const totalFilesEl = document.getElementById("duplicateTotalFiles");
  const currentFilesEl = document.getElementById("duplicateCurrentFiles");
  const archivedFilesEl = document.getElementById("duplicateArchivedFiles");

  const totalFiles = groups.reduce(
    (total, group) => total + getDocuments(group).length,
    0,
  );

  if (totalGroupsEl) totalGroupsEl.textContent = groups.length;
  if (totalFilesEl) totalFilesEl.textContent = totalFiles;
  if (currentFilesEl)
    currentFilesEl.textContent = countCurrentDocuments(groups);
  if (archivedFilesEl)
    archivedFilesEl.textContent = countArchivedDocuments(groups);
}

export function initDuplicateFiltersUI(groups) {
  const documents = groups.flatMap((group) => getDocuments(group));

  const sources = [...new Set(documents.map((doc) => doc.source))]
    .filter(Boolean)
    .sort();

  const statuses = [...new Set(groups.map((group) => group.status))]
    .filter(Boolean)
    .sort();

  fillSelect("duplicateFilterSource", sources, "Tất cả Source");
  fillSelect("duplicateFilterStatus", statuses, "Tất cả Status");
}

export function renderDuplicateTable(groups, expandedGroupIds = new Set()) {
  const tbody = document.getElementById("duplicateTableBody");
  if (!tbody) return;

  if (groups.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-10 text-center text-slate-500">
          Không có nhóm tài liệu trùng lặp phù hợp.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = groups
    .map((group) => renderDuplicateGroupRows(group, expandedGroupIds))
    .join("");
}

function renderDuplicateGroupRows(group, expandedGroupIds) {
  const documents = getDocuments(group);
  const currentDoc = getCurrentDocument(group);
  const duplicateDocs = documents.filter((doc) => !doc.is_current);
  const activeDuplicateCount = duplicateDocs.filter(
    (doc) => doc.cleanup_status !== "ARCHIVED",
  ).length;

  const isExpanded = expandedGroupIds.has(group.group_id);
  const chevronIcon = isExpanded ? "chevron-up" : "chevron-down";

  return `
    <tr class="hover:bg-slate-50 transition">
      <td class="px-6 py-4">
        <div class="font-semibold text-slate-900">${escapeHtml(group.group_name)}</div>
        <div class="text-xs text-slate-500 mt-1">Group ID: ${escapeHtml(group.group_id)}</div>
      </td>

      <td class="px-6 py-4">
        ${renderCurrentDocumentSummary(currentDoc)}
      </td>

      <td class="px-6 py-4">
        <div class="font-semibold text-rose-600">${activeDuplicateCount} active duplicate</div>
        <div class="text-xs text-slate-500 mt-1">${duplicateDocs.length} file trùng trong nhóm</div>
      </td>

      <td class="px-6 py-4">
        <code class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
          ${escapeHtml(String(group.document_fingerprint || "").slice(0, 16))}...
        </code>
      </td>

      <td class="px-6 py-4">
        ${getDuplicateStatusBadge(group.status)}
      </td>

      <td class="px-6 py-4">
        <button
          onclick="window.duplicateApp.toggleGroup('${escapeAttr(group.group_id)}')"
          class="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <i data-lucide="${chevronIcon}" class="w-4 h-4"></i>
          Details
        </button>
      </td>
    </tr>

    ${
      isExpanded
        ? `
          <tr>
            <td colspan="6" class="px-6 py-5 bg-slate-50 border-y border-slate-100">
              ${renderDuplicateDocumentCards(group, documents)}
            </td>
          </tr>
        `
        : ""
    }
  `;
}

function renderCurrentDocumentSummary(currentDoc) {
  if (!currentDoc) return `<span class="text-slate-400">-</span>`;

  return `
    <div class="font-medium text-slate-900">${escapeHtml(currentDoc.file_name)}</div>
    <div class="text-xs text-slate-500 mt-1">
      ${escapeHtml(currentDoc.source)} · ${escapeHtml(currentDoc.location_name)}
    </div>
  `;
}

function renderDuplicateDocumentCards(group, documents) {
  return `
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      ${documents.map((doc) => renderDuplicateDocumentCard(group, doc)).join("")}
    </div>
  `;
}

function renderDuplicateDocumentCard(group, doc) {
  const isArchived = doc.cleanup_status === "ARCHIVED";

  return `
    <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <img
              src="https://cdn.simpleicons.org/${escapeHtml(doc.icon || "code")}" 
              onerror="this.src='https://cdn.simpleicons.org/code'"
              class="w-4 h-4 object-contain"
              alt="${escapeHtml(doc.source)}"
            />
            <span class="text-xs font-medium text-slate-500">${escapeHtml(doc.source)}</span>
          </div>

          <h4 class="font-semibold text-slate-900 mt-2 truncate">
            ${escapeHtml(doc.file_name)}
          </h4>

          <p class="text-xs text-slate-500 mt-1 break-all">
            ${escapeHtml(doc.file_path)}
          </p>
        </div>

        <div class="shrink-0">
          ${getCurrentBadge(doc.is_current)}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 mt-4 text-xs">
        <div>
          <div class="text-slate-400">Location</div>
          <div class="font-medium text-slate-700">${escapeHtml(doc.location_name)}</div>
        </div>

        <div>
          <div class="text-slate-400">File size</div>
          <div class="font-medium text-slate-700">${formatFileSize(doc.file_size)}</div>
        </div>

        <div>
          <div class="text-slate-400">Last sync</div>
          <div class="font-medium text-slate-700">${escapeHtml(doc.last_sync_time || "-")}</div>
        </div>

        <div>
          <div class="text-slate-400">Last embedding</div>
          <div class="font-medium text-slate-700">${escapeHtml(doc.last_embedding_at || "-")}</div>
        </div>

        <div>
          <div class="text-slate-400">Access count</div>
          <div class="font-medium text-slate-700">${escapeHtml(doc.access_count ?? 0)}</div>
        </div>

        <div>
          <div class="text-slate-400">Cleanup</div>
          <div class="font-medium text-slate-700">${getCleanupBadge(doc.cleanup_status)}</div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 mt-4">
        ${getMetadataBadge(doc.metadata_match)}
        ${
          doc.is_protected
            ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-100">Protected</span>`
            : ""
        }
      </div>

      <div class="mt-4 text-xs text-slate-500">
        ${escapeHtml(doc.metadata_summary || "")}
      </div>

      <div class="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
        ${renderDuplicateDocumentActions(group, doc, isArchived)}
      </div>
    </div>
  `;
}

function renderDuplicateDocumentActions(group, doc, isArchived) {
  const groupId = escapeAttr(group.group_id);
  const docId = Number(doc.document_id);

  if (doc.is_current) {
    return `<span class="text-xs text-slate-400">File này đang được giữ trong Knowledge Base.</span>`;
  }

  if (isArchived) {
    return `
      <button
        onclick="window.duplicateApp.restoreDocument('${groupId}', ${docId})"
        class="text-xs font-medium text-emerald-600 hover:text-emerald-700"
      >
        Restore
      </button>
    `;
  }

  return `
    <button
      onclick="window.duplicateApp.markAsCurrent('${groupId}', ${docId})"
      class="text-xs font-medium text-blue-600 hover:text-blue-700"
    >
      Mark as Current
    </button>

    <button
      onclick="window.duplicateApp.archiveDocument('${groupId}', ${docId})"
      class="text-xs font-medium text-rose-600 hover:text-rose-700"
    >
      Archive
    </button>
  `;
}

function getDuplicateStatusBadge(status) {
  const safeStatus = String(status || "-");
  const s = safeStatus.toLowerCase();

  if (s === "duplicate") {
    return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 border border-rose-200"><span class="w-1.5 h-1.5 bg-rose-500 rounded-full mr-1.5"></span>Duplicate</span>`;
  }

  if (s === "versioned") {
    return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200"><span class="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>Versioned</span>`;
  }

  if (s === "resolved") {
    return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200"><span class="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>Resolved</span>`;
  }

  return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">${escapeHtml(safeStatus)}</span>`;
}

function getCleanupBadge(status) {
  const s = String(status || "ACTIVE").toLowerCase();

  if (s === "archived") {
    return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">Archived</span>`;
  }

  return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">Active</span>`;
}

function getCurrentBadge(isCurrent) {
  if (isCurrent) {
    return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700 border border-blue-200">Current / đang giữ</span>`;
  }

  return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-100">Duplicate</span>`;
}

function getMetadataBadge(isMatch) {
  if (isMatch === false) {
    return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-100">Metadata khác</span>`;
  }

  return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">Metadata match</span>`;
}

function getDocuments(group) {
  return Array.isArray(group.documents) ? group.documents : [];
}

function getCurrentDocument(group) {
  const documents = getDocuments(group);

  return (
    documents.find((doc) => doc.is_current) ||
    documents.find((doc) => doc.is_duplicate === false) ||
    documents[0] ||
    null
  );
}

function countArchivedDocuments(groups) {
  return groups.reduce((total, group) => {
    return (
      total +
      getDocuments(group).filter((doc) => doc.cleanup_status === "ARCHIVED")
        .length
    );
  }, 0);
}

function countCurrentDocuments(groups) {
  return groups.reduce((total, group) => {
    return total + (getCurrentDocument(group) ? 1 : 0);
  }, 0);
}

function getUniqueSortedValues(items, field) {
  return [...new Set(items.map((item) => item[field]))].filter(Boolean).sort();
}

function fillSelect(id, options, defaultText) {
  const select = document.getElementById(id);
  if (!select) return;

  const currentVal = select.value;

  select.innerHTML =
    `<option value="">${defaultText}</option>` +
    options
      .map((opt) => {
        const selected = opt === currentVal ? "selected" : "";
        return `<option value="${escapeAttr(opt)}" ${selected}>${escapeHtml(opt)}</option>`;
      })
      .join("");
}

function formatFileSize(bytes) {
  const size = Number(bytes) || 0;

  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${size} B`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
