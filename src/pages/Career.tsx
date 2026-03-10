import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Plus, X, Sparkles, TrendingUp, Target, ArrowRight, Loader2, Star, Zap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";

interface CareerResult {
  title: string;
  match_score: number;
  description: string;
  why_fit: string;
  key_skills: string[];
  growth_outlook: string;
  salary_range: string;
  next_steps: string[];
}

interface AnalysisResult {
  careers: CareerResult[];
  skill_gaps: string[];
  summary: string;
}

const EXPERIENCE_LEVELS = [
  { value: "student", label: "🎓 Sinh viên" },
  { value: "beginner", label: "🌱 Mới bắt đầu" },
  { value: "intermediate", label: "⚡ Có kinh nghiệm" },
  { value: "advanced", label: "🚀 Chuyên gia" },
];

const SUGGESTED_SKILLS = ["JavaScript", "Python", "React", "Design", "Data Analysis", "Marketing", "Communication", "Leadership", "AI/ML", "Cloud", "Mobile Dev", "DevOps"];
const SUGGESTED_INTERESTS = ["Technology", "Creative Arts", "Business", "Healthcare", "Education", "Finance", "Gaming", "Social Impact", "Research", "Startup"];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } }),
};

export default function Career() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("student");
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setSkillInput("");
  };

  const addInterest = (interest: string) => {
    const i = interest.trim();
    if (i && !interests.includes(i)) setInterests([...interests, i]);
    setInterestInput("");
  };

  const analyze = async () => {
    if (skills.length === 0) {
      toast({ title: "Vui lòng thêm ít nhất 1 kỹ năng", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ skills, interests, experience_level: experienceLevel }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Không thể phân tích");
      }

      const data = await resp.json();
      setResult(data);
    } catch (e: any) {
      toast({ title: "Lỗi", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-secondary";
    return "text-accent";
  };

  const getGrowthBadge = (outlook: string) => {
    const lower = outlook.toLowerCase();
    if (lower.includes("high")) return "bg-primary/20 text-primary";
    if (lower.includes("medium")) return "bg-secondary/20 text-secondary";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-mesh fixed inset-0 pointer-events-none" />
      <Navbar />
      <main className="relative z-10 pt-20 pb-8 px-4 md:px-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-secondary" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Career <span className="gradient-text">Recommendation</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">AI phân tích skills của bạn và đề xuất career path phù hợp nhất</p>
        </motion.div>

        {!result ? (
          <div className="space-y-6">
            {/* Skills Input */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="glass-hover p-5 md:p-6">
              <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Kỹ năng của bạn
              </h2>
              <div className="flex gap-2 mb-3">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill(skillInput)}
                  placeholder="Nhập kỹ năng..."
                  className="bg-muted/20 border-border/50"
                />
                <Button onClick={() => addSkill(skillInput)} size="icon" variant="outline" className="shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1 bg-primary/15 text-primary border-primary/30">
                    {s}
                    <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => setSkills(skills.filter((x) => x !== s))} />
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).map((s) => (
                  <button key={s} onClick={() => addSkill(s)} className="text-xs px-2.5 py-1 rounded-full bg-muted/30 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                    + {s}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Interests Input */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} className="glass-hover p-5 md:p-6">
              <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-secondary" /> Sở thích & Lĩnh vực quan tâm
              </h2>
              <div className="flex gap-2 mb-3">
                <Input
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addInterest(interestInput)}
                  placeholder="Nhập sở thích..."
                  className="bg-muted/20 border-border/50"
                />
                <Button onClick={() => addInterest(interestInput)} size="icon" variant="outline" className="shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {interests.map((i) => (
                  <Badge key={i} variant="secondary" className="gap-1 bg-secondary/15 text-secondary border-secondary/30">
                    {i}
                    <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => setInterests(interests.filter((x) => x !== i))} />
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_INTERESTS.filter((i) => !interests.includes(i)).map((i) => (
                  <button key={i} onClick={() => addInterest(i)} className="text-xs px-2.5 py-1 rounded-full bg-muted/30 text-muted-foreground hover:bg-secondary/10 hover:text-secondary transition-colors">
                    + {i}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Experience Level */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} className="glass-hover p-5 md:p-6">
              <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" /> Trình độ hiện tại
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <button
                    key={lvl.value}
                    onClick={() => setExperienceLevel(lvl.value)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all border ${
                      experienceLevel === lvl.value
                        ? "bg-primary/15 border-primary/50 text-primary"
                        : "bg-muted/20 border-border/30 text-muted-foreground hover:border-border/60"
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Analyze Button */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
              <Button
                onClick={analyze}
                disabled={loading || skills.length === 0}
                className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Phân tích Career Path
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Back button */}
            <Button variant="outline" onClick={() => setResult(null)} className="gap-2">
              <ArrowRight className="w-4 h-4 rotate-180" /> Phân tích lại
            </Button>

            {/* Summary */}
            {result.summary && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="glass-hover p-5 md:p-6">
                <h2 className="font-display font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Tổng quan
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
              </motion.div>
            )}

            {/* Career Cards */}
            <div className="space-y-4">
              {result.careers?.map((career, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={i + 1}
                  className="glass-hover p-5 md:p-6 card-shine"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display text-lg font-bold text-foreground">{career.title}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{career.description}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className={`font-display text-2xl font-bold ${getScoreColor(career.match_score)}`}>
                        {career.match_score}%
                      </p>
                      <p className="text-xs text-muted-foreground">match</p>
                    </div>
                  </div>

                  <div className="mb-3 p-3 rounded-lg bg-muted/20">
                    <p className="text-sm text-foreground">{career.why_fit}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {career.key_skills?.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs border-border/50">
                        {skill}
                      </Badge>
                    ))}
                    <Badge className={`text-xs ${getGrowthBadge(career.growth_outlook)}`}>
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {career.growth_outlook}
                    </Badge>
                  </div>

                  {career.salary_range && (
                    <p className="text-xs text-muted-foreground mb-3">💰 {career.salary_range}</p>
                  )}

                  {career.next_steps?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Bước tiếp theo:</p>
                      <div className="space-y-1">
                        {career.next_steps.map((step, j) => (
                          <div key={j} className="flex items-start gap-2 text-sm text-foreground">
                            <span className="text-primary mt-0.5">→</span> {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Skill Gaps */}
            {result.skill_gaps?.length > 0 && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={6} className="glass-hover p-5 md:p-6">
                <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent" /> Kỹ năng cần bổ sung
                </h2>
                <div className="flex flex-wrap gap-2">
                  {result.skill_gaps.map((gap) => (
                    <Badge key={gap} className="bg-accent/15 text-accent border-accent/30">{gap}</Badge>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
