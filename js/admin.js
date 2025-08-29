// Konfigurasi Google Spreadsheet dan Web App
const SPREADSHEET_ID = '1lx8r1ugap_4Y2feyGAsa_2v9-t852NeH1pde71W72Vw';
const API_KEY = 'AIzaSyAMp_WQyxpTc4bWsP19Fy1W-rha9oHbx7o';
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyp-KJ-MfvcyKe7MTI4Ode1V9SnZWand5F_mwYLkUHUAnvoWrct9UnZ53aVQzNS13_C/exec'; // e.g., https://script.google.com/macros/s/.../exec

// Admin Dashboard JavaScript
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'luxe123';

// DOM Elements
const loginForm = document.getElementById('admin-login');
const dashboard = document.getElementById('dashboard');
const logoutBtn = document.getElementById('logout-btn');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const productModal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');

// State
let currentTab = 'inventory';
let products = [];
let orders = [];

// Check if already logged in
document.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        showDashboard();
        loadDashboardData();
    }
});

// Admin Login
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        showDashboard();
        loadDashboardData();
    } else {
        alert('Invalid credentials!');
    }
});

// Show Dashboard
function showDashboard() {
    document.getElementById('login-form').style.display = 'none';
    dashboard.style.display = 'block';
}

// Logout
logoutBtn.addEventListener('click', function() {
    sessionStorage.removeItem('adminLoggedIn');
    location.reload();
});

// Tab Navigation
tabButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Update active button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');

        // Show active tab
        const tabName = this.dataset.tab;
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabName}-tab`) {
                content.classList.add('active');
            }
        });

        currentTab = tabName;

        // Load data for active tab if needed
        if (tabName === 'inventory') {
            loadProducts();
        } else if (tabName === 'orders') {
            loadOrders();
        } else if (tabName === 'analytics') {
            loadAnalytics();
        }
    });
});

// Load Dashboard Data
async function loadDashboardData() {
    await loadProducts();
    await loadOrders();
    loadAnalytics();
}

// --- PRODUCT MANAGEMENT ---

// Load Products dari Google Spreadsheet (READ)
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
        } else {
            products = [];
        }

        displayProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Failed to load products. Check console for details.');
        products = [];
        displayProducts();
    }
}

// Display Products
function displayProducts() {
    const container = document.getElementById('inventory-container');
    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = '<p>No products found.</p>';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'inventory-card';
        card.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}" class="inventory-image" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div class="inventory-info">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p><strong>Price:</strong> Rp ${parseInt(product.price || 0).toLocaleString('id-ID')}</p>
                <p><strong>Category:</strong> ${product.category}</p>
                <p><strong>Stock:</strong> ${product.stock}</p>
                <div class="inventory-actions">
                    <button class="edit-btn" data-id="${product.id}">Edit</button>
                    <button class="delete-btn" data-id="${product.id}">Delete</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    // Add event listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.dataset.id;
            editProduct(productId);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.dataset.id;
            deleteProduct(productId);
        });
    });
}

// Add Product Button
document.getElementById('add-product-btn').addEventListener('click', function() {
    document.getElementById('modal-title').textContent = 'Add New Product';
    productForm.reset();
    document.getElementById('product-id').value = '';
    productModal.style.display = 'block';
});

// Edit Product
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        document.getElementById('modal-title').textContent = 'Edit Product';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name || '';
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-price').value = product.price || '';
        document.getElementById('product-category').value = product.category || 'men';
        document.getElementById('product-stock').value = product.stock || '';
        document.getElementById('product-image').value = product.image_url || '';
        productModal.style.display = 'block';
    }
}

// Delete Product (via Web App)
async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                // mode: 'no-cors', // Hapus baris ini jika memungkinkan
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'deleteProduct',
                    id: productId
                })
            });

            // Karena mode no-cors, kita tidak bisa membaca response body dengan mudah.
            // Kita asumsikan berhasil jika status 200 OK.
            if (response.ok) {
                 alert('Product deleted successfully!');
                 // Reload data
                 await loadProducts();
            } else {
                 throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
             console.error('Error deleting product:', error);
             alert('Error deleting product. Please check console.');
        }
    }
}

// Product Form Submission (via Web App)
productForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const productId = document.getElementById('product-id').value;
    const productData = {
        id: productId || null,
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        price: document.getElementById('product-price').value,
        category: document.getElementById('product-category').value,
        stock: document.getElementById('product-stock').value,
        image_url: document.getElementById('product-image').value
    };

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            // mode: 'no-cors', // Hapus baris ini jika memungkinkan
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: productId ? 'updateProduct' : 'addProduct',
                ...productData
            })
        });

        // Karena mode no-cors, kita tidak bisa membaca response body dengan mudah.
        // Kita asumsikan berhasil jika status 200 OK.
        if (response.ok) {
            alert(productId ? 'Product updated successfully!' : 'Product added successfully!');
            productModal.style.display = 'none';
            // Reload data
            await loadProducts();
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Error saving product. Please check console.');
    }
});

// Close Modal
document.querySelectorAll('.close').forEach(button => {
    button.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
    });
});

window.addEventListener('click', function(e) {
    if (e.target === productModal) {
        productModal.style.display = 'none';
    }
});

// --- ORDER MANAGEMENT ---

// Load Orders dari Google Spreadsheet (READ)
async function loadOrders() {
    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/orders?key=${API_KEY}`
        );
        const data = await response.json();

        if (data.values && data.values.length > 1) {
            // Convert to array of objects
            const headers = data.values[0];
            orders = data.values.slice(1).map(row => {
                const order = {};
                headers.forEach((header, index) => {
                    order[header] = row[index] || '';
                });
                return order;
            });
        } else {
            orders = [];
        }

        displayOrders();
    } catch (error) {
        console.error('Error loading orders:', error);
        alert('Failed to load orders. Check console for details.');
        orders = [];
        displayOrders();
    }
}

