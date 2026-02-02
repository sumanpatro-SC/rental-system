# rental-system

A lightweight property rental management system (no framework). This repository contains a simple HTTP server, a client-side SPA, and a SQLite database for properties and customers.

**DFD Diagrams**

**Level 0 (Context Diagram)**

This context diagram shows the `Rental System` as a single central process interacting with external actors.

```mermaid
graph LR
  Owner[Property Owner]
  Tenant[Customer / Tenant]
  Admin[Administrator]
  PaymentGateway[Payment Gateway]
  System((Rental System))

  Owner -->|Manage properties| System
  Tenant -->|Search / Book / View Billing| System
  Admin -->|Configure / Reports| System
  System -->|Process payments| PaymentGateway
```

**Level 1 DFD**

Breaks the central process into major sub-processes, data flows, and data stores.

```mermaid
graph LR
  subgraph Rental_System[Rental System]
    PM[Property Management]
    CM[Customer Management]
    BP[Billing & Payments]
    RP[Reporting]
  end

  Owner[Property Owner] -->|create/update| PM
  Tenant[Customer] -->|register/book| CM
  CM -->|customer data| DB_Customers[(Customers DB)]
  PM -->|property data| DB_Properties[(Properties DB)]
  BP -->|billing records| DB_Billing[(Billing DB)]
  CM -->|trigger billing| BP
  PM -->|availability| BP
  RP -->|reads| DB_Properties
  RP -->|reads| DB_Customers
  RP -->|reads| DB_Billing
```

**Level 2 DFD (Billing & Payments decomposition)**

Detailed view of the `Billing & Payments` subprocess showing invoice generation, payment processing, and updates to data stores.

```mermaid
graph LR
  CustomerData[Customer Data]
  PropertyData[Property Data]
  GenerateInvoice[1. Generate Invoice]
  SendInvoice[2. Send Invoice / Notify Customer]
  ReceivePayment[3. Receive Payment]
  VerifyPayment[4. Verify Payment]
  UpdateRecords[5. Update Billing & Property Status]
  Receipt[Receipt / Confirmation]

  CustomerData --> GenerateInvoice
  PropertyData --> GenerateInvoice
  GenerateInvoice --> SendInvoice
  SendInvoice --> CustomerData
  CustomerData --> ReceivePayment
  ReceivePayment --> VerifyPayment
  VerifyPayment --> UpdateRecords
  UpdateRecords --> DB_Billing[(Billing DB)]
  UpdateRecords --> DB_Properties[(Properties DB)]
  VerifyPayment --> Receipt
```

Notes:
- GitHub renders Mermaid diagrams in Markdown; view these diagrams on GitHub or a compatible Markdown renderer.
- The diagrams show conceptual data flows; adapt them as needed to match implementation details.
# rental-system

# Rental System - Complete Documentation

