const app = document.getElementById('app');
const cartCount = document.getElementById('cart-count');
const loginBtn = document.getElementById('login-btn');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const headerActions = document.getElementById('header-actions');
const loginModal = document.getElementById('login-modal');
const closeLoginBtn = document.getElementById('close-login');
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginMessage = document.getElementById('login-message');
const headerAddress = document.getElementById('header-address');
const mapToggle = document.getElementById('map-toggle');
const locationDropdown = document.getElementById('location-dropdown');
const closeLocationBtn = document.getElementById('close-location');
const mapSearch = document.getElementById('map-search');
const mapSurface = document.getElementById('map-surface');
const mapPin = document.getElementById('map-pin');
const mapLabel = document.getElementById('map-label');
const applyLocationBtn = document.getElementById('apply-location');

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
    image: 'https://picsum.photos/seed/pizzaspot/900/520',
    href: 'index.html?page=restaurant&id=1'
  },
  {
    title: 'Burger House',
    tag: 'Burgers',
    subtitle: 'Smash burgers & loaded fries',
    image: 'https://picsum.photos/seed/burgerspot/900/520',
    href: 'index.html?page=restaurant&id=2'
  },
  {
    title: 'Smoothie Bar',
    tag: 'Smoothies',
    subtitle: 'Fresh blends & fruit bowls',
    image: 'https://picsum.photos/seed/smoothiespot/900/520',
    href: 'index.html?page=restaurant&id=3'
  }
];

fetch('data.json')
  .then((res) => res.json())
  .then((data) => {
    state.restaurants = data;
    render();
  })
  .catch((err) => {
    app.innerHTML = '<p class="empty-state">Unable to load restaurants right now.</p>';
    console.error(err);
  });

app.addEventListener('click', (event) => {
  const addButton = event.target.closest('[data-add-item]');
  if (addButton) {
    addToCart(addButton.dataset.addItem);
    return;
  }

  const qtyButton = event.target.closest('[data-qty]');
  if (qtyButton) {
    updateQty(qtyButton.dataset.qty, Number(qtyButton.dataset.delta));
  }
});

function openLoginPanel() {
  if (state.isLoggedIn) {
    logoutUser();
    return;
  }

  openLoginModal();
  closeMobileMenu();
}

loginBtn.addEventListener('click', openLoginPanel);

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

closeLoginBtn.addEventListener('click', closeLoginModal);

loginModal.addEventListener('click', (event) => {
  if (event.target === loginModal) {
    closeLoginModal();
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

  state.isLoggedIn = true;
  state.userName = email.split('@')[0];
  saveLoginState();
  updateLoginUI();
  closeLoginModal();
  render();
  loginForm.reset();
  loginMessage.textContent = '';
});

updateLoginUI();

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem('wolt-cart') || '[]');
  } catch {
    return [];
  }
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
  } else {
    loginBtn.textContent = 'Log in';
    loginBtn.classList.remove('logged-in');
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
    locationDropdown.setAttribute('aria-hidden', String(!isOpen));
    if (isOpen) {
      mapSearch?.focus();
    }
  });
}

if (closeLocationBtn && locationDropdown) {
  closeLocationBtn.addEventListener('click', () => {
    locationDropdown.classList.remove('open');
    locationDropdown.setAttribute('aria-hidden', 'true');
  });
}

if (mapSearch) {
  mapSearch.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyLocationFromSearch();
    }
  });
}

if (applyLocationBtn) {
  applyLocationBtn.addEventListener('click', applyLocationFromSearch);
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
  locationDropdown.setAttribute('aria-hidden', 'true');
}

if (mapSurface) {
  mapSurface.addEventListener('click', (event) => {
    const rect = mapSurface.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    if (mapPin) {
      mapPin.style.left = `${Math.min(92, Math.max(8, x))}%`;
      mapPin.style.top = `${Math.min(92, Math.max(8, y))}%`;
    }

    if (mapLabel) {
      mapLabel.textContent = 'Pin placed on map';
    }
  });
}

function openLoginModal() {
  loginModal.classList.add('open');
  loginModal.setAttribute('aria-hidden', 'false');
  loginEmail.focus();
}

function closeLoginModal() {
  loginModal.classList.remove('open');
  loginModal.setAttribute('aria-hidden', 'true');
  loginMessage.textContent = '';
}

