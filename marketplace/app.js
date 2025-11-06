document.addEventListener("DOMContentLoaded", () => {
  STATE.isAuthenticated =
    sessionStorage.getItem(CONFIG.STORAGE_KEYS.AUTH) === "true";
  updateAuthUI(STATE.isAuthenticated);
  STATE.isAuthenticated ? loadHome() : loadRegistration();
  loadCartFromStorage();
  updateCartBadge();
  initTooltips();
  const form = document.getElementById("productForm");
  if (form) form.addEventListener("submit", handleAdminSubmit);
});

const initTooltips = () => {
  document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el));
};

const showPage = (pageId) => {
  document.querySelectorAll(".page").forEach((p) => p.classList.add("d-none"));
  document.getElementById(pageId).classList.remove("d-none");
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const updateAuthUI = (loggedIn) => {
  const mainNav = document.getElementById("mainNavLinks");
  const authNav = document.getElementById("authNavLinks");
  mainNav.classList.toggle("d-none", !loggedIn);
  authNav.classList.toggle("d-none", loggedIn);
};

const loadRegistration = () => showPage("registrationPage");
const loadLogin = () => showPage("loginPage");

const loadHome = () => {
  showPage("homePage");
  fetchProducts();
};

const loadAdmin = () => {
  if (!STATE.isAuthenticated) {
    showAlert(
      "Devi effettuare l'accesso per accedere all'area Admin.",
      "warning"
    );
    return loadLogin();
  }
  showPage("adminPage");
  resetFormAdmin();
};

const loadCart = () => {
  showPage("cartPage");
  renderCart();
};

// FUNZIONI MANCANTI - VALIDAZIONE FORM
const validateField = (fieldId, type) => {
  const field = document.getElementById(fieldId);
  const errorDiv = document.getElementById(`err-${fieldId}`);
  let isValid = true;
  let errorMessage = "";

  if (type === "text") {
    if (field.value.trim().length < 2) {
      isValid = false;
      errorMessage = "Inserisci almeno 2 caratteri";
    }
  } else if (type === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(field.value)) {
      isValid = false;
      errorMessage = "Inserisci un'email valida";
    }
  } else if (type === "password") {
    if (field.value.length < 8) {
      isValid = false;
      errorMessage = "La password deve essere di almeno 8 caratteri";
    }
  } else if (type === "confirmPassword") {
    const password = document.getElementById("password").value;
    if (field.value !== password) {
      isValid = false;
      errorMessage = "Le password non corrispondono";
    }
  }

  if (errorDiv) {
    errorDiv.textContent = errorMessage;
  }
  field.classList.toggle("is-invalid", !isValid);
  field.classList.toggle("is-valid", isValid && field.value.trim() !== "");

  return isValid;
};

const checkPasswordRequirements = () => {
  const password = document.getElementById("password").value;
  const requirements = [
    { id: "req1", test: password.length >= 8 },
    { id: "req2", test: /[A-Z]/.test(password) },
    { id: "req3", test: /\d/.test(password) },
    { id: "req4", test: /[!@#$%^&*]/.test(password) },
  ];

  requirements.forEach(({ id, test }) => {
    const element = document.getElementById(id);
    if (element) {
      element.classList.toggle("valid", test);
      const icon = element.querySelector("i");
      if (icon) {
        icon.className = test ? "fas fa-check" : "fas fa-times";
      }
    }
  });
};

const togglePasswordVisibility = (fieldId) => {
  const field = document.getElementById(fieldId);
  const button = field.nextElementSibling;
  const icon = button.querySelector("i");

  if (field.type === "password") {
    field.type = "text";
    icon.className = "fas fa-eye-slash";
  } else {
    field.type = "password";
    icon.className = "fas fa-eye";
  }
};

const saveRegistration = async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const form = document.getElementById("registrationForm");
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!form.checkValidity() || password !== confirmPassword) {
    showAlert("Completa correttamente tutti i campi del form.", "danger");
    form.classList.add("was-validated");
    return;
  }

  await handleAsync(btn, "Registrazione in corso...", async () => {
    await delay(1500);
    showAlert("Registrazione completata! Effettua l'accesso.", "success");
    form.reset();
    form.classList.remove("was-validated");
    setTimeout(loadLogin, 2000);
  });
};

const handleLogin = async (e) => {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;
  const btn = document.getElementById("btnLogin");

  await handleAsync(
    btn,
    "Accesso in corso...",
    async () => {
      await delay(1500);
      if (!username || !password) throw new Error("Credenziali non valide.");

      STATE.isAuthenticated = true;
      sessionStorage.setItem(CONFIG.STORAGE_KEYS.AUTH, "true");
      updateAuthUI(true);
      showAlert(`Benvenuto in Quantum, ${username}!`, "success");
      loadHome();
    },
    () => showAlert("Login fallito. Verifica username e password.", "danger")
  );
};

