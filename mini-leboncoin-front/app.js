const DEFAULT_API_URL = 'http://localhost:8080/api';

const API_BASE_URL = DEFAULT_API_URL;
const API_ORIGIN = API_BASE_URL.replace(/\/?api\/?$/, '');

const state = {
  token: localStorage.getItem('miniLbc:token') ?? null,
  user: null,
  favorites: new Set(),
  pagination: null,
};

const elements = {
  status: document.getElementById('status'),
  signupForm: document.getElementById('signup-form'),
  loginForm: document.getElementById('login-form'),
  logoutBtn: document.getElementById('logout-btn'),
  authSection: document.getElementById('auth-section'),
  userSection: document.getElementById('user-section'),
  userName: document.getElementById('user-name'),
  userEmail: document.getElementById('user-email'),
  createAdSection: document.getElementById('create-ad-section'),
  createAdForm: document.getElementById('create-ad-form'),
  filtersForm: document.getElementById('filters-form'),
  adsList: document.getElementById('ads-list'),
  adTemplate: document.getElementById('ad-card-template'),
  paginationInfo: document.getElementById('pagination-info'),
  favoritesList: document.getElementById('favorites-list'),
  refreshFavsBtn: document.getElementById('refresh-favs-btn'),
  statusTimeout: null,
};

function setStatus(message, type = 'info', persist = false) {
  if (!elements.status) return;
  elements.status.textContent = message ?? '';
  elements.status.dataset.type = type;
  if (elements.statusTimeout) {
    clearTimeout(elements.statusTimeout);
    elements.statusTimeout = null;
  }
  if (!persist && message) {
    elements.statusTimeout = setTimeout(() => {
      elements.status.textContent = '';
    }, 4000);
  }
}

