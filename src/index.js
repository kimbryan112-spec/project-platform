import projectsApi from './api/projects.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route API requests to the projects handler
    if (url.pathname === '/api/projects') {
      if (request.method === 'GET') {
        return await projectsApi.onRequestGet({ env });
      } else if (request.method === 'POST') {
        return await projectsApi.onRequestPost({ env, request });
      }
    }

    // Return 404 for unknown routes
    return new Response(JSON.stringify({ error: 'Not Found' }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