const logout = () => {
  STATE.isAuthenticated = false;
  sessionStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH);
  updateAuthUI(false);
  STATE.cart = [];
  sessionStorage.removeItem(CONFIG.STORAGE_KEYS.CART);
  updateCartBadge();
  showAlert("Logout effettuato con successo.", "info");
  loadLogin();
};

const fetchProducts = async () => {
  const spinner = document.getElementById("loadingSpinner");
  const productRow = document.getElementById("productRow");
  spinner.classList.remove("d-none");
  productRow.innerHTML = "";
  try {
    const response = await fetch(CONFIG.BASE_URL, {
      headers: { Authorization: `Bearer ${CONFIG.TOKEN}` },
    });
    if (!response.ok) throw new Error("Errore nel caricamento dei prodotti.");

    STATE.products = await response.json();
    renderProducts(STATE.products);
  } catch (error) {
    showAlert("Impossibile caricare i prodotti: " + error.message, "danger");
    productRow.innerHTML = createErrorTemplate();
  } finally {
    spinner.classList.add("d-none");
  }
};

const renderProducts = (productsArray) => {
  const productRow = document.getElementById("productRow");
  productRow.innerHTML =
    productsArray.length === 0
      ? createEmptyTemplate()
      : productsArray.map(createProductCard).join("");
};

// FUNZIONI MANCANTI - TEMPLATE
const truncateText = (text, maxLength) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

const createEmptyTemplate = () => `
  <div class="col-12">
    <div class="empty-cart-card">
      <i class="fas fa-box-open"></i>
      <h4>Nessun prodotto disponibile</h4>
      <p>Al momento non ci sono prodotti nel catalogo</p>
    </div>
  </div>
`;

const createErrorTemplate = () => `
  <div class="col-12">
    <div class="alert alert-danger">
      <i class="fas fa-exclamation-triangle me-2"></i>
      Errore nel caricamento dei prodotti. Riprova più tardi.
    </div>
  </div>
`;

const createProductCard = (product) => `
    <div class="col-lg-4 col-md-6">
        <div class="card product-card h-100">
            <img src="${product.imageUrl}" class="card-img-top" alt="${
  product.name
}"
                onerror="this.src='https://via.placeholder.com/400x280?text=${encodeURIComponent(
                  product.name
                )}';" 
                loading="lazy">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${product.name}</h5>
                <p class="text-muted small mb-2"><i class="fas fa-tag me-1"></i> ${
                  product.brand
                }</p>
                <p class="card-text flex-grow-1">${truncateText(
                  product.description,
                  100
                )}</p>
                <p class="price mb-3">€${product.price.toFixed(2)}</p>
                <div class="d-grid gap-2">
                    <button class="btn btn-primary" onclick="addToCart('${
                      product._id
                    }')">
                        <i class="fas fa-cart-plus me-2"></i> Aggiungi al Carrello
                    </button>
                    <button class="btn btn-outline-primary btn-sm" onclick="viewDetails('${
                      product._id
                    }')">
                        <i class="fas fa-info-circle me-1"></i> Dettagli
                    </button>
                    ${
                      STATE.isAuthenticated
                        ? `
                        <button class="btn btn-outline-warning btn-sm" onclick="editProduct('${product._id}')">
                            <i class="fas fa-edit me-1"></i> Modifica
                        </button>`
                        : ""
                    }
                </div>
            </div>
        </div>
    </div>`;

const createCartItem = (item, index) => `
  <div class="cart-item-card">
    <img src="${item.imageUrl}" 
         alt="${item.name}" 
         class="cart-item-img"
         onerror="this.src='https://via.placeholder.com/100?text=${encodeURIComponent(
           item.name
         )}'">
    <div class="cart-item-info">
      <h6>${item.name}</h6>
      <p class="text-muted mb-1"><i class="fas fa-tag me-1"></i> ${
        item.brand
      }</p>
      <p class="cart-item-price">€${item.price.toFixed(2)}</p>
    </div>
    <button class="btn btn-outline-danger" onclick="removeFromCart(${index})">
      <i class="fas fa-trash-alt"></i>
    </button>
  </div>
`;

const viewDetails = (productId) => {
  const product = STATE.products.find((p) => p._id === productId);
  if (!product) return showAlert("Prodotto non trovato.", "danger");

  showAlert(
    `<strong>${product.name}</strong><br>
     ${product.brand}<br>
     ${product.description}<br>
     <strong>€${product.price.toFixed(2)}</strong>`,
    "info"
  );
};

