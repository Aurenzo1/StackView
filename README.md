# StackView

> Dashboard moderne et en temps réel pour la supervision de scripts, processus et services dans des environnements conteneurisés (Node.js, Python, etc).

![StackView Screenshot](assets/stackview-preview.png) <!-- Ajoute une capture d'écran si tu veux -->

---

## Sommaire

- [Description](#description)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation & Lancement](#installation--lancement)
- [Structure des dossiers](#structure-des-dossiers)
- [Utilisation](#utilisation)
- [Ajout de scripts à monitorer](#ajout-de-scripts-à-monitorer)
- [Sécurité](#sécurité)
- [Développement & Contribution](#développement--contribution)
- [Crédits](#crédits)
- [Licence](#licence)

---

## Description

**StackView** est un dashboard de monitoring pour scripts et micro-services s’exécutant dans des conteneurs Docker. Il permet de :

- Visualiser l’état (UP/DOWN) de chaque script/service en temps réel.
- Consulter les logs et les historiques d’activité.
- Démarrer, arrêter ou redémarrer les scripts à la demande depuis l’interface.
- Centraliser le monitoring et l’administration dans une UI claire et ergonomique.

---

## Fonctionnalités

- **Supervision temps réel** des scripts connectés.
- **Statut visuel** : voyant vert/rouge par script/processus.
- **Logs** et **statistiques** pour chaque service.
- **Actions distantes** (start, stop, restart).
- **Support multi-langages** (Node.js, Python, etc.).
- **Historique des activités** par script.
- **Dashboard conteneurisé** (Docker-ready).
- **Ajout dynamique** de nouveaux scripts sans redémarrer le dashboard.
- **Websocket/Socket.IO** pour l’instantanéité.

---

## Architecture

