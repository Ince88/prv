"""
PRV AI Marketing Assistant - Web Version
Beautiful, modern web interface
"""

from flask import Flask, render_template, request, jsonify, session, Response
from flask_cors import CORS
from functools import wraps
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.utils import secure_filename
import openai
import requests
import threading
import secrets
import webbrowser
import time
from datetime import datetime
import os
import json
import base64
from dotenv import load_dotenv
import pandas as pd
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Fix for HTTPS behind proxy (Railway)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configuration
IS_PRODUCTION = os.getenv('FLASK_ENV') == 'production'
app.secret_key = os.getenv('FLASK_SECRET_KEY', secrets.token_hex(16))
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0 if not IS_PRODUCTION else 3600  # Cache in production

# File upload configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'csv'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create uploads folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Session configuration for production (HTTPS)
if IS_PRODUCTION:
    app.config['SESSION_COOKIE_SECURE'] = True  # HTTPS only
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

CORS(app)

# Basic Authentication (for internal company use)
# Support multiple users - format: username1:password1,username2:password2
BASIC_AUTH_USERS = {}
auth_string = os.getenv('BASIC_AUTH_USERS', '')
if auth_string:
    # Parse multiple users from env var
    for user_pair in auth_string.split(','):
        if ':' in user_pair:
            username, password = user_pair.split(':', 1)
            BASIC_AUTH_USERS[username.strip()] = password.strip()
else:
    # Fallback to single user (backward compatibility)
    single_user = os.getenv('BASIC_AUTH_USERNAME')
    single_pass = os.getenv('BASIC_AUTH_PASSWORD')
    if single_user and single_pass:
        BASIC_AUTH_USERS[single_user] = single_pass

ALLOWED_EMAIL_DOMAINS = os.getenv('ALLOWED_EMAIL_DOMAINS', '').split(',') if os.getenv('ALLOWED_EMAIL_DOMAINS') else []

# MiniCRM Configuration
MINICRM_SYSTEM_ID = os.getenv('MINICRM_SYSTEM_ID', '')
MINICRM_API_KEY = os.getenv('MINICRM_API_KEY', '')
MINICRM_ENABLED = bool(MINICRM_SYSTEM_ID and MINICRM_API_KEY)

# Load API keys from environment variables (production) or config file (local)
CONFIG_FILE = 'config.json'
CHATGPT_API_KEY = os.getenv('OPENAI_API_KEY')  # Try env var first
GMAIL_CREDENTIALS_PATH = 'gmail_credentials.json'
GMAIL_TOKEN_PATH = 'gmail_token.json'

# If not in env, try config file (local development)
if not CHATGPT_API_KEY and os.path.exists(CONFIG_FILE):
    try:
        with open(CONFIG_FILE, 'r') as f:
            config = json.load(f)
            CHATGPT_API_KEY = config.get('openai_api_key')
            ASSISTANTS_CONFIG = config.get('assistants', {})
    except Exception as e:
        print(f"⚠️  Warning: Could not load config.json: {e}")

# Handle Gmail credentials from base64 env var (for Railway)
if os.getenv('GMAIL_CREDENTIALS_BASE64') and not os.path.exists(GMAIL_CREDENTIALS_PATH):
    try:
        creds_json = base64.b64decode(os.getenv('GMAIL_CREDENTIALS_BASE64')).decode('utf-8')
        with open(GMAIL_CREDENTIALS_PATH, 'w') as f:
            f.write(creds_json)
        print("✅ Gmail credentials loaded from environment")
    except Exception as e:
        print(f"⚠️  Warning: Could not decode Gmail credentials: {e}")

# Handle Gmail token from base64 env var (for Railway)
if os.getenv('GMAIL_TOKEN_BASE64') and not os.path.exists(GMAIL_TOKEN_PATH):
    try:
        token_json = base64.b64decode(os.getenv('GMAIL_TOKEN_BASE64')).decode('utf-8')
        with open(GMAIL_TOKEN_PATH, 'w') as f:
            f.write(token_json)
        print("✅ Gmail token loaded from environment")
    except Exception as e:
        print(f"⚠️  Warning: Could not decode Gmail token: {e}")

# Default assistants (can be overridden in config)
ASSISTANTS = {
    "Marketing Expert": {
        "id": "asst_5U9UaLBo3j5GYiHHMN9fGnYo",
        "color": "#9b59b6",
        "description": "Email marketing & B2B sales strategies"
    },
    "General Assistant": {
        "id": "asst_N7h1H9a6xjtBrQwYMsdRZILZ",
        "color": "#3498db",
        "description": "General business assistance"
    }
}

# Initialize OpenAI client (only if API key is available)
client = None
if CHATGPT_API_KEY:
    try:
        client = openai.OpenAI(api_key=CHATGPT_API_KEY)
        print("✅ OpenAI API initialized")
    except Exception as e:
        print(f"⚠️  Warning: Could not initialize OpenAI client: {e}")
        client = None
else:
    print("⚠️  Warning: No OpenAI API key found. Chat functionality will be disabled.")

# Store conversations in memory (in production, use a database)
conversations = {}


# Authentication decorator for internal use
def check_auth(username, password):
    """Check if username/password is valid"""
    if not BASIC_AUTH_USERS:
        return True  # No auth configured
    return username in BASIC_AUTH_USERS and BASIC_AUTH_USERS[username] == password


def authenticate():
    """Send 401 response for authentication"""
    return Response(
        'Authentication required.\n'
        'Please provide valid credentials.', 401,
        {'WWW-Authenticate': 'Basic realm="PRV AI Assistant - Internal Use"'}
    )


