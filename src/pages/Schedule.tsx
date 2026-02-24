import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { CalendarDays, Plus, Loader2, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Schedule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [newTask, setNewTask] = useState("");

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["schedules", user?.id, selectedDate],
    queryFn: async () => {
      const { data } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", user!.id)
        .eq("task_date", selectedDate)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
    enabled: !!user,
  });

  const addTask = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("schedules").insert({
        user_id: user!.id,
        task: newTask,
        task_date: selectedDate,
        status: "pending",
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
      const { error } = await supabase.from("schedules").update({ status: newStatus }).eq("id", id);
      if (error) throw error;

      // Update progress
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
      const { error } = await supabase.from("schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Đã xóa task");
    },
  });

  const doneCount = tasks?.filter((t) => t.status === "done").length ?? 0;
  const totalCount = tasks?.length ?? 0;

  return (
    <div className="min-h-screen animated-gradient-bg">
      <Navbar />
      <main className="pt-20 pb-8 px-4 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Lịch học / Schedule</h1>
          <p className="text-sm text-muted-foreground">Quản lý task học tập hàng ngày</p>
        </div>

        {/* Date picker */}
        <div className="glass p-4 mb-4 flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-primary" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-foreground text-sm focus:outline-none"
          />
          {totalCount > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">
              {doneCount}/{totalCount} hoàn thành
            </span>
          )}
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="mb-4 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(doneCount / totalCount) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}

        {/* Add task */}
        <div className="flex gap-2 mb-6">
          <input
            placeholder="Thêm task mới... / Add new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && newTask && addTask.mutate()}
            className="flex-1 px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
          <button
            onClick={() => newTask && addTask.mutate()}
            disabled={!newTask || addTask.isPending}
            className="px-4 py-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Tasks */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass p-4 flex items-center gap-3 group"
              >
                <button onClick={() => toggleTask.mutate({ id: t.id, status: t.status })}>
                  {t.status === "done" ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                  )}
                </button>
                <span className={`flex-1 text-sm ${t.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {t.task}
                </span>
                <button
                  onClick={() => deleteTask.mutate(t.id)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <CalendarDays className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground text-sm">Chưa có task cho ngày này</p>
          </div>
        )}
      </main>
    </div>
  );
}
