import sqlite3
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
import os
import glob

DB_NAME = "database.db"

def extract_pdf_text(file_path):
    """Extract text from PDF file or read text file directly"""
    try:
        # Try PyPDF2 if available (standard library check)
        try:
            from PyPDF2 import PdfReader  # type: ignore
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        except ImportError:
            # PyPDF2 not available, skip PDF files
            return None
    except Exception as e:
        print(f"Error reading file: {e}")
        return None

def search_pdf_content(query):
    """Search all PDFs and TXT files in uploads folder for matching content"""
    pdf_dir = "uploads"
    if not os.path.exists(pdf_dir):
        return None
    
    # Search both PDF and TXT files
    pdf_files = glob.glob(os.path.join(pdf_dir, "*.pdf"))
    txt_files = glob.glob(os.path.join(pdf_dir, "*.txt"))
    all_files = pdf_files + txt_files
    
    if not all_files:
        return None
    
    query_lower = query.lower()
    results = []
    
    for file_path in all_files:
        try:
            # Handle text files directly
            if file_path.endswith('.txt'):
                with open(file_path, 'r', encoding='utf-8') as f:
                    text = f.read()
            else:
                # Handle PDF files
                text = extract_pdf_text(file_path)
                if not text:
                    continue
            
            # Split into paragraphs and find matching ones
            paragraphs = text.split('\n\n')
            for para in paragraphs:
                if len(results) >= 3:  # Stop as soon as we have 3 results
                    break
                if len(para.strip()) > 20 and any(word in para.lower() for word in query_lower.split()):
                    results.append(para.strip()[:500])  # Limit to 500 chars per result
            
            if len(results) >= 3:  # Return top 3 matches
                break
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            continue
    
    return results[:3] if results else None  # Ensure max 3 results

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
            if not os.path.exists(file_path):
                self.send_error(404, f"File {file_path} Not Found")
                return
            with open(file_path, 'rb') as f:
                self.send_response(200)
                self.send_header('Content-type', f"{content_type}; charset=utf-8")
                self.end_headers()
                self.wfile.write(f.read())
        except Exception as e:
            self.send_error(500, f"Internal Server Error: {str(e)}")

    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_GET(self):
        # 1. Handle favicon (Prevents 502/Crash)
        if self.path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return

        # 2. Static Route Map
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
            '/templates/widget.html': ('templates/widget.html', 'text/html'),
        }

        # 3. Logic for Pages vs API
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
        
        elif self.path.startswith('/api/search-pdf?q='):
            query = self.path.split('q=', 1)[1].replace('+', ' ').replace('%20', ' ')
            results = search_pdf_content(query)
            if results:
                self.send_json({"status": "found", "results": results})
            else:
                self.send_json({"status": "not_found", "results": []})
        
        else:
            self.send_error(404, "Page Not Found")

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
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

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get("PORT", 8000)) 
    server = HTTPServer(('0.0.0.0', port), RequestHandler)
    print(f"Server active at http://localhost:{port}")
    server.serve_forever()