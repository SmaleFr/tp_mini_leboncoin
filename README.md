# TP Mini Leboncoin

Ce dépôt contient le backend et le frontend réalisés pour le TP Mini Leboncoin.

- `mini-leboncoin-back` : API Node.js/Express avec MongoDB (driver natif).
- `mini-leboncoin-front` : interface web statique (HTML/CSS/JS) consommant l'API.

Consultez les README dédiés dans chaque dossier pour les instructions détaillées.

# Groupe 

- Enzo Laborde
- Laurie Carriere
- Audrey Simon

# Qui à fais quoi ?

Enzo: mise en place de l'architecture de base du projet, du front et de la base mongoDB

Audrey:
Mise en place de l’authentification :
Une validation des champs email/name/password ainsi qu’un salage du mot de passe sont mis en place. Le mot de passe et le sel sont hashés pour des besoin de sécurité et de respect de la protection des données personnelles (conf « userService.js).
La mise en place d’un token d’authentification renforce la sécurité de l’application en s’assurant que les sessions ouvertes par le front ont un token possedant une signature valide.  Pour les besoins du TP, le token d’acces est stocké en BDD (permettant une révocation du token à tout moment) et paramettré pour une durée d’expiration de 1min (accessTokenService.js). Passé ce délai un refreshToken  (tokenService.js) prend le relai pour prolonger la session de 3 jours, il est lui aussi persisté en base. La génération des token se fait à chaque inscription et connexion. Ces tokens sont hashés et transmis dans le body des requête ou dans  les header/Authorization/Bearer sur les routes protégées via « apiFetch ».
La mécanique peut être facilement testée côté UX en se connectant à un compte utilisateur, attendre 1min et emprunter une route protégée. Le résultat observé est l’echec de la première requête de connexion, puis une requête portant le refresh token se lance avec succé, pour enchainer avec une nouvelle requête de connexion en succé.
Mise en place PoW 
Pour freiner les risque de spam, un Middleware PoW (Preuve de travail) est mis en place côté back (pow.js)  sur les routes signup et login. 
Dans le fichier « app.js », le front se chargera des fonctions sha256Hex(),  getFingerPrint() construire les en-têtes (X-Timestamp/X-Fingerprint/X-Pow-Nonce/X-Pow-Solution) et de les insérer dans les requêtes POST.  
Des variables d’environnement sont rajoutées dans « env.js » avec des valeurs par default qui pourront être ajusté par la suite.
Mise en place le rate limiter
Pour se prémunir des risques d’attaque de type brute force, les endpoints sensibles sont protégés grace à un Middleware rate limiter. Des entêtes sont ajoutés aux requêtes, elles permettent de définir le quota total d’appel autorisé depuis une fenêtre, le nombre de requête restantes avant la limite définie, le temps défini avant que la fenêtre se referme et l’indication du temps défni pour relancer l’opération une fois la limite atteinte. Ce mécanisme est représenté dans le fichier « rateLimit.js ». Les limites sont  ajustées au global pour 100 requêtes/min/IP et plus strictement sur les routes liées à l’authentification à 10 requêtes par minute. 
Ces valeurs pourront être ajustées au travers des variables présentes dans le fichier « env.js » (rateLimiteWindowsMs/rateLimitMax/authRateLimitWindowMs/authRateLimitMax).
Exemple de script de type snipped pour tester  la protection de l’authentification :
async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}
async function getFingerprint() {
  const ua = navigator.userAgent || '';
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  return sha256Hex(`${ua}|${tz}`);
}
async function buildPowHeaders(difficulty = 3) {
  const timestamp = new Date().toISOString();
  const fp = await getFingerprint();
  const prefix = '0'.repeat(Math.max(1, difficulty));
  let nonce = 0;
  while (true) {
    const h = await sha256Hex(fp + timestamp + String(nonce));
    if (h.startsWith(prefix)) {
      return {
        'X-Timestamp': timestamp,
        'X-Fingerprint': fp,
        'X-PoW-Nonce': String(nonce),
        'X-PoW-Solution': h,
      };
    }
    nonce++;
  }
}
async function spamLogin({ email, password, tries = 12, difficulty = 3 }) {
  const body = JSON.stringify({ email, password });
  for (let i = 1; i <= tries; i++) {
    try {
      const pow = await buildPowHeaders(difficulty);
      const res = await fetch('http://localhost:8080/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...pow },
        body,
      });
      console.log(
        `try ${i}`,
        'status=', res.status,
        'remaining=', res.headers.get('x-ratelimit-remaining'),
        'limit=', res.headers.get('x-ratelimit-limit'),
        'retry-after=', res.headers.get('retry-after'),
      );
    } catch (e) {
      console.error(`try ${i} error:`, e);
    }
  }
}
(async () => {
  await spamLogin({ email: 'ton.email@example.com', password: 'tonMotDePasse', tries: 12, difficulty: 3 });
})();


Gestion des erreurs :
Mise en place d’un Middleware d’erreurs (errorHandler.js) à la racine du projet qui centralise la réponse JSON. Le détail des types d’erreurs est défini par la librairie « AppError » (errors.js). Les logs d’erreurs seront adaptés en fonction de l’environnement : si « production » un message standard, si « developpement » un message plus détaillé.
Des encapsulations d’erreur sont intégrés dans des fonctions sensibles des services tel que :
–	createUser() et updateUser(): risque de doublou/collision en complément des vérifications
–	addFavorite() et removeFavorite() : si User n’existe pas
–	createRefreshToken() et revokeRefreshToken() : en cas d’echec d’enregistrement en BDD



Laurie: mise en place du microservice pour la gestion des images 

# TP Mini Leboncoin

Ce dépôt contient le backend et le frontend réalisés pour le TP Mini Leboncoin.

- `mini-leboncoin-back` : API Node.js/Express avec MongoDB (driver natif).
- `mini-leboncoin-front` : interface web statique (HTML/CSS/JS) consommant l'API.

Consultez les README dédiés dans chaque dossier pour les instructions détaillées.
