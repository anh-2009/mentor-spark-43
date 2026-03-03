import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { BarChart3 } from "lucide-react";

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
  "hsl(187, 100%, 50%)",  // cyan
  "hsl(210, 100%, 60%)",  // blue
  "hsl(240, 80%, 65%)",   // indigo
  "hsl(270, 80%, 60%)",   // purple
  "hsl(300, 70%, 55%)",   // magenta
  "hsl(187, 80%, 40%)",   // teal
  "hsl(220, 90%, 55%)",   // royal blue
];

export default function BarAnalytics({ tasks }: { tasks: TaskItem[] }) {
  const data = useMemo(() => {
    const counts = Array(7).fill(0);
    tasks.forEach((t) => {
      const d = new Date(t.task_date);
      const dow = d.getDay(); // 0=Sun
      const idx = dow === 0 ? 6 : dow - 1; // Mon=0
      counts[idx]++;
    });
    return DAY_LABELS.map((name, i) => ({ name, tasks: counts[i] }));
  }, [tasks]);

  if (tasks.length === 0) {
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
      transition={{ duration: 0.5 }}
      className="glass p-5 rounded-2xl"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Weekly Productivity Analytics</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Số lượng tasks theo từng ngày trong tuần</p>
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
                border: "1px solid hsl(230, 20%, 18%)",
                borderRadius: "12px",
                fontSize: "12px",
                color: "hsl(210, 40%, 96%)",
              }}
              formatter={(value: number) => [`${value} tasks`, "Số tasks"]}
              cursor={{ fill: "hsl(187, 100%, 50%, 0.08)" }}
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
