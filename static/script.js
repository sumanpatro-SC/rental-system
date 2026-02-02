document.addEventListener("DOMContentLoaded", () => {
    // 1. Load Header & Footer
    fetch('/templates/header.html').then(r => r.text()).then(html => {
        if (document.getElementById('header-placeholder')) document.getElementById('header-placeholder').innerHTML = html;
    });
    fetch('/templates/footer.html').then(r => r.text()).then(html => {
        if (document.getElementById('footer-placeholder')) document.getElementById('footer-placeholder').innerHTML = html;
    });

    // 2. Load Widget
    loadWidget();

    // 3. Route Handling based on URL
    const path = window.location.pathname;
    if (path === "/" || path.endsWith("index.html")) loadDashboard();
    if (path === "/add-property") setupAddProperty();
    if (path === "/property-list") loadPropertyList();
    if (path === "/customer-details") loadCustomerPage();
    if (path === "/billing") loadBillingList();
});

// --- DASHBOARD ---
async function loadDashboard() {
    try {
        const res = await fetch('/api/properties');
        const data = await res.json();
        
        const available = data.filter(p => p.status === 'available').length;
        const rented = data.filter(p => p.status === 'rented').length;
        const total = data.length;

        // Using optional chaining or explicit checks to prevent errors if elements don't exist
        if (document.getElementById('avail-count')) document.getElementById('avail-count').innerText = available;
        if (document.getElementById('rented-count')) document.getElementById('rented-count').innerText = rented;
        if (document.getElementById('total-count')) document.getElementById('total-count').innerText = total;
    } catch (err) {
        console.error("Dashboard failed to load:", err);
    }
}

// --- ADD PROPERTY ---
function setupAddProperty() {
    const form = document.getElementById('propForm');
    if (!form) return;
    form.onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            title: document.getElementById('title').value,
            description: document.getElementById('desc').value,
            price: document.getElementById('price').value
        };
        const res = await fetch('/api/add-property', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) window.location.href = '/property-list';
    };
}

