# Exercice Kubernetes 2 
## Déploiement progressif d'une application (Peppermint) avec une base de données (Posgtres)

---

## Objectifs pédagogiques

À la fin de cet exercice, l’apprenti sera capable de :

- Comprendre la différence entre **Pod** et **Deployment**
- Comprendre pourquoi une **base de données a besoin de persistance**
- Mettre en évidence la perte de données **sans volume**
- Utiliser un **PersistentVolumeClaim (PVC)**
- Comprendre l’utilité des **Secrets**
- Utiliser les **Services** pour la communication interne
- Déployer une application complète (**Peppermint + PostgreSQL**)
- Exposer une application via un **Ingress NGINX**

> 💡 Cet exercice est volontairement progressif.  
> Certaines étapes sont **incorrectes d’un point de vue production**, mais **essentielles pour comprendre**.

---

## Prérequis

- Accès à un cluster Kubernetes fonctionnel
- `kubectl` configuré
- Un **Ingress Controller NGINX** déjà présent sur le cluster
- Connaissances de base en Docker et YAML

---

## Étape 0 — Préparation de l’environnement

### Objectif
Isoler le travail dans un namespace dédié.

### Commandes
```bash
#Ici on part du principe que vous avez un namespace à vous
kubectl config set-context --current --namespace=<mon-namespace>
#la commande ci-dessus permet de définir votre namespace pour namespace courant. Ce qui signifie que par défaut les ressources créées, le seront dans votre namespace par défaut si aucun namespace n'est précisés.
```

### Résultat attendu
- Le namespace `peppermint` existe
- Toutes les ressources créées ensuite seront dans ce namespace

---

## Étape 1 — Déployer PostgreSQL sans volume (cas volontairement faux)

### Objectif pédagogique
Comprendre que **sans volume**, une base de données **perd ses données** lorsque le Pod est recréé.

### Déploiement PostgreSQL (sans PVC, sans Secret)

Créer le fichier `01-postgres-no-volume.yaml` :

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: peppermint-postgres # Nom du Deployment (référence Kubernetes)
spec:
  replicas: 1 # Pour une base de données, on garde 1 seul replica
  selector:
    matchLabels:
      app: peppermint-postgres # Doit correspondre aux labels du template
  template:
    metadata:
      labels:
        app: peppermint-postgres # Labels appliqués aux Pods créés par ce Deployment
    spec:
      containers:
        - name: postgres
          image: postgres:18 # Image officielle Postgres (ici latest pour l'exercice)
          ports:
            - containerPort: 5432 # Port exposé par le conteneur PostgreSQL
          env:
            - name: POSTGRES_USER
              value: peppermint # Utilisateur PostgreSQL en clair — NE PAS faire en production
            - name: POSTGRES_PASSWORD
              value: "1234" # Mot de passe en clair — NE PAS faire en production
            - name: POSTGRES_DB
              value: peppermint # nom de la db initiale
```

### Appliquer
```bash
kubectl apply -f 01-postgres-no-volume.yaml
kubectl get pods
```

### Résultat attendu
- Un Pod PostgreSQL en état `Running`

---

## Étape 2 — Tester la base de données et constater la perte de données

### Objectif
Créer des données **à la main**, puis observer leur disparition.

### Connexion au conteneur PostgreSQL
```bash
kubectl get pods
kubectl exec -it <nom-du-pod> -- psql -U peppermint -d peppermint 
#Cette commande éxecute la commande "psql -U peppermnint -d peppermint" $ l'intérieur du conteneur.
#Il est aussi possible de faire un "port-forward" et de vous y connecter via un client postgres local.
```

### Dans PostgreSQL
```sql
CREATE TABLE demo (id serial PRIMARY KEY, message text);
INSERT INTO demo(message) VALUES ('hello kubernetes');
SELECT * FROM demo;
```

### Résultat attendu
- La table existe
- Une ligne est présente

### Supprimer le Pod
```bash
kubectl delete pod <nom-du-pod>
kubectl get pods
```

Reconnectez-vous à PostgreSQL et testez :
```sql
SELECT * FROM demo;
```

### Résultat attendu
- Erreur ou table inexistante  
- **Les données ont disparu**

**Conclusion intermédiaire**  
- Un Pod peut être recréé à tout moment.  
- Une base de données **ne doit jamais dépendre uniquement du Pod pour ces données**.

---

## Étape 3 — Ajouter la persistance avec un PersistentVolumeClaim (PVC)

### Objectif 
Séparer :
- le **calcul** (Pod)
- le **stockage** (Volume)

### Créer le PVC


 Description :
 Un PVC est une demande de stockage persistant effectuée par un utilisateur ou un Pod dans Kubernetes.
 Il décrit la quantité de stockage, le(s) mode(s) d'accès et la classe de stockage souhaitée, sans
 exposer les détails du support physique sous-jacent.



Fichier `02-postgres-pvc.yaml` :


```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data # Nom du PVC utilisé par le Deployment
spec:
  accessModes:
    - ReadWriteOnce # Accès en lecture/écriture par un seul nœud (adapté à Postgres)
  resources:
    requests:
      storage: 5Gi # Taille demandée pour le volume persistant
  storageClassName: exoscale-sbs # type de stockage du cluster k8s, exoscale-sbs par défaut sur SKS