async function apiFetch(path, { method = 'GET', body, headers = {}, skipAuth = false } = {}) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const finalHeaders = { ...headers };

  if (!(body instanceof FormData) && body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (!skipAuth && state.token) {
    finalHeaders.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  let payload = null;
  if (isJson) {
    payload = await response.json();
  } else {
    payload = await response.text();
  }

  if (!response.ok) {
    const error = new Error(payload?.message ?? response.statusText);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function absoluteFromApi(path) {
  if (!path) {
    return null;
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_ORIGIN}${normalized}`;
}

function persistState() {
  if (state.token) {
    localStorage.setItem('miniLbc:token', state.token);
  } else {
    localStorage.removeItem('miniLbc:token');
  }
}

function updateAuthUI() {
  const isAuthenticated = Boolean(state.token && state.user);
  elements.authSection.classList.toggle('hidden', isAuthenticated);
  elements.userSection.classList.toggle('hidden', !isAuthenticated);
  elements.createAdSection.classList.toggle('hidden', !isAuthenticated);

  if (isAuthenticated) {
    elements.userName.textContent = state.user.name ?? 'Utilisateur';
    elements.userEmail.textContent = state.user.email ?? '';
  } else {
    elements.favoritesList.innerHTML = '';
    state.favorites = new Set();
  }
}

function normalizeAds(ads) {
  return (ads ?? []).map((ad) => ({
    ...ad,
    id: ad.id ?? ad._id?.toString?.() ?? String(ad._id),
    ownerId: ad.ownerId ?? ad.owner?.id ?? ad.owner?._id?.toString?.(),
    images: Array.isArray(ad.images) ? ad.images : [],
  }));
}

function renderFavorites(favorites) {
  const normalized = normalizeAds(favorites);
  elements.favoritesList.innerHTML = '';
  if (normalized.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Aucun favori pour le moment.';
    elements.favoritesList.append(li);
    return;
  }

  normalized.forEach((ad) => {
    const li = document.createElement('li');
    li.textContent = `${ad.title} – ${ad.price ?? 0}€ (${ad.city ?? ''})`;
    elements.favoritesList.append(li);
  });
}

function renderAds({ ads = [], pagination }) {
  const normalized = normalizeAds(ads);
  elements.adsList.innerHTML = '';

  if (normalized.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Aucune annonce pour le moment.';
    elements.adsList.append(empty);
  }

  normalized.forEach((ad) => {
    const card = createAdCard(ad);
    elements.adsList.append(card);
  });

  if (pagination) {
    elements.paginationInfo.textContent = `Page ${pagination.page} / ${Math.max(1, pagination.pageCount)} · ${pagination.total} annonces`;
  } else {
    elements.paginationInfo.textContent = '';
  }
}

function formatDate(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

function createTag(text) {
  const span = document.createElement('span');
  span.className = 'tag';
  span.textContent = text;
  return span;
}

function createAdCard(ad) {
  const fragment = elements.adTemplate.content.cloneNode(true);
  const card = fragment.querySelector('.ad-card');
  const imageContainer = card.querySelector('.ad-image');
  const title = card.querySelector('.ad-title');
  const price = card.querySelector('.ad-price');
  const meta = card.querySelector('.ad-meta');
  const description = card.querySelector('.ad-description');
  const tags = card.querySelector('.ad-tags');
  const actions = card.querySelector('.ad-actions');
  const messagesPanel = card.querySelector('.ad-messages');
  const messageForm = card.querySelector('.message-form');
  const messageList = card.querySelector('.message-list');
  const summary = messagesPanel.querySelector('summary');
  const recipientField = messageForm.querySelector('.message-recipient-field');
  const recipientSelect = messageForm.querySelector('.message-recipient');

  title.textContent = ad.title;
  price.textContent = `${Number(ad.price ?? 0).toFixed(2)} €`;
  meta.textContent = `${ad.city ?? 'Ville inconnue'} · ${ad.category ?? 'Catégorie'} · Posté le ${formatDate(ad.createdAt)}`;
  description.textContent = ad.description ?? '';

  tags.innerHTML = '';
  tags.append(createTag(ad.category ?? 'Catégorie'));
  tags.append(createTag(ad.city ?? 'Ville'));

  if (Array.isArray(ad.images) && ad.images.length > 0) {
    const first = ad.images[0];
    const imagePath = first.url ?? (first.path ? `/uploads/${first.path}` : null);
    const src = absoluteFromApi(imagePath);
    if (src) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = ad.title;
      imageContainer.innerHTML = '';
      imageContainer.append(img);
    } else {
      imageContainer.textContent = 'Pas d’image';
    }
  } else {
    imageContainer.textContent = 'Pas d’image';
  }

  actions.innerHTML = '';
  const isOwner = state.user && ad.ownerId && state.user.id === ad.ownerId;
  const isAuthenticated = Boolean(state.user);

  if (isAuthenticated && !isOwner) {
    const isFavorite = state.favorites.has(ad.id);
    const favBtn = document.createElement('button');
    favBtn.type = 'button';
    favBtn.textContent = isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris';
    favBtn.classList.toggle('secondary', isFavorite);
    favBtn.addEventListener('click', async () => {
      try {
        if (state.favorites.has(ad.id)) {
          await apiFetch(`/ads/${ad.id}/favorite`, { method: 'DELETE' });
          state.favorites.delete(ad.id);
          favBtn.textContent = 'Ajouter aux favoris';
          favBtn.classList.remove('secondary');
        } else {
          await apiFetch(`/ads/${ad.id}/favorite`, { method: 'POST' });
          state.favorites.add(ad.id);
          favBtn.textContent = 'Retirer des favoris';
          favBtn.classList.add('secondary');
        }
        await loadFavorites();
        setStatus('Favoris mis à jour');
      } catch (error) {
        console.error(error);
        setStatus(error.message ?? 'Impossible de mettre à jour les favoris', 'error');
      }
    });
    actions.append(favBtn);
  }

  if (isOwner) {
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Supprimer';
    deleteBtn.classList.add('secondary');
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('Supprimer cette annonce ?')) return;
      try {
        await apiFetch(`/ads/${ad.id}`, { method: 'DELETE' });
        setStatus('Annonce supprimée');
        await loadAds();
        await loadFavorites();
      } catch (error) {
        console.error(error);
        setStatus(error.message ?? 'Erreur lors de la suppression', 'error');
      }
    });
    actions.append(deleteBtn);
  }

  if (!isAuthenticated) {
    messagesPanel.classList.add('hidden');
  } else if (isOwner) {
    summary.textContent = 'Messagerie annonce';
    messageList.classList.remove('hidden');
    messageForm.classList.remove('hidden');
    if (recipientField) {
      recipientField.classList.remove('hidden');
    }

    messagesPanel.addEventListener('toggle', async () => {
      if (messagesPanel.open) {
        await loadMessagesForAd(ad.id, messageList, recipientSelect);
      }
    });

    messageForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(messageForm);
      const content = formData.get('content');
      const recipientId = formData.get('recipientId');
      if (!recipientId) {
        setStatus('Sélectionnez un destinataire avant d’envoyer.', 'error');
        return;
      }
      if (!content || !String(content).trim()) {
        setStatus('Le message est vide', 'error');
        return;
      }

      try {
        const selectedRecipient = recipientId;
        await apiFetch(`/ads/${ad.id}/messages`, {
          method: 'POST',
          body: {
            content: String(content).trim(),
            recipientId: selectedRecipient,
          },
        });
        setStatus('Message envoyé');
        messageForm.reset();
        await loadMessagesForAd(ad.id, messageList, recipientSelect, selectedRecipient);
      } catch (error) {
        console.error(error);
        setStatus(error.message ?? 'Impossible d’envoyer le message', 'error');
      }
    });
  } else {
    summary.textContent = 'Messagerie vendeur';
    messageList.classList.remove('hidden');
    if (recipientField) {
      recipientField.classList.add('hidden');
    }

    messagesPanel.addEventListener('toggle', async () => {
      if (messagesPanel.open) {
        await loadMessagesForAd(ad.id, messageList, null);
      }
    });

    messageForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(messageForm);
      const content = formData.get('content');
      if (!content || !String(content).trim()) {
        setStatus('Le message est vide', 'error');
        return;
      }
      try {
        await apiFetch(`/ads/${ad.id}/messages`, {
          method: 'POST',
          body: { content: String(content).trim() },
        });
        setStatus('Message envoyé');
        messageForm.reset();
        if (messagesPanel.open) {
          await loadMessagesForAd(ad.id, messageList, null);
        }
      } catch (error) {
        console.error(error);
        setStatus(error.message ?? 'Impossible d’envoyer le message', 'error');
      }
    });
  }

  return card;
}

async function loadMessagesForAd(adId, target, recipientSelect, preferredRecipientId = null) {
  try {
    const data = await apiFetch(`/ads/${adId}/messages`);
    const messages = data?.messages ?? [];
    const participants = data?.participants ?? [];

    if (recipientSelect) {
      const previousSelection = preferredRecipientId ?? recipientSelect.value ?? '';
      recipientSelect.innerHTML = '';
      const submitButton = recipientSelect.form?.querySelector('button[type="submit"]');
      if (participants.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Aucun destinataire disponible';
        recipientSelect.append(option);
        recipientSelect.disabled = true;
        if (submitButton) {
          submitButton.disabled = true;
        }
      } else {
        recipientSelect.disabled = false;
        participants.forEach((participant, index) => {
          const option = document.createElement('option');
          option.value = participant.id;
          option.textContent = participant.name ?? participant.email ?? participant.id;
          if (previousSelection) {
            option.selected = previousSelection === participant.id;
          } else if (index === 0) {
            option.selected = true;
          }
          recipientSelect.append(option);
        });
        if (previousSelection && !participants.some((participant) => participant.id === previousSelection)) {
          recipientSelect.selectedIndex = 0;
        }
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    }

    target.innerHTML = '';
    if (messages.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Aucun message pour cette annonce.';
      target.append(li);
      return;
    }
    messages.forEach((message) => {
      const li = document.createElement('li');
      const isOutgoing = state.user && message.senderId === state.user.id;
      li.classList.add(isOutgoing ? 'message-outgoing' : 'message-incoming');
      const senderName = message.sender?.name ?? message.sender?.email ?? 'Utilisateur';
      const receiverName = message.receiver?.name ?? message.receiver?.email ?? 'Utilisateur';
      const direction = isOutgoing ? `Vous → ${receiverName}` : `${senderName} → Vous`;
      li.innerHTML = `<strong>${direction}</strong><br>${message.content}<br><small>${formatDate(message.createdAt)}</small>`;
      target.append(li);
    });
  } catch (error) {
    console.error(error);
    setStatus(error.message ?? 'Impossible de récupérer les messages', 'error');
  }
}

async function loadFavorites() {
  if (!state.token) return;
  try {
    const data = await apiFetch('/me/favorites');
    const favorites = data?.favorites ?? [];
    state.favorites = new Set(favorites.map((ad) => ad.id));
    renderFavorites(favorites);
  } catch (error) {
    console.error(error);
    setStatus('Impossible de charger les favoris', 'error');
  }
}

async function loadAds() {
  const params = new URLSearchParams(new FormData(elements.filtersForm));
  const queryString = params.toString();
  try {
    const data = await apiFetch(`/ads${queryString ? `?${queryString}` : ''}`);
    renderAds(data ?? {});
  } catch (error) {
    console.error(error);
    setStatus(error.message ?? 'Impossible de charger les annonces', 'error');
  }
}

async function refreshProfile() {
  if (!state.token) return;
  try {
    const data = await apiFetch('/me');
    state.user = data?.user ?? null;
    updateAuthUI();
    await loadFavorites();
  } catch (error) {
    console.error(error);
    setStatus('Session expirée, veuillez vous reconnecter.', 'error');
    await logout();
  }
}

async function logout() {
  state.token = null;
  state.user = null;
  persistState();
  updateAuthUI();
  setStatus('Déconnecté');
}

function serializeForm(form) {
  const data = new FormData(form);
  const result = {};
  for (const [key, value] of data.entries()) {
    if (value === '') continue;
    result[key] = value;
  }
  return result;
}

function readFilesAsDataUrls(fileList) {
  if (!fileList || fileList.length === 0) return Promise.resolve([]);
  const files = Array.from(fileList);
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }),
    ),
  );
}

function setupEventListeners() {
  elements.signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = serializeForm(elements.signupForm);
    try {
      const data = await apiFetch('/signup', { method: 'POST', body: payload, skipAuth: true });
      state.token = data?.token;
      state.user = data?.user;
      persistState();
      updateAuthUI();
      elements.signupForm.reset();
      setStatus('Compte créé, vous êtes connecté !');
      await loadFavorites();
    } catch (error) {
      console.error(error);
      setStatus(error.message ?? 'Inscription impossible', 'error');
    }
  });

  elements.loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = serializeForm(elements.loginForm);
    try {
      const data = await apiFetch('/login', { method: 'POST', body: payload, skipAuth: true });
      state.token = data?.token;
      state.user = data?.user;
      persistState();
      updateAuthUI();
      elements.loginForm.reset();
      setStatus('Connexion réussie');
      await loadFavorites();
    } catch (error) {
      console.error(error);
      setStatus(error.message ?? 'Connexion impossible', 'error');
    }
  });

  elements.logoutBtn.addEventListener('click', logout);

  elements.createAdForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = serializeForm(elements.createAdForm);
    try {
      const images = await readFilesAsDataUrls(elements.createAdForm.images.files);
      payload.price = Number(payload.price);
      payload.images = images;
      const data = await apiFetch('/ads', { method: 'POST', body: payload });
      setStatus('Annonce publiée');
      elements.createAdForm.reset();
      await loadAds();
      if (images.length > 0) {
        await loadFavorites();
      }
    } catch (error) {
      console.error(error);
      setStatus(error.message ?? 'Erreur lors de la création', 'error');
    }
  });

  elements.filtersForm.addEventListener('submit', (event) => {
    event.preventDefault();
    loadAds();
  });

  elements.refreshFavsBtn.addEventListener('click', async () => {
    await loadFavorites();
    setStatus('Favoris rafraîchis');
  });
}

async function init() {
  updateAuthUI();
  setupEventListeners();
  await loadAds();
  if (state.token) {
    await refreshProfile();
  }
}

init().catch((error) => {
  console.error(error);
  setStatus('Erreur lors de l’initialisation de l’application', 'error', true);
});
