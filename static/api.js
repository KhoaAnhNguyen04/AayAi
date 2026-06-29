// static/api.js

export async function fetchSources() {
  try {
    const res = await fetch("/api/sources");
    return await res.json();
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu:", error);
    return [];
  }
}

export async function saveSources(data) {
  try {
    const res = await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Lỗi khi lưu dữ liệu:", error);
  }
}
export async function fetchDuplicateGroups() {
  try {
    const res = await fetch("/api/duplicates");

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return await res.json();
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu duplicate documents:", error);
    return [];
  }
}

export async function saveDuplicateGroups(data) {
  try {
    const res = await fetch("/api/duplicates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return await res.json();
  } catch (error) {
    console.error("Lỗi khi lưu dữ liệu duplicate documents:", error);
  }
}
