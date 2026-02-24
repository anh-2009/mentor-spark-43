import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Map, Plus, Loader2, BookOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Roadmap() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [skill, setSkill] = useState("");
  const [level, setLevel] = useState("beginner");
  const [weeks, setWeeks] = useState(4);

  const { data: goals, isLoading } = useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("goals")
        .select("*, roadmaps(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const createGoal = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .insert({ user_id: user!.id, skill, level, duration_weeks: weeks })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setShowForm(false);
      setSkill("");
      toast.success("Đã tạo mục tiêu mới!");
    },
    onError: () => toast.error("Lỗi tạo mục tiêu"),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Đã xóa mục tiêu");
    },
  });

  return (
    <div className="min-h-screen animated-gradient-bg">
      <Navbar />
      <main className="pt-20 pb-8 px-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Lộ trình học / Roadmap</h1>
            <p className="text-sm text-muted-foreground">Thiết lập mục tiêu và kế hoạch học tập</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all neon-glow"
          >
            <Plus className="w-4 h-4" />
            Thêm mới
          </button>
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 mb-6">
            <h3 className="font-display font-semibold mb-4">Tạo mục tiêu mới / New Goal</h3>
            <div className="space-y-3">
              <input
                placeholder="Kỹ năng muốn học / Skill (e.g. React, Python)"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={weeks}
                    onChange={(e) => setWeeks(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <span className="absolute right-3 top-3 text-xs text-muted-foreground">weeks</span>
                </div>
              </div>
              <button
                onClick={() => skill && createGoal.mutate()}
                disabled={!skill || createGoal.isPending}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createGoal.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Tạo mục tiêu / Create Goal
              </button>
            </div>
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : goals && goals.length > 0 ? (
          <div className="space-y-3">
            {goals.map((g, i) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass p-5 hover:border-primary/20 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">{g.skill}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Level: <span className="text-secondary">{g.level}</span> · {g.duration_weeks} weeks
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteGoal.mutate(g.id)}
                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Map className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Chưa có mục tiêu nào. Bắt đầu tạo ngay!</p>
          </div>
        )}
      </main>
    </div>
  );
}
