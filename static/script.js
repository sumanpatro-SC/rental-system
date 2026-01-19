document.addEventListener("DOMContentLoaded", () => {
    // Load Header & Footer
    fetch('/templates/header.html').then(r => r.text()).then(html => document.getElementById('header-placeholder').innerHTML = html);
    fetch('/templates/footer.html').then(r => r.text()).then(html => document.getElementById('footer-placeholder').innerHTML = html);

    const path = window.location.pathname;
    if (path === "/") loadDashboard();
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
    if(countEl) countEl.innerText = count;
}

// --- PROPERTY LIST ---
async function loadPropertyList() {
    const res = await fetch('/api/properties');
    const data = await res.json();
    const tbody = document.querySelector("#propTable tbody");
    if(tbody) {
        tbody.innerHTML = data.map((p, i) => `
            <tr>
                <td>${i+1}</td>
                <td>${p.title}</td>
                <td>₹${p.price}</td>
                <td>${p.status}</td>
                <td><button class="btn-del" onclick="deleteItem('properties', ${p.id})">Delete</button></td>
            </tr>`).join('');
    }
}

// --- CUSTOMER REGISTRATION (The Fix) ---
async function loadCustomerPage() {
    // 1. Fetch available properties for the dropdown
    const resP = await fetch('/api/properties');
    const props = await resP.json();
    const select = document.getElementById('propSelect');
    
    if(select) {
        // Only show properties that are "available"
        const availableProps = props.filter(p => p.status === 'available');
        availableProps.forEach(p => {
            let opt = document.createElement('option');
            opt.value = p.id;
            opt.innerHTML = `${p.title} (₹${p.price})`;
            select.appendChild(opt);
        });
    }

    // 2. Handle Form Submission
    const custForm = document.getElementById('custForm');
    if(custForm) {
        custForm.onsubmit = async (e) => {
            e.preventDefault();
            const body = {
                name: document.getElementById('cname').value,
                contact: document.getElementById('cphone').value,
                property_id: document.getElementById('propSelect').value,
                date: document.getElementById('bdate').value
            };
            await fetch('/api/add-customer', { 
                method: 'POST', 
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body) 
            });
            alert("Customer Registered & Property Rented!");
            location.reload();
        };
    }

    // 3. Load Registered Customers Table
    const resC = await fetch('/api/billing-data');
    const custs = await resC.json();
    const tbody = document.querySelector("#custTable tbody");
    if(tbody) {
        tbody.innerHTML = custs.map(c => `
            <tr>
                <td>${c.c_name}</td>
                <td>${c.contact}</td>
                <td>${c.p_name}</td>
                <td>${c.date}</td>
                <td><button class="btn-del" onclick="deleteItem('billing', ${c.id})">Delete</button></td>
            </tr>`).join('');
    }
}

// --- BILLING LIST ---
async function loadBillingList() {
    const res = await fetch('/api/billing-data');
    const data = await res.json();
    const tbody = document.querySelector("#billingTable tbody");
    if(tbody) {
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

// --- DELETE FUNCTION ---
async function deleteItem(type, id) {
    if(confirm("Confirm deletion? If billing is deleted, property will become available again.")) {
        await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
        location.reload();
    }
}