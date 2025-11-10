# 🚀 PRV AI Marketing Assistant

A modern, web-based AI marketing assistant with email context and company research capabilities.

## ✨ Features

- 🤖 **AI Chat Assistant** - Powered by OpenAI's GPT models
- 📧 **Email Context Integration** - Load Gmail conversation history for contextualized responses
- 🔍 **Company Research** - Quick access to Perplexity and ChatGPT for company information
- 💡 **Quick Email Prompts** - Pre-configured prompt templates for common email scenarios
- 🎨 **Modern UI** - Beautiful, responsive web interface optimized for macOS

## 📋 Prerequisites

The application requires **API credentials** to unlock its full functionality. Both are optional - configure only what you need:

### 1. OpenAI API Key (Optional)
**Required for:** AI Chat functionality

- Create an account at [OpenAI Platform](https://platform.openai.com/)
- Navigate to [API Keys](https://platform.openai.com/api-keys)
- Click "Create new secret key"
- Copy the key (starts with `sk-proj-...`)

### 2. Gmail API Credentials (Optional)
**Required for:** Email history loading

Follow these steps to get Gmail API credentials:

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Gmail API**
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Desktop application"
   - Name it (e.g., "PRV AI Assistant")
   - Click "Create"

4. **Download Credentials**
   - Click the download button next to your OAuth client
   - Save the JSON file as `gmail_credentials.json`

## 🛠️ Installation

### Step 1: Install Dependencies

```bash
pip3 install flask flask-cors openai google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

### Step 2: Start the Application

```bash
cd "/Users/ince/Downloads/ai assistant"
python3 app.py
```

The application will:
- Start the web server on `http://localhost:5000`
- Automatically open in your default browser

### Step 3: Configure API Keys

1. Click the **⚙️ Settings** button in the sidebar
2. Enter your API credentials:
   - **OpenAI API Key**: Paste your `sk-proj-...` key
   - **Gmail API Credentials**: Paste the contents of your `gmail_credentials.json` file
3. Click **💾 Save Configuration**
4. Restart the application when prompted

## 🎯 Usage

### Chat with AI Assistant

1. Select an assistant from the dropdown (Marketing Expert or General Assistant)
2. Type your message in the input field
3. Press **Send** or `Ctrl+Enter`

**Note:** Requires OpenAI API configuration.

### Email Context Feature

1. Paste an email address in the "📧 Email Context" section
2. Click **Load Email History**
3. Authorize Gmail access (first time only)
4. Choose a quick prompt or type your own
5. The application will:
   - Open ChatGPT in a new tab
   - Copy a detailed prompt with your email history to clipboard
   - Paste it into ChatGPT for context-aware responses

**What the email prompt includes:**
- Business context and communication rules
- Full conversation history with the contact
- Your specific request/instruction
- Language detection (Hungarian/English)

**Quick Email Prompts:**
- 📧 Válaszoljunk az utolsó emailre
- 💰 Banner kedvezmény (399.000 Ft helyett)
- 🔄 Kérjünk visszajelzést
- 📞 Javasolj online meetinget
- 📄 Küldjünk mintapéldányt
- ⏰ Follow-up email

**Note:** Requires Gmail API configuration.

### Company Research (Cég Keresés)

1. Click **🔍 Cég Keresés** in the sidebar
2. Enter the company name
3. Choose your research tool:
   - **🔍 Perplexity**: Deep web research
   - **🤖 ChatGPT**: General information and analysis
   - **📞 Call Approach**: Generate a cold call strategy
4. The tool opens in a new tab with a pre-filled prompt
5. After getting results, click **📋 Paste** to view them in the app

**Note:** No API configuration required - uses external web tools.

## 📁 Configuration Files

After setup, you'll have these files:

```
ai assistant/
├── app.py                      # Flask backend
├── config.json                 # API keys (auto-generated)
├── gmail_credentials.json      # Gmail OAuth credentials
├── gmail_token.json           # Gmail auth token (auto-generated)
├── templates/
│   └── index.html             # Main UI template
└── static/
    ├── css/
    │   └── style.css          # Styling
    └── js/
        └── app.js             # Frontend logic
```

**Important:** Keep `config.json`, `gmail_credentials.json`, and `gmail_token.json` private and secure!

## 🔒 Security Notes

- ⚠️ Never commit or share your `config.json` or `gmail_credentials.json` files
- 🔐 API keys have access to your OpenAI account and Gmail
- 💰 OpenAI API usage incurs costs based on token usage
- 🛡️ The application runs locally - no data is sent to third parties except OpenAI and Google APIs

## 🐛 Troubleshooting

### "Address already in use" Error

If port 5000 is busy:

```bash
# Kill existing Flask processes
lsof -ti:5000 | xargs kill -9
# Restart the app
python3 app.py
```

### Gmail Authentication Issues

1. Delete `gmail_token.json`
2. Click "Load Email History" again
3. Complete the authorization flow in your browser

### OpenAI API Errors

- Check your API key is correct in Settings
- Verify your OpenAI account has credits
- Ensure your API key has the required permissions

### UI Not Updating

If you don't see new features:

1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Try incognito/private browsing mode
3. Clear browser cache

## 💡 Tips

- **Email Context**: Load emails before typing your prompt for better results
- **Quick Prompts**: Use the pre-configured buttons to save time
- **Company Research**: Paste results back into the app to keep everything in one place
- **API Costs**: Monitor your OpenAI usage at [platform.openai.com/usage](https://platform.openai.com/usage)

## 🆘 Support

If you encounter issues:

1. Check the terminal output for error messages
2. Verify your API credentials are correct
3. Ensure all dependencies are installed
4. Try restarting the application

## 📝 License

Private use only - PRV AI Marketing Assistant

---

**Made with ❤️ for PRV Marketing Team**

