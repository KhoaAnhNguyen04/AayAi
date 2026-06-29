// static/modal.js

export const DeleteModal = {
  itemToDeleteId: null,

  show(item) {
    this.itemToDeleteId = item.id;

    const modalText = document.getElementById("deleteModalText");

    if (modalText && item) {
      modalText.innerHTML = `
        Bạn có chắc chắn muốn xoá cấu hình Knowledge Source 
        <strong>${item.source} (${item.folder})</strong> khỏi hệ thống không?
        Hành động này không xoá tài liệu gốc tại nguồn.
      `;
    }

    this.animateOpen("deleteModal", "deleteModalContent");
  },

  hide() {
    this.animateClose("deleteModal", "deleteModalContent", () => {
      this.itemToDeleteId = null;
    });
  },

  getId() {
    return this.itemToDeleteId;
  },

  animateOpen(modalId, contentId) {
    const modal = document.getElementById(modalId);
    const modalContent = document.getElementById(contentId);

    modal.classList.remove("hidden");

    setTimeout(() => {
      modalContent.classList.remove("scale-95", "opacity-0");
      modalContent.classList.add("scale-100", "opacity-100");
    }, 10);
  },

  animateClose(modalId, contentId, callback) {
    const modal = document.getElementById(modalId);
    const modalContent = document.getElementById(contentId);

    modalContent.classList.remove("scale-100", "opacity-100");
    modalContent.classList.add("scale-95", "opacity-0");

    setTimeout(() => {
      modal.classList.add("hidden");
      if (callback) callback();
    }, 200);
  },
};

export const EditModal = {
  itemToEditId: null,

  show(item) {
    this.itemToEditId = item.id;

    const labelText = document.getElementById("editModalText");
    const inputField = document.getElementById("editFolderInput");

    if (labelText && item) {
      labelText.innerHTML = `Nhập tên Folder mới cho <strong>${item.source}</strong>:`;
    }

    if (inputField && item) {
      inputField.value = item.folder;
    }

    DeleteModal.animateOpen("editModal", "editModalContent");
  },

  hide() {
    DeleteModal.animateClose("editModal", "editModalContent", () => {
      this.itemToEditId = null;
      document.getElementById("editFolderInput").value = "";
    });
  },

  getId() {
    return this.itemToEditId;
  },

  getInputValue() {
    return document.getElementById("editFolderInput").value;
  },
};

export const StopSyncModal = {
  itemToStopId: null,

  show(item) {
    this.itemToStopId = item.id;

    const modalText = document.getElementById("stopSyncModalText");

    if (modalText && item) {
      modalText.innerHTML = `
        Bạn có chắc chắn muốn vô hiệu hóa đồng bộ nguồn dữ liệu 
        <strong>${item.source} (${item.folder})</strong> không?
        Hệ thống sẽ không quét dữ liệu mới từ nguồn này cho đến khi được bật lại.
      `;
    }

    DeleteModal.animateOpen("stopSyncModal", "stopSyncModalContent");
  },

  hide() {
    DeleteModal.animateClose("stopSyncModal", "stopSyncModalContent", () => {
      this.itemToStopId = null;
    });
  },

  getId() {
    return this.itemToStopId;
  },
};

export const CreateModal = {
  show() {
    document.getElementById("createUrlInput").value = "";
    this.clearError();
    DeleteModal.animateOpen("createModal", "createModalContent");
  },

  hide() {
    DeleteModal.animateClose("createModal", "createModalContent", () => {
      document.getElementById("createUrlInput").value = "";
      this.clearError();
    });
  },

  getInputValue() {
    return document.getElementById("createUrlInput").value.trim();
  },

  showError(message) {
    const errorContainer = document.getElementById("createModalError");
    const errorText = document.getElementById("createErrorText");

    if (errorContainer && errorText) {
      errorText.textContent = message;
      errorContainer.classList.remove("hidden");
    }
  },

  clearError() {
    const errorContainer = document.getElementById("createModalError");

    if (errorContainer) {
      errorContainer.classList.add("hidden");
    }
  },
};
