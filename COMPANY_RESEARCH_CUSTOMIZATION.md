# 🔍 Cég Intelligencia (Company Research) - Prompt Customization Guide

## Overview

The **Company Intelligence** feature allows you to research Hungarian companies using Perplexity AI with a fully customizable prompt template. This guide explains how to use and customize the research prompt.

---

## ✨ Key Features

### 1. **Perplexity-Only Research**
- ChatGPT option has been removed
- Perplexity AI provides more reliable, real-time web search results
- Opens directly in your browser for better performance

### 2. **Customizable Prompt Template**
- Edit the entire research prompt to match your business needs
- Save your custom prompt for future use
- Reset to defaults anytime
- Uses placeholders for dynamic company information

### 3. **Smart Placeholders**
The prompt system supports two placeholders:
- **`{{company_name}}`** - Automatically replaced with the company name you enter
- **`{{website_info}}`** - Automatically replaced with the website URL (if provided)

---

## 🚀 How to Use

### Basic Research Flow

1. **Open Company Intelligence**
   - Click **"🔍 Cég Intelligencia"** button in the sidebar

2. **Enter Company Details**
   - **Cég neve (Company Name)**: Enter the company name (required)
   - **Weboldal (Website)**: Enter website URL (optional, but helps with search accuracy)

3. **Run Research**
   - Click **"🔍 Perplexity Kutatás"** button
   - Perplexity opens in a new browser tab with your customized prompt
   - The prompt automatically includes the company name and website

4. **Copy Results**
   - Review the research results in Perplexity
   - Copy the results (Ctrl+C or Cmd+C)
   - Click **"📋 Beillesztés"** to paste results back into the modal

---

## ⚙️ Customizing Your Research Prompt

### Opening the Prompt Editor

1. In the **Cég Intelligencia** modal, click **"⚙️ Prompt Testreszabása"** (Customize Prompt)
2. A large text editor modal will open with your current prompt template

### Editing Your Prompt

The prompt editor allows you to:
- **Change the research questions** to match your specific needs
- **Add or remove sections** (contact info, company profile, advertising suggestions, etc.)
- **Adjust the language and tone** of the research request
- **Include industry-specific questions**

### Using Placeholders

**Important**: Always use these placeholders in your prompt:
- `{{company_name}}` - Will be replaced with the actual company name
- `{{website_info}}` - Will be replaced with " Weboldal: [URL]" if a website is provided

**Example Prompt Structure:**
```
Keress meg MINDEN elérhető adatot erről a magyar cégről: {{company_name}}{{website_info}}

Add meg MAGYARUL:

📞 KAPCSOLATI ADATOK:
- Pontos cégnév
- Teljes cím
- Telefonszám(ok), email, weboldal

📊 CÉG PROFIL:
- Tevékenységi kör
- Iparág, célpiac
```

### Saving Your Changes

1. Edit the prompt as desired
2. Click **"💾 Mentés"** (Save)
3. A confirmation toast will appear
4. Your custom prompt is now saved and will be used for all future research

---

## 🎯 Default Prompt Template

The default prompt is optimized for **PRV's business model** (corporate publication sales):

### Sections Included:

1. **📞 KAPCSOLATI ADATOK (Contact Information)**
   - Company name, address, phone, email, website
   - Tax number, company registration number
   - Main activity (TEÁOR code)
   - Founding year, owner/CEO
   - Employee count, revenue

2. **📊 CÉG PROFIL (Company Profile)**
   - Activity scope, main products/services
   - Industry, target market
   - B2B/B2C profile

3. **PRINT HIRDETÉS JAVASLAT (Print Ad Suggestion)**
   - Recommended ad size (1/4, 1/2, full page)
   - Visual style (modern/classic)
   - Main message, Call-to-Action
   - Layout ideas (product photos/logo/references)

4. **KONTEXTUS (Context)**
   - Explains PRV's business model
   - Notes that the company is already a supplier who received an invitation
   - Clarifies the paid advertising nature of the publication

---

## 💡 Customization Examples

### Example 1: IT Recruiting Agency

```
Keress meg MINDEN elérhető adatot erről a cégről: {{company_name}}{{website_info}}

Add meg MAGYARUL:

📞 KAPCSOLATI ADATOK:
- Cégnév, cím, telefon, email
- Tulajdonos/HR vezető neve

🖥️ IT PROFIL:
- Használt technológiák és programozási nyelvek
- Meglévő fejlesztői csapat mérete
- Aktuális tech projektek

💼 TOBORZÁSI LEHETŐSÉGEK:
- Nyitott pozíciók
- Bérsáv és juttatások
- Remote/hibrid munkavégzési lehetőség

KONTEXTUS: IT recruitment ügynökség vagyunk, szakképzett fejlesztőket keresünk.
```

### Example 2: B2B Software Sales

