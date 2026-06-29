// static/ui/sourcesUi.js

export function initFiltersUI(tableData = []) {
  const sources = getUniqueValues(tableData, "source");
  const statuses = getUniqueValues(tableData, "status");
  const results = getUniqueValues(tableData, "last_result");

  fillSelect("filterSource", sources, "Tất cả Source");
  fillSelect("filterStatus", statuses, "Tất cả Status");
  fillSelect("filterResult", results, "Tất cả Result");
}

export function renderTable(tableData = []) {
  normalizeIndexedColumnHeader();

  const tbody = document.getElementById("tableBody");
  if (!tbody) return;

  if (!Array.isArray(tableData) || tableData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-8 text-center text-slate-500">
          Không có dữ liệu
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = tableData.map(renderSourceRow).join("");
}

function renderSourceRow(item) {
  return `
    <tr class="hover:bg-slate-100/50 transition">
      <td class="px-6 py-4 flex items-center gap-3">
        <img
          src="https://cdn.simpleicons.org/${escapeAttr(item.icon || "code")}"
          onerror="this.src='https://cdn.simpleicons.org/code'"
          class="w-5 h-5 object-contain drop-shadow-sm"
          alt="${escapeAttr(item.source || "-")}"
        >
        <span class="font-medium text-slate-900">
          ${escapeHtml(item.source || "-")}
        </span>
      </td>

      <td class="px-6 py-4 text-slate-600">
        ${escapeHtml(item.folder || "-")}
      </td>

      <td class="px-6 py-4">
        ${getStatusBadge(item.status)}
      </td>

      <td class="px-6 py-4 text-slate-600">
        ${escapeHtml(item.indexed ?? "0")}
      </td>

      <td class="px-6 py-4 text-slate-600">
        ${escapeHtml(item.last_sync || "-")}
      </td>

      <td class="px-6 py-4 text-slate-600">
        ${escapeHtml(item.last_result || "-")}
      </td>

      <td class="px-6 py-4 text-slate-400">
        ${renderSourceActionButtons(item)}
      </td>
    </tr>
  `;
}

function renderSourceActionButtons(item) {
  const id = Number(item.id);
  const status = String(item.status || "").toLowerCase();
  const isDisabled = status === "disable" || status === "disabled";

  if (isDisabled) {
    return `
      <button
        onclick="window.app.triggerDelete(${id})"
        class="hover:text-red-500 font-medium transition"
      >
        Delete
      </button>
    `;
  }

  return `
    <button
      onclick="window.app.triggerEdit(${id})"
      class="hover:text-blue-600 font-medium transition"
    >
      Edit
    </button>

    <span class="mx-1 text-slate-300">·</span>

    <button
      onclick="window.app.triggerStopSync(${id})"
      class="hover:text-amber-500 font-medium transition"
    >
      Disable Sync
    </button>
  `;
}

function getStatusBadge(status = "") {
  const s = String(status || "").toLowerCase();

  if (s === "active") {
    return `
      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
        <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
        Active
      </span>
    `;
  }

  if (s === "waiting") {
    return `
      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
        <span class="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>
        Waiting
      </span>
    `;
  }

  if (s === "syncing") {
    return `
      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
        <span class="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
        Syncing
      </span>
    `;
  }

  if (s === "error") {
    return `
      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 border border-rose-200">
        <span class="w-1.5 h-1.5 bg-rose-500 rounded-full mr-1.5"></span>
        Error
      </span>
    `;
  }

  if (s === "disable" || s === "disabled") {
    return `
      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
        <span class="w-1.5 h-1.5 bg-slate-400 rounded-full mr-1.5"></span>
        Disable
      </span>
    `;
  }

  return `
    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      ${escapeHtml(status || "-")}
    </span>
  `;
}

function getUniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]))].filter(Boolean).sort();
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

function normalizeIndexedColumnHeader() {
  document.querySelectorAll("th").forEach((th) => {
    const text = th.textContent.trim().toLowerCase();

    if (["index docs", "indexed docs", "indexed documents"].includes(text)) {
      th.textContent = "Số tài liệu đã index";
    }
  });
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
