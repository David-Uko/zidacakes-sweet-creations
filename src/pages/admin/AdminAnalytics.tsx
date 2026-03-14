import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useAdminDashboardStats } from "@/hooks/useAdminDashboard";
import { TrendingUp, ShoppingCart, Users, PoundSterling } from "lucide-react";

const AdminAnalytics = () => {
  const { data: stats } = useAdminDashboardStats();
  const monthlyData = stats?.monthly_orders || [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Deep dive into your business performance.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <PoundSterling className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-display font-semibold text-foreground">Revenue Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(340,82%,52%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(340,82%,52%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `£${v}`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} formatter={(v: number) => [`£${v.toFixed(2)}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(340,82%,52%)" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-display font-semibold text-foreground">Orders by Month</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
              <Bar dataKey="count" fill="hsl(200,80%,50%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Avg Order Value", value: stats?.total_orders ? `£${((stats.total_revenue || 0) / stats.total_orders).toFixed(2)}` : "£0", icon: TrendingUp },
          { label: "Custom Orders", value: stats?.total_custom_orders || 0, icon: ShoppingCart },
          { label: "User Base", value: stats?.total_members || 0, icon: Users },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-6 flex items-center gap-4"
          >
            <div className="p-3 rounded-xl bg-primary/10">
              <item.icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-foreground">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminAnalytics;
