// Modern Chat Application
let sessionId = 'session_' + Date.now();
let currentAssistant = 'Marketing Expert';
let isProcessing = false;
let currentEmails = [];
let currentEmailAddress = '';

// Assistant information
const assistants = {
    "Marketing Expert": {
        "description": "📧 Specializes in email marketing and B2B sales strategies",
        "color": "#9b59b6"
    },
    "General Assistant": {
        "description": "💼 Provides general business assistance and support",
        "color": "#3498db"
    }
};

// Create Email Section Dynamically
function createEmailSection() {
    const sidebar = document.querySelector('.sidebar');
    const clearSection = document.querySelector('.sidebar-section:has(#clear-chat-btn)');
    
    if (!clearSection) return;
    
    const emailSection = document.createElement('div');
    emailSection.className = 'sidebar-section';
    emailSection.style.cssText = 'background: #f0f9ff; border: 2px solid #3498db; border-radius: 8px; padding: 16px;';
    emailSection.innerHTML = `
        <div class="section-title" style="color: #3498db; margin-bottom: 12px;">📧 Email Context</div>
        <input type="email" id="email-input" class="email-input" placeholder="Enter email address..." style="margin-bottom: 10px; width: 100%;">
        <button class="sidebar-btn" id="load-emails-btn" style="margin-bottom: 8px; background: #3498db; color: white; width: 100%;">
            Load Email History
        </button>
        <button class="sidebar-btn" id="view-emails-btn" style="background: #9b59b6; color: white; width: 100%;">
            View Emails
        </button>
    `;
    
    sidebar.insertBefore(emailSection, clearSection);
    
    // Add event listeners
    setTimeout(() => {
        document.getElementById('load-emails-btn').addEventListener('click', loadEmails);
        document.getElementById('view-emails-btn').addEventListener('click', viewEmails);
    }, 100);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // FORCE CREATE EMAIL SECTION IF MISSING
    if (!document.getElementById('email-input')) {
        createEmailSection();
    }
    
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const assistantSelect = document.getElementById('assistant-select');
    const clearBtn = document.getElementById('clear-chat-btn');
    const connectGmailBtn = document.getElementById('connect-gmail-btn');
    const loadEmailsBtn = document.getElementById('load-emails-btn');
    const viewEmailsBtn = document.getElementById('view-emails-btn');
    const companyResearchBtn = document.getElementById('company-research-btn');
    const setupBtn = document.getElementById('setup-btn');
    const emailInput = document.getElementById('email-input');
    
    // Check API configuration
    checkAPIConfiguration();
    
    // Update assistant description
    updateAssistantDescription();
    
    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
    
    assistantSelect.addEventListener('change', function() {
        currentAssistant = this.value;
        updateAssistantDescription();
        addSystemMessage(`Switched to ${currentAssistant}`);
    });
    
    clearBtn.addEventListener('click', clearConversation);
    connectGmailBtn.addEventListener('click', connectGmail);
    loadEmailsBtn.addEventListener('click', loadEmails);
    viewEmailsBtn.addEventListener('click', viewEmails);
    companyResearchBtn.addEventListener('click', openCompanyResearch);
    setupBtn.addEventListener('click', openSetupWizard);
    
    // Focus input
    messageInput.focus();
}

async function connectGmail() {
    try {
        const response = await fetch('/api/gmail_auth_url');
        const data = await response.json();
        
        if (response.ok && data.auth_url) {
            // Open Gmail auth in new window
            const width = 600;
            const height = 700;
            const left = (screen.width / 2) - (width / 2);
            const top = (screen.height / 2) - (height / 2);
            
            window.open(
                data.auth_url,
                'Gmail Authorization',
                `width=${width},height=${height},left=${left},top=${top}`
            );
            
            addSystemMessage('✅ Gmail authorization window opened. Please sign in and grant access.');
        } else {
            alert('Error: ' + (data.error || 'Failed to get authorization URL'));
        }
    } catch (error) {
        alert('Failed to connect Gmail: ' + error.message);
        console.error('Error:', error);
    }
}

