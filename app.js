const defaultMenu = [
  { id: 1, name: "Бургер", price: 250, category: "Еда", description: "Сочный бургер", rating: 5, reviews: 0 },
  { id: 2, name: "Пицца", price: 450, category: "Еда", description: "Пицца с сыром", rating: 5, reviews: 0 },
  { id: 3, name: "Латте", price: 180, category: "Напитки", description: "Кофе с молоком", rating: 5, reviews: 0 },
  { id: 4, name: "Картофель фри", price: 150, category: "Еда", description: "Хрустящий картофель", rating: 5, reviews: 0 },
  { id: 5, name: "Кола", price: 100, category: "Напитки", description: "Холодный напиток", rating: 5, reviews: 0 }
];

function loadJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

let menu = loadJSON("menu", defaultMenu);
let orders = loadJSON("orders", []);
let favorites = loadJSON("favorites", []);
let cart = loadJSON("cart", []);
let revenue = Number(localStorage.getItem("revenue")) || 0;
let currentFilter = "Все";
let searchText = "";
let currentLanguage = localStorage.getItem("language") || "ru";

const translations = {
  ru: {
    dashboard: "Главная",
    menu: "Меню",
    orders: "Заказы",
    cashier: "Касса",
    settings: "Настройки",
    add: "Добавить",
    delete: "Удалить",
    favorite: "В избранное",
    search: "Поиск блюда...",
    all: "Все",
    empty: "Корзина пуста",
    checkout: "Оформить заказ"
  },
  ky: {
    dashboard: "Башкы бет",
    menu: "Меню",
    orders: "Буйрутмалар",
    cashier: "Касса",
    settings: "Жөндөөлөр",
    add: "Кошуу",
    delete: "Өчүрүү",
    favorite: "Тандалгандарга",
    search: "Тамак издөө...",
    all: "Баары",
    empty: "Себет бош",
    checkout: "Буйрутма берүү"
  },
  en: {
    dashboard: "Dashboard",
    menu: "Menu",
    orders: "Orders",
    cashier: "Cashier",
    settings: "Settings",
    add: "Add",
    delete: "Delete",
    favorite: "Favorite",
    search: "Search food...",
    all: "All",
    empty: "Cart is empty",
    checkout: "Place order"
  }
};

function t(key) {
  return translations[currentLanguage]?.[key] || translations.ru[key] || key;
}

