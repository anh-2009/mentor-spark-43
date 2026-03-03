import { supabase } from "@/integrations/supabase/client";

export interface ListGoalsAction {
  type: "list_goals";
}

const LIST_GOALS_PATTERNS = [
  /(?:liệt kê|danh sách|list|show|xem)\s+(?:goals?|mục tiêu|tất cả goals?|all goals?)/i,
  /(?:goals?|mục tiêu)\s+(?:của tôi|of mine|hiện có|hiện tại)/i,
  /(?:tôi có|i have)\s+(?:bao nhiêu|how many)\s+(?:goals?|mục tiêu)/i,
];

export function parseListGoalsIntent(text: string): ListGoalsAction | null {
  for (const pattern of LIST_GOALS_PATTERNS) {
    if (pattern.test(text)) return { type: "list_goals" };
  }
  return null;
}

export async function executeListGoalsAction(
  userId: string
): Promise<{ success: boolean; summary?: string; error?: string }> {
  try {
    const { data: goals, error } = await supabase
      .from("goals")
      .select("id, skill, level, duration_weeks, created_at, roadmaps(id)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message };

    if (!goals || goals.length === 0) {
      return { success: true, summary: "## 🎯 Danh sách Goals\n\n_Chưa có goal nào. Gõ **\"tạo roadmap [skill] [tuần]\"** để bắt đầu._" };
    }

    let summary = `## 🎯 Danh sách Goals (${goals.length})\n\n`;
    summary += `| # | Skill | Level | Thời gian | Roadmap | Ngày tạo |\n`;
    summary += `|---|-------|-------|-----------|---------|----------|\n`;

    goals.forEach((g, i) => {
      const hasRoadmap = Array.isArray(g.roadmaps) ? g.roadmaps.length > 0 : !!g.roadmaps;
      const date = new Date(g.created_at).toLocaleDateString("vi-VN");
      summary += `| ${i + 1} | **${g.skill}** | ${g.level} | ${g.duration_weeks}w | ${hasRoadmap ? "✅" : "❌"} | ${date} |\n`;
    });

    summary += `\n💡 **Commands:** \`tạo lịch học [skill]\` · \`xóa roadmap [skill]\` · \`xem tiến độ\``;

    return { success: true, summary };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
