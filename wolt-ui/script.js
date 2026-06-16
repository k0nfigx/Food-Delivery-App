const app = document.getElementById('app');
const cartCount = document.getElementById('cart-count');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const headerActions = document.getElementById('header-actions');
const authModal = document.getElementById('auth-modal');
const closeAuthBtn = document.getElementById('close-auth');
const authTabLogin = document.getElementById('auth-tab-login');
const authTabSignup = document.getElementById('auth-tab-signup');
const loginPane = document.getElementById('login-pane');
const signupPane = document.getElementById('signup-pane');
const switchToSignupBtn = document.getElementById('switch-to-signup');
const switchToLoginBtn = document.getElementById('switch-to-login');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginMessage = document.getElementById('login-message');
const signupName = document.getElementById('signup-name');
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');
const signupConfirm = document.getElementById('signup-confirm');
const signupMessage = document.getElementById('signup-message');
const headerAddress = document.getElementById('header-address');
const mapToggle = document.getElementById('map-toggle');
const locationDropdown = document.getElementById('location-dropdown');
const closeLocationBtn = document.getElementById('close-location');
const mapSearch = document.getElementById('map-search');
const mapSurface = document.getElementById('map-surface');
const mapLabel = document.getElementById('map-label');
const applyLocationBtn = document.getElementById('apply-location');

let spotlightResizeBound = false;
let deliveryMap = null;
let deliveryMarker = null;
let deliveryMapReady = false;
const DEFAULT_MAP_CENTER = [37.9838, 23.7275];
const DEFAULT_MAP_ZOOM = 13;

const state = {
  restaurants: [],
  cart: loadCart(),
  isLoggedIn: loadLoginState(),
  userName: loadUserName(),
  userAddress: loadUserAddress()
};

const SPOTLIGHT_SLIDES = [
  {
    title: 'Pizza Place',
    tag: 'Pizza',
    subtitle: 'Classic slices & wood-fired pies',
    image: 'https://foodish-api.com/images/pizza/pizza1.jpg',
    href: 'index.html?page=restaurant&id=1'
  },
  {
    title: 'Burger House',
    tag: 'Burgers',
    subtitle: 'Smash burgers & loaded fries',
    image: 'https://foodish-api.com/images/burger/burger1.jpg',
    href: 'index.html?page=restaurant&id=2'
  },
  {
    title: 'Smoothie Bar',
    tag: 'Smoothies',
    subtitle: 'Fresh blends & fruit bowls',
    image: 'images/berry-smoothie.jpg',
    href: 'index.html?page=restaurant&id=3'
  }
];