// --- PROPERTY LIST ---
async function loadPropertyList() {
    const res = await fetch('/api/properties');
    const data = await res.json();
    const tbody = document.querySelector("#propTable tbody");
    if (tbody) {
        tbody.innerHTML = data.map((p, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${p.title}</td>
                <td>₹${p.price}</td>
                <td><span class="status-${p.status}">${p.status}</span></td>
                <td style="text-align:right;">
                    <button class="btn-del" onclick="deleteItem('properties', ${p.id})">Delete</button>
                </td>
            </tr>`).join('');
    }
}

// --- CUSTOMER PAGE & ADD CUSTOMER ---
async function loadCustomerPage() {
    const resP = await fetch('/api/properties');
    const props = await resP.json();
    const select = document.getElementById('propSelect');
    if (select) {
        select.innerHTML = '<option value="">-- Choose a Property --</option>';
        props.forEach(p => {
            if (p.status === 'available') {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.innerHTML = `${p.title} (₹${p.price})`;
                select.appendChild(opt);
            }
        });
    }

    const custForm = document.getElementById('custForm');
    if (custForm) {
        custForm.onsubmit = async (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('cname').value,
                contact: document.getElementById('cphone').value,
                property_id: document.getElementById('propSelect').value,
                date: document.getElementById('bdate').value
            };
            const res = await fetch('/api/add-customer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) window.location.reload();
        };
    }

    const resC = await fetch('/api/billing-data');
    const custs = await resC.json();
    const tbody = document.querySelector("#custTable tbody");
    if (tbody) {
        tbody.innerHTML = custs.map(c => `
            <tr>
                <td>${c.c_name}</td>
                <td>${c.contact}</td>
                <td>${c.p_name}</td>
                <td>${c.date}</td>
                <td style="text-align:right;">
                    <button class="btn-del" onclick="deleteItem('billing', ${c.id})">Delete</button>
                </td>
            </tr>`).join('');
    }
}

// --- BILLING LIST ---
async function loadBillingList() {
    const res = await fetch('/api/billing-data');
    const data = await res.json();
    const tbody = document.querySelector("#billingTable tbody");
    if (tbody) {
        tbody.innerHTML = data.map(b => `
            <tr>
                <td>${b.p_name}</td>
                <td>${b.c_name}</td>
                <td>₹${b.price}</td>
                <td>${b.contact}</td>
                <td>${b.date}</td>
                <td style="text-align:right;">
                    <button class="btn-info" onclick="viewDetails(${b.id})">View</button>
                    <button class="btn-del" onclick="deleteItem('billing', ${b.id})">Delete</button>
                </td>
            </tr>`).join('');
    }
}

// --- PDF DOWNLOAD ---
function downloadPDF(tableId, reportName) {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
        alert("PDF Library not loaded yet.");
        return;
    }

    const doc = new jsPDF();
    doc.text(reportName, 14, 22);
    doc.autoTable({
        html: `#${tableId}`,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [40, 167, 69] },
        didParseCell: function(data) {
            if (data.column.index === (data.table.columns.length - 1)) {
                data.cell.text = '';
            }
        }
    });
    doc.save(`${reportName}.pdf`);
}

// --- view ---
let currentBillingData = null;

async function viewDetails(billingId) {
    const res = await fetch('/api/billing-data');
    const data = await res.json();
    
    // Find the specific person by ID
    const person = data.find(item => item.id === billingId);
    
    if (person) {
        currentBillingData = person;
        const container = document.getElementById('detailBody');
        container.innerHTML = `
            <p><strong>👤 Tenant Name:</strong> ${person.c_name}</p>
            <p><strong>📞 Contact No:</strong> ${person.contact}</p>
            <p><strong>📅 Booking Date:</strong> ${person.date}</p>
            <hr>
            <p><strong>🏠 Property Title:</strong> ${person.p_name}</p>
            <p><strong>💰 Rent Amount:</strong> ₹${person.price}</p>
            <p><strong>🆔 Property ID:</strong> ${person.p_id}</p>
        `;
        document.getElementById('qrcodeContainer').style.display = 'none';
        document.getElementById('qrcode').innerHTML = '';
        document.getElementById('viewModal').style.display = 'block';
    }
}

function generateQRCode() {
    if (!currentBillingData) {
        alert('Please open details first');
        return;
    }
    
    const qrcodeDiv = document.getElementById('qrcode');
    const qrcodeContainer = document.getElementById('qrcodeContainer');
    
    // Clear the previous QR code completely
    qrcodeDiv.innerHTML = '';
    
    // Create compact QR code data with tenant and property information
    const qrData = `Name: ${currentBillingData.c_name}\nPhone: ${currentBillingData.contact}\nProperty: ${currentBillingData.p_name}\nRent: ₹${currentBillingData.price}\nDate: ${currentBillingData.date}`;
    
    try {
        // Make sure QRCode library is available
        if (typeof QRCode === 'undefined') {
            console.error('QRCode library not loaded');
            alert('QR Code library is not loaded. Please refresh the page.');
            return;
        }
        
        // Generate QR code with lower error correction level to handle more data
        const qrCode = new QRCode(qrcodeDiv, {
            text: qrData,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.L  // Changed from H to L (Low) to encode more data
        });
        
        // Show the container
        qrcodeContainer.style.display = 'block';
        console.log('QR Code generated successfully');
    } catch (error) {
        console.error('Error generating QR code:', error);
        // Try with even more compact data if first attempt fails
        try {
            qrcodeDiv.innerHTML = '';
            const compactData = `${currentBillingData.c_name}|${currentBillingData.contact}|${currentBillingData.p_name}|${currentBillingData.price}`;
            new QRCode(qrcodeDiv, {
                text: compactData,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.L
            });
            qrcodeContainer.style.display = 'block';
            console.log('QR Code generated with compact format');
        } catch (fallbackError) {
            console.error('Error even with compact format:', fallbackError);
            alert('Error generating QR code. The data might be too large.');
        }
    }
}

function closeView() {
    document.getElementById('viewModal').style.display = 'none';
    currentBillingData = null;
}

// --- UTILITIES ---
function downloadCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    let csv = "\uFEFF"; 
    for (let row of table.rows) {
        let cols = Array.from(row.cells).slice(0, -1);
        csv += cols.map(c => `"${c.innerText}"`).join(",") + "\r\n";
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = filename + ".csv";
    link.click();
}

function filterTable(tableId, inputId) {
    const input = document.getElementById(inputId).value.toUpperCase();
    const rows = document.querySelector(`#${tableId} tbody`).rows;
    for (const row of rows) {
        row.style.display = row.innerText.toUpperCase().includes(input) ? "" : "none";
    }
}

function sortTable(tableId, n) {
    const table = document.getElementById(tableId);
    const rows = Array.from(table.tBodies[0].rows);
    const dir = table.getAttribute("data-dir") === "asc" ? "desc" : "asc";
    rows.sort((a, b) => {
        let x = a.cells[n].innerText.toLowerCase();
        let y = b.cells[n].innerText.toLowerCase();
        return dir === "asc" ? x.localeCompare(y, undefined, {numeric: true}) : y.localeCompare(x, undefined, {numeric: true});
    });
    rows.forEach(row => table.tBodies[0].appendChild(row));
    table.setAttribute("data-dir", dir);
}

async function deleteItem(type, id) {
    await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
    location.reload();
}

// --- CHAT WIDGET ---
const WIDGET_DATA = {
    tech: {
        title: "🛠️ Tech Stack",
        content: `
            <div class="widget-message bot-message">
                <p><strong>Backend:</strong> Python HTTP Server</p>
                <p><strong>Database:</strong> SQLite3</p>
                <p><strong>Frontend:</strong> Vanilla JavaScript</p>
                <p><strong>Styling:</strong> CSS3</p>
                <p><strong>Libraries:</strong></p>
                <ul style="margin: 8px 0;">
                    <li>jsPDF - PDF Generation</li>
                    <li>QRCode.js - QR Code Generator</li>
                    <li>Font Awesome - Icons</li>
                </ul>
            </div>
        `
    },
    languages: {
        title: "💻 Programming Languages",
        content: `
            <div class="widget-message bot-message">
                <p><strong>Python 3.x</strong> - Backend Server & Database Operations</p>
                <p><strong>JavaScript (ES6+)</strong> - Frontend Interactivity & DOM Manipulation</p>
                <p><strong>HTML5</strong> - Markup Structure</p>
                <p><strong>CSS3</strong> - Responsive Styling & Animations</p>
                <p><strong>SQL</strong> - Database Queries</p>
            </div>
        `
    },
    features: {
        title: "⭐ Key Features",
        content: `
            <div class="widget-message bot-message">
                <p><strong>Property Management:</strong></p>
                <ul style="margin: 8px 0;">
                    <li>Add & Delete Properties</li>
                    <li>Track Property Status (Available/Rented)</li>
                </ul>
                <p><strong>Tenant Management:</strong></p>
                <ul style="margin: 8px 0;">
                    <li>Add & Remove Tenants</li>
                    <li>Billing Information</li>
                </ul>
                <p><strong>Reporting & Export:</strong></p>
                <ul style="margin: 8px 0;">
                    <li>PDF Report Generation</li>
                    <li>CSV Export</li>
                    <li>QR Code Generation</li>
                </ul>
                <p><strong>Dashboard:</strong> Real-time Statistics & Quick Actions</p>
            </div>
        `
    },
    database: {
        title: "🗄️ Database Schema",
        content: `
            <div class="widget-message bot-message">
                <p><strong>Properties Table:</strong></p>
                <ul style="margin: 8px 0;">
                    <li>id - Primary Key</li>
                    <li>title - Property Name</li>
                    <li>description - Details</li>
                    <li>price - Monthly Rent</li>
                    <li>status - available/rented</li>
                </ul>
                <p><strong>Customers Table:</strong></p>
                <ul style="margin: 8px 0;">
                    <li>id - Primary Key</li>
                    <li>name - Tenant Name</li>
                    <li>contact - Phone Number</li>
                    <li>property_id - FK to Properties</li>
                    <li>billing_date - Rental Date</li>
                </ul>
            </div>
        `
    }
};

function loadWidget() {
    fetch('/templates/widget.html').then(r => r.text()).then(html => {
        const widgetContainer = document.createElement('div');
        widgetContainer.innerHTML = html;
        document.body.appendChild(widgetContainer);
        initializeWidget();
    }).catch(err => console.error('Failed to load widget:', err));
}

function initializeWidget() {
    const widgetIcon = document.getElementById('widget-icon');
    const widgetChat = document.getElementById('widget-chat');
    const widgetClose = document.getElementById('widget-close');
    const infoBtns = document.querySelectorAll('.info-btn');
    const widgetSendBtn = document.getElementById('widget-send');
    const widgetInput = document.getElementById('widget-input');

    // Toggle widget window
    widgetIcon?.addEventListener('click', () => {
        widgetChat?.classList.toggle('hidden');
    });

    // Close widget
    widgetClose?.addEventListener('click', () => {
        widgetChat?.classList.add('hidden');
    });

    // Info section buttons
    infoBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            displayWidgetInfo(section);
        });
    });

    // Send message
    widgetSendBtn?.addEventListener('click', () => {
        const message = widgetInput?.value.trim();
        if (message) {
            sendWidgetMessage(message);
            widgetInput.value = '';
        }
    });

    // Enter key to send
    widgetInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            widgetSendBtn?.click();
        }
    });
}

