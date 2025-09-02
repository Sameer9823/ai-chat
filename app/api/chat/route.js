import { NextResponse } from "next/server";

// Gemini API endpoint
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash";

// 🔹 Handle POST request
export async function POST(req) {
  try {
    const { messages, stream } = await req.json();

    // -------------------
    // ⚡ Normal Response
    // -------------------
    if (!stream) {
      const res = await fetch(`${GEMINI_API_URL}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: messages }] }],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini API error: ${res.status} ${err}`);
      }

      const data = await res.json();

      return NextResponse.json({
        response: data.candidates?.[0]?.content?.parts?.[0]?.text || "No response",
      });
    }

    // -------------------
    // ⚡ Streaming Response
    // -------------------
    const streamRes = await fetch(
      `${GEMINI_API_URL}:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: messages }] }],
        }),
      }
    );

    if (!streamRes.ok) {
      const err = await streamRes.text();
      throw new Error(`Gemini Stream API error: ${streamRes.status} ${err}`);
    }

    // Create a readable stream that passes Gemini's SSE stream to frontend
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readable = new ReadableStream({
      async start(controller) {
        const reader = streamRes.body.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            // Gemini sends data as "data: {...}"
            const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));
            for (const line of lines) {
              const json = line.replace("data: ", "").trim();
              if (json === "[DONE]") continue;

              try {
                const parsed = JSON.parse(json);
                controller.enqueue(encoder.encode(JSON.stringify(parsed) + "\n"));
              } catch (err) {
                console.error("⚠️ Stream JSON parse error:", err);
              }
            }
          }
        } catch (err) {
          console.error("❌ Streaming error:", err);
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch response", details: error.message },
      { status: 500 }
    );
  }
}
