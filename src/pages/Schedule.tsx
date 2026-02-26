import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  CalendarDays, Plus, Loader2, CheckCircle2, Circle, Trash2,
  ChevronLeft, ChevronRight, GripVertical, StickyNote, X
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addWeeks, addMonths, subDays, subWeeks, subMonths } from "date-fns";

type ViewMode = "day" | "week" | "month";

interface TaskItem {
  id: string;
  task: string;
  status: string;
  task_date: string;
  notes: string | null;
  sort_order: number;
  goal_id: string | null;
}

export default function Schedule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newTask, setNewTask] = useState("");
  const [newTaskDate, setNewTaskDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const dateRange = getDateRange(viewMode, currentDate);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["schedules", user?.id, dateRange.start, dateRange.end],
    queryFn: async () => {
      const { data } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", user!.id)
        .gte("task_date", dateRange.start)
        .lte("task_date", dateRange.end)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      return (data ?? []) as TaskItem[];
    },
    enabled: !!user,
  });

  const addTask = useMutation({
    mutationFn: async () => {
      const maxOrder = tasks?.filter(t => t.task_date === newTaskDate).reduce((max, t) => Math.max(max, t.sort_order), -1) ?? -1;
      const { error } = await supabase.from("schedules").insert({
        user_id: user!.id,
        task: newTask,
        task_date: newTaskDate,
        status: "pending",
        sort_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setNewTask("");
      toast.success("Đã thêm task!");
    },
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === "done" ? "pending" : "done";
      await supabase.from("schedules").update({ status: newStatus }).eq("id", id);
      if (newStatus === "done") {
        const { data: prog } = await supabase.from("progress").select("*").eq("user_id", user!.id).single();
        if (prog) {
          await supabase.from("progress").update({ completed_tasks: prog.completed_tasks + 1 }).eq("user_id", user!.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("schedules").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Đã xóa task");
    },
  });

  const saveNote = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      await supabase.from("schedules").update({ notes: notes || null }).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setEditingNote(null);
      toast.success("Đã lưu ghi chú");
    },
  });

  const reorderTasks = useCallback(async (dateStr: string, reorderedTasks: TaskItem[]) => {
    const updates = reorderedTasks.map((t, i) => 
      supabase.from("schedules").update({ sort_order: i }).eq("id", t.id)
    );
    await Promise.all(updates);
    queryClient.invalidateQueries({ queryKey: ["schedules"] });
  }, [queryClient]);

  const navigate = (dir: 1 | -1) => {
    if (viewMode === "day") setCurrentDate(d => dir === 1 ? addDays(d, 1) : subDays(d, 1));
    else if (viewMode === "week") setCurrentDate(d => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1));
    else setCurrentDate(d => dir === 1 ? addMonths(d, 1) : subMonths(d, 1));
  };

  const getTasksForDate = (dateStr: string) => (tasks ?? []).filter(t => t.task_date === dateStr);

  const doneCount = tasks?.filter(t => t.status === "done").length ?? 0;
  const totalCount = tasks?.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-mesh fixed inset-0 pointer-events-none" />
      <Navbar />
      <main className="relative z-10 pt-20 pb-8 px-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-primary" />
              Lịch học / Schedule
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Quản lý task với drag & drop, ghi chú và đồng bộ roadmap</p>
          </div>
        </div>

        {/* View mode + navigation */}
        <div className="glass-hover p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {(["day", "week", "month"] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === mode ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                {mode === "day" ? "Ngày" : mode === "week" ? "Tuần" : "Tháng"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors">Hôm nay</button>
            <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="text-sm font-medium text-foreground">
            {viewMode === "day" && format(currentDate, "dd/MM/yyyy")}
            {viewMode === "week" && `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "dd/MM")} – ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "dd/MM")}`}
            {viewMode === "month" && format(currentDate, "MM/yyyy")}
          </div>
        </div>

        {/* Progress */}
        {totalCount > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{doneCount}/{totalCount} hoàn thành</span>
              <span className="text-xs text-primary font-medium">{Math.round((doneCount / totalCount) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${(doneCount / totalCount) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Add task */}
        <div className="flex gap-2 mb-6">
          {viewMode !== "day" && (
            <input
              type="date"
              value={newTaskDate}
              onChange={(e) => setNewTaskDate(e.target.value)}
              className="px-3 py-3 rounded-xl bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          )}
          <input
            placeholder="Thêm task mới..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTask) {
                if (viewMode === "day") setNewTaskDate(format(currentDate, "yyyy-MM-dd"));
                addTask.mutate();
              }
            }}
            className="flex-1 px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
          <button
            onClick={() => {
              if (viewMode === "day") setNewTaskDate(format(currentDate, "yyyy-MM-dd"));
              if (newTask) addTask.mutate();
            }}
            disabled={!newTask || addTask.isPending}
            className="px-4 py-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : viewMode === "day" ? (
          <DayView
            date={currentDate}
            tasks={getTasksForDate(format(currentDate, "yyyy-MM-dd"))}
            onToggle={(id, status) => toggleTask.mutate({ id, status })}
            onDelete={(id) => deleteTask.mutate(id)}
            onReorder={(items) => reorderTasks(format(currentDate, "yyyy-MM-dd"), items)}
            editingNote={editingNote}
            noteText={noteText}
            onStartNote={(id, text) => { setEditingNote(id); setNoteText(text || ""); }}
            onSaveNote={(id) => saveNote.mutate({ id, notes: noteText })}
            onCancelNote={() => setEditingNote(null)}
            onNoteChange={setNoteText}
          />
        ) : viewMode === "week" ? (
          <WeekView
            currentDate={currentDate}
            getTasksForDate={getTasksForDate}
            onToggle={(id, status) => toggleTask.mutate({ id, status })}
            onDelete={(id) => deleteTask.mutate(id)}
          />
        ) : (
          <MonthView
            currentDate={currentDate}
            getTasksForDate={getTasksForDate}
            onSelectDay={(d) => { setCurrentDate(d); setViewMode("day"); }}
          />
        )}
      </main>
    </div>
  );
}

