import { onRequestGet, onRequestPost } from './api/projects.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route API requests to the projects handler
    if (url.pathname === '/api/projects') {
      if (request.method === 'GET') {
        return onRequestGet({ env });
      } else if (request.method === 'POST') {
        return onRequestPost({ env, request });
      }
    }

    // Serve static files or return 404
    return new Response('Not Found', { status: 404 });
  }
};
