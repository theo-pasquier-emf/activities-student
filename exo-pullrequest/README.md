# Exercice — Utilisation des Pull Request de GitHub
**Sujet** (module **324**) : Github (Pull Request)

**Resources** : Votre compte Github

**Modalité** : En groupe

---
## Objectifs
- Comprendre le rôle d’une Pull Request
- Appliquer le GitHub Flow
- Travailler avec revue de code

---
## Consigne
Sur la base de l'application des petites annonces, implémentez les issues décrites plus bas dans ce document. Chaque fonctionnalité est décrite sous forme d’**issue GitHub**.

---

### Règles de travail

* Une **issue = une fonctionnalité**
* Une **branche par issue**, créée depuis `main`
* Une **Pull Request par issue**
* Aucun push direct sur `main`

---

### Déroulement attendu

1. Prendre une issue assignée
2. Créer une branche nommée `feature/<nom-issue>`
3. Implémenter la fonctionnalité demandée
4. Ouvrir une Pull Request vers `main`
5. Lier la PR à l’issue correspondante
6. Demander une review
7. Corriger si nécessaire
8. Merger uniquement après validation

---

### Contraintes

* La PR doit être **compréhensible et ciblée**
* Le code doit rester fonctionnel
* Les commits doivent être clairs
* Le merge est fait par **une autre personne**

---

## Issue 1 — Ajouter le prix d’une annonce

**Titre**
Ajouter un prix à une annonce

**Description**
En tant qu’utilisateur, je veux voir le prix d’une annonce afin de connaître son coût.

**Tâche**

* Ajouter un champ `prix` à une annonce
* Afficher le prix sur la carte d’une annonce

**Critères d’acceptation**

* Le prix est affiché clairement (ex. `CHF 120.–`)
* Le prix est visible sur toutes les annonces existantes
* L’application fonctionne comme avant

---

## Issue 2 — Marquer une annonce comme vendue

**Titre**
Marquer une annonce comme vendue

**Description**
En tant qu’utilisateur, je veux pouvoir marquer une annonce comme vendue afin d’identifier les annonces terminées.

**Tâche**

* Ajouter un état `vendue` à une annonce
* Ajouter un bouton “Vendu”
* Adapter l’affichage pour une annonce vendue

**Critères d’acceptation**

* Une annonce vendue est visuellement identifiable
* L’action est réversible ou non (au choix)
* Aucun effet de bord sur les autres annonces

---

## Issue 3 — Trier les annonces par titre

**Titre**
Trier les annonces par titre

**Description**
En tant qu’utilisateur, je veux pouvoir trier les annonces par titre afin de les parcourir plus facilement.

**Tâche**

* Ajouter un bouton ou un sélecteur de tri
* Trier les annonces par ordre alphabétique (A → Z)

**Critères d’acceptation**

* Le tri est appliqué immédiatement
* Le tri n’altère pas les données (affichage uniquement)
* Le comportement est prévisible et stable
