import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  trend?: number;
  color: string;
  delay?: number;
}

const AnimatedCounter = ({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}{typeof value === "number" && value % 1 !== 0 ? count.toFixed(2) : count.toLocaleString()}{suffix}
    </span>
  );
};

const StatCard = ({ title, value, prefix, suffix, icon: Icon, trend, color, delay = 0 }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -4, scale: 1.02 }}
    className="relative group overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-md p-6 shadow-sm hover:shadow-xl transition-shadow duration-300"
  >
    <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-150 duration-500" style={{ background: color }} />
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 rounded-xl shadow-sm" style={{ background: `${color}20` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      {trend !== undefined && (
        <span className={cn("text-xs font-semibold px-2 py-1 rounded-full", trend >= 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400")}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="text-3xl font-bold text-foreground font-display">
      <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
    </div>
    <p className="text-sm text-muted-foreground mt-1">{title}</p>
  </motion.div>
);

export default StatCard;
