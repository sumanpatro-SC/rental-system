import sqlite3
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
import os

DB_NAME = "database.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS properties 
                      (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, price REAL, status TEXT DEFAULT 'available')''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS customers 
                      (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, contact TEXT, property_id INTEGER, billing_date TEXT)''')
    conn.commit()
    conn.close()

class RequestHandler(BaseHTTPRequestHandler):
    def serve_file(self, file_path, content_type):
        try:
            with open(file_path, 'rb') as f:
                self.send_response(200)
                self.send_header('Content-type', f"{content_type}; charset=utf-8")
                self.end_headers()
                self.wfile.write(f.read())
        except Exception:
            self.send_error(404, "File Not Found")

    def do_GET(self):
        # FIX: Handle favicon requests to prevent 502 crashes
        if self.path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return

        routes = {
            '/': ('templates/index.html', 'text/html'),
            '/add-property': ('templates/add_property.html', 'text/html'),
            '/property-list': ('templates/property_list.html', 'text/html'),
            '/customer-details': ('templates/customer_details.html', 'text/html'),
            '/billing': ('templates/billing.html', 'text/html'),
            '/static/style.css': ('static/style.css', 'text/css'),
            '/static/script.js': ('static/script.js', 'application/javascript'),
            '/templates/header.html': ('templates/header.html', 'text/html'),
            '/templates/footer.html': ('templates/footer.html', 'text/html'),
        }

        if self.path in routes:
            path, ctype = routes[self.path]
            self.serve_file(path, ctype)
        elif self.path == '/api/properties':
            conn = sqlite3.connect(DB_NAME)
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM properties")
            data = [dict(zip(['id', 'title', 'description', 'price', 'status'], row)) for row in cursor.fetchall()]
            conn.close()
            self.send_json(data)
        elif self.path == '/api/billing-data':
            conn = sqlite3.connect(DB_NAME)
            cursor = conn.cursor()
            cursor.execute('''SELECT c.id, p.title, c.name, p.price, c.contact, c.billing_date, p.id 
                              FROM customers c JOIN properties p ON c.property_id = p.id''')
            data = [dict(zip(['id', 'p_name', 'c_name', 'price', 'contact', 'date', 'p_id'], row)) for row in cursor.fetchall()]
            conn.close()
            self.send_json(data)

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            # FIX: Ensure UTF-8 decoding to prevent data crashes
            post_body = self.rfile.read(content_length).decode('utf-8')
            post_data = json.loads(post_body)
            
            conn = sqlite3.connect(DB_NAME)
            cursor = conn.cursor()

            if self.path == '/api/add-property':
                cursor.execute("INSERT INTO properties (title, description, price) VALUES (?, ?, ?)", 
                               (post_data.get('title'), post_data.get('description'), post_data.get('price')))
            elif self.path == '/api/add-customer':
                cursor.execute("INSERT INTO customers (name, contact, property_id, billing_date) VALUES (?, ?, ?, ?)",
                               (post_data.get('name'), post_data.get('contact'), post_data.get('property_id'), post_data.get('date')))
                cursor.execute("UPDATE properties SET status = 'rented' WHERE id = ?", (post_data.get('property_id'),))

            conn.commit()
            conn.close()
            self.send_json({"status": "success"})
        except Exception as e:
            self.send_error(500, str(e))

    def do_DELETE(self):
        try:
            item_id = self.path.split('/')[-1]
            conn = sqlite3.connect(DB_NAME)
            cursor = conn.cursor()
            if 'properties' in self.path:
                cursor.execute("DELETE FROM properties WHERE id = ?", (item_id,))
            elif 'billing' in self.path:
                cursor.execute("SELECT property_id FROM customers WHERE id = ?", (item_id,))
                res = cursor.fetchone()
                if res:
                    cursor.execute("UPDATE properties SET status = 'available' WHERE id = ?", (res[0],))
                cursor.execute("DELETE FROM customers WHERE id = ?", (item_id,))
            conn.commit()
            conn.close()
            self.send_json({"status": "deleted"})
        except Exception as e:
            self.send_error(500, str(e))

    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

if __name__ == '__main__':
    init_db()
    server = HTTPServer(('0.0.0.0', 8000), RequestHandler)
    print("Server active at http://localhost:8000")
    server.serve_forever()