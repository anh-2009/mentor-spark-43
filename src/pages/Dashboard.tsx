import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Target, Flame, CheckCircle2, MessageSquare, Plus, Map, CalendarDays, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function Dashboard() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

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
    { icon: CheckCircle2, label: "Tasks Done", value: progress?.completed_tasks ?? 0, color: "text-primary", bg: "bg-primary/10" },
    { icon: Flame, label: "Day Streak", value: progress?.streak ?? 0, color: "text-secondary", bg: "bg-secondary/10" },
    { icon: Target, label: "Active Goals", value: goals?.length ?? 0, color: "text-accent", bg: "bg-accent/10" },
  ];

  const quickActions = [
    { icon: MessageSquare, label: "Chat AI", desc: "Hỏi AI mentor", to: "/chat", gradient: "from-primary/20 to-primary/5" },
    { icon: Map, label: "Roadmap", desc: "Tạo lộ trình mới", to: "/roadmap", gradient: "from-secondary/20 to-secondary/5" },
    { icon: CalendarDays, label: "Schedule", desc: "Quản lý lịch học", to: "/schedule", gradient: "from-accent/20 to-accent/5" },
  ];

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Bạn";

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-mesh fixed inset-0 pointer-events-none" />
      <Navbar />
      <main className="relative z-10 pt-20 pb-8 px-4 md:px-6 max-w-6xl mx-auto">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Chào, <span className="gradient-text">{displayName}</span> 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Hôm nay bạn muốn chinh phục gì?</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 gap-3 md:gap-4 mb-6"
        >
          {stats.map((s, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              custom={i}
              className="glass-hover card-shine p-4 md:p-5 text-center"
            >
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 gap-3 md:gap-4 mb-6"
        >
          {quickActions.map((a, i) => (
            <motion.div key={i} variants={fadeUp} custom={i + 3}>
              <Link
                to={a.to}
                className="glass-hover card-shine p-4 md:p-5 flex flex-col items-center gap-2 group block"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <a.icon className="w-6 h-6 text-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">{a.label}</span>
                <span className="text-xs text-muted-foreground hidden md:block">{a.desc}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Today's Tasks */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={6}
            className="glass-hover p-5 md:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="font-display font-semibold text-foreground">Hôm nay</h2>
              </div>
              <Link to="/schedule" className="text-xs text-primary hover:underline flex items-center gap-1">
                Xem tất cả <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {todayTasks && todayTasks.length > 0 ? (
              <div className="space-y-2">
                {todayTasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${t.status === "done" ? "bg-primary" : "bg-muted-foreground/40"}`} />
                    <span className={`text-sm ${t.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {t.task}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarDays className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Chưa có task nào hôm nay</p>
                <Link to="/schedule" className="text-xs text-primary hover:underline mt-1 inline-block">Thêm task mới →</Link>
              </div>
            )}
          </motion.div>

          {/* Goals */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={7}
            className="glass-hover p-5 md:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-accent" />
                <h2 className="font-display font-semibold text-foreground">Mục tiêu</h2>
              </div>
              <Link to="/roadmap" className="text-xs text-primary hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Thêm mới
              </Link>
            </div>
            {goals && goals.length > 0 ? (
              <div className="space-y-2">
                {goals.slice(0, 4).map((g) => (
                  <div key={g.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{g.skill}</p>
                      <p className="text-xs text-muted-foreground">{g.level} · {g.duration_weeks}w</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Target className="w-4 h-4 text-accent" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Map className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Chưa có mục tiêu</p>
                <Link to="/roadmap" className="text-xs text-primary hover:underline mt-1 inline-block">Tạo roadmap →</Link>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
