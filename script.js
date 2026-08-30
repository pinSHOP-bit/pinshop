/* ==========================================================
   MM2 SHOP — Telegram Mini App
   ========================================================== */

const ADMIN_ID = 8560869637; // ваш Telegram ID — админ-панель видна только вам

const tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) {
  tg.ready();
  tg.expand();
}

/* ---------------- Хранилище товаров (localStorage) ---------------- */

const STORAGE_KEY = "mm2_products";
const CART_KEY = "mm2_cart";

function defaultProducts() {
  return [
    { id: cryptoId(), name: "Chroma Lightbringer", category: "knife", price: 1500, desc: "Редкий хромированный нож с переливающимся эффектом.", image: "" },
    { id: cryptoId(), name: "Corrupt", category: "knife", price: 900, desc: "Тёмный godly-нож с фиолетовым свечением.", image: "" },
    { id: cryptoId(), name: "Ghost Knife", category: "knife", price: 650, desc: "Полупрозрачный призрачный нож.", image: "" },
    { id: cryptoId(), name: "Heat", category: "gun", price: 1200, desc: "Огненный пистолет с эффектом пламени.", image: "" },
    { id: cryptoId(), name: "Nightmare", category: "gun", price: 1100, desc: "Godly-оружие с чёрно-фиолетовой текстурой.", image: "" },
    { id: cryptoId(), name: "Chroma Bat", category: "pet", price: 800, desc: "Хромированный питомец-летучая мышь.", image: "" },
    { id: cryptoId(), name: "Shadow Dominus", category: "pet", price: 2000, desc: "Легендарный питомец Shadow Dominus.", image: "" },
    { id: cryptoId(), name: "Godly Bundle #1", category: "bundle", price: 3200, desc: "Набор из 3 godly-предметов со скидкой.", image: "" }
  ];
}

function cryptoId() {
  return "p_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function loadProducts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = defaultProducts();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try { return JSON.parse(raw); } catch (e) { return defaultProducts(); }
}

