let tableData = [];

async function loadData() {
  const res = await fetch("/api/sources");
  tableData = await res.json();
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById("tableBody");

  if (tableData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-slate-500">Không có dữ liệu</td></tr>`;
    return;
  }

  tbody.innerHTML = tableData
    .map(
      (item) => `
    <tr class="hover:bg-slate-50 transition">
      <td class="px-6 py-4 flex items-center gap-3">
        <img src="https://cdn.simpleicons.org/${item.icon}" class="w-5 h-5 object-contain drop-shadow-sm" alt="${item.source}">
        <span class="font-medium text-slate-900">${item.source}</span>
      </td>
      <td class="px-6 py-4 text-slate-600">${item.folder}</td>
      <td class="px-6 py-4 text-slate-600">
        ${item.status}
      </td>
      <td class="px-6 py-4 text-slate-600">${item.indexed}</td>
      <td class="px-6 py-4 text-slate-600">${item.last_sync}</td>
      <td class="px-6 py-4 text-slate-600">${item.last_result}</td>
      <td class="px-6 py-4 text-slate-400">
        <button onclick="editRow(${item.id})" class="hover:text-blue-600 transition">Edit</button>
        <span class="mx-1 text-slate-300">·</span>
        <button onclick="deleteRow(${item.id})" class="hover:text-red-500 transition">Delete</button>
      </td>
    </tr>
  `,
    )
    .join("");
}

async function saveDataToFile() {
  await fetch("/api/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tableData),
  });
  renderTable();
}

async function deleteRow(id) {
  if (confirm("Bạn có chắc chắn muốn xoá nguồn dữ liệu này?")) {
    tableData = tableData.filter((item) => item.id !== id);
    await saveDataToFile(); // Cập nhật lại file JSON
  }
}

async function editRow(id) {
  const itemIndex = tableData.findIndex((item) => item.id === id);
  if (itemIndex > -1) {
    const newFolder = prompt(
      "Nhập tên Folder mới:",
      tableData[itemIndex].folder,
    );
    if (newFolder && newFolder.trim() !== "") {
      tableData[itemIndex].folder = newFolder.trim();
      await saveDataToFile(); // Cập nhật lại file JSON
    }
  }
}

// Khởi chạy khi load trang
document.addEventListener("DOMContentLoaded", loadData);
