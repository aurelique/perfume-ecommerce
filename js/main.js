// Konfigurasi Google Spreadsheet dan Web App
const SPREADSHEET_ID = '1lx8r1ugap_4Y2feyGAsa_2v9-t852NeH1pde71W72Vw';
const API_KEY = 'AIzaSyAMp_WQyxpTc4bWsP19Fy1W-rha9oHbx7o';
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyp-KJ-MfvcyKe7MTI4Ode1V9SnZWand5F_mwYLkUHUAnvoWrct9UnZ53aVQzNS13_C/exec'; // e.g., https://script.google.com/macros/s/.../exec

// State management
let cart = [];
let products = [];

// DOM Elements
const cartModal = document.getElementById('cart-modal');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const cartCount = document.getElementById('cart-count');
const checkoutBtn = document.getElementById('checkout-btn');
const closeButtons = document.querySelectorAll('.close');

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    await loadProducts();
    setupEventListeners();
    loadCartFromSession();
});

// Load products from Google Spreadsheet (READ)
async function loadProducts() {
    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/products?key=${API_KEY}`
        );
        const data = await response.json();

        if (data.values && data.values.length > 1) {
            // Convert to array of objects
            const headers = data.values[0];
            products = data.values.slice(1).map(row => {
                const product = {};
                headers.forEach((header, index) => {
                    product[header] = row[index] || '';
                });
                return product;
            });
            displayProducts(products);
        }
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Failed to load products. Check console for details.');
    }
}

// Display products
function displayProducts(productsToShow) {
    const container = document.getElementById('products-container');
    container.innerHTML = '';

    productsToShow.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card animate-on-scroll';
        productCard.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300x250?text=No+Image'">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">Rp ${parseInt(product.price).toLocaleString('id-ID')}</div>
                <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
            </div>
        `;
        container.appendChild(productCard);
    });

    // Re-observe new elements for animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.product-card').forEach(card => observer.observe(card));
}

// Filter products by category
document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', function() {
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');

        const category = this.dataset.category;
        if (category === 'all') {
            displayProducts(products);
        } else {
            const filtered = products.filter(product => product.category === category);
            displayProducts(filtered);
        }
    });
});

// Add to cart
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('add-to-cart')) {
        const productId = e.target.dataset.id;
        const product = products.find(p => p.id === productId);
        if (product) {
            addToCart(product);
        }
    }
});

function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: parseInt(product.price),
            quantity: 1
        });
    }
    updateCart();
    showNotification(`${product.name} added to cart!`);
}

// Update cart display
function updateCart() {
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    // Save to session storage
    sessionStorage.setItem('cart', JSON.stringify(cart));
}

// Load cart from session storage
function loadCartFromSession() {
    const savedCart = sessionStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCart();
    }
}

// Show cart modal
document.querySelector('.cart-icon').addEventListener('click', function() {
    displayCartItems();
    cartModal.style.display = 'block';
});

// Close modals
closeButtons.forEach(button => {
    button.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
    });
});

window.addEventListener('click', function(e) {
    if (e.target === cartModal) {
        cartModal.style.display = 'none';
    }
});