function saveData() {
  localStorage.setItem("menu", JSON.stringify(menu));
  localStorage.setItem("orders", JSON.stringify(orders));
  localStorage.setItem("cart", JSON.stringify(cart));
  localStorage.setItem("favorites", JSON.stringify(favorites));
  localStorage.setItem("revenue", String(revenue));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function showPage(page) {
  document.querySelectorAll(".page").forEach(section => {
    section.classList.add("hidden");
  });

  const selectedPage = document.getElementById(page);
  if (selectedPage) {
    selectedPage.classList.remove("hidden");
  }

  const titles = {
    dashboard: t("dashboard"),
    menu: t("menu"),
    orders: t("orders"),
    cashier: t("cashier"),
    favorites: "Избранное",
    admin: "Админ-панель",
    settings: t("settings"),
    reservations: "🪑 Бронирование столиков"
  };

  const title = document.getElementById("pageTitle");
  if (title) {
    title.textContent = titles[page] || page;
  }

  renderMenu();
  renderCart();
  renderOrders();
  updateDashboard();

  if (typeof renderFavorites === "function") {
    renderFavorites();
  }

  if (page === "reservations") {
    if (typeof renderReservations === "function") {
      renderReservations();
    }
  }
}

function setupMenuControls() {
  const menuSection = document.getElementById("menu");
  const menuList = document.getElementById("menuList");

  if (!menuSection || !menuList || document.getElementById("menuControls")) return;

  const controls = document.createElement("div");
  controls.id = "menuControls";
  controls.className = "panel";

  controls.innerHTML = `
    <input id="foodSearch" placeholder="${t("search")}" />
    <select id="foodFilter">
      <option value="Все">${t("all")}</option>
      <option value="Еда">Еда</option>
      <option value="Напитки">Напитки</option>
    </select>
    <button id="favoritesFilter">⭐ Избранное</button>
    <button id="allFoods">🍽️ Все блюда</button>
  `;

  menuList.before(controls);

  document.getElementById("foodSearch").addEventListener("input", event => {
    searchText = event.target.value.toLowerCase();
    renderMenu();
  });

  document.getElementById("foodFilter").addEventListener("change", event => {
    currentFilter = event.target.value;
    renderMenu();
  });

  document.getElementById("favoritesFilter").addEventListener("click", () => {
    renderMenu(true);
  });

  document.getElementById("allFoods").addEventListener("click", () => {
    renderMenu(false);
  });
}

let showFavoritesOnly = false;

function renderMenu(forceFavorites) {
  const menuList = document.getElementById("menuList");
  if (!menuList) return;

  if (typeof forceFavorites === "boolean") {
    showFavoritesOnly = forceFavorites;
  }

  const filteredMenu = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchText);
    const matchesCategory = currentFilter === "Все" || item.category === currentFilter;
    const matchesFavorites = !showFavoritesOnly || favorites.includes(item.id);
    return matchesSearch && matchesCategory && matchesFavorites;
  });

  menuList.innerHTML = filteredMenu.map(item => `
    <div class="product">
  <img class="food-image"
       src="${getFoodImage(item.name)}"
       alt="${escapeHTML(item.name)}"
       loading="lazy">
  <h3>${escapeHTML(item.name)}</h3>
      
      <p>${escapeHTML(item.description || "")}</p>
      <p>⭐ ${item.rating || 5} (${item.reviews || 0} отзывов)</p>
      <button class="primary" onclick="addToCart(${item.id})">${t("add")}</button>
      <button onclick="toggleFavorite(${item.id})">
        ${favorites.includes(item.id) ? "❤️ В избранном" : "🤍 " + t("favorite")}
      </button>
      <button onclick="leaveReview(${item.id})">⭐ Оценить</button>
      <button onclick="deleteFood(${item.id})">🗑️ ${t("delete")}</button>
    </div>
  `).join("") || "<p>Блюда не найдены.</p>";

  const foodCount = document.getElementById("foodCount");
  if (foodCount) foodCount.textContent = menu.length;
}

function addFood() {
  const nameInput = document.getElementById("foodName");
  const priceInput = document.getElementById("foodPrice");

  const name = nameInput.value.trim();
  const price = Number(priceInput.value);

  if (!name || !Number.isFinite(price) || price <= 0) {
    alert("Введите название и правильную цену блюда.");
    return;
  }

  menu.push({
    id: Date.now(),
    name,
    price,
    category: "Еда",
    description: "Новое блюдо",
    rating: 5,
    reviews: 0
  });

  nameInput.value = "";
  priceInput.value = "";

  saveData();
  renderMenu();
  updateDashboard();
}

function deleteFood(id) {
  const item = menu.find(food => food.id === id);
  if (!item) return;

  if (!confirm(`Удалить блюдо «${item.name}»?`)) return;

  menu = menu.filter(food => food.id !== id);
  favorites = favorites.filter(favoriteId => favoriteId !== id);
  cart = cart.filter(food => food.id !== id);

  saveData();
  renderMenu();
  renderCart();
  updateDashboard();
}




function leaveReview(id) {
  const item = menu.find(food => food.id === id);
  if (!item) return;

  const answer = prompt("Поставьте оценку от 1 до 5:");
  if (answer === null || answer.trim() === "") return;

  const rating = Number(answer);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    alert("Введите число от 1 до 5.");
    return;
  }

  const oldCount = item.reviews || 0;
  item.rating = Number((((item.rating || 5) * oldCount + rating) / (oldCount + 1)).toFixed(1));
  item.reviews = oldCount + 1;

  saveData();
  renderMenu();
}

function toggleFavorite(id) {
  id = Number(id);

  if (favorites.includes(id)) {
    favorites = favorites.filter(favoriteId => favoriteId !== id);
  } else {
    favorites.push(id);
  }

  saveData();
  renderMenu();
  renderFavorites();
}

