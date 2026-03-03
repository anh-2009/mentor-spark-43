import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { PieChart as PieIcon } from "lucide-react";

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
  "hsl(210, 100%, 60%)",   // Học tập - blue
  "hsl(270, 80%, 60%)",    // Kỹ năng - purple
  "hsl(187, 100%, 50%)",   // Dự án - cyan
  "hsl(150, 70%, 50%)",    // Thể thao - green
  "hsl(240, 60%, 50%)",    // Khác - indigo
];

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
    <text x={x} y={y} fill="hsl(210, 40%, 96%)" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function PieAnalytics({ tasks }: { tasks: TaskItem[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      const cat = categorize(t.task);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const categories = ["Học tập", "Kỹ năng", "Dự án", "Thể thao", "Khác"];
    return categories
      .map((name) => ({ name, value: counts[name] || 0 }))
      .filter((d) => d.value > 0);
  }, [tasks]);

  if (tasks.length === 0 || data.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        Chưa có dữ liệu tasks để hiển thị
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass p-5 rounded-2xl"
    >
      <div className="flex items-center gap-2 mb-4">
        <PieIcon className="w-5 h-5 text-secondary" />
        <h3 className="text-sm font-semibold text-foreground">Time Distribution Overview</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Tỷ lệ phân bổ tasks theo lĩnh vực</p>
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
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[["Học tập", "Kỹ năng", "Dự án", "Thể thao", "Khác"].indexOf(data[i]?.name ?? "Khác") % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(230, 25%, 10%)",
                border: "1px solid hsl(230, 20%, 18%)",
                borderRadius: "12px",
                fontSize: "12px",
                color: "hsl(210, 40%, 96%)",
              }}
              formatter={(value: number, name: string) => [`${value} tasks`, name]}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ color: "hsl(215, 20%, 55%)", fontSize: "12px" }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
