import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Target, Flame, CheckCircle2, MessageSquare, Plus, Map, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: progress } = useQuery({
    queryKey: ["progress", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("progress").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: goals } = useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("goals").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: todayTasks } = useQuery({
    queryKey: ["today-tasks", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase.from("schedules").select("*").eq("user_id", user!.id).eq("task_date", today);
      return data ?? [];
    },
    enabled: !!user,
  });

  const stats = [
    { icon: CheckCircle2, label: "Tasks Done", value: progress?.completed_tasks ?? 0, color: "text-primary" },
    { icon: Flame, label: "Streak", value: `${progress?.streak ?? 0} days`, color: "text-secondary" },
    { icon: Target, label: "Goals", value: goals?.length ?? 0, color: "text-accent" },
  ];

  const quickActions = [
    { icon: MessageSquare, label: "Chat với AI", to: "/chat", color: "bg-primary/10 text-primary" },
    { icon: Map, label: "Tạo Roadmap", to: "/roadmap", color: "bg-secondary/10 text-secondary" },
    { icon: CalendarDays, label: "Xem lịch", to: "/schedule", color: "bg-accent/10 text-accent" },
  ];

  return (
    <div className="min-h-screen animated-gradient-bg">
      <Navbar />
      <main className="pt-20 pb-8 px-4 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold mb-1">
            Xin chào! 👋
          </h1>
          <p className="text-muted-foreground text-sm mb-6">Hôm nay bạn muốn học gì?</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-4 text-center"
            >
              <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
              <p className="font-display font-bold text-lg text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {quickActions.map((a, i) => (
            <Link key={i} to={a.to} className={`glass p-4 flex flex-col items-center gap-2 hover:border-primary/30 transition-all`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>
                <a.icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-foreground font-medium text-center">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Today's Tasks */}
        <div className="glass p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-foreground">Hôm nay / Today</h2>
            <Link to="/schedule" className="text-xs text-primary hover:underline">Xem tất cả →</Link>
          </div>
          {todayTasks && todayTasks.length > 0 ? (
            <div className="space-y-2">
              {todayTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <div className={`w-2 h-2 rounded-full ${t.status === "done" ? "bg-primary" : "bg-muted-foreground"}`} />
                  <span className={`text-sm ${t.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {t.task}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có task nào hôm nay. Thêm lịch học mới!</p>
          )}
        </div>

        {/* Goals */}
        <div className="glass p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-foreground">Mục tiêu / Goals</h2>
            <Link to="/roadmap" className="text-xs text-primary hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Thêm mới
            </Link>
          </div>
          {goals && goals.length > 0 ? (
            <div className="space-y-2">
              {goals.map((g) => (
                <div key={g.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">{g.skill}</p>
                    <p className="text-xs text-muted-foreground">Level: {g.level} · {g.duration_weeks} weeks</p>
                  </div>
                  <Target className="w-4 h-4 text-accent" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có mục tiêu. Tạo roadmap đầu tiên!</p>
          )}
        </div>
      </main>
    </div>
  );
}
