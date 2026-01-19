document.addEventListener("DOMContentLoaded", () => {
    // 1. Load Header & Footer
    fetch('/templates/header.html').then(r => r.text()).then(html => {
        const header = document.getElementById('header-placeholder');
        if (header) header.innerHTML = html;
    });
    fetch('/templates/footer.html').then(r => r.text()).then(html => {
        const footer = document.getElementById('footer-placeholder');
        if (footer) footer.innerHTML = html;
    });

    // 2. Route Handling
    const path = window.location.pathname;
    if (path === "/" || path.endsWith("index.html")) loadDashboard();
    if (path === "/property-list") loadPropertyList();
    if (path === "/customer-details") loadCustomerPage();
    if (path === "/billing") loadBillingList();
});

// --- DATA LOADING LOGIC ---

async function loadDashboard() {
    const res = await fetch('/api/properties');
    const data = await res.json();
    const count = data.filter(p => p.status === 'available').length;
    const countEl = document.getElementById('avail-count');
    if (countEl) countEl.innerText = count;
}

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
                <td>${p.status}</td>
                <td>
                    <button class="btn-edit" onclick="viewQR('Prop: ${p.title} | Rent: ${p.price}')">View Info</button>
                    <button class="btn-del" onclick="deleteItem('properties', ${p.id})">Delete</button>
                </td>
            </tr>`).join('');
    }
}

async function loadCustomerPage() {
    const resP = await fetch('/api/properties');
    const props = await resP.json();
    const select = document.getElementById('propSelect');
    if (select) {
        select.innerHTML = '<option value="">-- Choose a Property --</option>';
        props.filter(p => p.status === 'available').forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.innerHTML = `${p.title} (₹${p.price})`;
            select.appendChild(opt);
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
            if (custId) await fetch(`/api/billing/${custId}`, { method: 'DELETE' });
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
                <td>
                    <button class="btn-edit" onclick='editCustomer(${JSON.stringify(c)})'>Edit</button>
                    <button class="btn-del" onclick="deleteItem('billing', ${c.id})">Delete</button>
                </td>
            </tr>`).join('');
    }
}

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
                <td><button class="btn-del" onclick="deleteItem('billing', ${b.id})">Delete</button></td>
            </tr>`).join('');
    }
}

// --- UNIVERSAL UTILITIES (NO LIBRARIES) ---

/**
 * Native CSV Download
 * Loops through table rows and creates a downloadable Blob
 */
function downloadCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    let csvContent = "";
    
    for (let row of table.rows) {
        let rowData = [];
        // Loop through cells, excluding the last "Action" column
        for (let i = 0; i < row.cells.length - 1; i++) {
            let text = row.cells[i].innerText.replace(/(\r\n|\n|\r)/gm, "").replace(/,/g, ";");
            rowData.push('"' + text + '"');
        }
        csvContent += rowData.join(",") + "\r\n";
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename + ".csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Native PDF Report
 * Uses the browser's high-quality print engine.
 * To save as PDF, the user selects "Save as PDF" in the print dialog.
 */
function downloadPDF() {
    window.print();
}

/**
 * Universal Search/Filter
 */
function filterTable(tableId, inputId) {
    const input = document.getElementById(inputId).value.toUpperCase();
    const rows = document.querySelector(`#${tableId} tbody`).rows;
    for (const row of rows) {
        row.style.display = row.innerText.toUpperCase().includes(input) ? "" : "none";
    }
}

/**
 * Universal Table Sort
 */
function sortTable(tableId, n) {
    const table = document.getElementById(tableId);
    const rows = Array.from(table.rows).slice(1);
    const dir = table.getAttribute("data-dir") === "asc" ? "desc" : "asc";

    rows.sort((a, b) => {
        const x = a.cells[n].innerText.toLowerCase();
        const y = b.cells[n].innerText.toLowerCase();
        return dir === "asc" ? x.localeCompare(y, undefined, { numeric: true }) : y.localeCompare(x, undefined, { numeric: true });
    });

    rows.forEach(row => table.tBodies[0].appendChild(row));
    table.setAttribute("data-dir", dir);
}

/**
 * Native Info Viewer (QR Alternative)
 */
function viewQR(dataString) {
    const modal = document.getElementById("qrModal");
    const container = document.getElementById("qrcode");
    if (modal && container) {
        modal.style.display = "block";
        container.innerHTML = `
            <div style="border: 2px solid #333; padding: 10px; background: #fff;">
                <p><strong>Property Info Card</strong></p>
                <hr>
                <p style="font-size: 14px; word-break: break-all;">${dataString}</p>
                <p style="font-size: 10px; color: #666;">(Use mobile camera to scan text)</p>
            </div>
        `;
    }
}

function closeQR() {
    document.getElementById("qrModal").style.display = "none";
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
    window.scrollTo(0, 0);
}