function logoutUser() {
  state.isLoggedIn = false;
  state.userName = '';
  state.userAddress = '';
  localStorage.removeItem('wolt-login');
  localStorage.removeItem('wolt-user');
  localStorage.removeItem('wolt-address');
  updateLoginUI();
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
  } else {
    state.cart.push({
      id: item.id,
      restaurantId: restaurant.id,
      name: item.name,
      price: item.price,
      quantity: 1
    });
  }

  saveCart();
  updateCartBadge();
  render();
}

function updateQty(itemKey, delta) {
  const match = state.cart.find((entry) => entry.id === Number(itemKey));
  if (!match) return;

  match.quantity += delta;

  if (match.quantity <= 0) {
    state.cart = state.cart.filter((entry) => entry.id !== Number(itemKey));
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
                <img src="${slide.image}" alt="${slide.title}" loading="lazy" />
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

function initSpotlightCarousel() {
  const viewport = document.getElementById('spotlight-viewport');
  const track = document.getElementById('spotlight-track');
  const prev = document.querySelector('.spotlight-prev');
  const next = document.querySelector('.spotlight-next');

  if (!viewport || !track || !prev || !next) {
    return;
  }

  const scrollStep = () => {
    const slide = track.querySelector('.spotlight-slide');
    if (!slide) {
      return 300;
    }

    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap) || 14;
    return slide.offsetWidth + gap;
  };

  const updateArrows = () => {
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    prev.disabled = viewport.scrollLeft <= 4;
    next.disabled = viewport.scrollLeft >= maxScroll - 4;
  };

  prev.addEventListener('click', () => {
    viewport.scrollBy({ left: -scrollStep(), behavior: 'smooth' });
  });

  next.addEventListener('click', () => {
    viewport.scrollBy({ left: scrollStep(), behavior: 'smooth' });
  });

  viewport.addEventListener('scroll', updateArrows, { passive: true });
  updateArrows();

  if (!window.__spotlightResizeBound) {
    window.addEventListener('resize', () => {
      const activeViewport = document.getElementById('spotlight-viewport');
      const activePrev = document.querySelector('.spotlight-prev');
      const activeNext = document.querySelector('.spotlight-next');
      if (!activeViewport || !activePrev || !activeNext) {
        return;
      }

      const maxScroll = activeViewport.scrollWidth - activeViewport.clientWidth;
      activePrev.disabled = activeViewport.scrollLeft <= 4;
      activeNext.disabled = activeViewport.scrollLeft >= maxScroll - 4;
    });
    window.__spotlightResizeBound = true;
  }
}

function renderHomePage() {
  app.innerHTML = `
    ${renderSpotlightCarousel()}

    ${state.userAddress ? `
      <section class="panel nearby-panel">
        <p class="eyebrow">Nearest picks</p>
        <h3>Suggested for ${state.userAddress}</h3>
        <p class="meta">These are the closest-style picks from your saved delivery area, ready for quick ordering.</p>
        <div class="grid nearby-grid">
          ${state.restaurants.slice(0, 3).map((restaurant, index) => `
            <article class="card nearby-card">
              <img src="${restaurant.image}" alt="${restaurant.name}" />
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
            <img src="${restaurant.image}" alt="${restaurant.name}" />
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
      <article class="panel">
        <p class="eyebrow">Restaurant page</p>
        <h2>${restaurant.name}</h2>
        <p>${restaurant.description}</p>
        <p class="meta">${restaurant.category} • ${restaurant.deliveryTime} • ⭐ ${restaurant.rating}</p>
        <div class="btn-row">
          <a class="ghost-btn" href="index.html">Back to home</a>
          <a class="btn" href="index.html?page=cart">Open cart</a>
        </div>
      </article>

      <aside class="panel">
        <h3>Menu</h3>
        <div class="menu-list">
          ${restaurant.menu.map((item) => `
            <article class="menu-item">
              <div>
                <h4>${item.name}</h4>
                <p>${item.description}</p>
              </div>
              <div style="text-align:right; display:grid; gap:6px; justify-items:end;">
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
              <div>
                <strong>${item.name}</strong>
                <span class="meta">${formatCurrency(item.price)} each</span>
              </div>
              <div class="qty-wrap">
                <button class="qty-btn" data-qty="${item.id}" data-delta="-1">−</button>
                <strong>${item.quantity}</strong>
                <button class="qty-btn" data-qty="${item.id}" data-delta="1">+</button>
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