function renderFavorites() {
  const favoritesList = document.getElementById("favoritesList");
  if (!favoritesList) return;

  const favoriteFoods = menu.filter(item =>
    favorites.includes(Number(item.id))
  );

  favoritesList.innerHTML = favoriteFoods.map(item => `
    <div class="product">
      <img class="food-image"
           src="${getFoodImage(item.name)}"
           alt="${escapeHTML(item.name)}">

      <h3>${escapeHTML(item.name)}</h3>
      <p>${item.price} сом</p>

      <button class="primary"
              onclick="addToCart(${item.id})">
        🛒 Добавить в корзину
      </button>

      <button onclick="toggleFavorite(${item.id})">
        💔 Убрать из избранного
      </button>
    </div>
  `).join("") || "<p>В избранном пока нет блюд ❤️</p>";
}

function addToCart(id) {
  const item = menu.find(food => food.id === id);
  if (!item) return;

  cart.push({ ...item });
  saveData();
  renderCart();

  alert(`${item.name} добавлен в корзину!`);
}

function removeFromCart(index) {
  if (index < 0 || index >= cart.length) return;

  cart.splice(index, 1);
  saveData();
  renderCart();
}

function clearCart() {
  if (cart.length && !confirm("Очистить корзину?")) return;

  cart = [];
  saveData();
  renderCart();
}

function renderCart() {
  const cartElement = document.getElementById("cart");
  const totalElement = document.getElementById("total");

  if (!cartElement || !totalElement) return;

  if (!cart.length) {
    cartElement.innerHTML = `<p>${t("empty")}</p>`;
  } else {
    cartElement.innerHTML = cart.map((item, index) => `
      <div class="cart-item">
        <span>${escapeHTML(item.name)} — ${item.price} сом</span>
        <button onclick="removeFromCart(${index})">Удалить</button>
      </div>
    `).join("");
  }

  totalElement.textContent = cart.reduce((sum, item) => sum + item.price, 0);
}

function createOrder() {
  if (!cart.length) {
    alert("Сначала добавьте блюда в корзину!");
    return;
  }

  const order = {
    id: Date.now(),
    items: cart.map(item => ({ ...item })),
    total: cart.reduce((sum, item) => sum + item.price, 0),
    date: new Date().toLocaleString("ru-RU"),
    status: "Принят"
  };

  orders.unshift(order);
  revenue += order.total;
  cart = [];

  saveData();
  renderCart();
  renderOrders();
  updateDashboard();

  alert("Заказ успешно оформлен!");
  showPage("orders");
}

// Совместимость со старым названием функции
function placeOrder() {
  createOrder();
}

function renderOrders() {
  const ordersList = document.getElementById("ordersList");
  const recentOrders = document.getElementById("recentOrders");

  const orderHTML = orders.map(order => `
    <div class="panel order-item">
      <h3>Заказ №${String(order.id).slice(-5)}</h3>
      <p>${order.items.map(item => escapeHTML(item.name)).join(", ")}</p>
      <p>Сумма: ${order.total} сом</p>
      <p>Дата: ${escapeHTML(order.date)}</p>
      <label>Статус заказа</label>
      <select onchange="updateOrderStatus(${order.id}, this.value)">
        ${["Принят", "Готовится", "Готов", "Выдан", "Отменён"].map(status =>
          `<option ${order.status === status ? "selected" : ""}>${status}</option>`
        ).join("")}
      </select>
      <button onclick="deleteOrder(${order.id})">Удалить заказ</button>
    </div>
  `).join("");

  if (ordersList) {
    ordersList.innerHTML = orderHTML || "<p>Заказов пока нет.</p>";
  }

  if (recentOrders) {
    recentOrders.innerHTML = orders.length
      ? orders.slice(0, 3).map(order =>
          `<p>Заказ №${String(order.id).slice(-5)} — ${order.total} сом</p>`
        ).join("")
      : "Заказов пока нет";
  }
}

function updateOrderStatus(id, status) {
  const order = orders.find(item => item.id === id);
  if (!order) return;

  order.status = status;
  saveData();
  renderOrders();
}

function deleteOrder(id) {
  const order = orders.find(item => item.id === id);
  if (!order || !confirm("Удалить заказ?")) return;

  orders = orders.filter(item => item.id !== id);

  if (order.status !== "Отменён") {
    revenue = Math.max(0, revenue - order.total);
  }

  saveData();
  renderOrders();
  updateDashboard();
}

