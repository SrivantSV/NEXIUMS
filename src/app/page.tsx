/**
 * Nexus AI - Home Page
 */

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          Nexus AI - Advanced AI Model Integration
        </h1>

        <p className="text-xl mb-8 text-gray-600">
          Complete AI model integration and smart routing system supporting 25+ AI models
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3">🤖 25+ Models</h2>
            <p className="text-gray-600">
              Anthropic, OpenAI, Google, DeepSeek, Mistral, and more
            </p>
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3">🎯 Smart Router</h2>
            <p className="text-gray-600">
              Advanced routing with intent classification and cost optimization
            </p>
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3">📊 Analytics</h2>
            <p className="text-gray-600">
              Real-time performance tracking and A/B testing
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Start</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Install Dependencies</h3>
              <pre className="bg-gray-900 text-white p-3 rounded">
                npm install
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Configure Environment</h3>
              <pre className="bg-gray-900 text-white p-3 rounded">
                cp .env.example .env
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Run Development Server</h3>
              <pre className="bg-gray-900 text-white p-3 rounded">
                npm run dev
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">4. Make Your First Request</h3>
              <pre className="bg-gray-900 text-white p-3 rounded overflow-x-auto">
{`curl -X POST http://localhost:3000/api/ai/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "userId": "demo-user"
  }'`}
              </pre>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">API Endpoints</h2>

          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 pl-4">
              <code className="font-mono">POST /api/ai/chat</code>
              <p className="text-gray-600">Generate AI responses with smart routing</p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <code className="font-mono">GET /api/ai/models</code>
              <p className="text-gray-600">List available AI models</p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <code className="font-mono">GET /api/ai/analytics</code>
              <p className="text-gray-600">Get performance metrics</p>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <code className="font-mono">POST /api/ai/test</code>
              <p className="text-gray-600">A/B testing for model comparison</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Documentation</h2>
          <ul className="space-y-2">
            <li>
              <a href="/README.md" className="text-blue-600 hover:underline">
                📖 Full Documentation
              </a>
            </li>
            <li>
              <a href="/API.md" className="text-blue-600 hover:underline">
                🔌 API Reference
              </a>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