const FOOD_IMAGE_RULES = [
  { keywords: ['garlic bread', 'garlic'], image: 'images/garlic-bread.jpg' },
  { keywords: ['pizza', 'margherita', 'pepperoni'], image: 'https://foodish-api.com/images/pizza/pizza1.jpg' },
  { keywords: ['burger'], image: 'https://foodish-api.com/images/burger/burger1.jpg' },
  { keywords: ['fries', 'fry'], image: 'images/loaded-fries.jpg' },
  { keywords: ['milkshake', 'shake'], image: 'images/milkshake.jpg' },
  { keywords: ['smoothie', 'berry'], image: 'images/berry-smoothie.jpg' },
  { keywords: ['salad', 'bowl', 'avocado', 'power'], image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&h=400&q=80' },
  { keywords: ['healthy', 'green'], image: 'https://foodish-api.com/images/rice/rice1.jpg' }
];

function getFoodImage(source = {}, fallbackImage = '') {
  if (source.image) {
    return source.image;
  }

  const text = `${source.name || ''} ${source.description || ''} ${source.category || ''}`.toLowerCase();
  const match = FOOD_IMAGE_RULES.find((rule) => rule.keywords.some((keyword) => text.includes(keyword)));

  return match?.image || fallbackImage || FOOD_IMAGE_RULES[0].image;
}

function foodImageTag(source, label, className = '') {
  const image = getFoodImage(source, source.image);
  const classAttr = className ? ` class="${className}"` : '';
  return `<img src="${image}" alt="${label}" loading="lazy"${classAttr} onerror="this.onerror=null;this.src='${FOOD_IMAGE_RULES[0].image}';" />`;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function loadRestaurants() {
  return fetch('data.json')
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load restaurants (${res.status})`);
      }
      return res.json();
    })
    .then((data) => {
      if (!Array.isArray(data) || !data.length) {
        throw new Error('Restaurant data is empty');
      }
      state.restaurants = data;
      hydrateCartImages();
      render();
    })
    .catch((err) => {
      app.innerHTML = '<p class="empty-state">Unable to load restaurants right now. If you opened this file directly, run it through a local server.</p>';
      console.error(err);
    });
}

loadRestaurants();

app.addEventListener('click', (event) => {
  const prev = event.target.closest('.spotlight-prev');
  const next = event.target.closest('.spotlight-next');
  if (prev || next) {
    const viewport = document.getElementById('spotlight-viewport');
    const track = document.getElementById('spotlight-track');
    if (!viewport || !track) {
      return;
    }

    const slide = track.querySelector('.spotlight-slide');
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap) || 14;
    const step = slide ? slide.offsetWidth + gap : 300;
    viewport.scrollBy({ left: (prev ? -step : step), behavior: 'smooth' });
    return;
  }

  const addButton = event.target.closest('[data-add-item]');
  if (addButton) {
    addToCart(addButton.dataset.addItem);
    return;
  }

  const qtyButton = event.target.closest('[data-qty]');
  if (qtyButton) {
    updateQty(
      qtyButton.dataset.qty,
      Number(qtyButton.dataset.delta),
      qtyButton.dataset.restaurant
    );
  }
});

function openLoginPanel() {
  if (state.isLoggedIn) {
    logoutUser();
    return;
  }

  openAuthModal('login');
  closeMobileMenu();
}

function openSignupPanel() {
  if (state.isLoggedIn) {
    return;
  }

  openAuthModal('signup');
  closeMobileMenu();
}

loginBtn.addEventListener('click', openLoginPanel);
signupBtn?.addEventListener('click', openSignupPanel);
authTabLogin?.addEventListener('click', () => switchAuthTab('login'));
authTabSignup?.addEventListener('click', () => switchAuthTab('signup'));
switchToSignupBtn?.addEventListener('click', () => switchAuthTab('signup'));
switchToLoginBtn?.addEventListener('click', () => switchAuthTab('login'));

if (mobileMenuToggle && headerActions) {
  mobileMenuToggle.addEventListener('click', () => {
    const isOpen = headerActions.classList.toggle('open');
    mobileMenuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', (event) => {
    if (!headerActions.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
      closeMobileMenu();
    }
  });
}

function closeMobileMenu() {
  if (headerActions) {
    headerActions.classList.remove('open');
  }
  if (mobileMenuToggle) {
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
  }
}

closeAuthBtn?.addEventListener('click', closeAuthModal);

authModal?.addEventListener('click', (event) => {
  if (event.target === authModal) {
    closeAuthModal();
  }
});

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    loginMessage.textContent = 'Please enter both email and password.';
    return;
  }

  if (!email.includes('@')) {
    loginMessage.textContent = 'Please enter a valid email address.';
    return;
  }

  const registeredUser = findRegisteredUser(email);
  if (registeredUser && registeredUser.password !== password) {
    loginMessage.textContent = 'Incorrect password for this account.';
    return;
  }

  signInUser(email, registeredUser?.name);
  loginForm.reset();
  loginMessage.textContent = '';
});

signupForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = signupName.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPassword.value;
  const confirmPassword = signupConfirm.value;

  if (!name || !email || !password || !confirmPassword) {
    signupMessage.textContent = 'Please fill in every field.';
    return;
  }

  if (!email.includes('@')) {
    signupMessage.textContent = 'Please enter a valid email address.';
    return;
  }

  if (password.length < 6) {
    signupMessage.textContent = 'Password must be at least 6 characters.';
    return;
  }

  if (password !== confirmPassword) {
    signupMessage.textContent = 'Passwords do not match.';
    return;
  }

  if (findRegisteredUser(email)) {
    signupMessage.textContent = 'An account with this email already exists.';
    return;
  }

  saveRegisteredUser({ name, email, password });
  signInUser(email, name);
  signupForm.reset();
  signupMessage.textContent = '';
});

updateLoginUI();

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem('wolt-cart') || '[]');
  } catch {
    return [];
  }
}

function hydrateCartImages() {
  state.cart = state.cart.map((item) => ({
    ...item,
    image: item.image || getFoodImage(item)
  }));
  if (state.cart.length) {
    saveCart();
  }
}

function loadRegisteredUsers() {
  try {
    const users = JSON.parse(localStorage.getItem('wolt-users') || '[]');
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function saveRegisteredUsers(users) {
  localStorage.setItem('wolt-users', JSON.stringify(users));
}

function findRegisteredUser(email) {
  const normalizedEmail = email.trim().toLowerCase();
  return loadRegisteredUsers().find((user) => user.email === normalizedEmail);
}

function saveRegisteredUser(user) {
  const users = loadRegisteredUsers();
  users.push({
    name: user.name.trim(),
    email: user.email.trim().toLowerCase(),
    password: user.password
  });
  saveRegisteredUsers(users);
}

function signInUser(email, preferredName = '') {
  state.isLoggedIn = true;
  state.userName = preferredName || email.split('@')[0];
  saveLoginState();
  updateLoginUI();
  closeAuthModal();
  render();
}

function loadLoginState() {
  return localStorage.getItem('wolt-login') === 'true';
}

function loadUserName() {
  return localStorage.getItem('wolt-user') || '';
}

function loadUserAddress() {
  return localStorage.getItem('wolt-address') || '';
}

function saveLoginState() {
  localStorage.setItem('wolt-login', String(state.isLoggedIn));
  localStorage.setItem('wolt-user', state.userName || '');
  localStorage.setItem('wolt-address', state.userAddress || '');
}

function saveCart() {
  localStorage.setItem('wolt-cart', JSON.stringify(state.cart));
}

function updateLoginUI() {
  if (state.isLoggedIn && state.userName) {
    loginBtn.textContent = `Hi, ${state.userName}`;
    loginBtn.classList.add('logged-in');
    if (signupBtn) {
      signupBtn.hidden = true;
    }
  } else {
    loginBtn.textContent = 'Log in';
    loginBtn.classList.remove('logged-in');
    if (signupBtn) {
      signupBtn.hidden = false;
    }
  }
}

if (headerAddress) {
  headerAddress.value = state.userAddress || '';
  headerAddress.addEventListener('change', () => {
    state.userAddress = headerAddress.value.trim();
    saveLoginState();
    render();
  });
}

if (mapToggle && locationDropdown) {
  mapToggle.addEventListener('click', () => {
    const isOpen = locationDropdown.classList.toggle('open');
    mapToggle.setAttribute('aria-expanded', String(isOpen));
    locationDropdown.toggleAttribute('hidden', !isOpen);
    if (isOpen) {
      mapSearch?.focus();
      initDeliveryMap();
      refreshDeliveryMapSize();
    }
  });
}

if (closeLocationBtn && locationDropdown) {
  closeLocationBtn.addEventListener('click', () => {
    locationDropdown.classList.remove('open');
    locationDropdown.setAttribute('hidden', '');
    mapToggle?.setAttribute('aria-expanded', 'false');
  });
}

if (mapSearch) {
  mapSearch.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      searchAddressOnMap();
    }
  });
}

if (applyLocationBtn) {
  applyLocationBtn.addEventListener('click', applyLocationFromSearch);
}

function initDeliveryMap() {
  if (!mapSurface || typeof L === 'undefined') {
    return;
  }

  const mapContainer = document.getElementById('delivery-map');
  if (!mapContainer) {
    return;
  }

  if (!deliveryMapReady) {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    });

    deliveryMap = L.map(mapContainer, {
      zoomControl: true,
      attributionControl: true
    }).setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(deliveryMap);

    deliveryMap.on('click', (event) => {
      setMapPin(event.latlng.lat, event.latlng.lng);
      reverseGeocode(event.latlng.lat, event.latlng.lng);
    });

    deliveryMapReady = true;
  }

  if (state.userAddress) {
    searchAddressOnMap(state.userAddress, { quiet: true });
  }
}

function refreshDeliveryMapSize() {
  if (!deliveryMap) {
    return;
  }

  window.requestAnimationFrame(() => {
    deliveryMap.invalidateSize();
  });
}

function setMapPin(lat, lng) {
  if (!deliveryMap) {
    return;
  }

  if (deliveryMarker) {
    deliveryMarker.setLatLng([lat, lng]);
  } else {
    deliveryMarker = L.marker([lat, lng]).addTo(deliveryMap);
  }

  deliveryMap.setView([lat, lng], Math.max(deliveryMap.getZoom(), 15), { animate: true });
}

async function searchAddressOnMap(query = mapSearch?.value.trim(), options = {}) {
  const address = query || mapSearch?.value.trim();
  if (!address) {
    if (!options.quiet && mapLabel) {
      mapLabel.textContent = 'Type an address first';
    }
    return;
  }

  if (!options.quiet && mapLabel) {
    mapLabel.textContent = 'Searching map...';
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      { headers: { Accept: 'application/json' } }
    );

    if (!response.ok) {
      throw new Error('Search failed');
    }

    const results = await response.json();
    if (!results.length) {
      if (!options.quiet && mapLabel) {
        mapLabel.textContent = 'Address not found on map';
      }
      return;
    }

    const lat = Number(results[0].lat);
    const lng = Number(results[0].lon);
    initDeliveryMap();
    setMapPin(lat, lng);

    if (mapSearch) {
      mapSearch.value = results[0].display_name;
    }

    if (mapLabel) {
      mapLabel.textContent = 'Pin placed on map';
    }
  } catch (error) {
    console.error(error);
    if (!options.quiet && mapLabel) {
      mapLabel.textContent = 'Could not search the map';
    }
  }
}

async function reverseGeocode(lat, lng) {
  if (mapLabel) {
    mapLabel.textContent = 'Finding address...';
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { Accept: 'application/json' } }
    );

    if (!response.ok) {
      throw new Error('Reverse geocode failed');
    }

    const result = await response.json();
    const address = result.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    if (mapSearch) {
      mapSearch.value = address;
    }

    if (mapLabel) {
      mapLabel.textContent = 'Pin placed on map';
    }
  } catch (error) {
    console.error(error);
    if (mapLabel) {
      mapLabel.textContent = 'Pin placed on map';
    }
  }
}

function applyLocationFromSearch() {
  const typedAddress = mapSearch?.value.trim() || headerAddress?.value.trim();
  if (!typedAddress) {
    mapLabel.textContent = 'Type an address first';
    return;
  }

  state.userAddress = typedAddress;
  if (headerAddress) {
    headerAddress.value = typedAddress;
  }
  saveLoginState();
  render();
  mapLabel.textContent = `Address ready: ${typedAddress}`;
  locationDropdown.classList.remove('open');
  locationDropdown.setAttribute('hidden', '');
  mapToggle?.setAttribute('aria-expanded', 'false');
}

function switchAuthTab(mode = 'login') {
  const isSignup = mode === 'signup';

  authTabLogin?.classList.toggle('active', !isSignup);
  authTabSignup?.classList.toggle('active', isSignup);
  authTabLogin?.setAttribute('aria-selected', String(!isSignup));
  authTabSignup?.setAttribute('aria-selected', String(isSignup));

  if (loginPane) {
    loginPane.toggleAttribute('hidden', isSignup);
  }
  if (signupPane) {
    signupPane.toggleAttribute('hidden', !isSignup);
  }

  loginMessage.textContent = '';
  if (signupMessage) {
    signupMessage.textContent = '';
  }

  if (isSignup) {
    signupName?.focus();
  } else {
    loginEmail?.focus();
  }
}

function openAuthModal(mode = 'login') {
  authModal?.classList.add('open');
  authModal?.removeAttribute('hidden');
  switchAuthTab(mode);
}

function closeAuthModal() {
  authModal?.classList.remove('open');
  authModal?.setAttribute('hidden', '');
  loginMessage.textContent = '';
  if (signupMessage) {
    signupMessage.textContent = '';
  }
}

function logoutUser() {
  state.isLoggedIn = false;
  state.userName = '';
  state.userAddress = '';
  localStorage.removeItem('wolt-login');
  localStorage.removeItem('wolt-user');
  localStorage.removeItem('wolt-address');
  if (headerAddress) {
    headerAddress.value = '';
  }
  updateLoginUI();
  render();
}

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function updateCartBadge() {
  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
}

function addToCart(menuItemId) {
  const restaurant = getCurrentRestaurant();
  if (!restaurant) return;

  const item = restaurant.menu.find((entry) => entry.id === Number(menuItemId));
  if (!item) return;

  const existing = state.cart.find((entry) => entry.id === item.id && entry.restaurantId === restaurant.id);

  if (existing) {
    existing.quantity += 1;
    if (!existing.image) {
      existing.image = getFoodImage(item, restaurant.image);
    }
  } else {
    state.cart.push({
      id: item.id,
      restaurantId: restaurant.id,
      name: item.name,
      price: item.price,
      image: getFoodImage(item, restaurant.image),
      quantity: 1
    });
  }

  saveCart();
  updateCartBadge();
  render();
}

function updateQty(itemKey, delta, restaurantId) {
  const match = state.cart.find((entry) => {
    if (restaurantId != null && entry.restaurantId != null) {
      return entry.id === Number(itemKey) && entry.restaurantId === Number(restaurantId);
    }
    return entry.id === Number(itemKey);
  });
  if (!match) return;

  match.quantity += delta;

  if (match.quantity <= 0) {
    state.cart = state.cart.filter((entry) => {
      if (restaurantId != null && entry.restaurantId != null) {
        return !(entry.id === Number(itemKey) && entry.restaurantId === Number(restaurantId));
      }
      return entry.id !== Number(itemKey);
    });
  }

  saveCart();
  updateCartBadge();
  render();
}

function getCurrentRestaurant() {
  const params = new URLSearchParams(window.location.search);
  const restaurantId = Number(params.get('id'));
  return state.restaurants.find((restaurant) => restaurant.id === restaurantId);
}

function updateSpotlightArrows() {
  const viewport = document.getElementById('spotlight-viewport');
  const prev = document.querySelector('.spotlight-prev');
  const next = document.querySelector('.spotlight-next');

  if (!viewport || !prev || !next) {
    return;
  }

  const maxScroll = viewport.scrollWidth - viewport.clientWidth;
  prev.disabled = viewport.scrollLeft <= 4;
  next.disabled = viewport.scrollLeft >= maxScroll - 4;
}

function initSpotlightCarousel() {
  const viewport = document.getElementById('spotlight-viewport');
  if (!viewport) {
    return;
  }

  if (viewport.dataset.bound !== 'true') {
    viewport.dataset.bound = 'true';
    viewport.addEventListener('scroll', updateSpotlightArrows, { passive: true });
  }

  updateSpotlightArrows();

  if (!spotlightResizeBound) {
    window.addEventListener('resize', updateSpotlightArrows);
    spotlightResizeBound = true;
  }
}

function render() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get('page') || 'home';

  if (page === 'cart') {
    renderCartPage();
  } else if (page === 'restaurant') {
    renderRestaurantPage();
  } else {
    renderHomePage();
  }

  updateCartBadge();
  initSpotlightCarousel();
}

function renderSpotlightCarousel() {
  return `
    <section class="spotlight-carousel" aria-label="Featured food spots">
      <div class="spotlight-head">
        <p class="eyebrow">Explore categories</p>
        <h2>Popular spots to try tonight</h2>
      </div>
      <div class="spotlight-shell">
        <button class="spotlight-arrow spotlight-prev" type="button" aria-label="Show previous spots">‹</button>
        <div class="spotlight-viewport" id="spotlight-viewport">
          <div class="spotlight-track" id="spotlight-track">
            ${SPOTLIGHT_SLIDES.map((slide) => `
              <a class="spotlight-slide" href="${slide.href}">
                ${foodImageTag(slide, slide.title)}
                <div class="spotlight-slide-copy">
                  <span class="spotlight-tag">${slide.tag}</span>
                  <strong>${slide.title}</strong>
                  <span class="spotlight-subtitle">${slide.subtitle}</span>
                </div>
              </a>
            `).join('')}
          </div>
        </div>
        <button class="spotlight-arrow spotlight-next" type="button" aria-label="Show next spots">›</button>
      </div>
    </section>
  `;
}

function renderHomePage() {
  app.innerHTML = `
    ${renderSpotlightCarousel()}

    ${state.userAddress ? `
      <section class="panel nearby-panel">
        <p class="eyebrow">Nearest picks</p>
        <h3>Suggested for ${escapeHtml(state.userAddress)}</h3>
        <p class="meta">These are the closest-style picks from your saved delivery area, ready for quick ordering.</p>
        <div class="grid nearby-grid">
          ${state.restaurants.slice(0, 3).map((restaurant, index) => `
            <article class="card nearby-card">
              ${foodImageTag(restaurant, restaurant.name)}
              <div class="card-body">
                <p class="meta">${restaurant.category} • ${restaurant.deliveryTime} • ⭐ ${restaurant.rating}</p>
                <h3>${restaurant.name}</h3>
                <p>${restaurant.description}</p>
                <span class="badge nearest-badge">Nearby stop ${index + 1}</span>
              </div>
            </article>
          `).join('')}
        </div>
      </section>
    ` : ''}

    <section>
      <h3>Restaurants</h3>
      <div class="grid">
        ${state.restaurants.map((restaurant) => `
          <article class="card">
            ${foodImageTag(restaurant, restaurant.name)}
            <div class="card-body">
              <p class="meta">${restaurant.category} • ⭐ ${restaurant.rating}</p>
              <h3>${restaurant.name}</h3>
              <p>${restaurant.description}</p>
              <div class="btn-row">
                <a class="btn" href="index.html?page=restaurant&id=${restaurant.id}">View menu</a>
                <a class="ghost-btn" href="index.html?page=cart">Go to cart</a>
              </div>
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderRestaurantPage() {
  const restaurant = getCurrentRestaurant();

  if (!restaurant) {
    app.innerHTML = '<p class="empty-state">This restaurant is not available right now.</p>';
    return;
  }

  app.innerHTML = `
    <section class="restaurant-layout">
      <article class="panel restaurant-hero">
        ${foodImageTag(restaurant, restaurant.name, 'restaurant-hero-image')}
        <div class="restaurant-hero-copy">
          <p class="eyebrow">Restaurant page</p>
          <h2>${restaurant.name}</h2>
          <p>${restaurant.description}</p>
          <p class="meta">${restaurant.category} • ${restaurant.deliveryTime} • ⭐ ${restaurant.rating}</p>
          <div class="btn-row">
            <a class="ghost-btn" href="index.html">Back to home</a>
            <a class="btn" href="index.html?page=cart">Open cart</a>
          </div>
        </div>
      </article>

      <aside class="panel">
        <h3>Menu</h3>
        <div class="menu-list">
          ${restaurant.menu.map((item) => `
            <article class="menu-item">
              ${foodImageTag(item, item.name, 'menu-item-thumb')}
              <div class="menu-item-copy">
                <h4>${item.name}</h4>
                <p>${item.description}</p>
              </div>
              <div class="menu-item-actions">
                <strong class="price-tag">${formatCurrency(item.price)}</strong>
                <button class="btn" data-add-item="${item.id}">Add to cart</button>
              </div>
            </article>
          `).join('')}
        </div>
      </aside>
    </section>
  `;
}

function renderCartPage() {
  if (!state.cart.length) {
    app.innerHTML = `
      <section class="empty-state">
        <p class="eyebrow">Cart</p>
        <h2>Your cart is empty.</h2>
        <p>Add a few dishes from the restaurant page to see them here.</p>
        <a class="btn" href="index.html">Browse restaurants</a>
      </section>
    `;
    return;
  }

  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  app.innerHTML = `
    <section class="restaurant-layout">
      <article class="panel">
        <p class="eyebrow">Cart</p>
        <h2>Your order</h2>
        <div class="cart-grid">
          ${state.cart.map((item) => `
            <article class="cart-card">
              ${foodImageTag(item, item.name, 'cart-card-thumb')}
              <div class="cart-card-copy">
                <strong>${item.name}</strong>
                <span class="meta">${formatCurrency(item.price)} each</span>
              </div>
              <div class="qty-wrap">
                <button class="qty-btn" data-qty="${item.id}" data-restaurant="${item.restaurantId}" data-delta="-1">−</button>
                <strong>${item.quantity}</strong>
                <button class="qty-btn" data-qty="${item.id}" data-restaurant="${item.restaurantId}" data-delta="1">+</button>
              </div>
            </article>
          `).join('')}
        </div>
      </article>

      <aside class="summary-box">
        <h3>Summary</h3>
        <p>Subtotal: ${formatCurrency(total)}</p>
        <p>Delivery: ${formatCurrency(3.5)}</p>
        <p>Total: ${formatCurrency(total + 3.5)}</p>
        <button class="btn" type="button">Checkout</button>
      </aside>
    </section>
  `;
}
