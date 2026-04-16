# Hitech Steel Chat Plugin

An embeddable floating chat widget for Hitech Steel Industries website, powered by AI (Gemini LLM + Pinecone RAG).

## Features

- **Lead Collection Form**: Collects full name, email, phone, company, and inquiry type
- **AI Chat**: RAG-powered conversations using scraped website content
- **Human Escalation**: Option to talk to human with WhatsApp integration
- **MongoDB Storage**: Stores leads and conversation history
- **Floating Widget**: Non-intrusive floating button that opens modal
- **Responsive Design**: Works on desktop and mobile

## Architecture

### Frontend (Next.js + React)
- Embeddable widget component
- Form validation and submission
- Real-time chat interface
- Hosted on Vercel

### Backend (Node.js + Express)
- Lead creation and session management
- Chat API with streaming responses
- Human escalation with WhatsApp notifications
- MongoDB for data persistence
- Hosted on Vercel

### AI Pipeline
- **Scraping**: Website content scraped and stored in Pinecone vectors
- **RAG**: Retrieval-Augmented Generation using Gemini LLM
- **Embeddings**: OpenAI text-embedding-ada-002 for vectorization

## Installation

### For WordPress/Odoo Sites

Add this script tag to your website's `<head>` or before `</body>`:

```html
<script src="https://your-vercel-frontend-url/widget.js" data-api-url="https://your-vercel-backend-url"></script>
```

Or initialize manually:

```javascript
// Load the script
const script = document.createElement('script');
script.src = 'https://your-vercel-frontend-url/widget.js';
script.setAttribute('data-api-url', 'https://your-vercel-backend-url');
script.setAttribute('data-primary-color', '#E30613'); // Optional
script.setAttribute('data-secondary-color', '#003087'); // Optional
script.setAttribute('data-position', 'bottom-right'); // Optional: 'bottom-right' or 'bottom-left'
document.head.appendChild(script);
```

### Manual Initialization

```javascript
window.HitechChatWidget.init({
  apiUrl: 'https://your-vercel-backend-url',
  primaryColor: '#E30613',
  secondaryColor: '#003087',
  position: 'bottom-right'
});
```

## API Endpoints

### POST /api/lead
Creates a new lead and starts a chat session.

**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+966512345678",
  "company": "ABC Corp",
  "inquiryType": "Product Information"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "session_123456",
  "leadId": "lead_789"
}
```

### POST /api/chat
Streams AI responses for chat messages.

**Request:**
```json
{
  "sessionId": "session_123456",
  "message": "What products do you offer?"
}
```

**Response:** Server-Sent Events stream with chunks.

### POST /api/talk-to-human
Escalates conversation to human agent.

**Request:**
```json
{
  "sessionId": "session_123456",
  "notes": "Customer needs urgent assistance"
}
```

## Database Schema

### Leads Collection
```javascript
{
  _id: ObjectId,
  name: "John Doe - Chatbot Inquiry",
  fullName: "John Doe",
  email: "john@example.com",
  phone: "+966512345678",
  company: "ABC Corp",
  inquiryType: "Product Information",
  source: "Website Chatbot",
  status: "new",
  priority: "medium",
  conversationHistory: [],
  sessions: [],
  createdAt: Date,
  updatedAt: Date
}
```

### Conversations Collection
```javascript
{
  _id: ObjectId,
  leadId: ObjectId,
  sessionId: "session_123456",
  messages: [
    { role: "human", content: "Hello", timestamp: Date },
    { role: "ai", content: "Hi there!", timestamp: Date }
  ],
  createdAt: Date,
  updatedAt: Date,
  escalated: false
}
```

## Deployment

### Backend
1. Set environment variables in Vercel:
   - `MONGODB_URI`
   - `PINECONE_API_KEY`
   - `GEMINI_API_KEY`
   - `WHATSAPP_API_TOKEN` (optional)

2. Deploy to Vercel from `Hitech-rag-chatbot/` directory

### Frontend
1. Update `widget.ts` with correct backend URL
2. Build and deploy to Vercel from `frontend-plugin/` directory

## Development

### Backend
```bash
cd Hitech-rag-chatbot
npm install
npm run dev
```

### Frontend
```bash
cd frontend-plugin
npm install
npm run dev
```

### Scraping
```bash
cd Hitech-rag-chatbot
node scrape-and-ingest.js
```

## Security Notes

- All API calls use HTTPS
- Input validation on all endpoints
- Rate limiting implemented
- CORS configured for widget embedding
- Sensitive data encrypted in MongoDB

## WhatsApp Integration

When users request human contact:
1. Backend sends notification to sales team WhatsApp
2. Widget provides direct WhatsApp link to company number
3. Conversation history is attached to escalation

Update the WhatsApp number in `escalateToHuman` function in `ChatWidget.tsx`.