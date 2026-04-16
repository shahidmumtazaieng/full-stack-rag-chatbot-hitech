import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, User, Bot } from 'lucide-react'

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
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
  apiUrl,
  primaryColor = '#E30613',
  secondaryColor = '#003087',
  position = 'bottom-right'
}) => {
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
    inquiryType: 'General'
  })
  const [formErrors, setFormErrors] = useState<Partial<LeadForm>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const validateForm = (): boolean => {
    const errors: Partial<LeadForm> = {}

    if (!formData.fullName.trim() || formData.fullName.length < 2) {
      errors.fullName = 'Full name required (min 2 characters)'
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Valid email address required'
    }

    if (!formData.phone.trim() || !/^\d{7,15}$/.test(formData.phone.replace(/[\s\-().+]/g, ''))) {
      errors.phone = 'Valid phone number required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

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
      setMessages([{
        role: 'assistant',
        content: `Hi ${formData.fullName}! 👋 I'm the Hitech Steel AI Assistant. I'm here to help you with product information, pricing, technical support, and more. How can I assist you today?`,
        timestamp: new Date()
      }])

    } catch (error) {
      console.error('Form submission error:', error)
      alert('Failed to start chat. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || !sessionId) return

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: content.trim() })
      })

      if (!response.ok) throw new Error('Failed to send message')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let fullResponse = ''

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
                  const newMessages = [...prev]
                  const lastMessage = newMessages[newMessages.length - 1]
                  if (lastMessage?.role === 'assistant' && !lastMessage.content.includes('data: ')) {
                    lastMessage.content = fullResponse
                  } else {
                    newMessages.push({
                      role: 'assistant',
                      content: fullResponse,
                      timestamp: new Date()
                    })
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

    } catch (error) {
      console.error('Message send error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const input = inputRef.current
      if (input?.value.trim()) {
        sendMessage(input.value)
        input.value = ''
      }
    }
  }

  const escalateToHuman = async () => {
    if (!sessionId) return

    const confirmed = confirm('Would you like to speak with a human representative? We\'ll forward your conversation to our team.')

    if (!confirmed) return

    try {
      await fetch(`${apiUrl}/api/talk-to-human`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, notes: 'Customer requested human agent from widget' })
      })

      // Provide WhatsApp link
      const whatsappMessage = encodeURIComponent(`Hi, I was chatting with your AI assistant and need to speak with a human. My details: ${formData.fullName}, ${formData.email}, ${formData.phone}`)
      const whatsappUrl = `https://wa.me/966123456789?text=${whatsappMessage}` // Replace with actual WhatsApp number

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ Your request has been forwarded to our team. A representative will contact you shortly.\n\nAlternatively, you can contact us directly via WhatsApp: [Click here to WhatsApp us](${whatsappUrl})`,
        timestamp: new Date()
      }])

    } catch (error) {
      console.error('Escalation error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Could not connect right now. Please contact us directly via WhatsApp or call us.',
        timestamp: new Date()
      }])
    }
  }

  const renderMessageContent = (content: string) => {
    // Simple link parsing: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = linkRegex.exec(content)) !== null) {
      // Add text before link
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index))
      }
      // Add link
      parts.push(
        <a
          key={match.index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:no-underline"
        >
          {match[1]}
        </a>
      )
      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex))
    }

    return parts.length > 0 ? parts : content
  }

  const positionClasses = position === 'bottom-left'
    ? 'left-6 right-auto'
    : 'right-6 left-auto'

  return (
    <>
      {/* Widget Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 ${positionClasses} z-50 w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center text-white`}
        style={{ backgroundColor: primaryColor }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className={`fixed bottom-20 ${positionClasses} z-40 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
          {/* Header */}
          <div
            className="p-4 text-white rounded-t-2xl flex items-center justify-between"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                🏭
              </div>
              <div>
                <h3 className="font-semibold">Hitech Steel Assistant</h3>
                <p className="text-sm opacity-90">Online — Usually replies instantly</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            {currentScreen === 'form' ? (
              /* Form Screen */
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="text-center mb-6">
                  <p className="text-gray-600">
                    Welcome to Hitech Steel Industries! Please share your details to start a conversation.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${formErrors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter your full name"
                      required
                    />
                    {formErrors.fullName && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="your@email.com"
                      required
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${formErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="+966 5xxxxxxxx"
                      required
                    />
                    {formErrors.phone && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Your company name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inquiry Type
                    </label>
                    <select
                      value={formData.inquiryType}
                      onChange={(e) => setFormData(prev => ({ ...prev, inquiryType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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

                <button
                  onClick={submitForm}
                  disabled={isSubmitting}
                  className="w-full mt-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>{isSubmitting ? 'Starting Conversation...' : 'Start Conversation'}</span>
                </button>

                <p className="text-center text-sm text-gray-500 mt-4">
                  By submitting, you agree to our privacy policy. Your information is secure and will only be used to assist with your inquiry.
                </p>
              </div>
            ) : (
              /* Chat Screen */
              <>
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot size={16} className="text-primary-600" />
                        </div>
                      )}
                      <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{renderMessageContent(message.content)}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <User size={16} className="text-white" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <Bot size={16} className="text-primary-600" />
                      </div>
                      <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={escalateToHuman}
                    className="w-full mb-3 py-2 px-4 rounded-lg border-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                    style={{ borderColor: secondaryColor, color: secondaryColor }}
                  >
                    👤 Talk to a Human
                  </button>

                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Type your message..."
                      onKeyPress={handleKeyPress}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={isTyping}
                    />
                    <button
                      onClick={() => {
                        const input = inputRef.current
                        if (input?.value.trim()) {
                          sendMessage(input.value)
                          input.value = ''
                        }
                      }}
                      disabled={isTyping}
                      className="px-4 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: primaryColor }}
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