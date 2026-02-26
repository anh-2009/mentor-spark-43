import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ROADMAP_PROMPT = `You are NeuroPlan AI Roadmap Generator. Generate a detailed study roadmap in JSON format.

OUTPUT FORMAT (strict JSON, no markdown):
{
  "goal": "string - main learning goal",
  "outcome": "string - expected outcome after completion",
  "milestones": [
    {
      "id": "m1",
      "title": "string",
      "description": "string",
      "week_start": 1,
      "week_end": 2,
      "kpis": ["string"],
      "resources": ["string - links or book names"],
      "tasks": ["string - specific actionable tasks"]
    }
  ],
  "risks": [
    {
      "risk": "string - potential risk",
      "mitigation": "string - how to mitigate"
    }
  ],
  "total_weeks": number,
  "difficulty": "beginner|intermediate|advanced"
}

Rules:
- Create 3-6 milestones depending on duration
- Each milestone should have 2-4 KPIs
- Include realistic resources (free ones preferred)
- Tasks should be specific and actionable
- Risks should be practical (burnout, complexity, etc.)
- Respond ONLY with valid JSON, no explanation text`;

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

    const { skill, level, duration_weeks, goal_id } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userPrompt = `Create a detailed study roadmap for:
- Skill: ${skill}
- Level: ${level}
- Duration: ${duration_weeks} weeks

Generate a comprehensive roadmap with milestones, KPIs, resources, and risk analysis.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: ROADMAP_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content ?? "";

    // Strip markdown code fences if present
    content = content.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();

    let roadmapContent;
    try {
      roadmapContent = JSON.parse(content);
    } catch {
      console.error("Failed to parse roadmap JSON:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save to database
    const userId = claimsData.claims.sub;
    const { data: roadmap, error: dbError } = await supabase
      .from("roadmaps")
      .upsert(
        { goal_id, content: roadmapContent },
        { onConflict: "goal_id" }
      )
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      return new Response(JSON.stringify({ error: "Failed to save roadmap" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ roadmap: roadmapContent, id: roadmap.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-roadmap error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