```


```bash
kubectl apply -f 02-postgres-pvc.yaml
kubectl get pvc
```

### Résultat attendu
- PVC en état `Bound`

---

## Étape 4 — PostgreSQL avec volume persistant

### Objectif
Monter le volume sur `/var/lib/postgresql/data`. C'est le répertoire des data du conteneur postgres.

Fichier `03-postgres-with-volume.yaml` :

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: peppermint-postgres # Nom du Deployment
spec:
  replicas: 1 # Nombre de réplicas (pour une DB, toujours 1 dans un deployment)
  selector:
    matchLabels:
      app: peppermint-postgres # Sélecteur pour lier le ReplicaSet / Pods
  template:
    metadata:
      labels:
        app: peppermint-postgres # Labels appliqués aux Pods créés
    spec:
      containers:
        - name: postgres
          image: postgres:18 # Image officielle Postgres
          ports:
            - containerPort: 5432 # Port exposé dans le conteneur
          env:
            - name: POSTGRES_USER
              value: peppermint # Utilisateur PostgreSQL (sera remplacé par un Secret plus tard)
            - name: POSTGRES_PASSWORD
              value: "1234" # Mot de passe en clair (à sécuriser via Secret)
            - name: POSTGRES_DB
              value: peppermint # Base de données initiale
          volumeMounts:
            - name: postgres-data #nom du volume à monter, déclaré plus bas.
              mountPath: /var/lib/postgresql # Répertoire des données PostgreSQL
      volumes:
        - name: postgres-data
          persistentVolumeClaim:
            claimName: postgres-data # Lie le PVC (02-postgres-pvc.yaml) au Pod
```

```bash
kubectl apply -f 03-postgres-with-volume.yaml
kubectl rollout status deploy/peppermint-postgres
```

### Test de persistance
- Recréez la table `demo`
- Supprimez le Pod
- Vérifiez que les données sont **toujours présentes**

### Résultat attendu
  Les données persistent

---

## Étape 5 — Sécuriser la configuration avec un Secret

### Objectif pédagogique
Ne plus stocker de mots de passe en clair dans les manifests.

Fichier `04-postgres-secret.yaml` :

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
type: Opaque
stringData:
  POSTGRES_USER: peppermint     # Nom d'utilisateur PostgreSQL utilisé par l'application
  POSTGRES_PASSWORD: "1234"     # Mot de passe en clair (exercice). En prod, utilisez un secret fort.
  POSTGRES_DB: peppermint       # Nom de la base de données initiale
# Utilisation :
# Dans le Deployment, remplacer les variables d'env par :
# envFrom:
#   - secretRef:
#       name: postgres-secret
```

```bash
kubectl apply -f 04-postgres-secret.yaml
kubectl get secrets
kubectl get secret postgres-secret -o yaml 
```
Vous devriez voir que vos **secrets** sont encodés en base 64


### Mise à jour du Deployment
Dans  `03-postgres-with-volume.yaml`, 
remplacer `env:` par :

```yaml
envFrom:
  - secretRef:
      name: postgres-secret
```
```bash
kubectl apply -f 03-postgres-with-volume.yaml
```
### Résultat attendu
- PostgreSQL fonctionne toujours
- Les credentials ne sont plus visibles dans le YAML

---

## Étape 6 — Exposer PostgreSQL avec un Service

### Objectif
Permettre à une application de se connecter via un **nom DNS stable**.

Créer un fichier `05-postgres-service.yaml` :

```yaml
apiVersion: v1
kind: Service
metadata:
  name: peppermint-postgres # Nom du Service pour PostgreSQL (DNS: peppermint-postgres)
spec:
  selector:
    app: peppermint-postgres # Lie le Service aux Pods du Deployment postgres
  ports:
    - name: postgres # Nom logique du port (utile pour la lisibilité)
      port: 5432 # Port exposé par le Service à l'intérieur du cluster
      targetPort: 5432 # Port sur lequel le conteneur PostgreSQL écoute
      protocol: TCP # Protocole utilisé (TCP par défaut pour Postgres)
  type: ClusterIP # Service interne au cluster (valeur par défaut)
