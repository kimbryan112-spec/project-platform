/* ==================================
    OPENAI API HELPER
================================== */

export async function askOpenAI(prompt, apiKey) {
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // O kaya ay "gpt-4o" depende sa gusto mo
                messages: [
                    {
                        role: "system",
                        content: "You are a professional music director and wedding film assistant. Always return valid JSON only, without markdown code blocks if possible, or formatted cleanly."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[OPENAI API ERROR RESPONSE]:", errorText);
            throw new Error(`OpenAI API failed with status ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "{}";

        return JSON.parse(content);
    } catch (err) {
        console.error("[OPENAI HELPER ERROR]:", err.message);
        throw err;
    }
}