function updateDashboard() {
  const revenueElement = document.getElementById("revenue");
  const orderCount = document.getElementById("orderCount");
  const foodCount = document.getElementById("foodCount");

  if (revenueElement) revenueElement.textContent = `${revenue} сом`;
  if (orderCount) orderCount.textContent = orders.length;
  if (foodCount) foodCount.textContent = menu.length;
}

function saveSettings() {
  const input = document.getElementById("cafeName");
  if (!input || !input.value.trim()) {
    alert("Введите название кафе!");
    return;
  }

  const name = input.value.trim();
  localStorage.setItem("cafeName", name);
  document.title = `${name} — Управление кафе`;

  const title = document.getElementById("pageTitle");
  if (title && document.getElementById("dashboard") &&
      !document.getElementById("dashboard").classList.contains("hidden")) {
    title.textContent = name;
  }

  alert("Название кафе сохранено!");
}

function loadSettings() {
  const name = localStorage.getItem("cafeName");
  const input = document.getElementById("cafeName");

  if (name && input) input.value = name;
  if (name) document.title = `${name} — Управление кафе`;
}

function setupExtraSettings() {
  const settingsPage = document.getElementById("settings");
  if (!settingsPage || document.getElementById("extraSettings")) return;

  const panel = document.createElement("div");
  panel.id = "extraSettings";
  panel.className = "panel";
  panel.innerHTML = `
    <h3>Дополнительные настройки</h3>
    <label>Язык / Language / Тил</label>
    <select id="languageSelect">
      <option value="ru">Русский</option>
      <option value="ky">Кыргызча</option>
      <option value="en">English</option>
    </select>
    <button id="themeButton" class="primary">🌙 Переключить тему</button>
  `;

  settingsPage.appendChild(panel);

  const languageSelect = document.getElementById("languageSelect");
  languageSelect.value = currentLanguage;

  languageSelect.addEventListener("change", event => {
    currentLanguage = event.target.value;
    localStorage.setItem("language", currentLanguage);
    renderMenu();
    renderCart();
    showPage("settings");
  });

  document.getElementById("themeButton").addEventListener("click", toggleTheme);
}

function loadTheme() {
  if (localStorage.getItem("darkTheme") === "true") {
    document.body.classList.add("dark-theme");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupMenuControls();
  setupExtraSettings();
  loadSettings();
  loadTheme();

  renderMenu();
  renderCart();
  renderOrders();
  updateDashboard();
});
function changeLanguage() {
    const lang = document.getElementById("languageSelect").value;
    localStorage.setItem("cafeLanguage", lang);

    const translations = {
        ru: {
            dashboard: "Главная",
            menu: "Меню",
            orders: "Заказы",
            cashier: "Касса",
            favorites: "Избранное",
            admin: "Админ-панель",
            settings: "Настройки"
        },
        en: {
            dashboard: "Dashboard",
            menu: "Menu",
            orders: "Orders",
            cashier: "Cashier",
            favorites: "Favorites",
            admin: "Admin panel",
            settings: "Settings"
        },
        ky: {
            dashboard: "Башкы бет",
            menu: "Меню",
            orders: "Заказдар",
            cashier: "Касса",
            favorites: "Тандалгандар",
            admin: "Админ панели",
            settings: "Жөндөөлөр"
        }
    };

    document.querySelectorAll(".sidebar button").forEach(button => {
        const match = button.getAttribute("onclick")?.match(/showPage\('([^']+)'\)/);
        if (match && translations[lang][match[1]]) {
            button.textContent = translations[lang][match[1]];
        }
    });
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-theme");

  localStorage.setItem("darkTheme", isDark ? "true" : "false");

  const button = document.getElementById("themeButton");

  if (button) {
    button.textContent = isDark
      ? "☀️ Светлая тема"
      : "🌙 Ночная тема";
  }
}

function loadTheme() {
  const isDark = localStorage.getItem("darkTheme") === "true";

  document.body.classList.toggle("dark-theme", isDark);

  const button = document.getElementById("themeButton");

  if (button) {
    button.textContent = isDark
      ? "☀️ Светлая тема"
      : "🌙 Ночная тема";
  }
}

