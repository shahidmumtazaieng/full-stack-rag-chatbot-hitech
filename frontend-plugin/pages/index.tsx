import type { NextPage } from 'next'
import dynamic from 'next/dynamic'

// Dynamically import the widget to avoid SSR issues
const ChatWidget = dynamic(() => import('../components/ChatWidget'), {
  ssr: false,
  loading: () => <div>Loading widget...</div>
})

const Home: NextPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Hitech Steel Industries
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-Powered Customer Support Chatbot
          </p>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Widget Demo</h2>
            <p className="text-gray-600 mb-6">
              Click the floating chat button in the bottom-right corner to test the widget.
              The widget will guide you through the lead form and chat interface.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold mb-2">Test Flow:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>Click the chat button</li>
                <li>Fill out the lead form</li>
                <li>Start chatting with the AI assistant</li>
                <li>Try escalating to a human agent</li>
              </ol>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            <p>Backend API: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3000</code></p>
            <p>Make sure your Node.js backend is running on port 3000</p>
          </div>
        </div>
      </div>

      {/* Widget will appear as floating button */}
      <ChatWidget
        apiUrl="http://localhost:3000"
        primaryColor="#E30613"
        secondaryColor="#003087"
        position="bottom-right"
      />
    </div>
  )
}

export default Home