import React from 'react'
import { createRoot } from 'react-dom/client'
import ChatWidget from './components/ChatWidget'

interface WidgetConfig {
  apiUrl: string
  primaryColor?: string
  secondaryColor?: string
  position?: 'bottom-right' | 'bottom-left'
}

declare global {
  interface Window {
    HitechChatWidget?: {
      init: (config: WidgetConfig) => void
      destroy: () => void
    }
  }
}

class HitechChatWidget {
  private container: HTMLElement | null = null
  private root: any = null

  init(config: WidgetConfig) {
    // Prevent double initialization
    if (window.HitechChatWidget) {
      console.warn('Hitech Chat Widget already initialized')
      return
    }

    // Create container
    this.container = document.createElement('div')
    this.container.id = 'hitech-chat-widget-root'
    document.body.appendChild(this.container)

    // Render React component
    this.root = createRoot(this.container)
    this.root.render(<ChatWidget {...config} />)

    // Mark as initialized
    window.HitechChatWidget = this
  }

  destroy() {
    if (this.root) {
      this.root.unmount()
      this.root = null
    }

    if (this.container) {
      document.body.removeChild(this.container)
      this.container = null
    }

    delete window.HitechChatWidget
  }
}

// Auto-initialize if script has data attributes
const initFromScript = () => {
  const script = document.currentScript as HTMLScriptElement
  if (!script) return

  const apiUrl = script.getAttribute('data-api-url')
  if (!apiUrl) return

  const config: WidgetConfig = {
    apiUrl,
    primaryColor: script.getAttribute('data-primary-color') || '#E30613',
    secondaryColor: script.getAttribute('data-secondary-color') || '#003087',
    position: (script.getAttribute('data-position') as 'bottom-right' | 'bottom-left') || 'bottom-right'
  }

  const widget = new HitechChatWidget()
  widget.init(config)
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFromScript)
} else {
  initFromScript()
}

// Export for manual initialization
export default HitechChatWidget