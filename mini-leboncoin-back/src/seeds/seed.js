import process from 'node:process';
import { connectMongo, disconnectMongo, getCollection } from '../config/mongo.js';
import { ensureIndexes } from '../config/indexes.js';
import { hashPassword } from '../utils/password.js';
import { createAd } from '../services/adService.js';
import { addFavorite } from '../services/favoriteService.js';
import { createMessage } from '../services/messageService.js';

const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const userSeeds = [
  { name: 'Alice Martin', email: 'alice@example.com', password: 'Password123!' },
  { name: 'Bruno Lefevre', email: 'bruno@example.com', password: 'Password123!' },
  { name: 'Chloé Dupont', email: 'chloe@example.com', password: 'Password123!' },
];

const adSeeds = [
  { title: 'Vélo de route carbone', category: 'Sport', city: 'Paris', price: 1200, description: 'Vélo carbone taille M, excellent état, très léger.' },
  { title: 'Canapé 3 places', category: 'Maison', city: 'Lyon', price: 350, description: 'Canapé en tissu gris, convertible. A retirer sur place.' },
  { title: 'MacBook Pro 2021', category: 'Informatique', city: 'Marseille', price: 1800, description: 'MacBook Pro M1 Pro 16 pouces, 16 Go RAM, état impeccable.' },
  { title: 'Cours particuliers de maths', category: 'Services', city: 'Toulouse', price: 25, description: 'Professeur propose soutien scolaire en maths pour lycée.' },
  { title: 'Guitare électrique Fender', category: 'Musique', city: 'Bordeaux', price: 650, description: 'Fender Stratocaster made in USA, housse incluse.' },
  { title: 'Table à manger scandinave', category: 'Maison', city: 'Nantes', price: 420, description: 'Table en bois clair 6 personnes, style nordique.' },
  { title: 'Smartphone Android récent', category: 'Informatique', city: 'Nice', price: 480, description: 'Smartphone Android 256 Go, excellent état, facture fournie.' },
  { title: 'Montre connectée', category: 'Sport', city: 'Montpellier', price: 150, description: 'Montre connectée multi-sports, étanche, GPS intégré.' },
  { title: 'Cours de guitare débutant', category: 'Services', city: 'Paris', price: 35, description: 'Cours individuels de guitare pour débutants, matériel fourni.' },
  { title: 'Lot de BD Tintin', category: 'Loisirs', city: 'Rennes', price: 90, description: 'Lot de 12 bandes dessinées Tintin, très bon état.' },
  { title: 'Lampadaire design', category: 'Maison', city: 'Lille', price: 110, description: 'Lampadaire design industriel, ampoule LED incluse.' },
  { title: 'Chaise de bureau ergonomique', category: 'Maison', city: 'Grenoble', price: 220, description: 'Chaise réglable, support lombaire, idéale télétravail.' },
  { title: 'Appareil photo hybride', category: 'Photo', city: 'Strasbourg', price: 900, description: 'Hybride APS-C avec objectif 18-55, parfait pour débuter.' },
  { title: 'Cours de yoga en ligne', category: 'Services', city: 'Dijon', price: 15, description: 'Cours collectif de yoga en visio, tous niveaux.' },
  { title: 'Console de jeux dernière génération', category: 'Loisirs', city: 'Paris', price: 520, description: 'Console avec deux manettes et 3 jeux récents.' },
];

async function seed() {
  await connectMongo();
  await ensureIndexes();

  const usersCollection = getCollection('users');
  const adsCollection = getCollection('ads');
  const messagesCollection = getCollection('messages');

  await Promise.all([
    usersCollection.deleteMany({}),
    adsCollection.deleteMany({}),
    messagesCollection.deleteMany({}),
  ]);

  const now = new Date();
  const usersDocs = userSeeds.map(({ name, email, password }) => {
    const { salt, hash } = hashPassword(password);
    return {
      name,
      email: email.toLowerCase(),
      passwordHash: hash,
      salt,
      favorites: [],
      createdAt: now,
      updatedAt: now,
    };
  });

  const insertedUsers = await usersCollection.insertMany(usersDocs);
  const userIds = Object.values(insertedUsers.insertedIds);

  const ads = [];
  for (let index = 0; index < adSeeds.length; index += 1) {
    const ownerId = userIds[index % userIds.length];
    const seed = adSeeds[index];
    const images = index % 3 === 0 ? [PLACEHOLDER_IMAGE] : [];
    // Utilise le service pour garantir la même logique métier
    const ad = await createAd(ownerId, { ...seed, images });
    ads.push(ad);
  }

  // Favoris : chaque utilisateur ajoute deux annonces aux favoris
  for (let i = 0; i < userIds.length; i += 1) {
    const userId = userIds[i];
    const ad1 = ads[i];
    const ad2 = ads[(i + 3) % ads.length];
    await addFavorite(userId, ad1._id);
    await addFavorite(userId, ad2._id);
  }

  // Messages d'exemple
  if (ads.length > 0) {
    await createMessage(ads[0]._id, userIds[1], { content: 'Bonjour, l’article est-il toujours disponible ?' });
    await createMessage(ads[0]._id, userIds[2], { content: 'Pouvez-vous faire un prix si retrait rapide ?' });
    await createMessage(ads[1]._id, userIds[0], { content: 'Intéressé par le canapé, possible de passer ce week-end ?' });
  }

  console.log(`Seed terminé : ${usersDocs.length} utilisateurs, ${ads.length} annonces, messages d’exemple.`);
}

seed()
  .catch((error) => {
    console.error('Erreur lors du seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
  });
