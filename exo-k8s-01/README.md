Voici le texte corrigé (orthographe, accents et quelques accords), sans modification de fond ni de structure :

---

# Exercice Kubernetes — Débutant

## Étape 0 - Installation et configuration (kubectl + kubeconfig)

Objectif : installer `kubectl` sous Windows et configurer l'accès au cluster via un fichier kubeconfig (fourni).

1. Installer kubectl avec winget (via console powershell)

```powershell
winget install -e --id Kubernetes.kubectl
kubectl version --client
```

Attendu : affichage de la version client de kubectl.

2. Créer le dossier `.kube` et copier le kubeconfig fourni
   Pourquoi : `kubectl` lit par défaut `%USERPROFILE%\.kube\config`.

```powershell
mkdir $env:USERPROFILE\.kube
# Copiez/renommez le fichier kubeconfig fourni en :
# %USERPROFILE%\.kube\config
```

Attendu : le fichier `config` existe dans `%USERPROFILE%\.kube`.

3. (Optionnel) Définir la variable d'environnement KUBECONFIG
   Utile si le fichier n'est pas au chemin par défaut.

```powershell
$env:KUBECONFIG = "$env:USERPROFILE\.kube\config"
```

4. Vérifier la connexion au cluster

```powershell
kubectl get nodes
```

Attendu : une liste de nodes au statut `Ready`.

## Étape 1 - Pod

Objectif : créer et explorer un Pod nginx, et y accéder en local.
Un Pod est la plus petite unité déployable dans Kubernetes : il regroupe un ou plusieurs containers qui partagent le réseau (IP/ports) et des volumes.

Idée générale : vous allez d'abord vérifier que le cluster répond, isoler votre travail dans un namespace, créer un Pod de deux manières (impérative puis déclarative), observer son état, puis exposer temporairement son port en local.

1. Vérifier le cluster
   Listez les nodes (worker nodes) disponibles
   Affichez tous les namespaces existants

```bash
kubectl get nodes
kubectl get ns
```

Attendu : une liste de nodes au statut `Ready` et une liste de namespaces (`default`, `kube-system`, etc.).

2. Seulement si vous n'avez pas de namespace attribué, Créer un namespace (si nécessaire) 
   Pourquoi : un namespace isole des ressources et évite les conflits de noms avec d'autres exercices.

```bash
kubectl create ns my-ns
```

