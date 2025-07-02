const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const fs = require("fs");
const path = require("path");
const Docker = require("dockerode");

const SCRIPTS_FILE = path.join(__dirname, "service-logs/scripts.json");
const LOGS_FILE = path.join(__dirname, "service-logs/logs.json");
const DONUT_STAT_FILE = path.join(__dirname, "service-logs/donut_stat.json");
const SCRIPTS_STATUS_FILE = path.join(
  __dirname,
  "service-logs/scripts_status.json",
);
const ACTIVITY_LOGS_FILE = path.join(
  __dirname,
  "service-logs/activity_logs.json",
);

const AUTH_TOKEN = "MySuperSecretToken2024";

let scripts = [];
let dynamicScripts = {};
let latestLogs = {};
let scriptsStatus = {};
let donutStatCache = {};
let activityLogs = {};

try {
  scripts = JSON.parse(fs.readFileSync(SCRIPTS_FILE, "utf8"));
} catch {
  scripts = [];
}
try {
  latestLogs = JSON.parse(fs.readFileSync(LOGS_FILE, "utf8"));
} catch {
  latestLogs = {};
}
try {
  scriptsStatus = JSON.parse(fs.readFileSync(SCRIPTS_STATUS_FILE, "utf8"));
} catch {
  scriptsStatus = {};
}
try {
  donutStatCache = JSON.parse(fs.readFileSync(DONUT_STAT_FILE, "utf8"));
} catch {
  donutStatCache = {};
}
try {
  activityLogs = JSON.parse(fs.readFileSync(ACTIVITY_LOGS_FILE, "utf8"));
} catch {
  activityLogs = {};
}

function getAllScripts() {
  return [...scripts, ...Object.values(dynamicScripts)];
}

function saveLogsToFile() {
  fs.writeFile(LOGS_FILE, JSON.stringify(latestLogs, null, 2), (err) => {
    if (err) console.error("Erreur sauvegarde logs :", err);
  });
}
function saveScriptsStatusToFile() {
  fs.writeFile(
    SCRIPTS_STATUS_FILE,
    JSON.stringify(scriptsStatus, null, 2),
    (err) => {
      if (err) console.error("Erreur sauvegarde status :", err);
    },
  );
}
function saveDonutStatToFile() {
  fs.writeFile(
    DONUT_STAT_FILE,
    JSON.stringify(donutStatCache, null, 2),
    (err) => {
      if (err) console.error("Erreur sauvegarde donut stat :", err);
    },
  );
}
function saveActivityLogs() {
  fs.writeFile(
    ACTIVITY_LOGS_FILE,
    JSON.stringify(activityLogs, null, 2),
    (err) => {
      if (err) console.error("Erreur sauvegarde activity logs :", err);
    },
  );
}

// === SERVEUR EXPRESS + SOCKET.IO ===
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Docker client (pour /var/run/docker.sock)
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

app.use(express.static(path.join(__dirname, "front")));

app.get("/service-logs/activity_logs.json", (req, res) => {
  res.sendFile(ACTIVITY_LOGS_FILE);
});

// SOCKET.IO LOGIQUE
io.on("connection", (socket) => {
  socket.emit("scripts", getAllScripts());
  Object.entries(latestLogs).forEach(([name, entry]) => {
    socket.emit("log", { name, log: entry.log, timestamp: entry.timestamp });
  });
  Object.values(donutStatCache).forEach((stat) => {
    if (stat && stat.name) socket.emit("stat_graphique", stat);
  });

  // Authentification d'un script (identify)
  socket.on("identify", (data) => {
    if (!data || data.token !== AUTH_TOKEN) {
      socket.disconnect();
      return;
    }
    const name = data.name;
    const category = data.category || "Entrant";
    socket.scriptName = name;
    if (!scripts.some((s) => s.name === name) && !dynamicScripts[name]) {
      dynamicScripts[name] = { name, category };
      io.emit("scripts", getAllScripts());
      console.log(`🆕 Script ajouté dynamiquement: ${name} (${category})`);
    }
    scriptsStatus[name] = {
      connected: true,
      updatedAt: new Date().toISOString(),
    };
    saveScriptsStatusToFile();
    io.emit("status", {
      name,
      connected: true,
      updatedAt: scriptsStatus[name].updatedAt,
    });
  });

  // Déconnexion d'un script
  socket.on("disconnect", () => {
    if (socket.scriptName) {
      scriptsStatus[socket.scriptName] = {
        connected: false,
        updatedAt: new Date().toISOString(),
      };
      saveScriptsStatusToFile();
      io.emit("status", {
        name: socket.scriptName,
        connected: false,
        updatedAt: scriptsStatus[socket.scriptName].updatedAt,
      });
    }
  });

  // Reception log d'un script
  socket.on("log", (data) => {
    if (!data.name) return;
    const now = new Date().toISOString();
    latestLogs[data.name] = { log: data.log, timestamp: now };
    saveLogsToFile();
    io.emit("log", { ...data, timestamp: now });
  });

  // Reception stat donut (latence, etc)
  socket.on("stat_graphique", (data) => {
    if (!data.name) return;
    donutStatCache[data.name] = data;
    saveDonutStatToFile();
    io.emit("stat_graphique", data);
  });

  // Activity log (actions ou historique)
  socket.on("activity_log", (data) => {
    if (!data.name) return;
    if (!activityLogs[data.name]) activityLogs[data.name] = [];
    activityLogs[data.name].push({
      type: data.type,
      message: data.message,
      time: data.time,
      ...(data.extra || {}),
    });
    if (activityLogs[data.name].length > 500) activityLogs[data.name].shift();
    saveActivityLogs();
    io.emit("activity_log", {
      name: data.name,
      log: activityLogs[data.name][activityLogs[data.name].length - 1],
    });
  });

  // === Commande Start/Stop/Restart (via Docker) ===
  socket.on("action", async ({ name, command }) => {
    let result = "Commande inconnue";
    try {
      // Trouve le container par nom (docker-compose donne des noms comme Script-Node, Script-Python...)
      const containers = await docker.listContainers({ all: true });
      const containerInfo = containers.find((c) =>
        c.Names.some((n) => n.replace(/^\//, "") === name),
      );
      if (containerInfo) {
        const container = docker.getContainer(containerInfo.Id);
        if (command === "stop") {
          await container.stop();
          result = "Arrêté";
        } else if (command === "play" || command === "start") {
          await container.start();
          result = "Démarré";
        } else if (command === "redo" || command === "restart") {
          await container.restart();
          result = "Redémarré";
        }
      } else {
        result = "Aucun container trouvé pour ce nom";
      }
    } catch (err) {
      result = "Erreur Docker : " + (err.message || err);
      console.error(result);
    }
    io.emit("actionResult", { name, status: result });
  });
});

const PORT = 3333;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Dashboard Node lancé sur 0.0.0.0:${PORT}`);
});
