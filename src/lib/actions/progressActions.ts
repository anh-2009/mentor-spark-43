import { supabase } from "@/integrations/supabase/client";

export interface ProgressAction {
  type: "view_progress";
}

const PROGRESS_PATTERNS = [
  /(?:xem|kiểm tra|check|view|show)\s+(?:tiến độ|progress|tiến trình|tổng quan)/i,
  /(?:tiến độ|progress)\s+(?:tổng|overall|chung|của tôi|of mine)/i,
  /(?:tổng hợp|tổng kết|summary)\s+(?:tiến độ|progress|học tập)/i,
];

export function parseProgressIntent(text: string): ProgressAction | null {
  for (const pattern of PROGRESS_PATTERNS) {
    if (pattern.test(text)) return { type: "view_progress" };
  }
  return null;
}

export async function executeProgressAction(
  userId: string
): Promise<{ success: boolean; summary?: string; error?: string }> {
  try {
    const [goalsRes, schedulesRes, progressRes] = await Promise.all([
      supabase
        .from("goals")
        .select("id, skill, level, duration_weeks, created_at, roadmaps(id)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("schedules")
        .select("id, task, status, task_date, goal_id")
        .eq("user_id", userId),
      supabase
        .from("progress")
        .select("completed_tasks, streak")
        .eq("user_id", userId)
        .limit(1),
    ]);

    const goals = goalsRes.data ?? [];
    const schedules = schedulesRes.data ?? [];
    const progress = progressRes.data?.[0];

    const totalTasks = schedules.length;
    const completedTasks = schedules.filter((s) => s.status === "done").length;
    const pendingTasks = schedules.filter((s) => s.status === "pending").length;
    const overdueTasks = schedules.filter(
      (s) => s.status === "pending" && new Date(s.task_date) < new Date(new Date().toISOString().split("T")[0])
    ).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    let summary = `## 📊 Tổng quan tiến độ học tập\n\n`;
    summary += `- 🔥 Streak: **${progress?.streak ?? 0} ngày**\n`;
    summary += `- ✅ Tasks hoàn thành: **${completedTasks}/${totalTasks}** (${completionRate}%)\n`;
    summary += `- ⏳ Đang chờ: **${pendingTasks}**\n`;
    if (overdueTasks > 0) summary += `- ⚠️ Quá hạn: **${overdueTasks}**\n`;
    summary += `\n### 🎯 Goals (${goals.length})\n\n`;

    if (goals.length === 0) {
      summary += `_Chưa có goal nào. Gõ "tạo roadmap [skill] [tuần]" để bắt đầu._\n`;
    } else {
      for (const goal of goals) {
        const goalTasks = schedules.filter((s) => s.goal_id === goal.id);
        const goalDone = goalTasks.filter((s) => s.status === "done").length;
        const goalTotal = goalTasks.length;
        const hasRoadmap = Array.isArray(goal.roadmaps) ? goal.roadmaps.length > 0 : !!goal.roadmaps;
        const pct = goalTotal > 0 ? Math.round((goalDone / goalTotal) * 100) : 0;
        const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));

        summary += `**${goal.skill}** (${goal.level}, ${goal.duration_weeks}w) ${hasRoadmap ? "📗" : "📕"}\n`;
        summary += `  ${bar} ${pct}% — ${goalDone}/${goalTotal} tasks\n\n`;
      }
    }

    return { success: true, summary };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
