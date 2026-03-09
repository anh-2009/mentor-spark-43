import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { BarChart3, TrendingUp, Loader2 } from "lucide-react";

interface TaskItem {
  id: string;
  task: string;
  status: string;
  task_date: string;
  notes: string | null;
  sort_order: number;
  goal_id: string | null;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const BAR_COLORS = [
  "hsl(187, 100%, 50%)",
  "hsl(210, 100%, 60%)",
  "hsl(240, 80%, 65%)",
  "hsl(270, 80%, 60%)",
  "hsl(300, 70%, 55%)",
  "hsl(187, 80%, 40%)",
  "hsl(220, 90%, 55%)",
];

interface BarAnalyticsProps {
  tasks: TaskItem[];
  isLoading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export default function BarAnalytics({ tasks, isLoading, error, onRetry }: BarAnalyticsProps) {
  const data = useMemo(() => {
    const counts = Array(7).fill(0);
    tasks.forEach((t) => {
      const d = new Date(t.task_date);
      const dow = d.getDay();
      const idx = dow === 0 ? 6 : dow - 1;
      counts[idx]++;
    });
    return DAY_LABELS.map((name, i) => ({ name, tasks: counts[i] }));
  }, [tasks]);

  const maxTasks = Math.max(...data.map(d => d.tasks), 0);
  const totalTasks = data.reduce((sum, d) => sum + d.tasks, 0);
  const busiestDay = data.reduce((max, d) => d.tasks > max.tasks ? d : max, data[0]);

  // Loading state
  if (isLoading) {
    return (
      <div className="glass p-5 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="skeleton w-5 h-5 rounded" />
          <div className="skeleton w-40 h-4" />
        </div>
        <div className="skeleton w-56 h-3 mb-6" />
        <div className="flex items-end gap-3 h-[220px] px-4">
          {[40, 65, 80, 55, 90, 35, 50].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-2">
              <div className="skeleton rounded-t-md" style={{ height: `${h}%` }} />
              <div className="skeleton w-8 h-3 mx-auto" />
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
          <BarChart3 className="w-6 h-6 text-destructive" />
        </div>
        <p className="text-sm text-foreground font-medium mb-1">Không thể tải dữ liệu</p>
        <p className="text-xs text-muted-foreground mb-4">Đã xảy ra lỗi khi tải biểu đồ</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors btn-ripple"
          >
            Thử lại
          </button>
        )}
      </motion.div>
    );
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-2xl text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-7 h-7 text-primary/50" />
        </div>
        <p className="text-sm text-foreground font-medium mb-1">Chưa có dữ liệu</p>
        <p className="text-xs text-muted-foreground">Thêm tasks vào Schedule để xem biểu đồ năng suất</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass p-5 rounded-2xl"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Weekly Productivity</h3>
        </div>
        {busiestDay && busiestDay.tasks > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-success/10">
            <TrendingUp className="w-3 h-3 text-success" />
            <span className="text-[10px] text-success font-medium">{busiestDay.name} peak</span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-4 ml-10">
        {totalTasks} tasks · Phân bố theo ngày trong tuần
      </p>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 20%, 18%)" />
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
              axisLine={{ stroke: "hsl(230, 20%, 18%)" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(230, 25%, 10%)",
                border: "1px solid hsl(230, 20%, 22%)",
                borderRadius: "12px",
                fontSize: "12px",
                color: "hsl(210, 40%, 96%)",
                boxShadow: "0 4px 12px -2px hsl(0 0% 0% / 0.4)",
              }}
              formatter={(value: number) => {
                const pct = totalTasks > 0 ? ((value / totalTasks) * 100).toFixed(0) : 0;
                return [`${value} tasks (${pct}%)`, "Số tasks"];
              }}
              cursor={{ fill: "hsl(187, 100%, 50%, 0.06)" }}
            />
            <Bar dataKey="tasks" radius={[6, 6, 0, 0]} animationDuration={800}>
              {data.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
