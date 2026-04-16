/**
 * Hitech Steel Industries - Professional Chat Widget
 * Complete HTML/CSS/JS implementation with streaming chat
 *
 * Usage: <script src="widget.js" data-api-url="https://your-api.com"></script>
 */

(function() {
  'use strict';

  // ============================================
  // Configuration
  // ============================================
  const CONFIG = {
    apiUrl: document.currentScript?.getAttribute('data-api-url') || window.HITECH_CHAT_API_URL || 'http://localhost:3000',
    primaryColor: '#E30613',
    secondaryColor: '#003087',
    position: 'bottom-right',
    companyName: 'Hitech Steel Industries',
    botName: 'Hitech Assistant',
    welcomeMessage: 'Hello! Welcome to Hitech Steel Industries. I\'m here to help you with information about our steel products, services, and answer any questions you may have.',
    leadFormTitle: 'Get Started',
    leadFormSubtitle: 'Please provide your details so we can assist you better.',
    privacyText: 'By submitting, you agree to our privacy policy. Your information is secure and will only be used to assist with your inquiry.',
    showTalkToHuman: true,
    sessionTTL: 24 * 60 * 60 * 1000, // 24 hours
    maxRetries: 3,
    retryDelay: 1000
  };

  // ============================================
  // State Management
  // ============================================
  const state = {
    isOpen: false,
    currentScreen: 'form', // 'form' or 'chat'
    sessionId: null,
    leadInfo: null,
    messages: [],
    isTyping: false,
    hasSubmittedLead: false,
    conversationStarted: false,
    isSubmitting: false
  };

  // ============================================
  // DOM Elements Cache
  // ============================================
  let elements = {};

  // ============================================
  // Session Persistence (localStorage)
  // ============================================
  const SESSION_KEY = 'hitech_chat_session';

  function saveSession() {
    if (!state.sessionId || !state.leadInfo) return;

    const sessionData = {
      sessionId: state.sessionId,
      leadInfo: state.leadInfo,
      messages: state.messages,
      hasSubmittedLead: state.hasSubmittedLead,
      currentScreen: state.currentScreen,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      console.log('💾 Session saved:', state.sessionId);
    } catch (e) {
      console.warn('Failed to save session:', e);
    }
  }

  function loadSession() {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (!saved) return false;

      const sessionData = JSON.parse(saved);

      // Check if session is expired
      const age = Date.now() - (sessionData.timestamp || 0);
      if (age > CONFIG.sessionTTL) {
        console.log('⏰ Session expired, clearing...');
        clearSession();
        return false;
      }

      // Restore session state
      state.sessionId = sessionData.sessionId;
      state.leadInfo = sessionData.leadInfo;
      state.messages = sessionData.messages || [];
      state.hasSubmittedLead = sessionData.hasSubmittedLead || false;
      state.currentScreen = sessionData.currentScreen || 'form';

      console.log('📂 Session restored:', state.sessionId);
      return true;
    } catch (e) {
      console.warn('Failed to load session:', e);
      return false;
    }
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.warn('Failed to clear session:', e);
    }
    Object.assign(state, {
      sessionId: null,
      leadInfo: null,
      messages: [],
      hasSubmittedLead: false,
      currentScreen: 'form',
      isTyping: false,
      conversationStarted: false
    });
  }

  // ============================================
  // Utility Functions
  // ============================================
  function formatTime(date = new Date()) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  function validatePhone(phone) {
    const cleaned = phone.replace(/[\s\-().+]/g, '');
    return /^\d{7,15}$/.test(cleaned);
  }

  function formatPhone(phone) {
    const cleaned = phone.replace(/[\s\-().]/g, '');
    if (cleaned.startsWith('0') && !cleaned.startsWith('00')) {
      return '+966' + cleaned.slice(1);
    }
    if (!cleaned.startsWith('+')) {
      return '+' + cleaned;
    }
    return cleaned;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showError(input, message) {
    const group = input.closest('.hitech-form-group');
    const errorEl = group.querySelector('.hitech-form-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
    input.classList.add('error');
  }

  function clearError(input) {
    const group = input.closest('.hitech-form-group');
    const errorEl = group.querySelector('.hitech-form-error');
    if (errorEl) {
      errorEl.classList.remove('visible');
    }
    input.classList.remove('error');
  }

  function scrollToBottom() {
    if (elements.messages) {
      elements.messages.scrollTop = elements.messages.scrollHeight;
    }
  }

  // ============================================
  // API Functions
  // ============================================
  async function apiRequest(endpoint, data = null, options = {}) {
    const url = `${CONFIG.apiUrl}${endpoint}`;
    const config = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      ...options
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
      try {
        const response = await fetch(url, config);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        if (attempt === CONFIG.maxRetries) {
          throw error;
        }
        console.warn(`API attempt ${attempt} failed, retrying...`, error.message);
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay * attempt));
      }
    }
  }

  async function submitLead(formData) {
    const leadData = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formatPhone(formData.phone.trim()),
      company: formData.company.trim(),
      inquiryType: formData.inquiryType
    };

    const result = await apiRequest('/api/lead', leadData);
    return result;
  }

  async function sendMessage(message) {
    if (!state.sessionId) throw new Error('No active session');

    const response = await fetch(`${CONFIG.apiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: state.sessionId, message })
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response;
  }

  async function escalateToHuman() {
    if (!state.sessionId) throw new Error('No active session');

    await apiRequest('/api/talk-to-human', {
      sessionId: state.sessionId,
      notes: 'Customer requested human agent from widget'
    });
  }

  // ============================================
  // UI Functions
  // ============================================
  function createElement(tag, classes = [], attributes = {}) {
    const element = document.createElement(tag);
    if (classes.length) element.className = classes.join(' ');
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  }

  function createForm() {
    const form = createElement('div', ['hitech-chat-form']);

    form.innerHTML = `
      <div class="hitech-chat-form-header">
        <h2>${CONFIG.leadFormTitle}</h2>
        <p>${CONFIG.leadFormSubtitle}</p>
      </div>

      <form id="hitech-lead-form">
        <div class="hitech-form-group">
          <label class="hitech-form-label required">Full Name</label>
          <input type="text" name="fullName" class="hitech-form-input" placeholder="Enter your full name" required>
          <div class="hitech-form-error"></div>
        </div>

        <div class="hitech-form-group">
          <label class="hitech-form-label required">Email Address</label>
          <input type="email" name="email" class="hitech-form-input" placeholder="your@email.com" required>
          <div class="hitech-form-error"></div>
        </div>

        <div class="hitech-form-group">
          <label class="hitech-form-label required">Phone Number</label>
          <input type="tel" name="phone" class="hitech-form-input" placeholder="+966 5xxxxxxxx" required>
          <div class="hitech-form-error"></div>
        </div>

        <div class="hitech-form-group">
          <label class="hitech-form-label">Company Name</label>
          <input type="text" name="company" class="hitech-form-input" placeholder="Your company name">
        </div>

        <div class="hitech-form-group">
          <label class="hitech-form-label">Inquiry Type</label>
          <select name="inquiryType" class="hitech-form-select">
            <option value="">Select inquiry type</option>
            <option value="Product Information">Product Information</option>
            <option value="Pricing Quote">Pricing Quote</option>
            <option value="Technical Support">Technical Support</option>
            <option value="Partnership">Partnership</option>
            <option value="Careers">Careers</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <button type="submit" class="hitech-form-submit" id="hitech-form-submit">
          <span>Start Conversation</span>
        </button>

        <p class="hitech-form-privacy">${CONFIG.privacyText}</p>
      </form>
    `;

    return form;
  }

  function createMessageElement(content, isUser = false, timestamp = null) {
    const messageDiv = createElement('div', ['hitech-message', isUser ? 'user' : 'bot']);

    const avatar = createElement('div', ['hitech-message-avatar']);
    avatar.innerHTML = isUser ? '👤' : '🤖';

    const contentDiv = createElement('div', ['hitech-message-content']);
    contentDiv.innerHTML = content;

    const timeDiv = createElement('div', ['hitech-message-time']);
    timeDiv.textContent = timestamp || formatTime();

    messageDiv.appendChild(isUser ? contentDiv : avatar);
    messageDiv.appendChild(isUser ? avatar : contentDiv);
    messageDiv.appendChild(timeDiv);

    return messageDiv;
  }

  function createTypingIndicator() {
    const typing = createElement('div', ['hitech-message', 'bot']);
    typing.id = 'hitech-typing-indicator';

    const avatar = createElement('div', ['hitech-message-avatar']);
    avatar.innerHTML = '🤖';

    const content = createElement('div', ['hitech-message-content']);
    content.innerHTML = `
      <div class="hitech-typing">
        <div class="hitech-typing-dot"></div>
        <div class="hitech-typing-dot"></div>
        <div class="hitech-typing-dot"></div>
      </div>
    `;

    typing.appendChild(avatar);
    typing.appendChild(content);

    return typing;
  }

  function createChatInterface() {
    const chatDiv = createElement('div', ['hitech-chat-messages']);
    elements.messages = chatDiv;

    // Add welcome message
    const welcome = createElement('div', ['hitech-chat-welcome']);
    welcome.innerHTML = `
      <h3>Welcome to ${CONFIG.companyName}!</h3>
      <p>${CONFIG.welcomeMessage}</p>
    `;
    chatDiv.appendChild(welcome);

    // Restore messages if any
    state.messages.forEach(msg => {
      const msgEl = createMessageElement(msg.content, msg.isUser, msg.timestamp);
      chatDiv.appendChild(msgEl);
    });

    return chatDiv;
  }

  function createInputArea() {
    const inputArea = createElement('div', ['hitech-chat-input-area']);

    inputArea.innerHTML = `
      <div class="hitech-chat-input-wrapper">
        <textarea class="hitech-chat-input" id="hitech-chat-input" placeholder="Type your message..." rows="1"></textarea>
      </div>
      <button class="hitech-chat-send" id="hitech-chat-send">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    `;

    return inputArea;
  }

  function createTalkToHuman() {
    const talkDiv = createElement('div', ['hitech-talk-human']);

    talkDiv.innerHTML = `
      <button class="hitech-talk-human-btn" id="hitech-talk-human-btn">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <span>Talk to Human</span>
      </button>
    `;

    return talkDiv;
  }

  function createChatPanel() {
    const panel = createElement('div', ['hitech-chat-panel']);
    elements.panel = panel;

    // Header
    const header = createElement('div', ['hitech-chat-header']);

    header.innerHTML = `
      <div class="hitech-chat-header-info">
        <div class="hitech-chat-logo">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <div class="hitech-chat-header-text">
          <h3>${CONFIG.botName}</h3>
          <p>Online — Usually replies instantly</p>
        </div>
      </div>
      <button class="hitech-chat-close" id="hitech-chat-close">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    `;

    // Content
    const content = createElement('div', ['hitech-chat-content']);
    elements.content = content;

    // Add form or chat based on state
    if (state.currentScreen === 'form') {
      content.appendChild(createForm());
    } else {
      content.appendChild(createChatInterface());
      content.appendChild(createInputArea());
      if (CONFIG.showTalkToHuman) {
        content.appendChild(createTalkToHuman());
      }
    }

    panel.appendChild(header);
    panel.appendChild(content);

    return panel;
  }

  function createChatButton() {
    const button = createElement('button', ['hitech-chat-button']);
    elements.button = button;

    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    `;

    button.addEventListener('click', toggleChat);
    return button;
  }

  // ============================================
  // Event Handlers
  // ============================================
  function toggleChat() {
    state.isOpen = !state.isOpen;
    const panel = elements.panel;
    const button = elements.button;

    if (state.isOpen) {
      panel.classList.add('open');
      button.style.display = 'none';

      // Focus on input if in chat mode
      if (state.currentScreen === 'chat' && elements.input) {
        setTimeout(() => elements.input.focus(), 300);
      }
    } else {
      panel.classList.remove('open');
      button.style.display = 'flex';
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    if (state.isSubmitting) return;

    const formData = new FormData(e.target);
    const leadData = {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      company: formData.get('company'),
      inquiryType: formData.get('inquiryType')
    };

    // Validate form
    let isValid = true;
    const inputs = e.target.querySelectorAll('input[required], select[required]');

    inputs.forEach(input => {
      clearError(input);

      if (!input.value.trim()) {
        showError(input, 'This field is required');
        isValid = false;
        return;
      }

      if (input.name === 'email' && !validateEmail(input.value)) {
        showError(input, 'Please enter a valid email address');
        isValid = false;
      }

      if (input.name === 'phone' && !validatePhone(input.value)) {
        showError(input, 'Please enter a valid phone number');
        isValid = false;
      }
    });

    if (!isValid) return;

    // Submit form
    submitForm(leadData);
  }

  async function submitForm(leadData) {
    const submitBtn = elements.submitBtn;
    const originalText = submitBtn.innerHTML;

    state.isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="hitech-form-spinner"></div> <span>Starting...</span>';

    try {
      const result = await submitLead(leadData);

      if (result.success) {
        state.sessionId = result.sessionId;
        state.leadInfo = leadData;
        state.hasSubmittedLead = true;
        state.currentScreen = 'chat';

        // Save session
        saveSession();

        // Transition to chat
        switchToChat();

        submitBtn.innerHTML = '✓ Success!';
        submitBtn.style.background = '#34A853';

        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          submitBtn.style.background = '';
        }, 2000);

      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      alert('Failed to start chat: ' + error.message);
    } finally {
      state.isSubmitting = false;
    }
  }

  function switchToChat() {
    const content = elements.content;
    content.innerHTML = '';

    // Add chat interface
    content.appendChild(createChatInterface());
    content.appendChild(createInputArea());
    if (CONFIG.showTalkToHuman) {
      content.appendChild(createTalkToHuman());
    }

    // Setup chat event listeners
    setupChatListeners();

    // Add welcome message if first time
    if (!state.conversationStarted) {
      addMessage(CONFIG.welcomeMessage, false);
      state.conversationStarted = true;
    }
  }

  function setupChatListeners() {
    // Input handling
    elements.input = document.getElementById('hitech-chat-input');
    elements.sendBtn = document.getElementById('hitech-chat-send');
    elements.talkHumanBtn = document.getElementById('hitech-talk-human-btn');

    if (elements.input) {
      elements.input.addEventListener('input', handleInputResize);
      elements.input.addEventListener('keydown', handleInputKeydown);
    }

    if (elements.sendBtn) {
      elements.sendBtn.addEventListener('click', handleSendMessage);
    }

    if (elements.talkHumanBtn) {
      elements.talkHumanBtn.addEventListener('click', handleTalkToHuman);
    }
  }

  function handleInputResize(e) {
    const input = e.target;
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  }

  function handleInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  async function handleSendMessage() {
    const input = elements.input;
    const message = input.value.trim();

    if (!message || state.isTyping) return;

    // Add user message
    addMessage(message, true);
    input.value = '';
    input.style.height = 'auto';

    // Show typing indicator
    showTypingIndicator();

    try {
      const response = await sendMessage(message);
      await handleStreamingResponse(response);
    } catch (error) {
      console.error('Message error:', error);
      hideTypingIndicator();
      addMessage('I apologize, but I\'m having trouble responding right now. Please try again or click "Talk to Human" for assistance.', false);
    }
  }

  async function handleStreamingResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    hideTypingIndicator();

    // Add bot message placeholder
    const botMessageEl = addMessage('', false);
    const contentDiv = botMessageEl.querySelector('.hitech-message-content');

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                fullResponse += data.chunk;
                contentDiv.innerHTML = escapeHtml(fullResponse);
                scrollToBottom();
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      contentDiv.innerHTML = 'Sorry, I encountered an error. Please try again.';
    }

    // Store the message
    if (fullResponse) {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage && !lastMessage.isUser) {
        lastMessage.content = fullResponse;
      }
      saveSession();
    }
  }

  async function handleTalkToHuman() {
    const confirmed = confirm('Would you like to speak with a human representative? We\'ll forward your conversation to our team.');

    if (!confirmed) return;

    try {
      await escalateToHuman();

      addMessage('✅ Your request has been forwarded to our team. A representative will contact you shortly. Thank you for your patience!', false);

      // Provide WhatsApp link
      const whatsappMessage = encodeURIComponent(`Hi, I was chatting with your AI assistant and need to speak with a human. My details: ${state.leadInfo.fullName}, ${state.leadInfo.email}, ${state.leadInfo.phone}`);
      const whatsappUrl = `https://wa.me/966123456789?text=${whatsappMessage}`;

      setTimeout(() => {
        addMessage(`Alternatively, you can contact us directly via WhatsApp: <a href="${whatsappUrl}" target="_blank" style="color: #E30613;">Click here to WhatsApp us</a>`, false);
      }, 1000);

      // Disable chat
      if (elements.input) elements.input.disabled = true;
      if (elements.sendBtn) elements.sendBtn.disabled = true;
      if (elements.talkHumanBtn) {
        elements.talkHumanBtn.disabled = true;
        elements.talkHumanBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>Request Sent</span>
        `;
      }

    } catch (error) {
      console.error('Escalation error:', error);
      addMessage('Could not connect right now. Please contact us directly via email or phone.', false);
    }
  }

  function addMessage(content, isUser = false) {
    const message = {
      content,
      isUser,
      timestamp: formatTime()
    };

    state.messages.push(message);

    if (elements.messages) {
      const messageEl = createMessageElement(content, isUser, message.timestamp);
      elements.messages.appendChild(messageEl);
      scrollToBottom();
    }

    return message;
  }

  function showTypingIndicator() {
    state.isTyping = true;
    if (elements.messages) {
      const typingEl = createTypingIndicator();
      elements.messages.appendChild(typingEl);
      scrollToBottom();
    }
  }

  function hideTypingIndicator() {
    state.isTyping = false;
    const typingEl = document.getElementById('hitech-typing-indicator');
    if (typingEl) {
      typingEl.remove();
    }
  }

  // ============================================
  // Initialization
  // ============================================
  function init() {
    // Check for existing session
    const hasSession = loadSession();

    // Create widget container
    const container = document.getElementById('hitech-chat-widget') || createElement('div', ['hitech-chat-widget']);
    if (!container.id) container.id = 'hitech-chat-widget';
    document.body.appendChild(container);

    // Create button
    const button = createChatButton();
    container.appendChild(button);

    // Create panel
    const panel = createChatPanel();
    container.appendChild(panel);

    // Setup form listeners if in form mode
    if (state.currentScreen === 'form') {
      setupFormListeners();
    } else {
      setupChatListeners();
    }

    // Setup close button
    const closeBtn = document.getElementById('hitech-chat-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', toggleChat);
    }

    console.log('🚀 Hitech Chat Widget initialized');
  }

  function setupFormListeners() {
    const form = document.getElementById('hitech-lead-form');
    elements.submitBtn = document.getElementById('hitech-form-submit');

    if (form) {
      form.addEventListener('submit', handleFormSubmit);

      // Real-time validation
      const inputs = form.querySelectorAll('input[required]');
      inputs.forEach(input => {
        input.addEventListener('blur', () => {
          clearError(input);
          if (!input.value.trim()) {
            showError(input, 'This field is required');
          } else if (input.name === 'email' && !validateEmail(input.value)) {
            showError(input, 'Please enter a valid email address');
          } else if (input.name === 'phone' && !validatePhone(input.value)) {
            showError(input, 'Please enter a valid phone number');
          }
        });

        input.addEventListener('input', () => {
          if (input.classList.contains('error')) {
            clearError(input);
          }
        });
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual control
  window.HitechChatWidget = {
    open: () => {
      if (!state.isOpen) toggleChat();
    },
    close: () => {
      if (state.isOpen) toggleChat();
    },
    clearSession: clearSession
  };

})();
    
    // Reset state
    state.sessionId = null;
    state.leadInfo = null;
    state.messages = [];
    state.hasSubmittedLead = false;
    state.conversationStarted = false;
  }

  function updateSessionMessages() {
    // Update saved messages without changing timestamp
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const sessionData = JSON.parse(saved);
        sessionData.messages = state.messages;
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      }
    } catch (e) {
      console.warn('Failed to update session messages:', e);
    }
  }

  // ============================================
  // SVG Icons
  // ============================================
  const ICONS = {
    chat: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`,
    send: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>`,
    user: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`,
    bot: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`,
    logo: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>`,
    phone: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`,
    arrowDown: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>`
  };

  // ============================================
  // Utility Functions
  // ============================================
  function createElement(tag, className, innerHTML) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (innerHTML) el.innerHTML = innerHTML;
    return el;
  }

  function formatTime(date = new Date()) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  function validateSaudiPhone(phone) {
    const cleaned = phone.replace(/\s/g, '');
    const saudiRegex = /^(\+966|966|0)?5\d{8}$/;
    return saudiRegex.test(cleaned);
  }

  function formatSaudiPhone(phone) {
    const cleaned = phone.replace(/\s/g, '').replace(/^0/, '');
    if (cleaned.startsWith('966')) {
      return '+' + cleaned;
    }
    return '+966' + cleaned;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // API Functions
  // ============================================
  async function submitLead(leadData) {
    try {
      const response = await fetch(`${CONFIG.apiUrl}/api/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `Server error: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }
      throw error;
    }
  }

  async function sendMessage(message) {
    try {
      const response = await fetch(`${CONFIG.apiUrl}/api/chat/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: state.sessionId, message })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `Server error: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to server.');
      }
      throw error;
    }
  }

  async function talkToHuman(notes = '') {
    try {
      const response = await fetch(`${CONFIG.apiUrl}/api/talk-to-human`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: state.sessionId, notes })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `Server error: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to server.');
      }
      throw error;
    }
  }

  // ============================================
  // UI Components
  // ============================================
  function createChatButton() {
    const button = createElement('button', 'hitech-chat-button');
    button.innerHTML = `
      <span class="chat-icon">${ICONS.chat}</span>
      <span class="close-icon">${ICONS.close}</span>
    `;
    button.setAttribute('aria-label', 'Open chat');
    return button;
  }

  function createChatContainer() {
    const container = createElement('div', 'hitech-chat-container');
    return container;
  }

  function createHeader() {
    const header = createElement('div', 'hitech-chat-header');
    header.innerHTML = `
      <div class="hitech-chat-header-avatar">${ICONS.logo}</div>
      <div class="hitech-chat-header-info">
        <h3 class="hitech-chat-header-title">${CONFIG.botName}</h3>
        <div class="hitech-chat-header-status">Online</div>
      </div>
      <button class="hitech-chat-header-close" aria-label="Close chat">${ICONS.close}</button>
    `;
    return header;
  }

  function createLeadForm() {
    const form = createElement('div', 'hitech-lead-form');
    form.innerHTML = `
      <div class="hitech-lead-form-header">
        <div class="hitech-lead-form-logo">${ICONS.logo}</div>
        <h2 class="hitech-lead-form-title">${CONFIG.leadFormTitle}</h2>
        <p class="hitech-lead-form-subtitle">${CONFIG.leadFormSubtitle}</p>
      </div>
      <form id="hitech-lead-form">
        <div class="hitech-form-group">
          <label class="hitech-form-label hitech-form-label-required">Full Name</label>
          <input type="text" name="fullName" class="hitech-form-input" placeholder="Enter your full name" required>
          <div class="hitech-form-error" style="display: none;"></div>
        </div>
        <div class="hitech-form-group">
          <label class="hitech-form-label hitech-form-label-required">Email Address</label>
          <input type="email" name="email" class="hitech-form-input" placeholder="your@email.com" required>
          <div class="hitech-form-error" style="display: none;"></div>
        </div>
        <div class="hitech-form-group">
          <label class="hitech-form-label hitech-form-label-required">Phone Number</label>
          <input type="tel" name="phone" class="hitech-form-input" placeholder="+966 5xxxxxxxx" required>
          <div class="hitech-form-error" style="display: none;"></div>
        </div>
        <div class="hitech-form-group">
          <label class="hitech-form-label">Company (Optional)</label>
          <input type="text" name="company" class="hitech-form-input" placeholder="Your company name">
        </div>
        <div class="hitech-form-group">
          <label class="hitech-form-label">Inquiry Type</label>
          <select name="inquiryType" class="hitech-form-select">
            <option value="">Select inquiry type</option>
            <option value="Product Information">Product Information</option>
            <option value="Pricing Quote">Pricing Quote</option>
            <option value="Technical Support">Technical Support</option>
            <option value="Partnership">Partnership</option>
            <option value="Careers">Careers</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <button type="submit" class="hitech-form-submit">
          <span>Start Conversation</span>
        </button>
        <p class="hitech-form-privacy">${CONFIG.privacyText}</p>
      </form>
    `;
    return form;
  }

  function createMessagesArea() {
    const area = createElement('div', 'hitech-chat-messages');
    return area;
  }

  function createWelcomeMessage() {
    const welcome = createElement('div', 'hitech-welcome-message hitech-fade-in');
    welcome.innerHTML = `
      <h4 class="hitech-welcome-message-title">Welcome to ${CONFIG.companyName}!</h4>
      <p class="hitech-welcome-message-text">${CONFIG.welcomeMessage}</p>
    `;
    return welcome;
  }

  function createTypingIndicator() {
    const typing = createElement('div', 'hitech-message bot');
    typing.innerHTML = `
      <div class="hitech-message-avatar">${ICONS.bot}</div>
      <div class="hitech-message-content">
        <div class="hitech-typing">
          <div class="hitech-typing-dot"></div>
          <div class="hitech-typing-dot"></div>
          <div class="hitech-typing-dot"></div>
        </div>
      </div>
    `;
    return typing;
  }

  function createMessageBubble(content, isUser = false) {
    const message = createElement('div', `hitech-message ${isUser ? 'user' : 'bot'} hitech-fade-in`);
    const time = formatTime();
    
    // Convert URLs to links
    const linkedContent = content.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    message.innerHTML = `
      <div class="hitech-message-avatar">${isUser ? ICONS.user : ICONS.bot}</div>
      <div>
        <div class="hitech-message-content">${linkedContent}</div>
        <div class="hitech-message-time">${time}</div>
      </div>
    `;
    return message;
  }

  function createInputArea() {
    const area = createElement('div', 'hitech-chat-input-area');
    area.innerHTML = `
      <div class="hitech-chat-input-wrapper">
        <textarea 
          class="hitech-chat-input" 
          placeholder="Type your message..." 
          rows="1"
          maxlength="1000"
        ></textarea>
      </div>
      <button class="hitech-chat-send" aria-label="Send message">
        ${ICONS.send}
      </button>
    `;
    return area;
  }

  function createTalkToHumanButton() {
    const container = createElement('div', 'hitech-talk-human');
    container.innerHTML = `
      <button class="hitech-talk-human-btn">
        ${ICONS.phone}
        <span>Talk to Human</span>
      </button>
    `;
    return container;
  }

  // ============================================
  // Widget Builder
  // ============================================
  function buildWidget() {
    const widget = createElement('div', 'hitech-chat-widget');
    
    // Create button
    const button = createChatButton();
    
    // Create container
    const container = createChatContainer();
    const header = createHeader();
    
    container.appendChild(header);
    
    // Store references
    widget.button = button;
    widget.container = container;
    widget.header = header;
    
    // Append to body
    widget.appendChild(button);
    widget.appendChild(container);
    document.body.appendChild(widget);
    
    return widget;
  }

  // ============================================
  // Event Handlers
  // ============================================
  function setupEventListeners(widget) {
    // Toggle chat
    widget.button.addEventListener('click', () => toggleChat(widget));
    
    // Close button in header
    widget.header.querySelector('.hitech-chat-header-close').addEventListener('click', () => {
      closeChat(widget);
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.isOpen) {
        closeChat(widget);
      }
    });
  }

  function toggleChat(widget) {
    if (state.isOpen) {
      closeChat(widget);
    } else {
      openChat(widget);
    }
  }

  function openChat(widget) {
    state.isOpen = true;
    widget.button.classList.add('active');
    widget.container.classList.add('active');
    widget.button.setAttribute('aria-label', 'Close chat');
    
    // Initialize chat if first time
    if (!state.conversationStarted) {
      initializeChat(widget);
    }
  }

  function closeChat(widget) {
    state.isOpen = false;
    widget.button.classList.remove('active');
    widget.container.classList.remove('active');
    widget.button.setAttribute('aria-label', 'Open chat');
  }

  function initializeChat(widget) {
    // Try to restore existing session first
    const hasExistingSession = loadSession();
    
    // Clear container except header
    const header = widget.container.querySelector('.hitech-chat-header');
    widget.container.innerHTML = '';
    widget.container.appendChild(header);
    
    if (!state.hasSubmittedLead) {
      // Show lead form
      showLeadForm(widget);
    } else {
      // Show chat interface with welcome back message
      showChatInterface(widget, hasExistingSession);
    }
    
    // Re-attach close button listener
    header.querySelector('.hitech-chat-header-close').addEventListener('click', () => {
      closeChat(widget);
    });
  }

  function showLeadForm(widget) {
    const leadForm = createLeadForm();
    widget.container.appendChild(leadForm);
    
    // Setup form submission
    const form = leadForm.querySelector('form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleLeadSubmit(widget, form);
    });
    
    // Real-time validation
    setupFormValidation(form);
  }

  function setupFormValidation(form) {
    const inputs = form.querySelectorAll('input[required]');
    
    inputs.forEach(input => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => clearError(input));
    });
    
    // Phone validation
    const phoneInput = form.querySelector('input[name="phone"]');
    phoneInput?.addEventListener('blur', () => {
      const phone = phoneInput.value.trim();
      if (phone && !validateSaudiPhone(phone)) {
        showError(phoneInput, 'Please enter a valid Saudi phone number (e.g., +966 5xxxxxxxx)');
      }
    });
  }

  function validateField(input) {
    const value = input.value.trim();
    const name = input.name;
    
    if (!value) {
      showError(input, 'This field is required');
      return false;
    }
    
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        showError(input, 'Please enter a valid email address');
        return false;
      }
    }
    
    if (name === 'phone') {
      if (!validateSaudiPhone(value)) {
        showError(input, 'Please enter a valid Saudi phone number');
        return false;
      }
    }
    
    return true;
  }

  function showError(input, message) {
    input.classList.add('error');
    const errorEl = input.parentElement.querySelector('.hitech-form-error');
    if (errorEl) {
      errorEl.innerHTML = `${ICONS.error} ${escapeHtml(message)}`;
      errorEl.style.display = 'flex';
    }
  }

  function clearError(input) {
    input.classList.remove('error');
    const errorEl = input.parentElement.querySelector('.hitech-form-error');
    if (errorEl) {
      errorEl.style.display = 'none';
    }
  }

  async function handleLeadSubmit(widget, form) {
    // Validate all fields
    const inputs = form.querySelectorAll('input[required]');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!validateField(input)) {
        isValid = false;
      }
    });
    
    if (!isValid) return;
    
    // Get form data
    const formData = new FormData(form);
    const leadData = {
      fullName: formData.get('fullName').trim(),
      email: formData.get('email').trim(),
      phone: formatSaudiPhone(formData.get('phone').trim()),
      company: formData.get('company')?.trim() || '',
      inquiryType: formData.get('inquiryType') || ''
    };
    
    // Show loading state
    const submitBtn = form.querySelector('.hitech-form-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<div class="hitech-form-submit-spinner"></div>`;
    
    try {
      const result = await submitLead(leadData);
      
      if (result.success) {
        state.sessionId = result.sessionId;
        state.leadInfo = leadData;
        state.hasSubmittedLead = true;
        
        // Save session to localStorage
        saveSession();
        
        // Show success and transition to chat
        submitBtn.innerHTML = `${ICONS.check} Submitted!`;
        submitBtn.style.background = 'var(--success)';
        
        setTimeout(() => {
          showChatInterface(widget);
        }, 1000);
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Lead submission error:', error);
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      
      // Show error
      alert('Failed to submit form. Please try again or contact us directly.');
    }
  }

  function showChatInterface(widget, isReturningUser = false) {
    // Clear container except header
    const header = widget.container.querySelector('.hitech-chat-header');
    widget.container.innerHTML = '';
    widget.container.appendChild(header);
    
    // Create messages area
    const messagesArea = createMessagesArea();
    widget.container.appendChild(messagesArea);
    
    // Add welcome message (different for returning users)
    if (isReturningUser && state.leadInfo) {
      const welcomeBack = createElement('div', 'hitech-welcome-message hitech-fade-in');
      welcomeBack.innerHTML = `
        <h4 class="hitech-welcome-message-title">Welcome back, ${escapeHtml(state.leadInfo.fullName.split(' ')[0])}!</h4>
        <p class="hitech-welcome-message-text">Continuing your conversation. How can I help you today?</p>
      `;
      messagesArea.appendChild(welcomeBack);
    } else {
      messagesArea.appendChild(createWelcomeMessage());
    }
    
    // Add existing messages (limit to last 20 for performance)
    const recentMessages = state.messages.slice(-20);
    recentMessages.forEach(msg => {
      messagesArea.appendChild(createMessageBubble(msg.content, msg.isUser));
    });
    
    // Scroll to bottom
    messagesArea.scrollTop = messagesArea.scrollHeight;
    
    // Create input area
    const inputArea = createInputArea();
    widget.container.appendChild(inputArea);
    
    // Add talk to human button if enabled
    if (CONFIG.showTalkToHuman) {
      const talkHumanBtn = createTalkToHumanButton();
      widget.container.appendChild(talkHumanBtn);
      
      talkHumanBtn.querySelector('button').addEventListener('click', () => {
        handleTalkToHuman(widget);
      });
    }
    
    // Setup input handlers
    setupChatInput(widget, inputArea, messagesArea);
    
    // Focus input
    const input = inputArea.querySelector('.hitech-chat-input');
    input?.focus();
    
    state.conversationStarted = true;
  }

  function setupChatInput(widget, inputArea, messagesArea) {
    const input = inputArea.querySelector('.hitech-chat-input');
    const sendBtn = inputArea.querySelector('.hitech-chat-send');
    
    // Auto-resize textarea
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });
    
    // Send on Enter (Shift+Enter for new line)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessageHandler();
      }
    });
    
    // Send button click
    sendBtn.addEventListener('click', sendMessageHandler);
    
    async function sendMessageHandler() {
      const message = input.value.trim();
      if (!message || state.isTyping) return;
      
      // Add user message
      addMessage(widget, message, true);
      input.value = '';
      input.style.height = 'auto';
      
      // Show typing indicator
      showTypingIndicator(widget);
      
      try {
        const result = await sendMessage(message);
        
        // Remove typing indicator
        hideTypingIndicator(widget);
        
        // Add bot response
        addMessage(widget, result.response, false);
      } catch (error) {
        console.error('Message error:', error);
        hideTypingIndicator(widget);
        addMessage(widget, 'I apologize, but I\'m having trouble responding right now. Please try again or click "Talk to Human" for assistance.', false);
      }
    }
  }

  function addMessage(widget, content, isUser) {
    const messagesArea = widget.container.querySelector('.hitech-chat-messages');
    if (!messagesArea) return;
    
    const message = createMessageBubble(content, isUser);
    messagesArea.appendChild(message);
    
    // Store in state
    state.messages.push({ content, isUser, timestamp: new Date() });
    
    // Persist to localStorage
    updateSessionMessages();
    
    // Scroll to bottom
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  function showTypingIndicator(widget) {
    state.isTyping = true;
    const messagesArea = widget.container.querySelector('.hitech-chat-messages');
    if (!messagesArea) return;
    
    const typing = createTypingIndicator();
    typing.id = 'typing-indicator';
    messagesArea.appendChild(typing);
    messagesArea.scrollTop = messagesArea.scrollHeight;
    
    // Disable input
    const input = widget.container.querySelector('.hitech-chat-input');
    const sendBtn = widget.container.querySelector('.hitech-chat-send');
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
  }

  function hideTypingIndicator(widget) {
    state.isTyping = false;
    const typing = widget.container.querySelector('#typing-indicator');
    if (typing) {
      typing.remove();
    }
    
    // Enable input
    const input = widget.container.querySelector('.hitech-chat-input');
    const sendBtn = widget.container.querySelector('.hitech-chat-send');
    if (input) input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    if (input) input.focus();
  }

  async function handleTalkToHuman(widget) {
    const confirmed = confirm('Would you like to speak with a human representative? We\'ll forward your conversation to our team.');
    
    if (!confirmed) return;
    
    // Show typing
    showTypingIndicator(widget);
    
    try {
      await talkToHuman('Customer requested to speak with a human agent');
      
      hideTypingIndicator(widget);
      addMessage(widget, 'Your request has been forwarded to our team. A representative will contact you shortly at the phone number you provided. Thank you for your patience!', false);
      
      // Disable further input
      const input = widget.container.querySelector('.hitech-chat-input');
      const sendBtn = widget.container.querySelector('.hitech-chat-send');
      const talkBtn = widget.container.querySelector('.hitech-talk-human-btn');
      
      if (input) {
        input.disabled = true;
        input.placeholder = 'Conversation ended - A representative will contact you';
      }
      if (sendBtn) sendBtn.disabled = true;
      if (talkBtn) {
        talkBtn.disabled = true;
        talkBtn.innerHTML = `${ICONS.check} Request Sent`;
      }
    } catch (error) {
      console.error('Talk to human error:', error);
      hideTypingIndicator(widget);
      addMessage(widget, 'Sorry, we couldn\'t forward your request right now. Please call us directly or try again later.', false);
    }
  }

  // ============================================
  // Initialization
  // ============================================
  function init() {
    // Check if API URL is configured
    if (!CONFIG.apiUrl) {
      console.error('Hitech Chat Widget: API URL not configured. Please set data-api-url attribute or HITECH_CHAT_API_URL variable.');
      return;
    }
    
    // Load CSS
    if (!document.getElementById('hitech-chat-styles')) {
      const link = document.createElement('link');
      link.id = 'hitech-chat-styles';
      link.rel = 'stylesheet';
      link.href = CONFIG.apiUrl + '/styles.css';
      document.head.appendChild(link);
    }
    
    // Build widget after CSS loads
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        const widget = buildWidget();
        setupEventListeners(widget);
      });
    } else {
      const widget = buildWidget();
      setupEventListeners(widget);
    }
  }

  // Start
  init();

  // Expose API for external control
  window.HitechChatWidget = {
    open: () => {
      const widget = document.querySelector('.hitech-chat-widget');
      if (widget) openChat(widget);
    },
    close: () => {
      const widget = document.querySelector('.hitech-chat-widget');
      if (widget) closeChat(widget);
    },
    toggle: () => {
      const widget = document.querySelector('.hitech-chat-widget');
      if (widget) toggleChat(widget);
    },
    clearSession: () => {
      clearSession();
      console.log('🗑️ Session cleared');
    },
    getSession: () => {
      return {
        sessionId: state.sessionId,
        leadInfo: state.leadInfo,
        hasSubmittedLead: state.hasSubmittedLead,
        messageCount: state.messages.length
      };
    },
    config: CONFIG
  };

})();
