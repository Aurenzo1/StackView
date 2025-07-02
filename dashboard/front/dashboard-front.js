const grid = document.getElementById('tileGrid');
const sidebarNav = document.getElementById('sidebarNav');
const detailsModal = document.getElementById('detailsModal');
const modalInner = document.getElementById('modalInner');

let scripts = [];
let categories = [];
let currentCategory = "home";
let latestLogs = {};
let scriptStats = {};
let scriptStatus = {};
let activityLogs = {};
let modalChart = null;
let currentModalScript = null;

fetch('/service-logs/activity_logs.json')
  .then(res => res.json())
  .then(json => { activityLogs = json; });

function renderSidebar() {
  sidebarNav.innerHTML = "";
  const homeBtn = document.createElement('button');
  homeBtn.textContent = "Accueil";
  homeBtn.classList.toggle('active', currentCategory === "home");
  homeBtn.onclick = () => { currentCategory = "home"; renderSidebar(); renderTiles(); };
  sidebarNav.appendChild(homeBtn);
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    btn.classList.toggle('active', currentCategory === cat);
    btn.onclick = () => { currentCategory = cat; renderSidebar(); renderTiles(); };
    sidebarNav.appendChild(btn);
  });
}

function renderTiles() {
  grid.innerHTML = "";
  if (currentCategory === "home") {
    grid.innerHTML = `<div style="width:100%;text-align:center;margin-top:80px;">
      <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f680.svg" style="width:90px;opacity:.88;margin-bottom:25px;">
      <h1 style="color:#8bf2cc;font-size:2.3em;font-weight:700;margin:0 0 15px;">Bienvenue sur le Dashboard</h1>
      <div style="font-size:1.16em;color:#e3f8ef;max-width:640px;margin:auto;">
        Sélectionnez une catégorie à gauche pour afficher vos scripts monitorés.<br>
        <span style="opacity:.7">Statut et logs sont mis à jour en temps réel.</span>
      </div></div>`;
    return;
  }
  scripts.filter(s => s.category === currentCategory).forEach(s => grid.appendChild(createTileForScript(s)));
}

function createTileForScript(data) {
  const { name, category = "Autre" } = data;
  let tile = document.createElement('div');
  tile.className = "monitor-tile tile-compact";
  tile.id = `tile-${name}`;

  const header = document.createElement('div');
  header.className = "tile-header";
  const title = document.createElement('span');
  title.className = "tile-title";
  title.textContent = name;
  const dot = document.createElement('span');
  dot.className = "tile-status-dot";
  header.appendChild(title); header.appendChild(dot);

  // Actions
  const actions = document.createElement('div');
  actions.style.marginLeft = 'auto';
  ['play', 'redo', 'stop'].forEach(action => {
    const btn = document.createElement('button');
    btn.className = "tile-action-btn";
    btn.title = action === 'play' ? 'Démarrer' : action === 'redo' ? 'Redémarrer' : 'Arrêter';
    btn.innerHTML = action === 'play' ? '▶️' : action === 'redo' ? '🔄' : '⏹️';
    btn.onclick = e => { e.stopPropagation(); window.sendAction && window.sendAction(name, action); };
    actions.appendChild(btn);
  });
  header.appendChild(actions);
  tile.appendChild(header);

  const cat = document.createElement('div');
  cat.className = "tile-category";
  cat.textContent = category;
  tile.appendChild(cat);

  const detailsBtn = document.createElement('button');
  detailsBtn.className = "tile-details-btn";
  detailsBtn.textContent = "Voir";
  detailsBtn.onclick = () => openDetailsModal(name);
  tile.appendChild(detailsBtn);

  // Status couleur (tolérant pour toute forme de booléen)
  const status = scriptStatus[name]?.connected;
  tile.classList.remove('status-ok', 'status-error');
  if (status === true || status === 1 || status === "true") tile.classList.add('status-ok');
  else tile.classList.add('status-error');
  return tile;
}

function openDetailsModal(name) {
  currentModalScript = name;
  detailsModal.classList.add("open");
  refreshModal();
}

