// Kukunin ang data mula sa KV (GET request)
export async function onRequestGet(context) {
    try {
        const data = await context.env.PROJECTS_KV.get('projects_data');
        return new Response(data || '[]', {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// Isasave ang data sa KV (POST request)
export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        await context.env.PROJECTS_KV.put('projects_data', JSON.stringify(body));
        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}