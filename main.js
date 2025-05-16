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
const cartItemsContainer = document.querySelector('.cart__items');
const cartCount = document.querySelector('.cart__count');
const cartEmptyMessage = document.querySelector('.cart__empty-message');
const cartSummary = document.querySelector('.cart__summary');
const cartTotalAmount = document.querySelector('.cart__total-amount');
const confirmButton = document.querySelector('.cart__confirm-btn');
const orderConfirmation = document.querySelector('.order-confirmation');
const orderConfirmationSummary = document.querySelector('.order-confirmation__summary');
const orderConfirmationTotal = document.querySelector('.order-confirmation__total-amount');
const startNewOrderButton = document.querySelector('.order-confirmation__btn');

const formatPrice = (price) => {
  return `$${price.toFixed(2)}`;
};

const createProductCard = (product) => {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.setAttribute('data-id', product.id);
  
  let quantity = 1;
  
  card.innerHTML = `
    <div class="product-card__image" style="background-image: url(${product.image})">
      <div class="quantity-control">
        <button class="quantity-btn minus" data-id="${product.id}">-</button>
        <span class="quantity-value" data-id="${product.id}">${quantity}</span>
        <button class="quantity-btn plus" data-id="${product.id}">+</button>
      </div>
      <button class="product-card__btn" data-id="${product.id}">
         <img src="./assets/images/icon-add-to-cart.svg" alt="Add to Cart">
        Add to Cart
      </button>
    </div>
    <div class="product-card__category">${product.category}</div>
    <h2 class="product-card__title">${product.title}</div>
    <div class="product-card__price">${formatPrice(product.price)}</div>
  `;
  

  const minusBtn = card.querySelector('.quantity-btn.minus');
  const plusBtn = card.querySelector('.quantity-btn.plus');
  const quantitySpan = card.querySelector('.quantity-value');
  
  minusBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity > 1) {
      quantity--;
      quantitySpan.textContent = quantity;
    }
  });
  
  plusBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    quantity++;
    quantitySpan.textContent = quantity;
  });
  
 
  const button = card.querySelector('.product-card__btn');
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id, quantity, window.productsData);
  });
  
  return card;
};


const createCartItemElement = (cartItem, product) => {
  const item = document.createElement('div');
  item.className = 'cart__item';
  
  item.innerHTML = `
    <div class="cart__item-title">${product.title}</div>
    <div class="cart__item-details">
      <span class="cart__item-quantity">${cartItem.quantity}×</span>
      <span class="cart__item-price">@ ${formatPrice(product.price)}</span>
      <span class="cart__item-total">${formatPrice(cartItem.quantity * product.price)}</span>
    </div>
    <button class="cart__item-remove" data-id="${product.id}">&times;</button>
  `;
  
  return item;
};

const addToCart = (productId, quantity, products) => {
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
  
 
  document.querySelectorAll('.cart__item-remove').forEach(button => {
    button.addEventListener('click', () => {
      const productId = parseInt(button.getAttribute('data-id'));
      removeFromCart(productId, products);
    });
  });
  
 
  const totalPrice = cart.reduce((total, item) => {
    const product = products.find(p => p.id === item.productId);
    return total + (product ? product.price * item.quantity : 0);
  }, 0);
  
  cartTotalAmount.textContent = formatPrice(totalPrice);
};


const createOrderConfirmation = (products) => {
 
  orderConfirmationSummary.innerHTML = '';
  
  cart.forEach(cartItem => {
    const product = products.find(p => p.id === cartItem.productId);
    if (product) {
      const item = document.createElement('div');
      item.className = 'order-confirmation__item';
      
      item.innerHTML = `
        <div class="order-confirmation__item-img" style="background-image: url(${product.image})"></div>
        <div class="order-confirmation__item-details">
          <div class="order-confirmation__item-title">${product.title}</div>
          <div class="order-confirmation__item-quantity">${cartItem.quantity}× @ ${formatPrice(product.price)}</div>
        </div>
        <div class="order-confirmation__item-price">${formatPrice(cartItem.quantity * product.price)}</div>
      `;
      
      orderConfirmationSummary.appendChild(item);
    }
  });
  
  
  const totalPrice = cart.reduce((total, item) => {
    const product = products.find(p => p.id === item.productId);
    return total + (product ? product.price * item.quantity : 0);
  }, 0);
  
  orderConfirmationTotal.textContent = formatPrice(totalPrice);
  
  orderConfirmation.classList.remove('hidden');
};

document.addEventListener('click', (e) => {
  if (!e.target.closest('.product-card') && !e.target.closest('.quantity-control')) {
    document.querySelectorAll('.quantity-control').forEach(control => {
      control.remove();
    });
    document.querySelectorAll('.product-card').forEach(card => {
      card.classList.remove('selected');
    });
  }
});

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
    
    productsContainer.innerHTML = '';
    products.forEach(product => {
      const card = createProductCard(product);
      productsContainer.appendChild(card);
    });
    
    updateCart(products);
    
    confirmButton.addEventListener('click', () => {
      if (cart.length > 0) {
        createOrderConfirmation(products);
      }
    });
    
    startNewOrderButton.addEventListener('click', () => {
      cart = [];
      updateCart(products);
      saveCartToLocalStorage();
      orderConfirmation.classList.add('hidden');
    });
    
  } catch (error) {
    console.error('Error initializing app:', error);
    productsContainer.innerHTML = '<div class="error">An error occurred. Please try again later.</div>';
  }
};

document.addEventListener('DOMContentLoaded', initApp);