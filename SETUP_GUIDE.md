# 📚 Detailed Setup Guide

This guide will walk you through setting up the PRV AI Marketing Assistant step by step.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Initial Setup](#initial-setup)
3. [OpenAI API Setup](#openai-api-setup)
4. [Gmail API Setup](#gmail-api-setup)
5. [First Run](#first-run)
6. [Troubleshooting](#troubleshooting)

---

## System Requirements

- **Python 3.8+** installed on your system
- **Internet connection** for API calls
- **Modern web browser** (Chrome, Firefox, Safari, or Edge)
- **macOS, Windows, or Linux**

---

## Initial Setup

### 1. Install Python Dependencies

Open your terminal and navigate to the application directory:

```bash
cd "/Users/ince/Downloads/ai assistant"
```

Install required Python packages:

```bash
pip3 install flask flask-cors openai google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

**Expected output:**
```
Successfully installed flask-X.X.X flask-cors-X.X.X openai-X.X.X ...
```

If you get a "permission denied" error, try:
```bash
pip3 install --user flask flask-cors openai google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

---

## OpenAI API Setup

**Purpose:** Enables AI chat functionality

### Step 1: Create OpenAI Account

1. Go to [https://platform.openai.com/](https://platform.openai.com/)
2. Click **Sign up** or **Log in**
3. Complete the registration process

### Step 2: Add Billing Information

⚠️ **Important:** OpenAI API requires payment information

1. Go to [https://platform.openai.com/account/billing](https://platform.openai.com/account/billing)
2. Click **Add payment method**
3. Enter your credit card information
4. Add initial credits (minimum $5 recommended)

### Step 3: Create API Key

1. Navigate to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **+ Create new secret key**
3. Give it a name (e.g., "PRV AI Assistant")
4. Click **Create secret key**
5. **IMPORTANT:** Copy the key immediately - it starts with `sk-proj-...`
6. Store it securely - you won't be able to see it again!

### Step 4: Configure in Application

1. Start the application (see [First Run](#first-run))
2. Click **⚙️ Settings** in the sidebar
3. Paste your API key in the "OpenAI API Key" field
4. Click **💾 Save Configuration**
5. Reload the application when prompted

**Your OpenAI API is now configured!** ✅

---

## Gmail API Setup

**Purpose:** Enables email history loading for contextualized responses

### Step 1: Create Google Cloud Project

1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click **Select a project** dropdown (top bar)
4. Click **New Project**
5. Enter project name: "PRV AI Assistant"
6. Click **Create**
7. Wait for the project to be created (5-10 seconds)

### Step 2: Enable Gmail API

1. Ensure your new project is selected (check top bar)
2. Click the hamburger menu (☰) → **APIs & Services** → **Library**
3. Search for "Gmail API"
4. Click on **Gmail API**
5. Click **Enable**
6. Wait for it to enable (5-10 seconds)

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Click **Create**

**Fill in the consent screen:**

- **App name:** PRV AI Assistant
- **User support email:** [Your email]
- **Developer contact information:** [Your email]

Click **Save and Continue** through the remaining screens (you can skip optional fields)

### Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Click **Configure consent screen** if prompted, then return to this step
4. Choose **Application type:** Desktop app
5. **Name:** PRV AI Assistant
6. Click **Create**
7. A popup appears with your credentials

### Step 5: Download Credentials

1. In the popup, click **Download JSON**
   - Or find your OAuth client in the list and click the download icon (⬇️)
2. The file will be named something like `client_secret_XXXXX.json`
3. **Option A - Manual:**
   - Open the downloaded JSON file in a text editor
   - Copy the entire contents
   - In the application, click **⚙️ Settings**
   - Paste the JSON in the "Gmail API Credentials" field
   - Click **💾 Save Configuration**
4. **Option B - File:**
   - Rename the file to `gmail_credentials.json`
   - Move it to the application directory (same folder as `app.py`)

### Step 6: First Gmail Authorization

1. Click **Load Email History** in the app
2. A browser window opens with Google sign-in
3. Choose your Google account
4. You'll see a warning: "Google hasn't verified this app"
   - Click **Advanced**
   - Click **Go to PRV AI Assistant (unsafe)**
5. Review permissions: "See, edit, create, and delete all of your Gmail email"
6. Click **Continue**
7. The browser shows "The authentication flow has completed"
8. Return to the application

**Your Gmail API is now configured!** ✅

---

## First Run

### Start the Application

```bash
cd "/Users/ince/Downloads/ai assistant"
python3 app.py
```

**Expected output:**
```
============================================================
🚀 PRV AI Marketing Assistant
============================================================

✨ Starting web server...
🌐 Opening http://localhost:5000 in your browser...

💡 Press Ctrl+C to stop the server

⚠️  Warning: No OpenAI API key found. Chat functionality will be disabled.
 * Serving Flask app 'app'
 * Debug mode: off
 * Running on http://127.0.0.1:5000
```

### Access the Application

- The browser opens automatically at `http://localhost:5000`
- If not, manually open: `http://localhost:5000`

### Initial Configuration

1. You'll see a warning message: "⚠️ Configuration needed..."
2. Click the **⚙️ Settings** button (it will be red/orange)
3. Follow the configuration steps above for:
   - OpenAI API (if you want chat functionality)
   - Gmail API (if you want email history feature)
4. Click **💾 Save Configuration**
5. Reload the application when prompted

---

## Feature Walkthroughs

### Using AI Chat

1. Ensure OpenAI API is configured (see Settings)
2. Select an assistant: "Marketing Expert" or "General Assistant"
3. Type your message: "Help me write a follow-up email"
4. Press **Send** or `Ctrl+Enter`
5. Wait for the AI response (5-15 seconds)

### Using Email Context

1. Ensure Gmail API is configured
2. Paste an email address in the "📧 Email Context" section
3. Click **Load Email History**
4. Authorize Gmail if prompted (first time only)
5. Wait for emails to load (3-10 seconds)
6. Quick prompt buttons appear!
7. Click a button or type your own prompt
8. Press **Send**
9. ChatGPT opens with your prompt copied to clipboard
10. Paste (`Cmd+V` or `Ctrl+V`) into ChatGPT

### Using Company Research

1. Click **🔍 Cég Keresés**
2. Enter company name: "Tesla"
3. Click **🔍 Perplexity** for deep research
4. Perplexity opens with pre-filled prompt
5. Review results
6. Click **📋 Paste** to copy results back to app

---

## Troubleshooting

### Problem: "Address already in use"

**Cause:** Port 5000 is being used by another application

**Solution:**
```bash
# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force

# Then restart
python3 app.py
```

### Problem: "No module named 'flask'"

**Cause:** Dependencies not installed

**Solution:**
```bash
pip3 install flask flask-cors openai google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

### Problem: Gmail authorization fails

**Cause:** Token expired or corrupted

**Solution:**
```bash
# Delete the token file
rm gmail_token.json

# Try loading emails again - you'll be prompted to re-authorize
```

### Problem: "OpenAI API is not configured"

**Cause:** API key not saved or invalid

**Solution:**
1. Click **⚙️ Settings**
2. Re-enter your OpenAI API key
3. Verify it starts with `sk-proj-`
4. Click **💾 Save Configuration**
5. Reload the application

### Problem: UI doesn't update after configuration

**Cause:** Browser cache

**Solution:**
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Or try incognito/private mode
3. Or clear browser cache

### Problem: "Invalid credentials" for Gmail

**Cause:** Credentials JSON is incorrect

**Solution:**
1. Go back to Google Cloud Console
2. Download credentials again
3. Ensure you copied the **entire** JSON (including `{` and `}`)
4. Paste again in Settings

---

## Security Best Practices

### Protecting Your API Keys

1. **Never share** `config.json` or `gmail_credentials.json`
2. **Never commit** these files to git (`.gitignore` is configured)
3. **Never screenshot** or email these files
4. **Regenerate keys** if you suspect they're compromised

### Monitoring Costs

1. Check OpenAI usage: [https://platform.openai.com/usage](https://platform.openai.com/usage)
2. Set spending limits: [https://platform.openai.com/account/billing/limits](https://platform.openai.com/account/billing/limits)
3. Typical costs:
   - Chat message: $0.001 - $0.01 per message
   - Email context prompt: $0.01 - $0.05 per generation

### Gmail Permissions

- The app only requests **read-only** Gmail access
- It **cannot send** or **delete** emails
- You can revoke access anytime: [https://myaccount.google.com/permissions](https://myaccount.google.com/permissions)

---

## Next Steps

Now that you're set up:

1. **Explore the Chat** - Try different prompts with the Marketing Expert
2. **Load Email History** - Test the email context feature with a real client
3. **Research Companies** - Use the company research tool for your next cold call
4. **Customize Prompts** - Edit `app.js` to add your own quick prompts

---

## Getting Help

If you're still stuck:

1. Check the terminal output for error messages
2. Review the [main README.md](README.md)
3. Verify all steps in this guide were completed
4. Check your internet connection
5. Ensure your API keys are valid and have credits

---

**Happy Marketing! 🚀**

