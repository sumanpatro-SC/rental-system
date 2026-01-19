document.addEventListener("DOMContentLoaded", () => {
    fetch('/templates/header.html').then(r => r.text()).then(html => {
        if (document.getElementById('header-placeholder')) document.getElementById('header-placeholder').innerHTML = html;
    });
    fetch('/templates/footer.html').then(r => r.text()).then(html => {
        if (document.getElementById('footer-placeholder')) document.getElementById('footer-placeholder').innerHTML = html;
    });

    const path = window.location.pathname;
    if (path === "/" || path.endsWith("index.html")) loadDashboard();
    if (path === "/add-property") setupAddProperty();
    if (path === "/property-list") loadPropertyList();
    if (path === "/customer-details") loadCustomerPage();
    if (path === "/billing") loadBillingList();
});

// --- DASHBOARD ---
async function loadDashboard() {
    const res = await fetch('/api/properties');
    const data = await res.json();
    const count = data.filter(p => p.status === 'available').length;
    const countEl = document.getElementById('avail-count');
    if (countEl) countEl.innerText = count;
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
        if (res.ok) { window.location.href = '/property-list'; }
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
                    <button class="btn-info" onclick="viewRowInfo(this)">QR Info</button>
                    <button class="btn-del" onclick="deleteItem('properties', ${p.id})">Delete</button>
                </td>
            </tr>`).join('');
    }
}

// --- CUSTOMER PAGE ---
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
            const custId = document.getElementById('custId').value;
            const body = {
                name: document.getElementById('cname').value,
                contact: document.getElementById('cphone').value,
                property_id: document.getElementById('propSelect').value,
                date: document.getElementById('bdate').value
            };
            await fetch('/api/add-customer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (custId) { await fetch(`/api/billing/${custId}`, { method: 'DELETE' }); }
            location.reload();
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
                    <button class="btn-edit" onclick='editCustomer(${JSON.stringify(c)})'>Edit</button>
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
                    <button class="btn-info" onclick="viewRowInfo(this)">QR Info</button>
                    <button class="btn-del" onclick="deleteItem('billing', ${b.id})">Delete</button>
                </td>
            </tr>`).join('');
    }
}

// --- QR INFO GENERATION (Using Library) ---
function viewRowInfo(btn) {
    const row = btn.closest("tr");
    const table = row.closest("table");
    const cells = Array.from(row.cells).slice(0, -1);
    const modal = document.getElementById("qrModal");
    const container = document.getElementById("qrcode");

    modal.style.display = "block";
    container.innerHTML = ""; // Clear old QR

    let qrText = "";
    cells.forEach((cell, index) => {
        const header = table.tHead.rows[0].cells[index].innerText.replace(" ↕", "");
        qrText += `${header}: ${cell.innerText}\n`;
    });

    // Generate real QR Code
    new QRCode(container, {
        text: qrText,
        width: 150,
        height: 150
    });
}

function viewTableInfo(tableId) {
    const table = document.getElementById(tableId);
    const rows = Array.from(table.querySelector("tbody").rows);
    const modal = document.getElementById("qrModal");
    const container = document.getElementById("qrcode");

    modal.style.display = "block";
    container.innerHTML = "<h3>Table Summary</h3>";

    rows.forEach((row) => {
        if (row.style.display !== "none") {
            const div = document.createElement("div");
            div.style.borderBottom = "1px solid #eee";
            div.style.padding = "5px";
            div.innerText = row.innerText.replace(/\t/g, " | ");
            container.appendChild(div);
        }
    });
}

function closeQR() { document.getElementById("qrModal").style.display = "none"; }

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

function downloadPDF() { window.print(); }

function filterTable(tableId, inputId) {
    const input = document.getElementById(inputId).value.toUpperCase();
    const rows = document.querySelector(`#${tableId} tbody`).rows;
    for (const row of rows) {
        row.style.display = row.innerText.toUpperCase().includes(input) ? "" : "none";
    }
}

function sortTable(tableId, n) {
    const table = document.getElementById(tableId);
    const rows = Array.from(table.rows).slice(1);
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
    if (confirm("Confirm deletion?")) {
        await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
        location.reload();
    }
}

function editCustomer(cust) {
    document.getElementById('form-title').innerText = "Edit Customer Details";
    document.getElementById('custId').value = cust.id;
    document.getElementById('cname').value = cust.c_name;
    document.getElementById('cphone').value = cust.contact;
    document.getElementById('bdate').value = cust.date;
    document.getElementById('saveBtn').innerText = "Update Details";
    const select = document.getElementById('propSelect');
    const opt = document.createElement('option');
    opt.value = cust.p_id; opt.innerHTML = cust.p_name; opt.selected = true;
    select.appendChild(opt);
    window.scrollTo(0, 0);
}