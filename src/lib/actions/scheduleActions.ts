import { supabase } from "@/integrations/supabase/client";

export interface ScheduleAction {
  type: "create_schedule";
  skill: string;
}

const SCHEDULE_PATTERNS = [
  /(?:tạo|lập|tạo giúp|giúp tạo|lên)\s+(?:lịch học|lịch|schedule)\s+(.+)/i,
  /(?:create|make|generate)\s+(?:a\s+)?(?:study\s+)?schedule\s+(?:for\s+)?(.+)/i,
  /(?:lịch học|schedule)\s+(.+)/i,
];

export function parseScheduleIntent(text: string): ScheduleAction | null {
  for (const pattern of SCHEDULE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const skill = match[1].trim().replace(/[.!?]+$/, "").trim();
      if (skill) return { type: "create_schedule", skill };
    }
  }
  return null;
}

export async function executeScheduleAction(
  action: ScheduleAction,
  userId: string
): Promise<{ success: boolean; taskCount?: number; error?: string }> {
  try {
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