async function loadEmails() {
    const emailInput = document.getElementById('email-input');
    const email = emailInput.value.trim();
    
    if (!email) {
        alert('Please enter an email address');
        return;
    }
    
    const loadBtn = document.getElementById('load-emails-btn');
    const originalText = loadBtn.innerHTML;
    loadBtn.innerHTML = '<div style="display:inline-block;">Loading...</div>';
    loadBtn.disabled = true;
    
    try {
        const response = await fetch('/api/load_emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentEmails = data.emails;
            currentEmailAddress = data.email;
            
            // Add system message
            addSystemMessage(`✅ Loaded ${data.count} emails from ${email}. Now when you send a message, it will open ChatGPT with the full email context.`);
            
            // Show email prompt suggestions
            showEmailPromptSuggestions();
            
            // Focus on message input
            const messageInput = document.getElementById('message-input');
            messageInput.placeholder = 'Type your request or use a quick prompt above...';
            messageInput.focus();
            
            alert(`✅ Successfully loaded ${data.count} emails!\n\n💡 Use the quick prompts or type your own. It will open ChatGPT with the full email context.`);
        } else {
            // Check if needs Gmail authorization
            if (data.needs_auth) {
                if (confirm('❌ Gmail not connected.\n\n✅ Click OK to connect your Gmail account now.')) {
                    await connectGmail();
                }
            } else {
                alert('Error: ' + (data.error || 'Failed to load emails'));
            }
        }
    } catch (error) {
        alert('Failed to load emails: ' + error.message);
        console.error('Error:', error);
    } finally {
        loadBtn.innerHTML = originalText;
        loadBtn.disabled = false;
    }
}

