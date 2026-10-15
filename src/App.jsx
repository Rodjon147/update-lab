import { useEffect, useState } from "react";

function App() {
  const [version, setVersion] = useState("...");
  const [status, setStatus] = useState(() => {
    if (!window.updateLab) {
      return {
        type: "error",
        message: "Откройте приложение через Electron.",
      };
    }

    return {
      type: "idle",
      message: "Проверка обновлений ещё не выполнялась.",
    };
  });

  
useEffect(() => {
  if (!window.updateLab) {
    return;
  }

  const unsubscribe = window.updateLab.onStatus(setStatus);

  window.updateLab
    .getVersion()
    .then(setVersion)
    .catch((error) => {
      setStatus({
        type: "error",
        message: error.message,
      });
    });

  return unsubscribe;
}, []);


  async function checkUpdates() {
    setStatus({
      type: "checking",
      message: "Подключаемся к GitHub...",
    });

    try {
      const result = await window.updateLab.checkForUpdates();

      if (!result.ok) {
        setStatus({
          type: "error",
          message: result.message,
        });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message,
      });
    }
  }

  async function installUpdate() {
    const result = await window.updateLab.installUpdate();

    if (!result.ok) {
      setStatus({
        type: "error",
        message: result.message,
      });
    }
  }

  const busy = ["checking", "available", "downloading"].includes(status.type);

  return (
    <main className="app">
      <h1>🚀 Update Lab</h1>

      <h2>Версия {version}</h2>

      <p>Учебный проект Electron + React + NSIS</p>

      <p>✨ Это сообщение появилось благодаря OTA-обновлению!</p>

      <p>⚙️ Эта версия собрана автоматически через GitHub Actions!</p>

      <section className="updates">
        <h3>Центр обновлений</h3>

        <p>{status.message}</p>

        {status.type === "downloading" && (
          <progress value={status.percent ?? 0} max="100" />
        )}

        {status.type === "ready" ? (
          <button onClick={installUpdate}>Установить обновление</button>
        ) : (
          <button onClick={checkUpdates} disabled={busy || !window.updateLab}>
            {busy ? "Подождите..." : "Проверить обновления"}
          </button>
        )}
      </section>
    </main>
  );
}

export default App;