function refreshModal() {
  if (!currentModalScript) return;
  const name = currentModalScript;
  const s = scripts.find(s => s.name === name) || {};
  const log = latestLogs[name]?.log || "";
  const stat = scriptStats[name] || {};
  const status = scriptStatus[name] || {};
  let avg = stat.avg !== undefined ? stat.avg + " ms" : "—";
  let min = stat.min !== undefined ? stat.min + " ms" : "—";
  let max = stat.max !== undefined ? stat.max + " ms" : "—";
  let history = stat.history || [];
  let uptime = (status.connected === true || status.connected === 1 || status.connected === "true") ? "100%" : "0%";
  let last = log ? new Date(latestLogs[name]?.timestamp).toLocaleString('fr-FR') : "—";
  let logsTable = `<div style="margin-top:16px;">
      <b>Dernier log reçu :</b><br>
      <div style="margin-top:6px;padding:8px 12px;background:#161c1f;border-radius:7px;color:#d0ffe0;">${log ? log : "Aucun log récent."}</div>
      <div style="margin-top:16px;font-size:0.97em;color:#aaa;">${last !== "—" ? "Reçu le "+last : ""}</div>
    </div>`;
  if (stat.history && stat.history.length) {
    logsTable += `<table style="width:100%;margin-top:20px;border-radius:7px;overflow:hidden;">
      <thead><tr style="background:#212634;color:#f1f6fa;">
        <th style="text-align:left;padding:9px 16px;">Statut</th>
        <th style="text-align:left;">Heure</th>
        <th style="text-align:left;">Message</th>
        <th style="text-align:left;">Latence</th>
      </tr></thead>
      <tbody>
      ${stat.history.slice(-10).reverse().map((val, i) => `
        <tr style="background:${i%2 ? "#23273a":"#20232a"}">
          <td style="color:#21f297;font-weight:600;padding:7px 15px;">UP</td>
          <td>${new Date(Date.now()-i*60000).toLocaleTimeString('fr-FR')}</td>
          <td>OK</td>
          <td><span style="font-family:monospace;">${val} ms</span></td>
        </tr>
      `).join('')}
      </tbody>
    </table>`;
  }
  let activityTable = `<div style="margin-top:18px;">Aucune activité récente.</div>`;
  if (activityLogs[name] && activityLogs[name].length) {
    activityTable = `<h3 style="margin:24px 0 7px 0;">Historique du script</h3>
    <table style="width:100%;background:#212634;border-radius:7px;">
      <thead>
        <tr><th>Type</th><th>Message</th><th>Date/Heure</th></tr>
      </thead>
      <tbody>
        ${activityLogs[name].slice(-10).reverse().map(l => `
          <tr>
            <td>${l.type}</td>
            <td>${l.message}</td>
            <td>${l.time ? new Date(l.time).toLocaleString('fr-FR') : ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
  }
  modalInner.innerHTML = `  <button class="close-btn" aria-label="Fermer" onclick="closeDetailsModal()" 
    style="
      position:absolute;right:22px;top:17px;
      width:38px;height:38px;line-height:38px;
      background:transparent;border:none;outline:none;cursor:pointer;
      border-radius:50%;display:flex;align-items:center;justify-content:center;
      transition:background .17s;
      z-index:2000;
    "
    onmouseover="this.style.background='#242730';this.firstChild.style.color='#fff'"
    onmouseout="this.style.background='transparent';this.firstChild.style.color='#ff5b5b'"
  >
    <span style="display:inline-block;font-size:2em;color:#ff5b5b;font-weight:900;pointer-events:none;transition:color .18s;">×</span>
  </button>
    <div style="display:flex;gap:18px;margin-bottom:14px;">
      <button onclick="window.sendAction('${name}', 'play')" style="font-size:1.12em;padding:8px 22px 8px 16px;margin-right:8px;background:#22d47e;border:none;border-radius:8px;color:#fff;font-weight:700;cursor:pointer;">▶️ Démarrer</button>
      <button onclick="window.sendAction('${name}', 'redo')" style="font-size:1.12em;padding:8px 22px 8px 16px;margin-right:8px;background:#578ffb;border:none;border-radius:8px;color:#fff;font-weight:700;cursor:pointer;">🔄 Redémarrer</button>
      <button onclick="window.sendAction('${name}', 'stop')" style="font-size:1.12em;padding:8px 22px 8px 16px;background:#d54646;border:none;border-radius:8px;color:#fff;font-weight:700;cursor:pointer;">⏹️ Arrêter</button>
    </div>
    <div style="display:flex;gap:36px;margin-bottom:18px;align-items:center;">
      <div>
        <div style="font-size:2.1em;font-weight:700;color:#6df2c3;margin-bottom:2px;">${name}</div>
        <div style="color:#84efc7;font-size:1.07em;">${s.category || ""}</div>
      </div>
      <div style="flex:1;"></div>
      <div style="display:flex;gap:38px;">
        <div><div style="font-size:1.18em;font-weight:600;">Réponse</div>
          <div style="font-size:1.7em;">${stat.history?.length ? stat.history[stat.history.length-1]+"ms":"—"}</div></div>
        <div><div style="font-size:1.18em;font-weight:600;">Réponse Moyenne</div>
          <div style="font-size:1.5em;">${avg}</div></div>
        <div><div style="font-size:1.18em;font-weight:600;">Disponibilité</div>
          <div style="font-size:1.5em;">${uptime}</div></div>
      </div>
    </div>
    <div style="margin-bottom:22px;">
      <canvas id="modalChart" width="1020" height="280"></canvas>
      <div style="display:flex;gap:48px;font-size:1.09em;color:#8bffcd;margin-top:11px;">
        <div>&#8709; <b>${avg}</b> Moyenne</div>
        <div>&#8595; <b>${min}</b> Min</div>
        <div>&#8593; <b>${max}</b> Max</div>
      </div>
    </div>
    ${logsTable}
    ${activityTable}
  `;

  setTimeout(() => {
    if (modalChart) { modalChart.destroy(); }
    const ctx = document.getElementById('modalChart').getContext('2d');
    modalChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: history.map((_, i) => ""),
        datasets: [{
          data: history,
          borderColor: "#26e85f",
          pointRadius: 0,
          fill: false,
          tension: 0.22,
          borderWidth: 2.2,
        }]
      },
      options: {
        responsive: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: true, beginAtZero: true } }
      }
    });
  }, 50);
}

