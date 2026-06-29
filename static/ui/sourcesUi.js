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

  const dataRows =
    Array.isArray(tableData) && tableData.length > 0
      ? tableData.map(renderSourceRow).join("")
      : `
        <tr>
          <td colspan="7" class="px-6 py-8 text-center text-slate-500">
            Không có dữ liệu
          </td>
        </tr>
      `;

  tbody.innerHTML = dataRows + renderInlineAddRows();
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

function renderInlineAddRows() {
  return `
    <tr id="inlineAddTriggerRow" class="bg-slate-50/60">
      <td colspan="7" class="px-6 py-4">
        <button
          onclick="window.app.toggleInlineAdd()"
          class="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <i data-lucide="plus" class="w-4 h-4"></i>
          Add Knowledge Source
        </button>
      </td>
    </tr>

    <tr id="inlineAddInputRow" class="hidden bg-slate-50/60">
      <td colspan="7" class="px-6 py-4">
        <div class="flex flex-col gap-3">
          <div class="flex flex-col md:flex-row gap-3">
            <input
              id="inlineUrlInput"
              type="text"
              placeholder="Paste source URL: Google Drive, Confluence, GitHub, SharePoint..."
              class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >

            <div class="flex gap-2">
              <button
                onclick="window.app.confirmInlineAdd()"
                class="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Add
              </button>

              <button
                onclick="window.app.cancelInlineAdd()"
                class="px-4 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>

          <div
            id="inlineAddError"
            class="hidden px-3 py-2 text-sm rounded-lg bg-red-50 text-red-700 border border-red-100"
          >
            <span id="inlineErrorText"></span>
          </div>
        </div>
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
