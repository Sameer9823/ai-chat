import OpenAI from "openai";
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
    try {
        const { messages } = await req.json();
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "user",
                content: messages,
            }],
        });

        return Response.json({
            response: response.choices[0].message.content,
        });
        
    } catch (error) {
        return Response.json({
            error: "An error occurred while processing your request.",

        }, { status: 500 });
        
    }
}