function loadAppearanceSettings() {
    const savedLang = localStorage.getItem("cafeLanguage") || "ru";
    const languageSelect = document.getElementById("languageSelect");

    if (languageSelect) {
        languageSelect.value = savedLang;
        languageSelect.addEventListener("change", changeLanguage);
    }

    const themeButton = document.getElementById("themeButton");
    if (themeButton) {
        themeButton.addEventListener("click", toggleTheme);
    }
     if (localStorage.getItem("cafeDarkTheme") === "true") {
        document.body.classList.add("dark-theme");
        if (themeButton) themeButton.textContent = "☀️ Светлая тема";
    }
   

    changeLanguage();
}

document.addEventListener("DOMContentLoaded", loadAppearanceSettings);
/* ===== РЕГИСТРАЦИЯ И ВХОД CafeOS ===== */

function initCafeAuth() {
  const authScreen = document.getElementById("authScreen");
  const appShell = document.getElementById("appShell");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const authMessage = document.getElementById("authMessage");

  if (!authScreen || !appShell || !loginForm ||
      !registerForm || !authMessage) {
    console.error("Не найдены элементы авторизации CafeOS");
    return;
  }

  function getUsers() {
    try {
      const users = JSON.parse(
        localStorage.getItem("cafeUsers") || "[]"
      );
      return Array.isArray(users) ? users : [];
    } catch {
      return [];
    }
  }

  function showMessage(message) {
    authMessage.textContent = message;
  }

  function showLogin() {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    showMessage("");
  }

  function showRegister() {
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    showMessage("");
  }

  function openApp(user) {
    authScreen.classList.add("hidden");
    appShell.classList.remove("hidden");

    let userLabel = document.getElementById("currentUserLabel");

    if (!userLabel) {
      userLabel = document.createElement("span");
      userLabel.id = "currentUserLabel";
      userLabel.style.fontWeight = "bold";

      const header = appShell.querySelector("header");
      if (header) header.appendChild(userLabel);
    }

    userLabel.textContent = "👤 " + user.name;

    let logoutButton = document.getElementById("logoutButton");

    if (!logoutButton) {
      logoutButton = document.createElement("button");
      logoutButton.id = "logoutButton";
      logoutButton.className = "primary";
      logoutButton.textContent = "Выйти";

      logoutButton.addEventListener("click", () => {
        localStorage.removeItem("cafeCurrentUser");
        location.reload();
      });

      const header = appShell.querySelector("header");
      if (header) header.appendChild(logoutButton);
    }
  }

  document.getElementById("showLogin")
    .addEventListener("click", showLogin);

  document.getElementById("showRegister")
    .addEventListener("click", showRegister);

  registerForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("registerName")
      .value.trim();

    const password = document.getElementById("registerPassword")
      .value;

    const confirmation = document.getElementById("confirmPassword")
      .value;

    if (name.length < 2) {
      showMessage("Имя должно содержать минимум 2 символа.");
      return;
    }

    if (password.length < 4) {
      showMessage("Пароль должен содержать минимум 4 символа.");
      return;
    }

    if (password !== confirmation) {
      showMessage("Пароли не совпадают.");
      return;
    }

    const users = getUsers();
    const normalizedName = name.toLowerCase();

    if (users.some(user =>
      user.name.toLowerCase() === normalizedName
    )) {
      showMessage("Такое имя уже зарегистрировано.");
      return;
    }

    users.push({ name, password });

    localStorage.setItem("cafeUsers", JSON.stringify(users));

    registerForm.reset();
    document.getElementById("loginName").value = name;

    showLogin();
    showMessage("Регистрация успешна! Теперь войдите.");
  });

  loginForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("loginName")
      .value.trim();

    const password = document.getElementById("loginPassword")
      .value;

    const user = getUsers().find(user =>
      user.name.toLowerCase() === name.toLowerCase() &&
      user.password === password
    );

    if (!user) {
      showMessage("Неверное имя или пароль.");
      return;
    }

    localStorage.setItem(
      "cafeCurrentUser",
      JSON.stringify({ name: user.name })
    );

    loginForm.reset();
    openApp(user);
  });

  let savedUser = null;

  try {
    savedUser = JSON.parse(
      localStorage.getItem("cafeCurrentUser") || "null"
    );
  } catch {
    savedUser = null;
  }

  if (
    savedUser &&
    getUsers().some(user =>
      user.name === savedUser.name
    )
  ) {
    openApp(savedUser);
  } else {
    localStorage.removeItem("cafeCurrentUser");
    appShell.classList.add("hidden");
    authScreen.classList.remove("hidden");
    showLogin();
  }
}

