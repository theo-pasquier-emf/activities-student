# Project Guideline – Module 324

## 1. Contexte du projet

Chaque équipe reçoit une application **Node.js simple** (frontend + backend) de gestion de petites annonces.  
L’objectif est d’ajouter des fonctionnalités et de mettre en place une **chaîne CI/CD complète** avec un **déploiement final sur Kubernetes via Argo CD**.

Le projet est réalisé par **groupe de 2 à 3 apprentis**.

---

## 2. Spécifications fonctionnelles

Les contraintes pour la spécification des fonctionnalités à mettre en place sont :

- Le projet final devra être réalisé au minimum au stade MVP d'une solution définit par le groupe.
- Utilisation de **GitHub Project** selon le **template fourni**

---

## 3. Modèle Git – GitHub Flow (imposé)

Un repository GitHub est créé dans l’organisation de la classe (**FD31 / FD32**).

**Nom du repository :**
```
324-repo-<classe>-<nom groupe>-<prenom pef1>-<prenom pef2>
```

**Exemple :**
```
324-repo-fd31-teamFnatic-arnaud-jonas
```

Le repository contiendra :

- Une branche `main` stable
- Une branche par fonctionnalité : `feature/nom-feature`
- **Pull Request obligatoire** vers `main`
- **Revue de code obligatoire** avant chaque merge

---

## 4. Intégration Continue (CI) – GitHub Actions

Un workflow **GitHub Actions minimum** devra contenir :

- Déclenchement en cas de **merge sur la branche `main`**
- Installation des dépendances
- Lint **frontend** et **backend**
- Build Docker avec **tag**
- Push des images sur la **container registry**

---

## 5. Kubernetes – Argo CD

La partie **déploiement continu (CD)** est soumise aux contraintes suivantes :

- Déploiement réalisé via **Argo CD**, sans action manuelle  
  *(hormis une validation et un clic)*
- Manifests Kubernetes **stockés dans le repository Git**
- Aucun changement manuel requis dans le cluster  
  *(hormis la création préalable des secrets)*

---

## 6. Documentation

La documentation sera contenue dans un fichier **README.md** et devra traiter les points suivants :

- Introduction
- Description des fonctionnalités implémentées
- Mise en œuvre des processus **CI/CD**
- Problèmes rencontrés
- Conclusion

---

## 7. Présentation finale

Au terme du module, chaque groupe réalisera une **présentation de 15 à 20 minutes** incluant :

- Démo fonctionnelle
- Explication du workflow **CI/CD**
- Retour d’expérience

Suite à cette présentation, **5 à 10 minutes** seront consacrées aux **questions des enseignants**.