function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function loadCart() {
  const raw = localStorage.getItem(CART_KEY);
  try { return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

let products = loadProducts();
let cart = loadCart();
let currentCategory = "all";
let currentSearch = "";
let currentModalProductId = null;
let currentQty = 1;

const CATEGORY_LABELS = { knife: "Ножи", gun: "Оружие", pet: "Питомцы", bundle: "Наборы" };
const CATEGORY_ICONS = { knife: "🔪", gun: "🔫", pet: "🐾", bundle: "🎁" };

/* ---------------- Снег на фоне ---------------- */

function initSnow() {
  const canvas = document.getElementById("snow-canvas");
  const ctx = canvas.getContext("2d");
  let flakes = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const count = Math.floor((window.innerWidth * window.innerHeight) / 9000);
  for (let i = 0; i < count; i++) {
    flakes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.5 + 1,
      speed: Math.random() * 1 + 0.4,
      drift: Math.random() * 1 - 0.5,
      opacity: Math.random() * 0.5 + 0.4,
      sway: Math.random() * Math.PI * 2
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const f of flakes) {
      f.sway += 0.01;
      f.x += f.drift + Math.sin(f.sway) * 0.4;
      f.y += f.speed;

      if (f.y > canvas.height) { f.y = -5; f.x = Math.random() * canvas.width; }
      if (f.x > canvas.width) f.x = 0;
      if (f.x < 0) f.x = canvas.width;

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 200, 255, ${f.opacity})`;
      ctx.shadowColor = "rgba(157, 78, 221, 0.6)";
      ctx.shadowBlur = 4;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
}

/* ---------------- Рендер каталога ---------------- */

function getProductVisual(product, size) {
  if (product.image) {
    return `background-image:url('${product.image}')`;
  }
  return "";
}

function renderProducts() {
  const grid = document.getElementById("products-grid");
  const emptyState = document.getElementById("empty-state");
  grid.innerHTML = "";

  const filtered = products.filter(p => {
    const matchesCategory = currentCategory === "all" || p.category === currentCategory;
    const matchesSearch = p.name.toLowerCase().includes(currentSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
  }

  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-card-img" style="${getProductVisual(p)}">
        ${p.image ? "" : CATEGORY_ICONS[p.category] || "🎮"}
      </div>
      <div class="product-card-name">${escapeHtml(p.name)}</div>
      <div class="product-card-category">${CATEGORY_LABELS[p.category] || ""}</div>
      <div class="product-card-price">${p.price} ₽</div>
    `;
    card.addEventListener("click", () => openProductModal(p.id));
    grid.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------------- Модалка товара ---------------- */

function openProductModal(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  currentModalProductId = id;
  currentQty = 1;

  document.getElementById("modal-product-img").style.cssText = getProductVisual(product);
  document.getElementById("modal-product-img").textContent = product.image ? "" : (CATEGORY_ICONS[product.category] || "🎮");
  document.getElementById("modal-product-name").textContent = product.name;
  document.getElementById("modal-product-category").textContent = CATEGORY_LABELS[product.category] || "";
  document.getElementById("modal-product-desc").textContent = product.desc || "";
  document.getElementById("modal-product-price").textContent = product.price + " ₽";
  document.getElementById("qty-value").textContent = currentQty;

  showOverlay("product-modal-overlay");
}

/* ---------------- Корзина ---------------- */

function addToCart(productId, qty) {
  const existing = cart.find(c => c.productId === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ productId, qty });
  }
  saveCart(cart);
  updateCartCount();
}

function removeFromCart(productId) {
  cart = cart.filter(c => c.productId !== productId);
  saveCart(cart);
  updateCartCount();
  renderCart();
}

function updateCartCount() {
  const total = cart.reduce((sum, c) => sum + c.qty, 0);
  document.getElementById("cart-count").textContent = total;
}

function renderCart() {
  const container = document.getElementById("cart-items");
  const emptyEl = document.getElementById("cart-empty");
  container.innerHTML = "";

  if (cart.length === 0) {
    emptyEl.classList.remove("hidden");
  } else {
    emptyEl.classList.add("hidden");
  }

  let total = 0;
  cart.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return;
    total += product.price * item.qty;

    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div class="cart-item-img" style="${getProductVisual(product)}">
        ${product.image ? "" : (CATEGORY_ICONS[product.category] || "🎮")}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(product.name)}</div>
        <div class="cart-item-meta">${item.qty} × ${product.price} ₽</div>
      </div>
      <button class="cart-item-remove" data-remove="${product.id}">✕</button>
    `;
    container.appendChild(row);
  });

  document.getElementById("cart-total").textContent = total;

  container.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => removeFromCart(btn.dataset.remove));
  });
}

function checkout() {
  if (cart.length === 0) return;

  const order = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    return { name: product ? product.name : "unknown", price: product ? product.price : 0, qty: item.qty };
  });

  const payload = {
    type: "order",
    userId: tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : null,
    items: order,
    total: order.reduce((sum, i) => sum + i.price * i.qty, 0)
  };

  if (tg) {
    // Отправляем заказ боту (обрабатывается на стороне бота через web_app_data)
    tg.sendData(JSON.stringify(payload));
  } else {
    alert("Заказ сформирован:\n" + JSON.stringify(payload, null, 2) + "\n\n(откройте приложение внутри Telegram, чтобы заказ ушёл боту)");
  }

  cart = [];
  saveCart(cart);
  updateCartCount();
  renderCart();
  hideOverlay("cart-modal-overlay");
}

/* ---------------- Админ-панель ---------------- */

function isAdmin() {
  if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) return false;
  return tg.initDataUnsafe.user.id === ADMIN_ID;
}

function initAdminAccess() {
  if (isAdmin()) {
    document.getElementById("admin-btn").classList.remove("hidden");
  }
}

function renderAdminProductsList() {
  const list = document.getElementById("admin-products-list");
  list.innerHTML = "";

  products.forEach(p => {
    const row = document.createElement("div");
    row.className = "admin-product-row";
    row.innerHTML = `
      <div class="cart-item-img" style="${getProductVisual(p)}">
        ${p.image ? "" : (CATEGORY_ICONS[p.category] || "🎮")}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(p.name)}</div>
        <div class="cart-item-meta">${CATEGORY_LABELS[p.category]} · ${p.price} ₽</div>
      </div>
      <div class="admin-product-actions">
        <button class="btn-edit" data-edit="${p.id}">✎</button>
        <button class="btn-delete" data-delete="${p.id}">🗑</button>
      </div>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => startEditProduct(btn.dataset.edit));
  });
  list.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", () => deleteProduct(btn.dataset.delete));
  });
}

function startEditProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  document.getElementById("edit-product-id").value = product.id;
  document.getElementById("product-name").value = product.name;
  document.getElementById("product-category").value = product.category;
  document.getElementById("product-price").value = product.price;
  document.getElementById("product-desc").value = product.desc || "";
  document.getElementById("product-image-url").value = product.image || "";

  const preview = document.getElementById("image-preview");
  if (product.image) {
    preview.src = product.image;
    preview.classList.remove("hidden");
  } else {
    preview.classList.add("hidden");
  }

  document.getElementById("submit-product-btn").textContent = "Сохранить изменения";
  document.getElementById("cancel-edit-btn").classList.remove("hidden");

  switchAdminTab("add");
}

