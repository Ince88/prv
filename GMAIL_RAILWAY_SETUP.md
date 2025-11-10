# 📧 Gmail API Setup for Railway Production

Gmail API authentication requires special setup for Railway deployment.

---

## 🎯 The Problem

Gmail API OAuth flow opens a **local browser** (port 8080), which doesn't work on Railway servers.

**Solution:** Pre-authorize locally, then upload the token to Railway.

---

## 🔧 Step-by-Step Setup

### Step 1: Generate Token Locally

1. **Make sure you have `gmail_credentials.json` in your project folder**

2. **Run the app locally:**
   ```bash
   cd "/Users/ince/Downloads/ai assistant"
   python3 app.py
   ```

3. **Open the web UI:** `http://localhost:5000`

4. **Paste an email address and click "Load Email History"**

5. **A browser opens for Gmail authorization:**
   - Choose your Gmail account
   - Click "Allow" 
   - You'll see: "The authentication flow has completed"

6. **Check that `gmail_token.json` was created:**
   ```bash
   ls -la gmail_token.json
   ```

### Step 2: Encode Token to Base64

```bash
# macOS/Linux
base64 -i gmail_token.json | tr -d '\n'

# Save the output - it starts with: eyJ0b2tlbiI6...
```

Or with Python:
```python
import base64

with open('gmail_token.json', 'r') as f:
    encoded = base64.b64encode(f.read().encode()).decode()
    print(encoded)
```

### Step 3: Add to Railway Environment Variables

1. **Go to your Railway project dashboard**

2. **Click on your service → Variables tab**

3. **Add these variables:**

```bash
# Gmail Credentials (already added in Settings UI)
GMAIL_CREDENTIALS_BASE64=<your-credentials-base64>

# Gmail Token (NEW - add this!)
GMAIL_TOKEN_BASE64=<your-token-base64-from-step-2>
```

4. **Click "Add" → Railway will redeploy automatically**

### Step 4: Test on Railway

1. **Wait for deployment to complete** (~2-3 minutes)

2. **Open your Railway app URL**

3. **Try loading email history** - it should work now! ✅

---

## 🔄 Token Expiration

Gmail tokens expire after ~7 days. When it expires:

### Option A: Refresh Locally (Recommended)

```bash
# Delete old token
rm gmail_token.json

# Run app locally
python3 app.py

# Load emails once (re-authorize)

# Re-encode and update Railway
base64 -i gmail_token.json | tr -d '\n'
# → Update GMAIL_TOKEN_BASE64 in Railway
```

### Option B: Automatic Refresh (Advanced)

The token can auto-refresh if it has a valid `refresh_token`. The current code supports this, but initial authorization must happen locally.

---

## 🎯 Alternative: Service Account (Advanced)

For a fully automated solution without token expiration:

### Requirements:
- Google Workspace (not regular Gmail)
- Domain-wide delegation setup
- Service account with Gmail API scope

### Steps:
1. Create service account in Google Cloud Console
2. Enable domain-wide delegation
3. Grant Gmail API scopes in Workspace Admin
4. Use service account credentials instead of OAuth

This is more complex but never requires re-authorization.

---

## 📝 Summary

**For Railway Gmail API to work:**

1. ✅ Run app locally once
2. ✅ Authorize Gmail (creates `gmail_token.json`)
3. ✅ Encode token to base64
4. ✅ Add `GMAIL_TOKEN_BASE64` to Railway
5. ✅ Redeploy
6. 🔄 Refresh token every ~7 days

---

## 🆘 Troubleshooting

### "Address already in use" error

**Local development:** Another process is using port 8080 (OAuth callback)

```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Try again
python3 app.py
```

### "Invalid credentials" on Railway

- Check `GMAIL_CREDENTIALS_BASE64` is set correctly
- Verify base64 encoding has no newlines (`tr -d '\n'`)
- Ensure Gmail API is enabled in Google Cloud Console

### "Token expired" on Railway

- Generate new token locally (delete old `gmail_token.json`)
- Re-encode and update `GMAIL_TOKEN_BASE64` in Railway

### "Refresh token missing"

- Delete `gmail_token.json` locally
- Run authorization flow again
- Make sure you click "Allow" (not "Deny")

---

## ✅ Quick Checklist

Before deploying to Railway:

- [ ] Gmail API enabled in Google Cloud Console
- [ ] `gmail_credentials.json` downloaded and working locally
- [ ] Ran app locally and authorized Gmail once
- [ ] `gmail_token.json` created successfully
- [ ] Both credentials and token encoded to base64
- [ ] Both `GMAIL_CREDENTIALS_BASE64` and `GMAIL_TOKEN_BASE64` added to Railway
- [ ] Tested email loading on Railway

---

**Your Gmail API is now production-ready!** 🎉

