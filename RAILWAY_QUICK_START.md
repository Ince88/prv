# ⚡ Railway Quick Start (5 Minutes)

The fastest way to get your PRV AI Assistant online!

---

## 🚀 3-Step Deployment

### 1️⃣ Push to GitHub

```bash
cd "/Users/ince/Downloads/ai assistant"

# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/prv-ai-assistant.git
git branch -M main
git push -u origin main
```

### 2️⃣ Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `prv-ai-assistant` repo
5. Wait 2-3 minutes for deployment ✅

### 3️⃣ Add Environment Variables

In Railway dashboard → Your service → **Variables** tab:

**Option A: Multiple Users (Recommended)**
```bash
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
FLASK_ENV=production
FLASK_SECRET_KEY=paste_random_64_char_string_here
BASIC_AUTH_USERS=VPeter:Peter2025prvAI,FNora:Nora2025prvAI,MIvan:Ivan2025prvAI,CInce:Ince2025prvAI
```

**Option B: Single User (Legacy)**
```bash
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
FLASK_ENV=production
FLASK_SECRET_KEY=paste_random_64_char_string_here
BASIC_AUTH_USERNAME=prv_team
BASIC_AUTH_PASSWORD=ChooseStrongPassword123!
```

**Generate secret key:**
```python
import secrets; print(secrets.token_hex(32))
```

**Multi-User Format:**
`username1:password1,username2:password2,username3:password3`

**Save** → Railway redeploys automatically (2-3 minutes)

---

## 🌐 Get Your URL

1. Go to **Settings** tab
2. Click **"Generate Domain"**
3. Copy your URL: `your-app.up.railway.app`

---

## ✅ Test It

1. Visit your Railway URL
2. Login with: `prv_team` / your password
3. It works! 🎉

---

## 📧 Optional: Add Gmail API

If you want email features:

```bash
# Encode your credentials
base64 -i gmail_credentials.json | tr -d '\n'

# Add to Railway Variables:
GMAIL_CREDENTIALS_BASE64=<paste_encoded_string>
```

---

## 🎯 Share with Team

Send this to your colleagues:

```
PRV AI Assistant is live! 🚀

🌐 URL: https://your-app.up.railway.app
👤 Username: prv_team
🔑 Password: [your password]

Login and start using the AI assistant!
```

---

## 💡 Tips

- **Costs:** ~$5-10/month for small team
- **Updates:** Just `git push` to redeploy
- **Monitoring:** Check Railway dashboard
- **Support:** Railway has excellent docs

---

## 🆘 Issues?

**App not starting?**
- Check Railway logs (Deployments tab)
- Verify all env vars are set

**502 Gateway Error?**
- Wait 60 seconds (app is starting)

**Can't login?**
- Check username/password spelling
- Try incognito mode

---

**Full guide:** See `DEPLOYMENT.md` for detailed instructions

**You're done!** 🎉

