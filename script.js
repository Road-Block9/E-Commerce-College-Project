const PRODUCTS_API = "https://dummyjson.com/products?limit=194";
const PRODUCT_DETAIL_API = "https://dummyjson.com/products/";
const CART_KEY = "miniShopCart";
const DELIVERY_CHARGE = 40;

const page = document.body.dataset.page;
const messageArea = document.getElementById("message-area");

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();

  if (page === "home") {
    loadProducts();
  }

  if (page === "product") {
    loadProductDetail();
  }

  if (page === "cart") {
    renderCartPage();
  }
});

function showMessage(text, type = "normal") {
  if (!messageArea) return;
  messageArea.innerHTML = `<div class="message ${type}">${text}</div>`;
}

function clearMessage() {
  if (messageArea) {
    messageArea.innerHTML = "";
  }
}

function formatCurrency(value) {
  return "$" + Number(value).toFixed(2);
}

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cartCount = document.getElementById("cart-count");
  if (!cartCount) return;

  const totalItems = getCart().reduce((total, item) => total + item.quantity, 0);
  cartCount.textContent = totalItems;
}

function createCartProduct(product) {
  return {
    id: product.id,
    title: product.title,
    price: product.price,
    discountPercentage: product.discountPercentage || 0,
    thumbnail: product.thumbnail || product.images?.[0],
    quantity: 1
  };
}

function addToCart(product) {
  const cart = getCart();
  const existingItem = cart.find(item => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push(createCartProduct(product));
  }

  saveCart(cart);
  showMessage(`${product.title} added to cart.`);
}

async function loadProducts() {
  const productList = document.getElementById("product-list");
  showMessage("Loading products...");

  try {
    const response = await fetch(PRODUCTS_API);
    if (!response.ok) {
      throw new Error("Unable to fetch products.");
    }

    const data = await response.json();
    clearMessage();
    renderProducts(data.products || []);
  } catch (error) {
    productList.innerHTML = "";
    showMessage("Products could not be loaded. Please try again later.", "error");
  }
}

function renderProducts(products) {
  const productList = document.getElementById("product-list");

  if (!products.length) {
    showMessage("No products found.");
    return;
  }

  productList.innerHTML = products.map(product => `
    <article class="product-card" data-id="${product.id}">
      <img src="${product.thumbnail}" alt="${product.title}">
      <div class="card-body">
        <p class="muted">${product.brand || product.category || "Product"}</p>
        <h2>${product.title}</h2>
        <div class="price-row">
          <span class="price">${formatCurrency(product.price)}</span>
          ${product.discountPercentage ? `<span class="discount">${product.discountPercentage}% off</span>` : ""}
        </div>
        <p class="rating">Rating: ${product.rating || "N/A"}</p>
        <div class="card-actions">
          <a class="btn btn-secondary" href="product.html?id=${product.id}">View Details</a>
          <button class="btn btn-primary add-cart-btn" type="button" data-id="${product.id}">Add to Cart</button>
        </div>
      </div>
    </article>
  `).join("");

  productList.addEventListener("click", event => {
    const addButton = event.target.closest(".add-cart-btn");
    const detailsLink = event.target.closest("a");
    const card = event.target.closest(".product-card");

    if (addButton) {
      event.preventDefault();
      event.stopPropagation();
      const productId = Number(addButton.dataset.id);
      const product = products.find(item => item.id === productId);
      addToCart(product);
      return;
    }

    if (!detailsLink && card) {
      window.location.href = `product.html?id=${card.dataset.id}`;
    }
  });
}

async function loadProductDetail() {
  const detailSection = document.getElementById("product-detail");
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    showMessage("Product id is missing from the URL.", "error");
    detailSection.innerHTML = `<a class="btn btn-secondary" href="index.html">Back to Products</a>`;
    return;
  }

  showMessage("Loading product details...");

  try {
    const response = await fetch(PRODUCT_DETAIL_API + productId);
    if (!response.ok) {
      throw new Error("Unable to fetch product details.");
    }

    const product = await response.json();
    clearMessage();
    renderProductDetail(product);
  } catch (error) {
    detailSection.innerHTML = `<a class="btn btn-secondary" href="index.html">Back to Products</a>`;
    showMessage("Product details could not be loaded. Please try again later.", "error");
  }
}