function getDateRange(mode: ViewMode, date: Date) {
  if (mode === "day") {
    const d = format(date, "yyyy-MM-dd");
    return { start: d, end: d };
  }
  if (mode === "week") {
    return {
      start: format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      end: format(endOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    };
  }
  return {
    start: format(startOfMonth(date), "yyyy-MM-dd"),
    end: format(endOfMonth(date), "yyyy-MM-dd"),
  };
}

// ============ Day View with Drag & Drop ============
interface DayViewProps {
  date: Date;
  tasks: TaskItem[];
  onToggle: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onReorder: (items: TaskItem[]) => void;
  editingNote: string | null;
  noteText: string;
  onStartNote: (id: string, text: string | null) => void;
  onSaveNote: (id: string) => void;
  onCancelNote: () => void;
  onNoteChange: (text: string) => void;
}

function DayView({ date, tasks, onToggle, onDelete, onReorder, editingNote, noteText, onStartNote, onSaveNote, onCancelNote, onNoteChange }: DayViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-16">
        <CalendarDays className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground text-sm">Chưa có task cho {format(date, "dd/MM/yyyy")}</p>
      </div>
    );
  }

  return (
    <Reorder.Group axis="y" values={tasks} onReorder={onReorder} className="space-y-2">
      {tasks.map((t) => (
        <Reorder.Item key={t.id} value={t}>
          <div className="glass p-4 flex flex-col group">
            <div className="flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-muted-foreground/40 cursor-grab active:cursor-grabbing flex-shrink-0" />
              <button onClick={() => onToggle(t.id, t.status)}>
                {t.status === "done" ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                )}
              </button>
              <span className={`flex-1 text-sm ${t.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {t.task}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onStartNote(t.id, t.notes)}
                  className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                >
                  <StickyNote className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(t.id)}
                  className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {/* Notes */}
            {t.notes && editingNote !== t.id && (
              <p className="text-xs text-muted-foreground mt-2 ml-12 italic">{t.notes}</p>
            )}
            <AnimatePresence>
              {editingNote === t.id && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden ml-12 mt-2">
                  <textarea
                    value={noteText}
                    onChange={(e) => onNoteChange(e.target.value)}
                    placeholder="Ghi chú..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                    autoFocus
                  />
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => onSaveNote(t.id)} className="px-2 py-1 rounded text-[10px] bg-primary/10 text-primary hover:bg-primary/20">Lưu</button>
                    <button onClick={onCancelNote} className="px-2 py-1 rounded text-[10px] text-muted-foreground hover:bg-muted/30">Hủy</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}

// ============ Week View ============
function WeekView({ currentDate, getTasksForDate, onToggle, onDelete }: {
  currentDate: Date;
  getTasksForDate: (d: string) => TaskItem[];
  onToggle: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const start = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end: endOfWeek(currentDate, { weekStartsOn: 1 }) });

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map(day => {
        const dateStr = format(day, "yyyy-MM-dd");
        const dayTasks = getTasksForDate(dateStr);
        const isToday = isSameDay(day, new Date());

        return (
          <div key={dateStr} className={`glass p-2 min-h-[140px] ${isToday ? "border-primary/30" : ""}`}>
            <p className={`text-xs font-medium mb-2 text-center ${isToday ? "text-primary" : "text-muted-foreground"}`}>
              {format(day, "EEE")}<br />
              <span className={`text-sm font-bold ${isToday ? "text-primary" : "text-foreground"}`}>{format(day, "dd")}</span>
            </p>
            <div className="space-y-1">
              {dayTasks.slice(0, 4).map(t => (
                <div
                  key={t.id}
                  className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors group"
                >
                  <button onClick={() => onToggle(t.id, t.status)} className="flex-shrink-0">
                    {t.status === "done" ? (
                      <CheckCircle2 className="w-3 h-3 text-primary" />
                    ) : (
                      <Circle className="w-3 h-3 text-muted-foreground" />
                    )}
                  </button>
                  <span className={`text-[10px] truncate flex-1 ${t.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {t.task}
                  </span>
                </div>
              ))}
              {dayTasks.length > 4 && (
                <p className="text-[10px] text-muted-foreground text-center">+{dayTasks.length - 4} more</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============ Month View ============
function MonthView({ currentDate, getTasksForDate, onSelectDay }: {
  currentDate: Date;
  getTasksForDate: (d: string) => TaskItem[];
  onSelectDay: (d: Date) => void;
}) {
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });
  const startDow = start.getDay() || 7; // Monday = 1
  const paddingDays = startDow - 1;

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(d => (
          <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: paddingDays }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayTasks = getTasksForDate(dateStr);
          const isToday = isSameDay(day, new Date());
          const doneCount = dayTasks.filter(t => t.status === "done").length;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDay(day)}
              className={`aspect-square rounded-lg p-1 flex flex-col items-center justify-center hover:bg-muted/30 transition-colors ${
                isToday ? "bg-primary/10 border border-primary/20" : ""
              }`}
            >
              <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-foreground"}`}>
                {format(day, "d")}
              </span>
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${doneCount === dayTasks.length ? "bg-primary" : doneCount > 0 ? "bg-secondary" : "bg-muted-foreground/40"}`} />
                  {dayTasks.length > 1 && <span className="text-[8px] text-muted-foreground">{dayTasks.length}</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
