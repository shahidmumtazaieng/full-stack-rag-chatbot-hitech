/**
 * Hitech Steel Industries — Premium Floating Chat Widget v3.0
 * Embeddable. Self-contained. No framework dependencies.
 *
 * Usage:
 *   <script src="widget.js" data-api-url="https://your-api.com"></script>
 *   OR
 *   <script>window.HITECH_CHAT_API_URL = 'https://your-api.com';</script>
 *   <script src="widget.js"></script>
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────
     CONFIG
  ───────────────────────────────────────── */
  const CONFIG = {
    apiUrl: (function () {
      const s = document.currentScript;
      return (s && s.getAttribute('data-api-url')) || (window as any).HITECH_CHAT_API_URL || 'http://localhost:3000';
    })(),
    primaryColor:   '#E30613',
    secondaryColor: '#003087',
    accentGold:     '#D4A017',
    companyName:    'Hitech Steel Industries',
    botName:        'Hitech AI Assistant',
    sessionTTL:     24 * 60 * 60 * 1000,
  };

  /* ─────────────────────────────────────────
     STATE
  ───────────────────────────────────────── */
  const state = {
    isOpen: false,
    screen: 'form',   // 'form' | 'chat'
    sessionId: null,
    leadInfo: null,
    messages: [],
    isTyping: false,
    isSubmitting: false,
    escalated: false,
  };

  const SESSION_KEY = 'hitech_widget_session_v3';

  /* ─────────────────────────────────────────
     STYLES  (injected once)
  ───────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('hw-styles')) return;
    const style = document.createElement('style');
    style.id = 'hw-styles';
    style.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --hw-red:       #E30613;
  --hw-red-dark:  #A8040E;
  --hw-red-dim:   rgba(227,6,19,0.12);
  --hw-navy:      #003087;
  --hw-gold:      #D4A017;
  --hw-bg:        #F0F2F5;
  --hw-surface:   #FFFFFF;
  --hw-border:    #E2E6EA;
  --hw-text:      #1A1D23;
  --hw-muted:     #6B7280;
  --hw-light:     #F8F9FC;
  --hw-shadow-sm: 0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.04);
  --hw-shadow-md: 0 4px 16px rgba(0,0,0,0.10),0 2px 6px rgba(0,0,0,0.06);
  --hw-shadow-lg: 0 20px 60px rgba(0,0,0,0.18),0 8px 24px rgba(0,0,0,0.10);
  --hw-r-sm: 8px;
  --hw-r-md: 14px;
  --hw-r-lg: 20px;
  --hw-r-xl: 28px;
  --hw-font: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --hw-mono: 'JetBrains Mono', 'Fira Code', monospace;
}

/* ── FAB Button ── */
#hw-fab {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 999990;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: linear-gradient(145deg, var(--hw-red) 0%, var(--hw-red-dark) 100%);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 24px rgba(227,6,19,0.40), 0 2px 8px rgba(0,0,0,0.15);
  transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s ease;
  outline: none;
}
#hw-fab:hover {
  transform: scale(1.08) translateY(-2px);
  box-shadow: 0 10px 32px rgba(227,6,19,0.50), 0 4px 12px rgba(0,0,0,0.18);
}
#hw-fab:active { transform: scale(0.95); }
#hw-fab svg { width: 28px; height: 28px; transition: transform 0.3s ease, opacity 0.2s; }
#hw-fab .hw-icon-chat { display: block; }
#hw-fab .hw-icon-close { display: none; transform: rotate(-90deg); }
#hw-fab.open .hw-icon-chat { display: none; }
#hw-fab.open .hw-icon-close { display: block; transform: rotate(0deg); }

/* Pulse ring */
#hw-fab::before {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid rgba(227,6,19,0.35);
  animation: hw-pulse 2.4s ease-in-out infinite;
  pointer-events: none;
}
#hw-fab.open::before { display: none; }
@keyframes hw-pulse {
  0%,100% { transform: scale(1); opacity: 0.6; }
  50%      { transform: scale(1.18); opacity: 0; }
}

/* Notification badge */
#hw-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  background: var(--hw-gold);
  border-radius: 50%;
  border: 2px solid white;
  font-size: 10px;
  font-weight: 700;
  color: #1A1D23;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--hw-font);
  animation: hw-badge-pop 0.3s cubic-bezier(.34,1.56,.64,1);
}
@keyframes hw-badge-pop {
  from { transform: scale(0); }
  to   { transform: scale(1); }
}

/* ── Panel ── */
#hw-panel {
  position: fixed;
  bottom: 102px;
  right: 28px;
  z-index: 999989;
  width: 390px;
  height: 620px;
  max-height: calc(100vh - 130px);
  display: flex;
  flex-direction: column;
  background: var(--hw-surface);
  border-radius: var(--hw-r-xl);
  box-shadow: var(--hw-shadow-lg);
  overflow: hidden;
  transform: translateY(16px) scale(0.96);
  opacity: 0;
  pointer-events: none;
  transition: transform 0.32s cubic-bezier(.34,1.4,.64,1), opacity 0.28s ease;
  font-family: var(--hw-font);
  border: 1px solid rgba(255,255,255,0.8);
}
#hw-panel.open {
  transform: translateY(0) scale(1);
  opacity: 1;
  pointer-events: all;
}

