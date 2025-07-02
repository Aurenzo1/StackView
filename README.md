
# StackView

StackView est un dashboard moderne pour superviser et contrôler dynamiquement des scripts Dockerisés (Node.js, Python, Bash, etc.) à travers une interface web en temps réel.

---

## Fonctionnalités

- Interface web temps réel (Socket.io) avec mise à jour dynamique des statuts, logs, et graphiques.
- Démarrage, arrêt et redémarrage des scripts monitorés (par Docker).
- Affichage de l’état de chaque script (connecté, déconnecté, DOWN).
- Historique des logs et activité de chaque script.
- Stockage persistant des logs/statuts en JSON.
- 100% compatible Docker Compose : chaque script est dans son propre conteneur.
- Ajout facile de scripts à monitorer (Node, Python, Bash, etc.).

---

## Architecture

.
├── dashboard/ # Le dashboard principal (serveur Express/Socket.io + frontend)
│ ├── front/ # Fichiers statiques (index.html, dashboard-front.js, styles)
│ ├── service-logs/ # Logs persistants (JSON)
│ └── dashboard-server.js # Backend du dashboard (Node.js)
├── scripts/ # Dossiers de scripts monitorés
│ ├── Script-Node/ # Exemple : Script Node.js monitoré
│ └── Script-Python/ # Exemple : Script Python monitoré
├── docker-compose.yml # Lancement multi-conteneurs Docker
└── README.md # Ce fichier

---

## Prérequis

- [Docker](https://docs.docker.com/get-docker/) et [Docker Compose](https://docs.docker.com/compose/install/)
- (optionnel) Node.js & npm si tu veux dev en local le dashboard

---

## Installation & Lancement

### 1. Cloner le projet

```bash
git clone https://github.com/<ton-user>/StackView.git
cd StackView
```

### 2. Construire & lancer les conteneurs

```bash
docker compose up --build
```

Le dashboard sera accessible sur http://localhost:3333

Les scripts monitorés seront démarrés chacun dans leur propre conteneur

---

## Utilisation

Accède à http://localhost:3333

- Surveille en temps réel les statuts, logs et performances des scripts
- Utilise les boutons Démarrer, Redémarrer, Arrêter pour chaque script
- Clique sur "Voir" pour obtenir l’historique et les graphes détaillés

---

## Ajouter un script à monitorer

1. Crée un dossier dans `scripts/` (par ex : `Script-MonService`)
2. Ajoute ton script + un `Dockerfile` (Node, Python, Bash, etc.)
3. Mets à jour le `docker-compose.yml` :

```yaml
  script-monscript:
    build: ./scripts/Script-MonService
    container_name: Script-MonService
    environment:
      - TOKEN=MySuperSecretToken2024
      - SCRIPT_NAME=Script-MonService
      - CATEGORY=Autre
    depends_on:
      - dashboard
    restart: unless-stopped
```

### Variables d’environnement importantes

Chaque script doit se connecter au dashboard via Socket.io avec le bon token et nom :

- `TOKEN` : Le token secret partagé (ex: `MySuperSecretToken2024`)
- `SCRIPT_NAME` : Nom unique du script (ex: `Script-Node`)
- `CATEGORY` : Catégorie d’affichage (NodeScripts, PythonScripts, ...)

---

## Personnalisation

- Modifie le style ou le comportement du front dans `dashboard/front/`
- Modifie les endpoints ou la logique dans `dashboard/dashboard-server.js`
- Ajoute des scripts dans `scripts/` pour monitorer plus de services !

---

## Sécurité

- Le dashboard n’expose aucune API d’exécution critique sur le web : seul le conteneur `dashboard` peut piloter les autres via Docker.
- **Ne jamais exposer ce dashboard en public sans proxy/restriction d’accès** (ex : auth nginx ou tunnel SSH).

---

## Limitations & TODO

- Le dashboard utilise le socket Docker de l’hôte (monté dans dashboard) pour piloter les conteneurs (approche classique mais à restreindre en prod !)
- Possibilité d’ajouter une authentification web ou SSO
- Possibilité d’intégration alertes mail/Slack en cas de crash ou inactivité

---

## Auteurs & Contributeurs

Projet **StackView** by Aurenzo (2025)

Contributions et améliorations bienvenues !

---

