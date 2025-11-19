# ⚙️ Prompt Settings - Customizable Email Prompts

## ✅ What's New

You can now customize the prompt that gets sent to ChatGPT when you load email history and request an email response!

## 📍 How to Access

1. Click **"⚙️ Settings"** in the sidebar
2. Scroll down to **"💬 Email Prompt Settings"** section (yellow box)
3. Click **"⚙️ Configure Prompt Settings"**

## 🎯 What You Can Customize

### 1. **Your Name**
- Default: `Czechner Ince`
- Your full name as it appears in emails
- Used in the prompt context: "User: [Your Name] ([email]), [role]"

### 2. **Your Email**
- Default: `ince@prv.hu`
- Your work email address
- Appears in the prompt context for ChatGPT to understand who is sending

### 3. **Your Role**
- Default: `PRV Sales Manager`
- Example: Change to `Senior Account Manager`, `Business Development`, etc.
- This is how ChatGPT refers to your position in the context

### 4. **Business Model Explanation**
- Explain how your business works
- Helps ChatGPT understand the context
- Default includes PRV's publication model
- Customize for your specific business

### 5. **Communication Rules**
- Guidelines ChatGPT should follow
- Examples:
  - Only suggest phone/online meetings
  - Never suggest in-person meetings
  - Reference specific materials when appropriate
  - Pricing guidelines

### 6. **Tone & Style**
- Overall tone for responses
- Default: `Natural, friendly, but professional`
- Examples: `Formal and corporate`, `Casual and approachable`, etc.

### 7. **Context-Aware Instructions**
- How to adapt to different situations
- Default: Respond appropriately based on what they're waiting for
- Customize based on your sales process

### 8. **Natural Communication Guide**
- Instructions for human-like responses
- Default: `Read the conversation flow and respond like a real person would`
- Helps avoid robotic or template-sounding emails

---

## 💡 Example Customizations

### For Different Business Models

#### Software/SaaS Company
```
Business Model:
- We provide cloud-based CRM software for small businesses
- Customers pay monthly subscription ($99-$499/month)
- We offer 14-day free trial with no credit card required
- Implementation takes 1-2 weeks with our onboarding team
- Our main value: Save time and increase sales by 30%
```

#### Consulting Services
```
Business Model:
- We provide business consulting for enterprise clients
- Projects typically range from $50k-$500k
- Engagement process: Discovery call → Proposal → Contract → Delivery
- We specialize in digital transformation and process optimization
- Clients see ROI within 6-12 months
```

#### E-commerce/Products
```
Business Model:
- We sell premium office furniture directly to businesses
- Bulk discounts available for orders over 10 units
- Free shipping on orders over $5,000
- 30-day return policy, 5-year warranty
- Custom solutions available for large offices
```

---

## 🎨 Example Communication Rules

### B2B Sales (High-Touch)
```
Communication Rules:
- ALWAYS suggest a discovery call before sending proposals
- Ask qualifying questions about budget and timeline
- Reference case studies when relevant
- Follow up within 48 hours of any inquiry
- Only discuss pricing after understanding their needs
```

### E-commerce (Low-Touch)
```
Communication Rules:
- Provide pricing and product info upfront
- Include direct links to product pages
- Mention current promotions if applicable
- Offer chat support link for questions
- Keep emails short and actionable
```

### Agency/Creative Services
```
Communication Rules:
- Request portfolio review meeting before proposals
- Ask about their brand guidelines and preferences
- Discuss timeline and revision process upfront
- Share relevant case studies from similar projects
- Always cc the creative director on project emails
```

---

## 🔄 Reset to Defaults

If you want to go back to the original PRV settings:

1. Open **Prompt Settings**
2. Click **"🔄 Reset to Defaults"** (red button)
3. Confirm the reset

This will restore all original PRV-specific settings.

---

## 📊 How It Works

### Before (Hardcoded):
Every email prompt used the same PRV-specific name, email, business model and rules.

### After (Customizable):
```javascript
// Settings stored in browser localStorage
{
  userName: "Your full name",
  userEmail: "your@email.com",
  userRole: "Your custom role",
  businessModel: "Your business explanation",
  communicationRules: "Your specific rules",
  toneGuidance: "Your preferred tone",
  contextAwareGuidance: "Your context rules",
  naturalGuidance: "Your natural comm guide"
}
```

When you send a request after loading email history, these custom settings are used to build the ChatGPT prompt.

---

