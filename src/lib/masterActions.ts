import { supabase } from "@/integrations/supabase/client";

export interface RoadmapAction {
  type: "create_roadmap";
  skill: string;
  level: string;
  weeks: number;
  goalId?: string;
}

export interface ScheduleAction {
  type: "create_schedule";
  skill: string;
}

const ROADMAP_PATTERNS = [
  // Vietnamese
  /(?:tạo|lập|xây dựng|tạo giúp|giúp tạo|lên)\s+(?:roadmap|lộ trình|kế hoạch học)\s+(.+?)(?:\s+trong\s+|\s+)(\d+)\s*(?:tuần|weeks?|w)\b/i,
  // English
  /(?:create|make|build|generate)\s+(?:a\s+)?roadmap\s+(?:for\s+)?(.+?)(?:\s+in\s+|\s+for\s+|\s+)(\d+)\s*(?:weeks?|w|tuần)\b/i,
  // Simple: "roadmap React 8 tuần"
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

const SCHEDULE_PATTERNS = [
  /(?:tạo|lập|tạo giúp|giúp tạo|lên)\s+(?:lịch học|lịch|schedule)\s+(.+)/i,
  /(?:create|make|generate)\s+(?:a\s+)?(?:study\s+)?schedule\s+(?:for\s+)?(.+)/i,
  /(?:lịch học|schedule)\s+(.+)/i,
];

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
    if (pattern.test(text)) {
      return { type: "view_progress" };
    }
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

export function parseScheduleIntent(text: string): ScheduleAction | null {
  for (const pattern of SCHEDULE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const skill = match[1].trim().replace(/[.!?]+$/, "").trim();
      if (skill) {
        return { type: "create_schedule", skill };
      }
    }
  }
  return null;
}

export async function executeScheduleAction(
  action: ScheduleAction,
  userId: string
): Promise<{ success: boolean; taskCount?: number; error?: string }> {
  try {
    // Find the goal matching the skill
    const { data: goals } = await supabase
      .from("goals")
      .select("id, skill, duration_weeks, roadmaps(*)")
      .eq("user_id", userId)
      .ilike("skill", `%${action.skill}%`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!goals || goals.length === 0) {
      return { success: false, error: `Không tìm thấy roadmap cho "${action.skill}". Hãy tạo roadmap trước.` };
    }

    const goal = goals[0];
    const roadmapData = Array.isArray(goal.roadmaps) ? goal.roadmaps[0] : goal.roadmaps;

    if (!roadmapData?.content || typeof roadmapData.content !== "object") {
      return { success: false, error: `Roadmap "${action.skill}" chưa có nội dung. Hãy generate roadmap trước.` };
    }

    const content = roadmapData.content as any;
    const milestones = content.milestones;
    if (!Array.isArray(milestones) || milestones.length === 0) {
      return { success: false, error: "Roadmap không có milestones." };
    }

    // Generate schedule entries from milestones
    const today = new Date();
    const scheduleEntries: {
      user_id: string;
      task: string;
      task_date: string;
      goal_id: string;
      notes: string;
      sort_order: number;
      status: string;
    }[] = [];

    let sortOrder = 0;
    for (const milestone of milestones) {
      const weekStart = milestone.week_start ?? 1;
      const tasks: string[] = milestone.tasks ?? [];
      const title = milestone.title ?? "Milestone";

      if (tasks.length === 0) {
        // Create a single task for the milestone
        const taskDate = new Date(today);
        taskDate.setDate(taskDate.getDate() + (weekStart - 1) * 7);
        scheduleEntries.push({
          user_id: userId,
          task: title,
          task_date: taskDate.toISOString().split("T")[0],
          goal_id: goal.id,
          notes: milestone.description ?? null,
          sort_order: sortOrder++,
          status: "pending",
        });
      } else {
        // Spread tasks across the milestone's weeks
        const weekEnd = milestone.week_end ?? weekStart;
        const totalDays = Math.max((weekEnd - weekStart + 1) * 7, tasks.length);
        const dayGap = Math.floor(totalDays / tasks.length);

        for (let i = 0; i < tasks.length; i++) {
          const taskDate = new Date(today);
          taskDate.setDate(taskDate.getDate() + (weekStart - 1) * 7 + i * dayGap);
          scheduleEntries.push({
            user_id: userId,
            task: tasks[i],
            task_date: taskDate.toISOString().split("T")[0],
            goal_id: goal.id,
            notes: `[${title}] ${milestone.description ?? ""}`.trim(),
            sort_order: sortOrder++,
            status: "pending",
          });
        }
      }
    }

    const { error: insertError } = await supabase
      .from("schedules")
      .insert(scheduleEntries);

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true, taskCount: scheduleEntries.length };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function executeRoadmapAction(
  action: RoadmapAction,
  userId: string,
  accessToken: string
): Promise<{ success: boolean; goalId?: string; error?: string }> {
  try {
    // Create goal
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

    // Trigger roadmap generation
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
