# 🚂 Railway Deployment Guide

Complete guide to deploying PRV AI Marketing Assistant to Railway for internal company use.

---

## 📋 Prerequisites

1. **Railway account** - Sign up at [railway.app](https://railway.app)
2. **GitHub account** (recommended) or Railway CLI
3. **OpenAI API key** ready
4. **Gmail credentials JSON** ready (optional)

---

## 🚀 Quick Start (GitHub Method - Recommended)

### Step 1: Prepare Your Repository

1. **Create a GitHub repository:**
   ```bash
   cd "/Users/ince/Downloads/ai assistant"
   git init
   git add .
   git commit -m "Initial commit - PRV AI Assistant"
   ```

2. **Create a new repository on GitHub** (e.g., `prv-ai-assistant`)

3. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/prv-ai-assistant.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Railway

1. **Go to [railway.app](https://railway.app) and sign in**

2. **Click "New Project"**

3. **Select "Deploy from GitHub repo"**

4. **Connect your GitHub account** (if not already connected)

5. **Select your repository** (`prv-ai-assistant`)

6. **Railway will automatically detect the app and start deployment**

### Step 3: Configure Environment Variables

1. **In Railway dashboard, go to your project**

2. **Click on your service → Variables tab**

3. **Add these environment variables:**

```bash
# Required
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY_HERE
FLASK_ENV=production
FLASK_SECRET_KEY=generate_a_random_64_character_string_here

# Optional: Basic Authentication (Recommended for internal use)
BASIC_AUTH_USERNAME=prv_team
BASIC_AUTH_PASSWORD=choose_a_strong_password_here

# Optional: Gmail API (if using email features)
GMAIL_CREDENTIALS_BASE64=paste_base64_encoded_json_here
```

#### How to generate FLASK_SECRET_KEY:
```python
import secrets
print(secrets.token_hex(32))
```

#### How to encode Gmail credentials to base64:
```bash
# macOS/Linux
base64 -i gmail_credentials.json | tr -d '\n'

# Or in Python
import base64
import json
with open('gmail_credentials.json', 'r') as f:
    encoded = base64.b64encode(f.read().encode()).decode()
    print(encoded)
```

4. **Click "Add" for each variable**

5. **Railway will automatically redeploy**

### Step 4: Get Your App URL

1. **Go to Settings tab**
2. **Click "Generate Domain"**
3. **You'll get a URL like:** `prv-ai-assistant-production.up.railway.app`

### Step 5: Test Your Deployment

1. **Visit your Railway URL**
2. **If you enabled Basic Auth, you'll see a login prompt:**
   - Username: `prv_team` (or whatever you set)
   - Password: (your chosen password)
3. **The app should load!**

---

## 🔧 Alternative: Railway CLI Deployment

If you prefer command-line:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project (or create new)
railway link

# Deploy
railway up
```

---

## 🔐 Security Configuration

### Basic Authentication (Recommended)

For internal company use, enable Basic Auth:

```bash
BASIC_AUTH_USERNAME=prv_team
BASIC_AUTH_PASSWORD=YourStrongPassword123!
```

**Everyone accessing the app will need these credentials.**

### Email Domain Restriction (Optional)

Restrict email loading to specific domains:

```bash
ALLOWED_EMAIL_DOMAINS=prv.hu,yourcompany.com
```

---

## 📧 Gmail API in Production

### Challenge: OAuth Flow

Gmail API uses OAuth which requires user interaction. In production:

**Option 1: Pre-authorized Token (Recommended for Internal)**

1. **Run locally first:**
   ```bash
   python3 app.py
   ```

2. **Load emails once** - this creates `gmail_token.json`

3. **Upload token to Railway:**
   - In Railway Variables, add:
   ```bash
   GMAIL_TOKEN_BASE64=<base64_encoded_gmail_token.json>
   ```

4. **Update `app.py` to load token from env** (already configured!)

**Option 2: Service Account (Advanced)**

For fully automated access, use a Google Workspace service account with domain-wide delegation. (More complex setup)

**Option 3: Shared Account**

Have one team member authenticate, then share the session. Token expires after ~7 days.

---

## 🎯 Multi-User Considerations

### Current Setup

- ✅ Multiple people can access simultaneously
- ✅ Basic Auth protects access
- ⚠️ Conversations are stored in memory (resets on redeploy)
- ⚠️ Gmail token is shared (everyone uses same account)

### Improvements for Better Multi-User (Optional)

**1. User-Specific Sessions:**

Add login system to track individual users. Each user can load their own emails.

**2. Database for Conversations:**

Use Railway's PostgreSQL addon to persist conversations.

**3. Individual Gmail Tokens:**

Each user authenticates their own Gmail. Requires session management.

---

## 💰 Railway Pricing

**Hobby Plan (Free Trial):**
- $5 free credit per month
- Good for light internal use (5-10 users)

**Developer Plan ($5/month):**
- $5 credit included
- Pay-as-you-go after that
- ~$0.000463/GB-hour

**Estimated monthly cost for internal use:**
- Light use (5-10 users, few hours/day): **~$5-10/month**
- Moderate use (20+ users, regular use): **~$15-25/month**

---

## 🔄 Updating Your Deployment

### Method 1: GitHub Push (Automatic)

```bash
# Make changes locally
git add .
git commit -m "Updated features"
git push

# Railway automatically redeploys!
```

### Method 2: Railway CLI

```bash
railway up
```

---

## 🐛 Troubleshooting

### "Application failed to start"

**Check Railway logs:**
1. Go to your project
2. Click "Deployments" tab
3. View latest deployment logs

**Common issues:**
- Missing `requirements.txt`
- Missing `Procfile`
- Invalid environment variables

### "502 Bad Gateway"

- App is starting (wait 30-60 seconds)
- Check if `PORT` environment variable is set (Railway sets it automatically)

### "Authentication keeps prompting"

- Browser didn't save credentials
- Check username/password are correct
- Try different browser/incognito

### "Gmail API not working"

- Verify `GMAIL_CREDENTIALS_BASE64` is set correctly
- Check base64 encoding has no newlines
- Ensure Gmail API is enabled in Google Cloud Console

### "Out of memory"

- Railway hobby plan has 512MB RAM
- Consider upgrading plan if needed
- Optimize conversation storage

---

## 📊 Monitoring

### Railway Dashboard

- **Metrics tab:** CPU, Memory, Network usage
- **Deployments tab:** Deployment history and logs
- **Observability:** Real-time logs

### Usage Monitoring

- Check OpenAI usage: [platform.openai.com/usage](https://platform.openai.com/usage)
- Monitor Railway costs in your account settings

---

## 🔒 Best Practices

### Security Checklist

- ✅ Enable Basic Authentication
- ✅ Use strong passwords (12+ characters)
- ✅ Rotate FLASK_SECRET_KEY periodically
- ✅ Keep OPENAI_API_KEY secret
- ✅ Never commit sensitive files to public GitHub repos
- ✅ Use `.gitignore` (already configured)
- ✅ Restrict access to your GitHub repo

### Operational Checklist

- ✅ Monitor Railway usage/costs weekly
- ✅ Check OpenAI API usage regularly
- ✅ Keep dependencies updated (`requirements.txt`)
- ✅ Backup important data
- ✅ Document access credentials for team

---

## 👥 Sharing with Your Team

### Send to Your Team:

```
📧 PRV AI Marketing Assistant is now live!

URL: https://your-app.up.railway.app
Username: prv_team
Password: [Your chosen password]

Features:
✅ AI Chat Assistant
✅ Email Context Loading
✅ Company Research Tools
✅ Quick Email Prompts

Questions? Check the docs or ask [Your Name]
```

### Quick Start for Team Members:

1. **Visit the URL**
2. **Enter credentials when prompted**
3. **Click Settings (⚙️) if you need to configure personal API keys**
4. **Start using!**

---

## 🆘 Support

### If Something Goes Wrong:

1. **Check Railway logs** (Deployments → Latest → View Logs)
2. **Verify environment variables** are set correctly
3. **Test locally first** with same env vars
4. **Rollback to previous deployment** if needed (Railway keeps history)
5. **Contact Railway support** (excellent response time)

---

## 🎉 You're Done!

Your PRV AI Marketing Assistant is now:
- ✅ Deployed to production
- ✅ Accessible to your team
- ✅ Secured with authentication
- ✅ Ready for daily use

**Next Steps:**
- Share the URL with your team
- Monitor usage for first week
- Collect feedback for improvements
- Consider additional features (user management, database, etc.)

---

**Happy Marketing! 🚀**

*For technical issues, check Railway docs: [docs.railway.app](https://docs.railway.app)*

