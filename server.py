import http.server
import socketserver
import json
import os
import cgi
import time
import mimetypes
from http.cookies import SimpleCookie
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Explicitly map video and image extensions to correct MIME types for streaming
mimetypes.init()
mimetypes.add_type('video/mp4', '.mp4')
mimetypes.add_type('video/webm', '.webm')
mimetypes.add_type('video/ogg', '.ogv')
mimetypes.add_type('video/quicktime', '.mov')
mimetypes.add_type('image/png', '.png')
mimetypes.add_type('image/jpeg', '.jpg')
mimetypes.add_type('image/jpeg', '.jpeg')

PORT = 8000
PASSWORD = " AchuSona#92!Sun "

def send_contact_email(name, sender_email, project_type, message_text):
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        smtp_conf = data.get('smtp', {})
    except Exception:
        smtp_conf = {}

    host = smtp_conf.get('host', 'smtp.gmail.com')
    port = int(smtp_conf.get('port', 587))
    user = smtp_conf.get('user', '')
    password = smtp_conf.get('password', '')
    receiver = smtp_conf.get('receiver', 'achyueee181@gmail.com')

    # If SMTP is not fully configured, log it and return simulation message
    if not user or not password:
        print(f"\n--- [SIMULATED EMAIL TO {receiver}] ---", flush=True)
        print(f"From: {name} <{sender_email}>", flush=True)
        print(f"Project Type: {project_type}", flush=True)
        print(f"Message: {message_text}", flush=True)
        print("---------------------------------------\n", flush=True)
        return True, "Message received (Demo Mode - SMTP credentials not configured)."

    try:
        msg = MIMEMultipart()
        msg['From'] = f"{name} <{user}>"
        msg['To'] = receiver
        msg['Reply-To'] = sender_email
        msg['Subject'] = f"New Project Inquiry: {project_type} from {name}"

        body = f"""You have received a new contact message from your portfolio website.

Name: {name}
Email: {sender_email}
Project Type: {project_type}

Message:
----------------------------------------
{message_text}
----------------------------------------
"""
        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=10)
        else:
            server = smtplib.SMTP(host, port, timeout=10)
            server.starttls()
        
        server.login(user, password)
        server.sendmail(user, receiver, msg.as_string())
        server.quit()
        return True, "Message sent successfully!"
    except Exception as e:
        print(f"Failed to send email via SMTP: {e}")
        return False, f"Failed to send message: {str(e)}"


class PortfolioHandler(http.server.SimpleHTTPRequestHandler):
    
    def check_auth(self):
        cookie_header = self.headers.get('Cookie')
        if cookie_header:
            cookie = SimpleCookie(cookie_header)
            if 'admin_session' in cookie and cookie['admin_session'].value == 'authenticated':
                return True
        return False
        
    def do_GET(self):
        if self.path == '/api/content':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            try:
                with open('data.json', 'r', encoding='utf-8') as f:
                    self.wfile.write(f.read().encode('utf-8'))
            except Exception as e:
                self.wfile.write(json.dumps({
                    'hero': {}, 'about': {}, 'skills': [], 'projects': []
                }).encode('utf-8'))
                
        elif self.path == '/api/check-auth':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            is_auth = self.check_auth()
            self.wfile.write(json.dumps({'authenticated': is_auth}).encode('utf-8'))
            
        else:
            # Let simple HTTP handler serve the static files (index.html, style.css, app.js, assets/*)
            super().do_GET()
            
    def do_POST(self):
        if self.path == '/api/login':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(post_data)
                if data.get('password') == PASSWORD:
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    
                    # Set session cookie
                    cookie = SimpleCookie()
                    cookie['admin_session'] = 'authenticated'
                    cookie['admin_session']['path'] = '/'
                    cookie['admin_session']['httponly'] = True
                    cookie['admin_session']['samesite'] = 'Strict'
                    self.send_header('Set-Cookie', cookie.output(header=''))
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': True, 'message': 'Authenticated successfully'}).encode('utf-8'))
                else:
                    self.send_response(401)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': False, 'error': 'Incorrect password'}).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': 'Invalid request format'}).encode('utf-8'))
                
        elif self.path == '/api/contact':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(post_data)
                name = data.get('name', '').strip()
                email = data.get('email', '').strip()
                project = data.get('project', '').strip()
                message = data.get('message', '').strip()
                
                if not name or not email or not project or not message:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'All fields are required.'}).encode('utf-8'))
                    return
                
                success, msg = send_contact_email(name, email, project, message)
                
                if success:
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': True, 'message': msg}).encode('utf-8'))
                else:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': msg}).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': f'Invalid request: {str(e)}'}).encode('utf-8'))
                
        elif self.path == '/api/logout':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            cookie = SimpleCookie()
            cookie['admin_session'] = ''
            cookie['admin_session']['path'] = '/'
            cookie['admin_session']['max-age'] = 0
            self.send_header('Set-Cookie', cookie.output(header=''))
            self.end_headers()
            self.wfile.write(json.dumps({'success': True, 'message': 'Logged out successfully'}).encode('utf-8'))
            
        elif self.path == '/api/save':
            if not self.check_auth():
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Unauthorized. Admin login required.'}).encode('utf-8'))
                return
                
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(post_data)
                # Save data to data.json
                with open('data.json', 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'message': 'Changes saved successfully!'}).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Failed to save changes.'}).encode('utf-8'))
                
        elif self.path == '/api/upload':
            if not self.check_auth():
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Unauthorized. Admin login required.'}).encode('utf-8'))
                return
                
            try:
                form = cgi.FieldStorage(
                    fp=self.rfile,
                    headers=self.headers,
                    environ={'REQUEST_METHOD': 'POST',
                             'CONTENT_TYPE': self.headers.get('Content-Type')}
                )
                
                if 'file' in form:
                    file_item = form['file']
                    if file_item.filename:
                        _, ext = os.path.splitext(file_item.filename)
                        if not ext:
                            ext = '.png'
                        
                        filename = f"upload_{int(time.time())}{ext}"
                        upload_dir = 'assets'
                        os.makedirs(upload_dir, exist_ok=True)
                        filepath = os.path.join(upload_dir, filename)
                        
                        with open(filepath, 'wb') as f:
                            f.write(file_item.file.read())
                            
                        self.send_response(200)
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({
                            'success': True,
                            'message': 'File uploaded successfully!',
                            'filePath': f'assets/{filename}'
                        }).encode('utf-8'))
                        return
                
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No file uploaded or invalid content type.'}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': f'Failed to process file upload: {str(e)}'}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), PortfolioHandler) as httpd:
    print(f"Python server running at http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