A lightweight **property rental management system** built with **Python HTTP server** (no framework), **vanilla JavaScript frontend**, and **SQLite database**. This project demonstrates core web development concepts: REST APIs, client-side routing, database operations, and DOM manipulation.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [How to Run](#how-to-run)
5. [Project Features](#project-features)
6. [API Endpoints](#api-endpoints)
7. [How Each Page Works](#how-each-page-works)
8. [Key Code Patterns](#key-code-patterns)
9. [Data Flow Diagrams](#data-flow-diagrams)
10. [Troubleshooting](#troubleshooting)

---

## Project Overview

### What is this project?

This is a **property management system** that helps:
- **Property Owners** to add and manage properties
- **Administrators** to track customers and billing information
- **Users** to view property lists, book properties, and manage billing records

### Why no framework?

This project uses a custom Python HTTP server instead of Django/Flask to:
- ✅ Learn core HTTP concepts (GET, POST, DELETE)
- ✅ Understand REST API design from scratch
- ✅ Master client-side JavaScript routing (no server-side routing)
- ✅ Work with SQLite database directly
- ✅ Keep the codebase lightweight and educational

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3 + HTTPServer (no framework) |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Database** | SQLite3 |
| **Reports** | jsPDF, QRCode.js |

---

## Architecture

### Three-Layer Model

```
┌─────────────────────────────────────────┐
│         Frontend (Browser)              │
│  - HTML Templates                       │
│  - JavaScript (Routing & API Calls)     │
│  - CSS Styling                          │
└──────────────┬──────────────────────────┘
               │ (HTTP Requests/Responses)
┌──────────────▼──────────────────────────┐
│      Backend (HTTP Server)              │
│  - RequestHandler (GET/POST/DELETE)     │
│  - REST API Endpoints                   │
│  - Database Operations                  │
└──────────────┬──────────────────────────┘
               │ (SQL Queries)
┌──────────────▼──────────────────────────┐
│      Data (SQLite Database)             │
│  - Properties Table                     │
│  - Customers Table                      │
└─────────────────────────────────────────┘
```

### How It Works (Request Flow)

```
1. User opens browser → http://localhost:8000
2. Browser makes GET request to /
3. Server responds with index.html
4. Browser loads script.js and style.css
5. script.js detects route using window.location.pathname
6. Calls appropriate handler (loadDashboard, loadPropertyList, etc.)
7. Handler makes API call (e.g., fetch('/api/properties'))
8. Server queries SQLite and returns JSON
9. JavaScript renders data in HTML tables
```

---

## Database Schema

### Properties Table
```sql
CREATE TABLE properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    price REAL,
    status TEXT DEFAULT 'available'  -- 'available' or 'rented'
)
```

**Example Data:**
| id | title | description | price | status |
|----|-------|-------------|-------|--------|
| 1 | Cozy 1-BHK | Central location | 15000 | available |
| 2 | Luxury 2-BHK | Near metro | 30000 | rented |

### Customers Table
```sql
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    contact TEXT,
    property_id INTEGER,
    billing_date TEXT
)
```

**Example Data:**
| id | name | contact | property_id | billing_date |
|----|------|---------|-------------|--------------|
| 1 | Rajesh Kumar | 9876543210 | 2 | 2026-02-01 |
| 2 | Priya Singh | 9988776655 | 3 | 2026-01-15 |

### Relationship
- One **Property** can have many **Customers** (One-to-Many)
- When a customer is added, their property status changes to **'rented'**
- When a customer is deleted, the property status changes back to **'available'**

---

## How to Run

### Prerequisites
- Python 3.6+
- Git (optional)

### Step 1: Clone or Download the Project
```bash
git clone https://github.com/sumanpatro-SC/rental-system.git
cd rental-system
```

### Step 2: Initialize the Database
The database is automatically created on first run. No manual setup needed!

### Step 3: Start the Server
```bash
python app.py
```

**Output:**
```
Server active at http://localhost:8000
```

### Step 4: Open in Browser
```bash
# On Linux/Mac
open http://localhost:8000

# On Windows
start http://localhost:8000
```

### Step 5: Using a Custom Port
```bash
PORT=5000 python app.py
```

Now access at: `http://localhost:5000`

---

## Project Features

### 1. Dashboard (Home Page)
**URL:** `/` or `/index.html`

**What it shows:**
- 📊 Total properties count
- 🏠 Available properties count
- 🔒 Rented properties count

**How it works:**
```
1. Page loads → JavaScript detects route = "/"
2. Calls loadDashboard() function
3. Makes API call to GET /api/properties
4. Server queries properties table
5. JavaScript counts: available, rented, total
6. Updates stat cards in DOM
```

**HTML Elements Updated:**
- `#avail-count` → Available count
- `#rented-count` → Rented count
- `#total-count` → Total count

---

### 2. Add Property Page
**URL:** `/add-property`

**What it does:**
- 📝 Form to add new property
- Fields: Title, Description, Price
- Automatically sets property status to **'available'**

**How it works:**
```
1. User fills form → clicks "Submit"
2. JavaScript detects: form#propForm onsubmit
3. Collects form data: title, desc, price
4. Sends POST request to /api/add-property
5. Server inserts into properties table
6. Server responds with success
7. JavaScript redirects to /property-list
```

**Form Fields (HTML IDs):**
- `#title` → Property title
- `#desc` → Property description
- `#price` → Rental price

---

### 3. Property List Page
**URL:** `/property-list`

**What it shows:**
- 📋 Table of all properties
- Columns: S.No, Title, Price, Status, Actions
- Delete button for each property

**How it works:**
```
1. Page loads → JavaScript detects route = "/property-list"
2. Calls loadPropertyList() function
3. Makes API call to GET /api/properties
4. Returns JSON array of all properties
5. JavaScript renders each property as table row
6. Status shown with color: green (available), red (rented)
```

**Table Rendering:**
```javascript
data.map((p, i) => `
    <tr>
        <td>${i + 1}</td>
        <td>${p.title}</td>
        <td>₹${p.price}</td>
        <td><span class="status-${p.status}">${p.status}</span></td>
        <td><button onclick="deleteItem('properties', ${p.id})">Delete</button></td>
    </tr>
`)
```

**Delete Logic:**
```
1. User clicks "Delete" button → calls deleteItem('properties', propertyId)
2. JavaScript sends DELETE request to /api/properties/{propertyId}
3. Server deletes property from database
4. Page reloads to show updated list
```

---

### 4. Customer Details Page
**URL:** `/customer-details`

**What it does:**
- ➕ Form to add new customer (tenant)
- 📋 Table showing all customers
- Automatically updates property status to 'rented'

**How it works:**

**Part A: Property Dropdown**
```
1. Page loads → calls loadCustomerPage()
2. Makes API call to GET /api/properties
3. Filters only 'available' properties
4. Populates dropdown with available properties only
5. Format: "Property Title (₹Price)"
```

**Part B: Add Customer Form**
```
1. User fills: Name, Contact, Property (dropdown), Billing Date
2. Clicks "Submit" → form#custForm onsubmit
3. JavaScript collects data
4. Sends POST to /api/add-customer with property_id
5. Server:
   - Inserts customer into customers table
   - Updates property status to 'rented' (WHERE id = property_id)
6. Page reloads to show new customer in table
```

**Form Fields (HTML IDs):**
- `#cname` → Customer name
- `#cphone` → Customer contact
- `#propSelect` → Property dropdown
- `#bdate` → Billing date

**Important Logic:**
```sql
-- When customer is added:
INSERT INTO customers (name, contact, property_id, billing_date) VALUES (...)
UPDATE properties SET status = 'rented' WHERE id = property_id
```

**Part C: Customers Table**
```
Columns: Name, Contact, Property, Billing Date, Actions
Fetches from /api/billing-data (JOIN query)
Delete button updates property status back to 'available'
```

---

### 5. Billing Page
**URL:** `/billing`

**What it shows:**
- 💰 Complete billing data with customer and property info
- 📊 Reports (PDF export, CSV export)
- 🔍 Search/Filter functionality
- 📱 QR Code generation for each billing record
- View details modal

**How it works:**

**Main Table:**
```
1. Page loads → calls loadBillingList()
2. Makes API call to GET /api/billing-data
3. Server runs JOIN query:
   SELECT c.id, p.title, c.name, p.price, c.contact, c.billing_date, p.id
   FROM customers c JOIN properties p ON c.property_id = p.id
4. JavaScript renders table with columns:
   - Property Name
   - Customer Name
   - Rent Amount (₹)
   - Contact
   - Billing Date
   - Actions (View, Delete)
```

**Features:**

**A. View Details & QR Code**
```
1. User clicks "View" → calls viewDetails(billingId)
2. Searches for billing record by ID
3. Opens modal with details:
   - Tenant Name, Contact, Booking Date
   - Property Title, Rent Amount, Property ID
4. User clicks "Generate QR" → calls generateQRCode()
5. Creates QR code using QRCode.js library
6. QR contains: Name|Phone|Property|Rent|Date
```

**B. Download PDF Report**
```
1. User clicks "Download PDF" → calls downloadPDF('billingTable', 'Billing_Report')
2. Uses jsPDF library with autoTable plugin
3. Extracts table data from #billingTable
4. Excludes "Actions" column from PDF
5. Creates styled PDF with green header
6. Saves as "Billing_Report.pdf"
```

**C. Download CSV Report**
```
1. User clicks "Download CSV" → calls downloadCSV('billingTable', 'billing_data')
2. Converts table to CSV format
3. Excludes "Actions" column
4. Adds UTF-8 BOM for Excel compatibility
5. Creates Blob and triggers download
6. Saves as "billing_data.csv"
```

**D. Search/Filter**
```
Function: filterTable(tableId, inputId)
1. User types in search box
2. JavaScript converts input to UPPERCASE
3. Hides rows that don't match search text
4. Case-insensitive search across all columns
```

**E. Sort**
```
Function: sortTable(tableId, columnIndex)
1. User clicks column header
2. Sorts ascending/descending (toggles)
3. Handles numeric and text sorting
4. Updates data-dir attribute to track sort direction
```

**F. Delete**
```
1. User clicks "Delete" → calls deleteItem('billing', customerId)
2. Server deletes from customers table
3. Server updates property status to 'available'
4. Page reloads to show updated data
```

---

## API Endpoints

All endpoints return JSON format. Base URL: `http://localhost:8000`

### Properties Endpoints

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/properties` | Get all properties | - | `[{id, title, description, price, status}, ...]` |
| POST | `/api/add-property` | Add new property | `{title, description, price}` | `{status: "success"}` |
| DELETE | `/api/properties/{id}` | Delete property | - | `{status: "deleted"}` |

### Customers Endpoints

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| POST | `/api/add-customer` | Add new customer | `{name, contact, property_id, date}` | `{status: "success"}` |
| DELETE | `/api/billing/{id}` | Delete customer | - | `{status: "deleted"}` |

### Billing Endpoints

| Method | Endpoint | Purpose | Response |
|--------|----------|---------|----------|
| GET | `/api/billing-data` | Get all billing records (with JOIN) | `[{id, p_name, c_name, price, contact, date, p_id}, ...]` |

### Static File Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/` | Homepage (index.html) |
| `/add-property` | Add property page |
| `/property-list` | Properties list page |
| `/customer-details` | Customer management page |
| `/billing` | Billing & reports page |
| `/static/style.css` | Stylesheet |
| `/static/script.js` | JavaScript |
| `/templates/header.html` | Header fragment |
| `/templates/footer.html` | Footer fragment |

---

## How Each Page Works

### Architecture: Client-Side Routing

**Traditional Server-Side Routing:**
```
Browser → /property-list → Server routes to property_list.html → Send HTML
```

**This Project (Client-Side Routing):**
```
Browser → /property-list → Server sends property_list.html
JavaScript detects URL path → Calls loadPropertyList() → Fetches API data → Renders table
```

### Route Detection in JavaScript

```javascript
// In script.js - DOMContentLoaded event
const path = window.location.pathname;
if (path === "/") loadDashboard();
if (path === "/add-property") setupAddProperty();
if (path === "/property-list") loadPropertyList();
if (path === "/customer-details") loadCustomerPage();
if (path === "/billing") loadBillingList();
```

**Why This Approach?**
- ✅ Faster page transitions (no full reload needed)
- ✅ Single HTML file can handle multiple routes
- ✅ Backend only serves API data (REST)
- ✅ Better separation of concerns

---

## Key Code Patterns

### Pattern 1: Fetching Data from API

```javascript
// Step 1: Make GET request
const res = await fetch('/api/properties');

// Step 2: Parse JSON response
const data = await res.json();

// Step 3: Process data
const available = data.filter(p => p.status === 'available').length;

// Step 4: Update DOM
document.getElementById('avail-count').innerText = available;
```

### Pattern 2: Submitting Form Data

```javascript
// Step 1: Intercept form submit
form.onsubmit = async (e) => {
    e.preventDefault(); // Prevent page reload

    // Step 2: Collect form data
    const data = {
        title: document.getElementById('title').value,
        price: document.getElementById('price').value
    };

    // Step 3: Send POST request
    const res = await fetch('/api/add-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    // Step 4: Handle response
    if (res.ok) window.location.href = '/property-list';
};
```

### Pattern 3: Rendering Table from JSON

```javascript
// Fetch data
const res = await fetch('/api/properties');
const data = await res.json();

// Get table body
const tbody = document.querySelector("#propTable tbody");

// Map each object to HTML row
tbody.innerHTML = data.map((p, i) => `
    <tr>
        <td>${i + 1}</td>
        <td>${p.title}</td>
        <td>₹${p.price}</td>
        <td><span class="status-${p.status}">${p.status}</span></td>
        <td>
            <button onclick="deleteItem('properties', ${p.id})">Delete</button>
        </td>
    </tr>
`).join('');
```

### Pattern 4: Delete with Confirmation

```javascript
async function deleteItem(type, id) {
    // Send DELETE request
    await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
    
    // Reload page to show updated data
    location.reload();
}
```

### Pattern 5: Optional Chaining (Defensive)

```javascript
// Check if element exists before updating
if (document.getElementById('avail-count')) {
    document.getElementById('avail-count').innerText = available;
}

// Or using optional chaining
document.getElementById('avail-count')?.innerText = available;
```

### Pattern 6: Header & Footer Loading

```javascript
// Load header on every page
fetch('/templates/header.html')
    .then(r => r.text())
    .then(html => {
        if (document.getElementById('header-placeholder')) {
            document.getElementById('header-placeholder').innerHTML = html;
        }
    });
```

### Pattern 7: Database Query to JSON

```python
# In app.py
cursor.execute("SELECT * FROM properties")
data = [dict(zip(['id', 'title', 'description', 'price', 'status'], row)) 
        for row in cursor.fetchall()]

# Result:
# [
#   {"id": 1, "title": "1-BHK", "description": "Cozy", "price": 15000, "status": "available"},
#   ...
# ]
```

### Pattern 8: JOIN Query for Related Data

```python
cursor.execute('''
    SELECT c.id, p.title, c.name, p.price, c.contact, c.billing_date, p.id 
    FROM customers c 
    JOIN properties p ON c.property_id = p.id
''')
data = [dict(zip(['id', 'p_name', 'c_name', 'price', 'contact', 'date', 'p_id'], row)) 
        for row in cursor.fetchall()]
```

---

## Data Flow Diagrams

### Level 0: Context Diagram

```
┌──────────────────────────────────────────────────────┐
│                 Rental System                        │
│                                                      │
│  - Add Properties                                   │
│  - Manage Customers                                │
│  - View Billing & Reports                          │
│  - Generate QR Codes                               │
└──────────────────────────────────────────────────────┘
        ↕
┌──────────────────────────────────────────────────────┐
│              Users (Web Browser)                     │
│                                                      │
│  - Property Owners                                  │
│  - Administrators                                   │
│  - Managers                                         │
└──────────────────────────────────────────────────────┘
```

### Level 1: Main Processes

```
                    ┌─────────────────────┐
                    │   Property Owner    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ 1. Property Mgmt    │
                    │ (Add, List, Delete) │
                    └────────┬────────────┘
                             │
                    ┌────────▼────────┐
                    │ Properties DB   │
                    └────────────────┘
                             ▲
                             │
                    ┌────────┴────────┐
                    │                 │
          ┌─────────▼────────┐  ┌─────▼──────────┐
          │2. Customer Mgmt  │  │3. Billing Page │
          │(Add, Delete)     │  │(Reports, PDF)  │
          └─────────┬────────┘  └─────┬──────────┘
                    │                 │
                    ▼                 ▼
          ┌─────────────────┐  ┌──────────────┐
          │ Customers DB    │  │ Billing Data │
          │ (with JOIN)     │  │ (with JOIN)  │
          └─────────────────┘  └──────────────┘
```

### Level 2: Request-Response Cycle

```
User Action                Browser                Server                Database
    │                        │                      │                        │
    ├──────── Click ────────→│                      │                        │
    │                        ├─ GET /api/properties→│                        │
    │                        │                      ├─ SELECT * FROM ... ──→│
    │                        │                      │◄─ rows returned ─────│
    │◄─────── JSON ─────────│◄──────────────────  │                        │
    │                        │                      │                        │
    ├─ Render Table ────────→│                      │                        │
    │                        │                      │                        │
```

---

## Troubleshooting

### Problem 1: Server Won't Start

**Error:** `Address already in use`
```bash
# Check what's using the port
lsof -i :8000

# Kill the process (get PID from above)
kill -9 <PID>

# Or use a different port
PORT=5000 python app.py
```

### Problem 2: Database Issues

**Error:** `database.db` not created
```bash
# Delete old database
rm database.db

# Restart server (will recreate)
python app.py
```

**View database contents:**
```bash
sqlite3 database.db
sqlite> SELECT * FROM properties;
sqlite> .quit
```

### Problem 3: API Returns Empty Array

**Cause:** No data in database yet
**Solution:** Add a property first via `/add-property` page

### Problem 4: Form Not Submitting

**Check Browser Console:**
- Open DevTools: Press `F12`
- Go to `Console` tab
- Look for red error messages
- Check if form IDs match JavaScript code

**Common Causes:**
- Form ID doesn't match (`#propForm`)
- Input IDs wrong (`#title`, not `#property-title`)
- Missing `<form>` tag around inputs

### Problem 5: Table Not Showing Data

**Debug Steps:**
1. Open Browser DevTools (F12)
2. Go to `Network` tab
3. Click "View" to trigger load
4. Find `/api/billing-data` request
5. Click it → check `Response` tab
6. Verify JSON data is present

**If API returns empty:**
- Add a customer first (go to `/customer-details`)
- Ensure property is 'available' in property list

### Problem 6: QR Code Not Generating

**Cause:** QRCode.js library not loaded
**Solution:**
- Check if `<script src="...qrcode.js"></script>` is in HTML
- Verify no JavaScript errors in Console
- Refresh page

**Debug:**
```javascript
// In Console:
typeof QRCode  // Should be "function", not "undefined"
```

### Problem 7: PDF Download Not Working

**Cause:** jsPDF library not loaded
**Solution:**
- Verify `<script src="...jspdf.umd.min.js"></script>` in HTML
- Check Browser Console for errors

**Debug:**
```javascript
// In Console:
window.jspdf  // Should be an object with jsPDF
```

---

## Summary

This rental system demonstrates:

| Concept | Example |
|---------|---------|
| **HTTP Methods** | GET properties, POST customer, DELETE billing |
| **REST API** | `/api/properties`, `/api/billing-data` |
| **Database** | SQLite with properties & customers tables |
| **Client-Side Routing** | Route based on `window.location.pathname` |
| **DOM Manipulation** | Render tables using `.map()` and `.innerHTML` |
| **Async/Await** | Fetch data with `async/await` |
| **Join Queries** | Combine customer + property data |
| **Cascading Updates** | Change property status when customer added/deleted |
| **File Exports** | PDF and CSV downloads |
| **QR Codes** | Generate billing QR codes |

**Next Steps to Learn:**
1. Add authentication (username/password)
2. Add payment integration
3. Add email notifications
4. Deploy to cloud (Heroku, AWS)
5. Rebuild with Flask/Django framework
6. Add React/Vue frontend

---

## License

Free to use for educational purposes.

## Support

Questions? Check the code comments or open an issue on GitHub.