## 💾 Where Are Settings Stored?

Settings are saved in your **browser's localStorage**, which means:

✅ **Persists between sessions** - No need to reconfigure
✅ **Private to your browser** - Not stored on the server
✅ **Per-user** - Each browser/computer has its own settings

⚠️ **Note**: If you clear browser data or use a different browser/computer, you'll need to reconfigure.

---

## 🎯 Best Practices

### 1. **Keep Business Model Concise**
- Focus on key points (5-7 bullet points)
- Explain the value proposition
- Mention pricing structure if relevant
- Describe the sales/engagement process

### 2. **Make Rules Specific**
- Use "ALWAYS" and "NEVER" for strict rules
- Include examples when helpful
- Mention specific tools/platforms (Teams, Zoom, etc.)
- Reference materials or documents if applicable

### 3. **Define Tone Clearly**
- Use descriptive words: formal, casual, friendly, professional
- Mention any brand voice guidelines
- Consider your audience

### 4. **Test and Iterate**
- Try your settings on a test email
- See if ChatGPT follows your guidelines
- Adjust based on results
- Share effective settings with your team

---

## 🧪 Testing Your Settings

1. **Configure your settings**
2. **Load an email history** (any contact)
3. **Type a request** like "Write a follow-up email"
4. **Check the generated prompt**:
   - Does it include your custom business model?
   - Are your communication rules present?
   - Is the tone what you expected?

---

## 📋 Example Full Configuration

### Tech Startup Example

**Your Name:** `Sarah Johnson`

**Your Email:** `sarah@techstartup.com`

**Your Role:** `Growth Marketing Manager`

**Business Model:**
```
- We provide AI-powered analytics for e-commerce businesses
- Pricing: $299/month (Starter), $899/month (Pro), Enterprise (custom)
- Free 30-day trial, no credit card required
- Average customer sees 20% increase in conversion rates
- Integration takes 15 minutes via Shopify/WooCommerce plugin
- Dedicated customer success manager for Pro+ plans
```

**Communication Rules:**
```
- ALWAYS offer a free demo/trial before discussing pricing
- Ask about their current analytics tools
- Mention integration ease and setup time
- Reference similar customers in their industry
- Follow up within 24 hours of demo requests
- Include video tutorials when relevant
```

**Tone & Style:** `Friendly, tech-savvy, helpful but not pushy`

**Context-Aware Instructions:**
```
If they're evaluating options: Focus on unique features and ROI
If they have technical questions: Offer demo or connect with tech team
If discussing pricing: Emphasize value and trial period
If they went silent: Gentle follow-up with case study or resource
```

**Natural Communication Guide:**
```
Match their formality level. If they're casual, be casual. If formal, be professional. Read between the lines for their real concerns.
```

---

## ✨ Advanced Tips

### Using Variables in Settings

While you can't use actual variables, you can write your settings in a way that ChatGPT understands should be personalized:

```
Business Model:
- [Mention the specific project company name when relevant]
- [Reference their industry if you know it]
- [Adjust pricing mention based on company size]
```

ChatGPT will interpret these as instructions to personalize based on context.

---

## 🆘 Troubleshooting

**Q: My settings aren't being used?**
- Make sure you clicked "💾 Save Settings"
- Try refreshing the page
- Check browser console for errors

**Q: I want different settings for different types of emails?**
- Currently, settings are global
- Consider using the "Context-Aware Instructions" to handle different scenarios
- Future update may add templates

**Q: Can I export/import settings?**
- Not yet, but you can copy the text from each field
- Save them in a document for backup
- Future update may add export/import

**Q: Settings disappeared?**
- Check if browser data was cleared
- localStorage is browser-specific
- Keep a backup of your custom settings

---

## 🚀 Future Enhancements

Potential future features:
- Multiple prompt templates (Sales, Support, Follow-up)
- Export/import settings
- Team sharing of settings
- Per-contact custom prompts
- AI-suggested improvements to your prompts

---

## 📝 Summary

**Prompt Settings** gives you full control over how ChatGPT generates email responses based on your email history. Customize it once, and every email prompt will use your preferences!

**Key Benefits:**
- ✅ Tailored to your business model
- ✅ Follows your communication style
- ✅ Maintains your brand voice
- ✅ Persists across sessions
- ✅ Easy to reset if needed

**Get Started:**
Settings → Email Prompt Settings → Configure → Save

---

**Version:** 1.0  
**Last Updated:** November 2025