function viewEmails() {
    if (currentEmails.length === 0) {
        alert('No emails loaded. Please load emails first.');
        return;
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 16px;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        padding: 32px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    `;
    
    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 24px;">Email History: ${currentEmailAddress}</h2>
            <button onclick="this.closest('[style*=fixed]').remove()" style="
                background: #e5e7eb;
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">×</button>
        </div>
    `;
    
    currentEmails.forEach((email, index) => {
        html += `
            <div style="
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 16px;
                background: #fafafa;
            ">
                <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px;">
                    ${email.subject}
                </div>
                <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">
                    From: ${email.from}
                </div>
                <div style="font-size: 13px; color: #6b7280; margin-bottom: 12px;">
                    Date: ${email.date}
                </div>
                <div style="font-size: 14px; color: #374151; white-space: pre-wrap; max-height: 200px; overflow-y: auto;">
                    ${email.body}
                </div>
            </div>
        `;
    });
    
    modalContent.innerHTML = html;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function updateAssistantDescription() {
    const descElement = document.getElementById('assistant-description');
    const assistant = assistants[currentAssistant];
    if (assistant && descElement) {
        descElement.textContent = assistant.description;
    }
}

async function sendMessage() {
    if (isProcessing) return;
    
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // Clear input and hide welcome
    messageInput.value = '';
    messageInput.style.height = 'auto';
    hideWelcome();
    
    // Add user message
    addMessage('user', message);
    
    // Check if email context is loaded - if so, open ChatGPT instead
    if (currentEmails.length > 0) {
        openChatGPTWithEmailContext(message);
        isProcessing = false;
        updateSendButton(false);
        return;
    }
    
    // Show typing indicator
    showTypingIndicator();
    
    // Disable input
    isProcessing = true;
    updateSendButton(true);
    
    try {
        // Send to backend
        const response = await fetch('/api/send_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                assistant: currentAssistant,
                session_id: sessionId
            })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        hideTypingIndicator();
        
        if (response.ok) {
            // Add assistant response
            addMessage('assistant', data.response);
        } else {
            addMessage('assistant', '❌ Sorry, I encountered an error: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        hideTypingIndicator();
        addMessage('assistant', '❌ Connection error. Please check your internet connection.');
        console.error('Error:', error);
    } finally {
        isProcessing = false;
        updateSendButton(false);
        messageInput.focus();
    }
}

function openChatGPTWithEmailContext(userMessage) {
    // Detect language from emails
    let lastEmailLanguage = "English";
    let hungarianScore = 0;
    let totalEmailsChecked = 0;
    
    if (currentEmails && currentEmails.length > 0) {
        for (let conv of currentEmails.slice(0, 5)) {
            const body = conv.body || '';
            const hungarianChars = (body.match(/[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/g) || []).length;
            const weight = conv.direction && conv.direction.includes('KAPTAM') ? 3 : 1;
            hungarianScore += hungarianChars * weight;
            totalEmailsChecked += body.length * weight;
        }
        
        if (totalEmailsChecked > 0 && (hungarianScore / totalEmailsChecked) > 0.005) {
            lastEmailLanguage = "Hungarian";
        }
    }
    
    // Check user message for Hungarian
    const userHungarianChars = (userMessage.match(/[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/g) || []).length;
    if (userHungarianChars > 3) {
        lastEmailLanguage = "Hungarian";
    }
    
    // Build the full prompt
    let prompt = `CONTEXT:
- User: CZECHNER INCE (ince@prv.hu), PRV Sales Manager
- Email conversation with: ${currentEmailAddress}

BUSINESS MODEL (for your understanding):
- PRV creates corporate publications for large companies (project companies)
- The project company sends invitations to their suppliers to participate in the publication
- PRV forwards this invitation, then contacts suppliers via PHONE/EMAIL
- THIS IS WARM OUTREACH - the supplier already received an invitation from the project company!
- Suppliers PAY for their appearance (as advertisement or PR article)
- Format: PRINTED and DIGITAL publication
- Benefit: visibility to the project company and its supply chain, business opportunities

COMMUNICATION RULES (only suggest when relevant):
- IF suggesting a meeting: ALWAYS suggest phone call or online meeting (Teams/Google Meet)
- NEVER suggest in-person meetings
- Reference the project company's invitation when appropriate

EMAIL HISTORY:
${'='.repeat(60)}

`;

    // Add email history (full bodies)
    currentEmails.slice(0, 10).forEach((conv, i) => {
        let body = conv.body || '';
        // Keep full body but limit to 1000 chars
        if (body.length > 1000) {
            body = body.substring(0, 1000) + '...';
        }
        
        prompt += `\nEMAIL #${i + 1} - ${conv.direction}
Date: ${conv.date}
Subject: ${conv.subject}
From: ${conv.from}

Content:
${body}
${'-'.repeat(60)}
`;
    });
    
    prompt += `\n\n${'='.repeat(60)}

CZECHNER INCE'S REQUEST:
${userMessage}

${'='.repeat(60)}

IMPORTANT INSTRUCTIONS:
1. **LANGUAGE - CRITICAL**: The email conversation above is in ${lastEmailLanguage}. You MUST reply in ${lastEmailLanguage}. 
   - If language is "Hungarian" → write the ENTIRE email in Hungarian
   - If language is "English" → write the ENTIRE email in English
   
2. **TONE**: Natural, friendly, but professional

3. **MEETINGS**: Only suggest meetings if it makes sense in the context. Don't force it.

4. **CONTEXT-AWARE**: If they're waiting for materials, asking a question, or providing info - respond appropriately. Don't always push for calls.

5. **BE NATURAL**: Read the conversation flow and respond like a real person would.

Now, provide a concrete, practical email response IN ${lastEmailLanguage.toUpperCase()}!`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(prompt).then(() => {
        // Open ChatGPT
        window.open('https://chat.openai.com/', '_blank');
        
        // Add system message
        addSystemMessage('✅ Prompt copied to clipboard! Paste it in ChatGPT (Ctrl+V) and copy the response back.');
    }).catch(err => {
        console.error('Failed to copy:', err);
        addMessage('assistant', '❌ Failed to copy prompt to clipboard. Please check your browser permissions.');
    });
}

function sendSuggestion(text) {
    const messageInput = document.getElementById('message-input');
    messageInput.value = text;
    messageInput.focus();
    sendMessage();
}

function addMessage(role, content) {
    const container = document.getElementById('messages-container');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? '👤' : '🤖';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    
    container.appendChild(messageDiv);
    scrollToBottom();
}

function addSystemMessage(text) {
    const container = document.getElementById('messages-container');
    
    const systemDiv = document.createElement('div');
    systemDiv.style.cssText = 'text-align: center; padding: 12px; color: var(--text-secondary); font-size: 13px;';
    systemDiv.textContent = `✨ ${text}`;
    
    container.appendChild(systemDiv);
    scrollToBottom();
}

function showTypingIndicator() {
    const container = document.getElementById('messages-container');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    messageDiv.id = 'typing-indicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message-content';
    
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    
    typingDiv.appendChild(indicator);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(typingDiv);
    
    container.appendChild(messageDiv);
    scrollToBottom();
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function updateSendButton(disabled) {
    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = disabled;
}

function hideWelcome() {
    const welcome = document.querySelector('.welcome-message');
    if (welcome) {
        welcome.style.display = 'none';
    }
}

function scrollToBottom() {
    const container = document.getElementById('messages-container');
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

async function clearConversation() {
    if (!confirm('Are you sure you want to clear the conversation?')) {
        return;
    }
    
    try {
        await fetch('/api/clear_conversation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: sessionId
            })
        });
        
        // Clear messages
        const container = document.getElementById('messages-container');
        container.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">👋</div>
                <h2>Welcome to PRV AI Marketing Assistant</h2>
                <p>I'm here to help you with email marketing, sales strategies, and B2B communication.</p>
                <div class="suggestions">
                    <button class="suggestion-chip" onclick="sendSuggestion('Help me write a follow-up email')">
                        Write follow-up email
                    </button>
                    <button class="suggestion-chip" onclick="sendSuggestion('How do I handle price objections?')">
                        Handle objections
                    </button>
                    <button class="suggestion-chip" onclick="sendSuggestion('Create a cold email template')">
                        Cold email template
                    </button>
                </div>
                </div>
            `;
        
        // Generate new session ID
        sessionId = 'session_' + Date.now();
        
    } catch (error) {
        alert('Failed to clear conversation');
        console.error('Error:', error);
    }
}

function openCompanyResearch() {
    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 16px;
        max-width: 600px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        padding: 0;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    `;
    
    modalContent.innerHTML = `
        <div style="background: #27ae60; padding: 24px; border-radius: 16px 16px 0 0;">
            <h2 style="margin: 0; font-size: 24px; color: white;">🔍 Cég Intelligencia</h2>
        </div>
        
        <div style="background: #d4edda; padding: 16px; border-bottom: 1px solid #c3e6cb;">
            <p style="margin: 0; font-size: 14px; color: #155724; line-height: 1.5;">
                💡 AI böngészőben nyílik meg (jobb eredmények)<br>
                Másold ki az eredményt (Ctrl+C) és kattints a '📋 Beillesztés' gombra!<br>
                💡 TIP: Perplexity MINDIG keres, ChatGPT néha offline módban van.
            </p>
        </div>
        
        <div style="padding: 24px;">
            <div style="margin-bottom: 16px;">
                <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #2d3748;">
                    Cég neve:
                </label>
                <input type="text" id="company-name-input" style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    box-sizing: border-box;
                " placeholder="Pl.: Teszt Kft." />
            </div>
            
            <div style="margin-bottom: 24px;">
                <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #718096; font-size: 13px;">
                    Weboldal (opcionális, segíti a keresést):
                </label>
                <input type="text" id="company-website-input" style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    box-sizing: border-box;
                " placeholder="Pl.: https://example.com" />
            </div>
            
            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
                <button onclick="openPerplexity()" style="
                    flex: 1;
                    min-width: 140px;
                    padding: 12px 20px;
                    background: #1e88e5;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    🔍 Perplexity (Ajánlott!)
                </button>
                
                <button onclick="openChatGPTResearch()" style="
                    flex: 1;
                    min-width: 140px;
                    padding: 12px 20px;
                    background: #27ae60;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    💬 ChatGPT
                </button>
            </div>
            
            <div style="display: flex; gap: 10px; margin-bottom: 16px;">
                <button onclick="openCallApproach()" style="
                    flex: 1;
                    padding: 12px 20px;
                    background: #e67e22;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    📞 Hívási Javaslat
                </button>
                
                <button onclick="pasteResults()" style="
                    flex: 1;
                    padding: 12px 20px;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    cursor: pointer;
                ">
                    📋 Beillesztés
                </button>
            </div>
            
            <div id="research-results" style="
                min-height: 100px;
                max-height: 300px;
                overflow-y: auto;
                background: #f8f9fa;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 16px;
                font-size: 14px;
                line-height: 1.6;
                white-space: pre-wrap;
                display: none;
            "></div>
            
            <button onclick="this.closest('[style*=fixed]').remove()" style="
                width: 100%;
                padding: 12px;
                margin-top: 16px;
                background: #e5e7eb;
                color: #2d3748;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                cursor: pointer;
            ">
                Bezárás
            </button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Focus company name input
    setTimeout(() => {
        document.getElementById('company-name-input').focus();
    }, 100);
}

function openPerplexity() {
    const companyName = document.getElementById('company-name-input').value.trim();
    const website = document.getElementById('company-website-input').value.trim();
    
    if (!companyName) {
        alert('Kérlek add meg a cég nevét!');
        return;
    }
    
    const websiteInfo = website ? ` Weboldal: ${website}` : '';
    
    const prompt = `Keress meg MINDEN elérhető adatot erről a magyar cégről: ${companyName}${websiteInfo}

Add meg MAGYARUL:

📞 KAPCSOLATI ADATOK:
- Pontos cégnév
- Teljes cím (utca, házszám, irányítószám, település)
- Telefonszám(ok), email, weboldal
- Adószám, cégjegyzékszám
- Főtevékenység (TEÁOR)
- Alapítás éve, tulajdonos/ügyvezető
- Alkalmazottak száma, árbevétel

📊 CÉG PROFIL:
- Tevékenységi kör, fő termékek/szolgáltatások
- Iparág, célpiac
- B2B/B2C profil

PRINT HIRDETÉS JAVASLAT (vállalati kiadvány):
- Javasolt méret (1/4, 1/2, egész oldal)
- Vizuális stílus (modern/klasszikus)
- Fő üzenet, CTA
- Layout ötlet (termékfotó/logo/referenciák)

KONTEXTUS: A PRV vállalati kiadványokat készít nagyvállalatoknak. Ez a cég beszállítójuk, már kapták a meghívót hogy szerepeljenek a print és digitális kiadványban. Fizetnek a megjelenésért (hirdetés/PR cikk).`;
    
    const url = `https://www.perplexity.ai/?q=${encodeURIComponent(prompt)}`;
    window.open(url, '_blank');
}

function openChatGPTResearch() {
    const companyName = document.getElementById('company-name-input').value.trim();
    const website = document.getElementById('company-website-input').value.trim();
    
    if (!companyName) {
        alert('Kérlek add meg a cég nevét!');
        return;
    }
    
    const websiteInfo = website ? `\nCÉG WEBOLDALA: ${website}\n(Látogasd meg ezt az oldalt és elemezd a cég tevékenységét!)` : '';
    
    const prompt = `🔍 HASZNÁLD A KERESÉSI FUNKCIÓD! 🔍

Keress az interneten és találj meg MINDEN elérhető adatot erről a cégről: ${companyName}${websiteInfo}

⚠️ KRITIKUS: NE mondd, hogy "nem férsz hozzá adatbázishoz"! HASZNÁLD A SEARCH FUNKCIÓD és keress rá Google-ön, céginformációs oldalakon (opten.hu, e-cegjegyzek.hu, company.info.hu stb.)!

Kérlek add meg MAGYARUL a következő információkat:

FONTOS KONTEXTUS:
- A PRV vállalati kiadványokat készít nagyvállalatoknak (projekt cégek)
- A PROJEKT CÉG meghívót küldött ennek a cégnek (${companyName}), hogy részt vehet a kiadványban
- Ez a cég BESZÁLLÍTÓ/PARTNER a projekt cégnek
- Ők már KAPTÁK A MEGHÍVÓT a projekt cégtől - tudják, miről van szó
- Most TELEFONON FOGJUK MEGKERESNI őket (MELEG KAPCSOLATFELVÉTEL, nem hideg hívás!)

📞 KAPCSOLATI ADATOK (KERESD MEG AZ INTERNETEN!):
- Pontos cégnév
- Teljes cím (utca, házszám, irányítószám, település)
- Telefonszám(ok)
- Fax (ha van)
- Email cím
- Weboldal URL
- Adószám (ha elérhető)
- Cégjegyzékszám
- Főtevékenység (TEÁOR kód és leírás)
- Alapítás éve
- Tulajdonos/Ügyvezető neve
- Alkalmazottak száma (becsült)
- Árbevétel (ha elérhető, utolsó ismert adat)

📊 CÉG TEVÉKENYSÉGE ÉS MEGJELENÉSI JAVASLATOK VÁLLALATI KIADVÁNYBAN:
- Tevékenységi kör röviden
- Fő termékek/szolgáltatások
- Iparág és célpiac
- Milyen cég profilba illeszkedik (B2B, B2C, prémium, közép, költséghatékony)

HIRDETÉSI FORMÁTUM ÖTLETEK PRINT KIADVÁNYBA:
- Javasolt méret (1/4 oldal, 1/2 oldal, egész oldal)
- Vizuális stílus (modern/klasszikus, fotók/grafikák, színvilág)
- Fő üzenet amit ki kellene emelni (figyelembe véve, hogy ők a projekt cég beszállítói!)
- Call-to-action javaslat
- Layout elrendezés ötlet (pl. nagy termékfotó + szöveg, logo + terméklista, referenciák bemutatása)

FONTOS: 
1. HASZNÁLD A SEARCH FUNKCIÓT! Keress rá a cégre Google-ön és magyar céginformációs oldalakon!
2. A hirdetési javaslatok CSAK nyomtatott vállalati kiadványra vonatkozzanak! 
3. Ne adj digitális, social media, vagy egyéb marketing javaslatokat!
4. MINDIG adj meg konkrét, faktaalapú adatokat amit találtál!`;
    
    const url = `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`;
    window.open(url, '_blank');
}

function openCallApproach() {
    const companyName = document.getElementById('company-name-input').value.trim();
    const website = document.getElementById('company-website-input').value.trim();
    
    if (!companyName) {
        alert('Kérlek add meg a cég nevét!');
        return;
    }
    
    const websiteInfo = website ? `\nCÉG WEBOLDALA: ${website}\n(Látogasd meg és elemezd!)` : '';
    
    const prompt = `🔍 HASZNÁLD A KERESÉSI FUNKCIÓD! 🔍

Keress az interneten információt erről a cégről: ${companyName}${websiteInfo}

⚠️ KRITIKUS: HASZNÁLD A SEARCH FUNKCIÓD! Keress rá Google-ön, LinkedIn-en, céginformációs oldalakon!

Először listázd ki:

🤝 FŐ PARTNEREIK/ÜGYFELEIK (keress rá!):
• [Listázz 5-8 ismert partnert/ügyfelet]

⚔️ FŐ KONKURENSEIK (keress rá!):
• [Listázz 3-5 közvetlen versenytársat]

---

Majd készíts konkrét, rövid bullet point javaslatokat arról, hogyan érdemes első alkalommal telefonon megkeresni őket!

FONTOS KONTEXTUS:
- Vállalati kiadványban való megjelenést kínálunk (PRV)
- A PRV vállalati kiadványokat készít nagyvállalatoknak (projekt cégek)
- A PROJEKT CÉG meghívót küldött ennek a cégnek, hogy részt vehet a kiadványban
- Ez a cég BESZÁLLÍTÓ/PARTNER a projekt cégnek
- A PRV ezt a meghívót elküldte nekik
- Most TELEFONON FOGJUK ŐKET MEGKERESNI
- EZ NEM HIDEG HÍVÁS! Ők már kapták a projekt cég meghívóját, tudják miről van szó!
- Hirdetés vagy PR cikk formájában jelenhetnek meg egy nagyvállalat számára készülő print és digitális kiadványban
- Ez TÉRÍTÉSES megjelenés - ők fizetnek a láthatóságért a projekt cég beszállítói körében

🎯 NYITÁS (hogyan mutatkozzak be, mi legyen az első mondat):
• [3-4 konkrét, rövid bullet point]

💡 FŐ ÉRTÉK KIEMELÉS (mit érdemes hangsúlyozni nekik):
• [3-4 konkrét, rövid bullet point - használd fel a partner/konkurens infót!]

🔑 KULCS KÉRDÉSEK (mit kérdezzek tőlük):
• [3-4 konkrét kérdés bullet point]

⚠️ ELKERÜLENDŐ TÉMÁK/MONDATOK:
• [2-3 rövid bullet point]

✅ LEZÁRÁS/KÖVETKEZŐ LÉPÉS:
• [2-3 rövid bullet point]

FONTOS: 
- Csak bullet pointok, tömören! 
- Ne hosszú mondatok, ne bekezdések! 
- Konkrét, cég-specifikus tanácsok a cég tevékenysége, partnerei és konkurensei alapján!
- A partnerek/konkurensek ismerete segíthet a megközelítésben!`;
    
    const url = `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`;
    window.open(url, '_blank');
}

function pasteResults() {
    navigator.clipboard.readText().then(text => {
        const resultsDiv = document.getElementById('research-results');
        resultsDiv.textContent = text;
        resultsDiv.style.display = 'block';
    }).catch(err => {
        alert('Nem sikerült beolvasni a vágólapról! Győződj meg róla, hogy másoltál valamit.');
    });
}

function showEmailPromptSuggestions() {
    const container = document.getElementById('messages-container');
    
    // Remove welcome message if exists
    const welcome = container.querySelector('.welcome-message');
    if (welcome) {
        welcome.remove();
    }
    
    // Check if suggestions already exist
    if (document.getElementById('email-prompt-suggestions')) {
        return;
    }
    
    // Create suggestions container
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.id = 'email-prompt-suggestions';
    suggestionsDiv.style.cssText = `
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
        margin: 20px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    
    suggestionsDiv.innerHTML = `
        <div style="color: white; font-weight: 600; margin-bottom: 16px; font-size: 16px;">
            💡 Gyors Email Promptok:
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">
            <button onclick="useEmailPrompt('Válaszoljunk az utolsó emailre')" style="
                padding: 12px 16px;
                background: white;
                color: #667eea;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                text-align: left;
                transition: all 0.2s;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                📧 Válaszoljunk az utolsó emailre
            </button>
            
            <button onclick="useEmailPrompt('Ajánljunk fel egy banneres megjelenés kedvezményt a szokásos 499.000 Ft helyett 399.000 Ft-ért. Emeljük ki, hogy a partner cégnek is sokat jelentene, ha ők is csatlakoznának a projekthez!')" style="
                padding: 12px 16px;
                background: white;
                color: #667eea;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                text-align: left;
                transition: all 0.2s;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                💰 Banner kedvezmény (399.000 Ft)
            </button>
            
            <button onclick="useEmailPrompt('Kérjünk vissza egy rövid visszajelzést: érdekli-e őket a megjelenés, vagy van-e kérdésük')" style="
                padding: 12px 16px;
                background: white;
                color: #667eea;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                text-align: left;
                transition: all 0.2s;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                🔄 Kérjünk visszajelzést
            </button>
            
            <button onclick="useEmailPrompt('Köszönjük meg a választ és javasoljunk egy rövid Teams/Google Meet egyeztetést a részletekről')" style="
                padding: 12px 16px;
                background: white;
                color: #667eea;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                text-align: left;
                transition: all 0.2s;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                📞 Javasolj online meetinget
            </button>
            
            <button onclick="useEmailPrompt('Küldjük el a projekt céges kiadvány mintapéldányát és emeljük ki, milyen nagy láthatóságot kapnának')" style="
                padding: 12px 16px;
                background: white;
                color: #667eea;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                text-align: left;
                transition: all 0.2s;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                📄 Küldjünk mintapéldányt
            </button>
            
            <button onclick="useEmailPrompt('Írjunk egy barátságos follow-up emailt, ha már egy ideje nem válaszoltak')" style="
                padding: 12px 16px;
                background: white;
                color: #667eea;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                text-align: left;
                transition: all 0.2s;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                ⏰ Follow-up email
            </button>
        </div>
        
        <div style="margin-top: 12px; padding: 12px; background: rgba(255,255,255,0.15); border-radius: 8px;">
            <div style="color: white; font-size: 13px; line-height: 1.5;">
                💡 <strong>Tipp:</strong> Kattints egy gombra, vagy írj egyedi promptot az input mezőbe. 
                A ChatGPT automatikusan megnyílik a teljes email kontextussal!
            </div>
        </div>
    `;
    
    container.appendChild(suggestionsDiv);
    scrollToBottom();
}

function useEmailPrompt(promptText) {
    const messageInput = document.getElementById('message-input');
    messageInput.value = promptText;
    messageInput.focus();
    
    // Auto-resize textarea
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    
    // Optionally auto-send
    // sendMessage();
}

// Check API Configuration
async function checkAPIConfiguration() {
    try {
        const response = await fetch('/api/check_config');
        const data = await response.json();
        
        const statusIndicator = document.getElementById('status-indicator');
        const setupBtn = document.getElementById('setup-btn');
        
        // Update status indicator
        if (!data.hasOpenAI || !data.hasGmail) {
            statusIndicator.innerHTML = `
                <div class="status-dot" style="background: #f39c12;"></div>
                <span>Setup Required</span>
            `;
            
            // Make setup button more prominent
            setupBtn.style.cssText = 'background: #e74c3c; color: white; font-weight: bold; animation: pulse 2s infinite;';
            
            // Show warning message
            setTimeout(() => {
                let warnings = [];
                if (!data.hasOpenAI) warnings.push('OpenAI API (for chat)');
                if (!data.hasGmail) warnings.push('Gmail API (for email history)');
                
                addSystemMessage(`⚠️ Configuration needed: ${warnings.join(', ')}. Click Settings to configure.`);
            }, 1000);
        }
        
        // Store config status globally
        window.apiConfig = data;
        
    } catch (error) {
        console.error('Failed to check configuration:', error);
    }
}

// Open Setup Wizard
function openSetupWizard() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    const hasOpenAI = window.HAS_OPENAI || false;
    const hasGmail = window.HAS_GMAIL || false;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 16px;
            padding: 32px;
            max-width: 700px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="margin: 0; color: #2c3e50; font-size: 24px;">⚙️ API Configuration</h2>
                <button onclick="this.closest('[style*=fixed]').remove()" style="
                    background: none;
                    border: none;
                    font-size: 28px;
                    cursor: pointer;
                    color: #95a5a6;
                    line-height: 1;
                ">&times;</button>
            </div>
            
            <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
                <div style="font-weight: 600; color: #1976d2; margin-bottom: 8px;">ℹ️ What you need:</div>
                <ul style="margin: 0; padding-left: 20px; color: #424242; line-height: 1.8;">
                    <li><strong>OpenAI API Key</strong> - Required for AI chat functionality</li>
                    <li><strong>Gmail API Credentials</strong> - Required for loading email history</li>
                </ul>
                <div style="margin-top: 12px; font-size: 14px; color: #666;">
                    💡 Both are optional - you can configure one or both depending on which features you need.
                </div>
            </div>
            
            <!-- OpenAI Configuration -->
            <div style="margin-bottom: 32px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <h3 style="margin: 0; color: #2c3e50; font-size: 18px;">🤖 OpenAI API</h3>
                    <span style="
                        padding: 4px 12px;
                        background: ${hasOpenAI ? '#27ae60' : '#e74c3c'};
                        color: white;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 600;
                    ">${hasOpenAI ? '✓ Configured' : '⚠ Not Configured'}</span>
                </div>
                
                <label style="display: block; margin-bottom: 8px; color: #555; font-weight: 500;">
                    API Key:
                </label>
                <input 
                    type="password" 
                    id="openai-api-key" 
                    placeholder="sk-proj-..." 
                    style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #ddd;
                        border-radius: 8px;
                        font-family: monospace;
                        font-size: 14px;
                        box-sizing: border-box;
                    "
                />
                <div style="margin-top: 8px; font-size: 13px; color: #666;">
                    Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" style="color: #3498db;">platform.openai.com/api-keys</a>
                </div>
            </div>
            
            <!-- Gmail Configuration -->
            <div style="margin-bottom: 32px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <h3 style="margin: 0; color: #2c3e50; font-size: 18px;">📧 Gmail API</h3>
                    <span style="
                        padding: 4px 12px;
                        background: ${hasGmail ? '#27ae60' : '#e74c3c'};
                        color: white;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 600;
                    ">${hasGmail ? '✓ Configured' : '⚠ Not Configured'}</span>
                </div>
                
                <label style="display: block; margin-bottom: 8px; color: #555; font-weight: 500;">
                    Credentials JSON:
                </label>
                <textarea 
                    id="gmail-credentials" 
                    placeholder='Paste your Gmail API credentials JSON here...'
                    style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #ddd;
                        border-radius: 8px;
                        font-family: monospace;
                        font-size: 12px;
                        min-height: 120px;
                        box-sizing: border-box;
                    "
                ></textarea>
                <div style="margin-top: 8px; font-size: 13px; color: #666;">
                    <div>1. Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color: #3498db;">Google Cloud Console</a></div>
                    <div>2. Create OAuth 2.0 Client ID (Desktop application)</div>
                    <div>3. Download the JSON file and paste its contents here</div>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button onclick="this.closest('[style*=fixed]').remove()" style="
                    padding: 12px 24px;
                    background: #95a5a6;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                ">Cancel</button>
                
                <button onclick="saveConfiguration()" style="
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                ">💾 Save Configuration</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus first input
    setTimeout(() => {
        document.getElementById('openai-api-key').focus();
    }, 100);
}

// Save Configuration
async function saveConfiguration() {
    const openaiKey = document.getElementById('openai-api-key').value.trim();
    const gmailCreds = document.getElementById('gmail-credentials').value.trim();
    
    if (!openaiKey && !gmailCreds) {
        alert('Please provide at least one API configuration.');
        return;
    }
    
    const configData = {};
    
    if (openaiKey) {
        configData.openai_api_key = openaiKey;
    }
    
    if (gmailCreds) {
        try {
            configData.gmail_credentials = JSON.parse(gmailCreds);
        } catch (e) {
            alert('Invalid Gmail credentials JSON format. Please check and try again.');
            return;
        }
    }
    
    try {
        const response = await fetch('/api/save_config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(configData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('✅ ' + result.message);
            document.querySelector('[style*="position: fixed"]').remove();
            
            // Ask to restart
            if (confirm('Configuration saved! Would you like to reload the application now?')) {
                window.location.reload();
            }
        } else {
            alert('❌ Error: ' + result.error);
        }
    } catch (error) {
        alert('❌ Failed to save configuration: ' + error.message);
    }
}
