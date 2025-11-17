# 📤 Bulk Email - Quick Start Guide

## 🚀 3-Step Process

### 1️⃣ Prepare Your Excel File

Create an Excel file with these 3 columns:

```
Company             | Person        | Email
--------------------|---------------|---------------------------
Tech Solutions Kft. | Kiss János    | janos.kiss@company.com
```

**Column names can be**:
- Company: "Company", "Company Name", "Cégnév"
- Person: "Person", "Name", "Név"
- Email: "Email", "E-mail"

📄 **Sample file included**: `sample_contacts.xlsx`

---

### 2️⃣ Open Bulk Email Tool

1. Find the orange **"📤 Bulk Email"** section in the sidebar
2. Click **"📋 Send Template Emails"**
3. Upload your Excel file
4. Preview will show your contacts

---

### 3️⃣ Compose & Send

**Subject**: `Hello {{person}} from {{company}}!`

**Body**:
```
Dear {{person}},

I wanted to reach out to {{company}} regarding...

Best regards,
Your Name
```

**Placeholders**:
- `{{company}}` → Company name
- `{{person}}` → Person name  
- `{{email}}` → Email address

Click **"📨 Send Emails"** and confirm!

---

## ⚠️ Before First Use

**Connect Gmail**:
1. Click **"🔗 Connect Gmail"** (green button in sidebar)
2. Sign in and grant permissions
3. You're ready to send!

---

## 📊 Gmail Limits

| Account Type | Daily Limit |
|--------------|-------------|
| Free Gmail | ~500 emails |
| Google Workspace | ~2,000 emails |

The system automatically adds delays to avoid hitting limits.

---

## ✅ Quick Test

1. Use `sample_contacts.xlsx` (included)
2. Send a test email to yourself first
3. Check it looks correct
4. Then send to your full list!

---

## 🆘 Common Issues

**"Gmail not authorized"**
→ Click "🔗 Connect Gmail" first

**"No contacts found"**
→ Check column names: Company, Person, Email

**Some emails failed**
→ Check email addresses are valid (must have @ and .)

---

## 📚 More Help

- **Full Guide**: See `BULK_EMAIL_GUIDE.md`
- **Technical Details**: See `BULK_EMAIL_FEATURE_SUMMARY.md`

---

**Happy Sending! 📧**

