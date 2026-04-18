import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  MessageCircle, 
  X, 
  Send, 
  User, 
  Bot, 
  Phone,
  Check,
  AlertCircle,
  Loader2,
  Headphones,
  FlaskConical
} from 'lucide-react'

// ============================================
// Types
// ============================================
interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface LeadForm {
  fullName: string
  email: string
  phone: string
  company: string
  inquiryType: string
}

interface ChatWidgetProps {
  apiUrl: string
  primaryColor?: string
  secondaryColor?: string
  position?: 'bottom-right' | 'bottom-left'
  companyName?: string
  botName?: string
}

// ============================================
// SVG Icons Components
// ============================================
const LogoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
)

// ============================================
// Component
// ============================================
const ChatWidget: React.FC<ChatWidgetProps> = ({
  apiUrl,
  primaryColor = '#E30613',
  secondaryColor = '#003087',
  position = 'bottom-right',
  companyName = 'Hitech Steel Industries',
  botName = 'Hitech Assistant'
}) => {
  // State
  const [isOpen, setIsOpen] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<'form' | 'chat'>('form')
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [formData, setFormData] = useState<LeadForm>({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    inquiryType: ''
  })
  const [formErrors, setFormErrors] = useState<Partial<LeadForm>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isEscalated, setIsEscalated] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ============================================
  // Helpers
  // ============================================
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && currentScreen === 'chat' && !isTyping) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, currentScreen, isTyping])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // ============================================
  // Validation
  // ============================================
  const validateForm = (): boolean => {
    const errors: Partial<LeadForm> = {}

    if (!formData.fullName.trim() || formData.fullName.length < 2) {
      errors.fullName = 'Full name is required (min 2 characters)'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    // Phone validation - flexible for international
    const phoneCleaned = formData.phone.replace(/[\s\-().+]/g, '')
    if (!formData.phone.trim() || phoneCleaned.length < 7 || phoneCleaned.length > 15) {
      errors.phone = 'Please enter a valid phone number'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ============================================
  // API Calls
  // ============================================
  const submitForm = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`${apiUrl}/api/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.errors?.[0]?.message || data.error || 'Failed to start chat')
      }

      setSessionId(data.sessionId)
      setCurrentScreen('chat')

      // Add welcome message
      const welcomeMessage: Message = {
        role: 'assistant',
        content: `Hello! I'm your AI assistant. I can help you with information about our steel products, services, and answer any questions you may have. How can I assist you today?`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])

    } catch (error: any) {
      console.error('Form submission error:', error)
      setFormErrors({ fullName: error.message || 'Failed to start chat. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || !sessionId || isTyping) return

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: content.trim() })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to send message')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let fullResponse = ''
      let assistantMessageAdded = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.chunk) {
                fullResponse += data.chunk
                
                setMessages(prev => {
                  if (!assistantMessageAdded) {
                    assistantMessageAdded = true
                    return [...prev, {
                      role: 'assistant',
                      content: fullResponse,
                      timestamp: new Date()
                    }]
                  }
                  const newMessages = [...prev]
                  const lastMessage = newMessages[newMessages.length - 1]
                  if (lastMessage?.role === 'assistant') {
                    lastMessage.content = fullResponse
                  }
                  return newMessages
                })
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

    } catch (error: any) {
      console.error('Message send error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or click "Talk to Human" for assistance.',
        timestamp: new Date()
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const escalateToHuman = async () => {
    if (!sessionId || isEscalated) return

    const confirmed = window.confirm('Would you like to speak with a human representative? We\'ll forward your conversation to our team.')
    if (!confirmed) return

    try {
      const response = await fetch(`${apiUrl}/api/talk-to-human`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId, 
          notes: `Customer requested human agent. Inquiry type: ${formData.inquiryType || 'General'}` 
        })
      })

      if (!response.ok) throw new Error('Failed to escalate')

      setIsEscalated(true)
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Your request has been forwarded to our team. A representative will contact you shortly at ${formData.phone} or ${formData.email}.\n\nThank you for your patience!`,
        timestamp: new Date()
      }])

    } catch (error) {
      console.error('Escalation error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Could not connect right now. Please contact us directly via phone or email.',
        timestamp: new Date()
      }])
    }
  }

  // ============================================
  // Event Handlers
  // ============================================
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputValue.trim() && !isTyping) {
        sendMessage(inputValue)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  // ============================================
  // Render Helpers
  // ============================================
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const renderMessageContent = (content: string) => {
    // Convert URLs to links
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = content.split(urlRegex)
    
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
            style={{ color: 'inherit' }}
          >
            {part}
          </a>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  // ============================================
  // Position Classes
  // ============================================
  const buttonPositionClasses = position === 'bottom-left'
    ? 'left-6'
    : 'right-6'

  // ============================================
  // Render
  // ============================================
  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 ${buttonPositionClasses} z-[999999] w-14 h-14 rounded-full 
          transition-all duration-300 ease-out flex items-center justify-center text-white
          hover:scale-105 active:scale-95 shadow-lg`}
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor} 0%, #C00510 100%)`,
          boxShadow: '0 10px 15px -3px rgba(227, 6, 19, 0.3)'
        }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <MessageCircle size={24} />
        )}
        
        {/* Pulse animation ring */}
        {!isOpen && (
          <span 
            className="absolute inset-[-4px] rounded-full opacity-40 -z-10 animate-[pulse-ring_2s_ease-in-out_infinite]"
            style={{ background: primaryColor }}
          />
        )}
      </button>

      {/* Chat Container */}
      {isOpen && (
        <div 
          ref={containerRef}
          className={`fixed bottom-24 ${buttonPositionClasses} z-[999998] 
            w-[380px] h-[600px] max-h-[calc(100vh-140px)]
            bg-white rounded-3xl overflow-hidden shadow-2xl
            transition-all duration-300 ease-out animate-[slideUp_0.3s_ease]
            flex flex-col`}
        >
          {/* Header */}
          <div 
            className="p-4 flex items-center gap-3 flex-shrink-0"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor} 0%, #C00510 100%)` 
            }}
          >
            {/* Avatar */}
            <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-6 h-6" style={{ color: primaryColor }}>
                <LogoIcon />
              </div>
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-base truncate">{botName}</h3>
              <div className="flex items-center gap-1.5 text-white/80 text-xs">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>AI-powered support</span>
              </div>
            </div>
            
            {/* Close Button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center
                transition-all duration-200 flex-shrink-0"
              aria-label="Close chat"
            >
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#F8F9FA' }}>
            {currentScreen === 'form' ? (
              /* Lead Form Screen */
              <div className="flex-1 overflow-y-auto p-6">
                {/* Form Container */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  {/* Form Header */}
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Get Started</h2>
                    <p className="text-gray-500 text-sm">
                      Please provide your details so we can assist you better.
                    </p>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Full Name <span style={{ color: primaryColor }}>*</span>
                    </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, fullName: e.target.value }))
                          if (formErrors.fullName) setFormErrors(prev => ({ ...prev, fullName: undefined }))
                        }}
                        className="w-full px-4 py-3 bg-white border-2 rounded-xl text-sm transition-all duration-200
                          focus:outline-none"
                        style={{
                          borderColor: formErrors.fullName ? '#EA4335' : '#E8EAED',
                        }}
                        onFocus={(e) => e.target.style.borderColor = primaryColor}
                        onBlur={(e) => e.target.style.borderColor = formErrors.fullName ? '#EA4335' : '#E8EAED'}
                        placeholder="Enter your full name"
                      />
                      {formErrors.fullName && (
                        <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500">
                          <AlertCircle size={12} />
                          {formErrors.fullName}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Email Address <span style={{ color: primaryColor }}>*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, email: e.target.value }))
                          if (formErrors.email) setFormErrors(prev => ({ ...prev, email: undefined }))
                        }}
                        className="w-full px-4 py-3 bg-white border-2 rounded-xl text-sm transition-all duration-200
                          focus:outline-none"
                        style={{
                          borderColor: formErrors.email ? '#EA4335' : '#E8EAED',
                        }}
                        onFocus={(e) => e.target.style.borderColor = primaryColor}
                        onBlur={(e) => e.target.style.borderColor = formErrors.email ? '#EA4335' : '#E8EAED'}
                        placeholder="your@email.com"
                      />
                      {formErrors.email && (
                        <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500">
                          <AlertCircle size={12} />
                          {formErrors.email}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Phone Number <span style={{ color: primaryColor }}>*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, phone: e.target.value }))
                          if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: undefined }))
                        }}
                        className="w-full px-4 py-3 bg-white border-2 rounded-xl text-sm transition-all duration-200
                          focus:outline-none"
                        style={{
                          borderColor: formErrors.phone ? '#EA4335' : '#E8EAED',
                        }}
                        onFocus={(e) => e.target.style.borderColor = primaryColor}
                        onBlur={(e) => e.target.style.borderColor = formErrors.phone ? '#EA4335' : '#E8EAED'}
                        placeholder="+966 5xxxxxxxx"
                      />
                      {formErrors.phone && (
                        <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500">
                          <AlertCircle size={12} />
                          {formErrors.phone}
                        </p>
                      )}
                    </div>

                    {/* Company */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Company (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm 
                          transition-all duration-200 focus:outline-none"
                        style={{ borderColor: '#E8EAED' }}
                        onFocus={(e) => e.target.style.borderColor = primaryColor}
                        onBlur={(e) => e.target.style.borderColor = '#E8EAED'}
                        placeholder="Your company name"
                      />
                    </div>

                    {/* Inquiry Type */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Inquiry Type
                      </label>
                      <select
                        value={formData.inquiryType}
                        onChange={(e) => setFormData(prev => ({ ...prev, inquiryType: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm 
                          transition-all duration-200 focus:outline-none appearance-none cursor-pointer"
                        style={{ 
                          borderColor: '#E8EAED',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 12px center',
                          backgroundSize: '20px',
                          paddingRight: '40px'
                        }}
                        onFocus={(e) => e.target.style.borderColor = primaryColor}
                        onBlur={(e) => e.target.style.borderColor = '#E8EAED'}
                      >
                        <option value="">Select inquiry type</option>
                        <option value="Product Information">Product Information</option>
                        <option value="Pricing Quote">Pricing Quote</option>
                        <option value="Technical Support">Technical Support</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Careers">Careers</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={submitForm}
                    disabled={isSubmitting}
                    className="w-full mt-6 py-3.5 px-6 rounded-xl text-white font-semibold text-sm
                      transition-all duration-200 flex items-center justify-center gap-2
                      disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{ 
                      background: `linear-gradient(135deg, ${primaryColor} 0%, #C00510 100%)`,
                      boxShadow: `0 4px 14px ${primaryColor}40`
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Starting Conversation...</span>
                      </>
                    ) : (
                      <>
                        <span>Start Conversation</span>
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
                    By submitting, you agree to our privacy policy. Your information is secure and will only be used to assist with your inquiry.
                  </p>
                </div>
              </div>
            ) : (
              /* Chat Screen */
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Welcome Message */}
                  <div 
                    className="bg-white rounded-2xl p-4 shadow-sm"
                    style={{ borderLeft: `4px solid ${primaryColor}` }}
                  >
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Welcome to {companyName}!</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Hello! I'm your AI assistant. I can help you with information about our steel products, services, and answer any questions you may have. How can I assist you today?
                    </p>
                  </div>

                  {messages.slice(1).map((message, index) => (
                    <div 
                      key={index} 
                      className={`flex gap-2.5 max-w-[85%] ${message.role === 'user' ? 'ml-auto' : ''} animate-[fadeIn_0.3s_ease]`}
                    >
                      {message.role === 'assistant' && (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #C00510 100%)` }}
                        >
                          <Bot size={16} className="text-white" />
                        </div>
                      )}
                      
                      <div className={`${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div 
                          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                            message.role === 'user'
                              ? 'bg-white text-gray-800 shadow-sm'
                              : 'text-white'
                          }`}
                          style={message.role === 'assistant' 
                            ? { 
                                background: `linear-gradient(135deg, ${primaryColor} 0%, #C00510 100%)`,
                                borderBottomLeftRadius: '4px'
                              }
                            : { borderBottomRightRadius: '4px' }
                          }
                        >
                          {renderMessageContent(message.content)}
                        </div>
                        <span className={`text-xs mt-1 block ${message.role === 'user' ? 'text-right text-gray-400' : 'text-gray-400'}`}>
                          {formatTime(message.timestamp)}
                        </span>
                      </div>

                      {message.role === 'user' && (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: secondaryColor }}
                        >
                          <User size={16} className="text-white" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex gap-2.5">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #C00510 100%)` }}
                      >
                        <Bot size={16} className="text-white" />
                      </div>
                      <div 
                        className="px-4 py-3 rounded-2xl text-white text-sm"
                        style={{ 
                          background: `linear-gradient(135deg, ${primaryColor} 0%, #C00510 100%)`,
                          borderBottomLeftRadius: '4px'
                        }}
                      >
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Talk to Human Button */}
                {!isEscalated && (
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-center">
                    <button
                      onClick={escalateToHuman}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                        bg-white border-2 rounded-lg transition-all duration-200
                        hover:text-white"
                      style={{ 
                        borderColor: secondaryColor, 
                        color: secondaryColor
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = secondaryColor
                        e.currentTarget.style.color = 'white'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white'
                        e.currentTarget.style.color = secondaryColor
                      }}
                    >
                      <Phone size={16} />
                      <span>Talk to Human</span>
                    </button>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="flex gap-3 items-end">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder={isEscalated ? 'Conversation ended - A representative will contact you' : 'Type your message...'}
                      disabled={isTyping || isEscalated}
                      rows={1}
                      className="flex-1 min-h-[44px] max-h-[120px] px-4 py-3 bg-gray-50 border-2 border-gray-200 
                        rounded-xl text-sm resize-none transition-all duration-200
                        focus:outline-none focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      style={{ 
                        borderColor: '#E8EAED',
                      }}
                      onFocus={(e) => e.target.style.borderColor = primaryColor}
                      onBlur={(e) => e.target.style.borderColor = '#E8EAED'}
                    />
                    <button
                      onClick={() => inputValue.trim() && sendMessage(inputValue)}
                      disabled={!inputValue.trim() || isTyping || isEscalated}
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white
                        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                        hover:scale-105 active:scale-95 flex-shrink-0"
                      style={{ 
                        background: `linear-gradient(135deg, ${primaryColor} 0%, #C00510 100%)` 
                      }}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </>
  )
}

export default ChatWidget
