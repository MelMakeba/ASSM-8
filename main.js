const fetchProducts = async () => {
  try {
    const response = await fetch('data.json');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const rawData = await response.json();
    
   
    return rawData.map((item, index) => ({
      id: index + 1, 
      title: item.name, 
      price: item.price,
      category: item.category,
      image: item.image.desktop || item.image.thumbnail
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

let cart = [];

const productsContainer = document.querySelector('.products');
const cartItemsContainer = document.querySelector('.cart_items');
const cartCount = document.querySelector('.cart_count');
const cartEmptyMessage = document.querySelector('.cart_empty-message');
const cartSummary = document.querySelector('.cart_summary');
const cartTotalAmount = document.querySelector('.cart_total-amount');
const confirmButton = document.querySelector('.cart_confirm-btn');

const formatPrice = (price) => {
  return `$${price.toFixed(2)}`;
};

const createProductCard = (product) => {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.setAttribute('data-id', product.id);
  
  card.innerHTML = `
    <div class="product-card_image" style="background-image: url(${product.image})">
      <div class="product-card_btn-container">
        <div class="product-card_quantity-controls">
          <button class="product-card_quantity-btn minus" data-id="${product.id}">-</button>
          <span class="product-card_quantity" data-id="${product.id}">1</span>
          <button class="product-card_quantity-btn plus" data-id="${product.id}">+</button>
        </div>
        <button class="product-card_btn" data-id="${product.id}">
          <img src="./assets/images/icon-add-to-cart.svg" alt="add to cart">
          Add to Cart
        </button>
      </div>
    </div>
    <div class="product-card_category">${product.category}</div>
    <h2 class="product-card_title">${product.title}</h2>
    <div class="product-card_price">${formatPrice(product.price)}</div>
  `;
  
  const minusBtn = card.querySelector('.product-card_quantity-btn.minus');
  const plusBtn = card.querySelector('.product-card_quantity-btn.plus');
  const quantitySpan = card.querySelector('.product-card_quantity');
  
  minusBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    let quantity = parseInt(quantitySpan.textContent);
    if (quantity > 1) {
      quantitySpan.textContent = quantity - 1;
    }
  });
  
  plusBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    let quantity = parseInt(quantitySpan.textContent);
    quantitySpan.textContent = quantity + 1;
  });
  
  
  const button = card.querySelector('.product-card_btn');
  button.addEventListener('click', (e) => {
    e.preventDefault();
    const quantity = parseInt(quantitySpan.textContent);
    addToCartWithQuantity(product.id, quantity, window.productsData);
  });
  
  return card;
};


const addToCartWithQuantity = (productId, quantity, products) => {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  const existingItem = cart.find(item => item.productId === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      productId: productId,
      quantity: quantity
    });
  }
  
  updateCart(products);
  saveCartToLocalStorage();
};

const createCartItemElement = (cartItem, product) => {
  const item = document.createElement('div');
  item.className = 'cart_item';
  
  item.innerHTML = `
    <div class="cart_item-title">${product.title}</div>
    <div class="cart_item-quantity">
      <button class="cart_item-decrease" data-id="${product.id}">-</button>
      <span class="cart_item-count">${cartItem.quantity}×</span>
      <button class="cart_item-increase" data-id="${product.id}">+</button>
      <span class="cart_item-price">@ ${formatPrice(product.price)}</span>
      <span class="cart_item-subtotal">${formatPrice(cartItem.quantity * product.price)}</span>
    </div>
    <button class="cart_item-remove" data-id="${product.id}">×</button>
  `;
  
  return item;
};

const addToCart = (productId, products) => {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  const existingItem = cart.find(item => item.productId === productId);
  
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({
      productId: productId,
      quantity: 1
    });
  }
  
  updateCart(products);
  saveCartToLocalStorage();
};

const increaseQuantity = (productId, products) => {
  const item = cart.find(item => item.productId === productId);
  if (item) {
    item.quantity++;
    updateCart(products);
    saveCartToLocalStorage();
  }
};

const decreaseQuantity = (productId, products) => {
  const item = cart.find(item => item.productId === productId);
  if (item) {
    item.quantity--;
    if (item.quantity <= 0) {
      removeFromCart(productId, products);
    } else {
      updateCart(products);
      saveCartToLocalStorage();
    }
  }
};

const removeFromCart = (productId, products) => {
  const index = cart.findIndex(item => item.productId === productId);
  if (index !== -1) {
    cart.splice(index, 1);
    updateCart(products);
    saveCartToLocalStorage();
  }
};

const saveCartToLocalStorage = () => {
  localStorage.setItem('dessertCart', JSON.stringify(cart));
};

const loadCartFromLocalStorage = () => {
  const savedCart = localStorage.getItem('dessertCart');
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
    } catch (e) {
      console.error('Failed to parse cart from localStorage', e);
      cart = [];
    }
  }
};

const updateCart = (products) => {
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  cartCount.textContent = totalItems;
  
  cartItemsContainer.innerHTML = '';
  
  if (cart.length === 0) {
    cartEmptyMessage.classList.remove('hidden');
    cartSummary.classList.add('hidden');
    return;
  }
  
  cartEmptyMessage.classList.add('hidden');
  cartSummary.classList.remove('hidden');
  
  cart.forEach(cartItem => {
    const product = products.find(p => p.id === cartItem.productId);
    if (product) {
      const itemElement = createCartItemElement(cartItem, product);
      cartItemsContainer.appendChild(itemElement);
    }
  });
  
  document.querySelectorAll('.cart_item-remove').forEach(button => {
    button.addEventListener('click', () => {
      const productId = parseInt(button.getAttribute('data-id'));
      removeFromCart(productId, products);
    });
  });
  
  document.querySelectorAll('.cart_item-increase').forEach(button => {
    button.addEventListener('click', () => {
      const productId = parseInt(button.getAttribute('data-id'));
      increaseQuantity(productId, products);
    });
  });
  
  document.querySelectorAll('.cart_item-decrease').forEach(button => {
    button.addEventListener('click', () => {
      const productId = parseInt(button.getAttribute('data-id'));
      decreaseQuantity(productId, products);
    });
  });
  
  const totalPrice = cart.reduce((total, item) => {
    const product = products.find(p => p.id === item.productId);
    return total + (product ? product.price * item.quantity : 0);
  }, 0);
  
  cartTotalAmount.textContent = formatPrice(totalPrice);
};

const renderProducts = (products) => {
  productsContainer.innerHTML = ''; 
  
  products.forEach(product => {
    const card = createProductCard(product);
    productsContainer.appendChild(card);
  });
};

const initApp = async () => {
  try {
    productsContainer.innerHTML = '<div class="loading">Loading products...</div>';
    
    const products = await fetchProducts();
    
    window.productsData = products;
    
    if (products.length === 0) {
      productsContainer.innerHTML = '<div class="error">Failed to load products. Please try again later.</div>';
      return;
    }
    
    loadCartFromLocalStorage();
    
    renderProducts(products);
    
    updateCart(products);
    
    confirmButton.addEventListener('click', () => {
      if (cart.length > 0) {
        alert('Order confirmed! Thank you for your purchase.');
        cart = [];
        updateCart(products);
        saveCartToLocalStorage();
      }
    });
    
  } catch (error) {
    console.error('Error initializing app:', error);
    productsContainer.innerHTML = '<div class="error">An error occurred. Please try again later.</div>';
  }
};

document.addEventListener('DOMContentLoaded', initApp);