// Display Orders
function displayOrders() {
    const container = document.getElementById('orders-container');
    container.innerHTML = '';

    if (orders.length === 0) {
        container.innerHTML = '<p>No orders found.</p>';
        return;
    }

    // Apply filters
    let filteredOrders = [...orders];

    const statusFilter = document.getElementById('status-filter').value;
    if (statusFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
    }

    // Apply sorting
    const sortValue = document.getElementById('sort-orders').value;
    filteredOrders.sort((a, b) => {
        switch (sortValue) {
            case 'date_desc':
                return new Date(b.created_at) - new Date(a.created_at);
            case 'date_asc':
                return new Date(a.created_at) - new Date(b.created_at);
            case 'amount_desc':
                return parseInt(b.total_amount || 0) - parseInt(a.total_amount || 0);
            case 'amount_asc':
                return parseInt(a.total_amount || 0) - parseInt(b.total_amount || 0);
            default:
                return 0;
        }
    });

    filteredOrders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'order-card';
        card.innerHTML = `
            <div class="order-header">
                <div class="order-id">Order #${order.id}</div>
                <div class="order-status status-${(order.status || '').toLowerCase().replace(' ', '-')}">
                    ${order.status || 'Unknown'}
                </div>
            </div>
            <div class="order-details">
                <p><strong>Customer:</strong> ${order.customer_name || 'N/A'}</p>
                <p><strong>Email:</strong> ${order.customer_email || 'N/A'}</p>
                <p><strong>Phone:</strong> ${order.customer_phone || 'N/A'}</p>
                <p><strong>Address:</strong> ${order.customer_address || 'N/A'}</p>
                <p><strong>Date:</strong> ${order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID') : 'N/A'}</p>
            </div>
            <div class="order-items">
                <!-- Note: In a full implementation, you'd fetch order items from the 'order_items' sheet -->
                <div class="order-item">
                    <span>Order items (see order_items sheet)</span>
                    <span>Rp 0</span>
                </div>
            </div>
            <div class="order-total">
                Total: Rp ${parseInt(order.total_amount || 0).toLocaleString('id-ID')}
            </div>
            <div class="status-update">
                <select class="status-select" data-order-id="${order.id}">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Proof Uploaded" ${order.status === 'Proof Uploaded' ? 'selected' : ''}>Proof Uploaded</option>
                    <option value="Paid" ${order.status === 'Paid' ? 'selected' : ''}>Paid</option>
                </select>
                <button class="update-status-btn" data-order-id="${order.id}">Update Status</button>
            </div>
        `;
        container.appendChild(card);
    });

    // Add event listeners for status updates
    document.querySelectorAll('.update-status-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.dataset.orderId;
            const select = document.querySelector(`.status-select[data-order-id="${orderId}"]`);
            updateOrderStatus(orderId, select.value);
        });
    });
}

// Update Order Status (via Web App)
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            // mode: 'no-cors', // Hapus baris ini jika memungkinkan
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'updateOrderStatus',
                order_id: orderId,
                status: newStatus
            })
        });

        // Karena mode no-cors, kita tidak bisa membaca response body dengan mudah.
        // Kita asumsikan berhasil jika status 200 OK.
        if (response.ok) {
            // Update UI optimistically
            const order = orders.find(o => o.id === orderId);
            if (order) {
                order.status = newStatus;
                displayOrders(); // Refresh display
                alert(`Order ${orderId} status updated to ${newStatus}`);
            }
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('Error updating order status. Please check console.');
    }
}


// Filter and Sort Event Listeners
document.getElementById('status-filter').addEventListener('change', displayOrders);
document.getElementById('sort-orders').addEventListener('change', displayOrders);

// --- ANALYTICS ---

// Load Analytics
function loadAnalytics() {
    // Calculate statistics
    const totalSales = orders.reduce((sum, order) => sum + parseInt(order.total_amount || 0), 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === 'Pending').length;

    // Update stats cards
    document.getElementById('total-sales').textContent = `Rp ${totalSales.toLocaleString('id-ID')}`;
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('pending-orders').textContent = pendingOrders;

    // Create charts
    createSalesChart();
    createCategoryChart();
}

// Create Sales Chart
function createSalesChart() {
    const ctx = document.getElementById('sales-chart').getContext('2d');

    // Simulated monthly sales data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const salesData = [15000000, 18000000, 22000000, 19000000, 25000000, 28000000];

    // Destroy existing chart if it exists
    if (window.salesChart) {
        window.salesChart.destroy();
    }

    window.salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Monthly Sales (IDR)',
                data: salesData,
                borderColor: '#8B4513',
                backgroundColor: 'rgba(139, 69, 19, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rp ' + (value / 1000000) + 'M';
                        }
                    }
                }
            }
        }
    });
}

// Create Category Chart
function createCategoryChart() {
    const ctx = document.getElementById('category-chart').getContext('2d');

    // Simulated category data
    const categories = ['Men', 'Women', 'Unisex'];
    const sales = [45, 35, 20];

    // Destroy existing chart if it exists
    if (window.categoryChart) {
        window.categoryChart.destroy();
    }

    window.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: sales,
                backgroundColor: [
                    '#8B4513',
                    '#D4AF37',
                    '#5D4037'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}
