# 📤 Bulk Email Feature Guide

## Overview

The Bulk Email feature allows you to send personalized template emails to multiple contacts at once by uploading an Excel or CSV file. This is perfect for:

- Marketing campaigns
- Event invitations  
- Product announcements
- Follow-up emails
- Newsletter distribution

## Prerequisites

Before using the Bulk Email feature, you must:

1. **Connect Gmail Account**: Click "🔗 Connect Gmail" in the Email Context section
2. **Grant Permissions**: Allow the app to send emails on your behalf

## Quick Start

### Step 1: Prepare Your Contact List

Create an Excel (.xlsx, .xls) or CSV file with **three required columns**:

| Column Name Options | Description | Example |
|---------------------|-------------|---------|
| Company, Company Name, Cégnév | Company name | Tech Solutions Kft. |
| Person, Person Name, Name, Név | Contact person's name | Kiss János |
| Email, E-mail, Email Address | Email address | janos.kiss@company.com |

**Note**: Column names are flexible - the system recognizes various formats including Hungarian names.

#### Sample Excel File Structure:

```
Company             | Person        | Email
--------------------|---------------|---------------------------
Tech Solutions Kft. | Kiss János    | janos.kiss@techsolutions.hu
Innovate Corp.      | Nagy Péter    | peter.nagy@innovatecorp.com
Design Studio Ltd.  | Kovács Anna   | anna.kovacs@designstudio.hu
```

A sample file (`sample_contacts.xlsx`) is included in the project directory for reference.

### Step 2: Access Bulk Email Feature

1. Look for the **"📤 Bulk Email"** section in the sidebar (orange section)
2. Click the **"📋 Send Template Emails"** button
3. A modal window will open with three steps

### Step 3: Upload Contact List

1. Click **"📁 Choose Excel/CSV File"**
2. Select your prepared file
3. The system will:
   - Parse the file
   - Validate email addresses
   - Show a preview of the first 10 contacts
   - Display the total number of valid contacts found

### Step 4: Compose Email Template

After successful file upload, you can compose your email:

#### Your Name (Display Name)
Enter how your name should appear to recipients:
```
Czechner Ince
```
This will show as "Czechner Ince <ince@prv.hu>" instead of just "ince"

#### Subject Line
Use placeholders to personalize:
```
Hello {{person}} from {{company}}!
```

#### Email Body
Compose your message with placeholders:
```
Dear {{person}},

I hope this email finds you well. I wanted to reach out to you from {{company}} regarding...

Best regards
```

#### Email Signature (Optional)
Add your signature that will be automatically appended to every email:
```
--
Czechner Ince
PRV Sales Manager
Email: ince@prv.hu
Phone: +36 XX XXX XXXX
Website: www.prv.hu
```

#### Available Placeholders:
- `{{company}}` - Will be replaced with the company name
- `{{person}}` - Will be replaced with the person's name
- `{{email}}` - Will be replaced with the email address

**Note**: Placeholders work in the subject, body, AND signature!

### Step 5: Send Emails

1. Review your template
2. Click **"📨 Send Emails to All Contacts"**
3. Confirm the action (this cannot be undone!)
4. Wait for the sending process to complete
5. View the results:
   - ✅ Successfully sent emails
   - ❌ Failed emails (with error messages)

## Best Practices

### 📝 Email Composition

1. **Personalization**: Always use `{{person}}` and `{{company}}` placeholders
2. **Professional Tone**: Keep emails friendly but professional
3. **Clear Subject**: Make the subject line informative and engaging
4. **Call-to-Action**: Include a clear next step
5. **Contact Info**: Always include your contact information

### 📊 Contact List

1. **Clean Data**: Remove duplicates before uploading
2. **Valid Emails**: Ensure all email addresses are valid
3. **Test First**: Send to a small group first to test
4. **Segmentation**: Consider creating separate lists for different audiences

### ⚠️ Important Limitations

1. **Gmail Sending Limits**: 
   - Free Gmail: ~500 emails/day
   - Google Workspace: ~2,000 emails/day
2. **Delay Between Emails**: The system adds a 0.5-second delay to avoid rate limiting
3. **No Attachments**: Current version doesn't support attachments

