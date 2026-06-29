// static/api.js

const STORAGE_KEYS = {
  sources: "knowledge_admin_sources",
  duplicateGroups: "knowledge_admin_duplicate_groups",
  sourceSyncConfigs: "knowledge_admin_source_sync_configs",
};

function getDataJsonUrl() {
  return new URL("../data.json", import.meta.url).href;
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

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return await res.json();
}

async function fetchStaticData() {
  const data = await fetchJson(getDataJsonUrl(), {
    cache: "no-store",
  });

  if (Array.isArray(data)) {
    return {
      sources: data,
      duplicate_groups: [],
      source_sync_configs: [],
    };
  }

  return {
    sources: data.sources || [],
    duplicate_groups: data.duplicate_groups || [],
    source_sync_configs: data.source_sync_configs || [],
  };
}

export async function fetchSources() {
  const localData = readLocalStorage(STORAGE_KEYS.sources);

  if (Array.isArray(localData)) {
    return localData;
  }

  try {
    return await fetchJson("/api/sources");
  } catch (_) {
    try {
      const data = await fetchStaticData();
      return data.sources;
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

export async function fetchDuplicateGroups() {
  const localData = readLocalStorage(STORAGE_KEYS.duplicateGroups);

  if (Array.isArray(localData)) {
    return localData;
  }

  try {
    return await fetchJson("/api/duplicates");
  } catch (_) {
    try {
      const data = await fetchStaticData();
      return data.duplicate_groups;
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

export async function fetchSourceSyncConfigs() {
  const localData = readLocalStorage(STORAGE_KEYS.sourceSyncConfigs);

  if (Array.isArray(localData)) {
    return localData;
  }

  try {
    return await fetchJson("/api/source-sync-configs");
  } catch (_) {
    try {
      const data = await fetchStaticData();
      return data.source_sync_configs;
    } catch (error) {
      console.error("Lỗi khi tải source sync configs:", error);
      return [];
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
