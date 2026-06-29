// static/api.js

const STORAGE_KEYS = {
  sources: "knowledge_admin_sources",
  duplicateGroups: "knowledge_admin_duplicate_groups",
  sourceSyncConfigs: "knowledge_admin_source_sync_configs",
};

function getDataJsonUrl() {
  return new URL("../data.json", import.meta.url).href;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return await res.json();
}

function readLocalStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Không đọc được localStorage:", error);
    return null;
  }
}

function writeLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Không ghi được localStorage:", error);
  }
}

async function fetchStaticData() {
  const raw = await fetchJson(getDataJsonUrl(), {
    cache: "no-store",
  });

  return normalizeDataShape(raw);
}

function normalizeDataShape(raw) {
  if (Array.isArray(raw)) {
    return {
      sources: raw,
      duplicate_groups: [],
      source_sync_configs: [],
    };
  }

  return {
    sources: raw?.sources || raw?.data_sources || [],
    duplicate_groups: raw?.duplicate_groups || raw?.duplicates || [],
    source_sync_configs:
      raw?.source_sync_configs ||
      raw?.sync_configs ||
      raw?.configurations ||
      [],
  };
}

function normalizeSources(sources = []) {
  return sources.map((source, index) => {
    const id = source.id ?? source.source_id ?? source.sourceId ?? index + 1;

    return {
      ...source,
      id,
      source_id: source.source_id ?? id,
      source: source.source || source.name || "-",
      folder: source.folder || source.folder_name || "-",
      icon: source.icon || "code",
      status: source.status || "Active",
    };
  });
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.toLowerCase();

    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  if (value === 1) return true;
  if (value === 0) return false;

  return fallback;
}

function isDisabledStatus(status) {
  const normalized = String(status || "").toLowerCase();
  return normalized === "disable" || normalized === "disabled";
}

function getSourceId(source) {
  return source.id ?? source.source_id ?? source.sourceId;
}

function getConfigSourceId(config) {
  return config.source_id ?? config.sourceId ?? config.id;
}

function normalizeSourceSyncConfigs(rawConfigs = [], sources = []) {
  const normalizedSources = normalizeSources(sources);
  const configMap = new Map();

  rawConfigs.forEach((config) => {
    const sourceId = getConfigSourceId(config);

    if (sourceId !== undefined && sourceId !== null) {
      configMap.set(String(sourceId), config);
    }
  });

  const mergedBySource = normalizedSources.map((source) => {
    const sourceId = getSourceId(source);
    const config = configMap.get(String(sourceId)) || {};
    const sourceStatus = source.status || config.source_status || "Active";
    const defaultEnabled = !isDisabledStatus(sourceStatus);

    return {
      source_id: sourceId,
      source: config.source || source.source || "-",
      folder: config.folder || source.folder || "-",
      icon: config.icon || source.icon || "code",
      source_status: sourceStatus,
      sync_enabled: toBoolean(
        config.sync_enabled ?? config.enabled,
        defaultEnabled,
      ),
      interval_value:
        Number(
          config.interval_value ??
            config.sync_interval_value ??
            config.interval ??
            6,
        ) || 6,
      interval_unit:
        config.interval_unit ?? config.sync_interval_unit ?? "hours",
      last_run_at:
        config.last_run_at ??
        config.last_sync_at ??
        source.last_run_at ??
        source.last_sync_at ??
        source.last_sync ??
        null,
      updated_at: config.updated_at || "-",
    };
  });

  const knownSourceIds = new Set(
    mergedBySource.map((item) => String(item.source_id)),
  );

  const orphanConfigs = rawConfigs
    .filter((config) => {
      const sourceId = getConfigSourceId(config);
      return sourceId !== undefined && !knownSourceIds.has(String(sourceId));
    })
    .map((config) => ({
      source_id: getConfigSourceId(config),
      source: config.source || "-",
      folder: config.folder || "-",
      icon: config.icon || "code",
      source_status: config.source_status || "-",
      sync_enabled: toBoolean(config.sync_enabled ?? config.enabled, true),
      interval_value: Number(config.interval_value ?? 6) || 6,
      interval_unit: config.interval_unit || "hours",
      last_run_at: config.last_run_at || null,
      updated_at: config.updated_at || "-",
    }));

  return [...mergedBySource, ...orphanConfigs];
}

export async function fetchSources() {
  const localData = readLocalStorage(STORAGE_KEYS.sources);

  if (Array.isArray(localData)) {
    return normalizeSources(localData);
  }

  try {
    const apiData = await fetchJson("/api/sources");
    return normalizeSources(apiData);
  } catch (_) {
    try {
      const staticData = await fetchStaticData();
      return normalizeSources(staticData.sources);
    } catch (error) {
      console.error("Lỗi khi tải sources:", error);
      return [];
    }
  }
}

export async function saveSources(data) {
  writeLocalStorage(STORAGE_KEYS.sources, data);

  try {
    return await fetchJson("/api/sources", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch (_) {
    return {
      status: "saved-local",
      count: data.length,
    };
  }
}

export async function fetchSourceSyncConfigs() {
  const sources = await fetchSources();

  const localData = readLocalStorage(STORAGE_KEYS.sourceSyncConfigs);

  if (Array.isArray(localData)) {
    return normalizeSourceSyncConfigs(localData, sources);
  }

  try {
    const apiData = await fetchJson("/api/source-sync-configs");
    return normalizeSourceSyncConfigs(apiData, sources);
  } catch (_) {
    try {
      const staticData = await fetchStaticData();
      const baseSources = sources.length > 0 ? sources : staticData.sources;

      return normalizeSourceSyncConfigs(
        staticData.source_sync_configs,
        baseSources,
      );
    } catch (error) {
      console.error("Lỗi khi tải source sync configs:", error);
      return normalizeSourceSyncConfigs([], sources);
    }
  }
}

export async function saveSourceSyncConfigs(data) {
  writeLocalStorage(STORAGE_KEYS.sourceSyncConfigs, data);

  try {
    return await fetchJson("/api/source-sync-configs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch (_) {
    return {
      status: "saved-local",
      count: data.length,
    };
  }
}

export async function fetchDuplicateGroups() {
  const localData = readLocalStorage(STORAGE_KEYS.duplicateGroups);

  if (Array.isArray(localData)) {
    return localData;
  }

  try {
    return await fetchJson("/api/duplicates");
  } catch (_) {
    try {
      const staticData = await fetchStaticData();
      return staticData.duplicate_groups;
    } catch (error) {
      console.error("Lỗi khi tải duplicate groups:", error);
      return [];
    }
  }
}

export async function saveDuplicateGroups(data) {
  writeLocalStorage(STORAGE_KEYS.duplicateGroups, data);

  try {
    return await fetchJson("/api/duplicates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch (_) {
    return {
      status: "saved-local",
      count: data.length,
    };
  }
}