function displayWidgetInfo(section) {
    const displayArea = document.getElementById('widget-display');
    if (!displayArea || !WIDGET_DATA[section]) return;

    const data = WIDGET_DATA[section];
    displayArea.innerHTML = data.content;

    // Scroll to content
    setTimeout(() => {
        displayArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

function sendWidgetMessage(message) {
    const displayArea = document.getElementById('widget-display');
    if (!displayArea) return;

    // User message
    const userMsg = document.createElement('div');
    userMsg.className = 'widget-message user-message';
    userMsg.innerHTML = `<p>${escapeHtml(message)}</p>`;
    displayArea.appendChild(userMsg);

    // Bot response
    const botMsg = document.createElement('div');
    botMsg.className = 'widget-message bot-message';
    
    const response = generateBotResponse(message.toLowerCase());
    botMsg.innerHTML = `<p>${response}</p>`;
    displayArea.appendChild(botMsg);

    // Scroll to latest message
    setTimeout(() => {
        displayArea.scrollTop = displayArea.scrollHeight;
    }, 100);
}

function generateBotResponse(message) {
    if (message.includes('tech') || message.includes('stack') || message.includes('technology')) {
        return '📚 Check the <strong>Tech Stack</strong> button above to learn about our technologies!';
    }
    if (message.includes('language') || message.includes('programming')) {
        return '💻 Click the <strong>Languages</strong> button to see what we use!';
    }
    if (message.includes('feature') || message.includes('can')) {
        return '⭐ Visit <strong>Features</strong> to see all capabilities!';
    }
    if (message.includes('database') || message.includes('data')) {
        return '🗄️ Check the <strong>Database</strong> section to learn our schema!';
    }
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
        return '👋 Hello! Great to meet you. Use the buttons above to explore the project!';
    }
    if (message.includes('help') || message.includes('how')) {
        return '🤝 Click any info button above to learn about different aspects of this project!';
    }
    if (message.includes('thanks') || message.includes('thank')) {
        return '😊 You\'re welcome! Feel free to ask any other questions!';
    }
    
    return '💡 Try asking about: Tech Stack, Languages, Features, or Database!';
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}