function cancelEdit() {
  document.getElementById("add-product-form").reset();
  document.getElementById("edit-product-id").value = "";
  document.getElementById("submit-product-btn").textContent = "Добавить товар";
  document.getElementById("cancel-edit-btn").classList.add("hidden");
  document.getElementById("image-preview").classList.add("hidden");
}

function deleteProduct(id) {
  if (!confirm("Удалить этот товар?")) return;
  products = products.filter(p => p.id !== id);
  saveProducts(products);
  renderAdminProductsList();
  renderProducts();
}

function handleProductFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("edit-product-id").value;
  const name = document.getElementById("product-name").value.trim();
  const category = document.getElementById("product-category").value;
  const price = parseInt(document.getElementById("product-price").value, 10) || 0;
  const desc = document.getElementById("product-desc").value.trim();
  const imageUrl = document.getElementById("product-image-url").value.trim();
  const fileInput = document.getElementById("product-image-file");

  function finalize(imageValue) {
    if (id) {
      const product = products.find(p => p.id === id);
      if (product) {
        product.name = name;
        product.category = category;
        product.price = price;
        product.desc = desc;
        if (imageValue !== undefined && imageValue !== "") product.image = imageValue;
      }
    } else {
      products.push({
        id: cryptoId(),
        name, category, price, desc,
        image: imageValue || ""
      });
    }
    saveProducts(products);
    renderAdminProductsList();
    renderProducts();
    cancelEdit();
  }

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = () => finalize(reader.result);
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    finalize(imageUrl);
  }
}

function switchAdminTab(tab) {
  document.querySelectorAll(".admin-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  document.getElementById("admin-tab-add").classList.toggle("hidden", tab !== "add");
  document.getElementById("admin-tab-manage").classList.toggle("hidden", tab !== "manage");
  if (tab === "manage") renderAdminProductsList();
}

/* ---------------- Утилиты модалок ---------------- */

function showOverlay(id) {
  document.getElementById(id).classList.remove("hidden");
}
function hideOverlay(id) {
  document.getElementById(id).classList.add("hidden");
}

/* ---------------- Инициализация событий ---------------- */

function initEvents() {
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => hideOverlay(btn.dataset.close));
  });

  document.getElementById("search-input").addEventListener("input", (e) => {
    currentSearch = e.target.value;
    renderProducts();
  });

  document.getElementById("categories").addEventListener("click", (e) => {
    const chip = e.target.closest(".category-chip");
    if (!chip) return;
    document.querySelectorAll(".category-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    currentCategory = chip.dataset.category;
    renderProducts();
  });

  document.getElementById("cart-btn").addEventListener("click", () => {
    renderCart();
    showOverlay("cart-modal-overlay");
  });

  document.getElementById("admin-btn").addEventListener("click", () => {
    showOverlay("admin-modal-overlay");
    switchAdminTab("add");
  });

  document.getElementById("qty-minus").addEventListener("click", () => {
    if (currentQty > 1) currentQty--;
    document.getElementById("qty-value").textContent = currentQty;
  });
  document.getElementById("qty-plus").addEventListener("click", () => {
    currentQty++;
    document.getElementById("qty-value").textContent = currentQty;
  });

  document.getElementById("add-to-cart-btn").addEventListener("click", () => {
    if (!currentModalProductId) return;
    addToCart(currentModalProductId, currentQty);
    hideOverlay("product-modal-overlay");
  });

  document.getElementById("checkout-btn").addEventListener("click", checkout);

  document.querySelectorAll(".admin-tab").forEach(btn => {
    btn.addEventListener("click", () => switchAdminTab(btn.dataset.tab));
  });

  document.getElementById("add-product-form").addEventListener("submit", handleProductFormSubmit);
  document.getElementById("cancel-edit-btn").addEventListener("click", cancelEdit);

  document.getElementById("product-image-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const preview = document.getElementById("image-preview");
      preview.src = reader.result;
      preview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("product-image-url").addEventListener("input", (e) => {
    const preview = document.getElementById("image-preview");
    if (e.target.value) {
      preview.src = e.target.value;
      preview.classList.remove("hidden");
    } else {
      preview.classList.add("hidden");
    }
  });
}

/* ---------------- Старт ---------------- */

window.addEventListener("DOMContentLoaded", () => {
  initSnow();
  initAdminAccess();
  initEvents();
  renderProducts();
  updateCartCount();
});