/* ── Header ── */
#hw-header {
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--hw-red) 0%, #9A0310 100%);
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
}
#hw-header::after {
  content: '';
  position: absolute;
  top: -40px;
  right: -30px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
  pointer-events: none;
}
#hw-header::before {
  content: '';
  position: absolute;
  bottom: -50px;
  left: -20px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
  pointer-events: none;
}

.hw-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255,255,255,0.18);
  backdrop-filter: blur(8px);
  border: 1.5px solid rgba(255,255,255,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.hw-avatar svg { width: 24px; height: 24px; color: white; }

.hw-header-info { flex: 1; min-width: 0; }
.hw-header-name {
  color: white;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0 0 3px;
  font-family: var(--hw-font);
}
.hw-header-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: rgba(255,255,255,0.75);
  font-family: var(--hw-font);
}
.hw-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4ADE80;
  box-shadow: 0 0 6px rgba(74,222,128,0.8);
  animation: hw-blink 2s ease-in-out infinite;
}
@keyframes hw-blink {
  0%,100% { opacity: 1; }
  50%      { opacity: 0.4; }
}

#hw-close-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.18);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
  color: white;
}
#hw-close-btn:hover { background: rgba(255,255,255,0.22); }
#hw-close-btn svg { width: 18px; height: 18px; }

/* ── Content area ── */
#hw-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--hw-light);
}

/* ── FORM SCREEN ── */
#hw-form-screen {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scrollbar-width: thin;
  scrollbar-color: var(--hw-border) transparent;
}
#hw-form-screen::-webkit-scrollbar { width: 5px; }
#hw-form-screen::-webkit-scrollbar-thumb { background: var(--hw-border); border-radius: 99px; }

.hw-form-card {
  background: var(--hw-surface);
  border-radius: var(--hw-r-lg);
  padding: 22px 20px;
  box-shadow: var(--hw-shadow-sm);
  border: 1px solid var(--hw-border);
}
.hw-form-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--hw-border);
}
.hw-form-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--hw-red-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.hw-form-icon svg { width: 20px; height: 20px; color: var(--hw-red); }
.hw-form-title { font-size: 16px; font-weight: 700; color: var(--hw-text); margin: 0 0 2px; letter-spacing: -0.02em; }
.hw-form-sub   { font-size: 12px; color: var(--hw-muted); margin: 0; }

.hw-field { margin-bottom: 14px; }
.hw-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--hw-text);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.hw-label .req { color: var(--hw-red); margin-left: 2px; }

