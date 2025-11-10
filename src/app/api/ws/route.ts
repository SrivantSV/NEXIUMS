/**
 * WebSocket API Route
 *
 * Note: This is a placeholder for WebSocket handling in Next.js.
 * For production, you should use a separate WebSocket server (e.g., using ws, socket.io)
 * or deploy to a platform that supports WebSocket connections (e.g., Vercel with serverless functions).
 *
 * For local development with full WebSocket support, consider:
 * 1. Creating a custom server.js using Node.js
 * 2. Using a separate WebSocket server on a different port
 * 3. Using a service like Ably, Pusher, or Socket.io for managed WebSockets
 */

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const conversationId = searchParams.get('conversationId');

  return new Response(
    JSON.stringify({
      error: 'WebSocket connections not supported in this deployment mode',
      message: 'Please use a dedicated WebSocket server or upgrade to a WebSocket-compatible hosting platform',
      documentation: 'See README.md for WebSocket server setup instructions',
      params: {
        userId,
        conversationId,
      },
    }),
    {
      status: 501,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
