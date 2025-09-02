"use client";
import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState(""); // final response
  const [streamResponse, setStreamResponse] = useState(""); // live stream
  const [loadingNormal, setLoadingNormal] = useState(false);
  const [loadingStream, setLoadingStream] = useState(false);

  // 🚀 Normal (non-streaming) request
  const handleNormalChat = async () => {
    if (!message.trim()) return;
    setLoadingNormal(true);
    setResponse("");
    setStreamResponse("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: message, stream: false }),
      });

      if (!res.ok) throw new Error("Failed to fetch response");

      const data = await res.json();
      setResponse(data?.response || "No response received.");
    } catch (error) {
      setResponse("❌ Error: " + (error?.message || "Unknown"));
    } finally {
      setLoadingNormal(false);
    }
  };

  // ⚡ Streaming request
  const handleStreamChat = async () => {
    if (!message.trim()) return;
    setLoadingStream(true);
    setResponse("");
    setStreamResponse("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: message, stream: true }),
      });

      if (!res.body) throw new Error("No response stream received.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              accumulated += text;
              setStreamResponse(accumulated);
            }
          } catch (err) {
            console.error("⚠️ Failed to parse stream line:", line, err);
          }
        }
      }

      setResponse(accumulated || "No response received.");
    } catch (error) {
      setResponse("❌ Error: " + (error?.message || "Unknown"));
    } finally {
      setLoadingStream(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-gray-200 p-6">
      <h1 className="text-4xl font-extrabold text-center mt-6 mb-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400 drop-shadow-lg">
        ⚡ AI Chat Playground
      </h1>

      {/* Input */}
      <div className="max-w-2xl mx-auto mt-6 p-6 rounded-2xl shadow-lg bg-white/10 backdrop-blur-md border border-white/20">
        <textarea
          className="w-full p-4 rounded-lg bg-black/40 border border-white/20 focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400 outline-none"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="💡 Type your message here..."
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-center gap-6 mt-6">
        <button
          className={`px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 ${
            loadingNormal
              ? "bg-blue-900/70 text-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-blue-700 hover:scale-105 hover:shadow-blue-500/50"
          }`}
          onClick={handleNormalChat}
          disabled={loadingNormal}
        >
          {loadingNormal ? "⏳ Loading..." : "🚀 Send (Normal)"}
        </button>

        <button
          className={`px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 ${
            loadingStream
              ? "bg-green-900/70 text-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-green-500 to-green-700 hover:scale-105 hover:shadow-green-500/50"
          }`}
          onClick={handleStreamChat}
          disabled={loadingStream}
        >
          {loadingStream ? "🌊 Streaming..." : "⚡ Send (Stream)"}
        </button>
      </div>

      {/* Streaming Response */}
      <div className="max-w-2xl mx-auto mt-10 p-6 rounded-2xl shadow-lg bg-black/40 backdrop-blur-md border border-white/20">
        <h2 className="text-xl font-bold mb-3 text-green-400">🌊 Streaming Response:</h2>
        {streamResponse ? (
          <p className="whitespace-pre-wrap text-gray-100">{streamResponse}</p>
        ) : (
          <p className="text-gray-500 italic">No stream yet</p>
        )}
      </div>

      {/* Final Response */}
      <div className="max-w-2xl mx-auto mt-6 p-6 rounded-2xl shadow-lg bg-black/40 backdrop-blur-md border border-white/20">
        <h2 className="text-xl font-bold mb-3 text-blue-400">✅ Final Response:</h2>
        {response ? (
          <p className="whitespace-pre-wrap text-gray-100">{response}</p>
        ) : (
          <p className="text-gray-500 italic">No final response yet</p>
        )}
      </div>
    </div>
  );
}
