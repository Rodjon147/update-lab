const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("updateLab", {
  getVersion: () => {
    return ipcRenderer.invoke("app:version");
  },

  checkForUpdates: () => {
    return ipcRenderer.invoke("updates:check");
  },

  installUpdate: () => {
    return ipcRenderer.invoke("updates:install");
  },

  onStatus: (callback) => {
    const listener = (_event, status) => {
      callback(status);
    };

    ipcRenderer.on("updates:status", listener);

    // Позволяет React удалить подписку
    return () => {
      ipcRenderer.removeListener("updates:status", listener);
    };
  },
});