def requires_auth(f):
    """Decorator for routes that require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not BASIC_AUTH_USERS:
            return f(*args, **kwargs)  # No auth required
        
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)
    return decorated


@app.route('/')
@requires_auth
def index():
    """Main page"""
    has_openai = client is not None
    has_gmail = os.path.exists(GMAIL_CREDENTIALS_PATH)
    
    # Get username from auth if available
    username = None
    if request.authorization:
        username = request.authorization.username
    
    return render_template('index.html', 
                         assistants=ASSISTANTS,
                         has_openai=has_openai,
                         has_gmail=has_gmail,
                         username=username)


@app.route('/api/send_message', methods=['POST'])
def send_message():
    """Send a message to the AI assistant"""
    try:
        # Check if OpenAI is configured
        if not client:
            return jsonify({
                'error': 'OpenAI API is not configured. Please set up your API key in the Settings.'
            }), 400
        
        data = request.json
        message = data.get('message', '').strip()
        assistant_name = data.get('assistant', 'Marketing Expert')
        session_id = data.get('session_id', 'default')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Get or create thread
        if session_id not in conversations:
            conversations[session_id] = {
                'thread_id': None,
                'messages': []
            }
        
        conv = conversations[session_id]
        
        # Create thread if needed
        if not conv['thread_id']:
            thread = client.beta.threads.create()
            conv['thread_id'] = thread.id
        
        # Add user message
        client.beta.threads.messages.create(
            thread_id=conv['thread_id'],
            role="user",
            content=message
        )
        
        # Get assistant
        assistant_id = ASSISTANTS[assistant_name]['id']
        
        # Run assistant
        run = client.beta.threads.runs.create(
            thread_id=conv['thread_id'],
            assistant_id=assistant_id
        )
        
        # Wait for completion
        while run.status in ['queued', 'in_progress']:
            time.sleep(0.5)
            run = client.beta.threads.runs.retrieve(
                thread_id=conv['thread_id'],
                run_id=run.id
            )
        
        if run.status == 'completed':
            # Get messages
            messages = client.beta.threads.messages.list(
                thread_id=conv['thread_id']
            )
            
            # Get the latest assistant message
            for msg in messages.data:
                if msg.role == "assistant":
                    response_text = msg.content[0].text.value
                    
                    return jsonify({
                        'response': response_text,
                        'assistant': assistant_name,
                        'timestamp': datetime.now().isoformat()
                    })
        
        return jsonify({'error': 'Failed to get response'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/clear_conversation', methods=['POST'])
def clear_conversation():
    """Clear conversation history"""
    try:
        data = request.json
        session_id = data.get('session_id', 'default')
        
        if session_id in conversations:
            del conversations[session_id]
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/check_config', methods=['GET'])
def check_config():
    """Check if APIs are configured"""
    return jsonify({
        'hasOpenAI': client is not None,
        'hasGmail': os.path.exists(GMAIL_CREDENTIALS_PATH)
    })


@app.route('/api/gmail_status', methods=['GET'])
def gmail_status():
    """Check Gmail connection status"""
    gmail_token = session.get('gmail_token')
    user_email = session.get('gmail_user_email')
    
    return jsonify({
        'connected': gmail_token is not None,
        'email': user_email if gmail_token else None
    })


@app.route('/api/gmail_disconnect', methods=['POST'])
def gmail_disconnect():
    """Disconnect Gmail"""
    session.pop('gmail_token', None)
    session.pop('gmail_user_email', None)
    session.pop('gmail_oauth_state', None)
    
    return jsonify({
        'success': True
    })


@app.route('/api/save_config', methods=['POST'])
def save_config():
    """Save API configuration"""
    try:
        data = request.json
        
        config = {}
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
        
        # Update config
        if 'openai_api_key' in data:
            config['openai_api_key'] = data['openai_api_key']
        
        if 'gmail_credentials' in data:
            # Save Gmail credentials to file
            with open(GMAIL_CREDENTIALS_PATH, 'w') as f:
                json.dump(data['gmail_credentials'], f, indent=2)
        
        # Save config
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        
        return jsonify({
            'success': True,
            'message': 'Configuration saved! Please restart the application for changes to take effect.'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def extract_message_body(payload):
    """Extract text body from Gmail message payload"""
    import re
    import base64
    
    body = ""
    
    if 'parts' in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                if 'data' in part['body']:
                    body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='ignore')
                    break
            elif part['mimeType'] == 'text/html' and not body:
                if 'data' in part['body']:
                    body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='ignore')
            elif 'parts' in part:
                body = extract_message_body(part)
                if body:
                    break
    elif 'body' in payload and 'data' in payload['body']:
        body = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='ignore')
    
    # If HTML, clean it
    if body and ('<html' in body.lower() or '<!doctype' in body.lower()):
        # Remove style, script, head blocks
        body = re.sub(r'<style[^>]*>.*?</style>', '', body, flags=re.DOTALL | re.IGNORECASE)
        body = re.sub(r'<script[^>]*>.*?</script>', '', body, flags=re.DOTALL | re.IGNORECASE)
        body = re.sub(r'<head[^>]*>.*?</head>', '', body, flags=re.DOTALL | re.IGNORECASE)
        body = re.sub(r'<!--.*?-->', '', body, flags=re.DOTALL)
        # Remove HTML tags
        body = re.sub(r'<[^>]+>', ' ', body)
        # Decode HTML entities
        body = body.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"')
        # Clean up whitespace
        body = re.sub(r'\s+', ' ', body)
    
    return body.strip()


@app.route('/api/gmail_auth_url', methods=['GET'])
def gmail_auth_url():
    """Generate Gmail OAuth URL for user authorization"""
    try:
        if not os.path.exists(GMAIL_CREDENTIALS_PATH):
            return jsonify({
                'error': 'Gmail API is not configured.',
                'needs_setup': True
            }), 400
        
        from google_auth_oauthlib.flow import Flow
        
        SCOPES = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send'
        ]
        
        # Allow insecure transport for local development
        if not IS_PRODUCTION:
            os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
        
        # Create flow
        flow = Flow.from_client_secrets_file(
            GMAIL_CREDENTIALS_PATH,
            scopes=SCOPES,
            redirect_uri=request.host_url.rstrip('/') + '/api/gmail_callback'
        )
        
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        
        # Store state in session
        session['gmail_oauth_state'] = state
        
        return jsonify({
            'auth_url': authorization_url
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/gmail_callback')
def gmail_callback():
    """Handle Gmail OAuth callback"""
    try:
        from google_auth_oauthlib.flow import Flow
        from google.oauth2.credentials import Credentials
        
        SCOPES = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send'
        ]
        
        # Verify state
        state = session.get('gmail_oauth_state')
        if not state:
            return '<h1>Error: Invalid state</h1><p>Please try again.</p>', 400
        
        # Allow insecure transport for local development
        if not IS_PRODUCTION:
            os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
        
        # Create flow with same redirect URI
        flow = Flow.from_client_secrets_file(
            GMAIL_CREDENTIALS_PATH,
            scopes=SCOPES,
            state=state,
            redirect_uri=request.host_url.rstrip('/') + '/api/gmail_callback'
        )
        
        # Fetch token
        flow.fetch_token(authorization_response=request.url)
        
        # Get credentials
        creds = flow.credentials
        
        # Get user email from Google
        try:
            from googleapiclient.discovery import build
            service = build('gmail', 'v1', credentials=creds)
            profile = service.users().getProfile(userId='me').execute()
            user_email = profile.get('emailAddress', 'Unknown')
        except:
            user_email = 'Connected'
        
        # Save token for this user session
        session['gmail_token'] = {
            'token': creds.token,
            'refresh_token': creds.refresh_token,
            'token_uri': creds.token_uri,
            'client_id': creds.client_id,
            'client_secret': creds.client_secret,
            'scopes': creds.scopes
        }
        
        # Save user email
        session['gmail_user_email'] = user_email
        
        # Return success page
        return '''
        <html>
        <head>
            <title>Gmail Connected!</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .container {
                    background: white;
                    padding: 48px;
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    text-align: center;
                    max-width: 400px;
                }
                h1 { color: #27ae60; margin-bottom: 16px; }
                p { color: #666; margin-bottom: 24px; line-height: 1.6; }
                button {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 32px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                }
                button:hover { opacity: 0.9; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>✅ Gmail Connected!</h1>
                <p>Your Gmail account has been successfully connected. You can now load email history.</p>
                <button onclick="window.close()">Close Window</button>
                <script>
                    setTimeout(() => {
                        window.close();
                        if (!window.closed) {
                            window.location.href = '/';
                        }
                    }, 3000);
                </script>
            </div>
        </body>
        </html>
        '''
        
    except Exception as e:
        return f'<h1>Error</h1><p>{str(e)}</p>', 500


@app.route('/api/load_emails', methods=['POST'])
def load_emails():
    """Load email history from Gmail"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid request'}), 400
            
        email_address = data.get('email', '').strip()
        
        if not email_address:
            return jsonify({'error': 'Email address is required'}), 400
        
        # Check if user has authorized Gmail
        gmail_token = session.get('gmail_token')
        if not gmail_token:
            return jsonify({
                'error': 'Gmail not authorized. Please connect your Gmail account first.',
                'needs_auth': True
            }), 401
        
        # Check if Gmail API is available
        try:
            from google.auth.transport.requests import Request
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build
            import base64
            from email.utils import parsedate_to_datetime
        except ImportError as e:
            return jsonify({'error': f'Gmail API libraries not installed: {str(e)}'}), 400
        
        # Create credentials from session
        creds = Credentials(
            token=gmail_token['token'],
            refresh_token=gmail_token.get('refresh_token'),
            token_uri=gmail_token['token_uri'],
            client_id=gmail_token['client_id'],
            client_secret=gmail_token['client_secret'],
            scopes=gmail_token['scopes']
        )
        
        # Refresh if expired
        if creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                # Update session with new token
                session['gmail_token']['token'] = creds.token
            except Exception as e:
                return jsonify({
                    'error': 'Gmail token expired. Please reconnect your Gmail account.',
                    'needs_auth': True
                }), 401
        
        service = build('gmail', 'v1', credentials=creds)
        
        # Search for emails
        query = f'from:{email_address} OR to:{email_address}'
        results = service.users().messages().list(userId='me', q=query, maxResults=20).execute()
        messages = results.get('messages', [])
        
        email_list = []
        for msg in messages:
            msg_data = service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
            
            headers = msg_data['payload']['headers']
            subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), 'No Subject')
            from_email = next((h['value'] for h in headers if h['name'].lower() == 'from'), 'Unknown')
            date_str = next((h['value'] for h in headers if h['name'].lower() == 'date'), '')
            
            # Parse date
            try:
                date_obj = parsedate_to_datetime(date_str) if date_str else datetime.now()
                formatted_date = date_obj.strftime('%Y-%m-%d %H:%M')
            except:
                formatted_date = date_str or 'Unknown date'
            
            # Extract full body
            body = extract_message_body(msg_data['payload'])
            
            # Determine direction
            is_from_me = any(x in from_email.lower() for x in ["ince@prv.hu", "czechner ince", "czechner"])
            direction = "KÜLDTEM (Czechner Ince)" if is_from_me else "KAPTAM"
            
            email_list.append({
                'id': msg['id'],
                'subject': subject,
                'from': from_email,
                'date': formatted_date,
                'body': body,  # Full body, not truncated
                'direction': direction
            })
        
        return jsonify({
            'success': True,
            'email': email_address,
            'count': len(email_list),
            'emails': email_list
        })
        
    except Exception as e:
        print(f"Error in load_emails: {str(e)}")  # Log to console
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/api/upload_excel', methods=['POST'])
def upload_excel():
    """Upload and parse Excel file with contact list"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Please upload .xlsx, .xls, or .csv file'}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Parse Excel/CSV file
        try:
            if filename.endswith('.csv'):
                df = pd.read_csv(filepath)
            else:
                df = pd.read_excel(filepath)
        except Exception as e:
            os.remove(filepath)
            return jsonify({'error': f'Failed to parse file: {str(e)}'}), 400
        
        # Validate columns - look for various common column names
        required_cols = {'company', 'person', 'email'}
        df_cols_lower = {col.lower().strip(): col for col in df.columns}
        
        # Try to map columns
        column_mapping = {}
        
        # Map company column
        for possible in ['company', 'company name', 'company_name', 'ceg', 'cégnév']:
            if possible in df_cols_lower:
                column_mapping['company'] = df_cols_lower[possible]
                break
        
        # Map person column
        for possible in ['person', 'person name', 'person_name', 'name', 'contact', 'nev', 'név', 'kapcsolattarto', 'kapcsolattartó']:
            if possible in df_cols_lower:
                column_mapping['person'] = df_cols_lower[possible]
                break
        
        # Map email column
        for possible in ['email', 'e-mail', 'email address', 'email_address', 'mail']:
            if possible in df_cols_lower:
                column_mapping['email'] = df_cols_lower[possible]
                break
        
        # Check if all required columns are found
        if len(column_mapping) != 3:
            missing = required_cols - set(column_mapping.keys())
            os.remove(filepath)
            return jsonify({
                'error': f'Missing required columns: {", ".join(missing)}. Found columns: {", ".join(df.columns)}'
            }), 400
        
        # Extract and clean data
        contacts = []
        for idx, row in df.iterrows():
            company = str(row[column_mapping['company']]).strip() if pd.notna(row[column_mapping['company']]) else ''
            person = str(row[column_mapping['person']]).strip() if pd.notna(row[column_mapping['person']]) else ''
            email = str(row[column_mapping['email']]).strip() if pd.notna(row[column_mapping['email']]) else ''
            
            # Basic email validation
            if email and '@' in email and '.' in email:
                contacts.append({
                    'company': company,
                    'person': person,
                    'email': email
                })
        
        # Clean up file
        os.remove(filepath)
        
        if len(contacts) == 0:
            return jsonify({'error': 'No valid contacts found in file'}), 400
        
        # Store contacts in session for later use
        session['bulk_email_contacts'] = contacts
        
        return jsonify({
            'success': True,
            'count': len(contacts),
            'contacts': contacts[:10],  # Return first 10 for preview
            'total_contacts': len(contacts)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/send_bulk_emails', methods=['POST'])
def send_bulk_emails():
    """Send bulk emails to contact list"""
    try:
        # Check if user has authorized Gmail
        gmail_token = session.get('gmail_token')
        if not gmail_token:
            return jsonify({
                'error': 'Gmail not authorized. Please connect your Gmail account first.',
                'needs_auth': True
            }), 401
        
        # Get contacts from session
        contacts = session.get('bulk_email_contacts', [])
        if not contacts:
            return jsonify({'error': 'No contacts loaded. Please upload an Excel file first.'}), 400
        
        # Get email template from request
        data = request.json
        subject_template = data.get('subject', '').strip()
        body_template = data.get('body', '').strip()
        sender_name = data.get('sender_name', '').strip()
        signature = data.get('signature', '').strip()
        
        if not subject_template or not body_template:
            return jsonify({'error': 'Email subject and body are required'}), 400
        
        # Import Gmail libraries
        try:
            from google.auth.transport.requests import Request
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build
        except ImportError as e:
            return jsonify({'error': f'Gmail API libraries not installed: {str(e)}'}), 400
        
        # Create credentials from session
        creds = Credentials(
            token=gmail_token['token'],
            refresh_token=gmail_token.get('refresh_token'),
            token_uri=gmail_token['token_uri'],
            client_id=gmail_token['client_id'],
            client_secret=gmail_token['client_secret'],
            scopes=gmail_token['scopes']
        )
        
        # Refresh if expired
        if creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                session['gmail_token']['token'] = creds.token
            except Exception as e:
                return jsonify({
                    'error': 'Gmail token expired. Please reconnect your Gmail account.',
                    'needs_auth': True
                }), 401
        
        # Build Gmail service
        service = build('gmail', 'v1', credentials=creds)
        
        # Get user's email address for From header
        try:
            profile = service.users().getProfile(userId='me').execute()
            user_email = profile.get('emailAddress', '')
        except:
            user_email = session.get('gmail_user_email', '')
        
        # Send emails
        results = {
            'success': [],
            'failed': []
        }
        
        for contact in contacts:
            try:
                # Replace placeholders in subject and body
                subject = subject_template.replace('{{company}}', contact['company'])
                subject = subject.replace('{{person}}', contact['person'])
                subject = subject.replace('{{email}}', contact['email'])
                
                body = body_template.replace('{{company}}', contact['company'])
                body = body.replace('{{person}}', contact['person'])
                body = body.replace('{{email}}', contact['email'])
                
                # Create message
                message = MIMEMultipart('related')
                message['To'] = contact['email']
                message['Subject'] = subject
                
                # Set From header with display name if provided
                if sender_name and user_email:
                    message['From'] = f'{sender_name} <{user_email}>'
                elif user_email:
                    message['From'] = user_email
                
                # Convert body to HTML with line breaks
                html_body = body.replace('\n', '<br>')
                
                # Build HTML signature with logo if signature provided
                if signature:
                    # Replace placeholders in signature
                    sig = signature.replace('{{company}}', contact['company'])
                    sig = sig.replace('{{person}}', contact['person'])
                    sig = sig.replace('{{email}}', contact['email'])
                    
                    # HTML signature with embedded logo (logo on top)
                    html_signature = f'''
                    <div style="margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                        <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="text-align: left;">
                                    <img src="cid:prv_logo" alt="PRV Logo" width="120" style="display: block; margin-bottom: 15px;">
                                    <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
                                        {sig.replace(chr(10), '<br>')}
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>
                    '''
                    full_html = f'<html><body><div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">{html_body}</div>{html_signature}</body></html>'
                else:
                    full_html = f'<html><body><div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">{html_body}</div></body></html>'
                
                # Add HTML body
                message.attach(MIMEText(full_html, 'html'))
                
                # Embed logo image if signature is provided
                if signature:
                    try:
                        logo_path = 'prv.png'
                        if os.path.exists(logo_path):
                            with open(logo_path, 'rb') as img:
                                logo_img = MIMEImage(img.read())
                                logo_img.add_header('Content-ID', '<prv_logo>')
                                logo_img.add_header('Content-Disposition', 'inline', filename='prv.png')
                                message.attach(logo_img)
                    except Exception as e:
                        print(f"Warning: Could not attach logo: {e}")
                
                # Encode message
                raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
                
                # Send via Gmail API
                send_result = service.users().messages().send(
                    userId='me',
                    body={'raw': raw_message}
                ).execute()
                
                results['success'].append({
                    'email': contact['email'],
                    'person': contact['person'],
                    'company': contact['company']
                })
                
                # Small delay to avoid rate limiting
                time.sleep(0.5)
                
            except Exception as e:
                results['failed'].append({
                    'email': contact['email'],
                    'person': contact['person'],
                    'company': contact['company'],
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'results': results,
            'total_sent': len(results['success']),
            'total_failed': len(results['failed'])
        })
        
    except Exception as e:
        print(f"Error in send_bulk_emails: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


def open_browser():
    """Open browser after a short delay (local development only)"""
    time.sleep(1.5)
    webbrowser.open('http://localhost:5000')


# ============================================
# MINICRM API ENDPOINTS
# ============================================

@app.route('/api/minicrm/status', methods=['GET'])
@requires_auth
def minicrm_status():
    """Check if MiniCRM integration is enabled"""
    return jsonify({
        'enabled': MINICRM_ENABLED,
        'system_id': MINICRM_SYSTEM_ID if MINICRM_ENABLED else None
    })


@app.route('/api/minicrm/find_contact', methods=['POST'])
@requires_auth
def minicrm_find_contact():
    """Find contact in MiniCRM by email address"""
    # Debug logging
    print(f"MiniCRM find_contact called")
    print(f"MINICRM_ENABLED: {MINICRM_ENABLED}")
    print(f"MINICRM_SYSTEM_ID: {MINICRM_SYSTEM_ID}")
    print(f"MINICRM_API_KEY: {'[SET]' if MINICRM_API_KEY else '[NOT SET]'}")
    
    if not MINICRM_ENABLED:
        return jsonify({'error': 'MiniCRM integration not configured'}), 400
    
    try:
        data = request.json
        email = data.get('email', '').strip()
        
        if not email:
            return jsonify({'error': 'Email address required'}), 400
        
        print(f"Searching for email: {email}")
        
        # MiniCRM API call to search contacts
        auth = (MINICRM_SYSTEM_ID, MINICRM_API_KEY)
        url = f"https://r3.minicrm.hu/Api/R3/Contact"
        
        # Search by email
        params = {'Email': email}
        
        print(f"Making request to: {url}")
        print(f"Auth: System ID={MINICRM_SYSTEM_ID}")
        print(f"Params: {params}")
        
        response = requests.get(url, auth=auth, params=params, timeout=10)
        
        print(f"Response status: {response.status_code}")
        print(f"Response content: {response.text[:200]}")  # First 200 chars
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response data structure: {type(data)}")
            
            # MiniCRM API returns: {"Count": 1, "Results": {"28261": {...}}}
            results = data.get('Results', {})
            count = data.get('Count', 0)
            
            print(f"Found {count} contacts")
            
            if results and count > 0:
                # IMPORTANT: Multiple contacts with same email may exist!
                # Each contact may be linked to different Business/Projects
                # We need to collect ALL BusinessIds to query all projects
                
                all_business_ids = []
                primary_contact = None
                
                for contact_id, contact in results.items():
                    print(f"Contact #{len(all_business_ids)+1}: {contact.get('Name')} (ID: {contact_id}, BusinessId: {contact.get('BusinessId')})")
                    
                    business_id = contact.get('BusinessId')
                    if business_id:
                        all_business_ids.append(business_id)
                    
                    # Use first contact as primary for display
                    if not primary_contact:
                        primary_contact = contact
                
                print(f"Collected {len(all_business_ids)} unique Business IDs: {all_business_ids}")
                
                if not primary_contact:
                    return jsonify({'found': False, 'message': 'No valid contact found'})
                
                return jsonify({
                    'found': True,
                    'contact': {
                        'id': primary_contact.get('Id'),
                        'name': primary_contact.get('Name'),
                        'email': primary_contact.get('Email'),
                        'company': primary_contact.get('Company'),
                        'phone': primary_contact.get('Phone'),
                        'business_ids': all_business_ids,  # ← ALL BusinessIds (plural)!
                        'business_id': all_business_ids[0] if all_business_ids else None  # ← Keep for backwards compat
                    }
                })
            else:
                print("No contacts found")
                return jsonify({'found': False, 'message': 'No contact found with this email'})
        else:
            error_msg = f'MiniCRM API error: {response.status_code} - {response.text[:200]}'
            print(error_msg)
            return jsonify({'error': error_msg}), response.status_code
    
    except requests.exceptions.Timeout:
        print("MiniCRM API timeout")
        return jsonify({'error': 'MiniCRM API timeout'}), 408
    except Exception as e:
        print(f"Error finding contact: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'{type(e).__name__}: {str(e)}'}), 500


@app.route('/api/minicrm/get_todos', methods=['POST'])
@requires_auth
def minicrm_get_todos():
    """Get todos (tasks) for a contact from MiniCRM"""
    print(f"MiniCRM get_todos endpoint called")
    
    if not MINICRM_ENABLED:
        return jsonify({'error': 'MiniCRM integration not configured'}), 400
    
    try:
        data = request.json
        business_id = data.get('business_id')
        business_ids = data.get('business_ids', [])  # NEW: Accept multiple BusinessIds!
        contact_name = data.get('contact_name', 'Unknown')
        category_id = data.get('category_id')  # Optional: filter by Termék (Product/Category)
        filter_user = data.get('filter_user')  # Optional: filter by assigned user
        include_closed = data.get('include_closed', False)  # Optional: include closed/completed todos
        
        # Support both single business_id and multiple business_ids
        if not business_ids and business_id:
            business_ids = [business_id]
        
        if not business_ids:
            return jsonify({'error': 'Business ID(s) required to find projects and todos'}), 400
        
        print(f"Getting todos for {len(business_ids)} Business ID(s): {business_ids} (Contact: {contact_name}, Category: {category_id or 'All'}, Filter User: {filter_user or 'All'}, Include Closed: {include_closed})")
        
        auth = (MINICRM_SYSTEM_ID, MINICRM_API_KEY)
        
        # Step 1: Get all Projects for ALL Business IDs
        # MiniCRM structure: Contact → Business → Projects → ToDoList
        # Multiple contacts with same email = multiple BusinessIds to check!
        projects_url = f"https://r3.minicrm.hu/Api/R3/Project"
        
        all_projects_results = {}
        
        for business_id in business_ids:
            projects_params = {'MainContactId': business_id}
            
            # Add CategoryId filter if specified (to get only ACS or PCS projects)
            if category_id:
                projects_params['CategoryId'] = category_id
                print(f"Getting projects for business {business_id}: {projects_url}?MainContactId={business_id}&CategoryId={category_id}")
            else:
                print(f"Getting projects for business {business_id}: {projects_url}?MainContactId={business_id} (all categories)")
            
            try:
                projects_response = requests.get(projects_url, auth=auth, params=projects_params, timeout=10)
                
                print(f"Projects response status for Business {business_id}: {projects_response.status_code}")
                
                if projects_response.status_code == 200:
                    projects_data = projects_response.json()
                    projects_results = projects_data.get('Results', {})
                    projects_count = projects_data.get('Count', 0)
                    
                    print(f"Found {projects_count} projects for business {business_id}")
                    print(f"FULL Projects response for Business {business_id}: {projects_response.text}")
                    
                    # Handle both dict and list response formats
                    if isinstance(projects_results, dict):
                        # Dict format: {"12651": {...}, "12690": {...}}
                        # WARNING: Search results may not include CategoryId!
                        # Need to fetch full project details if CategoryId missing
                        
                        for project_id_str, project_info in projects_results.items():
                            project_id = project_info.get('Id')
                            project_category = project_info.get('CategoryId')
                            
                            print(f"  Project search result: {project_info.get('Name')} (ID: {project_id}, CategoryId: {project_category or 'NOT IN SEARCH RESULT'})")
                            
                            # If CategoryId not in search result and we have a filter, fetch full details
                            if not project_category and category_id:
                                project_url = project_info.get('Url')
                                if project_url:
                                    try:
                                        print(f"    Fetching full project details from: {project_url}")
                                        full_project_response = requests.get(project_url, auth=auth, timeout=10)
                                        if full_project_response.status_code == 200:
                                            full_project_info = full_project_response.json()
                                            project_category = full_project_info.get('CategoryId')
                                            print(f"    Full project CategoryId: {project_category}")
                                            
                                            # Update project_info with full data
                                            project_info = full_project_info
                                    except Exception as e:
                                        print(f"    Error fetching full project: {str(e)}")
                            
                            # Only add if CategoryId matches filter (or no filter)
                            if not category_id or str(project_category) == str(category_id):
                                all_projects_results[project_id_str] = project_info
                                print(f"    ✅ Added to results (CategoryId match or no filter)")
                            else:
                                print(f"    ❌ Skipped (CategoryId {project_category} != filter {category_id})")
                    
                    elif isinstance(projects_results, list):
                        # List format: [{...}, {...}]
                        print(f"  Projects returned as list (count: {len(projects_results)})")
                        for project_info in projects_results:
                            project_id = project_info.get('Id')
                            if project_id:
                                all_projects_results[str(project_id)] = project_info
                                print(f"  Project: {project_info.get('Name')} (ID: {project_id}, CategoryId: {project_info.get('CategoryId', 'N/A')}, BusinessId: {business_id})")
                    else:
                        print(f"  Warning: Unexpected projects_results type: {type(projects_results)}")
                else:
                    print(f"Failed to get projects for business {business_id}: {projects_response.status_code}")
            except Exception as e:
                print(f"Error getting projects for business {business_id}: {str(e)}")
                continue
        
        total_projects = len(all_projects_results)
        print(f"Total projects found across {len(business_ids)} Business ID(s): {total_projects}")
        
        if total_projects == 0:
            print("No projects found for any business")
            return jsonify({'success': True, 'todos': [], 'message': 'No projects found'})
        
        # Step 2: Get todos from all projects
        all_todos = []
        
        for project_id_str, project_info in all_projects_results.items():
            project_id = project_info.get('Id')
            project_name = project_info.get('Name')
            
            print(f"Getting todos for project: {project_name} (ID: {project_id})")
            
            # MiniCRM API call to get todos for this project
            # Correct endpoint: /Api/R3/ToDoList/{project_id}
            # Status parameter: Open (only active todos), Closed (completed), or All (default)
            url = f"https://r3.minicrm.hu/Api/R3/ToDoList/{project_id}"
            todo_params = {}
            
            # Determine which todos to fetch based on include_closed flag
            if include_closed:
                # Fetch ALL todos (Open + Closed) - don't specify Status param
                print(f"Making TODO request to: {url} (All - Open + Closed)")
            else:
                # Fetch only Open/active todos
                todo_params['Status'] = 'Open'
                print(f"Making TODO request to: {url}?Status=Open (Active only)")
            
            try:
                response = requests.get(url, auth=auth, params=todo_params, timeout=10)
                
                print(f"TODO Response status: {response.status_code}")
                print(f"TODO Response content: {response.text[:500]}")
                
                if response.status_code == 200:
                    todo_data = response.json()
                    print(f"Todos response type: {type(todo_data)}")
                    
                    # MiniCRM API returns: {"Count": N, "Results": [{...}, {...}]} or {"Count": N, "Results": {"id1": {...}}}
                    results = todo_data.get('Results', {})
                    count = todo_data.get('Count', 0)
                    
                    print(f"Found {count} todos for project {project_name}")
                    
                    # Handle both dict and list response formats
                    if isinstance(results, dict):
                        todo_items = results.values()
                    else:
                        todo_items = results
                    
                    # Collect unique UserIds for debugging
                    unique_user_ids = set()
                    for todo in todo_items:
                        user_id = todo.get('UserId')
                        if user_id:
                            unique_user_ids.add(user_id)
                    
                    print(f"Unique UserIds in project {project_name}: {unique_user_ids}")
                    
                    # Format todos for frontend
                    for todo in todo_items:
                        # Filter by user if specified
                        todo_user_id = todo.get('UserId', '')
                        
                        # If filter_user is set, only include todos assigned to that user
                        if filter_user and todo_user_id:
                            # UserId in MiniCRM is typically a NUMERIC ID
                            # User may enter either:
                            # 1. Numeric ID (e.g., "120420")
                            # 2. User name (will NOT match numeric UserId!)
                            
                            is_match = False
                            
                            # Try numeric comparison first
                            try:
                                if str(todo_user_id) == str(filter_user):
                                    is_match = True
                            except:
                                pass
                            
                            # If still no match and both are strings, try case-insensitive
                            if not is_match and isinstance(todo_user_id, str) and isinstance(filter_user, str):
                                if todo_user_id.strip().lower() == filter_user.strip().lower():
                                    is_match = True
                            
                            if not is_match:
                                print(f"Filtered out todo {todo.get('Id')}: UserId {todo_user_id} != filter {filter_user}")
                                continue  # Skip this todo
                        
                        formatted_todo = {
                            'id': todo.get('Id'),
                            'title': todo.get('Comment') or todo.get('Title') or todo.get('Name', 'Névtelen teendő'),
                            'description': todo.get('Description', ''),
                            'deadline': todo.get('Deadline') or todo.get('DueDate'),
                            'status': todo.get('Status', 'Active'),
                            'completed': todo.get('Status') == 'Closed',
                            'project_name': project_name,
                            'project_id': project_id,
                            'assigned_to': todo_user_id  # Include assigned user for debugging
                        }
                        all_todos.append(formatted_todo)
                    
                else:
                    print(f"Failed to get todos for project {project_id}: {response.status_code}")
                    
            except Exception as e:
                print(f"Error getting todos for project {project_id}: {str(e)}")
                continue
        
        print(f"Total todos found across all projects: {len(all_todos)}")
        
        return jsonify({
            'success': True,
            'todos': all_todos,
            'count': len(all_todos)
        })
    
    except requests.exceptions.Timeout:
        return jsonify({'error': 'MiniCRM API timeout'}), 408
    except Exception as e:
        print(f"Error getting todos: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/minicrm/daily_todos', methods=['POST'])
@requires_auth
def minicrm_daily_todos():
    """Get todos for today and overdue - Smart approach: Query ACTIVE projects only"""
    if not MINICRM_ENABLED:
        return jsonify({'error': 'MiniCRM integration not configured'}), 400
    
    try:
        from datetime import date, datetime
        import concurrent.futures
        
        data = request.json or {}
        category_id = data.get('category_id')
        filter_user = data.get('filter_user')
        
        today = date.today()
        today_str = today.strftime('%Y-%m-%d')
        
        print(f"🚀 Smart Approach: Query ACTIVE projects only")
        print(f"   Filters: Category={category_id or 'All'}, User={filter_user or 'All'}")
        
        auth = (MINICRM_SYSTEM_ID, MINICRM_API_KEY)
        
        # ACTIVE STATUS IDs - Use ALL available statuses from schema
        # We'll fetch from ALL statuses and let the system find todos
        # ACS (Category 23): All available status IDs from schema
        # PCS (Category 41): All available status IDs from schema
        if category_id == '23':  # ACS
            # All ACS status IDs from schema discovery
            ACTIVE_STATUS_IDS = [2790, 2784, 2777, 2778, 2786, 2787, 2819, 2818, 2817, 2779, 2820, 2846, 2838, 2816, 2788, 2781]
        elif category_id == '41':  # PCS
            # All PCS status IDs from schema discovery
            ACTIVE_STATUS_IDS = [3108, 3117, 3107, 3101, 3106, 3119, 3102, 3118, 3120, 3110, 3113, 3111, 3104, 3112, 3115, 3116, 3114]
        else:
            # If no category filter, try both
            ACTIVE_STATUS_IDS = [2777, 2778, 2784, 2786, 2787, 3101, 3102, 3104, 3106, 3107]
        
        # MAX_PROJECTS_PER_STATUS - Limit to avoid timeout
        # Increased to catch more todos, but still keep it fast
        MAX_PROJECTS_PER_STATUS = 100  # 100 projects per status (with parallel fetching, still fast)
        
        print(f"   Fetching max {MAX_PROJECTS_PER_STATUS} projects per status: {ACTIVE_STATUS_IDS}")
        
        # Step 1: Fetch active projects
        projects_url = "https://r3.minicrm.hu/Api/R3/Project"
        all_projects = []
        
        for status_id in ACTIVE_STATUS_IDS:
            params = {'StatusId': status_id}
            if category_id:
                params['CategoryId'] = category_id
            
            try:
                response = requests.get(projects_url, auth=auth, params=params, timeout=10)
                if response.status_code == 200:
                    projects_data = response.json()
                    projects = projects_data.get('Results', {})
                    
                    if isinstance(projects, dict):
                        projects = list(projects.values())
                    
                    # Take first N projects from this status
                    count_total = len(projects)
                    projects = projects[:MAX_PROJECTS_PER_STATUS]
                    all_projects.extend(projects)
                    
                    if len(projects) > 0:
                        print(f"   Status {status_id}: Fetched {len(projects)} projects (total: {count_total})")
            except Exception as e:
                print(f"   Error fetching status {status_id}: {str(e)}")
        
        print(f"✅ Total active projects to check: {len(all_projects)}")
        
        # Step 2: Fetch todos from all projects (with parallel requests for speed)
        all_todos = []
        
        def fetch_todos_for_project(project):
            """Fetch todos for a single project"""
            project_id = project.get('Id')
            project_name = project.get('Name', 'Unknown')
            
            try:
                todo_url = f"https://r3.minicrm.hu/Api/R3/ToDoList/{project_id}"
                todo_response = requests.get(todo_url, auth=auth, params={'Status': 'Open'}, timeout=5)
                
                if todo_response.status_code == 200:
                    todo_data = todo_response.json()
                    todos = todo_data.get('Results', [])
                    
                    if isinstance(todos, dict):
                        todos = list(todos.values())
                    
                    project_todos = []
                    for todo in todos:
                        deadline_str = todo.get('Deadline', '')
                        if not deadline_str:
                            continue
                        
                        try:
                            deadline_date = datetime.strptime(deadline_str.split(' ')[0], '%Y-%m-%d').date()
                        except:
                            continue
                        
                        # Only today or overdue
                        if deadline_date <= today:
                            todo_user_id = todo.get('UserId', '')
                            
                            # Apply user filter
                            if filter_user and str(todo_user_id) != str(filter_user):
                                continue
                            
                            is_overdue = deadline_date < today
                            
                            project_todos.append({
                                'id': todo.get('Id'),
                                'title': todo.get('Comment', 'Névtelen teendő'),
                                'description': todo.get('Comment', ''),
                                'deadline': deadline_str,
                                'status': todo.get('Status', 'Open'),
                                'project_id': project_id,
                                'project_name': project_name,
                                'project_status_id': project.get('StatusId'),
                                'assigned_to': todo_user_id,
                                'is_overdue': is_overdue,
                                'category': 'ACS' if category_id == '23' else 'PCS' if category_id == '41' else 'Unknown'
                            })
                    
                    return project_todos
            except:
                pass
            
            return []
        
        # Parallel fetch with thread pool (faster!)
        print("📥 Fetching todos in parallel...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            results = executor.map(fetch_todos_for_project, all_projects)
            
            for project_todos in results:
                all_todos.extend(project_todos)
        
        # Sort: overdue first, then by deadline
        all_todos.sort(key=lambda x: (not x['is_overdue'], x['deadline']))
        
        overdue_count = sum(1 for t in all_todos if t['is_overdue'])
        print(f"✅ RESULTS:")
        print(f"   - Projects checked: {len(all_projects)}")
        print(f"   - Total todos: {len(all_todos)}")
        print(f"   - Overdue: {overdue_count}")
        print(f"   - Today: {len(all_todos) - overdue_count}")
        
        return jsonify({
            'success': True,
            'date': today_str,
            'todos': all_todos,
            'total': len(all_todos),
            'overdue': overdue_count,
            'projects_checked': len(all_projects),
            'note': f'Checked {len(all_projects)} most active projects' if len(all_projects) >= MAX_PROJECTS_PER_STATUS * len(ACTIVE_STATUS_IDS) else None
        })
    
    except Exception as e:
        print(f"❌ Error getting daily todos: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/minicrm/update_todo_text', methods=['POST'])
@requires_auth
def minicrm_update_todo_text():
    """Update comment/text of a todo in MiniCRM"""
    if not MINICRM_ENABLED:
        return jsonify({'error': 'MiniCRM integration not configured'}), 400
    
    try:
        data = request.json
        todo_id = data.get('todo_id')
        new_text = data.get('text')
        
        if not todo_id or new_text is None:
            return jsonify({'error': 'Todo ID and text required'}), 400
        
        # MiniCRM API call to update todo
        auth = (MINICRM_SYSTEM_ID, MINICRM_API_KEY)
        url = f"https://r3.minicrm.hu/Api/R3/ToDo/{todo_id}"
        
        update_data = {'Comment': new_text}
        
        print(f"Updating todo {todo_id} text...")
        
        response = requests.put(url, auth=auth, json=update_data, timeout=10)
        
        if response.status_code == 200:
            return jsonify({
                'success': True,
                'message': 'Teendő szövege sikeresen frissítve!'
            })
        else:
            return jsonify({
                'success': False,
                'error': f'MiniCRM API error: {response.status_code}'
            }), response.status_code
    
    except Exception as e:
        print(f"Error updating todo text: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/minicrm/discover_status_ids', methods=['GET'])
@requires_auth
def minicrm_discover_status_ids():
    """Discover actual status IDs for your CRM - HELPER ENDPOINT"""
    if not MINICRM_ENABLED:
        return jsonify({'error': 'MiniCRM integration not configured'}), 400
    
    try:
        auth = (MINICRM_SYSTEM_ID, MINICRM_API_KEY)
        
        # Check both ACS and PCS
        results = {}
        
        for category_id in ['23', '41']:  # ACS and PCS
            url = f"https://r3.minicrm.hu/Api/R3/Schema/Project/{category_id}"
            response = requests.get(url, auth=auth, timeout=10)
            
            category_name = 'ACS' if category_id == '23' else 'PCS'
            
            print(f"\n🔍 Fetching schema for {category_name} (Category {category_id})")
            print(f"URL: {url}")
            print(f"Response status: {response.status_code}")
            
            if response.status_code == 200:
                schema_data = response.json()
                
                # DEBUG: Print full schema structure
                print(f"📦 Full schema keys: {list(schema_data.keys())}")
                
                status_field = schema_data.get('StatusId', {})
                print(f"📦 StatusId field type: {type(status_field)}")
                
                # The StatusId field IS the statuses dict (keys are status IDs)
                # Each key is a status ID, and the value contains the status details
                if isinstance(status_field, dict):
                    status_ids = list(status_field.keys())
                    print(f"📦 Status IDs found: {len(status_ids)}")
                    print(f"📦 Status IDs: {status_ids}")
                    
                    # Sample one to see structure
                    if status_ids:
                        sample_id = status_ids[0]
                        sample_data = status_field[sample_id]
                        print(f"📦 Sample status {sample_id} structure: {sample_data}")
                
                results[category_name] = []
                
                # StatusId field keys ARE the status IDs
                for status_id, status_info in status_field.items():
                    # status_info might be a dict with Name, or might be structured differently
                    if isinstance(status_info, dict):
                        status_name = status_info.get('Name', status_info.get('name', status_id))
                        color = status_info.get('Color', status_info.get('color', ''))
                    else:
                        status_name = str(status_info)
                        color = ''
                    
                    is_active = status_name.lower() not in ['vesztett', 'nyert', 'lezárt', 'törölve', 'closed', 'won', 'lost']
                    
                    results[category_name].append({
                        'id': int(status_id),
                        'name': status_name,
                        'color': color,
                        'is_active': is_active
                    })
                
                print(f"\n{'='*60}")
                print(f"{category_name} (Category {category_id}) Status IDs:")
                print(f"{'='*60}")
                
                active_ids = []
                for status in results[category_name]:
                    symbol = '✅' if status['is_active'] else '❌'
                    print(f"{symbol} {status['id']}: {status['name']}")
                    if status['is_active']:
                        active_ids.append(status['id'])
                
                print(f"\n🎯 Recommended ACTIVE_STATUS_IDS for {category_name}: {active_ids}")
                print(f"{'='*60}\n")
            else:
                print(f"❌ Failed to fetch schema: HTTP {response.status_code}")
                print(f"Response: {response.text[:500]}")
        
        # FALLBACK: If schema doesn't work, sample actual projects to find status IDs
        if not any(results.values()):
            print("\n⚠️  Schema API didn't return statuses. Trying fallback: sampling projects...")
            
            for category_id in ['23', '41']:
                category_name = 'ACS' if category_id == '23' else 'PCS'
                
                # Fetch first 100 projects for this category
                projects_url = "https://r3.minicrm.hu/Api/R3/Project"
                projects_response = requests.get(projects_url, auth=auth, params={'CategoryId': category_id}, timeout=10)
                
                if projects_response.status_code == 200:
                    projects_data = projects_response.json()
                    projects = projects_data.get('Results', {})
                    
                    if isinstance(projects, dict):
                        projects = list(projects.values())
                    
                    print(f"\n{category_name}: Sampled {len(projects)} projects")
                    
                    # Collect unique status IDs
                    status_ids_found = {}
                    for project in projects[:100]:  # Sample first 100
                        status_id = project.get('StatusId')
                        status_name = project.get('Status', 'Unknown')
                        
                        if status_id:
                            if status_id not in status_ids_found:
                                status_ids_found[status_id] = status_name
                    
                    print(f"Found {len(status_ids_found)} unique status IDs:")
                    for sid, sname in sorted(status_ids_found.items()):
                        print(f"  - {sid}: {sname}")
                    
                    results[category_name] = [
                        {'id': sid, 'name': sname, 'is_active': True}  # Assume all sampled are active
                        for sid, sname in status_ids_found.items()
                    ]
        
        return jsonify({
            'success': True,
            'statuses': results,
            'instructions': 'Check Railway logs to see the status IDs. Update ACTIVE_STATUS_IDS in app.py'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/minicrm/get_project_statuses', methods=['POST'])
@requires_auth
def minicrm_get_project_statuses():
    """Get available statuses for a project's category from MiniCRM Schema"""
    if not MINICRM_ENABLED:
        return jsonify({'error': 'MiniCRM integration not configured'}), 400
    
    try:
        data = request.json or {}
        category_id = data.get('category_id', '23')  # Default to ACS
        
        auth = (MINICRM_SYSTEM_ID, MINICRM_API_KEY)
        url = f"https://r3.minicrm.hu/Api/R3/Schema/Project/{category_id}"
        
        print(f"Getting statuses for category {category_id}...")
        
        response = requests.get(url, auth=auth, timeout=10)
        
        if response.status_code == 200:
            schema_data = response.json()
            status_field = schema_data.get('StatusId', {})
            statuses = status_field.get('Values', {})
            
            # Convert to list format with all details
            status_list = [
                {
                    'id': int(status_id), 
                    'name': status_info.get('Name', status_id),
                    'color': status_info.get('Color', ''),
                    'is_active': status_info.get('Name', '').lower() not in ['vesztett', 'nyert', 'lezárt', 'törölve']
                }
                for status_id, status_info in statuses.items()
            ]
            
            # Sort by ID
            status_list.sort(key=lambda x: x['id'])
            
            # Log for easy configuration
            print(f"Found {len(status_list)} statuses:")
            print("Active statuses (recommended for ACTIVE_STATUS_IDS):")
            active_ids = [s['id'] for s in status_list if s['is_active']]
            print(f"  ACTIVE_STATUS_IDS = {active_ids}")
            
            return jsonify({
                'success': True,
                'statuses': status_list,
                'recommended_active_ids': active_ids
            })
        else:
            return jsonify({'error': f'Failed to get statuses: {response.status_code}'}), response.status_code
    
    except Exception as e:
        print(f"Error getting statuses: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/minicrm/update_project_status', methods=['POST'])
@requires_auth
def minicrm_update_project_status():
    """Update project status in MiniCRM"""
    if not MINICRM_ENABLED:
        return jsonify({'error': 'MiniCRM integration not configured'}), 400
    
    try:
        data = request.json
        project_id = data.get('project_id')
        status_id = data.get('status_id')
        
        if not project_id or not status_id:
            return jsonify({'error': 'Project ID and status ID required'}), 400
        
        auth = (MINICRM_SYSTEM_ID, MINICRM_API_KEY)
        url = f"https://r3.minicrm.hu/Api/R3/Project/{project_id}"
        
        update_data = {'StatusId': status_id}
        
        print(f"Updating project {project_id} status to {status_id}...")
        
        response = requests.put(url, auth=auth, json=update_data, timeout=10)
        
        if response.status_code == 200:
            return jsonify({
                'success': True,
                'message': 'Projekt státusz sikeresen frissítve!'
            })
        else:
            return jsonify({
                'success': False,
                'error': f'MiniCRM API error: {response.status_code}'
            }), response.status_code
    
    except Exception as e:
        print(f"Error updating project status: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/minicrm/update_todo_deadline', methods=['POST'])
@requires_auth
def minicrm_update_todo_deadline():
    """Update deadline of a todo in MiniCRM"""
    if not MINICRM_ENABLED:
        return jsonify({'error': 'MiniCRM integration not configured'}), 400
    
    try:
        data = request.json
        todo_id = data.get('todo_id')
        new_deadline = data.get('deadline')
        
        if not todo_id or not new_deadline:
            return jsonify({'error': 'Todo ID and deadline required'}), 400
        
        # MiniCRM API call to update todo
        # Correct endpoint: /Api/R3/ToDo/{todo_id} (capital D!)
        auth = (MINICRM_SYSTEM_ID, MINICRM_API_KEY)
        url = f"https://r3.minicrm.hu/Api/R3/ToDo/{todo_id}"
        
        # Update payload
        update_data = {
            'Deadline': new_deadline
        }
        
        response = requests.put(url, auth=auth, json=update_data, timeout=10)
        
        if response.status_code == 200:
            return jsonify({
                'success': True,
                'message': 'Határidő sikeresen frissítve!',
                'todo_id': todo_id,
                'new_deadline': new_deadline
            })
        else:
            return jsonify({'error': f'MiniCRM API error: {response.status_code}'}), response.status_code
    
    except requests.exceptions.Timeout:
        return jsonify({'error': 'MiniCRM API timeout'}), 408
    except Exception as e:
        print(f"Error updating todo deadline: {str(e)}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    
    print("\n" + "="*60)
    print("🚀 PRV AI Marketing Assistant")
    print("="*60)
    
    if IS_PRODUCTION:
        print("\n✨ Starting production server...")
        print(f"🌐 Port: {port}")
        if BASIC_AUTH_USERNAME:
            print("🔒 Authentication: ENABLED")
        else:
            print("⚠️  Authentication: DISABLED (Consider enabling for production)")
    else:
        print("\n✨ Starting development server...")
        print("🌐 Opening http://localhost:5000 in your browser...")
        # Open browser in background (local only)
        threading.Thread(target=open_browser, daemon=True).start()
    
    print("\n💡 Press Ctrl+C to stop the server\n")
    
    # Use debug mode only in development
    app.run(
        debug=not IS_PRODUCTION,
        host='0.0.0.0' if IS_PRODUCTION else '127.0.0.1',
        port=port,
        threaded=True
    )