.hw-input, .hw-select {
  width: 100%;
  padding: 11px 14px;
  font-size: 14px;
  font-family: var(--hw-font);
  border: 1.5px solid var(--hw-border);
  border-radius: var(--hw-r-sm);
  background: var(--hw-light);
  color: var(--hw-text);
  transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
  box-sizing: border-box;
  outline: none;
  -webkit-appearance: none;
}
.hw-input::placeholder { color: #B0B8C5; }
.hw-input:focus, .hw-select:focus {
  border-color: var(--hw-red);
  background: white;
  box-shadow: 0 0 0 3px rgba(227,6,19,0.10);
}
.hw-input.err { border-color: #EF4444; }
.hw-err-msg {
  font-size: 11.5px;
  color: #EF4444;
  margin-top: 4px;
  display: none;
  align-items: center;
  gap: 4px;
  font-family: var(--hw-font);
}
.hw-err-msg.show { display: flex; }
.hw-err-msg svg { width: 12px; height: 12px; flex-shrink: 0; }

/* Select wrapper */
.hw-select-wrap { position: relative; }
.hw-select-wrap::after {
  content: '';
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid var(--hw-muted);
  pointer-events: none;
}
.hw-select { padding-right: 36px; }

.hw-submit {
  width: 100%;
  margin-top: 6px;
  padding: 13px 20px;
  font-size: 14.5px;
  font-weight: 600;
  font-family: var(--hw-font);
  color: white;
  background: linear-gradient(135deg, var(--hw-red) 0%, var(--hw-red-dark) 100%);
  border: none;
  border-radius: var(--hw-r-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  letter-spacing: -0.01em;
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
  box-shadow: 0 4px 14px rgba(227,6,19,0.35);
}
.hw-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(227,6,19,0.45);
}
.hw-submit:active:not(:disabled) { transform: translateY(0); }
.hw-submit:disabled { opacity: 0.65; cursor: not-allowed; }
.hw-submit svg { width: 18px; height: 18px; }

.hw-spinner {
  width: 17px;
  height: 17px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: hw-spin 0.7s linear infinite;
}
@keyframes hw-spin { to { transform: rotate(360deg); } }

.hw-privacy {
  font-size: 11px;
  color: #9CA3AF;
  text-align: center;
  margin-top: 14px;
  line-height: 1.6;
  font-family: var(--hw-font);
}

/* ── CHAT SCREEN ── */
#hw-chat-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

#hw-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scrollbar-width: thin;
  scrollbar-color: var(--hw-border) transparent;
}
#hw-messages::-webkit-scrollbar { width: 4px; }
#hw-messages::-webkit-scrollbar-thumb { background: var(--hw-border); border-radius: 99px; }

/* Welcome card */
.hw-welcome {
  background: linear-gradient(135deg, #FFF9F9 0%, #FFF5F5 100%);
  border: 1px solid rgba(227,6,19,0.12);
  border-radius: var(--hw-r-md);
  padding: 14px 16px;
  display: flex;
  gap: 12px;
  animation: hw-fade-up 0.4s ease;
}
.hw-welcome-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--hw-red-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.hw-welcome-icon svg { width: 18px; height: 18px; color: var(--hw-red); }
.hw-welcome-text h4 {
  font-size: 13px;
  font-weight: 600;
  color: var(--hw-text);
  margin: 0 0 4px;
  font-family: var(--hw-font);
}
.hw-welcome-text p {
  font-size: 12.5px;
  color: var(--hw-muted);
  margin: 0;
  line-height: 1.55;
  font-family: var(--hw-font);
}

/* Message row */
.hw-msg-row {
  display: flex;
  gap: 8px;
  animation: hw-fade-up 0.28s ease;
  max-width: 92%;
}
.hw-msg-row.user { align-self: flex-end; flex-direction: row-reverse; }
.hw-msg-row.bot  { align-self: flex-start; }

@keyframes hw-fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.hw-msg-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}
.hw-msg-row.bot  .hw-msg-avatar { background: linear-gradient(135deg, var(--hw-red) 0%, var(--hw-red-dark) 100%); }
.hw-msg-row.user .hw-msg-avatar { background: var(--hw-navy); }
.hw-msg-avatar svg { width: 14px; height: 14px; color: white; }

.hw-msg-body { display: flex; flex-direction: column; }
.hw-msg-row.user .hw-msg-body { align-items: flex-end; }
.hw-msg-row.bot  .hw-msg-body { align-items: flex-start; }

.hw-bubble {
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 13.5px;
  line-height: 1.58;
  font-family: var(--hw-font);
  word-wrap: break-word;
  overflow-wrap: anywhere;
  max-width: 100%;
}
.hw-msg-row.user .hw-bubble {
  background: linear-gradient(135deg, var(--hw-red) 0%, var(--hw-red-dark) 100%);
  color: white;
  border-bottom-right-radius: 4px;
  box-shadow: 0 2px 8px rgba(227,6,19,0.25);
}
.hw-msg-row.bot .hw-bubble {
  background: var(--hw-surface);
  color: var(--hw-text);
  border-bottom-left-radius: 4px;
  box-shadow: var(--hw-shadow-sm);
  border: 1px solid var(--hw-border);
}

/* ── LLM Markdown Rendering ── */
.hw-bubble h1,.hw-bubble h2,.hw-bubble h3,.hw-bubble h4 {
  font-family: var(--hw-font);
  font-weight: 700;
  color: var(--hw-text);
  margin: 10px 0 5px;
  letter-spacing: -0.02em;
  line-height: 1.3;
}
.hw-bubble h1 { font-size: 16px; }
.hw-bubble h2 { font-size: 14.5px; border-bottom: 1px solid var(--hw-border); padding-bottom: 4px; }
.hw-bubble h3 { font-size: 13.5px; color: var(--hw-red); }
.hw-bubble h4 { font-size: 13px; }
.hw-bubble p  { margin: 0 0 8px; }
.hw-bubble p:last-child { margin-bottom: 0; }
.hw-bubble ul, .hw-bubble ol {
  margin: 6px 0 8px;
  padding-left: 18px;
}
.hw-bubble li {
  margin-bottom: 4px;
  line-height: 1.5;
}
.hw-bubble ul li::marker { color: var(--hw-red); }
.hw-bubble ol li::marker { color: var(--hw-red); font-weight: 600; }
.hw-bubble strong { font-weight: 700; color: var(--hw-text); }
.hw-bubble em     { font-style: italic; }
.hw-bubble code {
  font-family: var(--hw-mono);
  font-size: 12px;
  background: #F0F2F5;
  border: 1px solid #E2E6EA;
  border-radius: 4px;
  padding: 1px 5px;
  color: #c0392b;
}
.hw-bubble pre {
  background: #1E2029;
  border-radius: 8px;
  padding: 12px 14px;
  margin: 8px 0;
  overflow-x: auto;
  position: relative;
}
.hw-bubble pre code {
  background: none;
  border: none;
  padding: 0;
  color: #E8EAF0;
  font-size: 12px;
  line-height: 1.6;
}
.hw-bubble blockquote {
  border-left: 3px solid var(--hw-red);
  margin: 8px 0;
  padding: 6px 12px;
  background: var(--hw-red-dim);
  border-radius: 0 6px 6px 0;
  font-style: italic;
  color: var(--hw-muted);
}
.hw-bubble a { color: var(--hw-navy); text-decoration: underline; font-weight: 500; }
.hw-bubble a:hover { color: var(--hw-red); }
.hw-bubble hr { border: none; border-top: 1px solid var(--hw-border); margin: 10px 0; }
.hw-bubble table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin: 8px 0; }
.hw-bubble th { background: var(--hw-red-dim); color: var(--hw-text); padding: 6px 10px; text-align: left; font-weight: 600; border: 1px solid var(--hw-border); }
.hw-bubble td { padding: 5px 10px; border: 1px solid var(--hw-border); }
.hw-bubble tr:nth-child(even) td { background: var(--hw-light); }