```
Keress meg információt erről a cégről: {{company_name}}{{website_info}}

KÉRDÉSEK:

📊 ÜZLETI ADATOK:
- Cégnév, iparág, méret
- Döntéshozók neve és szerepe
- Aktuális szoftver stack és CRM rendszer

💻 DIGITÁLIS ÉRETTSÉG:
- Használnak-e már SaaS megoldásokat?
- Van-e IT csapat?
- Cloud vs on-premise preferencia

🎯 PAIN POINTS:
- Milyen folyamatokat automatizálhatunk?
- Integráció igény más rendszerekkel

KONTEXTUS: B2B SaaS platform értékesítése, céges folyamatok automatizálására.
```

### Example 3: Market Research Agency

```
Kutasd fel ezt a magyar céget: {{company_name}}{{website_info}}

📋 PIACELEMZÉS:

🏢 ALAPADATOK:
- Cégnév, székhely, tulajdonosi kör
- Árbevétel, alkalmazottak száma, növekedési ráta

🎯 PIACI POZÍCIÓ:
- Versenytársak
- Piaci részesedés és pozícionálás
- Egyedi értékajánlat (USP)

📈 STRATÉGIAI IRÁNY:
- Közelmúltbeli hírek, sajtómegjelenések
- Terjeszkedési tervek
- Új termék/szolgáltatás bevezetések

KONTEXTUS: Piackutatási ügynökség, iparági elemzéshez gyűjtünk adatokat.
```

---

## 🔄 Reset to Defaults

If you want to restore the original PRV-optimized prompt:

1. Open **Settings** (⚙️ button in sidebar)
2. Click **"🎨 Configure Prompt Settings"** (yellow button)
3. Click **"🔄 Reset to Defaults"** at the bottom
4. Confirm the reset

This will restore ALL prompt settings, including the Company Research prompt, to their original defaults.

---

## 📝 Best Practices

### 1. **Always Use Placeholders**
- Include `{{company_name}}` in your prompt
- Include `{{website_info}}` if you want to leverage website data

### 2. **Structure Your Prompt Clearly**
- Use sections with emojis (📞, 📊, 🎯) for visual clarity
- Use bullet points for specific questions
- Keep language concise and specific

### 3. **Add Business Context**
- Include a "KONTEXTUS" section explaining your business
- This helps Perplexity tailor results to your needs

### 4. **Request Language**
- If researching Hungarian companies, specify "Add meg MAGYARUL" (Provide in Hungarian)
- For international companies, adjust language as needed

### 5. **Test and Iterate**
- Try your custom prompt with a few companies
- Refine based on result quality
- Save when you're satisfied

---

## 🛠️ Technical Details

### Storage
- Your custom prompt is saved to browser **localStorage**
- Persists across browser sessions
- Specific to your browser and device

### Placeholder Replacement
- Happens automatically when you click "Perplexity Kutatás"
- `{{company_name}}` → actual company name
- `{{website_info}}` → ` Weboldal: [URL]` (with leading space) or empty string

### Integration with Prompt Settings
- The Company Research Prompt is part of the global **Prompt Settings** system
- Resetting prompt settings will also reset the Company Research prompt
- Changes are saved immediately to localStorage

---

## ❓ Troubleshooting

### Issue: Prompt doesn't include my company name
- **Solution**: Ensure you're using `{{company_name}}` placeholder in your custom prompt

### Issue: Website isn't included in the search
- **Solution**: Use `{{website_info}}` placeholder in your prompt

### Issue: Perplexity results are generic
- **Solution**: Make your prompt more specific with detailed questions and add context about your business

### Issue: My custom prompt was reset
- **Solution**: You may have clicked "Reset to Defaults" in Prompt Settings. Re-customize your prompt and save again.

### Issue: Changes aren't saving
- **Solution**: 
  - Check browser console for errors
  - Ensure localStorage isn't disabled in your browser
  - Try refreshing the page and editing again

---

## 🎓 Pro Tips

1. **Save Multiple Versions**: Copy your custom prompts to a text file so you can switch between different templates for different scenarios

2. **Combine with Hívási Javaslat**: After getting research results, use the **"📞 Hívási Javaslat"** (Call Approach) button to generate a tailored calling strategy

3. **Perplexity Pro**: If you have Perplexity Pro, you'll get even more detailed and accurate results

4. **Iterate Based on Results**: Review the results you get and continuously refine your prompt to get better information

5. **Share with Team**: If multiple people use this system, document your best-performing prompts and share them

---

## 📚 Related Features

- **Prompt Settings** (`PROMPT_SETTINGS_GUIDE.md`) - Customize email response generation prompts
- **Bulk Email** (`BULK_EMAIL_GUIDE.md`) - Send template emails to multiple companies
- **Email History** - Load and respond to Gmail conversations with AI assistance

---

## 🆘 Support

If you encounter issues or have questions about customizing the Company Research prompt:

1. Check this guide first
2. Review the default prompt for reference
3. Test with simple prompts before adding complexity
4. Use the Reset to Defaults option if something breaks

---

**Last Updated**: November 19, 2025  
**Version**: 2.0 (Perplexity-only with customizable prompts)

