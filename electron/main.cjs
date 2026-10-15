const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const { autoUpdater } = require("electron-updater");

let mainWindow = null;
let checking = false;
let updateReady = false;

// Отправляем информацию об обновлении в React
function sendStatus(type, message, percent = null) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("updates:status", {
      type,
      message,
      percent,
    });
  }
}

// Настраиваем electron-updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = false;

autoUpdater.on("checking-for-update", () => {
  sendStatus("checking", "Проверяем GitHub...");
});

autoUpdater.on("update-available", (info) => {
  sendStatus(
    "available",
    `Найдена версия ${info.version}. Начинаем загрузку...`,
  );
});

autoUpdater.on("update-not-available", () => {
  sendStatus("idle", "У вас установлена актуальная версия.");
});

autoUpdater.on("download-progress", (progress) => {
  const percent = Math.round(progress.percent);

  sendStatus("downloading", `Загружено ${percent}%`, percent);
});

autoUpdater.on("update-downloaded", (info) => {
  updateReady = true;

  sendStatus("ready", `Версия ${info.version} загружена и готова к установке.`);
});

autoUpdater.on("error", (error) => {
  sendStatus("error", `Ошибка обновления: ${error.message}`);
});

// Получение установленной версии
ipcMain.handle("app:version", () => {
  return app.getVersion();
});

// Проверка обновлений по запросу React
ipcMain.handle("updates:check", async () => {
  if (!app.isPackaged) {
    return {
      ok: false,
      message: "Проверка доступна только в установленном приложении.",
    };
  }

  if (updateReady) {
    return {
      ok: false,
      message: "Обновление уже скачано. Установите его.",
    };
  }

  if (checking) {
    return { ok: true };
  }

  checking = true;

  try {
    await autoUpdater.checkForUpdates();
    return { ok: true };
  } catch (error) {
    sendStatus("error", `Ошибка: ${error.message}`);
    return { ok: false, message: error.message };
  } finally {
    checking = false;
  }
});

// Установка загруженного обновления
ipcMain.handle("updates:install", () => {
  if (!app.isPackaged || !updateReady) {
    return { ok: false, message: "Обновление ещё не загружено." };
  }

  setImmediate(() => {
    autoUpdater.quitAndInstall(true, true);
  });

  return { ok: true };
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    mainWindow.loadURL("http://localhost:5173");
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
