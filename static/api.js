// static/api.js

async function getJson(url, fallback = []) {
  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    return data ?? fallback;
  } catch (error) {
    console.error(`Lỗi khi tải dữ liệu từ ${url}:`, error);
    return fallback;
  }
}

async function postJson(url, payload) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`Lỗi khi lưu dữ liệu vào ${url}:`, error);
    return null;
  }
}

export async function fetchSources() {
  const data = await getJson("/api/sources", []);
  return Array.isArray(data) ? data : [];
}

export async function saveSources(data) {
  return await postJson("/api/sources", data);
}

export async function fetchDuplicateGroups() {
  const data = await getJson("/api/duplicates", []);
  return Array.isArray(data) ? data : [];
}

export async function saveDuplicateGroups(data) {
  return await postJson("/api/duplicates", data);
}

export async function fetchSourceSyncConfigs() {
  const data = await getJson("/api/source-sync-configs", []);
  return Array.isArray(data) ? data : [];
}

export async function saveSourceSyncConfigs(data) {
  return await postJson("/api/source-sync-configs", data);
}
