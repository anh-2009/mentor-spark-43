import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Brain, Sparkles, Map, CalendarDays, MessageSquare, ArrowRight,
  Zap, Shield, BarChart3, Layers, ChevronRight, Star,
  BookOpen, Clock, Target, Rocket
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRef } from "react";

const features = [
  {
    icon: MessageSquare,
    title: "AI Mentor Chat",
    desc: "Chat thông minh nhận diện cảm xúc, đưa lời khuyên phù hợp tâm trạng của bạn",
    gradient: "from-primary/20 to-primary/5",
    iconColor: "text-primary",
  },
  {
    icon: Map,
    title: "Auto Roadmap",
    desc: "AI tự động tạo lộ trình học tập với milestone, KPI và deadline rõ ràng",
    gradient: "from-secondary/20 to-secondary/5",
    iconColor: "text-secondary",
  },
  {
    icon: CalendarDays,
    title: "Smart Schedule",
    desc: "Quản lý thời gian biểu thông minh, đồng bộ roadmap và task hàng ngày",
    gradient: "from-accent/20 to-accent/5",
    iconColor: "text-accent",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    desc: "Streak, thống kê chi tiết và insight giúp bạn duy trì động lực mỗi ngày",
    gradient: "from-primary/20 to-accent/5",
    iconColor: "text-primary",
  },
];

const stats = [
  { value: "10K+", label: "Students" },
  { value: "500K+", label: "Tasks Done" },
  { value: "99%", label: "Uptime" },
  { value: "4.9★", label: "Rating" },
];

const steps = [
  { num: "01", icon: Target, title: "Đặt mục tiêu", desc: "Chọn skill muốn học và level mong muốn" },
  { num: "02", icon: Rocket, title: "AI tạo roadmap", desc: "AI phân tích và tạo lộ trình cá nhân hóa" },
  { num: "03", icon: Clock, title: "Học mỗi ngày", desc: "Theo dõi schedule và hoàn thành task" },
  { num: "04", icon: Star, title: "Đạt mục tiêu", desc: "Track progress và celebrate thành tích" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function Index() {
  const { user } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Gradient mesh bg */}
      <div className="gradient-mesh fixed inset-0 pointer-events-none" />
      <div className="grid-pattern fixed inset-0 pointer-events-none opacity-30" />

      {/* ====== NAVBAR ====== */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">NeuroPlan</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Stats</a>
          </div>
          <Link
            to={user ? "/dashboard" : "/auth"}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all neon-glow-subtle"
          >
            {user ? "Dashboard" : "Get Started"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* ====== HERO ====== */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Orbiting elements */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-[500px] h-[500px] md:w-[600px] md:h-[600px]">
            {[BookOpen, Zap, Shield, Layers].map((Icon, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 animate-orbit"
                style={{
                  animationDelay: `${i * -5}s`,
                  animationDuration: `${20 + i * 4}s`,
                }}
              >
                <div className="glass p-3 rounded-xl opacity-40">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-4xl mx-auto px-6 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary animate-glow-pulse" />
            <span className="text-xs font-medium text-primary">AI-Powered Study Platform</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 text-balance"
          >
            <span className="text-foreground">Study Smarter</span>
            <br />
            <span className="gradient-text">with AI</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Trợ lý AI thông minh giúp bạn tạo lộ trình học tập, quản lý thời gian
            và duy trì động lực mỗi ngày. Được thiết kế cho Gen Z.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to={user ? "/dashboard" : "/auth"}
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-all neon-glow"
            >
              {user ? "Vào Dashboard" : "Bắt đầu miễn phí"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl glass text-foreground font-medium text-base hover:bg-card/80 transition-all"
            >
              Khám phá tính năng
              <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Mockup preview */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-16 md:mt-20 relative mx-auto max-w-3xl"
          >
            <div className="absolute -inset-4 bg-gradient-to-b from-primary/10 via-secondary/5 to-transparent rounded-3xl blur-2xl" />
            <div className="relative glass-strong rounded-2xl p-1 glow-line">
              <div className="rounded-xl bg-card overflow-hidden">
                {/* Mock browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-secondary/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/40" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground">neuroplan.ai/dashboard</div>
                  </div>
                </div>
                {/* Mock dashboard content */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-4 w-32 bg-muted/50 rounded shimmer" />
                      <div className="h-3 w-48 bg-muted/30 rounded mt-2 shimmer" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-20 bg-primary/20 rounded-lg" />
                      <div className="h-8 w-20 bg-secondary/20 rounded-lg" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="glass p-4 rounded-xl">
                        <div className="h-3 w-12 bg-primary/30 rounded mb-2" />
                        <div className="h-6 w-16 bg-muted/50 rounded shimmer" />
                      </div>
                    ))}
                  </div>
                  <div className="glass p-4 rounded-xl space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary/60" />
                        <div className="h-3 flex-1 bg-muted/40 rounded shimmer" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Spotlight */}
        <div className="spotlight absolute inset-0 pointer-events-none" />
      </section>

      {/* ====== STATS ====== */}
      <section id="stats" className="py-20 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((s, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="text-center"
              >
                <p className="font-display text-3xl md:text-4xl font-bold gradient-text">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section id="features" className="py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-xs font-medium text-primary uppercase tracking-widest">Features</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              Everything you need to <span className="gradient-text">excel</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Tất cả công cụ bạn cần để học tập hiệu quả, được tích hợp trong một nền tảng duy nhất.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 gap-5"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="glass-hover card-shine p-7 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className={`w-6 h-6 ${f.iconColor}`} />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section id="how-it-works" className="py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-xs font-medium text-secondary uppercase tracking-widest">How it works</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              4 bước đơn giản
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Từ mục tiêu đến thành tích — AI đồng hành cùng bạn ở mỗi bước.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {steps.map((s, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="relative glass-hover p-6 text-center group"
              >
                <span className="font-display text-5xl font-bold text-muted/50 group-hover:text-primary/20 transition-colors">{s.num}</span>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto my-4 group-hover:bg-primary/20 transition-colors">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-32 relative z-10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6 relative">
              Ready to <span className="gradient-text">level up</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto">
              Tham gia cùng hàng nghìn bạn trẻ đã cải thiện hiệu suất học tập với NeuroPlan AI.
            </p>
            <Link
              to={user ? "/dashboard" : "/auth"}
              className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-all neon-glow relative"
            >
              {user ? "Vào Dashboard" : "Bắt đầu ngay — Miễn phí"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="border-t border-border/50 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-foreground">NeuroPlan AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 NeuroPlan AI. Built with ❤️ for Gen Z students.
          </p>
        </div>
      </footer>
    </div>
  );
}
