export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. GET ALL PROJECTS
      if (url.pathname === '/api/projects' && request.method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM projects ORDER BY row_index ASC'
        ).all();

        return new Response(JSON.stringify(results), { headers: corsHeaders });
      }

      // 2. AUTO-SAVE / UPDATE ROW
      if (url.pathname === '/api/projects/save' && request.method === 'POST') {
        const body = await request.json();
        const { row_index, ...data } = body;

        if (!row_index) {
          return new Response(JSON.stringify({ error: 'Missing row_index' }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        const query = `
          INSERT INTO projects (
            row_index, couple_name, status, type, raw_files, drone,
            song1_link, song1_status, song2_link, song2_status,
            song3_link, song3_status, teaser_link, teaser_status, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(row_index) DO UPDATE SET
            couple_name = excluded.couple_name,
            status = excluded.status,
            type = excluded.type,
            raw_files = excluded.raw_files,
            drone = excluded.drone,
            song1_link = excluded.song1_link,
            song1_status = excluded.song1_status,
            song2_link = excluded.song2_link,
            song2_status = excluded.song2_status,
            song3_link = excluded.song3_link,
            song3_status = excluded.song3_status,
            teaser_link = excluded.teaser_link,
            teaser_status = excluded.teaser_status,
            updated_at = CURRENT_TIMESTAMP
        `;

        await env.DB.prepare(query)
          .bind(
            row_index,
            data.couple_name || '',
            data.status || 'IN PROGRESS',
            data.type || 'UPBEAT CINEMATIC',
            data.raw_files || '',
            data.drone || '',
            data.song1_link || '',
            data.song1_status || '',
            data.song2_link || '',
            data.song2_status || '',
            data.song3_link || '',
            data.song3_status || '',
            data.teaser_link || '',
            data.teaser_status || ''
          )
          .run();

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: corsHeaders,
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};