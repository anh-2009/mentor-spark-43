import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map, Plus, Loader2, BookOpen, Trash2, Sparkles, Target,
  ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, BarChart3, Link2, Clock
} from "lucide-react";
import { toast } from "sonner";

interface Milestone {
  id: string;
  title: string;
  description: string;
  week_start: number;
  week_end: number;
  kpis: string[];
  resources: string[];
  tasks: string[];
}

interface Risk {
  risk: string;
  mitigation: string;
}

interface RoadmapContent {
  goal: string;
  outcome: string;
  milestones: Milestone[];
  risks: Risk[];
  total_weeks: number;
  difficulty: string;
}

export default function Roadmap() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [skill, setSkill] = useState("");
  const [level, setLevel] = useState("beginner");
  const [weeks, setWeeks] = useState(4);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

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
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setShowForm(false);
      setSkill("");
      toast.success("Đã tạo mục tiêu! Đang tạo roadmap AI...");
      // Auto-generate roadmap
      generateRoadmap(data.id, data.skill, data.level, data.duration_weeks);
    },
    onError: () => toast.error("Lỗi tạo mục tiêu"),
  });

  const generateRoadmap = async (goalId: string, goalSkill: string, goalLevel: string, goalWeeks: number) => {
    setGeneratingId(goalId);
    setExpandedGoal(goalId);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-roadmap`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session!.access_token}`,
          },
          body: JSON.stringify({
            skill: goalSkill,
            level: goalLevel,
            duration_weeks: goalWeeks,
            goal_id: goalId,
          }),
        }
      );
      if (!resp.ok) throw new Error("Failed to generate");
      toast.success("AI đã tạo roadmap thành công!");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    } catch {
      toast.error("Lỗi tạo roadmap AI");
    } finally {
      setGeneratingId(null);
    }
  };

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("goals").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Đã xóa mục tiêu");
    },
  });

  const getRoadmapContent = (goal: any): RoadmapContent | null => {
    const roadmaps = goal.roadmaps;
    if (!roadmaps) return null;
    // Handle both array and object (unique constraint makes it an object)
    const roadmap = Array.isArray(roadmaps) ? roadmaps[0] : roadmaps;
    if (!roadmap?.content) return null;
    const c = roadmap.content;
    if (typeof c === "object" && c.milestones) return c as RoadmapContent;
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-mesh fixed inset-0 pointer-events-none" />
      <Navbar />
      <main className="relative z-10 pt-20 pb-8 px-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Map className="w-6 h-6 text-primary" />
              Lộ trình học / Roadmap
            </h1>
            <p className="text-sm text-muted-foreground mt-1">AI tự động tạo roadmap chi tiết với milestones, KPIs & risk analysis</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all neon-glow"
          >
            <Plus className="w-4 h-4" />
            Thêm mới
          </button>
        </div>

        {/* Create form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="glass-hover p-5 mb-6">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Tạo mục tiêu mới — AI sẽ tự tạo roadmap
                </h3>
                <div className="space-y-3">
                  <input
                    placeholder="Kỹ năng muốn học (e.g. React, Python, Machine Learning)"
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
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2 neon-glow"
                  >
                    {createGoal.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Sparkles className="w-4 h-4" />
                    Tạo & AI Generate Roadmap
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Goals list */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : goals && goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map((g, i) => {
              const roadmap = getRoadmapContent(g);
              const isExpanded = expandedGoal === g.id;
              const isGenerating = generatingId === g.id;

              return (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-hover overflow-hidden"
                >
                  {/* Goal header */}
                  <div
                    className="p-5 flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpandedGoal(isExpanded ? null : g.id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-foreground">{g.skill}</h3>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-secondary">{g.level}</span> · {g.duration_weeks}w
                        {roadmap && ` · ${roadmap.milestones.length} milestones`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!roadmap && !isGenerating && (
                        <button
                          onClick={(e) => { e.stopPropagation(); generateRoadmap(g.id, g.skill, g.level, g.duration_weeks); }}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" /> Generate
                        </button>
                      )}
                      {isGenerating && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteGoal.mutate(g.id); }}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded roadmap detail */}
                  <AnimatePresence>
                    {isExpanded && roadmap && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 space-y-4 border-t border-border/50 pt-4">
                          {/* Goal & Outcome */}
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="bg-muted/20 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Target className="w-4 h-4 text-primary" />
                                <span className="text-xs font-medium text-primary uppercase tracking-wider">Goal</span>
                              </div>
                              <p className="text-sm text-foreground">{roadmap.goal}</p>
                            </div>
                            <div className="bg-muted/20 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-4 h-4 text-secondary" />
                                <span className="text-xs font-medium text-secondary uppercase tracking-wider">Outcome</span>
                              </div>
                              <p className="text-sm text-foreground">{roadmap.outcome}</p>
                            </div>
                          </div>

                          {/* Milestones timeline */}
                          <div>
                            <h4 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-accent" />
                              Milestones
                            </h4>
                            <div className="space-y-3">
                              {roadmap.milestones.map((m, mi) => (
                                <div key={m.id || mi} className="relative pl-6 border-l-2 border-primary/20 ml-2">
                                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                  </div>
                                  <div className="bg-muted/15 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="font-display font-semibold text-foreground text-sm">{m.title}</h5>
                                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Week {m.week_start}–{m.week_end}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3">{m.description}</p>

                                    {/* KPIs */}
                                    {m.kpis?.length > 0 && (
                                      <div className="mb-2">
                                        <span className="text-[10px] uppercase tracking-wider text-accent font-medium">KPIs</span>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                          {m.kpis.map((k, ki) => (
                                            <span key={ki} className="text-[11px] bg-accent/10 text-accent px-2 py-0.5 rounded-md">{k}</span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Tasks */}
                                    {m.tasks?.length > 0 && (
                                      <div className="mb-2">
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Tasks</span>
                                        <ul className="mt-1 space-y-1">
                                          {m.tasks.map((t, ti) => (
                                            <li key={ti} className="text-xs text-foreground flex items-start gap-2">
                                              <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-1.5 flex-shrink-0" />
                                              {t}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Resources */}
                                    {m.resources?.length > 0 && (
                                      <div>
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Resources</span>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                          {m.resources.map((r, ri) => (
                                            <span key={ri} className="text-[11px] bg-muted/30 text-muted-foreground px-2 py-0.5 rounded-md flex items-center gap-1">
                                              <Link2 className="w-3 h-3" />{r}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Risks */}
                          {roadmap.risks?.length > 0 && (
                            <div>
                              <h4 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-destructive" />
                                Risk Analysis
                              </h4>
                              <div className="grid sm:grid-cols-2 gap-2">
                                {roadmap.risks.map((r, ri) => (
                                  <div key={ri} className="bg-destructive/5 border border-destructive/10 rounded-xl p-3">
                                    <p className="text-xs font-medium text-destructive mb-1">{r.risk}</p>
                                    <p className="text-xs text-muted-foreground">{r.mitigation}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Re-generate */}
                          <button
                            onClick={() => generateRoadmap(g.id, g.skill, g.level, g.duration_weeks)}
                            disabled={isGenerating}
                            className="w-full py-2.5 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center justify-center gap-2"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Tạo lại roadmap / Regenerate
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Map className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Chưa có mục tiêu nào. Tạo mới để AI generate roadmap!</p>
          </div>
        )}
      </main>
    </div>
  );
}
