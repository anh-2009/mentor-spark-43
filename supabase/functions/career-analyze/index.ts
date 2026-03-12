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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { skills, interests, experience_level } = await req.json();

    const userPrompt = `Analyze my profile and suggest career paths:

Skills: ${skills.join(", ")}
Interests: ${interests.join(", ")}
Experience Level: ${experience_level}

Please provide career recommendations in JSON format.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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

    if (!resp.ok) throw new Error(`AI gateway error: ${resp.status}`);
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";

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
