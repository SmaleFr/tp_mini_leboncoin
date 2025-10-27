# Mini Leboncoin – Frontend léger

Interface web minimaliste pour consommer l'API du TP Mini Leboncoin. Le front est 100 % statique (HTML/CSS/JS vanilla) et communique avec le backend via `fetch`.

## Préparation

1. S'assurer que l'API backend est démarrée (voir dossier `mini-leboncoin-back`).
2. Ouvrir `index.html` dans un navigateur moderne **ou** servir le dossier avec un petit serveur HTTP (ex. `npx serve`).

## Fonctionnalités

- Inscription / connexion avec stockage du token en localStorage.
- Liste d'annonces avec filtres (`q`, `category`, `city`, `minPrice`, `maxPrice`), tri et pagination.
- Création d'annonce avec upload d'images (converties en base64 côté navigateur).
- Gestion des favoris (ajout/retrait, affichage des favoris).
- Messagerie :
  - côté acheteur, consultation de l'historique et envoi de réponses au vendeur,
  - côté vendeur, consultation et réponse aux messages reçus (sélecteur de destinataires).
- Suppression d'une annonce par son propriétaire.

## Utilisation rapide

1. Ouvrir `index.html` dans votre navigateur.
2. Créer un compte ou se connecter (l'API appelée est `http://localhost:3000/api`).
3. Publier des annonces, rechercher, gérer les favoris et la messagerie.

Tout est stocké côté client (localStorage) : la page peut être rechargée sans perdre la session tant que le token reste valide.