const editProduct = (productId) => {
  if (!STATE.isAuthenticated) {
    showAlert("Devi essere loggato per modificare i prodotti.", "warning");
    return;
  }
  const product = STATE.products.find((p) => p._id === productId);
  if (!product) return showAlert("Prodotto non trovato.", "danger");

  loadAdmin();
  STATE.editingProductId = productId;

  document.getElementById("productName").value = product.name;
  document.getElementById("productBrand").value = product.brand;
  document.getElementById("productDesc").value = product.description;
  document.getElementById("productImage").value = product.imageUrl;
  document.getElementById("productPrice").value = product.price;

  document.getElementById("adminTitle").textContent = "Modifica Prodotto";
  document.getElementById(
    "adminDesc"
  ).textContent = `Stai modificando: ${product.name}`;
  document.getElementById("btnCreate").classList.add("d-none");
  document.getElementById("btnEdit").classList.remove("d-none");
  document.getElementById("btnDelete").classList.remove("d-none");
  previewImageAdmin();
};

const performSearch = () => {
  const searchTerm =
    document.getElementById("navbarSearch").value ||
    document.getElementById("mobileSearch").value;
  if (!searchTerm.trim()) {
    renderProducts(STATE.products);
    return showAlert("Inserisci un termine di ricerca", "warning");
  }
  const filtered = STATE.products.filter((p) =>
    [p.name, p.brand, p.description].some((field) =>
      field.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  renderProducts(filtered);
  showAlert(
    filtered.length === 0
      ? `Nessun risultato per "${searchTerm}"`
      : `Trovati ${filtered.length} risultati per "${searchTerm}"`,
    filtered.length === 0 ? "info" : "success"
  );
};

const loadCartFromStorage = () => {
  try {
    const stored = sessionStorage.getItem(CONFIG.STORAGE_KEYS.CART);
    STATE.cart = stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Errore nel caricamento del carrello:", e);
    STATE.cart = [];
  }
};

const saveCartToStorage = () =>
  sessionStorage.setItem(CONFIG.STORAGE_KEYS.CART, JSON.stringify(STATE.cart));

const updateCartBadge = () => {
  const badge = document.getElementById("cartBadge");
  badge.textContent = STATE.cart.length;
  badge.classList.toggle("d-none", STATE.cart.length === 0);
};

const addToCart = (productId) => {
  if (!STATE.isAuthenticated) {
    showAlert(
      "Effettua l'accesso per aggiungere prodotti al carrello.",
      "warning"
    );
    return loadLogin();
  }
  const product = STATE.products.find((p) => p._id === productId);
  if (product) {
    STATE.cart.push(product);
    saveCartToStorage();
    updateCartBadge();
    showAlert(`${product.name} aggiunto al carrello!`, "success");
    if (!document.getElementById("cartPage").classList.contains("d-none")) {
      renderCart();
    }
  }
};

const renderCart = () => {
  const container = document.getElementById("cartItemsContainer");
  const emptyMsg = document.getElementById("emptyCartMessage");
  const subtotal = document.getElementById("cartSubtotal");
  const total = document.getElementById("cartTotal");
  const checkoutBtn = document.getElementById("checkoutBtn");

  container.innerHTML = "";

  if (STATE.cart.length === 0) {
    container.appendChild(emptyMsg);
    emptyMsg.classList.remove("d-none");
    subtotal.textContent = total.textContent = "€0.00";
    checkoutBtn.disabled = true;
    return;
  }

  emptyMsg.classList.add("d-none");
  checkoutBtn.disabled = false;

  const totalAmount = STATE.cart.reduce((sum, item) => sum + item.price, 0);
  container.innerHTML = STATE.cart
    .map((item, idx) => createCartItem(item, idx))
    .join("");
  subtotal.textContent = total.textContent = `€${totalAmount.toFixed(2)}`;
  saveCartToStorage();
};

const removeFromCart = (index) => {
  const productName = STATE.cart[index].name;
  STATE.cart.splice(index, 1);
  saveCartToStorage();
  updateCartBadge();
  renderCart();
  showAlert(`${productName} rimosso dal carrello.`, "info");
};

const clearCart = () => {
  if (STATE.cart.length === 0)
    return showAlert("Il carrello è già vuoto.", "info");

  if (confirm("Sei sicuro di voler svuotare il carrello?")) {
    STATE.cart = [];
    saveCartToStorage();
    updateCartBadge();
    renderCart();
    showAlert("Carrello svuotato.", "success");
  }
};

const checkout = () => {
  if (STATE.cart.length === 0) {
    return showAlert(
      "Il carrello è vuoto. Aggiungi prodotti prima di procedere.",
      "warning"
    );
  }
  const total = STATE.cart.reduce((sum, item) => sum + item.price, 0);
  showAlert(
    `Checkout completato! Totale: €${total.toFixed(2)}. Grazie per l'acquisto!`,
    "success"
  );
  STATE.cart = [];
  saveCartToStorage();
  updateCartBadge();
  setTimeout(loadHome, 2000);
};

const handleAdminSubmit = async (e) => {
  e.preventDefault();
  const isEditing = !!STATE.editingProductId;
  const btn = document.getElementById(isEditing ? "btnEdit" : "btnCreate");
  const formData = getAdminFormData();

  await handleAsync(btn, "Salvataggio...", async () => {
    const response = await fetch(
      isEditing ? CONFIG.BASE_URL + STATE.editingProductId : CONFIG.BASE_URL,
      {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CONFIG.TOKEN}`,
        },
        body: JSON.stringify(formData),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Errore HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();

    if (isEditing) {
      const index = STATE.products.findIndex(
        (p) => p._id === STATE.editingProductId
      );
      if (index !== -1) STATE.products[index] = result;
      STATE.cart = STATE.cart.map((item) =>
        item._id === STATE.editingProductId ? result : item
      );
      saveCartToStorage();
    } else {
      STATE.products.push(result);
    }
    showAlert(
      `Prodotto ${isEditing ? "modificato" : "creato"} con successo!`,
      "success"
    );
    setTimeout(loadHome, CONFIG.REDIRECT_DELAY);
  });
};

const handleAdminDelete = async () => {
  if (!STATE.editingProductId) return;
  if (
    !confirm(
      "Sei sicuro di voler eliminare questo prodotto? L'azione è irreversibile."
    )
  )
    return;

  const btn = document.getElementById("btnDelete");

  await handleAsync(btn, "Eliminazione...", async () => {
    const response = await fetch(CONFIG.BASE_URL + STATE.editingProductId, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${CONFIG.TOKEN}` },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Errore HTTP ${response.status}: ${error}`);
    }

    STATE.products = STATE.products.filter(
      (p) => p._id !== STATE.editingProductId
    );
    STATE.cart = STATE.cart.filter(
      (item) => item._id !== STATE.editingProductId
    );
    saveCartToStorage();
    updateCartBadge();
    showAlert("Prodotto eliminato con successo!", "success");
    setTimeout(loadHome, CONFIG.REDIRECT_DELAY);
  });
};

const getAdminFormData = () => ({
  name: document.getElementById("productName").value.trim(),
  description: document.getElementById("productDesc").value.trim(),
  brand: document.getElementById("productBrand").value.trim(),
  imageUrl: document.getElementById("productImage").value.trim(),
  price: parseFloat(document.getElementById("productPrice").value),
});

const previewImageAdmin = () => {
  const url = document.getElementById("productImage").value;
  const preview = document.getElementById("imagePreviewAdmin");
  const img = document.getElementById("previewImgAdmin");

  if (url && url.startsWith("http")) {
    img.src = url;
    preview.classList.remove("d-none");
  } else {
    preview.classList.add("d-none");
  }
};

const resetFormAdmin = () => {
  document.getElementById("productForm").reset();
  document.getElementById("imagePreviewAdmin").classList.add("d-none");
  document.getElementById("adminTitle").textContent = "Gestione Prodotti";
  document.getElementById("adminDesc").textContent =
    "Aggiungi un nuovo prodotto al catalogo";
  document.getElementById("btnCreate").classList.remove("d-none");
  ["btnEdit", "btnDelete"].forEach((id) =>
    document.getElementById(id).classList.add("d-none")
  );
  STATE.editingProductId = null;
};

const showAlert = (message, type) => {
  const container = document.getElementById("alertContainer");
  const alertId = `alert-${Date.now()}`;
  const alert = document.createElement("div");

  alert.id = alertId;
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.setAttribute("role", "alert");
  alert.innerHTML = `${message}
        <button type="button" class="btn-close" onclick="document.getElementById('${alertId}').remove()"></button>`;

  container.appendChild(alert);

  setTimeout(() => {
    const el = document.getElementById(alertId);
    if (el) {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 150);
    }
  }, CONFIG.ALERT_DURATION);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const handleAsync = async (btn, loadingText, action, onError) => {
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> ${loadingText}`;

  try {
    await action();
  } catch (error) {
    console.error("Error:", error);
    if (onError) onError(error);
    else showAlert(`Errore: ${error.message}`, "danger");
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
};
