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

// --- CUSTOMER REGISTRATION & EDIT ---
async function loadCustomerPage() {
    // 1. Fetch properties for the dropdown
    const resP = await fetch('/api/properties');
    const props = await resP.json();
    const select = document.getElementById('propSelect');
    
    if(select) {
        select.innerHTML = '<option value="">-- Choose a Property --</option>';
        // Show available properties OR the property already assigned to the customer being edited
        props.forEach(p => {
            if (p.status === 'available') {
                let opt = document.createElement('option');
                opt.value = p.id;
                opt.innerHTML = `${p.title} (₹${p.price})`;
                select.appendChild(opt);
            }
        });
    }

    // 2. Handle Form Submission (Both Add and Update)
    const custForm = document.getElementById('custForm');
    if(custForm) {
        custForm.onsubmit = async (e) => {
            e.preventDefault();
            const custId = document.getElementById('custId').value;
            
            const body = {
                name: document.getElementById('cname').value,
                contact: document.getElementById('cphone').value,
                property_id: document.getElementById('propSelect').value,
                date: document.getElementById('bdate').value
            };

            // Logic: If custId exists, we would normally use PUT. 
            // For simplicity in this custom API, we will delete the old and add new or extend app.py
            const url = '/api/add-customer'; 
            
            await fetch(url, { 
                method: 'POST', 
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body) 
            });

            // If we were editing, delete the old record
            if(custId) {
                await fetch(`/api/billing/${custId}`, { method: 'DELETE' });
            }

            alert("Customer data updated successfully!");
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
                <td>
                    <button class="btn-edit" onclick="editCustomer(${JSON.stringify(c).replace(/"/g, '&quot;')})">Edit</button>
                    <button class="btn-del" onclick="deleteItem('billing', ${c.id})">Delete</button>
                </td>
            </tr>`).join('');
    }
}

// Function to fill form with existing data
function editCustomer(cust) {
    document.getElementById('form-title').innerText = "Edit Customer Details";
    document.getElementById('custId').value = cust.id;
    document.getElementById('cname').value = cust.c_name;
    document.getElementById('cphone').value = cust.contact;
    document.getElementById('bdate').value = cust.date;
    
    // Add the current property to the dropdown so it can be selected
    const select = document.getElementById('propSelect');
    const opt = document.createElement('option');
    opt.value = cust.p_id; // Ensure your API returns property_id as p_id
    opt.innerHTML = cust.p_name;
    opt.selected = true;
    select.appendChild(opt);

    document.getElementById('saveBtn').innerText = "Update Details";
    document.getElementById('cancelEdit').style.display = "inline-block";
    window.scrollTo(0,0);
}

function resetCustForm() {
    location.reload();
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