// Display cart items
function displayCartItems() {
    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="item-info">
                <h4>${item.name}</h4>
                <p>Rp ${item.price.toLocaleString('id-ID')} x ${item.quantity}</p>
            </div>
            <div class="item-price">Rp ${itemTotal.toLocaleString('id-ID')}</div>
        `;
        cartItems.appendChild(cartItem);
    });

    cartTotal.textContent = total.toLocaleString('id-ID');
}

// Proceed to checkout
checkoutBtn.addEventListener('click', function() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }

    cartModal.style.display = 'none';
    showCheckoutForm();
});

// Show checkout form
function showCheckoutForm() {
    // Replace current content with checkout form
    document.body.innerHTML = `
        <div class="checkout-form">
            <h2>Checkout</h2>
            <form id="order-form">
                <div class="form-group">
                    <label>Full Name:</label>
                    <input type="text" id="customer-name" required>
                </div>
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="customer-email" required>
                </div>
                <div class="form-group">
                    <label>Phone:</label>
                    <input type="tel" id="customer-phone" required>
                </div>
                <div class="form-group">
                    <label>Address:</label>
                    <textarea id="customer-address" required></textarea>
                </div>

                <div class="payment-info">
                    <h3>Payment Information</h3>
                    <div class="bank-details">
                        <p><strong>Bank:</strong> BCA</p>
                        <p><strong>Account Number:</strong> 1234567890</p>
                        <p><strong>Account Name:</strong> Luxe Fragrance</p>
                    </div>
                    <p>Please transfer the total amount to the account above and upload the proof of transfer.</p>
                </div>

                <div class="upload-proof" id="upload-area">
                    <p>Click to upload payment proof</p>
                    <p>or drag and drop</p>
                    <input type="file" id="proof-file" accept="image/*">
                </div>

                <button type="submit" class="btn">Complete Order</button>
            </form>
        </div>
    `;

    // Setup event listeners for new elements
    document.getElementById('upload-area').addEventListener('click', function() {
        document.getElementById('proof-file').click();
    });

    document.getElementById('order-form').addEventListener('submit', handleOrderSubmission);
}

// Save order to Google Spreadsheet via Web App
async function saveOrder(orderData, proofData) {
    // Prepare order data
    const orderPayload = {
        action: 'createOrder',
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        customer_address: orderData.customer_address,
        total_amount: orderData.total_amount,
        items: cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price
        }))
    };

    try {
        // 1. Save Order
        const orderResponse = await fetch(WEB_APP_URL, {
            method: 'POST',
            // mode: 'no-cors', // Hapus baris ini jika memungkinkan
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderPayload)
        });

        // Karena mode no-cors, kita tidak bisa membaca response body dengan mudah.
        // Kita asumsikan berhasil jika status 200 OK.
        if (!orderResponse.ok) {
             throw new Error(`HTTP error! status: ${orderResponse.status}`);
        }

        // 2. Save Payment Proof
        // Note: In a more robust system, the order ID would be returned by the createOrder action.
        // For simplicity here, we save the proof without linking it to a specific order ID.
        // A better approach would be to modify the Web App to return the order ID.
        const proofPayload = {
            action: 'savePaymentProof',
            order_id: 'UNKNOWN_ORDER_ID', // Placeholder - Web App should ideally return the real order ID
            proof_data: proofData // Base64 string
        };

        const proofResponse = await fetch(WEB_APP_URL, {
            method: 'POST',
            // mode: 'no-cors', // Hapus baris ini jika memungkinkan
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(proofPayload)
        });

        if (!proofResponse.ok) {
             throw new Error(`HTTP error saving proof! status: ${proofResponse.status}`);
        }

        // 3. Send WhatsApp notification (simulated)
        sendWhatsAppNotification(orderData);

        // 4. Clear cart
        cart = [];
        sessionStorage.removeItem('cart');

        console.log('Order and payment proof saved successfully');
        return true; // Indicate success

    } catch (error) {
        console.error('Error saving order:', error);
        throw error; // Re-throw for handleOrderSubmission to catch
    }
}


// Send WhatsApp notification (simulated)
function sendWhatsAppNotification(orderData) {
    // In a real implementation, you would use a WhatsApp API service or a link
    // This is a simplified simulation
    console.log('WhatsApp notification sent to admin');
    console.log('Order details:', orderData);
    // Example of a WhatsApp API call (requires a service like Twilio)
    // const phoneNumber = '+6281234567890'; // Admin's number
    // const message = `New Order: ${orderData.customer_name}, Total: Rp ${orderData.total_amount}`;
    // window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
}

// Handle order submission
async function handleOrderSubmission(e) {
    e.preventDefault();

    const proofFile = document.getElementById('proof-file').files[0];
    if (!proofFile) {
        showNotification('Please upload payment proof!');
        return;
    }

    // Convert image to base64
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Proof = e.target.result.split(',')[1]; // Remove image prefix

        // Get form data
        const orderData = {
            customer_name: document.getElementById('customer-name').value,
            customer_email: document.getElementById('customer-email').value,
            customer_phone: document.getElementById('customer-phone').value,
            customer_address: document.getElementById('customer-address').value,
            total_amount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            status: 'Pending',
            created_at: new Date().toISOString()
        };

        try {
            // Save order to Google Spreadsheet via Web App
            await saveOrder(orderData, base64Proof);

            // Show confirmation
            showOrderConfirmation();

        } catch (error) {
            console.error('Error:', error);
            showNotification('Error processing order. Please try again.');
        }
    };

    reader.readAsDataURL(proofFile);
}

// Show order confirmation
function showOrderConfirmation() {
    document.body.innerHTML = `
        <div class="confirmation-message">
            <h2>Order Placed Successfully!</h2>
            <p>Thank you for your order. We have received your payment proof and will process your order shortly.</p>
            <p>A confirmation email has been sent to your email address.</p>
            <a href="index.html" class="btn">Continue Shopping</a>
        </div>
    `;
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 3000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Setup event listeners
function setupEventListeners() {
    // Add any additional event listeners here
}
