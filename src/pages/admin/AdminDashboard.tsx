import { ShoppingCart, Users, PoundSterling, Clock, TrendingUp, Package } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import StatCard from "@/components/admin/StatCard";
import { useAdminDashboardStats } from "@/hooks/useAdminDashboard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const COLORS = ["hsl(340,82%,52%)", "hsl(200,80%,50%)", "hsl(150,60%,45%)", "hsl(40,90%,55%)", "hsl(280,60%,55%)"];

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  unpaid: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const AdminDashboard = () => {
  const { data: stats, isLoading } = useAdminDashboardStats();

  const monthlyData = stats?.monthly_orders || [];
  const recentOrders = stats?.recent_orders || [];

  const pieData = [
    { name: "Completed", value: (stats?.total_orders || 0) - (stats?.pending_orders || 0) },
    { name: "Pending", value: stats?.pending_orders || 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Here's what's happening today.</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Orders" value={stats?.total_orders || 0} icon={ShoppingCart} trend={12} color="hsl(340,82%,52%)" delay={0} />
        <StatCard title="Total Revenue" value={stats?.total_revenue || 0} prefix="£" icon={PoundSterling} trend={8} color="hsl(150,60%,45%)" delay={0.1} />
        <StatCard title="Registered Members" value={stats?.total_members || 0} icon={Users} trend={5} color="hsl(200,80%,50%)" delay={0.2} />
        <StatCard title="Pending Orders" value={stats?.pending_orders || 0} icon={Clock} color="hsl(40,90%,55%)" delay={0.3} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 rounded-2xl border border-border bg-card/60 backdrop-blur-md p-6"
        >
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">Revenue Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `£${v}`} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "13px",
                }}
                formatter={(value: number) => [`£${value.toFixed(2)}`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="hsl(340,82%,52%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-6"
        >
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">Order Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                {entry.name}: {entry.value}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Monthly Orders Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-6"
      >
        <h3 className="text-lg font-display font-semibold text-foreground mb-4">Monthly Orders Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
            <Line type="monotone" dataKey="count" stroke="hsl(200,80%,50%)" strokeWidth={3} dot={{ fill: "hsl(200,80%,50%)", r: 5 }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-6"
      >
        <h3 className="text-lg font-display font-semibold text-foreground mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Total</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Payment</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, i) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.05 }}
                  className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                >
                  <td className="py-3">
                    <div className="font-medium text-foreground">{order.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                  </td>
                  <td className="py-3 font-semibold text-foreground">£{Number(order.total).toFixed(2)}</td>
                  <td className="py-3">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusColor[order.status] || "")}>{order.status}</span>
                  </td>
                  <td className="py-3">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusColor[order.payment_status] || "")}>{order.payment_status}</span>
                  </td>
                  <td className="py-3 text-muted-foreground">{new Date(order.created_at).toLocaleDateString("en-GB")}</td>
                </motion.tr>
              ))}
              {recentOrders.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
