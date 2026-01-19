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
                self.send_header('Content-type', content_type)
                self.end_headers()
                self.wfile.write(f.read())
        except:
            self.send_error(404)

    def do_GET(self):
        # Routing Logic
        if self.path == '/': self.serve_file('templates/index.html', 'text/html')
        elif self.path == '/add-property': self.serve_file('templates/add_property.html', 'text/html')
        elif self.path == '/property-list': self.serve_file('templates/property_list.html', 'text/html')
        elif self.path == '/customer-details': self.serve_file('templates/customer_details.html', 'text/html')
        elif self.path == '/billing': self.serve_file('templates/billing.html', 'text/html')
        elif self.path == '/static/style.css': self.serve_file('static/style.css', 'text/css')
        elif self.path == '/static/script.js': self.serve_file('static/script.js', 'application/javascript')
        elif self.path == '/templates/header.html': self.serve_file('templates/header.html', 'text/html')
        elif self.path == '/templates/footer.html': self.serve_file('templates/footer.html', 'text/html')
        
        # API: Read All Properties
        elif self.path == '/api/properties':
            conn = sqlite3.connect(DB_NAME)
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM properties")
            data = [dict(zip(['id', 'title', 'description', 'price', 'status'], row)) for row in cursor.fetchall()]
            conn.close()
            self.send_json(data)
        
        # API: Read Billing/Customer Data
        elif self.path == '/api/billing-data':
            conn = sqlite3.connect(DB_NAME)
            cursor = conn.cursor()
            cursor.execute('''SELECT c.id, p.title, c.name, p.price, c.contact, c.billing_date 
                              FROM customers c JOIN properties p ON c.property_id = p.id''')
            data = [dict(zip(['id', 'p_name', 'c_name', 'price', 'contact', 'date'], row)) for row in cursor.fetchall()]
            conn.close()
            self.send_json(data)

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = json.loads(self.rfile.read(content_length))
            conn = sqlite3.connect(DB_NAME)
            cursor = conn.cursor()

            if self.path == '/api/add-property':
                cursor.execute("INSERT INTO properties (title, description, price) VALUES (?, ?, ?)", 
                               (post_data['title'], post_data['description'], post_data['price']))
            
            elif self.path == '/api/add-customer':
                cursor.execute("INSERT INTO customers (name, contact, property_id, billing_date) VALUES (?, ?, ?, ?)",
                               (post_data['name'], post_data['contact'], post_data['property_id'], post_data['date']))
                cursor.execute("UPDATE properties SET status = 'rented' WHERE id = ?", (post_data['property_id'],))

            conn.commit()
            conn.close()
            self.send_json({"status": "success"})
        except Exception as e:
            self.send_error(500, str(e))

    def do_DELETE(self):
        try:
            path_parts = self.path.split('/')
            item_id = path_parts[-1]
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
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

if __name__ == '__main__':
    init_db()
    server = HTTPServer(('0.0.0.0', 8000), RequestHandler)
    print("Server active at http://localhost:8000")
    server.serve_forever()