## Troubleshooting

### "Gmail not authorized" Error

**Solution**: 
1. Click "🔗 Connect Gmail" in the Email Context section
2. Complete the OAuth authorization flow
3. Try sending again

### "No valid contacts found" Error

**Possible Causes**:
- Missing required columns
- Invalid column names
- Empty rows
- No valid email addresses

**Solution**:
- Ensure your file has columns named: Company, Person, and Email (or variations)
- Remove empty rows
- Check email format (must contain @ and .)

### "Failed to parse file" Error

**Possible Causes**:
- Corrupted file
- Incorrect file format
- File too large

**Solution**:
- Re-save the file in Excel or CSV format
- Keep file size under 16MB
- Ensure file has proper structure

### Some Emails Failed to Send

**Common Reasons**:
- Invalid email address
- Recipient's email server rejected the message
- Network issues
- Gmail rate limiting

**Solution**:
- Check the failed emails list in the results
- Verify the email addresses
- Try sending failed emails again later

## Examples

### Marketing Campaign

**Your Name**: `Czechner Ince`

**Subject**: `{{person}}, Special Offer for {{company}}!`

**Body**:
```
Dear {{person}},

We have an exclusive offer for {{company}}!

For a limited time, we're offering 20% off on all our services specifically for your company.

This offer is valid until [date].

To claim your discount, simply reply to this email or visit our website.

Looking forward to working with you!
```

**Signature**:
```
--
Czechner Ince
PRV Sales Manager
Email: ince@prv.hu
Phone: +36 XX XXX XXXX
Website: www.prv.hu
```

**Final Email Result**:
```
Dear Kiss János,

We have an exclusive offer for Tech Solutions Kft.!

For a limited time, we're offering 20% off on all our services specifically for your company.

This offer is valid until [date].

To claim your discount, simply reply to this email or visit our website.

Looking forward to working with you!

--
Czechner Ince
PRV Sales Manager
Email: ince@prv.hu
Phone: +36 XX XXX XXXX
Website: www.prv.hu
```

### Event Invitation

**Your Name**: `Czechner Ince`

**Subject**: `Invitation for {{person}} - {{company}} Industry Event`

**Body**:
```
Dear {{person}},

We would be delighted to invite you and {{company}} to our upcoming industry event.

Date: [Event Date]
Time: [Event Time]
Location: [Event Location]

This exclusive event brings together industry leaders to discuss...

Please RSVP by [date] at [link/email].

Looking forward to seeing you there!
```

**Signature**:
```
--
Czechner Ince
PRV Sales Manager
PRV Corporate Communications
Email: ince@prv.hu
Phone: +36 XX XXX XXXX
```

## Security & Privacy

- **OAuth 2.0**: Gmail connection uses secure OAuth 2.0 authentication
- **No Storage**: Contact lists are stored temporarily in session only
- **Automatic Cleanup**: Uploaded files are deleted immediately after parsing
- **Secure**: All communication is encrypted

## Technical Details

- **Supported Formats**: .xlsx, .xls, .csv
- **Max File Size**: 16 MB
- **Max Contacts**: No hard limit (but subject to Gmail sending limits)
- **Backend**: Python with pandas for parsing
- **Email Service**: Gmail API with OAuth 2.0

## FAQ

**Q: Can I send HTML emails?**  
A: Currently, only plain text emails are supported.

**Q: Can I add attachments?**  
A: Not in the current version. This may be added in a future update.

**Q: What happens if my internet connection drops during sending?**  
A: Already sent emails will have been delivered. You'll see which emails failed and can retry those.

**Q: Can I cancel sending after I click send?**  
A: No, once sending starts it continues until complete. Make sure to review carefully before clicking send.

**Q: Are the emails sent immediately?**  
A: Yes, but with a small delay (0.5s) between each email to avoid rate limiting.

**Q: Can I see a preview of personalized emails before sending?**  
A: The current version shows a preview of contacts but not the fully personalized emails. Double-check your template and placeholders before sending.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the Gmail API settings
3. Check the browser console for detailed error messages
4. Contact your system administrator

---

**Version**: 1.0  
**Last Updated**: November 2025

