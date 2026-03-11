import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `You are a career advisor AI for Gen Z students. You are bilingual (English & Vietnamese). Respond in the same language the student uses.

Given a student's skills, interests, and experience level, provide career path recommendations.

ALWAYS respond with valid JSON in this exact format:
{
  "careers": [
    {
      "title": "Career Title",
      "match_score": 85,
      "description": "Brief description of the career",
      "why_fit": "Why this career matches the student's profile",
      "key_skills": ["skill1", "skill2", "skill3"],
      "growth_outlook": "High/Medium/Low",
      "salary_range": "$XX,000 - $XX,000/year",
      "next_steps": ["step1", "step2", "step3"]
    }
  ],
  "skill_gaps": ["skill that needs improvement"],
  "summary": "Brief overall analysis"
}

Provide 3-5 career recommendations sorted by match_score (highest first). Be realistic and encouraging.`;

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent";
const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callGemini(apiKey: string, userPrompt: string) {
  const resp = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { maxOutputTokens: 2000, temperature: 0.7 },
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    console.error("Gemini error:", resp.status, t);
    throw new Error(`Gemini error: ${resp.status}`);
  }

  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callLovable(apiKey: string, userPrompt: string) {
  const resp = await fetch(LOVABLE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!resp.ok) throw new Error(`Lovable AI error: ${resp.status}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { skills, interests, experience_level } = await req.json();

    const userPrompt = `Analyze my profile and suggest career paths:

Skills: ${skills.join(", ")}
Interests: ${interests.join(", ")}
Experience Level: ${experience_level}

Please provide career recommendations in JSON format.`;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    let content: string;
    try {
      if (GEMINI_API_KEY) {
        console.log("Using Gemini Plus as primary AI");
        content = await callGemini(GEMINI_API_KEY, userPrompt);
      } else {
        throw new Error("No Gemini key");
      }
    } catch (e) {
      console.log("Gemini failed, falling back to Lovable AI:", e);
      if (!LOVABLE_API_KEY) throw new Error("No AI keys configured");
      content = await callLovable(LOVABLE_API_KEY, userPrompt);
    }

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      parsed = { careers: [], skill_gaps: [], summary: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("career-analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
