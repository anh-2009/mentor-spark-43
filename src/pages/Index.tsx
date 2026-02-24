import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Sparkles, Map, CalendarDays, MessageSquare, ArrowRight } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  { icon: MessageSquare, title: "AI Mentor Chat", titleVi: "Trò chuyện AI", desc: "Chat với AI mentor hiểu cảm xúc của bạn" },
  { icon: Map, title: "Study Roadmap", titleVi: "Lộ trình học", desc: "Tạo roadmap học tập tự động với AI" },
  { icon: CalendarDays, title: "Daily Schedule", titleVi: "Lịch học hàng ngày", desc: "Quản lý task và thời gian biểu" },
  { icon: Sparkles, title: "Progress Tracking", titleVi: "Theo dõi tiến độ", desc: "Streak, thống kê, động lực mỗi ngày" },
];

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen animated-gradient-bg relative overflow-hidden">
      <ParticleBackground />

      <div className="relative z-10">
        {/* Hero */}
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 neon-glow mb-6">
              <Brain className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-4">
              <span className="gradient-text">NeuroPlan</span>
              <span className="text-foreground"> AI</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-2">
              AI-Powered Study Planner for Gen Z
            </p>
            <p className="text-base text-muted-foreground max-w-xl mx-auto mb-8">
              Trợ lý AI thông minh giúp bạn lên kế hoạch học tập, theo dõi tiến độ, và giữ động lực mỗi ngày ✨
            </p>
            <Link
              to={user ? "/dashboard" : "/auth"}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-all neon-glow group"
            >
              {user ? "Vào Dashboard" : "Bắt đầu ngay / Get Started"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Features */}
        <div className="max-w-6xl mx-auto px-4 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass p-6 hover:border-primary/30 transition-all group"
              >
                <f.icon className="w-8 h-8 text-primary mb-3 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)] transition-all" />
                <h3 className="font-display font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-xs text-secondary font-medium mb-1">{f.titleVi}</p>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
