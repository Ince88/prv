// Modern Chat Application
let sessionId = 'session_' + Date.now();
let currentAssistant = 'Marketing Expert';
let isProcessing = false;
let currentEmails = [];
let currentEmailAddress = '';

// Email prompts - stored in localStorage (starts empty so users can customize)
let emailPrompts = JSON.parse(localStorage.getItem('emailPrompts')) || [];

function saveEmailPrompts() {
    localStorage.setItem('emailPrompts', JSON.stringify(emailPrompts));
}

// User mapping for email context
function getUserInfo() {
    const username = window.CURRENT_USERNAME;
    
    const userMap = {
        'FNora': { fullName: 'Fülöp Nóra', email: 'nora@prv.hu' },
        'VPeter': { fullName: 'Varsányi Péter', email: 'peter@prv.hu' },
        'MIvan': { fullName: 'Moran - Villota Iván', email: 'ivan@prv.hu' },
        'CInce': { fullName: 'Czechner Ince', email: 'ince@prv.hu' }
    };
    
    // Return user info if found, otherwise default to Czechner Ince
    return userMap[username] || { fullName: 'Czechner Ince', email: 'ince@prv.hu' };
}

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
    const contactSearchBtn = document.getElementById('contact-search-btn');
    const setupBtn = document.getElementById('setup-btn');
    const emailInput = document.getElementById('email-input');
    
    // Check API configuration
    checkAPIConfiguration();
    
    // Check Gmail connection status
    checkGmailStatus();
    
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
    contactSearchBtn.addEventListener('click', openContactSearch);
    setupBtn.addEventListener('click', openSetupWizard);
    
    // Focus input
    messageInput.focus();
}

async function connectGmail() {
    const connectBtn = document.getElementById('connect-gmail-btn');
    const originalText = connectBtn.innerHTML;
    
    try {
        connectBtn.innerHTML = 'Connecting...';
        connectBtn.disabled = true;
        
        const response = await fetch('/api/gmail_auth_url');
        const data = await response.json();
        
        if (response.ok && data.auth_url) {
            // Try to open popup immediately
            const width = 600;
            const height = 700;
            const left = (screen.width / 2) - (width / 2);
            const top = (screen.height / 2) - (height / 2);
            
            const popup = window.open(
                data.auth_url,
                'GmailAuth',
                `width=${width},height=${height},left=${left},top=${top},popup=yes`
            );
            
            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                // Popup was blocked!
                if (confirm('⚠️ Popup blocked by browser!\n\nClick OK to open Gmail authorization in a new tab instead.')) {
                    window.open(data.auth_url, '_blank');
                }
            } else {
                addSystemMessage('✅ Gmail authorization window opened. Please sign in and grant access.');
                
                // Poll to check if connected
                const checkInterval = setInterval(async () => {
                    const statusResponse = await fetch('/api/gmail_status');
                    const statusData = await statusResponse.json();
                    if (statusData.connected) {
                        clearInterval(checkInterval);
                        updateGmailUI(statusData);
                        addSystemMessage('✅ Gmail connected successfully!');
                    }
                }, 2000);
            }
        } else {
            alert('Error: ' + (data.error || 'Failed to get authorization URL'));
        }
    } catch (error) {
        alert('Failed to connect Gmail: ' + error.message);
        console.error('Error:', error);
    } finally {
        connectBtn.innerHTML = originalText;
        connectBtn.disabled = false;
    }
}