function closeDetailsModal() { detailsModal.classList.remove("open"); currentModalScript = null; }
window.closeDetailsModal = closeDetailsModal;

const socket = io();
window.sendAction = function(name, action) {
  socket.emit('action', { name, command: action });
};

socket.on('scripts', arr => {
  scripts = arr;
  categories = Array.from(new Set(arr.map(s => s.category).filter(Boolean)));
  if (currentCategory !== "home" && !categories.includes(currentCategory)) {
    currentCategory = "home";
  }
  renderSidebar(); renderTiles();
  if (currentModalScript) refreshModal();
});

socket.on('log', data => {
  latestLogs[data.name] = data;
  renderTiles();
  if (currentModalScript === data.name) refreshModal();
});
socket.on('status', ({ name, connected }) => {
  scriptStatus[name] = { connected };
  renderTiles();
  if (currentModalScript === name) refreshModal();
});
socket.on('stat_graphique', data => {
  scriptStats[data.name] = scriptStats[data.name] || { history: [] };
  let metric = typeof data.success === "number" ? data.success : 0;
  scriptStats[data.name].history.push(metric);
  if (scriptStats[data.name].history.length > 70) scriptStats[data.name].history.shift();
  let arr = scriptStats[data.name].history;
  scriptStats[data.name].min = Math.min(...arr);
  scriptStats[data.name].max = Math.max(...arr);
  scriptStats[data.name].avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  if (currentModalScript === data.name) refreshModal();
});
socket.on('activity_log', ({ name, log }) => {
  activityLogs[name] = activityLogs[name] || [];
  activityLogs[name].push(log);
  if (activityLogs[name].length > 500) activityLogs[name].shift();
  if (currentModalScript === name) refreshModal();
});

function showToast(msg, type = 'info') {
  let toast = document.createElement('div');
  toast.className = `dashboard-toast dashboard-toast-${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 350);
  }, 2200);
}
socket.on('actionResult', ({ name, status }) => {
  showToast(`(${name}) : ${status}`, 'ok');
});
