// static/ui/configurationsUi.js

export function renderConfigurationSourceFilter(syncConfigs = []) {
  const select = document.getElementById("configFilterSource");
  if (!select) return;

  const currentValue = select.value;

  const options = syncConfigs
    .map((item) => ({
      source_id: item.source_id,
      label: `${item.source || "-"} / ${item.folder || "-"}`,
    }))
    .filter((item) => item.source_id !== undefined && item.source_id !== null)
    .sort((a, b) => a.label.localeCompare(b.label));

  select.innerHTML =
    `<option value="">Tất cả Source</option>` +
    options
      .map(
        (item) =>
          `<option value="${escapeAttr(item.source_id)}" ${
            String(item.source_id) === String(currentValue) ? "selected" : ""
          }>${escapeHtml(item.label)}</option>`,
      )
      .join("");
}

export function renderConfigurationTable(data = []) {
  const tbody = document.getElementById("configurationTableBody");
  if (!tbody) return;

  if (!Array.isArray(data) || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-slate-500">
          Không có cấu hình đồng bộ.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.map(renderConfigurationRow).join("");
}

function renderConfigurationRow(item) {
  const sourceId = Number(item.source_id);
  const enabled = Boolean(item.sync_enabled);

  return `
    <tr class="hover:bg-slate-100/50 transition">
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <img
            src="https://cdn.simpleicons.org/${escapeAttr(item.icon || "code")}"
            onerror="this.src='https://cdn.simpleicons.org/code'"
            class="w-5 h-5 object-contain"
            alt="${escapeAttr(item.source || "-")}"
          >
          <div>
            <div class="font-medium text-slate-900">
              ${escapeHtml(item.source || "-")}
            </div>
            <div class="text-xs text-slate-400">
              ${escapeHtml(item.folder || "-")}
            </div>
          </div>
        </div>
      </td>

      <td class="px-6 py-4">
        ${getSyncStatusBadge(enabled)}
      </td>

      <td class="px-6 py-4">
        <div class="flex items-center gap-2">
          <input
            id="intervalValue-${sourceId}"
            type="number"
            min="1"
            value="${Number(item.interval_value) || 1}"
            class="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >

          <select
            id="intervalUnit-${sourceId}"
            class="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            ${renderUnitOptions(item.interval_unit)}
          </select>
        </div>

        <p class="text-xs text-slate-400 mt-1">
          ${getIntervalLabel(item)}
        </p>
      </td>

      <td class="px-6 py-4 text-slate-600">
        ${getNextRunLabel(item)}
      </td>

      <td class="px-6 py-4 text-slate-600">
        ${escapeHtml(item.updated_at || "-")}
      </td>

      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <button
            onclick="window.configurationApp.toggleEnabled(${sourceId})"
            class="text-sm font-medium ${
              enabled
                ? "text-slate-500 hover:text-amber-600"
                : "text-emerald-600 hover:text-emerald-700"
            }"
          >
            ${enabled ? "Pause" : "Enable"}
          </button>

          <button
            onclick="window.configurationApp.saveConfig(${sourceId})"
            class="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Save
          </button>
        </div>
      </td>
    </tr>
  `;
}

function renderUnitOptions(selectedUnit) {
  const units = [
    { value: "minutes", label: "Minutes" },
    { value: "hours", label: "Hours" },
    { value: "days", label: "Days" },
  ];

  return units
    .map(
      (unit) =>
        `<option value="${unit.value}" ${
          unit.value === selectedUnit ? "selected" : ""
        }>${unit.label}</option>`,
    )
    .join("");
}

function getSyncStatusBadge(enabled) {
  if (enabled) {
    return `
      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
        <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
        Enabled
      </span>
    `;
  }

  return `
    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
      <span class="w-1.5 h-1.5 bg-slate-400 rounded-full mr-1.5"></span>
      Paused
    </span>
  `;
}

function getIntervalLabel(item) {
  const value = Number(item.interval_value) || 1;
  const unit = item.interval_unit || "hours";

  const unitLabel =
    {
      minutes: "phút",
      hours: "giờ",
      days: "ngày",
    }[unit] || "giờ";

  return `Hệ thống tự chạy mỗi ${value} ${unitLabel}.`;
}

function getNextRunLabel(item) {
  if (!item.sync_enabled) return "-";

  const nextRun = calculateNextRun(item);
  if (!nextRun) return "Chưa xác định";

  return nextRun.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function calculateNextRun(item) {
  const minutes = getIntervalMinutes(item);
  if (!minutes) return null;

  const base = item.last_run_at ? new Date(item.last_run_at) : new Date();

  if (Number.isNaN(base.getTime())) return null;

  return new Date(base.getTime() + minutes * 60 * 1000);
}

function getIntervalMinutes(item) {
  const value = Number(item.interval_value);
  const unit = item.interval_unit;

  if (!value || value < 1) return null;

  if (unit === "minutes") return value;
  if (unit === "hours") return value * 60;
  if (unit === "days") return value * 24 * 60;

  return null;
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