function updateGmailUI(statusData) {
    const connectBtn = document.getElementById('connect-gmail-btn');
    const emailSection = connectBtn.closest('.sidebar-section');
    
    if (statusData.connected && statusData.email) {
        // Hide connect button, show connected status
        connectBtn.style.display = 'none';
        
        // Add or update connected status div
        let statusDiv = document.getElementById('gmail-status-connected');
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.id = 'gmail-status-connected';
            statusDiv.style.cssText = `
                padding: 12px;
                background: #d4edda;
                border: 1px solid #28a745;
                border-radius: 8px;
                margin-bottom: 10px;
                font-size: 13px;
            `;
            emailSection.insertBefore(statusDiv, connectBtn);
        }
        
        statusDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="color: #28a745; font-weight: 600;">✓ Gmail Connected</span>
            </div>
            <div style="color: #155724; font-size: 12px; word-break: break-all;">
                ${statusData.email}
            </div>
            <button onclick="disconnectGmail()" style="
                margin-top: 8px;
                padding: 6px 12px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                width: 100%;
            ">Disconnect</button>
        `;
    } else {
        // Show connect button
        connectBtn.style.display = 'block';
        const statusDiv = document.getElementById('gmail-status-connected');
        if (statusDiv) {
            statusDiv.remove();
        }
    }
}

async function disconnectGmail() {
    if (confirm('Disconnect Gmail? You will need to reconnect to load email history.')) {
        try {
            await fetch('/api/gmail_disconnect', { method: 'POST' });
            updateGmailUI({ connected: false });
            addSystemMessage('Gmail disconnected.');
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    }
}

async function checkGmailStatus() {
    try {
        const response = await fetch('/api/gmail_status');
        const data = await response.json();
        updateGmailUI(data);
    } catch (error) {
        console.error('Failed to check Gmail status:', error);
    }
}

async function pasteToEmailInput() {
    try {
        const text = await navigator.clipboard.readText();
        const emailInput = document.getElementById('email-input');
        emailInput.value = text.trim();
        emailInput.focus();
    } catch (err) {
        alert('Failed to read from clipboard. Please paste manually (Cmd+V or Ctrl+V).');
    }
}

async function pasteToCompanyInput() {
    try {
        const text = await navigator.clipboard.readText();
        const companyInput = document.getElementById('company-name-input');
        companyInput.value = text.trim();
        companyInput.focus();
    } catch (err) {
        alert('Nem sikerült beolvasni a vágólapról! Illeszd be manuálisan (Cmd+V vagy Ctrl+V).');
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
            
            // Remove old email prompt suggestions if exists (so new one appears at bottom)
            const oldSuggestions = document.getElementById('email-prompt-suggestions');
            if (oldSuggestions) {
                oldSuggestions.remove();
            }
            
            // Show email prompt suggestions (will appear at the bottom)
            showEmailPromptSuggestions();
            
            // Focus on message input
            const messageInput = document.getElementById('message-input');
            messageInput.placeholder = 'Type your request or use a quick prompt above...';
            messageInput.focus();
            
            // Show toast notification instead of alert
            showToast(`✅ Successfully loaded ${data.count} emails!`, 'success');
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
    
    // Get current user info from window variable
    const userInfo = getUserInfo();
    
    // Build the full prompt
    let prompt = `CONTEXT:
- User: ${userInfo.fullName} (${userInfo.email}), PRV Sales Manager
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

${userInfo.fullName.toUpperCase()}'S REQUEST:
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
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="company-name-input" style="
                        flex: 1;
                        padding: 12px;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        font-size: 14px;
                        box-sizing: border-box;
                    " placeholder="Pl.: Teszt Kft." />
                    <button onclick="pasteToCompanyInput()" style="
                        padding: 8px 16px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        white-space: nowrap;
                    ">📋 Paste</button>
                </div>
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

// ============================================================
// CONTACT SEARCH MODAL
// ============================================================

function openContactSearch() {
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
        <div style="background: #16a085; padding: 24px; border-radius: 16px 16px 0 0;">
            <h2 style="margin: 0; font-size: 24px; color: white;">👤 Kapcsolattartó Keresése</h2>
        </div>
        
        <div style="background: #d1f2eb; padding: 16px; border-bottom: 1px solid #a2d9ce;">
            <p style="margin: 0; font-size: 14px; color: #0e6655; line-height: 1.5;">
                💡 AI böngészőben nyílik meg (jobb eredmények)<br>
                Másold ki az eredményt (Ctrl+C) és kattints a '📋 Beillesztés' gombra!<br>
                💡 TIP: Perplexity MINDIG keres, ChatGPT néha offline módban van.
            </p>
        </div>
        
        <div style="padding: 24px;">
            <div style="margin-bottom: 16px;">
                <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #2d3748;">
                    Dolgozó neve:
                </label>
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="contact-name-input" style="
                        flex: 1;
                        padding: 12px;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        font-size: 14px;
                        box-sizing: border-box;
                    " placeholder="Pl.: Kiss János" />
                    <button onclick="pasteToContactName()" style="
                        padding: 8px 16px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        white-space: nowrap;
                    ">📋 Paste</button>
                </div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #2d3748;">
                    Cég neve:
                </label>
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="contact-company-input" style="
                        flex: 1;
                        padding: 12px;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        font-size: 14px;
                        box-sizing: border-box;
                    " placeholder="Pl.: Teszt Kft." />
                    <button onclick="pasteToContactCompany()" style="
                        padding: 8px 16px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        white-space: nowrap;
                    ">📋 Paste</button>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-bottom: 16px;">
                <button onclick="searchContactPerplexity()" style="
                    flex: 1;
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
                
                <button onclick="pasteContactResults()" style="
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
            
            <div id="contact-results" style="
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
                word-wrap: break-word;
                display: none;
            "></div>
            
            <div style="margin-top: 16px; display: flex; gap: 10px;">
                <button onclick="copyContactToChat()" style="
                    flex: 1;
                    padding: 12px 20px;
                    background: #27ae60;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    ✅ Chat-be
                </button>
                
                <button onclick="closeContactModal()" style="
                    flex: 1;
                    padding: 12px 20px;
                    background: #e74c3c;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    ❌ Bezárás
                </button>
            </div>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Store modal reference for closing
    window.currentContactModal = modal;
}

function searchContactPerplexity() {
    const contactName = document.getElementById('contact-name-input').value.trim();
    const companyName = document.getElementById('contact-company-input').value.trim();
    
    if (!contactName) {
        alert('Kérlek add meg a dolgozó nevét!');
        return;
    }
    
    const companyInfo = companyName ? ` cégnél: ${companyName}` : '';
    
    const prompt = `🔍 HASZNÁLD A KERESÉSI FUNKCIÓD! 🔍

Keress az interneten információt erről a személyről: ${contactName}${companyInfo}

⚠️ KRITIKUS: HASZNÁLD A SEARCH FUNKCIÓD! Keress rá Google-ön, LinkedIn-en, céges weboldalakon, szakmai portálokon!

AMIT KERESEK (csak ezeket):

👤 SZEMÉLYES ADATOK:
- Teljes név: ${contactName}
- Pozíció/titulus
- Cég: ${companyName || '[KERESD MEG!]'}
- Telefonszám (keress rá! Céges weboldal, LinkedIn, szakmai adatbázisok)
- Email cím (keress rá! Céges weboldal, LinkedIn, szakmai adatbázisok)

📱 AHOL KERESHETSZ:
1. Google keresés: "${contactName} ${companyName || ''} telefonszám email"
2. LinkedIn profil
3. Céges weboldal "Kapcsolat" vagy "Csapatunk" szekció
4. Szakmai könyvtárak, cégjegyzékek
5. Közösségi média profilok (ha releváns)

⚠️ FONTOS:
- CSAK a fenti 4 adatot keresd (név, titulus, telefonszám, email)
- NE írj hosszú leírásokat vagy életrajzot
- Ha nem találsz valamit, írd: "Nem található"
- MINDIG adj meg forrást (honnan származik az adat)

Formátum:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOLGOZÓ ADATAI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Név: [teljes név]
💼 Titulus: [pozíció]
🏢 Cég: [cégnév]
📞 Telefonszám: [szám vagy "Nem található"]
📧 Email: [email vagy "Nem található"]

📍 Forrás: [honnan származnak az adatok]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    navigator.clipboard.writeText(prompt).then(() => {
        window.open('https://www.perplexity.ai/', '_blank');
        showToast('✅ Prompt vágólapra másolva! Illeszd be Perplexity-be.', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Nem sikerült a vágólapra másolni! Próbáld újra.');
    });
}

function pasteToContactName() {
    navigator.clipboard.readText().then(text => {
        document.getElementById('contact-name-input').value = text.trim();
    }).catch(err => {
        alert('Nem sikerült beolvasni a vágólapról!');
    });
}

function pasteToContactCompany() {
    navigator.clipboard.readText().then(text => {
        document.getElementById('contact-company-input').value = text.trim();
    }).catch(err => {
        alert('Nem sikerült beolvasni a vágólapról!');
    });
}

function pasteContactResults() {
    navigator.clipboard.readText().then(text => {
        const resultsDiv = document.getElementById('contact-results');
        resultsDiv.textContent = text;
        resultsDiv.style.display = 'block';
    }).catch(err => {
        alert('Nem sikerült beolvasni a vágólapról! Győződj meg róla, hogy másoltál valamit.');
    });
}

function copyContactToChat() {
    const resultsDiv = document.getElementById('contact-results');
    const resultsText = resultsDiv.textContent;
    
    if (!resultsText || resultsText.trim() === '') {
        alert('Nincs mit bemásolni! Előbb használd a Perplexity gombot és illeszd be az eredményt.');
        return;
    }
    
    const messageInput = document.getElementById('message-input');
    messageInput.value = resultsText;
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    
    closeContactModal();
    messageInput.focus();
}

function closeContactModal() {
    if (window.currentContactModal) {
        window.currentContactModal.remove();
        window.currentContactModal = null;
    }
}

function showEmailPromptSuggestions() {
    const container = document.getElementById('messages-container');
    
    // Remove welcome message if exists
    const welcome = container.querySelector('.welcome-message');
    if (welcome) {
        welcome.remove();
    }
    
    // Remove old suggestions if exists (will be recreated at bottom)
    const oldSuggestions = document.getElementById('email-prompt-suggestions');
    if (oldSuggestions) {
        oldSuggestions.remove();
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
    
    // Generate buttons dynamically from emailPrompts array
    let buttonsHTML = '';
    
    if (emailPrompts.length === 0) {
        // Show empty state with call to action
        buttonsHTML = `
            <div style="
                padding: 32px;
                text-align: center;
                background: rgba(255,255,255,0.1);
                border-radius: 12px;
                border: 2px dashed rgba(255,255,255,0.3);
            ">
                <div style="font-size: 48px; margin-bottom: 12px;">📝</div>
                <div style="color: white; font-size: 16px; font-weight: 600; margin-bottom: 8px;">
                    Még nincsenek gyors promptjaid
                </div>
                <div style="color: rgba(255,255,255,0.8); font-size: 14px; margin-bottom: 16px;">
                    Adj hozzá gyakran használt email promptokat a gyorsabb munkához!
                </div>
                <button onclick="openManagePromptsModal()" style="
                    padding: 12px 24px;
                    background: white;
                    color: #667eea;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 14px;
                    transition: all 0.2s;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                    ➕ Első prompt hozzáadása
                </button>
            </div>
        `;
    } else {
        buttonsHTML = emailPrompts.map((prompt, index) => {
            return `
                <button onclick="useEmailPromptByIndex(${index})" style="
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
                    ${prompt.icon} ${prompt.text.length > 50 ? prompt.text.substring(0, 47) + '...' : prompt.text}
                </button>
            `;
        }).join('');
    }
    
    suggestionsDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="color: white; font-weight: 600; font-size: 16px;">
                💡 Gyors Email Promptok
            </div>
            <div style="display: flex; gap: 8px;">
                <button onclick="generateAISuggestion()" style="
                    padding: 8px 16px;
                    background: rgba(255,255,255,0.95);
                    border: 2px solid rgba(255,255,255,0.5);
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    color: #667eea;
                    transition: all 0.2s;
                    font-size: 14px;
                " onmouseover="this.style.background='white'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.95)'; this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                    🤖 AI Javaslat
                </button>
                ${emailPrompts.length > 0 ? `
                    <button onclick="openManagePromptsModal()" style="
                        padding: 8px 16px;
                        background: rgba(255,255,255,0.2);
                        border: 1px solid rgba(255,255,255,0.3);
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        color: white;
                        transition: all 0.2s;
                        font-size: 14px;
                    " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        ⚙️ Promptok kezelése
                    </button>
                ` : ''}
            </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">
            ${buttonsHTML}
        </div>
        
        ${emailPrompts.length > 0 ? `
            <div style="margin-top: 12px; padding: 12px; background: rgba(255,255,255,0.15); border-radius: 8px;">
                <div style="color: white; font-size: 13px; line-height: 1.5;">
                    💡 <strong>Tipp:</strong> Kattints egy gombra, vagy írj egyedi promptot az input mezőbe. 
                    A ChatGPT automatikusan megnyílik a teljes email kontextussal!
                </div>
            </div>
        ` : ''}
    `;
    
    container.appendChild(suggestionsDiv);
    scrollToBottom();
}

function useEmailPromptByIndex(index) {
    if (emailPrompts[index]) {
        useEmailPrompt(emailPrompts[index].text);
    }
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

function generateAISuggestion() {
    if (!currentEmails || currentEmails.length === 0) {
        showToast('❌ Nincs betöltött email history!', 'error');
        return;
    }
    
    // Detect language
    let language = "Hungarian";
    let hungarianScore = 0;
    let totalChars = 0;
    
    for (let conv of currentEmails.slice(0, 5)) {
        const body = conv.body || '';
        const hungarianChars = (body.match(/[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/g) || []).length;
        hungarianScore += hungarianChars;
        totalChars += body.length;
    }
    
    if (totalChars > 0 && (hungarianScore / totalChars) < 0.005) {
        language = "English";
    }
    
    const userInfo = getUserInfo();
    
    // Build comprehensive analysis prompt
    let prompt = `COMPREHENSIVE EMAIL ANALYSIS & RECOMMENDATION

==============================================================
CONTEXT:
==============================================================
- Your Role: AI Marketing Assistant for PRV
- Current User: ${userInfo.fullName} (${userInfo.email}), PRV Sales Manager
- Partner: ${currentEmailAddress}
- Total Emails in Thread: ${currentEmails.length}

BUSINESS MODEL:
- PRV creates corporate publications for large companies (project companies)
- The project company sends invitations to their suppliers to participate
- PRV forwards this invitation, then contacts suppliers via PHONE/EMAIL
- THIS IS WARM OUTREACH - supplier already received invitation from project company
- Suppliers PAY for their appearance (advertisement or PR article)
- Format: PRINTED and DIGITAL publication
- Benefit: visibility to project company and supply chain, business opportunities

==============================================================
COMPLETE EMAIL THREAD (${currentEmails.length} emails):
==============================================================

`;

    // Add ALL emails with full context
    currentEmails.forEach((conv, i) => {
        let body = conv.body || '';
        // Keep more content for better analysis
        if (body.length > 1500) {
            body = body.substring(0, 1500) + '... [levágva]';
        }
        
        prompt += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMAIL #${i + 1} - ${conv.direction}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dátum: ${conv.date}
Tárgy: ${conv.subject}
Feladó: ${conv.from}

Tartalom:
${body}

`;
    });
    
    prompt += `
==============================================================
YOUR TASK - PROVIDE DETAILED ANALYSIS:
==============================================================

Please analyze this ENTIRE email conversation thread and provide:

1. **HELYZETELEMZÉS (Situation Analysis)**:
   - Mi történt eddig ebben a beszélgetésben?
   - Hol tartunk most a kapcsolatfelvétel folyamatában?
   - Mutatta-e a partner érdeklődést, vagy épp hideg/közömbös?
   - Van-e még függőben lévő kérdés vagy action item?

2. **JAVASOLT EMAIL VÁLASZ**:
   - Írj egy konkrét, használatra kész email választ ${language} nyelven
   - Természetes, barátságos, de professzionális hangnem
   - Vedd figyelembe az összes eddigi email kontextust
   - Ha már volt válasz, arra reagálj
   - Ha nincs válasz, kedves follow-up
   - NE erőltesd a meetinget ha nem releváns
   - Hivatkozz a projekt cég meghívójára amikor releváns

3. **KÖVETKEZŐ LÉPÉS (Next Action)**:
   - Mit javasolsz következő lépésként?
   - Telefonhívás? Várjunk még? Email follow-up?
   - Mikor érdemes újra felvenni a kapcsolatot?
   - Van-e bármilyen red flag vagy pozitív jel?

==============================================================
IMPORTANT:
- Write the email response in ${language.toUpperCase()}
- Be context-aware - don't repeat information
- Be natural and human
- Consider the entire conversation flow
==============================================================

Please provide your analysis now!`;

    // Copy to clipboard and open ChatGPT
    navigator.clipboard.writeText(prompt).then(() => {
        window.open('https://chat.openai.com/', '_blank');
        showToast('✅ AI Javaslat prompt vágólapra másolva! Illeszd be ChatGPT-be.', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('❌ Nem sikerült a vágólapra másolni!', 'error');
    });
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

// ============================================================================
// EMAIL PROMPTS MANAGEMENT
// ============================================================================

function openManagePromptsModal() {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 700px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;
    
    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <h2 style="margin: 0; color: #2c3e50; font-size: 24px;">⚙️ Email Promptok Kezelése</h2>
            <button onclick="closeManagePromptsModal()" style="
                background: none;
                border: none;
                font-size: 28px;
                cursor: pointer;
                color: #95a5a6;
                line-height: 1;
                padding: 0;
                width: 32px;
                height: 32px;
            ">×</button>
        </div>
        
        <div id="prompts-list" style="margin-bottom: 24px;">
            <!-- Prompts will be rendered here -->
        </div>
        
        <button onclick="addNewPrompt()" style="
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(102,126,234,0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
            ➕ Új Prompt Hozzáadása
        </button>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeManagePromptsModal();
        }
    });
    
    // Render existing prompts
    renderPromptsList();
}

function closeManagePromptsModal() {
    const modal = document.querySelector('[style*="backdrop-filter: blur(5px)"]');
    if (modal) {
        modal.remove();
    }
    
    // Refresh the email prompt suggestions if they exist
    const existingSuggestions = document.getElementById('email-prompt-suggestions');
    if (existingSuggestions) {
        existingSuggestions.remove();
        showEmailPromptSuggestions();
    }
}

function renderPromptsList() {
    const promptsList = document.getElementById('prompts-list');
    if (!promptsList) return;
    
    promptsList.innerHTML = emailPrompts.map((prompt, index) => `
        <div style="
            background: #f8f9fa;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            border: 2px solid #e9ecef;
        ">
            <div style="display: flex; gap: 12px; align-items: start;">
                <div style="position: relative;">
                    <input 
                        type="text" 
                        id="icon-input-${index}"
                        value="${prompt.icon}" 
                        onchange="updatePromptIcon(${index}, this.value)"
                        onclick="showEmojiPicker(${index})"
                        readonly
                        style="
                            width: 50px;
                            padding: 8px;
                            border: 1px solid #dee2e6;
                            border-radius: 8px;
                            font-size: 20px;
                            text-align: center;
                            cursor: pointer;
                        "
                        placeholder="🎯"
                        title="Kattints az emoji választásához"
                    />
                </div>
                <textarea 
                    id="prompt-text-${index}"
                    onchange="updatePromptText(${index}, this.value)"
                    onfocus="if(this.value === 'Új prompt szövege...') this.value = ''"
                    style="
                        flex: 1;
                        padding: 8px 12px;
                        border: 1px solid #dee2e6;
                        border-radius: 8px;
                        font-size: 14px;
                        font-family: inherit;
                        resize: vertical;
                        min-height: 60px;
                    "
                    placeholder="Prompt szövege..."
                >${prompt.text}</textarea>
                <button 
                    onclick="deletePrompt(${index})"
                    style="
                        background: #e74c3c;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        padding: 8px 16px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.2s;
                    "
                    onmouseover="this.style.background='#c0392b'"
                    onmouseout="this.style.background='#e74c3c'"
                >🗑️</button>
            </div>
        </div>
    `).join('');
}

function addNewPrompt() {
    const newId = emailPrompts.length > 0 ? Math.max(...emailPrompts.map(p => p.id)) + 1 : 1;
    emailPrompts.push({
        id: newId,
        icon: '💡',
        text: 'Új prompt szövege...'
    });
    saveEmailPrompts();
    renderPromptsList();
}

function updatePromptIcon(index, newIcon) {
    if (emailPrompts[index]) {
        emailPrompts[index].icon = newIcon;
        saveEmailPrompts();
    }
}

function updatePromptText(index, newText) {
    if (emailPrompts[index]) {
        emailPrompts[index].text = newText;
        saveEmailPrompts();
    }
}

function deletePrompt(index) {
    if (confirm('Biztosan törölni szeretnéd ezt a promptot?')) {
        emailPrompts.splice(index, 1);
        saveEmailPrompts();
        renderPromptsList();
    }
}

function showEmojiPicker(index) {
    // Common emojis for quick selection
    const commonEmojis = [
        '📧', '💰', '🔄', '📞', '📄', '⏰', 
        '✅', '❌', '💡', '🎯', '🚀', '📊', 
        '💬', '📝', '🎉', '👍', '❤️', '⭐'
    ];
    
    // Remove existing picker if any
    const existingPicker = document.getElementById('emoji-picker');
    if (existingPicker) {
        existingPicker.remove();
    }
    
    // Create emoji picker
    const picker = document.createElement('div');
    picker.id = 'emoji-picker';
    picker.style.cssText = `
        position: fixed;
        background: white;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 100001;
        width: 280px;
        border: 2px solid #667eea;
        max-height: 400px;
        overflow-y: auto;
    `;
    
    // Position near the icon input - better positioning logic
    const iconInput = document.getElementById('icon-input-' + index);
    if (iconInput) {
        const rect = iconInput.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Calculate best position
        let left = rect.left;
        let top = rect.bottom + 10;
        
        // Adjust if picker goes off-screen horizontally
        if (left + 280 > viewportWidth) {
            left = viewportWidth - 280 - 20; // 20px margin
        }
        
        // Adjust if picker goes off-screen vertically (position above instead)
        if (top + 400 > viewportHeight) {
            top = rect.top - 410; // Position above the input
            if (top < 10) {
                // If still not enough space, center vertically
                top = (viewportHeight - 400) / 2;
            }
        }
        
        picker.style.left = Math.max(10, left) + 'px';
        picker.style.top = Math.max(10, top) + 'px';
    }
    
    picker.innerHTML = `
        <div style="margin-bottom: 12px; color: #2c3e50; font-weight: 600; font-size: 14px;">
            Válassz emojit:
        </div>
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px;">
            ${commonEmojis.map(emoji => `
                <button onclick="selectEmoji(${index}, '${emoji}')" style="
                    padding: 6px;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    background: white;
                    cursor: pointer;
                    font-size: 20px;
                    transition: all 0.15s;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                " onmouseover="this.style.background='#f8f9fa'; this.style.transform='scale(1.15)'" onmouseout="this.style.background='white'; this.style.transform='scale(1)'">
                    ${emoji}
                </button>
            `).join('')}
        </div>
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e9ecef;">
            <input 
                type="text" 
                placeholder="Vagy írj be egyet..."
                onkeyup="if(event.key === 'Enter' && this.value.trim()) selectEmoji(${index}, this.value)"
                style="
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    font-size: 14px;
                    box-sizing: border-box;
                "
            />
        </div>
        <button onclick="closeEmojiPicker()" style="
            margin-top: 8px;
            width: 100%;
            padding: 8px;
            background: #e9ecef;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            color: #495057;
            font-weight: 500;
        " onmouseover="this.style.background='#dee2e6'" onmouseout="this.style.background='#e9ecef'">
            Bezárás
        </button>
    `;
    
    document.body.appendChild(picker);
    
    // Close picker when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeOnClickOutside(e) {
            if (!picker.contains(e.target) && e.target !== iconInput) {
                picker.remove();
                document.removeEventListener('click', closeOnClickOutside);
            }
        });
    }, 100);
}

function selectEmoji(index, emoji) {
    if (emailPrompts[index]) {
        emailPrompts[index].icon = emoji.trim();
        saveEmailPrompts();
        renderPromptsList();
    }
    closeEmojiPicker();
}

function closeEmojiPicker() {
    const picker = document.getElementById('emoji-picker');
    if (picker) {
        picker.remove();
    }
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Color schemes for different types
    const colors = {
        success: { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: 'white' },
        error: { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', text: 'white' },
        info: { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', text: 'white' },
        warning: { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', text: 'white' }
    };
    
    const color = colors[type] || colors.info;
    
    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${color.bg};
        color: ${color.text};
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        z-index: 100000;
        font-weight: 500;
        font-size: 15px;
        max-width: 400px;
        animation: slideInRight 0.4s ease-out, fadeOut 0.4s ease-in 2.6s;
        pointer-events: auto;
        cursor: pointer;
    `;
    toast.textContent = message;
    
    // Click to dismiss
    toast.addEventListener('click', () => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    });
    
    document.body.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.4s ease-out';
            setTimeout(() => toast.remove(), 400);
        }
    }, 3000);
}

// Add CSS animations if not already present
if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}
