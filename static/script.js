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
    backend: {
        title: "🔧 Backend Architecture & Server Logic",
        content: `
            <div class="widget-message bot-message">
                <p>The backend uses Python's native <strong>http.server</strong> module with manual route handling in <code>do_GET()</code> and <code>do_POST()</code>. Requests are parsed by reading <code>Content-Length</code> and decoding JSON from <code>self.rfile</code>. CORS and basic auth are implemented via headers. The server is single-threaded by default but can be scaled using <code>ThreadingMixIn</code>.</p>
            </div>
        `
    },
    data: {
        title: "🗄️ Data Management & SQL Integrity",
        content: `
            <div class="widget-message bot-message">
                <p>Persistence uses <strong>SQLite3</strong> (single-file DB). The schema links <code>properties</code> and <code>customers</code> via <code>property_id</code>. SQL uses parameterized queries to prevent injection. Referential integrity is enforced with <code>ON DELETE CASCADE</code> and joins/aggregations are used for reports and revenue calculations.</p>
            </div>
        `
    },
    frontend: {
        title: "🖥️ Frontend Interactivity (ES6+)",
        content: `
            <div class="widget-message bot-message">
                <p>The UI is built with vanilla JavaScript (ES6+). Async operations use <code>fetch()</code> with <code>async/await</code>. DOM is updated dynamically with template literals. Event delegation and client-side validation are used for robustness; table updates often modify the DOM directly for snappy UX.</p>
            </div>
        `
    },
    css: {
        title: "🎨 Responsive UI & CSS Design",
        content: `
            <div class="widget-message bot-message">
                <p>Styling is pure CSS3 using Flexbox and Grid for layout. Media queries enable responsive behavior and a CSS variable-based Dark Mode is supported. Transitions provide subtle UX feedback and status classes (e.g. <code>status-available</code>) give clear visual cues.</p>
            </div>
        `
    },
    scaling: {
        title: "🚀 Feature Integration & Scaling",
        content: `
            <div class="widget-message bot-message">
                <p>Reporting uses <strong>jsPDF</strong> and CSV exports; QRCode.js generates property QR codes. For production scaling the plan includes migrating to PostgreSQL, adding pagination, role-based auth, encrypted payments, and stronger security layers.</p>
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

    const widgetContainerEl = document.getElementById('widget-container');
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // Restore saved position
    try {
        const saved = localStorage.getItem('widgetPos');
        if (saved && widgetContainerEl) {
            const pos = JSON.parse(saved);
            widgetContainerEl.style.right = 'auto';
            widgetContainerEl.style.bottom = 'auto';
            widgetContainerEl.style.left = (pos.left || 20) + 'px';
            widgetContainerEl.style.top = (pos.top || (window.innerHeight - widgetContainerEl.offsetHeight - 20)) + 'px';
        }
    } catch (e) {
        console.warn('Could not restore widget position', e);
    }

    // Helper to position chat in opposite quadrant
    function positionChat() {
        if (!widgetChat || !widgetIcon || !widgetContainerEl) return;

        const containerRect = widgetContainerEl.getBoundingClientRect();
        const iconSize = 60; // icon width/height
        const chatWidth = 360;
        const chatHeight = 600;
        const gap = 12;
        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;

        let left = 'auto';
        let right = 'auto';
        let top = 'auto';
        let bottom = 'auto';

        // Determine which quadrant the icon is in
        const isRight = containerRect.left > screenCenterX;
        const isTop = containerRect.top < screenCenterY;

        // Position chat in the opposite quadrant
        if (isRight && isTop) {
            // Icon in top-right → chat opens left + down
            left = -chatWidth - gap + 'px';
            top = iconSize + gap + 'px';
        } else if (!isRight && isTop) {
            // Icon in top-left → chat opens right + down
            right = -chatWidth - gap + 'px';
            top = iconSize + gap + 'px';
        } else if (isRight && !isTop) {
            // Icon in bottom-right → chat opens left + up
            left = -chatWidth - gap + 'px';
            bottom = iconSize + gap + 'px';
        } else {
            // Icon in bottom-left → chat opens right + up
            right = -chatWidth - gap + 'px';
            bottom = iconSize + gap + 'px';
        }

        // Apply positioning
        widgetChat.style.left = left;
        widgetChat.style.right = right;
        widgetChat.style.top = top;
        widgetChat.style.bottom = bottom;
    }

    // Toggle widget window (only when not dragging)
    widgetIcon?.addEventListener('click', (e) => {
        if (isDragging) return;
        if (widgetChat?.classList.contains('hidden')) {
            positionChat();
            widgetChat?.classList.remove('hidden');
        } else {
            widgetChat?.classList.add('hidden');
        }
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

    // DRAG HANDLERS (mouse + touch)
    function onDragMove(e) {
        e.preventDefault();
        isDragging = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const left = Math.max(8, Math.min(clientX - dragOffsetX, window.innerWidth - widgetContainerEl.offsetWidth - 8));
        const top = Math.max(8, Math.min(clientY - dragOffsetY, window.innerHeight - widgetContainerEl.offsetHeight - 8));
        widgetContainerEl.style.left = left + 'px';
        widgetContainerEl.style.top = top + 'px';
        widgetContainerEl.style.right = 'auto';
        widgetContainerEl.style.bottom = 'auto';
    }

    function onDragEnd() {
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        document.removeEventListener('touchmove', onDragMove);
        document.removeEventListener('touchend', onDragEnd);
        widgetIcon?.classList.remove('grabbing');
        // save position
        try {
            const rect = widgetContainerEl.getBoundingClientRect();
            localStorage.setItem('widgetPos', JSON.stringify({ left: Math.round(rect.left), top: Math.round(rect.top) }));
        } catch (e) {}
        // short delay: avoid click after drag
        setTimeout(() => { isDragging = false; }, 0);
    }

    function onDragStart(e) {
        e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = widgetContainerEl.getBoundingClientRect();
        dragOffsetX = clientX - rect.left;
        dragOffsetY = clientY - rect.top;
        isDragging = false;
        widgetIcon?.classList.add('grabbing');
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        document.addEventListener('touchmove', onDragMove, { passive: false });
        document.addEventListener('touchend', onDragEnd);
    }

    widgetIcon?.addEventListener('mousedown', onDragStart);
    widgetIcon?.addEventListener('touchstart', onDragStart, { passive: false });
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
    // Topic matching -> show the detailed section and return a short reply
    const mapping = [
        {keys: ['backend','server','http.server','do_get','do_post','cors','threading'], section: 'backend'},
        {keys: ['sqlite','database','sql','schema','foreign','cascade','integrity','parameterized'], section: 'data'},
        {keys: ['javascript','es6','fetch','dom','async','await','template','event','delegation'], section: 'frontend'},
        {keys: ['css','responsive','flexbox','grid','media','dark mode','ui'], section: 'css'},
        {keys: ['scale','scal','postgres','pagination','security','roles','payment','gateway'], section: 'scaling'}
    ];

    for (const m of mapping) {
        for (const k of m.keys) {
            if (message.includes(k)) {
                // show section content in the display area
                try { displayWidgetInfo(m.section); } catch (e) {}
                return `Showing <strong>${WIDGET_DATA[m.section].title}</strong> below.`;
            }
        }
    }

    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
        return '👋 Hello! Use the buttons to view detailed project sections or ask about Backend, Database, Frontend, CSS, or Scaling.';
    }
    if (message.includes('help') || message.includes('how')) {
        return '🤝 Try asking: "backend architecture", "database schema", "frontend interactivity", "css responsive", or "scaling".';
    }
    if (message.includes('thanks') || message.includes('thank')) {
        return '😊 You\'re welcome! Ask another question or click a section button.';
    }

    return '💡 I can answer questions about Backend, Database, Frontend, CSS, and Scaling. Try one of those keywords.';
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