document.addEventListener("DOMContentLoaded", initCafeAuth);
console.log("CafeOS auth test");

console.log(
  "Зарегистрированные пользователи:",
  JSON.parse(localStorage.getItem("cafeUsers") || "[]")
);
function getFoodImage(name) {
  const images = {
    "Бургер": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "Пицца": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    "Латте": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80",
    "Картофель фри": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
    "Кола": "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=600&q=80"
  };

  return images[name] ||
    "https://placehold.co/600x400?text=Food";
}

// ===== CAFEOS: БРОНИРОВАНИЕ СТОЛИКОВ =====

let reservations = loadJSON("cafeReservations", []);

function createReservation(event) {
    event.preventDefault();

    const name = document.getElementById("reservationName").value.trim();
    const phone = document.getElementById("reservationPhone").value.trim();
    const date = document.getElementById("reservationDate").value;
    const time = document.getElementById("reservationTime").value;
    const guests = Number(document.getElementById("reservationGuests").value);
    const table = document.getElementById("reservationTable").value;

    if (!name || !phone || !date || !time) {
        alert("Заполни все поля!");
        return;
    }

    const selectedDateTime = new Date(`${date}T${time}`);
    if (Number.isNaN(selectedDateTime.getTime()) ||
        selectedDateTime <= new Date()) {
        alert("Выбери будущую дату и время!");
        return;
    }

    // Не разрешаем два бронирования одного столика
    // на одну и ту же дату и время.
    const occupied = reservations.some(item =>
        item.table === table &&
        item.date === date &&
        item.time === time &&
        item.status !== "Отменено"
    );

    if (occupied) {
        alert("Этот столик уже забронирован на выбранное время!");
        return;
    }

    const reservation = {
        id: Date.now(),
        name,
        phone,
        date,
        time,
        guests,
        table,
        status: "Подтверждено"
    };

    reservations.push(reservation);
    saveReservations();

    document.getElementById("reservationForm").reset();
    document.getElementById("reservationDate").value =
        document.getElementById("reservationDate").min;

    renderReservations();

    alert("Столик успешно забронирован! 🎉");
}

function saveReservations() {
    localStorage.setItem(
        "cafeReservations",
        JSON.stringify(reservations)
    );
}

function renderReservations() {
    const list = document.getElementById("reservationsList");
    if (!list) return;

    if (reservations.length === 0) {
        list.innerHTML = "<p>Пока бронирований нет 🪑</p>";
        return;
    }

    const sortedReservations = [...reservations].sort((a, b) =>
        `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)
    );

    list.innerHTML = sortedReservations.map(item => `
        <div class="reservation-card">
            <h4>🪑 Столик №${escapeHTML(String(item.table))}</h4>

            <p><strong>Гость:</strong> ${escapeHTML(item.name)}</p>
            <p><strong>Телефон:</strong> ${escapeHTML(item.phone)}</p>
            <p><strong>Дата:</strong> ${escapeHTML(item.date)}</p>
            <p><strong>Время:</strong> ${escapeHTML(item.time)}</p>
            <p><strong>Гостей:</strong> ${escapeHTML(String(item.guests))}</p>

            <span class="reservation-status">
                ${escapeHTML(item.status)}
            </span>

            ${item.status !== "Отменено" ? `
                <br>
                <button
                    class="cancel-reservation"
                    onclick="cancelReservation(${Number(item.id)})">
                    Отменить бронь
                </button>
            ` : ""}
        </div>
    `).join("");
}

function cancelReservation(id) {
    const reservation = reservations.find(item => item.id === id);
    if (!reservation || reservation.status === "Отменено") return;

    if (!confirm("Точно отменить это бронирование?")) return;

    reservation.status = "Отменено";
    saveReservations();
    renderReservations();
}

// Устанавливаем минимальную дату — сегодня.
function setupReservationDate() {
    const dateInput = document.getElementById("reservationDate");
    if (!dateInput) return;

    const now = new Date();
    const localDate = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");

    dateInput.min = localDate;
    dateInput.value = localDate;
}

// Показываем сохранённые бронирования после загрузки.
setupReservationDate();
renderReservations();