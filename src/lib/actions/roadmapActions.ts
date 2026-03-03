import { supabase } from "@/integrations/supabase/client";

export interface RoadmapAction {
  type: "create_roadmap";
  skill: string;
  level: string;
  weeks: number;
  goalId?: string;
}

const ROADMAP_PATTERNS = [
  /(?:tạo|lập|xây dựng|tạo giúp|giúp tạo|lên)\s+(?:roadmap|lộ trình|kế hoạch học)\s+(.+?)(?:\s+trong\s+|\s+)(\d+)\s*(?:tuần|weeks?|w)\b/i,
  /(?:create|make|build|generate)\s+(?:a\s+)?roadmap\s+(?:for\s+)?(.+?)(?:\s+in\s+|\s+for\s+|\s+)(\d+)\s*(?:weeks?|w|tuần)\b/i,
  /roadmap\s+(.+?)\s+(\d+)\s*(?:tuần|weeks?|w)\b/i,
];

const LEVEL_PATTERNS: [RegExp, string][] = [
  [/\b(?:advanced|nâng cao|cao cấp)\b/i, "advanced"],
  [/\b(?:intermediate|trung bình|trung cấp)\b/i, "intermediate"],
];

export function parseRoadmapIntent(text: string): RoadmapAction | null {
  for (const pattern of ROADMAP_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const skill = match[1].trim().replace(/\s+(beginner|intermediate|advanced|nâng cao|trung bình|cơ bản)/gi, "").trim();
      const weeks = parseInt(match[2], 10);

      let level = "beginner";
      for (const [pat, lvl] of LEVEL_PATTERNS) {
        if (pat.test(text)) { level = lvl; break; }
      }

      if (skill && weeks > 0 && weeks <= 52) {
        return { type: "create_roadmap", skill, level, weeks };
      }
    }
  }
  return null;
}

export async function executeRoadmapAction(
  action: RoadmapAction,
  userId: string,
  accessToken: string
): Promise<{ success: boolean; goalId?: string; error?: string }> {
  try {
    const { data: goal, error: goalError } = await supabase
      .from("goals")
      .insert({
        user_id: userId,
        skill: action.skill,
        level: action.level,
        duration_weeks: action.weeks,
      })
      .select()
      .single();

    if (goalError || !goal) {
      return { success: false, error: goalError?.message || "Failed to create goal" };
    }

    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-roadmap`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          skill: action.skill,
          level: action.level,
          duration_weeks: action.weeks,
          goal_id: goal.id,
        }),
      }
    );

    if (!resp.ok) {
      return { success: false, goalId: goal.id, error: "Failed to generate roadmap" };
    }

    return { success: true, goalId: goal.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export interface DeleteRoadmapAction {
  type: "delete_roadmap";
  skill: string;
}

const DELETE_ROADMAP_PATTERNS = [
  /(?:xóa|xoá|delete|remove)\s+(?:roadmap|lộ trình|goal)\s+(.+)/i,
  /(?:roadmap|lộ trình)\s+(.+?)\s+(?:xóa|xoá|delete|remove)/i,
];

export function parseDeleteRoadmapIntent(text: string): DeleteRoadmapAction | null {
  for (const pattern of DELETE_ROADMAP_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const skill = match[1].trim().replace(/[.!?]+$/, "").trim();
      if (skill) return { type: "delete_roadmap", skill };
    }
  }
  return null;
}

export async function executeDeleteRoadmapAction(
  action: DeleteRoadmapAction,
  userId: string
): Promise<{ success: boolean; skill?: string; error?: string }> {
  try {
    const { data: goals } = await supabase
      .from("goals")
      .select("id, skill")
      .eq("user_id", userId)
      .ilike("skill", `%${action.skill}%`);

    if (!goals || goals.length === 0) {
      return { success: false, error: `Không tìm thấy goal nào cho "${action.skill}".` };
    }

    const goalIds = goals.map((g) => g.id);

    await supabase.from("schedules").delete().eq("user_id", userId).in("goal_id", goalIds);
    for (const gid of goalIds) {
      await supabase.from("roadmaps").delete().eq("goal_id", gid);
    }
    await supabase.from("goals").delete().eq("user_id", userId).in("id", goalIds);

    const skillNames = goals.map((g) => g.skill).join(", ");
    return { success: true, skill: skillNames };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