/* User bubble overrides for readability */
.hw-msg-row.user .hw-bubble h1,
.hw-msg-row.user .hw-bubble h2,
.hw-msg-row.user .hw-bubble h3,
.hw-msg-row.user .hw-bubble strong { color: white; }
.hw-msg-row.user .hw-bubble h2 { border-bottom-color: rgba(255,255,255,0.3); }
.hw-msg-row.user .hw-bubble h3 { color: rgba(255,255,255,0.9); }
.hw-msg-row.user .hw-bubble code { background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.3); color: white; }
.hw-msg-row.user .hw-bubble a { color: rgba(255,255,255,0.9); }
.hw-msg-row.user .hw-bubble blockquote { background: rgba(255,255,255,0.12); border-left-color: rgba(255,255,255,0.6); color: rgba(255,255,255,0.85); }

.hw-time {
  font-size: 10.5px;
  color: #B0B8C5;
  margin-top: 4px;
  font-family: var(--hw-font);
}

/* Typing indicator */
.hw-typing-bubble {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: var(--hw-surface);
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  box-shadow: var(--hw-shadow-sm);
  border: 1px solid var(--hw-border);
  width: fit-content;
}
.hw-typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #C0C8D5;
  animation: hw-typing 1.3s ease-in-out infinite;
}
.hw-typing-dot:nth-child(2) { animation-delay: 0.18s; }
.hw-typing-dot:nth-child(3) { animation-delay: 0.36s; }
@keyframes hw-typing {
  0%,60%,100% { transform: translateY(0); background: #C0C8D5; }
  30%          { transform: translateY(-5px); background: var(--hw-red); }
}

/* ── Talk to Human strip ── */
#hw-human-strip {
  flex-shrink: 0;
  padding: 10px 14px;
  background: var(--hw-surface);
  border-top: 1px solid var(--hw-border);
  display: flex;
  justify-content: center;
}
#hw-human-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 18px;
  font-size: 12.5px;
  font-weight: 600;
  font-family: var(--hw-font);
  color: var(--hw-navy);
  background: transparent;
  border: 1.5px solid var(--hw-navy);
  border-radius: 99px;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: -0.01em;
}
#hw-human-btn:hover { background: var(--hw-navy); color: white; }
#hw-human-btn:disabled { opacity: 0.5; cursor: not-allowed; }
#hw-human-btn svg { width: 14px; height: 14px; }

/* ── Input area ── */
#hw-input-area {
  flex-shrink: 0;
  padding: 12px 14px;
  background: var(--hw-surface);
  border-top: 1px solid var(--hw-border);
  display: flex;
  gap: 10px;
  align-items: flex-end;
}
#hw-input {
  flex: 1;
  resize: none;
  min-height: 42px;
  max-height: 110px;
  padding: 11px 14px;
  font-size: 13.5px;
  font-family: var(--hw-font);
  border: 1.5px solid var(--hw-border);
  border-radius: 12px;
  background: var(--hw-light);
  color: var(--hw-text);
  outline: none;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
  line-height: 1.45;
  scrollbar-width: none;
}
#hw-input::-webkit-scrollbar { display: none; }
#hw-input:focus {
  border-color: var(--hw-red);
  background: white;
  box-shadow: 0 0 0 3px rgba(227,6,19,0.08);
}
#hw-input::placeholder { color: #B0B8C5; }
#hw-input:disabled { background: var(--hw-border); cursor: not-allowed; }

#hw-send-btn {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--hw-red) 0%, var(--hw-red-dark) 100%);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.2s, opacity 0.2s, box-shadow 0.2s;
  box-shadow: 0 3px 10px rgba(227,6,19,0.35);
  color: white;
}
#hw-send-btn:hover:not(:disabled) { transform: scale(1.07); box-shadow: 0 5px 14px rgba(227,6,19,0.45); }
#hw-send-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
#hw-send-btn svg { width: 18px; height: 18px; }

