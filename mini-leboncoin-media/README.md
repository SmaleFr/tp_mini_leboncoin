# Mini Leboncoin — Service Media (Images)

Microservice d’images pour Mini‑Leboncoin. Reçoit des images (base64 ou data URL), les enregistre en local, expose des URLs HTTP, et fournit une API simple pour la suppression.

## Prérequis

- Node.js 20+
- npm 10+
- Port libre: `4002`

## Installation

1) Aller dans le dossier du service:
   - `cd mini-leboncoin-media`
2) Installer les dependances:
   - `npm install`

## Démarrage

- Mode developpement :
  - `npm run dev`
- Mode production:
  - `npm start`
- Verifier la santé du service (doit repondre `{"status":"ok"}`)
  - Navigateur: `http://localhost:4002/health`
  - ou Terminal: `curl http://localhost:4002/health`

## Structure principale

```
src/
├─ app.js                # Configuration Express (CORS, JSON)
├─ server.js             # Point d'entree (port 4002)
├─ routes/               # Definition des routes HTTP
│  └─ images.routes.js   # POST /images, POST /images/delete, static /uploads
└─ utils/                # Helpers de stockage
   └─ storage.js         # Sauvegarde/suppression disque, middleware static
```

## Endpoints

- `GET /health` : Vérifie la santé du service
  - Sante du service. Reponse: `{ status: "ok" }`.

- `POST /images` : Upload d'image encodée en base64
  - Corps JSON: `{ images: ["<dataURL|base64>", ...], subdir: "ads" }`
  - Reponse: `{ images: [{ path, url, mime, size }] }`.
  - `subdir` permet de ranger les fichiers (ex: `ads`).

- `POST /images/delete` : Suppression d'image
  - Corps JSON: `{ paths: ["ads/nom-de-fichier.jpg", ...] }`
  - Reponse: `{ deleted: <nombre> }`.

- `GET /uploads/...`: permet d'accéder directement aux images stockées

## Ou sont stockées les images

- Dossier local: `mini-leboncoin-media/media-uploads/` (cree automatiquement).
- Exemple pour les annonces: `mini-leboncoin-media/media-uploads/ads`.
- URL publique: `http://localhost:4002/uploads/ads/<fichier>`.

## Integration avec le backend Mini-Leboncoin

- Preparation service media
  - Lancer le service: `cd mini-leboncoin-media && npm run dev`
  - Sante: `http://localhost:4002/health` → `{"status":"ok"}`

- Configuration backend
  - Dans `mini-leboncoin-back/.env`, ajouter: `MEDIA_SERVICE_URL=http://localhost:4002`
  - Redemarrer le backend: `cd mini-leboncoin-back && npm run dev`

- Fichiers ajoutés/modifiés coté backend
  - `mini-leboncoin-back/src/config/env.js`
    - Ajout de `mediaServiceUrl` (lecture de `MEDIA_SERVICE_URL`).

  - `mini-leboncoin-back/src/services/mediaClient.js.` : Envoie les images à enregistrer et demande leur suppression si nécessaire
    - Nouveau client HTTP du service media: `saveImagesRemote`, `deleteImagesRemote`, `mediaEnabled`.

  - `mini-leboncoin-back/src/services/adService.js`
    - Creation/mise à jour/suppression: utilise le service media si `MEDIA_SERVICE_URL` est defini; sinon fallback local via `utils/imageStorage.js`.

  - `mini-leboncoin-back/src/controllers/adController.js`
    - Presentation d’image: privilegie `image.url` renvoyee par le microservice; sinon `/uploads/${image.path}`.

  - `mini-leboncoin-back/.env.example`
    - Exemple commenté de `MEDIA_SERVICE_URL=http://localhost:4002`.

- Fonctionnement
  - Création/modification d’annonce: le backend envoie les images (base64/data URL) au service (POST `/images`) et stocke dans la BD les données renvoyées (dont `url`).
  - Suppression d’annonce: le backend demande la suppression des fichiers (POST `/images/delete`).
  - Service statique: les images sont servies par le media via `GET /uploads/...` (ex: `http://localhost:4002/uploads/ads/xxx.jpg`).

- Validation rapide
  - Créer une annonce avec image (front ou Postman).
  - Vérifier la réponse: `images[0].url` commence par `http://localhost:4002/uploads/`.
  - Vérifier sur disque: fichier présent dans `mini-leboncoin-media/media-uploads/ads`.
  - Supprimer l’annonce: l’URL doit retourner 404 ensuite et le fichier disparaitre.

- Fallback (securité)
  - Si `MEDIA_SERVICE_URL` est absent ou si le service est indisponible, le backend bascule automatiquement sur le stockage local (`mini-leboncoin-back/uploads`).

## Notes equipe`n
- Le dossier `media-uploads/` est ignoré par Git. Chacun peut générer ses images localement.
- Pour partager les mêmes images à plusieurs:
  - Héberger ce service sur une machine commune et donner son URL (`MEDIA_SERVICE_URL`) à l’équipe, ou
  - Utiliser le script de seed du backend pour créer rapidement des annonces avec images de test.

## Metriques

Le service expose un petit endpoint JSON pour deux compteurs simples.

- http.requestsTotal : nombre total de requetes HTTP recues (toutes routes).
- images.bytesTotal : volume cumulé en octets écrit lors des uploads (POST /images).

Consulter:
- Navigateur ou curl: http://localhost:4002/metrics
- Exemple: { 'http': { 'requestsTotal': 12 }, 'images': { 'bytesTotal': 123456 } }

