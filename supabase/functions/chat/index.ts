import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are NeuroPlan AI — an AI mentor for Gen Z students. You are bilingual (English & Vietnamese). Respond in the same language the student uses.

Rules:
- Friendly, warm tone with occasional emoji
- Non-judgmental and understanding of academic stress
- If the student seems stressed → encourage and reassure them
- If overwhelmed → break tasks into smaller, manageable steps
- If demotivated → inspire with growth mindset
- Provide concise, actionable study advice
- Use markdown for formatting (headers, lists, bold)
- Keep responses focused and under 500 words
- You can help create study roadmaps, daily schedules, and motivation`;

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:streamGenerateContent?alt=sse";
const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callGemini(apiKey: string, messages: any[], systemPrompt: string) {
  // Convert OpenAI-style messages to Gemini format
  const contents = messages.map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const resp = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error("Gemini error:", resp.status, errText);
    throw new Error(`Gemini API error: ${resp.status}`);
  }

  // Gemini SSE → OpenAI-compatible SSE transform
  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                // Emit OpenAI-compatible SSE
                const chunk = JSON.stringify({
                  choices: [{ delta: { content: text } }],
                });
                controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
              }
            } catch { /* skip partial */ }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return stream;
}

async function callLovable(apiKey: string, messages: any[], systemPrompt: string) {
  const resp = await fetch(LOVABLE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!resp.ok) throw new Error(`Lovable AI error: ${resp.status}`);
  return resp.body!;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, sentiment, systemPrompt } = await req.json();

    let enhancedPrompt = systemPrompt || SYSTEM_PROMPT;
    if (!systemPrompt) {
      if (sentiment === "stressed") enhancedPrompt += "\n\nThe student is currently feeling stressed. Be extra supportive and encouraging.";
      else if (sentiment === "overwhelmed") enhancedPrompt += "\n\nThe student feels overwhelmed. Focus on simplifying and prioritizing.";
      else if (sentiment === "demotivated") enhancedPrompt += "\n\nThe student seems demotivated. Share inspiring perspectives and celebrate small wins.";
    }

    const recentMessages = messages.slice(-5);

    // Try Gemini Plus first, fallback to Lovable AI
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    let stream: ReadableStream;
    try {
      if (GEMINI_API_KEY) {
        console.log("Using Gemini Plus as primary AI");
        stream = await callGemini(GEMINI_API_KEY, recentMessages, enhancedPrompt);
      } else {
        throw new Error("No Gemini key, fallback");
      }
    } catch (e) {
      console.log("Gemini failed, falling back to Lovable AI:", e);
      if (!LOVABLE_API_KEY) throw new Error("No AI keys configured");
      stream = await callLovable(LOVABLE_API_KEY, recentMessages, enhancedPrompt);
    }

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg.includes("429") ? 429 : msg.includes("402") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