/* Mobile */
@media (max-width: 480px) {
  #hw-panel {
    bottom: 0;
    right: 0;
    left: 0;
    width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
  #hw-fab { bottom: 20px; right: 20px; }
}
    `;
    document.head.appendChild(style);
  }

  /* ─────────────────────────────────────────
     MARKDOWN → HTML RENDERER
     Lightweight, safe, no external deps
  ───────────────────────────────────────── */
  function renderMarkdown(text) {
    if (!text) return '';
    let html = text;

    // Escape HTML entities first (for user content safety)
    // But we trust bot content — it's from our own API
    // Only escape < > & that aren't part of markdown

    // Code blocks (``` ... ```)
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      const escaped = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      return `<pre><code class="hw-lang-${lang||'text'}">${escaped.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    // Headings
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Horizontal rule
    html = html.replace(/^---+$/gm, '<hr>');

    // Bold + Italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>');

    // Blockquote
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

    // Unordered lists (- or * or +)
    html = html.replace(/^[\-\*\+] (.+)$/gm, '<li-u>$1</li-u>');
    html = html.replace(/((?:<li-u>[\s\S]*?<\/li-u>\n?)+)/g, match => {
      const items = match.replace(/<li-u>([\s\S]*?)<\/li-u>/g, '<li>$1</li>');
      return `<ul>${items}</ul>`;
    });

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li-o>$1</li-o>');
    html = html.replace(/((?:<li-o>[\s\S]*?<\/li-o>\n?)+)/g, match => {
      const items = match.replace(/<li-o>([\s\S]*?)<\/li-o>/g, '<li>$1</li>');
      return `<ol>${items}</ol>`;
    });

    // Tables (basic)
    html = html.replace(/(\|.+\|\n\|[-:| ]+\|\n(?:\|.+\|\n?)*)/g, (table) => {
      const lines = table.trim().split('\n');
      const header = lines[0];
      const rows = lines.slice(2);
      const ths = header.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
      const trs = rows.map(row => {
        const tds = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
    });

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Auto-links
    html = html.replace(/(?<!["\(])(https?:\/\/[^\s<>]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

    // Paragraphs — wrap remaining text blocks
    // Split on double newline
    const parts = html.split(/\n{2,}/);
    html = parts.map(part => {
      part = part.trim();
      if (!part) return '';
      // Don't wrap block elements
      if (/^<(h[1-6]|ul|ol|pre|blockquote|hr|table)/.test(part)) return part;
      // Replace single newlines with <br> inside paragraphs
      part = part.replace(/\n/g, '<br>');
      return `<p>${part}</p>`;
    }).join('');

    return html;
  }

  /* ─────────────────────────────────────────
     SESSION  (localStorage)
  ───────────────────────────────────────── */
  function saveSession() {
    if (!state.sessionId) return;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        sessionId: state.sessionId,
        leadInfo:  state.leadInfo,
        messages:  state.messages.slice(-30),
        screen:    state.screen,
        ts:        Date.now(),
      }));
    } catch (_) {}
  }

  function loadSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const d = JSON.parse(raw);
      if (Date.now() - d.ts > CONFIG.sessionTTL) { clearSession(); return false; }
      state.sessionId = d.sessionId;
      state.leadInfo  = d.leadInfo;
      state.messages  = d.messages || [];
      state.screen    = d.screen || 'chat';
      return true;
    } catch (_) { return false; }
  }

  function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
    state.sessionId = null;
    state.leadInfo  = null;
    state.messages  = [];
    state.screen    = 'form';
  }

  /* ─────────────────────────────────────────
     VALIDATION
  ───────────────────────────────────────── */
  function valEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function valPhone(v) { return /^[\d\s\-+().]{7,20}$/.test(v); }
  function fmtPhone(v) {
    const c = v.replace(/[\s\-().]/g,'');
    if (c.startsWith('0')) return '+966' + c.slice(1);
    if (!c.startsWith('+')) return '+' + c;
    return c;
  }

  /* ─────────────────────────────────────────
     FORM FIELD HELPERS
  ───────────────────────────────────────── */
  function setErr(input, msg) {
    input.classList.add('err');
    const e = input.closest('.hw-field')?.querySelector('.hw-err-msg');
    if (e) { e.textContent = msg; e.classList.add('show'); }
  }
  function clrErr(input) {
    input.classList.remove('err');
    const e = input.closest('.hw-field')?.querySelector('.hw-err-msg');
    if (e) e.classList.remove('show');
  }

  /* ─────────────────────────────────────────
     BUILD DOM
  ───────────────────────────────────────── */
  let panel, fab, badge, messagesEl, inputEl, sendBtn, humanBtn;

  function buildWidget() {
    // FAB
    fab = document.createElement('button');
    fab.id = 'hw-fab';
    fab.setAttribute('aria-label', 'Open chat with Hitech Steel AI');
    fab.innerHTML = `
      <svg class="hw-icon-chat" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <svg class="hw-icon-close" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    `;
    badge = document.createElement('span');
    badge.id = 'hw-badge';
    badge.textContent = '1';
    fab.appendChild(badge);
    fab.addEventListener('click', togglePanel);

    // Panel
    panel = document.createElement('div');
    panel.id = 'hw-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat with Hitech Steel AI');

    // Header
    panel.innerHTML = `
      <div id="hw-header">
        <div class="hw-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div class="hw-header-info">
          <p class="hw-header-name">${CONFIG.botName}</p>
          <div class="hw-header-status"><span class="hw-dot"></span>Online — replies instantly</div>
        </div>
        <button id="hw-close-btn" aria-label="Close chat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div id="hw-body"></div>
    `;

    panel.querySelector('#hw-close-btn').addEventListener('click', togglePanel);

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    // ESC key
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.isOpen) togglePanel(); });

    // Load session & render correct screen
    const restored = loadSession();
    if (restored && state.screen === 'chat') {
      renderChatScreen(true);
    } else {
      renderFormScreen();
    }
  }

  /* ─────────────────────────────────────────
     TOGGLE
  ───────────────────────────────────────── */
  function togglePanel() {
    state.isOpen = !state.isOpen;
    panel.classList.toggle('open', state.isOpen);
    fab.classList.toggle('open', state.isOpen);
    fab.setAttribute('aria-label', state.isOpen ? 'Close chat' : 'Open chat');
    if (state.isOpen) {
      // Remove badge
      if (badge) { badge.remove(); badge = null; }
      if (state.screen === 'chat' && inputEl) setTimeout(() => inputEl.focus(), 350);
    }
  }

  /* ─────────────────────────────────────────
     FORM SCREEN
  ───────────────────────────────────────── */
  function renderFormScreen() {
    state.screen = 'form';
    const body = panel.querySelector('#hw-body');
    body.innerHTML = '';

    const screen = document.createElement('div');
    screen.id = 'hw-form-screen';

    screen.innerHTML = `
      <div class="hw-form-card">
        <div class="hw-form-top">
          <div class="hw-form-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <p class="hw-form-title">Let's get started</p>
            <p class="hw-form-sub">Quick intro before we chat</p>
          </div>
        </div>

        <div class="hw-field">
          <label class="hw-label">Full Name <span class="req">*</span></label>
          <input type="text" class="hw-input" id="hw-fname" name="fullName" placeholder="Your full name" autocomplete="name">
          <div class="hw-err-msg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg><span></span></div>
        </div>
        <div class="hw-field">
          <label class="hw-label">Email Address <span class="req">*</span></label>
          <input type="email" class="hw-input" id="hw-email" name="email" placeholder="you@company.com" autocomplete="email">
          <div class="hw-err-msg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg><span></span></div>
        </div>
        <div class="hw-field">
          <label class="hw-label">Phone Number <span class="req">*</span></label>
          <input type="tel" class="hw-input" id="hw-phone" name="phone" placeholder="+966 5x xxx xxxx" autocomplete="tel">
          <div class="hw-err-msg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg><span></span></div>
        </div>
        <div class="hw-field">
          <label class="hw-label">Company</label>
          <input type="text" class="hw-input" id="hw-company" name="company" placeholder="Your company (optional)" autocomplete="organization">
        </div>
        <div class="hw-field">
          <label class="hw-label">Inquiry Type</label>
          <div class="hw-select-wrap">
            <select class="hw-input hw-select" id="hw-inquiry">
              <option value="">Select a topic…</option>
              <option value="Product Information">Product Information</option>
              <option value="Pricing Quote">Pricing Quote</option>
              <option value="Technical Support">Technical Support</option>
              <option value="Partnership">Partnership</option>
              <option value="Careers">Careers</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <button class="hw-submit" id="hw-submit-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Start Conversation
        </button>
        <p class="hw-privacy">By continuing you agree to our privacy policy. Your data is safe with us.</p>
      </div>
    `;

    body.appendChild(screen);

    // Wire up form
    const submitBtn = screen.querySelector('#hw-submit-btn') as HTMLButtonElement;
    const fields: Record<string, HTMLInputElement | HTMLSelectElement> = {
      fname:   screen.querySelector('#hw-fname') as HTMLInputElement,
      email:   screen.querySelector('#hw-email') as HTMLInputElement,
      phone:   screen.querySelector('#hw-phone') as HTMLInputElement,
      company: screen.querySelector('#hw-company') as HTMLInputElement,
      inquiry: screen.querySelector('#hw-inquiry') as HTMLSelectElement,
    };

    // Real-time validation clear
    [fields.fname, fields.email, fields.phone].forEach(f => {
      f.addEventListener('input', () => clrErr(f));
    });

    submitBtn.addEventListener('click', async () => {
      if (state.isSubmitting) return;
      let valid = true;

      if (!fields.fname.value.trim() || fields.fname.value.trim().length < 2) {
        setErr(fields.fname, 'Please enter your full name'); valid = false;
      }
      if (!fields.email.value.trim() || !valEmail(fields.email.value)) {
        setErr(fields.email, 'Enter a valid email address'); valid = false;
      }
      if (!fields.phone.value.trim() || !valPhone(fields.phone.value)) {
        setErr(fields.phone, 'Enter a valid phone number'); valid = false;
      }

      if (!valid) return;

      state.isSubmitting = true;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="hw-spinner"></div> Starting…';

      const lead = {
        fullName:    fields.fname.value.trim(),
        email:       fields.email.value.trim().toLowerCase(),
        phone:       fmtPhone(fields.phone.value.trim()),
        company:     fields.company.value.trim(),
        inquiryType: fields.inquiry.value,
      };

      try {
        const res = await fetch(`${CONFIG.apiUrl}/api/lead`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Submission failed');

        state.sessionId = data.sessionId;
        state.leadInfo  = lead;

        submitBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg> All set!`;
        submitBtn.style.background = 'linear-gradient(135deg,#10B981,#059669)';
        submitBtn.style.boxShadow  = '0 4px 14px rgba(16,185,129,0.4)';

        saveSession();
        setTimeout(() => renderChatScreen(false), 700);
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg> Try again`;
        submitBtn.style.background = '';
        submitBtn.style.boxShadow = '';
        setTimeout(() => {
          submitBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg> Start Conversation`;
          state.isSubmitting = false;
        }, 1800);
      }
    });
  }

  /* ─────────────────────────────────────────
     CHAT SCREEN
  ───────────────────────────────────────── */
  function renderChatScreen(isRestored) {
    state.screen = 'chat';
    const body = panel.querySelector('#hw-body');
    body.innerHTML = '';
    state.isTyping = false;

    const screen = document.createElement('div');
    screen.id = 'hw-chat-screen';

    // Messages
    messagesEl = document.createElement('div');
    messagesEl.id = 'hw-messages';

    // Welcome
    const welcome = document.createElement('div');
    welcome.className = 'hw-welcome';
    const firstName = state.leadInfo?.fullName?.split(' ')[0] || 'there';
    welcome.innerHTML = `
      <div class="hw-welcome-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/>
          <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/>
          <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/>
          <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/>
          <path d="M15.5 9H17v1.5c0 .83-.67 1.5-1.5 1.5S14 11.33 14 10.5 14.67 9 15.5 9z"/>
          <path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/>
          <path d="M8.5 15H7v-1.5C7 12.67 7.67 12 8.5 12s1.5.67 1.5 1.5S9.33 15 8.5 15z"/>
        </svg>
      </div>
      <div class="hw-welcome-text">
        <h4>Hi ${firstName}! 👋</h4>
        <p>${isRestored ? 'Welcome back — your conversation is here.' : `I'm your AI assistant for ${CONFIG.companyName}. Ask me anything about our steel products, pricing, or services.`}</p>
      </div>
    `;
    messagesEl.appendChild(welcome);

    // Restore history
    if (isRestored && state.messages.length) {
      state.messages.forEach(m => appendBubble(m.content, m.isUser, m.time, false));
    }

    // Human strip
    const humanStrip = document.createElement('div');
    humanStrip.id = 'hw-human-strip';
    humanBtn = document.createElement('button');
    humanBtn.id = 'hw-human-btn';
    humanBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.07h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16"/>
      </svg>
      Talk to a Human
    `;
    humanBtn.addEventListener('click', handleTalkToHuman);
    humanStrip.appendChild(humanBtn);

    // Input area
    const inputArea = document.createElement('div');
    inputArea.id = 'hw-input-area';
    inputEl = document.createElement('textarea');
    inputEl.id = 'hw-input';
    inputEl.placeholder = 'Type your message…';
    inputEl.rows = 1;
    inputEl.setAttribute('aria-label', 'Message input');

    sendBtn = document.createElement('button');
    sendBtn.id = 'hw-send-btn';
    sendBtn.setAttribute('aria-label', 'Send message');
    sendBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"/>
        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    `;

    inputArea.appendChild(inputEl);
    inputArea.appendChild(sendBtn);

    screen.appendChild(messagesEl);
    screen.appendChild(humanStrip);
    screen.appendChild(inputArea);
    body.appendChild(screen);

    // Input auto-resize
    inputEl.addEventListener('input', () => {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 110) + 'px';
    });
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
    });
    sendBtn.addEventListener('click', doSend);

    scrollBottom();
    if (state.isOpen) setTimeout(() => inputEl.focus(), 300);
  }

  /* ─────────────────────────────────────────
     APPEND BUBBLE  (render markdown)
  ───────────────────────────────────────── */
  function appendBubble(content: string, isUser: boolean, timeStr?: string, scrollTo: boolean = true) {
    const row = document.createElement('div');
    row.className = `hw-msg-row ${isUser ? 'user' : 'bot'}`;

    const avatar = document.createElement('div');
    avatar.className = 'hw-msg-avatar';
    avatar.innerHTML = isUser
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

    const msgBody = document.createElement('div');
    msgBody.className = 'hw-msg-body';

    const bubble = document.createElement('div');
    bubble.className = 'hw-bubble';

    if (isUser) {
      // User messages: plain text with links
      const escaped = content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      bubble.innerHTML = escaped.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    } else {
      // Bot messages: full markdown render
      bubble.innerHTML = renderMarkdown(content);
    }

    const time = document.createElement('div');
    time.className = 'hw-time';
    time.textContent = timeStr || fmtTime();

    msgBody.appendChild(bubble);
    msgBody.appendChild(time);

    if (isUser) {
      row.appendChild(msgBody);
      row.appendChild(avatar);
    } else {
      row.appendChild(avatar);
      row.appendChild(msgBody);
    }

    messagesEl.appendChild(row);
    if (scrollTo !== false) scrollBottom();
    return bubble;
  }

    function fmtTime(d?: Date) {
    return (d || new Date()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  function scrollBottom() {
    if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /* ─────────────────────────────────────────
     TYPING INDICATOR
  ───────────────────────────────────────── */
  let typingRow = null;

  function showTyping() {
    state.isTyping = true;
    if (inputEl) inputEl.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    typingRow = document.createElement('div');
    typingRow.className = 'hw-msg-row bot';
    typingRow.id = 'hw-typing';

    const avatar = document.createElement('div');
    avatar.className = 'hw-msg-avatar';
    avatar.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

    const bub = document.createElement('div');
    bub.className = 'hw-typing-bubble';
    bub.innerHTML = '<div class="hw-typing-dot"></div><div class="hw-typing-dot"></div><div class="hw-typing-dot"></div>';

    typingRow.appendChild(avatar);
    typingRow.appendChild(bub);
    messagesEl.appendChild(typingRow);
    scrollBottom();
  }

  function hideTyping() {
    state.isTyping = false;
    if (typingRow) { typingRow.remove(); typingRow = null; }
    if (inputEl) { inputEl.disabled = false; inputEl.focus(); }
    if (sendBtn) sendBtn.disabled = false;
  }

  /* ─────────────────────────────────────────
     SEND MESSAGE
  ───────────────────────────────────────── */
  async function doSend() {
    if (!inputEl || state.isTyping || state.escalated) return;
    const text = inputEl.value.trim();
    if (!text) return;

    const t = fmtTime();
    inputEl.value = '';
    inputEl.style.height = 'auto';

    // Add user message
    state.messages.push({ content: text, isUser: true, time: t });
    appendBubble(text, true, t);
    showTyping();

    try {
      console.log('[Chat] Sending message to:', `${CONFIG.apiUrl}/api/chat/sync`);
      console.log('[Chat] Session ID:', state.sessionId);
      console.log('[Chat] Message:', text);
      
      const res = await fetch(`${CONFIG.apiUrl}/api/chat/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: state.sessionId, message: text }),
      });
      
      console.log('[Chat] Response status:', res.status);
      const data = await res.json();
      console.log('[Chat] Response data:', data);
      
      if (!res.ok) {
        console.error('[Chat] Error response:', data);
        throw new Error(data.error || 'Server error');
      }
      
      if (!data.response) {
        console.error('[Chat] No response in data:', data);
        throw new Error('No response generated');
      }

      hideTyping();
      const botT = fmtTime();
      state.messages.push({ content: data.response, isUser: false, time: botT });
      appendBubble(data.response, false, botT);
      saveSession();
    } catch (err) {
      console.error('[Chat] Error caught:', err);
      console.error('[Chat] Error message:', err.message);
      console.error('[Chat] Error stack:', err.stack);
      hideTyping();
      const errMsg = `⚠️ Error: ${err.message}\n\nPlease try again or click **Talk to a Human** for assistance.`;
      appendBubble(errMsg, false, fmtTime());
    }
  }

  /* ─────────────────────────────────────────
     STREAMING  (optional — used when /api/chat returns SSE)
  ───────────────────────────────────────── */
  async function doSendStreaming() {
    if (!inputEl || state.isTyping || state.escalated) return;
    const text = inputEl.value.trim();
    if (!text) return;

    const t = fmtTime();
    inputEl.value = '';
    inputEl.style.height = 'auto';
    state.messages.push({ content: text, isUser: true, time: t });
    appendBubble(text, true, t);
    showTyping();

    try {
      const res = await fetch(`${CONFIG.apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: state.sessionId, message: text }),
      });
      if (!res.ok) throw new Error('Server error');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      let botBubble = null;
      const botT = fmtTime();

      hideTyping();
      botBubble = appendBubble('', false, botT);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        chunk.split('\n').forEach(line => {
          if (line.startsWith('data: ')) {
            try {
              const d = JSON.parse(line.slice(6));
              if (d.chunk) {
                full += d.chunk;
                botBubble.innerHTML = renderMarkdown(full);
                scrollBottom();
              }
            } catch (_) {}
          }
        });
      }

      state.messages.push({ content: full, isUser: false, time: botT });
      saveSession();
    } catch (err) {
      hideTyping();
      appendBubble("I'm having trouble responding right now. Please try again or **Talk to a Human**.", false, fmtTime());
    }
  }

  /* ─────────────────────────────────────────
     TALK TO HUMAN
  ───────────────────────────────────────── */
  async function handleTalkToHuman() {
    if (state.escalated) return;

    // Custom confirm dialog
    const confirmed = window.confirm('Would you like to speak with a human representative? We\'ll forward your conversation to our team.');
    if (!confirmed) return;

    if (humanBtn) { humanBtn.disabled = true; }
    showTyping();

    try {
      await fetch(`${CONFIG.apiUrl}/api/talk-to-human`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          notes: `Human agent requested. Inquiry: ${state.leadInfo?.inquiryType || 'General'}`,
        }),
      });
      hideTyping();
      state.escalated = true;

      const contact = state.leadInfo?.phone || 'your phone';
      const msg = `✅ **Request forwarded!**\n\nA representative will contact you at ${contact} shortly.\n\nThank you for reaching out to ${CONFIG.companyName}.`;
      appendBubble(msg, false, fmtTime());

      if (inputEl) { inputEl.disabled = true; inputEl.placeholder = 'Conversation handed off to team'; }
      if (sendBtn) sendBtn.disabled = true;
      if (humanBtn) {
        humanBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg> Request Sent
        `;
        humanBtn.style.color = '#10B981';
        humanBtn.style.borderColor = '#10B981';
      }
    } catch (_) {
      hideTyping();
      if (humanBtn) humanBtn.disabled = false;
      appendBubble('Sorry, unable to connect right now. Please try again.', false, fmtTime());
    }
  }

  /* ─────────────────────────────────────────
     BOOT
  ───────────────────────────────────────── */
  function boot() {
    injectStyles();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', buildWidget);
    } else {
      buildWidget();
    }
  }

  boot();

  /* Public API */
  (window as any).HitechChatWidget = {
    open:  () => { if (!state.isOpen) togglePanel(); },
    close: () => { if (state.isOpen)  togglePanel(); },
    clearSession,
    version: '3.0.0',
  };

})();