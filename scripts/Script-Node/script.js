const io = require("socket.io-client");
const TOKEN = process.env.TOKEN || "MySuperSecretToken2024";
const SCRIPT_NAME = process.env.SCRIPT_NAME || "Script-Node";
const CATEGORY = process.env.CATEGORY || "NodeScripts";

const socket = io("http://dashboard:3333"); // ou http://localhost:3333 si hors docker
let isRunning = true;

socket.on("connect", () => {
  socket.emit("identify", { name: SCRIPT_NAME, token: TOKEN, category: CATEGORY });
  console.log(`[${SCRIPT_NAME}] connecté au dashboard`);
  // Simule l'activité
  startProcess();
});

function startProcess() {
  if (isRunning) return;
  isRunning = true;
  doWork();
}

function stopProcess() {
  isRunning = false;
}

function doWork() {
  if (!isRunning) return;
  // Simule une tâche
  socket.emit("log", { name: SCRIPT_NAME, log: "OK" });
  socket.emit("stat_graphique", { name: SCRIPT_NAME, success: Math.floor(Math.random() * 100) + 100 });
  setTimeout(doWork, 5000); // toutes les 5s
}

// === Actions reçues ===
socket.on("action", ({ name, command }) => {
  if (name !== SCRIPT_NAME) return; // ignore si pas pour moi
  if (command === "play") {
    if (!isRunning) {
      console.log(`[${SCRIPT_NAME}] Start demandé`);
      startProcess();
    }
  } else if (command === "stop") {
    if (isRunning) {
      console.log(`[${SCRIPT_NAME}] Stop demandé`);
      stopProcess();
    }
  } else if (command === "redo" || command === "restart") {
    console.log(`[${SCRIPT_NAME}] Restart demandé`);
    stopProcess();
    setTimeout(startProcess, 1500);
  }
});
