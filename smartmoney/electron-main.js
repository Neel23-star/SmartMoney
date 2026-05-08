const { app, BrowserWindow, shell, Menu } = require("electron");
const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

let mainWindow;
let backendProcess;
let backendOwnedByElectron = false;

function canReachBackend() {
  return new Promise((resolve) => {
    const req = http.get("http://localhost:8000/api/health", (res) => {
      resolve(res.statusCode === 200);
      req.destroy();
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// ── Start the Node.js backend as a child process ──────────────────────────────
function startBackend() {
  const serverPath = path.join(__dirname, "backend", "server.js");
  backendOwnedByElectron = true;
  backendProcess = spawn("node", [serverPath], {
    cwd: path.join(__dirname, "backend"),
    stdio: "pipe",
    windowsHide: true,
  });

  backendProcess.stdout.on("data", (d) => process.stdout.write(`[backend] ${d}`));
  backendProcess.stderr.on("data", (d) => process.stderr.write(`[backend] ${d}`));
  backendProcess.on("error", (err) => console.error("Backend error:", err));
  backendProcess.on("exit", (code) => console.log(`Backend exited with code ${code}`));
}

// ── Poll until backend is ready, then load ────────────────────────────────────
function waitForBackend(retries, onReady) {
  http.get("http://localhost:8000/api/health", (res) => {
    if (res.statusCode === 200) {
      onReady();
    } else if (retries > 0) {
      setTimeout(() => waitForBackend(retries - 1, onReady), 1000);
    }
  }).on("error", () => {
    if (retries > 0) setTimeout(() => waitForBackend(retries - 1, onReady), 1000);
    else console.error("Backend failed to start after retries");
  });
}

// ── Create the desktop window ─────────────────────────────────────────────────
function createWindow() {
  // Remove default menu bar
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: "Smart Money Screener",
    icon: path.join(__dirname, "frontend", "public", "icon-192.png"),
    backgroundColor: "#0f172a",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false, // Don't show until ready
  });

  // Show splash until backend is ready
  mainWindow.loadFile(path.join(__dirname, "splash.html"));
  mainWindow.once("ready-to-show", () => mainWindow.show());

  // Wait for backend, then load the app
  waitForBackend(30, () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL("http://localhost:8000");
    }
  });

  // Open external links (Yahoo Finance, NSE, etc.) in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("http://localhost:8000")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Reuse an already running backend when available to avoid EADDRINUSE.
  const backendAlreadyRunning = await canReachBackend();
  if (!backendAlreadyRunning) {
    startBackend();
  } else {
    console.log("Reusing existing backend on http://localhost:8000");
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (backendProcess && backendOwnedByElectron) {
    backendProcess.kill("SIGTERM");
    backendProcess = null;
  }
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (backendProcess && backendOwnedByElectron) {
    backendProcess.kill("SIGTERM");
    backendProcess = null;
  }
});
