import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { PieChart as PieIcon, TrendingUp } from "lucide-react";

interface TaskItem {
  id: string;
  task: string;
  status: string;
  task_date: string;
  notes: string | null;
  sort_order: number;
  goal_id: string | null;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Học tập": ["học", "study", "learn", "read", "đọc", "ôn", "review", "bài", "lesson", "course"],
  "Kỹ năng": ["skill", "kỹ năng", "practice", "luyện", "code", "coding", "dev", "design", "write"],
  "Dự án": ["project", "dự án", "build", "tạo", "deploy", "ship", "launch", "feature"],
  "Thể thao": ["gym", "run", "chạy", "sport", "thể thao", "workout", "exercise", "tập"],
};

const COLORS = [
  "hsl(210, 100%, 60%)",
  "hsl(270, 80%, 60%)",
  "hsl(187, 100%, 50%)",
  "hsl(150, 70%, 50%)",
  "hsl(240, 60%, 50%)",
];

const ALL_CATEGORIES = ["Học tập", "Kỹ năng", "Dự án", "Thể thao", "Khác"];

function categorize(task: string): string {
  const lower = task.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "Khác";
}

const RADIAN = Math.PI / 180;
function renderLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="hsl(210, 40%, 96%)" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

interface PieAnalyticsProps {
  tasks: TaskItem[];
  isLoading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export default function PieAnalytics({ tasks, isLoading, error, onRetry }: PieAnalyticsProps) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      const cat = categorize(t.task);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return ALL_CATEGORIES
      .map((name) => ({ name, value: counts[name] || 0 }))
      .filter((d) => d.value > 0);
  }, [tasks]);

  const topCategory = data.length > 0
    ? data.reduce((max, d) => d.value > max.value ? d : max, data[0])
    : null;

  // Loading state
  if (isLoading) {
    return (
      <div className="glass p-5 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="skeleton w-5 h-5 rounded" />
          <div className="skeleton w-44 h-4" />
        </div>
        <div className="skeleton w-48 h-3 mb-6" />
        <div className="flex justify-center">
          <div className="skeleton w-[190px] h-[190px] rounded-full" />
        </div>
        <div className="flex justify-center gap-4 mt-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="skeleton w-2 h-2 rounded-full" />
              <div className="skeleton w-12 h-3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-2xl text-center"
      >
        <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-3">
          <PieIcon className="w-6 h-6 text-destructive" />
        </div>
        <p className="text-sm text-foreground font-medium mb-1">Không thể tải dữ liệu</p>
        <p className="text-xs text-muted-foreground mb-4">Đã xảy ra lỗi khi tải biểu đồ</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-secondary/10 text-secondary text-xs font-medium hover:bg-secondary/20 transition-colors btn-ripple"
          >
            Thử lại
          </button>
        )}
      </motion.div>
    );
  }

  // Empty state
  if (tasks.length === 0 || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-2xl text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
          <PieIcon className="w-7 h-7 text-secondary/50" />
        </div>
        <p className="text-sm text-foreground font-medium mb-1">Chưa có dữ liệu</p>
        <p className="text-xs text-muted-foreground">Thêm tasks để xem phân bổ thời gian</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass p-5 rounded-2xl"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
            <PieIcon className="w-4 h-4 text-secondary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Time Distribution</h3>
        </div>
        {topCategory && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/10">
            <TrendingUp className="w-3 h-3 text-secondary" />
            <span className="text-[10px] text-secondary font-medium">Top: {topCategory.name}</span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-4 ml-10">Tỷ lệ phân bổ tasks theo lĩnh vực</p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              label={renderLabel}
              labelLine={false}
              animationDuration={800}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={COLORS[ALL_CATEGORIES.indexOf(entry.name) % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(230, 25%, 10%)",
                border: "1px solid hsl(230, 20%, 22%)",
                borderRadius: "12px",
                fontSize: "12px",
                color: "hsl(210, 40%, 96%)",
                boxShadow: "0 4px 12px -2px hsl(0 0% 0% / 0.4)",
              }}
              formatter={(value: number, name: string) => {
                const total = data.reduce((s, d) => s + d.value, 0);
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return [`${value} tasks (${pct}%)`, name];
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ color: "hsl(215, 20%, 55%)", fontSize: "11px" }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
