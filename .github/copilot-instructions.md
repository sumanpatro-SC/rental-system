# Rental System - AI Coding Instructions

## Architecture Overview

This is a **Python-based property rental management system** using a custom HTTP server (no framework). It has three core layers:

- **Backend**: Raw HTTP server (`app.py`) with SQLite database for properties and customers
- **Frontend**: Vanilla JavaScript with dynamic client-side routing (no backend routing)
- **Data**: SQLite with two main tables: `properties` (title, description, price, status) and `customers` (name, contact, property_id, billing_date)

**Key Design Decision**: The app uses client-side route matching (`window.location.pathname`) instead of server routing. The server only serves static files and provides REST API endpoints.

## Database Schema

```
properties: id, title, description, price, status (available|rented)
customers: id, name, contact, property_id, billing_date
```

Property status automatically toggles: when a customer is added, their property becomes 'rented'; when deleted, it becomes 'available'.

## Core Features & API Endpoints

| Feature | GET Endpoint | POST Endpoint | DELETE Endpoint |
|---------|--------------|---------------|-----------------|
| Properties | `/api/properties` | `/api/add-property` | `/api/properties/{id}` |
| Customers | `/api/billing-data` | `/api/add-customer` | `/api/billing/{id}` |

HTML pages fetch these endpoints asynchronously and render tables dynamically using `.map()` to generate rows.

## Client-Side Architecture

**Route Handlers in `static/script.js`**:
- `loadDashboard()`: Counts available/rented/total properties, updates stat cards
- `setupAddProperty()`: Form submission → POST → redirect to `/property-list`
- `loadPropertyList()`: Renders properties table with QR info and delete buttons
- `loadCustomerPage()`: Populates property dropdown (only available), renders customers table
- `loadBillingList()`: Renders billing data with modal view details
- `downloadPDF()` / `downloadCSV()`: Uses jsPDF and native blob for exports
- `filterTable()`, `sortTable()`, `deleteItem()`: Utilities for table interactivity

**Header/Footer Pattern**: All pages include placeholders (`#header-placeholder`, `#footer-placeholder`) that fetch external HTML fragments via `fetch('/templates/header.html')` at runtime.

## Critical Patterns

1. **Error Handling**: Defensive checks using optional chaining (`if (document.getElementById(...))`) because not all pages have all elements
2. **JSON Data Conversion**: Database rows → dictionaries via `dict(zip(['field_names'], row))`
3. **No Framework**: Direct HTTP server; POST bodies manually parsed with `json.loads()`
4. **Cascading Deletes**: Deleting a customer updates property status back to 'available'
5. **Currency Display**: All prices shown as `₹${price}` (Indian Rupees)

## Developer Workflows

**Running the Server**:
```bash
python app.py  # Starts on http://localhost:8000
PORT=5000 python app.py  # Use custom port
```

**Debugging**:
- Check `/api/*` endpoints directly in browser for raw data
- Table rendering happens in JavaScript—inspect DOM and browser console for JS errors
- SQLite database: `database.db` created on first run with schema in `init_db()`

**Adding New Features**:
1. Add database columns (modify `CREATE TABLE` in `init_db()`)
2. Add API endpoint in `do_POST()`/`do_GET()`/`do_DELETE()`
3. Add route mapping in `routes` dict if serving static content
4. Add client-side handler in `script.js` with `addEventListener("DOMContentLoaded")`
5. Create corresponding HTML template with ID'd form/table elements

## Common Conventions

- **Element IDs**: Match form inputs to expected field names (e.g., `#title`, `#price` for properties)
- **Table Rendering**: Use template literals with `.map()` and `.join('')`
- **Status Classes**: CSS classes like `status-available` and `status-rented` for styling
- **Button Actions**: `onclick="functionName(params)"` directly in HTML strings
- **Re-render Pattern**: `location.reload()` after create/delete for simplicity (not SPA-style)

## Key Files

- [app.py](app.py) — HTTP server, database initialization, all REST endpoints
- [static/script.js](static/script.js) — Client-side routing, API calls, DOM manipulation
- [templates/index.html](templates/index.html) — Dashboard with stat cards
- [static/style.css](static/style.css) — Responsive grid layout, button/card styling
