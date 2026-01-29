
# Exercice de rappel — Dockerfile & docker-compose

Contexte (module **324**) : Prendre en charge le processus DevOps avec les outils logicielss

Les conteneurs et plus particulièrement Docker a été vu lors de précédent modules. 
Il s'agit ici d'un petit rappel afin de vous remémorer cette thématique pour la suite du module 324.

## Objectif
Une  mini application web **Node.js** qui écrit/lit des notes dans un fichier est donnée, A vous de créer un fichier de build **Dockerfile** et de déploiement **docker-compose**. Les notes ajoutées doivent être persistantes.

Tu vas produire :
- un `Dockerfile`
- un `docker-compose.yml`
- (optionnel) un `.dockerignore`

A la fin de l'exercice, la commande **docker compose up --build** devra fonctionner correctement (build et deployer l'appli en local)

---

### Spec mini appli : “Notes”
#### Fonctionnalités :
- `GET /` affiche les notes enregistrées
- `POST /notes` ajoute une note
- Les notes sont stockées dans un fichier JSON sur disque (et donc persistantes via volume)

#### Arborescence attendue
```
mini-notes/
├── app/
│   ├── package.json
│   └── server.js
├── Dockerfile
├── docker-compose.yml
└── (optionnel) .dockerignore
```
#### Schéma de principe
```mermaid
flowchart LR
  U[Navigateur] -->|HTTP :3000| D[Docker]
  D -->|port mapping 3000:3000| C[Conteneur web\nNode.js + Express]

 
  C -->|GET /notes| A[API /notes]
  C -->|GET /health| G[API /health]
  C -->|POST /notes| B[API /notes]

  A -->|lit| F[(notes.json)]
  
  B -->|écrit| F

  F --- V[(Volume Docker nmonté sur /data)]
  ```