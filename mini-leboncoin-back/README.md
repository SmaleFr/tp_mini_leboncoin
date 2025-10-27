# Mini Leboncoin – API REST Node.js + MongoDB

API Node.js construite dans le cadre du TP "Mini Leboncoin". Elle propose un backend complet pour la gestion d'utilisateurs, d'annonces, de favoris et de messagerie, avec recherche textuelle et pagination.

## Prérequis

- Node.js 20 ou supérieur
- MongoDB 6+
- npm 10+

## Installation

1. Installer les dépendances :

   ```bash
   npm install
   ```

2. Copier le fichier d'exemple d'environnement :

   ```bash
   cp .env.example .env
   ```

3. Renseigner les variables sensibles dans `.env` :

   | Variable            | Description                                      |
   | ------------------- | ------------------------------------------------ |
   | `PORT`              | Port HTTP du serveur (défaut : `3000`)           |
   | `MONGODB_URI`       | URI de connexion MongoDB                         |
   | `MONGODB_DB_NAME`   | Base de données à utiliser                       |
   | `TOKEN_SECRET`      | Secret HMAC-SHA256 pour signer les tokens        |
   | `TOKEN_EXPIRES_IN`  | Durée de validité des tokens en secondes         |
   | `IMAGE_UPLOAD_DIR`  | Dossier local pour stocker les images d'annonces |

4. Lancer le serveur :

   ```bash
   npm run dev
   ```

   Le serveur Express démarre après connexion à MongoDB et création des index.

## Scripts npm

- `npm run dev` : démarrage en mode développement (nodemon)
- `npm start` : démarrage en production
- `npm run seed` : insertion de données d'exemple

## Structure principale

```
src/
├─ app.js                # Configuration Express
├─ server.js             # Point d'entrée
├─ config/               # Gestion de l'env, Mongo, index
├─ controllers/          # Logique HTTP
├─ middlewares/          # Auth, erreurs, etc.
├─ routes/               # Définition des routes
├─ services/             # Accès aux données et règles métier
├─ utils/                # Helpers (hash, tokens, etc.)
└─ seeds/                # Scripts de peuplement
```

## Routes principales

Les routes sont préfixées par `/api`.

### Authentification & utilisateurs

- `POST /api/signup` : inscription
- `POST /api/login` : connexion
- `GET /api/me` : profil de l'utilisateur authentifié
- `PUT /api/users/:id` : mise à jour (self)
- `DELETE /api/users/:id` : suppression (self)
- `GET /api/me/favorites` : favoris de l'utilisateur

### Annonces

- `POST /api/ads` : créer une annonce (auth)
- `GET /api/ads` : lister avec filtres (`q`, `category`, `city`, `minPrice`, `maxPrice`), pagination (`page`, `limit`) et tri (`sort`, `order`)
- `GET /api/ads/:id` : détail d'une annonce
- `PUT /api/ads/:id` : modifier (propriétaire)
- `DELETE /api/ads/:id` : supprimer (propriétaire)

### Favoris

- `POST /api/ads/:id/favorite` : ajouter aux favoris
- `DELETE /api/ads/:id/favorite` : retirer des favoris

### Messagerie

- `POST /api/ads/:id/messages` : envoyer un message à l'annonceur (acheteur) ou répondre à un contact en précisant `recipientId` (propriétaire)
- `GET /api/ads/:id/messages` : consulter les messages reçus et les correspondants (propriétaire) ou afficher son historique de conversation (acheteur)

## Authentification

- Mots de passe stockés via SHA-256 avec sel unique (HMAC via `crypto`)
- Tokens maison `header.payload.signature`, signés avec `crypto.createHmac` (HS256)
- Middleware `requireAuth` pour protéger les routes sensibles

## Gestion des images

Les images d'annonces sont envoyées en base64 (data URL). Elles sont enregistrées dans le dossier `uploads/` (configurable via `IMAGE_UPLOAD_DIR`) puis exposées via `/uploads/…`.

## Recherche

Un index textuel MongoDB est créé sur `title` et `description`, permettant la recherche plein texte (`q`). Les filtres et tris sont combinables avec la pagination (`page`, `limit`).

## Seed de données

Le script `npm run seed` insère :

- 3 utilisateurs avec mots de passe hashés
- 15 annonces réparties entre plusieurs catégories et villes
- favoris et messages d'exemple

Avant d'exécuter le seed, assurez-vous que la base sélectionnée peut être vidée : le script supprime les collections ciblées (`users`, `ads`, `messages`).

```bash
npm run seed
```

## Tests manuels

Utilisez Postman ou un outil similaire avec le fichier `.env` configuré. Quelques scénarios recommandés :

1. Inscription puis connexion pour récupérer un token
2. Création d'annonce avec images base64
3. Recherche d'annonces avec filtres et pagination
4. Ajout/suppression de favoris et récupération via `/api/me/favorites`
5. Messagerie : envoi d'un message et consultation côté propriétaire

## Licence

Projet pédagogique – licence ISC par défaut.