```
Le Service fournit une IP interne stable et un nom DNS : dans le même namespace, PostgreSQL reste joignable via `peppermint-postgres`, alors qu’un Pod peut voir son IP changer à chaque redémarrage ou crash.

Le champ `selector` associe le Service aux Pod(s) ciblés via des labels. Ici, le label `app: peppermint-postgres` défini dans le Deployment permet au Service de retrouver et router le trafic vers les Pods PostgreSQL.
```bash
kubectl apply -f 05-postgres-service.yaml
kubectl get svc
```

Ici vous pouvez éventuellement faire un test de connexion avec un client posgres et un port-fowrard
```bash
kubectl port-forward svc/peppermint-postgres 5432:5432
# puis, depuis la machine locale, sur un autre terminal :
psql "host=localhost port=5432 user=peppermint dbname=peppermint"
```

### Résultat attendu
- Service `peppermint-postgres`
- Accessible uniquement à l’intérieur du cluster

---

## Étape 7 — Déployer l’application Peppermint

### Objectif
Déployer une application réelle (Peppermint) utilisant PostgreSQL. Peppermint récupère ses identifiants de connexion via des variables d’environnement : nous allons donc créer un Secret pour stocker ces credentials, comme pour PostgreSQL précédemment.

Peppermint fournit une documentation pour un déploiement via docker-compose.
Nous nous en inspirons pour le faire via kubernetes, https://docs.peppermint.sh/docker 

### Secret Peppermint

Fichier `06-peppermint-secret.yaml` :

```yaml

apiVersion: v1
kind: Secret
metadata:
    name: peppermint-secret
type: Opaque
stringData:
    DB_USERNAME: peppermint       # Nom d'utilisateur PostgreSQL
    DB_PASSWORD: "1234"           # Mot de passe (exercice). En prod, utilisez un secret fort.
    DB_HOST: peppermint-postgres  # Service DNS interne pointant vers PostgreSQL
    SECRET: peppermint4life       # Secret applicatif (utilisé par Peppermint)
```

```bash
kubectl apply -f 06-peppermint-secret.yaml
```

### Deployment Peppermint

Fichier `07-peppermint-deployment.yaml` :

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: peppermint
spec:
  replicas: 1
  selector:
    matchLabels:
      app: peppermint
  template:
    metadata:
      labels:
        app: peppermint
    spec:
      containers:
        - name: peppermint
          image: pepperlabs/peppermint:latest
          env:
          - name: HOSTNAME
            value: "0.0.0.0"
          ports:
            - containerPort: 3000
            - containerPort: 5003
          envFrom:
            - secretRef:
                name: peppermint-secret
```

```bash
kubectl apply -f 07-peppermint-deployment.yaml
kubectl logs -l app=peppermint -f #Elle affiche en continu les logs des conteneurs dont les Pods ont le label : app=peppermint
```

### Résultat attendu
- Pod Peppermint en `Running`
- Logs sans erreur de connexion DB

---

## Étape 8 — Service Peppermint + test local
De la même manière que pour la DB, on créer un service affin d'avoir un point d'entrée stable avec un nom DNS interne.
A noter que peppermint écoute sur 2 ports. 3000 pour le partie front.
Fichier `08-peppermint-service.yaml` :

```yaml
apiVersion: v1
kind: Service
metadata:
  name: peppermint
spec:
  selector:
    app: peppermint
  ports:
    - name: web
      port: 3000
      targetPort: 3000

```

```bash
kubectl apply -f 08-peppermint-service.yaml
kubectl port-forward svc/peppermint 3000:3000
```

➡️ Accès : http://localhost:3000
- user: admin@admin.com
- password: 1234

---

## Étape 9 — Exposition publique avec Ingress

### Objectif
Rendre l’application accessible depuis Internet.

Fichier `09-peppermint-ingress.yaml` :

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: peppermint
  # annotations: # éventuelles annotations pour TLS, redirections, etc.
spec:
  ingressClassName: nginx # classe d'Ingress gérée par l'Ingress Controller NGINX
  rules:
    - host: peppermint.X.X.X.X.nip.io # nom DNS public (nip.io résout l'IP encodée dans le nom), demander l'ip publique du controller ingress à votre enseignant si inconnu.
      http:
        paths:
          - path: /
            pathType: Prefix # route toutes les requêtes dont le chemin commence par "/"
            backend:
              service:
                name: peppermint # Service Kubernetes cible (défini en 08-peppermint-service.yaml)
                port:
                  number: 3000 # port exposé par le Service pour la partie front
```

```bash
kubectl apply -f 09-peppermint-ingress.yaml
kubectl get ingress
```

### Résultat attendu
- Accès via navigateur public http://peppermint.X.X.X.X.nip.io
- Application fonctionnelle

---

## Nettoyage

```bash
Supprimer toutes les resources créées dans cet exercice
kubectl get all -n my-ns #affiche toues les resources du namespace

```
<span style="color:red">ATTENTION</span>
```bash
kubectl delete -f . #supprimes les ressource correspondantes aux fichiers yaml du répertoire courant
```
---

## Bilan

✔ Compréhension du cycle de vie d’un Pod  
✔ Importance des volumes pour les bases de données  
✔ Séparation configuration / secrets  
✔ Communication interne via Services  
✔ Exposition externe via Ingress  
✔ Déploiement d’une application complète sur Kubernetes