Attendu : `namespace/my-ns created` (ou un message indiquant qu'il existe déjà).

3. Lancer rapidement un Pod (approche impérative avec kubectl run)
   Pourquoi : l'approche impérative est utile pour tester vite, mais elle est moins reproductible que le YAML.

*** A partir d'ici remplacer "my-ns" par le nom de votre namespace si il est différent ***
```bash
kubectl run nginx --image=nginxdemos/hello --restart=Never -n my-ns
kubectl get pods -n my-ns
```

Attendu : un Pod `nginx` au statut `Running` (ou `ContainerCreating` pendant le démarrage).

4. Créer un manifest YAML (pod.yml) — utiliser la doc pour comprendre les champs
   Pourquoi : la déclaration YAML est la méthode standard en Kubernetes, versionnable et reproductible.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginxhello
  namespace: my-ns
spec:
  containers:
  - name: nginxhello
    image: nginxdemos/hello
    ports:
    - containerPort: 80
```

5. Appliquer le manifest
   Pourquoi : kubectl compare l'état désiré (YAML) avec l'état actuel du cluster et applique les changements.

```bash
kubectl apply -f pod.yml
```

Attendu : `pod/nginxhello created` (ou `configured` si le Pod existait déjà).

6. Vérifier et décrire le Pod
   Pourquoi : `get` donne l'état global, `describe` montre les détails et événements, `logs` affiche la sortie du container.

```bash
kubectl get pods -n my-ns
kubectl describe pod nginxhello -n my-ns
kubectl logs nginxhello -n my-ns
```

Attendu : `get` montre `nginxhello` en `Running`, `describe` affiche les événements de démarrage, `logs` montre la page de démo nginx.

7. Accéder à l'application depuis votre machine (port-forward)
   Pourquoi : le port-forward crée un tunnel local vers un port du Pod sans exposer de service public.

```bash
kubectl port-forward pod/nginxhello 8080:80 -n my-ns
# accès via navigateur à http://localhost:8080
```

Attendu : la commande reste ouverte avec `Forwarding from 127.0.0.1:8080`, et ce lien renvoie la page de démo.
CTRL + C pour terminer le port-forwarding.

8. Nettoyage
   Pourquoi : supprimer les ressources évite les coûts inutiles et garde le cluster propre. Gardez le namespace pour l'étape Deployment.

```bash
kubectl delete pod nginxhello -n my-ns
kubectl delete pod nginx -n my-ns   # si créé avec kubectl run
```

Attendu : `pod/nginxhello deleted` et `pod/nginx deleted` si présent.

## Étape 2 - Deployment

Objectif : remplacer le Pod « nu » par un Deployment.
Un Deployment maintient le nombre désiré de Pods et permet le rescheduling automatique si un Pod tombe (ou si un nœud disparaît).

1. Supprimer les anciens Pods
   Pourquoi : un Deployment gère ses propres Pods, on repart d'un état propre.

```bash
kubectl delete pod nginxhello -n my-ns
kubectl delete pod nginx -n my-ns   # si créé avec kubectl run
```

Attendu : `pod/... deleted` (ou un message indiquant qu'ils n'existent pas).

2. Créer un manifest YAML (deploy.yml) — utiliser la doc pour comprendre les champs
   Pourquoi : le Deployment décrit l'état désiré et le ReplicaSet gère automatiquement les Pods.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginxhello-deploy
  namespace: my-ns
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginxhello
  template:
    metadata:
      labels:
        app: nginxhello
    spec:
      containers:
      - name: nginxhello
        image: nginxdemos/hello
        ports:
        - containerPort: 80
```

3. Appliquer le Deployment

```bash
kubectl apply -f deploy.yml
kubectl get deploy -n my-ns
kubectl get pods -n my-ns
```

Attendu : `deployment.apps/nginxhello-deploy created` et un Pod géré par un ReplicaSet en `Running`.

4. Vérifier les labels du Pod créé par le Deployment
   Les labels lient le Deployment / ReplicaSet aux Pods.

```bash
kubectl get pod <pod-name> -n <namespace> --show-labels
```

Attendu : les labels incluent `app=nginxhello`.

5. Expérimenter les réplicas (par modification du YAML)
   Modifier le champ `replicas` dans le manifest est la méthode déclarative et versionnable.

* Ouvrez `deploy.yml` et changez `replicas: 1` en `replicas: 3` (ou la valeur souhaitée).
* Puis appliquez le manifest :

```bash
kubectl apply -f deploy.yml
kubectl get deploy nginxhello-deploy -n my-ns
kubectl get pods -n my-ns
```

* Observer : le ReplicaSet crée ou supprime des Pods pour atteindre le nombre désiré.

6. Tester le rescheduling automatique
   Supprimez un Pod et observez le remplacement automatique.

```bash
kubectl delete pod <pod-name> -n my-ns
kubectl get pods -n my-ns
```

Attendu : un nouveau Pod apparaît avec un nom différent, puis passe en `Running`.

7. Accéder à l'application depuis votre machine (port-forward)

```bash
kubectl port-forward deploy/nginxhello-deploy 8080:80 -n my-ns
# accès via navigateur à http://localhost:8080
```

Attendu : `Forwarding from 127.0.0.1:8080` et la page de démo en retour.

8. Nettoyage

```bash
kubectl delete deploy nginxhello-deploy -n my-ns
```

Attendu : `deployment.apps/nginxhello-deploy deleted`.

Consignes : exécuter chaque commande, observer les sorties et lire la section correspondante de la documentation Kubernetes si un concept n'est pas clair (Pod, Deployment, ReplicaSet, labels, port-forward, describe).