function renderProductDetail(product) {
  const detailSection = document.getElementById("product-detail");
  const images = product.images && product.images.length ? product.images : [product.thumbnail];

  detailSection.innerHTML = `
    <div class="detail-content">
      <div class="detail-images">
        <img class="main-image" src="${images[0]}" alt="${product.title}">
        <div class="thumbnail-list">
          ${images.slice(0, 4).map(image => `<img src="${image}" alt="${product.title} image">`).join("")}
        </div>
      </div>
      <div class="detail-info">
        <p class="muted">${product.brand || product.category || "Product"}</p>
        <h1>${product.title}</h1>
        <div class="price-row">
          <span class="price">${formatCurrency(product.price)}</span>
          ${product.discountPercentage ? `<span class="discount">${product.discountPercentage}% off</span>` : ""}
        </div>
        <p class="description">${product.description}</p>
        <div class="detail-list">
          <p><strong>Rating:</strong> ${product.rating || "N/A"}</p>
          <p><strong>Stock:</strong> ${product.stock}</p>
          <p><strong>Category:</strong> ${product.category || "N/A"}</p>
          <p><strong>Brand:</strong> ${product.brand || "N/A"}</p>
        </div>
        <div class="detail-actions">
          <button id="detail-add-cart" class="btn btn-primary" type="button">Add to Cart</button>
          <a class="btn btn-secondary" href="index.html">Back to Products</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById("detail-add-cart").addEventListener("click", () => {
    addToCart(product);
  });
}

function renderCartPage() {
  const cartPage = document.getElementById("cart-page");
  const cart = getCart();

  clearMessage();

  if (!cart.length) {
    cartPage.className = "";
    cartPage.innerHTML = `
      <div class="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Add products from the product listing page.</p>
        <a class="btn btn-primary" href="index.html">Go to Products</a>
      </div>
    `;
    return;
  }

  cartPage.className = "cart-layout";
  cartPage.innerHTML = `
    <div class="cart-items">
      ${cart.map(item => renderCartItem(item)).join("")}
    </div>
    ${renderBillSummary(cart)}
  `;

  cartPage.onclick = handleCartAction;
}

function renderCartItem(item) {
  return `
    <article class="cart-item">
      <img src="${item.thumbnail}" alt="${item.title}">
      <div>
        <h2>${item.title}</h2>
        <p class="muted">Price: ${formatCurrency(item.price)}</p>
        <p class="muted">Discount: ${item.discountPercentage || 0}%</p>
        <div class="cart-controls">
          <button class="qty-btn" type="button" data-action="decrease" data-id="${item.id}">-</button>
          <span class="quantity">${item.quantity}</span>
          <button class="qty-btn" type="button" data-action="increase" data-id="${item.id}">+</button>
          <button class="btn btn-danger" type="button" data-action="remove" data-id="${item.id}">Remove</button>
        </div>
      </div>
      <div class="item-total">${formatCurrency(item.price * item.quantity)}</div>
    </article>
  `;
}

function handleCartAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const productId = Number(button.dataset.id);
  const action = button.dataset.action;

  if (action === "increase") {
    changeQuantity(productId, 1);
  }

  if (action === "decrease") {
    changeQuantity(productId, -1);
  }

  if (action === "remove") {
    removeFromCart(productId);
  }
}

function changeQuantity(productId, amount) {
  const cart = getCart();
  const item = cart.find(product => product.id === productId);
  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    const updatedCart = cart.filter(product => product.id !== productId);
    saveCart(updatedCart);
  } else {
    saveCart(cart);
  }

  renderCartPage();
}

function removeFromCart(productId) {
  const updatedCart = getCart().filter(item => item.id !== productId);
  saveCart(updatedCart);
  renderCartPage();
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
  renderCartPage();
}

function renderBillSummary(cart) {
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  // DummyJSON gives discount percentage per product, so this estimates saved money.
  const discountAmount = cart.reduce((total, item) => {
    return total + (item.price * item.discountPercentage / 100) * item.quantity;
  }, 0);

  const deliveryCharge = subtotal > 0 ? DELIVERY_CHARGE : 0;
  const grandTotal = subtotal - discountAmount + deliveryCharge;

  return `
    <aside class="bill-summary">
      <h2>Bill Summary</h2>
      <div class="summary-row">
        <span>Total items</span>
        <strong>${totalItems}</strong>
      </div>
      <div class="summary-row">
        <span>Subtotal</span>
        <strong>${formatCurrency(subtotal)}</strong>
      </div>
      <div class="summary-row">
        <span>Discount</span>
        <strong>- ${formatCurrency(discountAmount)}</strong>
      </div>
      <div class="summary-row">
        <span>Delivery charge</span>
        <strong>${formatCurrency(deliveryCharge)}</strong>
      </div>
      <div class="summary-row total">
        <span>Grand total</span>
        <strong>${formatCurrency(grandTotal)}</strong>
      </div>
      <button class="btn btn-danger" type="button" onclick="clearCart()">Clear Cart</button>
    </aside>
  `;
}
