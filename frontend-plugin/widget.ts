/**
 * Hitech Steel Industries - Embeddable Chat Widget
 * Production-ready floating chat widget for WordPress/Odoo integration
 * 
 * Usage:
 * <script src="https://your-domain.com/widget.js" 
 *   data-api-url="https://your-api.com"
 *   data-primary-color="#E30613"
 *   data-secondary-color="#003087"
 *   data-position="bottom-right"
 *   data-company="Hitech Steel Industries"
 *   data-bot-name="Hitech Assistant"
 *   data-auto-open="true"
 *   data-auto-open-delay="5000">
 * </script>
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import ChatWidget from './components/ChatWidget'

// ============================================
// Configuration Interface
// ============================================
interface WidgetConfig {
  apiUrl: string
  primaryColor?: string
  secondaryColor?: string
  position?: 'bottom-right' | 'bottom-left'
  companyName?: string
  botName?: string
  autoOpen?: boolean
  autoOpenDelay?: number
}

// ============================================
// Global Window Interface
// ============================================
declare global {
  interface Window {
    HitechChatWidget?: {
      init: (config: WidgetConfig) => void
      destroy: () => void
      open: () => void
      close: () => void
      toggle: () => void
      version: string
    }
    HITECH_CHAT_API_URL?: string
  }
}

// ============================================
// Widget Class
// ============================================
class HitechChatWidgetClass {
  private container: HTMLElement | null = null
  private root: any = null
  private config: WidgetConfig | null = null
  private isInitialized: boolean = false
  static readonly VERSION = '2.0.0'

  /**
   * Initialize the widget
   */
  init(config: WidgetConfig): void {
    // Prevent double initialization
    if (this.isInitialized || document.getElementById('hitech-chat-widget-root')) {
      console.warn('[HitechChat] Widget already initialized')
      return
    }

    // Validate config
    if (!config.apiUrl) {
      console.error('[HitechChat] API URL is required. Please provide data-api-url attribute.')
      return
    }

    this.config = config

    // Create container
    this.container = document.createElement('div')
    this.container.id = 'hitech-chat-widget-root'
    document.body.appendChild(this.container)

    // Render React component
    this.root = createRoot(this.container)
    this.root.render(
      React.createElement(ChatWidget, {
        apiUrl: config.apiUrl,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        position: config.position,
        companyName: config.companyName,
        botName: config.botName
      })
    )

    this.isInitialized = true
    console.log(`[HitechChat] Widget v${HitechChatWidgetClass.VERSION} initialized`)

    // Auto-open if configured
    if (config.autoOpen) {
      setTimeout(() => {
        this.open()
      }, config.autoOpenDelay || 5000)
    }
  }

  /**
   * Destroy the widget
   */
  destroy(): void {
    if (this.root) {
      this.root.unmount()
      this.root = null
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
      this.container = null
    }

    this.isInitialized = false
    this.config = null

    console.log('[HitechChat] Widget destroyed')
  }

  /**
   * Open the chat
   */
  open(): void {
    // Dispatch custom event that ChatWidget listens to
    const event = new CustomEvent('hitech-chat-open')
    window.dispatchEvent(event)
  }

  /**
   * Close the chat
   */
  close(): void {
    const event = new CustomEvent('hitech-chat-close')
    window.dispatchEvent(event)
  }

  /**
   * Toggle the chat
   */
  toggle(): void {
    const event = new CustomEvent('hitech-chat-toggle')
    window.dispatchEvent(event)
  }
}

// ============================================
// Auto-initialization from script tag
// ============================================
function initFromScript(): void {
  const script = document.currentScript as HTMLScriptElement
  if (!script) return

  const apiUrl = script.getAttribute('data-api-url') || window.HITECH_CHAT_API_URL
  if (!apiUrl) {
    console.warn('[HitechChat] No API URL provided. Widget not initialized.')
    return
  }

  const config: WidgetConfig = {
    apiUrl,
    primaryColor: script.getAttribute('data-primary-color') || '#E30613',
    secondaryColor: script.getAttribute('data-secondary-color') || '#003087',
    position: (script.getAttribute('data-position') as 'bottom-right' | 'bottom-left') || 'bottom-right',
    companyName: script.getAttribute('data-company') || 'Hitech Steel Industries',
    botName: script.getAttribute('data-bot-name') || 'Hitech Assistant',
    autoOpen: script.getAttribute('data-auto-open') === 'true',
    autoOpenDelay: parseInt(script.getAttribute('data-auto-open-delay') || '5000')
  }

  const widget = new HitechChatWidgetClass()
  widget.init(config)

  // Expose to window for external control
  window.HitechChatWidget = {
    init: (cfg: WidgetConfig) => widget.init(cfg),
    destroy: () => widget.destroy(),
    open: () => widget.open(),
    close: () => widget.close(),
    toggle: () => widget.toggle(),
    version: HitechChatWidgetClass.VERSION
  }
}

// ============================================
// Initialize when DOM is ready
// ============================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFromScript)
} else {
  initFromScript()
}

// ============================================
// Export for module usage
// ============================================
export { HitechChatWidgetClass }
export type { WidgetConfig }
export default HitechChatWidgetClass
