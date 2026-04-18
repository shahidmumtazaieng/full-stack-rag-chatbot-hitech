# Hitech Steel Industries - Professional Chat Widget

A production-ready, embeddable RAG chatbot widget for Hitech Steel Industries with lead capture and human escalation capabilities.

## Features

- **Lead Capture Form**: Collects required information (name, email, phone) before starting chat
- **AI-Powered Chat**: Uses RAG (Retrieval-Augmented Generation) with company website content
- **Streaming Responses**: Real-time chat with typing indicators
- **Human Escalation**: Option to connect with human representatives
- **Session Persistence**: Maintains conversation state across page refreshes
- **Responsive Design**: Works on desktop and mobile devices
- **Professional UI**: Matches Hitech Steel Industries branding

## Quick Start

### 1. Backend Setup

Make sure your Node.js backend is running on port 3000:

```bash
cd Hitech-rag-chatbot
npm install
node server.js
```

### 2. Widget Integration

Add these files to your website:
- `styles.css` - Widget styling
- `widget.js` - Widget functionality

### 3. HTML Integration

Add this to your HTML:

```html
<!-- Chat Widget Container -->
<div id="hitech-chat-widget"></div>

<!-- Configure API URL (optional, defaults to current domain) -->
<script>
  window.HITECH_CHAT_API_URL = 'https://your-api-domain.com';
</script>

<!-- Load the widget -->
<script src="widget.js"></script>
```

## Configuration Options

### Via Script Attributes

```html
<script src="widget.js" data-api-url="https://your-api.com"></script>
```

### Via JavaScript

```javascript
window.HITECH_CHAT_API_URL = 'https://your-api.com';
```

## API Endpoints

The widget expects these API endpoints:

- `POST /api/lead` - Create new lead and start session
- `POST /api/chat` - Send chat message (streaming response)
- `POST /api/talk-to-human` - Escalate to human agent

## Demo

To test the widget:

1. Start the backend server on port 3000
2. Open `index.html` in a browser
3. Click the floating chat button
4. Fill out the lead form
5. Start chatting with the AI assistant

## File Structure

```
frontend-plugin/
├── public/
│   ├── index.html      # Demo page
│   ├── styles.css      # Widget styles
│   └── widget.js       # Widget JavaScript
├── components/
│   └── ChatWidget.tsx  # React component (alternative)
└── pages/
    ├── _app.tsx
    └── index.tsx
```

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Customization

### Colors

Edit the CSS variables in `styles.css`:

```css
:root {
  --hitech-primary: #E30613;
  --hitech-secondary: #003087;
  --hitech-accent: #34A853;
}
```

### Text/Content

Edit the CONFIG object in `widget.js`:

```javascript
const CONFIG = {
  companyName: 'Your Company Name',
  botName: 'Your Bot Name',
  welcomeMessage: 'Your welcome message...',
  // ... other options
};
```

## Troubleshooting

### Widget Not Loading

1. Check browser console for JavaScript errors
2. Ensure `widget.js` and `styles.css` are accessible
3. Verify API URL is correct and backend is running

### API Connection Issues

1. Check CORS settings on your backend
2. Verify API endpoints match expected format
3. Check network tab in browser dev tools

### Form Validation

The widget validates:
- Required fields (name, email, phone)
- Email format
- Phone number format (accepts international numbers)

## Security Notes

- All user data is sent via HTTPS in production
- Session data is stored locally in browser
- No sensitive data is logged to console
- API calls include proper error handling

## License

This widget is proprietary to Hitech Steel Industries.

```
frontend-plugin/
├── components/
│   └── ChatWidget.tsx      # Main widget component
├── pages/
│   ├── _app.tsx           # App wrapper with global styles
│   └── index.tsx          # Demo page
├── styles/
│   └── globals.css        # Tailwind CSS imports
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind configuration
└── package.json           # Dependencies and scripts
```

## API Integration

The widget communicates with your Node.js backend API:

- `POST /api/lead` - Submit lead form
- `POST /api/chat` - Send chat messages (streaming)
- `POST /api/talk-to-human` - Escalate to human

## Customization

### Colors
```javascript
<ChatWidget
  apiUrl="https://api.example.com"
  primaryColor="#your-color"
  secondaryColor="#your-color"
/>
```

### Position
```javascript
<ChatWidget
  position="bottom-left" // or "bottom-right"
/>
```

### API URL
```javascript
<ChatWidget
  apiUrl="https://your-api-endpoint.com"
/>
```

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Deploy automatically

### Manual Build
```bash
npm run build:widget
# Upload out/ directory to your CDN
```

## Development

### Component Structure
- `ChatWidget`: Main container component
- Form handling with validation
- Real-time chat with streaming
- Human escalation flow

### State Management
- React hooks for local state
- No external state libraries needed

### Styling
- Tailwind CSS for utility classes
- Custom color variables
- Responsive design patterns