"""
PRV AI Marketing Assistant - Web Version
Beautiful, modern web interface
"""

from flask import Flask, render_template, request, jsonify, session, Response
from flask_cors import CORS
from functools import wraps
from werkzeug.middleware.proxy_fix import ProxyFix
import openai
import threading
import secrets
import webbrowser
import time
from datetime import datetime
import os
import json
import base64
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Fix for HTTPS behind proxy (Railway)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configuration
IS_PRODUCTION = os.getenv('FLASK_ENV') == 'production'
app.secret_key = os.getenv('FLASK_SECRET_KEY', secrets.token_hex(16))
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0 if not IS_PRODUCTION else 3600  # Cache in production

# Session configuration for production (HTTPS)
if IS_PRODUCTION:
    app.config['SESSION_COOKIE_SECURE'] = True  # HTTPS only
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

CORS(app)

# Basic Authentication (for internal company use)
BASIC_AUTH_USERNAME = os.getenv('BASIC_AUTH_USERNAME')
BASIC_AUTH_PASSWORD = os.getenv('BASIC_AUTH_PASSWORD')
ALLOWED_EMAIL_DOMAINS = os.getenv('ALLOWED_EMAIL_DOMAINS', '').split(',') if os.getenv('ALLOWED_EMAIL_DOMAINS') else []

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
    if not BASIC_AUTH_USERNAME or not BASIC_AUTH_PASSWORD:
        return True  # No auth configured
    return username == BASIC_AUTH_USERNAME and password == BASIC_AUTH_PASSWORD


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
        if not BASIC_AUTH_USERNAME or not BASIC_AUTH_PASSWORD:
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
    return render_template('index.html', 
                         assistants=ASSISTANTS,
                         has_openai=has_openai,
                         has_gmail=has_gmail)


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
        
        SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
        
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
        
        SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
        
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
        
        # Save token for this user session
        session['gmail_token'] = {
            'token': creds.token,
            'refresh_token': creds.refresh_token,
            'token_uri': creds.token_uri,
            'client_id': creds.client_id,
            'client_secret': creds.client_secret,
            'scopes': creds.scopes
        }
        
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


def open_browser():
    """Open browser after a short delay (local development only)"""
    time.sleep(1.5)
    webbrowser.open('http://localhost:5000')


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
